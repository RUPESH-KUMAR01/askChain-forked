"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function ConnectWallet() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState("")
  const [account, setAccount] = useState("")
  const router = useRouter()

  const connectWallet = async () => {
    setIsConnecting(true)
    setError("")

    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum === "undefined") {
        throw new Error("MetaMask is not installed")
      }

      // Request account access
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
      setAccount(accounts[0])

      // Simulate registration process
      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    } catch (err) {
      console.error(err)
      setError(err.message || "Failed to connect wallet")
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-green-500 p-4">
      <Card className="w-full max-w-md border-green-500 bg-black">
        <CardHeader>
          <CardTitle className="text-green-500">Connect Your Wallet</CardTitle>
          <CardDescription className="text-green-400">
            Connect your MetaMask wallet to register and receive 100 ASK tokens
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4 bg-red-900/20 border-red-500">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {account ? (
            <div className="p-4 border border-green-500 rounded-md">
              <p className="text-sm text-green-400">Connected Account:</p>
              <p className="font-mono break-all">{account}</p>
              <p className="mt-2 text-sm text-green-400">Registration Fee: 1 ETH</p>
              <p className="text-sm text-green-400">Tokens to Receive: 100 ASK</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 border border-dashed border-green-500 rounded-md">
              <p className="mb-4 text-center text-green-400">Connect your MetaMask wallet to continue</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          {account ? (
            <Button
              className="bg-green-700 hover:bg-green-600 text-white border border-green-500"
              onClick={() => router.push("/dashboard")}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                "Complete Registration"
              )}
            </Button>
          ) : (
            <Button
              className="bg-green-700 hover:bg-green-600 text-white border border-green-500"
              onClick={connectWallet}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect MetaMask"
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

