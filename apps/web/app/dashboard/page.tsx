"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { Terminal, LogOut, Calculator, Atom, Brain, Award, Wallet, RefreshCw } from "lucide-react"
import Script from "next/script"
import { ethers } from "ethers"

// UI imports
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"

// Import your AskToken ABI and addresses from env
import { askTokenAbi } from "@/lib/abis/askTokenAbi"
const askTokenAddress = process.env.NEXT_PUBLIC_ASK_TOKEN_ADDRESS || ""
const askPlatformAddress = process.env.NEXT_PUBLIC_ASK_PLATFORM_ADDRESS || ""

// Helper to format date
function extractDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

// Improved AgentCard with better visual hierarchy
function AgentCard({ title, icon, description, href }: any) {
  return (
    <Link href={href}>
      <Card className="border-green-500 bg-black hover:bg-green-900/20 transition-all duration-300 cursor-pointer h-full hover:shadow-[0_0_15px_rgba(34,197,94,0.2)] group">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="bg-green-900/30 p-2 rounded-lg group-hover:bg-green-800/40 transition-colors">
              {icon}
            </div>
            <CardTitle className="text-xl">{title}</CardTitle>
          </div>
          <CardDescription className="text-green-400 mt-3 text-sm">{description}</CardDescription>
        </CardHeader>
        <CardFooter className="pt-4 pb-4 flex justify-end">
          <Button
            variant="outline"
            className="border-green-500 text-green-500 group-hover:bg-green-500 group-hover:text-black transition-colors"
          >
            Ask Question
          </Button>
        </CardFooter>
      </Card>
    </Link>
  )
}

