// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
// Import the Chainlink Keepers interface
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";

contract AskPlatform is Ownable, KeeperCompatibleInterface {
    using SafeERC20 for IERC20;

    IERC20 public askToken;
    uint256 public constant REWARD_DURATION = 5 minutes;

    // Store question IDs to allow iteration
    string[] public questionIds;

    struct Question {
        string dbId;          // Database ID for the question
        address asker;
        uint256 reward;
        uint256 timestamp;
        bool rewarded;
        string bestAnswerDbId;  // Best answer's DB ID
        string subject;         // e.g., Physics, Maths, Computer Science
    }

    struct Answer {
        string ansDbId;       // Database ID for the answer
        address responder;
        string contentCID;    // CID from Pinata/IPFS
        uint256 upvotes;
    }

    // Mappings to track questions, answers, and their existence
    mapping(string => Question) public questions;
    mapping(string => Answer[]) public questionAnswers;
    mapping(string => bool) public questionExists;
    mapping(string => bool) public questionRewarded;
    mapping(string => mapping(string => bool)) public answerExists;

    event QuestionAsked(string indexed dbId, address indexed asker, uint256 reward);
    event AnswerSubmitted(string indexed dbId, string ansDbId, address indexed responder);
    event AnswerUpvoted(string indexed dbId, string indexed ansDbId, address voter);
    event RewardDistributed(string indexed dbId, string indexed bestAnswerDbId, address winner, uint256 amount);

    constructor(address _askToken) Ownable(msg.sender) {
        askToken = IERC20(_askToken);
    }

    /// @notice Post a new question by providing a unique database ID, subject, and reward amount (in ASK tokens).
    function askQuestion(string memory _dbId, string memory _subject, uint256 _reward) external {
        require(_reward > 0, "Reward must be positive");
        require(!questionExists[_dbId], "Question ID already exists");
        
        // User must have approved the token transfer beforehand.
        askToken.safeTransferFrom(msg.sender, address(this), _reward);

        questions[_dbId] = Question({
            dbId: _dbId,
            asker: msg.sender,
            reward: _reward,
            timestamp: block.timestamp,
            rewarded: false,
            bestAnswerDbId: "",
            subject: _subject
        });

        questionExists[_dbId] = true;
        questionRewarded[_dbId] = false;
        questionIds.push(_dbId);  // Save the question ID for later iteration

        emit QuestionAsked(_dbId, msg.sender, _reward);
    }

    /// @notice Submit an answer for a given question.
    function submitAnswer(string memory _dbId, string memory _ansDbId, string memory _contentCID) external {
        require(questionExists[_dbId], "Question doesn't exist");
        require(!questionRewarded[_dbId], "Question already rewarded");
        require(!answerExists[_dbId][_ansDbId], "Answer ID already exists for this question");
        
        questionAnswers[_dbId].push(Answer({
            ansDbId: _ansDbId,
            responder: msg.sender,
            contentCID: _contentCID,
            upvotes: 0
        }));
        
        answerExists[_dbId][_ansDbId] = true;
        emit AnswerSubmitted(_dbId, _ansDbId, msg.sender);
    }

    /// @notice Upvote an answer for a question.
    function upvoteAnswer(string memory _dbId, string memory _ansDbId) external {
        require(questionExists[_dbId], "Question doesn't exist");
        require(!questionRewarded[_dbId], "Question already rewarded");
        require(answerExists[_dbId][_ansDbId], "Answer doesn't exist");
        
        // Locate the answer in the array
        bool found = false;
        uint256 answerIndex;
        Answer[] storage answers = questionAnswers[_dbId];
        for (uint256 i = 0; i < answers.length; i++) {
            if (keccak256(abi.encodePacked(answers[i].ansDbId)) ==
                keccak256(abi.encodePacked(_ansDbId))) {
                found = true;
                answerIndex = i;
                break;
            }
        }
        require(found, "Answer not found");

        answers[answerIndex].upvotes++;
        emit AnswerUpvoted(_dbId, _ansDbId, msg.sender);
    }

    /// @notice Internal function to distribute reward for a single question.
    function _distributeReward(string memory _dbId) internal {
        Question storage question = questions[_dbId];
        // Check eligibility: not rewarded, enough time passed, and at least one answer exists.
        if (
            !questionRewarded[_dbId] &&
            block.timestamp >= question.timestamp + REWARD_DURATION &&
            questionAnswers[_dbId].length > 0
        ) {
            uint256 bestAnswerIndex = 0;
            uint256 maxVotes = questionAnswers[_dbId][0].upvotes;

            for (uint256 i = 1; i < questionAnswers[_dbId].length; i++) {
                if (questionAnswers[_dbId][i].upvotes > maxVotes) {
                    maxVotes = questionAnswers[_dbId][i].upvotes;
                    bestAnswerIndex = i;
                }
            }

            question.rewarded = true;
            questionRewarded[_dbId] = true;
            question.bestAnswerDbId = questionAnswers[_dbId][bestAnswerIndex].ansDbId;
            address winner = questionAnswers[_dbId][bestAnswerIndex].responder;
            askToken.safeTransfer(winner, question.reward);
            emit RewardDistributed(
                _dbId,
                questionAnswers[_dbId][bestAnswerIndex].ansDbId,
                winner,
                question.reward
            );
        }
    }

    /// @notice Distribute rewards for all eligible questions.
    function distributeAllRewards() public {
        uint256 len = questionIds.length;
        for (uint256 i = 0; i < len; i++) {
            string memory qId = questionIds[i];
            if (
                questionExists[qId] &&
                !questionRewarded[qId] &&
                block.timestamp >= questions[qId].timestamp + REWARD_DURATION &&
                questionAnswers[qId].length > 0
            ) {
                _distributeReward(qId);
            }
        }
    }

    /// @notice Chainlink Keepers: Check if any question is eligible for reward distribution.
    /// @return upkeepNeeded True if at least one question is eligible.
    /// @return performData Empty bytes.
    function checkUpkeep(
        bytes calldata /* _checkData */
    ) external view override returns (bool upkeepNeeded, bytes memory performData) {
        uint256 len = questionIds.length;
        for (uint256 i = 0; i < len; i++) {
            string memory qId = questionIds[i];
            if (
                questionExists[qId] &&
                !questionRewarded[qId] &&
                block.timestamp >= questions[qId].timestamp + REWARD_DURATION &&
                questionAnswers[qId].length > 0
            ) {
                upkeepNeeded = true;
                break;
            }
        }
        performData = bytes("");
    }

    /// @notice Chainlink Keepers: Call distributeAllRewards() if upkeep is needed.
    function performUpkeep(
        bytes calldata /* _performData */
    ) external override {
        distributeAllRewards();
    }

    /// @notice Get details of the best answer for a rewarded question.
    function getBestAnswer(string memory _dbId)
        external
        view
        returns (
            string memory,
            address,
            string memory,
            uint256
        )
    {
        require(questionExists[_dbId], "Question doesn't exist");
        require(questionRewarded[_dbId], "Question not rewarded yet");

        Question storage question = questions[_dbId];
        string memory bestAnswerDbId = question.bestAnswerDbId;

        bool found = false;
        uint256 answerIndex;
        Answer[] storage answers = questionAnswers[_dbId];
        for (uint256 i = 0; i < answers.length; i++) {
            if (
                keccak256(abi.encodePacked(answers[i].ansDbId)) ==
                keccak256(abi.encodePacked(bestAnswerDbId))
            ) {
                found = true;
                answerIndex = i;
                break;
            }
        }
        require(found, "Best answer not found");

        Answer storage bestAnswer = answers[answerIndex];
        return (
            bestAnswer.ansDbId,
            bestAnswer.responder,
            bestAnswer.contentCID,
            bestAnswer.upvotes
        );
    }
}