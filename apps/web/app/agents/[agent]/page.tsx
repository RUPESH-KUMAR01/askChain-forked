"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Calculator, Atom, Brain, Send, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import Script from "next/script"

export default function AgentChat({ params }) {
  // Unwrap params using React.use()
  const unwrappedParams = React.use(params);
  const agentType = unwrappedParams.agent;

  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [lastQuestion, setLastQuestion] = useState("")
  const [showPostDialog, setShowPostDialog] = useState(false)
  const [reward, setReward] = useState(0.1)

  const messagesEndRef = useRef(null)

  const agentInfo = {
    math: {
      name: "Mathematics Agent",
      icon: <Calculator className="h-6 w-6" />,
      color: "text-blue-500",
    },
    physics: {
      name: "Physics Agent",
      icon: <Atom className="h-6 w-6" />,
      color: "text-purple-500",
    },
    chemistry: {
      name: "Chemistry Agent",
      icon: <Brain className="h-6 w-6" />,
      color: "text-yellow-500",
    },
  }

  const currentAgent = agentInfo[agentType] || agentInfo.math

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    const userMessage = {
      role: "user",
      content: inputValue,
    }

    setMessages((prev) => [...prev, userMessage])
    setLastQuestion(inputValue)
    setInputValue("")
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const agentResponse = {
        role: "assistant",
        content: generateResponse(agentType, inputValue),
      }

      setMessages((prev) => [...prev, agentResponse])
      setIsLoading(false)

      // Show post dialog after response
      setTimeout(() => {
        setShowPostDialog(true)
      }, 1000)
    }, 2000)
  }

  const handlePostQuestion = () => {
    // Logic to post question to community
    setShowPostDialog(false)
    // Redirect to dashboard or show confirmation
  }

  return (
    <div className="min-h-screen bg-black text-green-500 flex flex-col">
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
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 flex flex-col">
        <Card className="flex-1 border-green-500 bg-black overflow-hidden flex flex-col">
          <CardHeader className="border-b border-green-500/30">
            <CardTitle className="text-lg">Chat with {currentAgent.name}</CardTitle>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            <Script
              id="mathjax-script"
              strategy="afterInteractive"
              src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
            />
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-green-400/70">
                <p>Ask a question to get started...</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === "user"
                        ? "bg-green-900/30 text-green-100"
                        : "bg-gray-900 text-green-400 border border-green-500/50"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <div
                        className="latex-content"
                        dangerouslySetInnerHTML={{
                          __html: message.content.replace(/\$\$(.*?)\$\$/g, (_, latex) => `\$$${latex}\$$`),
                        }}
                      />
                    ) : (
                      <p>{message.content}</p>
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
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={`Ask the ${currentAgent.name} a question...`}
                className="flex-1 bg-black border-green-500 text-green-100"
              />
              <Button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="bg-green-700 hover:bg-green-600 text-white border border-green-500"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      </main>

      <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <DialogContent className="bg-black border-green-500 text-green-500">
          <DialogHeader>
            <DialogTitle>Was this answer satisfactory?</DialogTitle>
            <DialogDescription className="text-green-400">
              If not, you can post this question to the community with a reward.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="border border-green-500/50 p-3 rounded-lg">
              <Badge variant="outline" className="mb-2 border-green-500 text-green-400">
                Your Question
              </Badge>
              <p>{lastQuestion}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-green-400">Reward Amount (ASK tokens)</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={reward}
                  onChange={(e) => setReward(Number.parseFloat(e.target.value))}
                  className="bg-black border-green-500 text-green-100"
                />
                <Badge className="bg-green-700 text-white">ASK</Badge>
              </div>
            </div>
          </div>

          <DialogFooter className="flex sm:justify-between">
            <Button
              variant="outline"
              className="border-green-500 text-green-500"
              onClick={() => setShowPostDialog(false)}
            >
              It's Satisfactory
            </Button>
            <Button
              className="bg-green-700 hover:bg-green-600 text-white border border-green-500"
              onClick={handlePostQuestion}
            >
              Post Question
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Helper function to generate mock responses
function generateResponse(agent, question) {
  const responses = {
    math: [
      "To solve this equation, you need to apply the chain rule of differentiation. For a function $$f(g(x))$$, the derivative is $$f'(g(x)) \\cdot g'(x)$$.",
      "This is a quadratic equation. You can solve it using the quadratic formula: $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$.",
      "For this integral, try using substitution with $$u = \\sin(x)$$. Then $$du = \\cos(x)dx$$.",
    ],
    physics: [
      "According to Newton's Second Law, $$F = ma$$, where F is force, m is mass, and a is acceleration.",
      "The uncertainty principle states that $$\\Delta x \\cdot \\Delta p \\geq \\frac{\\hbar}{2}$$, where you cannot simultaneously know the exact position and momentum of a particle.",
      "In thermodynamics, entropy is given by the formula $$S = k_B \\ln W$$, where $$k_B$$ is Boltzmann's constant and W is the number of microstates.",
    ],
    chemistry: [
      "The pH scale measures how acidic or basic a solution is, ranging from 0 to 14. It's defined as $$pH = -\\log[H^+]$$.",
      "In organic chemistry, functional groups determine the chemical properties of molecules. For example, the carbonyl group is represented as $$C=O$$.",
      "A redox reaction involves the transfer of electrons between chemical species. The reduction potential is related to Gibbs free energy by $$\\Delta G = -nFE$$.",
    ],
  }

  const agentResponses = responses[agent] || responses.math
  return agentResponses[Math.floor(Math.random() * agentResponses.length)]
}