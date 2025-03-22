import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { verifyMessage } from "ethers"
import prisma from "@/lib/prisma" // Updated import path

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "MetaMask",
      credentials: {
        walletAddress: { label: "Wallet Address", type: "text" },
        signature: { label: "Signature", type: "text" },
        message: { label: "Message", type: "text" }
      },
      async authorize(credentials) {
        const { walletAddress, signature, message } = credentials as {
          walletAddress: string;
          signature: string;
          message: string;
        }
        
        if (!walletAddress || !signature || !message) {
          throw new Error("Missing credentials")
        }
        
        // Verify Signature
        try {
          const recoveredAddress = verifyMessage(message, signature)
          
          if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
            throw new Error("Invalid signature")
          }
        } catch (err) {
          throw new Error("Signature verification failed")
        }
        
        // Check if user exists in DB
        let user = await prisma.user.findUnique({
          where: { walletAddress },
        })
        
        if (!user) {
          user = await prisma.user.create({
            data: { 
              walletAddress, 
              askTokens: 100,
              lastLogin: new Date() 
            },
          })
        } else {
          await prisma.user.update({
            where: { walletAddress },
            data: { lastLogin: new Date() },
          })
        }
        
        return {
          id: user.id,
          walletAddress: user.walletAddress,
          askTokens: user.askTokens
        }
      }
    })
  ],
  callbacks: {
    async session({ session, token }) {
      session.user = {
        ...session.user,
        walletAddress: token.walletAddress
      }
      return session
    },
    async jwt({ token, user }) {http://localhost:3000/connect
      if (user) {
        token.walletAddress = user.walletAddress
      }
      return token
    }
  },
  secret: 'secret-askchain',
  session: {
    strategy: "jwt"
  }
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }