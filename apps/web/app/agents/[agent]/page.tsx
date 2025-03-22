"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ethers } from "ethers";
import { remark } from "remark";
import remarkHtml from "remark-html";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import Script from "next/script";
import { useToast } from "@/components/ui/use-toast";

import {
  Calculator,
  Atom,
  Brain,
  Send,
  ArrowLeft,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";

// 1) Import your contract ABIs and addresses
import { askPlatformABI } from "@/lib/abis/askPlatformAbi";
const askPlatformAddress = process.env.NEXT_PUBLIC_ASK_PLATFORM_ADDRESS || "";

// The ERC-20 token contract (AskToken) to be approved
const askTokenABI = [
  "function approve(address spender, uint256 amount) external returns (bool)"
];
const askTokenAddress = process.env.NEXT_PUBLIC_ASK_TOKEN_ADDRESS || "";

// Example base URL for your AI agent
const BASE_URL = "http://localhost:5000";

// Example definitions of your AI agents
const agentInfo = {
  math: {
    name: "Mathematics Agent",
    icon: <Calculator className="h-6 w-6" />,
    color: "text-blue-500",
    subject: "MATH",
    endpoint: "/math/ask",
  },
  physics: {
    name: "Physics Agent",
    icon: <Atom className="h-6 w-6" />,
    color: "text-purple-500",
    subject: "PHYSICS",
    endpoint: "/physics/ask",
  },
  compsci: {
    name: "Computer Science Agent",
    icon: <Brain className="h-6 w-6" />,
    color: "text-yellow-500",
    subject: "COMPUTER_SCIENCE",
    endpoint: "/compsci/ask",
  },
};

export default function AgentChat({ params }: any) {
  const { data: session, status } = useSession();
  const walletAddress = session?.user?.walletAddress || "";
  const { toast } = useToast();

  // --- Agent type from route param ---
  // If using Next.js 13, `params` might be a Promise. You can do `const { agent } = use(params)` if needed.
  // For simplicity, we'll assume `params.agent` works here:
  const agentType = params?.agent || "math";
  const currentAgent = agentInfo[agentType] || agentInfo.math;

  // --- Chat states ---
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastQuestion, setLastQuestion] = useState("");

  // --- Post to community states ---
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [reward, setReward] = useState(0.1); // user-chosen reward in ASK
  const [isPostingQuestion, setIsPostingQuestion] = useState(false);
  const [postStatus, setPostStatus] = useState({
    show: false,
    success: false,
    message: "",
  });

  // For MathJax / highlight
  const [mathjaxReady, setMathjaxReady] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Safely run MathJax
  const typesetMath = () => {
    if (window.MathJax && typeof window.MathJax.typesetPromise === "function") {
      if (contentRef.current) {
        window.MathJax.typesetPromise([contentRef.current]).catch((err) => {
          console.error("MathJax typesetting failed:", err);
        });
      } else {
        window.MathJax.typesetPromise().catch((err) => {
          console.error("MathJax typesetting failed:", err);
        });
      }
    }
  };

  // Code highlight
  const highlightCode = () => {
    if (window.hljs) {
      try {
        const codeBlocks = document.querySelectorAll("pre code");
        codeBlocks.forEach((block) => {
          (window as any).hljs.highlightElement(block);
        });
      } catch (error) {
        console.error("Error highlighting code:", error);
      }
    }
  };

  // Re-run typesetting / highlight after messages or once MathJax is ready
  useEffect(() => {
    if (mathjaxReady && messages.length > 0) {
      const timer = setTimeout(() => {
        typesetMath();
        highlightCode();
      }, 100);
      return () => clearTimeout(timer);
    }
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        highlightCode();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages, mathjaxReady]);

  const handleMathJaxLoad = () => {
    setMathjaxReady(true);
    setTimeout(() => {
      typesetMath();
      highlightCode();
    }, 200);
  };

  // Markdown -> HTML
  const processMarkdown = async (markdown: string) => {
    try {
      const result = await remark().use(remarkHtml).process(markdown);
      return result.toString();
    } catch (error) {
      console.error("Error processing markdown:", error);
      return markdown;
    }
  };

  // Auto-resize textarea
  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };
  useEffect(() => {
    autoResizeTextarea();
  }, [inputValue]);

  // Send user message to AI
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = { role: "user", content: inputValue };
    setMessages((prev) => [...prev, userMessage]);
    setLastQuestion(inputValue);
    setInputValue("");
    setIsLoading(true);

    try {
      // Example agent call
      const fullUrl = `${BASE_URL}${currentAgent.endpoint}`;
      const payload = {
        question: userMessage.content,
        topics: [currentAgent.subject],
        details: "",
      };

      const response = await fetch(fullUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`Agent call failed: ${response.status}`);
      const data = await response.json();

      const answerContent = data.answer || "No answer provided";
      const processed = await processMarkdown(answerContent);

      const agentResponse = {
        role: "assistant",
        content: processed,
        rawContent: answerContent,
      };
      setMessages((prev) => [...prev, agentResponse]);
      setTimeout(() => {
        typesetMath();
        highlightCode();
      }, 100);
    } catch (error: any) {
      console.error("Error in AI call:", error);
      const errorResp = {
        role: "assistant",
        content: `Error: ${error.message}`,
      };
      setMessages((prev) => [...prev, errorResp]);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------
  // (A) Approve & askQuestion
  // ---------------------------

  /**
   * Approve the AskPlatform contract to spend `rewardAmount` ASK tokens on behalf of user.
   */
  async function approveAskTokens(rewardAmount: number) {
    if (!window.ethereum) throw new Error("MetaMask not found.");

    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();

    // If your ASK token uses 18 decimals, parseUnits is needed:
    // For example, if reward=1 => parseUnits("1", 18)
    // If your token is pure integer, you might do parseInt
    const rewardWei = ethers.parseUnits(rewardAmount.toString(), 18);

    // Create a contract instance of the ASK token
    const askToken = new ethers.Contract(askTokenAddress, askTokenABI, signer);
    console.log("Approving AskPlatform contract to spend", rewardWei.toString(), "wei of ASK...");

    const tx = await askToken.approve(askPlatformAddress, rewardWei);
    await tx.wait();
    console.log("approve() tx mined successfully!");
  }

  /**
   * Actually call askQuestion(_dbId, _subject, _reward).
   * For a token with 18 decimals, the `_reward` param might be the full wei value.
   * Or if your contract expects a raw integer, you might pass parseInt.
   */
  async function onChainAskQuestion(dbId: string, subject: string, rewardAmount: number) {
    if (!window.ethereum) throw new Error("MetaMask not found.");

    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();

    const askPlatform = new ethers.Contract(askPlatformAddress, askPlatformABI, signer);

    // If your contract uses 18 decimals for `_reward`, parse it:
    const rewardWei = ethers.parseUnits(rewardAmount.toString(), 18);

    console.log("Calling askQuestion with:", { dbId, subject, rewardWei: rewardWei.toString() });
    const tx = await askPlatform.askQuestion(dbId, subject, rewardWei);
    await tx.wait();
    console.log("askQuestion() transaction mined!");
  }

  // (B) handlePostQuestion: store in DB, then do two on-chain calls:
  //  1) approve
  //  2) askQuestion
  const handlePostQuestion = async () => {
    if (isPostingQuestion) return;

    if (!session?.user?.walletAddress) {
      toast({
        title: "Authentication Required",
        description: "Please sign in with your wallet to post questions",
        variant: "destructive",
      });
      setShowPostDialog(false);
      return;
    }

    setIsPostingQuestion(true);
    setPostStatus({
      show: true,
      success: false,
      message: "Posting your question to the community...",
    });

    try {
      // 1) POST to your backend to store question in DB & IPFS
      const postData = {
        walletAddress: session.user.walletAddress,
        content: lastQuestion,
        subject: currentAgent.subject,
        reward, // the numeric reward in ASK
      };
      console.log("Posting question to backend /api/questions:", postData);

      const resp = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });
      if (!resp.ok) {
        const errText = await resp.text();
        throw new Error(`Backend error: ${errText}`);
      }
      const data = await resp.json();
      console.log("Backend responded with:", data);

      // Suppose data has: { success, questionId, pinataCid, dbId, message, ... }
      if (!data.questionId) {
        throw new Error("No dbId returned from backend.");
      }
      const dbId = data.questionId;
      const subject = currentAgent.subject;

      // 2) Approve the contract to spend `reward` tokens
      await approveAskTokens(reward);

      // 3) Actually call onChainAskQuestion
      await onChainAskQuestion(dbId, subject, reward);

      // If successful, show success
      setPostStatus({
        show: true,
        success: true,
        message: `Question posted successfully! IPFS CID: ${
          data.pinataCid?.substring(0, 8) || "N/A"
        }...`,
      });

      toast({
        title: "Question Posted Successfully",
        description: `Your question has been posted on-chain & in DB (CID: ${data.pinataCid || "N/A"})`,
      });

      // Optionally redirect
      setTimeout(() => {
        window.location.href = `/dashboard?questionId=${data.questionId || ""}`;
      }, 2000);
    } catch (err: any) {
      console.error("Error posting question or onChainAskQuestion:", err);
      setPostStatus({
        show: true,
        success: false,
        message: `Error: ${err.message}`,
      });
      toast({
        title: "Error Posting Question",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsPostingQuestion(false);
    }
  };

  const handleClosePostStatus = () => {
    setPostStatus({ show: false, success: false, message: "" });
    if (!postStatus.success) {
      setShowPostDialog(false);
      setIsPostingQuestion(false);
    }
  };

  // Toggle dialog open/close
  const handleDialogOpenChange = (open: boolean) => {
    setShowPostDialog(open);
    if (!open) {
      setTimeout(() => {
        typesetMath();
        highlightCode();
      }, 200);
    }
  };

  return (
    <div className="min-h-screen bg-black text-green-500 flex flex-col">
      {/* Header */}
      <header className="border-b border-green-500/30 p-4">
        <div className="container mx-auto flex items-center">
          <Link href="/dashboard" className="mr-4">
            <Button variant="ghost" size="icon" className="text-green-500">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            {currentAgent.icon}
            <h1 className="text-xl font-bold">{currentAgent.name}</h1>
          </div>
          <div className="ml-auto text-xs text-green-400/50">
            Wallet:{" "}
            {walletAddress
              ? walletAddress.substring(0, 6) + "..."
              : "Not connected"}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 container mx-auto p-4 flex flex-col">
        {/* Scripts */}
        <Script
          id="mathjax-config"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.MathJax = {
                tex: {
                  inlineMath: [['$', '$'], ['\\\$$', '\\\$$']],
                  displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
                  processEscapes: true
                },
                svg: { fontCache: 'global' },
                options: { enableMenu: false },
                startup: {
                  pageReady: function() {
                    return MathJax.startup.defaultPageReady();
                  }
                }
              };
            `,
          }}
        />
        <Script
          id="mathjax-script"
          strategy="afterInteractive"
          src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"
          onLoad={handleMathJaxLoad}
        />
        <Script
          id="highlight-js-script"
          strategy="afterInteractive"
          src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js"
          onLoad={() => highlightCode()}
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/atom-one-dark.min.css"
        />

        {/* Post status alert */}
        {postStatus.show && (
          <Alert
            className={`mb-4 ${
              postStatus.success
                ? "bg-green-900/30 border-green-500"
                : "bg-red-900/30 border-red-500"
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <AlertTitle
                  className={postStatus.success ? "text-green-400" : "text-red-400"}
                >
                  {postStatus.success ? "Success" : "Error"}
                </AlertTitle>
                <AlertDescription className="text-green-100">
                  {postStatus.message}
                </AlertDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-green-500 h-8 w-8"
                onClick={handleClosePostStatus}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Alert>
        )}

        <Card className="flex-1 border-green-500 bg-black overflow-hidden flex flex-col">
          <CardHeader className="border-b border-green-500/30">
            <CardTitle className="text-lg">
              Chat with {currentAgent.name}
            </CardTitle>
          </CardHeader>

          <CardContent
            className="flex-1 overflow-y-auto p-4 space-y-4"
            ref={contentRef}
          >
            {/* Example Markdown styling */}
            <style jsx global>{`
              /* ... your markdown + code highlight CSS ... */
            `}</style>

            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-green-400/70">
                <p>Ask a question to get started...</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      msg.role === "user"
                        ? "bg-green-900/30 text-green-100"
                        : "bg-gray-900 text-green-400 border border-green-500/50"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="space-y-4">
                        <div
                          className="markdown-content latex-content"
                          dangerouslySetInnerHTML={{ __html: msg.content }}
                        />
                        <div className="flex justify-end mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-green-500/50 text-green-400 hover:bg-green-900/30"
                            onClick={() => setShowPostDialog(true)}
                          >
                            Post to Community
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] p-3 rounded-lg bg-gray-900 text-green-400 border border-green-500/50">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <p>Thinking...</p>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </CardContent>

          <CardFooter className="border-t border-green-500/30 p-4">
            <form onSubmit={handleSendMessage} className="w-full flex gap-2">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={`Ask the ${currentAgent.name} a question...`}
                  className="min-h-[40px] max-h-[200px] bg-black border-green-500 text-green-100 font-mono resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <div className="text-xs text-green-500/50 mt-1">
                  Press Shift+Enter for new line, Enter to send
                </div>
              </div>
              <Button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="bg-green-700 hover:bg-green-600 text-white border border-green-500 self-start"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      </main>

      {/* Post-to-Community dialog */}
      <Dialog open={showPostDialog} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="bg-black border-green-500 text-green-500">
          <DialogHeader>
            <DialogTitle>Was this answer satisfactory?</DialogTitle>
            <DialogDescription className="text-green-400">
              If not, you can post this question to the community with a reward.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="border border-green-500/50 p-3 rounded-lg">
              <Badge
                variant="outline"
                className="mb-2 border-green-500 text-green-400"
              >
                Your Question
              </Badge>
              <p className="line-clamp-2 text-sm">
                {lastQuestion.length > 100
                  ? `${lastQuestion.substring(0, 100)}...`
                  : lastQuestion}
              </p>
            </div>

            <div className="flex items-center gap-2 text-green-400">
              <Badge
                variant="outline"
                className="border-green-500 text-green-400"
              >
                Subject
              </Badge>
              <p>{currentAgent.subject}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-green-400">
                Reward Amount (ASK tokens)
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={reward}
                  onChange={(e) => setReward(parseFloat(e.target.value))}
                  className="bg-black border-green-500 text-green-100"
                />
                <Badge className="bg-green-700 text-white">ASK</Badge>
              </div>
            </div>

            {status !== "authenticated" && (
              <div className="flex items-center gap-2 text-yellow-500 p-2 border border-yellow-500/30 rounded-lg bg-yellow-900/20">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm">
                  Please sign in with your wallet to post a question
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="flex sm:justify-between">
            <Button
              variant="outline"
              className="border-green-500 text-green-500"
              onClick={() => {
                setShowPostDialog(false);
                setTimeout(() => {
                  typesetMath();
                  highlightCode();
                }, 200);
              }}
            >
              It's Satisfactory
            </Button>

            <Button
              className="bg-green-700 hover:bg-green-600 text-white border border-green-500"
              onClick={handlePostQuestion}
              disabled={isPostingQuestion || status !== "authenticated"}
            >
              {isPostingQuestion ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                "Post Question"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
