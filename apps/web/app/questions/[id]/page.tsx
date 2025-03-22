"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { ethers } from "ethers";
import {
  ArrowLeft,
  MessageSquare,
  ThumbsUp,
  Send,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Script from "next/script";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { askPlatformABI } from "@/lib/abis/askPlatformAbi";

// Make sure these .env variables are set
const askPlatformAddress = process.env.NEXT_PUBLIC_ASK_PLATFORM_ADDRESS || "";

export default function QuestionDetail() {
  // In Next.js 13 with App Router, you can use `useParams()`:
  const params = useParams();
  const questionId = params?.id;

  const { data: session, status } = useSession();
  const walletAddress = session?.user?.walletAddress;

  // Local states
  const [question, setQuestion] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // For new answer
  const [answerContent, setAnswerContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // For upvote
  const [showVoteDialog, setShowVoteDialog] = useState(false);
  const [voteInfo, setVoteInfo] = useState<{ ansDbId: string; isUpvote: boolean }>({
    ansDbId: "",
    isUpvote: true,
  });

  // For "Connect Wallet Required" UI
  const [showConnectWalletDialog, setShowConnectWalletDialog] = useState(false);

  // ---------------------------
  // 1. On mount, fetch question & answers
  // ---------------------------
  useEffect(() => {
    if (!questionId) return;
    fetchQuestionData(questionId);
  }, [questionId]);

  // Helper to fetch question & answers from your backend
  const fetchQuestionData = async (id: string) => {
    setIsLoading(true);
    try {
      console.log("Fetching question details for ID:", id);

      // GET /api/questions/:id
      const qResp = await fetch(`/api/questions/${id}`);
      if (!qResp.ok) {
        throw new Error(`Failed to fetch question. Status: ${qResp.status}`);
      }
      const qData = await qResp.json();
      console.log("Fetched Question JSON:", qData);
      setQuestion(qData);

      // GET /api/answers?questionId=:id
      const ansResp = await fetch(`/api/answers?questionId=${id}`);
      if (!ansResp.ok) {
        throw new Error(`Failed to fetch answers. Status: ${ansResp.status}`);
      }
      const ansData = await ansResp.json();
      console.log("Answers data from backend:", ansData);
      setAnswers(ansData);
    } catch (err: any) {
      console.error("Error fetching question or answers:", err);
      setError("Failed to load question or answers.");
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------
  // 2. Format wallet address
  // ---------------------------
  const formatWalletAddress = (addr: string) => {
    if (!addr) return "Unknown";
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  // ---------------------------
  // 3. Submit new answer
  // ---------------------------
  const handleSubmitAnswer = async () => {
    if (!answerContent.trim()) return;
    if (status !== "authenticated" || !walletAddress) {
      setShowConnectWalletDialog(true);
      return;
    }

    setIsSubmitting(true);
    try {
      console.log("Submitting answer to backend. questionId:", questionId);

      // 3a. POST to your backend to store in DB + IPFS
      const resp = await fetch(`/api/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress,
          content: answerContent,
          questionId,
        }),
      });
      if (!resp.ok) {
        const errData = await resp.json();
        throw new Error(errData.error || "Failed to submit answer");
      }
      // Suppose your backend returns { success, answerId, pinataCid, ... }
      const result = await resp.json();
      console.log("Backend answer submission result:", result);

      const { answerId, pinataCid } = result;
      if (!answerId || !pinataCid) {
        throw new Error("Backend did not return ansDbId (answerId) or contentCID (pinataCid)");
      }
      if (!question?.id) {
        throw new Error("No question.id found in local question data");
      }

      // 3b. On-chain call: submitAnswer(_dbId, _ansDbId, _contentCID)
      await onChainSubmitAnswer(question.id, answerId, pinataCid);

      // Clear local input & refresh
      setAnswerContent("");
      fetchQuestionData(questionId);
    } catch (err: any) {
      console.error("Error submitting answer:", err);
      setError(err.message || "Failed to submit your answer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3b. On-chain function
  const onChainSubmitAnswer = async (
    _dbId: string,
    _ansDbId: string,
    _contentCID: string
  ) => {
    if (!window.ethereum) {
      throw new Error("MetaMask not found.");
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();

    const askPlatformContract = new ethers.Contract(
      askPlatformAddress,
      askPlatformABI,
      signer
    );

    console.log("Calling contract submitAnswer with:", _dbId, _ansDbId, _contentCID);
    const tx = await askPlatformContract.submitAnswer(_dbId, _ansDbId, _contentCID);
    console.log("submitAnswer tx hash:", tx.hash);
    await tx.wait();
    console.log("submitAnswer transaction mined!");
  };

  // ---------------------------
  // 4. Upvote an answer
  // ---------------------------
  const handleVoteClick = (ansDbId: string, isUpvote: boolean) => {
    if (status !== "authenticated" || !walletAddress) {
      setShowConnectWalletDialog(true);
      return;
    }
    setVoteInfo({ ansDbId, isUpvote });
    setShowVoteDialog(true);
  };

  const confirmVote = async () => {
    setShowVoteDialog(false);

    if (!question || !question.id) {
      setError("Missing question DB ID or answer DB ID.");
      return;
    }
    const { ansDbId, isUpvote } = voteInfo;

    try {
      console.log("Confirming upvote on chain. question.id:", question.id, " ansDbId:", ansDbId);

      if (!window.ethereum) {
        setError("MetaMask not found.");
        return;
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();

      const askPlatformContract = new ethers.Contract(
        askPlatformAddress,
        askPlatformABI,
        signer
      );

      // 4a. Upvote on-chain
      if (isUpvote) {
        console.log("Calling upvoteAnswer on-chain with:", question.id, ansDbId);
        const tx = await askPlatformContract.upvoteAnswer(question.id, ansDbId);
        console.log("upvoteAnswer tx hash:", tx.hash);
        await tx.wait();
        console.log("Upvote transaction mined!");
      } else {
        console.warn("Downvote not implemented in askPlatform.");
      }

      // 4b. Also increment in your DB (so your next fetch sees updated votesCount)
      console.log("Also calling local /api/answers/upvote to update DB...");
      const upResp = await fetch("/api/answers/upvote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id, // or question.dbId if your backend uses that
          answerId: ansDbId,
        }),
      });
      if (!upResp.ok) {
        const errText = await upResp.text();
        console.warn("Local DB upvote route error:", errText);
      } else {
        console.log("Local DB upvote route success!");
      }

      // 4c. Re-fetch from DB
      fetchQuestionData(questionId);
    } catch (err: any) {
      console.error("Error upvoting on-chain:", err);
      setError(err.message || "Failed to upvote on the contract.");
    }
  };

  // ---------------------------
  // 5. Helper: Show time left
  // ---------------------------
  const getTimeRemaining = () => {
    if (!question) return "";
    const expiryTime = new Date(question.createdAt);
    expiryTime.setMinutes(5+expiryTime.getMinutes())
    const now = new Date();
    if (now > expiryTime) return "Expired";

    const diffMs = expiryTime.getTime() - now.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHrs < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins} minutes`;
    }
    return `${diffHrs} hours`;
  };

  // ---------------------------
  // 6. Loading / error states
  // ---------------------------
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-green-500 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  if (error && !question) {
    return (
      <div className="min-h-screen bg-black text-green-500 flex items-center justify-center flex-col gap-4">
        <p className="text-red-400">{error}</p>
        <Link href="/dashboard?tab=questions">
          <Button className="bg-green-700 hover:bg-green-600 text-white border border-green-500">
            Return to Questions
          </Button>
        </Link>
      </div>
    );
  }

  // ---------------------------
  // 7. Render
  // ---------------------------
  return (
    <div className="min-h-screen bg-black text-green-500 flex flex-col">
      {/* For LaTeX rendering */}
      <Script
        id="mathjax-script"
        strategy="afterInteractive"
        src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
      />

      {/* HEADER */}
      <header className="border-b border-green-500/30 p-4">
        <div className="container mx-auto flex items-center">
          <Link href="/dashboard?tab=questions" className="mr-4">
            <Button variant="ghost" size="icon" className="text-green-500">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <h1 className="text-xl font-bold">Question Details</h1>
          </div>
          {question && (
            <div className="ml-auto text-sm text-green-400">
              {question.rewarded
                ? "Reward claimed"
                : `Time remaining: ${getTimeRemaining()}`}
            </div>
          )}
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 container mx-auto p-4 flex flex-col gap-6">
        {/* Show error at top if we have it (but question is loaded) */}
        {error && (
          <div className="bg-red-900/30 border border-red-500 text-red-400 p-4 rounded-md">
            {error}
          </div>
        )}

        {/* Render the question */}
        {question && (
          <Card className="border-green-500 bg-black">
            <CardHeader>
              <div className="flex justify-between items-start">
                <Badge variant="outline" className="border-green-500 text-green-400">
                  {question.subject}
                </Badge>
                <div className="flex flex-col items-end">
                  <Badge className="bg-green-700 text-white mb-2">
                    {question.reward} ASK
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <Avatar className="h-6 w-6 border border-green-500">
                  <AvatarImage src="/placeholder.svg?height=24&width=24" />
                  <AvatarFallback className="bg-green-900/30 text-green-500 text-xs">
                    {formatWalletAddress(question.askerWalletAddress).substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-green-400">
                  {formatWalletAddress(question.askerWalletAddress)}
                </span>
              </div>

              <CardTitle className="text-xl mt-4">
                {/* Quick LaTeX replacement for $$...$$ */}
                <div
                  className="latex-content"
                  dangerouslySetInnerHTML={{
                    __html: question.content.replace(
                      /\$\$(.*?)\$\$/g,
                      (_, latex) => `\$$${latex}\$$`
                    ),
                  }}
                />
              </CardTitle>
            </CardHeader>
          </Card>
        )}

        {/* ANSWERS */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Answers ({answers.length || 0})</h2>
          {answers.length === 0 ? (
            <Card className="border-green-500 bg-black">
              <CardContent className="p-6 text-center text-green-400">
                No answers yet. Be the first to answer this question!
              </CardContent>
            </Card>
          ) : (
            answers.map((ans) => (
              <Card key={ans.id} className="border-green-500 bg-black">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 border border-green-500">
                      <AvatarImage src="/placeholder.svg?height=24&width=24" />
                      <AvatarFallback className="bg-green-900/30 text-green-500 text-xs">
                        {formatWalletAddress(ans.responderWalletAddress).substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-green-400">
                      {formatWalletAddress(ans.responderWalletAddress)}
                    </span>
                    <span className="text-xs text-green-400/60">
                      {new Date(ans.createdAt).toLocaleString()}
                    </span>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Quick LaTeX replacement for $$...$$ */}
                  <div
                    className="latex-content whitespace-pre-line"
                    dangerouslySetInnerHTML={{
                      __html: ans.content.replace(
                        /\$\$(.*?)\$\$/g,
                        (_, latex) => `\$$${latex}\$$`
                      ),
                    }}
                  />
                </CardContent>

                <CardFooter className="pt-2 flex justify-end">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-green-500"
                      onClick={() => handleVoteClick(ans.id, true)} // pass answer.id as ansDbId
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">{ans.votesCount || 0}</span>
                  </div>
                </CardFooter>
              </Card>
            ))
          )}

          {/* SUBMIT ANSWER FORM */}
          <Card className="border-green-500 bg-black">
            <CardHeader>
              <CardTitle className="text-lg">Your Answer</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={answerContent}
                onChange={(e) => setAnswerContent(e.target.value)}
                placeholder='Write your answer here... Use $$ around LaTeX e.g. $$\\frac{dy}{dx}$$'
                className="min-h-[150px] bg-black border-green-500 text-green-100"
              />
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                onClick={handleSubmitAnswer}
                disabled={isSubmitting || !answerContent.trim()}
                className="bg-green-700 hover:bg-green-600 text-white border border-green-500"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Answer
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>

      {/* VOTE CONFIRMATION DIALOG */}
      <AlertDialog open={showVoteDialog} onOpenChange={setShowVoteDialog}>
        <AlertDialogContent className="bg-black border-green-500 text-green-500">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Upvote</AlertDialogTitle>
            <AlertDialogDescription className="text-green-400">
              Are you sure you want to upvote this answer on-chain?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-green-500 text-green-500">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmVote}
              className="bg-green-700 hover:bg-green-600 text-white border border-green-500"
            >
              Confirm Upvote
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* CONNECT WALLET DIALOG */}
      <AlertDialog
        open={showConnectWalletDialog}
        onOpenChange={setShowConnectWalletDialog}
      >
        <AlertDialogContent className="bg-black border-green-500 text-green-500">
          <AlertDialogHeader>
            <AlertDialogTitle>Connect Wallet Required</AlertDialogTitle>
            <AlertDialogDescription className="text-green-400">
              You need to connect your wallet to perform this action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-green-500 text-green-500">
              Cancel
            </AlertDialogCancel>
            <Link href="/api/auth/signin">
              <AlertDialogAction className="bg-green-700 hover:bg-green-600 text-white border border-green-500">
                Connect Wallet
              </AlertDialogAction>
            </Link>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
