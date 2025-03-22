import { ethers } from "ethers"
import AskTokenABI from "./abi/AskTokenABI.json"
import QuestionRewardABI from "./abi/QuestionRewardABI.json"

export class Web3Service {
  private provider: ethers.BrowserProvider | null = null
  private askTokenContract: ethers.Contract | null = null
  private questionRewardContract: ethers.Contract | null = null

  private askTokenAddress = "0x..." // Replace with actual contract address
  private questionRewardAddress = "0x..." // Replace with actual contract address

  constructor() {
    this.initializeProvider()
  }

  private async initializeProvider() {
    if (typeof window !== "undefined" && window.ethereum) {
      this.provider = new ethers.BrowserProvider(window.ethereum)
    }
  }

  async connectWallet(): Promise<string | null> {
    if (!this.provider) {
      throw new Error("MetaMask is not installed")
    }

    try {
      const accounts = await this.provider.send("eth_requestAccounts", [])
      return accounts[0]
    } catch (error) {
      console.error("Error connecting wallet:", error)
      return null
    }
  }

  async registerUser(): Promise<boolean> {
    if (!this.provider) {
      throw new Error("MetaMask is not installed")
    }

    try {
      const signer = await this.provider.getSigner()
      const askToken = new ethers.Contract(this.askTokenAddress, AskTokenABI, signer)

      const registrationFee = await askToken.registrationFee()
      const tx = await askToken.register({ value: registrationFee })
      await tx.wait()

      return true
    } catch (error) {
      console.error("Error registering user:", error)
      return false
    }
  }

  async getAskTokenBalance(address: string): Promise<string> {
    if (!this.provider) {
      throw new Error("MetaMask is not installed")
    }

    try {
      const askToken = new ethers.Contract(this.askTokenAddress, AskTokenABI, this.provider)

      const balance = await askToken.balanceOf(address)
      return ethers.formatUnits(balance, 18) // Assuming 18 decimals
    } catch (error) {
      console.error("Error getting token balance:", error)
      return "0"
    }
  }

  async postQuestion(questionId: string, reward: number, duration: number): Promise<boolean> {
    if (!this.provider) {
      throw new Error("MetaMask is not installed")
    }

    try {
      const signer = await this.provider.getSigner()
      const askToken = new ethers.Contract(this.askTokenAddress, AskTokenABI, signer)
      const questionReward = new ethers.Contract(this.questionRewardAddress, QuestionRewardABI, signer)

      // Convert reward to wei (assuming 18 decimals)
      const rewardAmount = ethers.parseUnits(reward.toString(), 18)

      // Approve token transfer
      const approveTx = await askToken.approve(this.questionRewardAddress, rewardAmount)
      await approveTx.wait()

      // Post question
      const postTx = await questionReward.postQuestion(questionId, rewardAmount, duration)
      await postTx.wait()

      return true
    } catch (error) {
      console.error("Error posting question:", error)
      return false
    }
  }

  async resolveQuestion(questionId: string, winnerAddress: string): Promise<boolean> {
    if (!this.provider) {
      throw new Error("MetaMask is not installed")
    }

    try {
      const signer = await this.provider.getSigner()
      const questionReward = new ethers.Contract(this.questionRewardAddress, QuestionRewardABI, signer)

      const tx = await questionReward.resolveQuestion(questionId, winnerAddress)
      await tx.wait()

      return true
    } catch (error) {
      console.error("Error resolving question:", error)
      return false
    }
  }

  async claimRewards(): Promise<boolean> {
    if (!this.provider) {
      throw new Error("MetaMask is not installed")
    }

    try {
      const signer = await this.provider.getSigner()
      const questionReward = new ethers.Contract(this.questionRewardAddress, QuestionRewardABI, signer)

      const tx = await questionReward.claimRewards()
      await tx.wait()

      return true
    } catch (error) {
      console.error("Error claiming rewards:", error)
      return false
    }
  }
}

export const web3Service = new Web3Service()

