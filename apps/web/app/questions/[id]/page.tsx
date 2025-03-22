// Update the question detail page to include voting functionality and better answer submission

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, MessageSquare, ThumbsUp, ThumbsDown, Send, Loader2 } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import Script from "next/script"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function QuestionDetail({ params }) {
  const [answers, setAnswers] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [answerContent, setAnswerContent] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [question, setQuestion] = useState(null)
  const [userVotes, setUserVotes] = useState({})
  const [showVoteDialog, setShowVoteDialog] = useState(false)
  const [voteInfo, setVoteInfo] = useState({ id: "", isUpvote: true })

  // Mock data for demonstration
  useEffect(() => {
    // Simulate loading question data
    setTimeout(() => {
      setQuestion({
        id: params.id,
        title: "How do I solve this differential equation: $$\\frac{dy}{dx} = y^2 \\cdot \\sin(x)$$?",
        content:
          "I've been trying to solve this differential equation but I'm stuck. I tried separation of variables but it gets complicated. Can someone provide a step-by-step solution with the proper mathematical notation? $$\\frac{dy}{dx} = y^2 \\cdot \\sin(x)$$",
        category: "Mathematics",
        reward: 0.2,
        author: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        authorName: "MathEnthusiast",
        createdAt: "2023-03-21T14:32:00Z",
        expiresAt: "2023-03-22T14:32:00Z",
      })

      setAnswers([
        {
          id: "a1",
          content:
            "This is a separable differential equation. We can rewrite it as: $$\\frac{1}{y^2}dy = \\sin(x)dx$$\n\nIntegrating both sides:\n$$\\int \\frac{1}{y^2}dy = \\int \\sin(x)dx$$\n\n$$-\\frac{1}{y} = -\\cos(x) + C$$\n\nSolving for y:\n$$y = \\frac{1}{\\cos(x) - C}$$\n\nWhere C is an arbitrary constant.",
          author: "0x8912dF35F57f31A593d3e5D28C208C67DBB1b980",
          authorName: "DiffEqPro",
          createdAt: "2023-03-21T15:45:00Z",
          upvotes: 3,
          downvotes: 0,
        },
        {
          id: "a2",
          content:
            "Another approach is to use an integrating factor. Let's define $$u = \\frac{1}{y}$$, then $$\\frac{du}{dx} = -\\frac{1}{y^2}\\frac{dy}{dx}$$.\n\nSubstituting our original equation:\n$$\\frac{du}{dx} = -\\sin(x)$$\n\nIntegrating:\n$$u = \\cos(x) + C$$\n\nSubstituting back:\n$$\\frac{1}{y} = \\cos(x) + C$$\n\nTherefore:\n$$y = \\frac{1}{\\cos(x) + C}$$",
          author: "0x3F8C962eb167aD2f80C72b5F933511CcDF0719D6",
          authorName: "CalcWizard",
          createdAt: "2023-03-21T16:20:00Z",
          upvotes: 5,
          downvotes: 1,
        },
      ])

      setIsLoading(false)
    }, 1000)
  }, [params.id])

  const handleSubmitAnswer = () => {
    if (!answerContent.trim()) return

    setIsSubmitting(true)

    // Simulate submitting answer
    setTimeout(() => {
      const newAnswer = {
        id: `a${answers.length + 1}`,
        content: answerContent,
        author: "0x1234...5678", // Current user
        authorName: "You",
        createdAt: new Date().toISOString(),
        upvotes: 0,
        downvotes: 0,
      }

      setAnswers([...answers, newAnswer])
      setAnswerContent("")
      setIsSubmitting(false)
    }, 1500)
  }

  const handleVoteClick = (answerId, isUpvote) => {
    // Check if user has already voted on this answer
    if (userVotes[answerId]) {
      // If trying to vote the same way again, do nothing
      if (userVotes[answerId] === (isUpvote ? "up" : "down")) {
        return
      }
    }

    // Show confirmation dialog
    setVoteInfo({ id: answerId, isUpvote })
    setShowVoteDialog(true)
  }

  const confirmVote = () => {
    const { id, isUpvote } = voteInfo

    setAnswers(
      answers.map((answer) => {
        if (answer.id === id) {
          if (isUpvote) {
            // If previously downvoted, remove downvote
            const downvotes = userVotes[id] === "down" ? answer.downvotes - 1 : answer.downvotes
            return {
              ...answer,
              upvotes: answer.upvotes + 1,
              downvotes,
            }
          } else {
            // If previously upvoted, remove upvote
            const upvotes = userVotes[id] === "up" ? answer.upvotes - 1 : answer.upvotes
            return {
              ...answer,
              downvotes: answer.downvotes + 1,
              upvotes,
            }
          }
        }
        return answer
      }),
    )

    // Update user votes
    setUserVotes({
      ...userVotes,
      [id]: isUpvote ? "up" : "down",
    })

    setShowVoteDialog(false)
  }

  const getTimeRemaining = () => {
    if (!question) return ""

    const expiryTime = new Date(question.expiresAt)
    const now = new Date()

    if (now > expiryTime) {
      return "Expired"
    }

    const diffMs = expiryTime - now
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))

    if (diffHrs < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60))
      return `${diffMins} minutes`
    }

    return `${diffHrs} hours`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-green-500 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-green-500 flex flex-col">
      <Script
        id="mathjax-script"
        strategy="afterInteractive"
        src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
      />

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

          <div className="ml-auto text-sm text-green-400">Time remaining: {getTimeRemaining()}</div>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 flex flex-col gap-6">
        {/* Question Card */}
        <Card className="border-green-500 bg-black">
          <CardHeader>
            <div className="flex justify-between items-start">
              <Badge variant="outline" className="border-green-500 text-green-400">
                {question.category}
              </Badge>
              <div className="flex flex-col items-end">
                <Badge className="bg-green-700 text-white mb-2">{question.reward} ASK</Badge>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <Avatar className="h-6 w-6 border border-green-500">
                <AvatarImage src="/placeholder.svg?height=24&width=24" />
                <AvatarFallback className="bg-green-900/30 text-green-500 text-xs">
                  {question.authorName.substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-green-400">{question.authorName}</span>
            </div>

            <CardTitle className="text-xl mt-4">
              <div
                className="latex-content"
                dangerouslySetInnerHTML={{
                  __html: question.title.replace(/\$\$(.*?)\$\$/g, (_, latex) => `\$$${latex}\$$`),
                }}
              />
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div
              className="latex-content"
              dangerouslySetInnerHTML={{
                __html: question.content.replace(/\$\$(.*?)\$\$/g, (_, latex) => `\$$${latex}\$$`),
              }}
            />
          </CardContent>
        </Card>

        {/* Answers Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Answers ({answers.length})</h2>

          {answers.map((answer) => (
            <Card key={answer.id} className="border-green-500 bg-black">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6 border border-green-500">
                    <AvatarImage src="/placeholder.svg?height=24&width=24" />
                    <AvatarFallback className="bg-green-900/30 text-green-500 text-xs">
                      {answer.authorName.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-green-400">{answer.authorName}</span>
                  <span className="text-xs text-green-400/60">{new Date(answer.createdAt).toLocaleString()}</span>
                </div>
              </CardHeader>

              <CardContent>
                <div
                  className="latex-content whitespace-pre-line"
                  dangerouslySetInnerHTML={{
                    __html: answer.content.replace(/\$\$(.*?)\$\$/g, (_, latex) => `\$$${latex}\$$`),
                  }}
                />
              </CardContent>

              <CardFooter className="pt-2 flex justify-end">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 ${userVotes[answer.id] === "up" ? "text-green-400 bg-green-900/30" : "text-green-500"}`}
                      onClick={() => handleVoteClick(answer.id, true)}
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">{answer.upvotes}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 ${userVotes[answer.id] === "down" ? "text-red-400 bg-red-900/30" : "text-green-500"}`}
                      onClick={() => handleVoteClick(answer.id, false)}
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">{answer.downvotes}</span>
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}

          {/* Submit Answer Form */}
          <Card className="border-green-500 bg-black">
            <CardHeader>
              <CardTitle className="text-lg">Your Answer</CardTitle>
            </CardHeader>

            <CardContent>
              <Textarea
                value={answerContent}
                onChange={(e) => setAnswerContent(e.target.value)}
                placeholder="Write your answer here... Use $$ around LaTeX formulas, e.g. $$\frac{dy}{dx}$$"
                className="min-h-[150px] bg-black border-green-500 text-green-100"
              />
              <p className="text-xs text-green-400 mt-2">
                Tip: Use $$ around mathematical expressions for LaTeX rendering. Example: $$\frac{dy}
                {dx} = y^2 \cdot \sin(x)$$
              </p>
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

      <AlertDialog open={showVoteDialog} onOpenChange={setShowVoteDialog}>
        <AlertDialogContent className="bg-black border-green-500 text-green-500">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Vote</AlertDialogTitle>
            <AlertDialogDescription className="text-green-400">
              Are you sure you want to {voteInfo.isUpvote ? "upvote" : "downvote"} this answer?
              {userVotes[voteInfo.id] && (
                <span className="block mt-2">
                  Note: This will remove your previous {userVotes[voteInfo.id] === "up" ? "upvote" : "downvote"}.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-green-500 text-green-500">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmVote}
              className={
                voteInfo.isUpvote
                  ? "bg-green-700 hover:bg-green-600 text-white border border-green-500"
                  : "bg-red-700 hover:bg-red-600 text-white border border-red-500"
              }
            >
              Confirm {voteInfo.isUpvote ? "Upvote" : "Downvote"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

