"use client"

import { useState, useEffect, use } from "react"
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
  // Unwrap params before accessing properties
  const unwrappedParams = use(params);
  const questionId = unwrappedParams.id;

  const [answers, setAnswers] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [answerContent, setAnswerContent] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [question, setQuestion] = useState(null)
  const [userVotes, setUserVotes] = useState({})
  const [showVoteDialog, setShowVoteDialog] = useState(false)
  const [voteInfo, setVoteInfo] = useState({ id: "", isUpvote: true })
  const [error, setError] = useState(null)
  const [walletAddress, setWalletAddress] = useState("0x1234...5678") // In real app, get from wallet connection

  // Fetch question data
  useEffect(() => {
    async function fetchQuestionData() {
      try {
        // In a real implementation, you would have an API route for fetching question details
        const response = await fetch(`/api/questions/${questionId}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch question: ${response.statusText}`)
        }
        
        const data = await response.json()
        setQuestion(data)
      } catch (err) {
        console.error("Error fetching question:", err)
        setError("Failed to load question details. Please try again later.")
      }
    }

    fetchQuestionData()
  }, [questionId])

  // Fetch answers
  useEffect(() => {
    async function fetchAnswers() {
      try {
        const response = await fetch(`/api/answers?questionId=${questionId}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch answers: ${response.statusText}`)
        }
        
        const data = await response.json()
        
        // Transform API data to match component's expected format
        const formattedAnswers = data.map(answer => ({
          id: answer.id,
          content: answer.content,
          author: answer.responderWallet,
          authorName: formatWalletAddress(answer.responderWallet),
          createdAt: answer.createdAt,
          upvotes: answer.voteCount || 0, // Simplified for now, in reality you'd count up/down separately
          downvotes: 0 // Placeholder - you'd need to modify your API to return this information
        }))
        
        setAnswers(formattedAnswers)
      } catch (err) {
        console.error("Error fetching answers:", err)
        setError("Failed to load answers. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    if (questionId) {
      fetchAnswers()
    }
  }, [questionId])

  // Format wallet address for display (0x1234...5678)
  const formatWalletAddress = (address) => {
    if (!address) return "Unknown"
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  const handleSubmitAnswer = async () => {
    if (!answerContent.trim()) return

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/answers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: walletAddress,
          content: answerContent,
          questionId: questionId
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit answer')
      }

      const result = await response.json()
      
      // After successful submission, refresh the answers list
      const answersResponse = await fetch(`/api/answers?questionId=${questionId}`)
      const answersData = await answersResponse.json()
      
      // Transform and update answers
      const formattedAnswers = answersData.map(answer => ({
        id: answer.id,
        content: answer.content,
        author: answer.responderWallet,
        authorName: formatWalletAddress(answer.responderWallet),
        createdAt: answer.createdAt,
        upvotes: answer.voteCount || 0,
        downvotes: 0
      }))
      
      setAnswers(formattedAnswers)
      setAnswerContent("")
    } catch (err) {
      console.error("Error submitting answer:", err)
      setError(err.message || "Failed to submit your answer. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
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

  const confirmVote = async () => {
    const { id, isUpvote } = voteInfo
    
    try {
      // In a real implementation, you would have an API route for voting
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answerId: id,
          walletAddress: walletAddress,
          isUpvote: isUpvote
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit vote')
      }
      
      // Update local state to reflect vote
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
    } catch (err) {
      console.error("Error submitting vote:", err)
      setError(err.message || "Failed to submit your vote. Please try again.")
    }

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

          {question && (
            <div className="ml-auto text-sm text-green-400">Time remaining: {getTimeRemaining()}</div>
          )}
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 flex flex-col gap-6">
        {/* Error notification */}
        {error && (
          <div className="bg-red-900/30 border border-red-500 text-red-400 p-4 rounded-md">
            {error}
          </div>
        )}

        {/* Question Card */}
        {question && (
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
                    {formatWalletAddress(question.author).substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-green-400">{formatWalletAddress(question.author)}</span>
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
        )}

        {/* Answers Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Answers ({answers.length})</h2>

          {answers.length === 0 ? (
            <Card className="border-green-500 bg-black">
              <CardContent className="p-6 text-center text-green-400">
                No answers yet. Be the first to answer this question!
              </CardContent>
            </Card>
          ) : (
            answers.map((answer) => (
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
            ))
          )}

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
                Tip: Use $$ around mathematical expressions for LaTeX rendering. Example: $$\frac{dy}{dx} = y^2 \cdot \sin(x)$$
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