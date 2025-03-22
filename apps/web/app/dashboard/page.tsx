"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Terminal, Brain, Atom, Calculator, Award, MessageSquare, LogOut } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Script from "next/script"

export default function Dashboard() {
  const { data: session, status } = useSession()
  const [askTokens, setAskTokens] = useState(100)
  const [connectedAddress, setConnectedAddress] = useState("Not connected")

  // Update connected address when session data is available
  useEffect(() => {
    if (session?.user?.walletAddress) {
      setConnectedAddress(session.user.walletAddress)
      
      // If you have askTokens in the session, you can update that too
      if (session.user.askTokens) {
        setAskTokens(session.user.askTokens)
      }
    }
  }, [session])

  // Add state for questions data
  const [questions, setQuestions] = useState([
    {
      id: "1",
      title: "How do I solve this differential equation: $$\\frac{dy}{dx} = y^2 \\cdot \\sin(x)$$?",
      category: "Mathematics",
      reward: 0.2,
      answers: 3,
      timeLeft: "12 hours",
      isOwn: false,
    },
    {
      id: "2",
      title:
        "Explain the concept of quantum entanglement and its implications for $$|\\psi\\rangle = \\frac{1}{\\sqrt{2}}(|0\\rangle|1\\rangle - |1\\rangle|0\\rangle)$$",
      category: "Physics",
      reward: 0.5,
      answers: 1,
      timeLeft: "18 hours",
      isOwn: false,
    },
    {
      id: "3",
      title: "What is the mechanism behind the Grignard reaction with $$\\ce{RMgX + C=O -> R-C-OMgX}$$?",
      category: "Chemistry",
      reward: 0.1,
      answers: 0,
      timeLeft: "23 hours",
      isOwn: false,
    },
    {
      id: "4",
      title: "Prove that $$\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$$ using mathematical induction",
      category: "Mathematics",
      reward: 0.3,
      answers: 2,
      timeLeft: "10 hours",
      isOwn: true,
    },
    {
      id: "5",
      title:
        "Explain how to derive the Schrödinger equation $$i\\hbar\\frac{\\partial}{\\partial t}\\Psi(\\mathbf{r},t) = \\hat{H}\\Psi(\\mathbf{r},t)$$",
      category: "Physics",
      reward: 0.4,
      answers: 1,
      timeLeft: "5 hours",
      isOwn: true,
    },
  ])

  // Handle logout function
  const handleLogout = () => {
    signOut({ callbackUrl: '/' })
  }

  // Display a loading state if session is still loading
  if (status === "loading") {
    return <div className="min-h-screen bg-black text-green-500 flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-black text-green-500">
      <Script
        id="mathjax-script"
        strategy="afterInteractive"
        src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
      />
      <header className="border-b border-green-500/30 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Terminal className="h-6 w-6" />
            <h1 className="text-xl font-bold">askChain</h1>
          </div>

          <div className="flex items-center gap-4">
            <Badge variant="outline" className="border-green-500 text-green-400">
              {askTokens} ASK
            </Badge>
            <Avatar className="h-8 w-8 border border-green-500">
              <AvatarImage src="/placeholder.svg?height=32&width=32" />
              <AvatarFallback className="bg-green-900/30 text-green-500">
                {connectedAddress ? connectedAddress.substring(0, 2) : "??"}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm hidden md:inline">
              {connectedAddress ? 
                `${connectedAddress.substring(0, 6)}...${connectedAddress.substring(connectedAddress.length - 4)}` : 
                "Not connected"}
            </span>
            {session && (
              <Button 
                variant="outline" 
                size="sm" 
                className="border-green-500 text-green-500 flex items-center gap-1"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4">
        <Tabs defaultValue="agents" className="w-full">
          {/* Update the TabsList to include a "My Questions" tab */}
          <TabsList className="grid grid-cols-4 mb-8 bg-black border border-green-500">
            <TabsTrigger
              value="agents"
              className="data-[state=active]:bg-green-900/30 data-[state=active]:text-green-500"
            >
              AI Agents
            </TabsTrigger>
            <TabsTrigger
              value="questions"
              className="data-[state=active]:bg-green-900/30 data-[state=active]:text-green-500"
            >
              Community Questions
            </TabsTrigger>
            <TabsTrigger
              value="my-questions"
              className="data-[state=active]:bg-green-900/30 data-[state=active]:text-green-500"
            >
              My Questions
            </TabsTrigger>
            <TabsTrigger
              value="rewards"
              className="data-[state=active]:bg-green-900/30 data-[state=active]:text-green-500"
            >
              My Rewards
            </TabsTrigger>
          </TabsList>

          <TabsContent value="agents" className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">AI Agents</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <AgentCard
                title="Mathematics"
                icon={<Calculator className="h-8 w-8" />}
                description="Ask questions about algebra, calculus, statistics, and more"
                href="/agents/math"
              />
              <AgentCard
                title="Physics"
                icon={<Atom className="h-8 w-8" />}
                description="Ask questions about mechanics, thermodynamics, quantum physics, and more"
                href="/agents/physics"
              />
              <AgentCard
                title="Computer Science"
                icon={<Brain className="h-8 w-8" />}
                description="All in one AI agent to help with your code"
                href="/agents/computerscience"
              />
            </div>
          </TabsContent>

          {/* Update the questions TabsContent to sort questions by reward */}
          <TabsContent value="questions">
            <h2 className="text-2xl font-bold mb-4">Community Questions</h2>
            <div className="space-y-4">
              {questions
                .filter((q) => !q.isOwn)
                .sort((a, b) => b.reward - a.reward) // Sort by reward in descending order
                .map((question) => (
                  <QuestionCard
                    key={question.id}
                    id={question.id}
                    title={question.title}
                    category={question.category}
                    reward={question.reward}
                    answers={question.answers}
                    timeLeft={question.timeLeft}
                  />
                ))}
            </div>
          </TabsContent>

          {/* Add a new TabsContent for "My Questions" */}
          <TabsContent value="my-questions">
            <h2 className="text-2xl font-bold mb-4">My Questions</h2>
            {session ? (
              <div className="space-y-4">
                {questions
                  .filter((q) => q.isOwn)
                  .map((question) => (
                    <MyQuestionCard
                      key={question.id}
                      id={question.id}
                      title={question.title}
                      category={question.category}
                      reward={question.reward}
                      answers={question.answers}
                      timeLeft={question.timeLeft}
                    />
                  ))}
              </div>
            ) : (
              <div className="border border-green-500 rounded-md p-6 text-center">
                <p className="text-green-400">Please connect your wallet to view your questions</p>
                <Link href="/connect">
                  <Button className="mt-4 bg-green-700 hover:bg-green-600 text-white border border-green-500">
                    Connect Wallet
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>

          <TabsContent value="rewards">
            <h2 className="text-2xl font-bold mb-4">My Rewards</h2>
            {session ? (
              <div className="border border-green-500 rounded-md p-6 text-center">
                <Award className="h-16 w-16 mx-auto mb-4" />
                <h3 className="text-xl font-bold">Total Earned: 1.2 ASK</h3>
                <p className="text-green-400 mt-2">You've answered 3 questions and received 2 upvotes</p>
                <Button className="mt-4 bg-green-700 hover:bg-green-600 text-white border border-green-500">
                  Withdraw Rewards
                </Button>
              </div>
            ) : (
              <div className="border border-green-500 rounded-md p-6 text-center">
                <p className="text-green-400">Please connect your wallet to view your rewards</p>
                <Link href="/connect">
                  <Button className="mt-4 bg-green-700 hover:bg-green-600 text-white border border-green-500">
                    Connect Wallet
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

function AgentCard({ title, icon, description, href }) {
  return (
    <Link href={href}>
      <Card className="border-green-500 bg-black hover:bg-green-900/10 transition-colors cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle>{title}</CardTitle>
          </div>
          <CardDescription className="text-green-400">{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-end">
          <Button variant="outline" className="border-green-500 text-green-500">
            Ask Question
          </Button>
        </CardContent>
      </Card>
    </Link>
  )
}

// Update the QuestionCard component to include the id parameter
function QuestionCard({ id, title, category, reward, answers, timeLeft }) {
  return (
    <Card className="border-green-500 bg-black">
      <CardHeader>
        <div className="flex justify-between">
          <Badge variant="outline" className="border-green-500 text-green-400">
            {category}
          </Badge>
          <Badge className="bg-green-700 text-white">{reward} ASK</Badge>
        </div>
        <CardTitle className="text-lg mt-2">
          <div
            className="latex-content"
            dangerouslySetInnerHTML={{
              __html: title.replace(/\$\$(.*?)\$\$/g, (_, latex) => `\$$${latex}\$$`),
            }}
          />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="text-sm text-green-400">{answers} answers</span>
          </div>
          <div className="text-sm text-green-400">Ends in: {timeLeft}</div>
          <Link href={`/questions/${id}`}>
            <Button variant="outline" className="border-green-500 text-green-500">
              View Question
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

// Add the MyQuestionCard component at the end of the file
function MyQuestionCard({ id, title, category, reward, answers, timeLeft }) {
  const isExpired = timeLeft.includes("Expired") || Number.parseInt(timeLeft.split(" ")[0]) <= 0

  return (
    <Card className="border-green-500 bg-black">
      <CardHeader>
        <div className="flex justify-between">
          <Badge variant="outline" className="border-green-500 text-green-400">
            {category}
          </Badge>
          <Badge className="bg-green-700 text-white">{reward} ASK</Badge>
        </div>
        <CardTitle className="text-lg mt-2">
          <div
            className="latex-content"
            dangerouslySetInnerHTML={{
              __html: title.replace(/\$\$(.*?)\$\$/g, (_, latex) => `\$$${latex}\$$`),
            }}
          />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="text-sm text-green-400">{answers} answers</span>
          </div>
          <div className="text-sm text-green-400">{isExpired ? "Expired - Award Reward" : `Ends in: ${timeLeft}`}</div>
          <div className="flex gap-2">
            <Link href={`/questions/${id}`}>
              <Button variant="outline" className="border-green-500 text-green-500">
                View Answers
              </Button>
            </Link>
            {isExpired && answers > 0 && (
              <Link href={`/questions/${id}/award`}>
                <Button className="bg-green-700 hover:bg-green-600 text-white border border-green-500">
                  Award Reward
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}