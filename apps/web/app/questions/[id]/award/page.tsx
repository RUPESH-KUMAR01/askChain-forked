"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Award, Check, Loader2 } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import Script from "next/script"
import { useRouter } from "next/navigation"
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

export default function AwardReward({ params }) {
  const [isLoading, setIsLoading] = useState(true)
  const [question, setQuestion] = useState(null)
  const [answers, setAnswers] = useState([])
  const [selectedAnswerId, setSelectedAnswerId] = useState(null)
  const [isAwarding, setIsAwarding] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const router = useRouter()

  // Mock data for demonstration
  useEffect(() => {
    // Simulate loading question data
    setTimeout(() => {
      setQuestion({
        id: params.id,
        title: "Prove that $$\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$$ using mathematical induction",
        content:
          "I need a clear proof using mathematical induction to show that the sum of the first n natural numbers equals n(n+1)/2. Please include all steps.",
        category: "Mathematics",
        reward: 0.3,
        author: "0x1234...5678", // Current user
        authorName: "You",
        createdAt: "2023-03-21T14:32:00Z",
        expiresAt: "2023-03-22T14:32:00Z",
      })

      setAnswers([
        {
          id: "a1",
          content:
            "Here's a proof by mathematical induction:\n\n**Base case**: For $n = 1$, we have $$\\sum_{i=1}^{1} i = 1$$ and $$\\frac{1(1+1)}{2} = \\frac{2}{2} = 1$$. So the formula holds for $n = 1$.\n\n**Inductive step**: Assume the formula holds for some $k \\geq 1$, that is, $$\\sum_{i=1}^{k} i = \\frac{k(k+1)}{2}$$.\n\nWe need to prove it holds for $n = k+1$:\n\n$$\\sum_{i=1}^{k+1} i = \\sum_{i=1}^{k} i + (k+1) = \\frac{k(k+1)}{2} + (k+1) = \\frac{k(k+1) + 2(k+1)}{2} = \\frac{(k+1)(k+2)}{2}$$\n\nThis is exactly the formula for $n = k+1$, which completes the proof.",
          author: "0x8912dF35F57f31A593d3e5D28C208C67DBB1b980",
          authorName: "MathProof",
          createdAt: "2023-03-21T15:45:00Z",
          upvotes: 5,
          downvotes: 0,
        },
        {
          id: "a2",
          content:
            "I'll prove this using mathematical induction.\n\n1) First, check the base case $n=1$:\n   $$\\sum_{i=1}^{1} i = 1$$\n   $$\\frac{1(1+1)}{2} = 1$$\n   So it's true for $n=1$.\n\n2) Assume it's true for $n=k$:\n   $$\\sum_{i=1}^{k} i = \\frac{k(k+1)}{2}$$\n\n3) Prove for $n=k+1$:\n   $$\\sum_{i=1}^{k+1} i = \\sum_{i=1}^{k} i + (k+1)$$\n   $$= \\frac{k(k+1)}{2} + (k+1)$$\n   $$= \\frac{k(k+1) + 2(k+1)}{2}$$\n   $$= \\frac{(k+1)(k+2)}{2}$$\n\nThis matches the formula for $n=k+1$, completing the proof.",
          author: "0x3F8C962eb167aD2f80C72b5F933511CcDF0719D6",
          authorName: "InductionMaster",
          createdAt: "2023-03-21T16:20:00Z",
          upvotes: 3,
          downvotes: 1,
        },
      ])

      setIsLoading(false)
    }, 1000)
  }, [params.id])

  const handleSelectAnswer = (answerId) => {
    setSelectedAnswerId(answerId)
  }

  const handleAwardReward = () => {
    setShowConfirmDialog(true)
  }

  const confirmAward = () => {
    setIsAwarding(true)
    setShowConfirmDialog(false)

    // Simulate awarding the reward
    setTimeout(() => {
      setIsAwarding(false)
      // Redirect to dashboard after successful award
      router.push("/dashboard?tab=my-questions&awarded=true")
    }, 2000)
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
          <Link href="/dashboard?tab=my-questions" className="mr-4">
            <Button variant="ghost" size="icon" className="text-green-500">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            <h1 className="text-xl font-bold">Award Question Reward</h1>
          </div>
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
              <Badge className="bg-green-700 text-white">{question.reward} ASK</Badge>
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

        {/* Instructions */}
        <div className="bg-green-900/20 border border-green-500 rounded-md p-4 text-green-400">
          <p>
            Select the best answer to award the reward of {question.reward} ASK tokens. This action cannot be undone.
          </p>
        </div>

        {/* Answers Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Answers ({answers.length})</h2>

          {answers.map((answer) => (
            <Card
              key={answer.id}
              className={`border-green-500 bg-black cursor-pointer transition-all ${
                selectedAnswerId === answer.id ? "ring-2 ring-green-500" : ""
              }`}
              onClick={() => handleSelectAnswer(answer.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 border border-green-500">
                      <AvatarImage src="/placeholder.svg?height=24&width=24" />
                      <AvatarFallback className="bg-green-900/30 text-green-500 text-xs">
                        {answer.authorName.substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-green-400">{answer.authorName}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-green-400">Upvotes: {answer.upvotes}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-green-400">Downvotes: {answer.downvotes}</span>
                    </div>

                    {selectedAnswerId === answer.id && (
                      <Badge className="bg-green-700 text-white">
                        <Check className="h-3 w-3 mr-1" /> Selected
                      </Badge>
                    )}
                  </div>
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
            </Card>
          ))}

          <div className="flex justify-end mt-6">
            <Button
              onClick={handleAwardReward}
              disabled={isAwarding || !selectedAnswerId}
              className="bg-green-700 hover:bg-green-600 text-white border border-green-500"
            >
              {isAwarding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Awarding Reward...
                </>
              ) : (
                <>
                  <Award className="mr-2 h-4 w-4" />
                  Award {question.reward} ASK
                </>
              )}
            </Button>
          </div>
        </div>
      </main>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="bg-black border-green-500 text-green-500">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Reward Award</AlertDialogTitle>
            <AlertDialogDescription className="text-green-400">
              You are about to award {question.reward} ASK tokens to the selected answer. This action cannot be undone.
              Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-green-500 text-green-500">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAward}
              className="bg-green-700 hover:bg-green-600 text-white border border-green-500"
            >
              Confirm Award
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

