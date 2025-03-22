import { Button } from "@/components/ui/button"
import { Terminal } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black text-green-500 p-4">
      <div className="w-full max-w-5xl mx-auto flex flex-col items-center space-y-8">
        <div className="flex items-center gap-2 text-4xl font-bold">
          <Terminal className="h-10 w-10" />
          <h1>askChain</h1>
        </div>

        <div className="w-full border border-green-500 p-6 rounded-md bg-black/50 terminal-window">
          <div className="terminal-header flex items-center gap-2 mb-4">
            <div className="h-3 w-3 rounded-full bg-red-500"></div>
            <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
            <div className="ml-4 text-xs text-green-400">askChain@terminal:~</div>
          </div>

          <div className="space-y-4 font-mono">
            <p className="typing-effect">&gt; Welcome to askChain - A crypto-incentivized Q&A platform</p>
            <p>&gt; Ask questions to our specialized agents in mathematics, physics, and chemistry</p>
            <p>&gt; Post questions with ASK token rewards</p>
            <p>&gt; Earn rewards by providing valuable answers</p>
            <p className="flex items-center">
              &gt; <span className="animate-pulse ml-1">_</span>
            </p>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/connect">
              <Button className="bg-green-700 hover:bg-green-600 text-white border border-green-500">
                Connect Wallet
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" className="border-green-500 text-green-500 hover:bg-green-900/30">
                Enter as Guest
              </Button>
            </Link>
          </div>
        </div>

        <div className="text-center text-green-400 text-sm">
          <p>Register with 1 ETH to receive 100 ASK tokens</p>
          <p>Powered by Solidity, Next.js, and AI</p>
        </div>
      </div>
    </main>
  )
}