// Enhanced QuestionCard with better spacing and visual hierarchy
function QuestionCard({ id, title, category, reward, timeLeft }: any) {
  const isExpired = new Date(timeLeft) < new Date()

  return (
    <Card className="border-green-500 bg-black hover:bg-green-900/10 transition-all duration-300 hover:shadow-[0_0_15px_rgba(34,197,94,0.15)]">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <Badge variant="outline" className="border-green-500 text-green-400 py-1">
            {category}
          </Badge>
          <Badge className="bg-green-700 text-white py-1 px-3">{reward} ASK</Badge>
        </div>
        <CardTitle className="text-lg mt-4">
          {/* Renders LaTeX if found in the title */}
          <div
            className="latex-content"
            dangerouslySetInnerHTML={{
              __html: title.replace(/\$\$(.*?)\$\$/g, (_, latex) => `\$$${latex}\$$`),
            }}
          />
        </CardTitle>
      </CardHeader>
      <CardFooter className="pt-2 flex justify-between items-center">
        <Badge
          variant={isExpired ? "destructive" : "outline"}
          className={isExpired ? "border-red-500 text-red-400" : "border-green-500 text-green-400"}
        >
          {isExpired ? "Expired" : "Up for Grabs"}
        </Badge>
        <div className="text-sm text-green-400">{extractDate(timeLeft)}</div>
        <Link href={`/questions/${id}`}>
          <Button
            variant="outline"
            className="border-green-500 text-green-500 hover:bg-green-500 hover:text-black transition-colors"
          >
            View Question
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const { toast } = useToast()

  // The user's wallet address from session
  const walletAddress = session?.user?.walletAddress || ""

  // States for showing real ASK balance & buying tokens
  const [askBalance, setAskBalance] = useState<string>("0")
  const [isBuying, setIsBuying] = useState<boolean>(false)
  const [desiredTokens, setDesiredTokens] = useState<string>("100") // default
  const [ethCost, setEthCost] = useState<string>("0.01") // cost for 100 tokens

  // For withdrawing tokens
  // Default is now "0" so the user must explicitly set the amount
  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false)
  const [withdrawTokens, setWithdrawTokens] = useState<string>("0") // default changed to "0"
  const [ethReturn, setEthReturn] = useState<string>("0") // default changed to "0"

  // Example: community questions + user questions
  const [questions, setQuestions] = useState<any[]>([])
  const [myQuestions, setMyQuestions] = useState<any[]>([])

  // On mount, fetch community questions
  useEffect(() => {
    fetchQuestions()
  }, [])

  // If user logs in, fetch their questions & balance
  useEffect(() => {
    if (session) {
      fetchMyQuestions()
      if (walletAddress) {
        fetchAskBalance()
      }
    }
  }, [session])

  // Recompute ethCost whenever desiredTokens changes
  useEffect(() => {
    if (!desiredTokens) {
      setEthCost("0")
      return
    }
    const tokensNum = Number.parseFloat(desiredTokens)
    if (isNaN(tokensNum) || tokensNum <= 0) {
      setEthCost("0")
      return
    }
    // cost in ETH = # tokens * 0.0001
    const cost = tokensNum * 0.0001
    setEthCost(cost.toString())
  }, [desiredTokens])

  // Recompute ethReturn whenever withdrawTokens changes
  useEffect(() => {
    if (!withdrawTokens) {
      setEthReturn("0")
      return
    }
    const tokensNum = Number.parseFloat(withdrawTokens)
    if (isNaN(tokensNum) || tokensNum <= 0) {
      setEthReturn("0")
      return
    }
    // returned ETH = # tokens * 0.0001
    const returned = tokensNum * 0.0001
    setEthReturn(returned.toString())
  }, [withdrawTokens])

  // If session is still loading, show a loading indicator
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-black text-green-500 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin">
            <RefreshCw className="h-8 w-8" />
          </div>
          <p className="text-green-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // 1. Fetch community questions
  async function fetchQuestions() {
    try {
      const res = await fetch("/api/questions")
      const data = await res.json()
      setQuestions(data)
    } catch (err) {
      console.error("Error fetching questions:", err)
    }
  }

  // 2. Fetch user's questions
  async function fetchMyQuestions() {
    if (!walletAddress) return
    try {
      const res = await fetch(`/api/questions?walletAddress=${walletAddress}`)
      const data = await res.json()
      setMyQuestions(data)
    } catch (err) {
      console.error("Error fetching user questions:", err)
    }
  }

  // 3. Fetch on-chain ASK balance
  async function fetchAskBalance() {
    if (!window.ethereum || !walletAddress) return
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const askToken = new ethers.Contract(askTokenAddress, askTokenAbi, provider)
      const bal = await askToken.balanceOf(walletAddress)
      const formatted = ethers.formatUnits(bal, 18)
      setAskBalance(formatted)
    } catch (error) {
      console.error("Error fetching ASK balance:", error)
      toast({
        title: "Balance Error",
        description: "Could not fetch your ASK balance",
        variant: "destructive",
      })
    }
  }

  // 4. Buy tokens
  async function buyAskTokens() {
    if (!window.ethereum) {
      toast({
        title: "MetaMask Required",
        description: "Please install or enable MetaMask",
        variant: "destructive",
      })
      return
    }

    const tokensNum = Number.parseFloat(desiredTokens)
    if (isNaN(tokensNum) || tokensNum <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid token amount",
        variant: "destructive",
      })
      return
    }

    try {
      setIsBuying(true)
      const provider = new ethers.BrowserProvider(window.ethereum)
      await provider.send("eth_requestAccounts", [])
      const signer = await provider.getSigner()

      const askToken = new ethers.Contract(askTokenAddress, askTokenAbi, signer)

      // cost in ETH is ethCost
      const tx = await askToken.buyTokens({
        value: ethers.parseEther(ethCost),
      })
      console.log("buyTokens tx:", tx.hash)

      await tx.wait()
      console.log("Transaction mined. Updating balance...")

      toast({
        title: "Purchase Successful",
        description: `Bought ${desiredTokens} ASK for ${ethCost} ETH!`,
      })

      // Refresh balance
      fetchAskBalance()
    } catch (err: any) {
      console.error("Error buying tokens:", err)
      toast({
        title: "Buy Error",
        description: err?.message || "Failed to buy tokens",
        variant: "destructive",
      })
    } finally {
      setIsBuying(false)
    }
  }

  // 5. Withdraw tokens
  async function withdrawAskTokens() {
    if (!window.ethereum) {
      toast({
        title: "MetaMask Required",
        description: "Please install or enable MetaMask",
        variant: "destructive",
      })
      return
    }

    const tokensNum = Number.parseFloat(withdrawTokens)
    if (isNaN(tokensNum) || tokensNum <= 0) {
      toast({
        title: "Invalid Withdraw Amount",
        description: "Please enter a valid token amount to withdraw",
        variant: "destructive",
      })
      return
    }

    try {
      setIsWithdrawing(true)
      const provider = new ethers.BrowserProvider(window.ethereum)
      await provider.send("eth_requestAccounts", [])
      const signer = await provider.getSigner()

      const askToken = new ethers.Contract(askTokenAddress, askTokenAbi, signer)

      // Convert the number of tokens to 18-decimal BigInt
      const tokenAmountWei = ethers.parseUnits(withdrawTokens, 18)

      // calls "withdrawEth(uint256 tokenAmount)" in AskToken
      const tx = await askToken.withdrawEth(tokenAmountWei)
      console.log("withdrawEth tx:", tx.hash)

      await tx.wait()
      console.log("Withdraw transaction mined. Updating balance...")

      toast({
        title: "Withdraw Successful",
        description: `Withdrew ${withdrawTokens} ASK for ${ethReturn} ETH!`,
      })

      // Refresh balance
      fetchAskBalance()
    } catch (err: any) {
      console.error("Error withdrawing tokens:", err)
      toast({
        title: "Withdraw Error",
        description: err?.message || "Failed to withdraw tokens",
        variant: "destructive",
      })
    } finally {
      setIsWithdrawing(false)
    }
  }

  // Logout
  async function handleLogout() {
    await signOut({ redirect: false })
    window.location.href = "/"
  }

  return (
    <div className="bg-black text-white min-h-screen">
      <Script
        id="mathjax-script"
        strategy="afterInteractive"
        src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
      />

      {/* HEADER */}
      <header className="border-b border-green-500/30 py-4 px-6 sticky top-0 z-10 backdrop-blur-md bg-black/80">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-green-900/30 p-2 rounded-full">
              <Terminal className="h-5 w-5 text-green-400" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-green-400 to-green-200 bg-clip-text text-transparent">
              askChain
            </h1>
          </div>

          <div className="flex items-center gap-6">
            {/* Display real on-chain ASK balance */}
            <Badge variant="outline" className="border-green-500 text-green-400 py-1.5 px-3 flex items-center gap-2">
              <Wallet className="h-3.5 w-3.5" />
              <span>{Number.parseFloat(askBalance).toFixed(2)} ASK</span>
            </Badge>

            {/* Avatar / address */}
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 border border-green-500 ring-2 ring-green-500/20">
                <AvatarImage src="/placeholder.svg?height=32&width=32" />
                <AvatarFallback className="bg-green-900/30 text-green-500">
                  {walletAddress ? walletAddress.substring(0, 2) : "??"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm hidden md:inline text-green-300">
                {walletAddress
                  ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`
                  : "Not connected"}
              </span>
            </div>
            {session && (
              <Button
                variant="outline"
                size="sm"
                className="border-green-500 text-green-500 hover:bg-green-500 hover:text-black transition-colors flex items-center gap-1.5"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8 px-6">
        <Tabs defaultValue="agents" className="w-full">
          <TabsList className="grid grid-cols-4 mb-10 bg-black border border-green-500 rounded-xl overflow-hidden">
            <TabsTrigger
              value="agents"
              className="data-[state=active]:bg-green-900/30 data-[state=active]:text-green-400 py-3 transition-all duration-300"
            >
              AI Agents
            </TabsTrigger>
            <TabsTrigger
              value="questions"
              className="data-[state=active]:bg-green-900/30 data-[state=active]:text-green-400 py-3 transition-all duration-300"
            >
              Community Questions
            </TabsTrigger>
            <TabsTrigger
              value="my-questions"
              className="data-[state=active]:bg-green-900/30 data-[state=active]:text-green-400 py-3 transition-all duration-300"
            >
              My Questions
            </TabsTrigger>
            <TabsTrigger
              value="rewards"
              className="data-[state=active]:bg-green-900/30 data-[state=active]:text-green-400 py-3 transition-all duration-300"
            >
              My Rewards
            </TabsTrigger>
          </TabsList>

          {/* Agents tab */}
          <TabsContent value="agents" className="space-y-6">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-green-200 bg-clip-text text-transparent">
                AI Agents
              </h2>
              {/* Removed: 'Create Custom Agent' button */}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <AgentCard
                title="Mathematics"
                icon={<Calculator className="h-6 w-6 text-green-400" />}
                description="Ask questions about algebra, calculus, statistics, and more"
                href="/agents/math"
              />
              <AgentCard
                title="Physics"
                icon={<Atom className="h-6 w-6 text-green-400" />}
                description="Ask questions about mechanics, thermodynamics, quantum physics, and more"
                href="/agents/physics"
              />
              <AgentCard
                title="Computer Science"
                icon={<Brain className="h-6 w-6 text-green-400" />}
                description="All in one AI agent to help with your code"
                href="/agents/computerscience"
              />
            </div>
          </TabsContent>

          {/* Community Questions */}
          <TabsContent value="questions">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-green-200 bg-clip-text text-transparent">
                Community Questions
              </h2>
              {/* Removed: 'Ask New Question' button */}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {questions.length > 0 ? (
                questions.map((q) => (
                  <QuestionCard
                    key={q.id}
                    id={q.id}
                    title={q.title}
                    category={q.category}
                    reward={q.reward}
                    timeLeft={q.createdAt}
                  />
                ))
              ) : (
                <div className="col-span-2 text-center py-16 border border-green-500/30 rounded-lg">
                  <p className="text-green-400 mb-4">No questions available at the moment</p>
                  {/* We can leave it blank or add something else if you want. */}
                </div>
              )}
            </div>
          </TabsContent>

          {/* My Questions */}
          <TabsContent value="my-questions">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-green-200 bg-clip-text text-transparent">
                My Questions
              </h2>
              {/* Removed: 'Ask New Question' button */}
            </div>
            {myQuestions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myQuestions.map((q) => (
                  <QuestionCard
                    key={q.id}
                    id={q.id}
                    title={q.title}
                    category={q.category}
                    reward={q.reward}
                    timeLeft={q.createdAt}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 border border-green-500/30 rounded-lg">
                <p className="text-green-400 mb-4">You haven't asked any questions yet.</p>
                {/* We can leave it blank or add something else if you want. */}
              </div>
            )}
          </TabsContent>

          {/* My Rewards */}
          <TabsContent value="rewards">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-green-200 bg-clip-text text-transparent mb-8">
              My Rewards
            </h2>
            {session ? (
              <div className="grid md:grid-cols-2 gap-8">
                {/* Card #1: Token Management */}
                <Card className="border-green-500 bg-black">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="bg-green-900/30 p-2 rounded-full">
                        <Award className="h-6 w-6 text-green-400" />
                      </div>
                      <CardTitle>Token Management</CardTitle>
                    </div>
                    <CardDescription className="text-green-400 mt-2">Buy or withdraw ASK tokens</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-green-900/10 rounded-lg border border-green-500/30">
                      <div>
                        <p className="text-sm text-green-400">Current Balance</p>
                        <p className="text-2xl font-bold text-green-300">
                          {Number.parseFloat(askBalance).toFixed(2)} ASK
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchAskBalance}
                        className="border-green-500 text-green-500"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                    </div>

                    {/* Buy Section */}
                    <div className="space-y-4 p-4 border border-green-500/30 rounded-lg">
                      <h4 className="text-lg font-semibold text-green-300 flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        Buy ASK Tokens
                      </h4>
                      <Separator className="bg-green-500/30" />
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm text-green-400 mb-1 block">Amount to buy</label>
                            <Input
                              type="number"
                              min="1"
                              className="border-green-500 bg-black text-green-200 focus:ring-green-500"
                              value={desiredTokens}
                              onChange={(e) => setDesiredTokens(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-sm text-green-400 mb-1 block">Cost in ETH</label>
                            <Input
                              type="text"
                              className="border-green-500 bg-black text-green-200"
                              value={ethCost}
                              readOnly
                            />
                          </div>
                        </div>
                        <p className="text-xs text-green-400">Exchange rate: 1 ASK = 0.0001 ETH</p>
                        <Button
                          onClick={buyAskTokens}
                          disabled={isBuying}
                          className="w-full bg-green-700 hover:bg-green-600 text-white border border-green-500"
                        >
                          {isBuying ? "Processing Transaction..." : "Buy Tokens"}
                        </Button>
                      </div>
                    </div>

                    {/* Withdraw Section */}
                    <WithdrawSection />
                  </CardContent>
                </Card>

                {/* Card #2: Activity & Rewards */}
                <Card className="border-green-500 bg-black">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="bg-green-900/30 p-2 rounded-full">
                        <Award className="h-6 w-6 text-green-400" />
                      </div>
                      <CardTitle>Activity & Rewards</CardTitle>
                    </div>
                    <CardDescription className="text-green-400 mt-2">
                      Track your contributions and earnings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-green-900/10 rounded-lg border border-green-500/30 text-center">
                        <p className="text-sm text-green-400">Questions Answered</p>
                        <p className="text-3xl font-bold text-green-300 mt-2">3</p>
                      </div>
                      <div className="p-4 bg-green-900/10 rounded-lg border border-green-500/30 text-center">
                        <p className="text-sm text-green-400">Upvotes Received</p>
                        <p className="text-3xl font-bold text-green-300 mt-2">2</p>
                      </div>
                    </div>
                    {/* 
                      Removed "Recent Activity" section and "Claim All Rewards" button
                      to meet your request to remove them.
                    */}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="border border-green-500 rounded-md p-8 text-center">
                <p className="text-green-400">Please connect your wallet to view your rewards</p>
                <Link href="/connect">
                  <Button className="mt-6 bg-green-700 hover:bg-green-600 text-white border border-green-500">
                    Connect Wallet
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t border-green-500/30 py-6 mt-12">
        <div className="container mx-auto px-6 text-center text-green-500/60 text-sm">
          &copy; {new Date().getFullYear()} askChain - Decentralized Knowledge Platform
        </div>
      </footer>
    </div>
  )

  // This inline component handles user input for how many tokens to withdraw
  // and calls `withdrawAskTokens()` when they click "Withdraw"
  function WithdrawSection() {
    const [withdrawTokensLocal, setWithdrawTokensLocal] = useState(withdrawTokens)
    const [ethReturnLocal, setEthReturnLocal] = useState(ethReturn)

    // Whenever local input changes, recalc ethReturn
    useEffect(() => {
      const tokensNum = Number.parseFloat(withdrawTokensLocal)
      if (!withdrawTokensLocal || isNaN(tokensNum) || tokensNum <= 0) {
        setEthReturnLocal("0")
      } else {
        const retVal = tokensNum * 0.0001
        setEthReturnLocal(retVal.toString())
      }
    }, [withdrawTokensLocal])

    // Handler to call parent's function
    async function handleWithdraw() {
      // update parent's state so it calls the parent's function
      setWithdrawTokens(withdrawTokensLocal)
      setEthReturn(ethReturnLocal)
      await withdrawAskTokens()
    }

    return (
      <div className="space-y-4 p-4 border border-green-500/30 rounded-lg">
        <h4 className="text-lg font-semibold text-green-300 flex items-center gap-2">
          <LogOut className="h-4 w-4" />
          Withdraw ASK Tokens
        </h4>
        <Separator className="bg-green-500/30" />
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-green-400 mb-1 block">Amount to withdraw</label>
              <Input
                type="number"
                min="0"
                className="border-green-500 bg-black text-green-200 focus:ring-green-500"
                value={withdrawTokensLocal}
                onChange={(e) => setWithdrawTokensLocal(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-green-400 mb-1 block">Return in ETH</label>
              <Input type="text" className="border-green-500 bg-black text-green-200" value={ethReturnLocal} readOnly />
            </div>
          </div>
          <p className="text-xs text-green-400">Exchange rate: 1 ASK = 0.0001 ETH</p>
          <Button
            onClick={handleWithdraw}
            disabled={isWithdrawing}
            className="w-full bg-red-700 hover:bg-red-600 text-white border border-red-500"
          >
            {isWithdrawing ? "Processing Transaction..." : "Withdraw Tokens"}
          </Button>
        </div>
      </div>
    )
  }
}
