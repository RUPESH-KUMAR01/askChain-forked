"use client"
import { useState } from "react"
import { signIn, signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { BrowserProvider } from "ethers";

export default function ConnectWallet() {
  const { data: session } = useSession()
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const connectWallet = async () => {
    setIsConnecting(true)
    setError("")
    
    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum === "undefined") {
        throw new Error("MetaMask is not installed. Please install MetaMask extension.")
      }
      
      // Request account access
      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      
      const signer = await provider.getSigner();
      const walletAddress = await signer.getAddress();
      
      const message = "Sign this message to authenticate with AskChain";
      const signature = await signer.signMessage(message);
      
      // Sign in using NextAuth
      const res = await signIn("credentials", {
        redirect: false,
        walletAddress,
        signature,
        message
      });
      
      if (res?.error) {
        throw new Error(res.error);
      }
      
      router.push("/dashboard");
    } catch (err) {
      console.error("Connection error:", err);
      setError(err.message || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

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
          
          {session ? (
            <div className="p-4 border border-green-500 rounded-md">
              <p className="text-sm text-green-400">Connected Wallet:</p>
              <p className="font-mono break-all">{session.user.walletAddress}</p>
              <p className="mt-2 text-sm text-green-400">Registration Fee: 1 ETH</p>
              <p className="text-sm text-green-400">Tokens to Receive: 100 ASK</p>
            </div>
          ) : (
            <Button onClick={connectWallet} disabled={isConnecting} className="w-full bg-green-700 hover:bg-green-600">
              {isConnecting ? <Loader2 className="mr-2 animate-spin h-4 w-4" /> : "Connect MetaMask"}
            </Button>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          {session && (
            <Button onClick={() => signOut()} className="bg-red-700 hover:bg-red-600">
              Logout
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}