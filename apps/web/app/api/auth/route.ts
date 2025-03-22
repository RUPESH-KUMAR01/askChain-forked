import { NextResponse } from "next/server"
import { verifyMessage } from "ethers"
import prisma from "@/lib/db" // Updated import path

export async function POST(req: Request) {
  try {
    const { walletAddress, signature, message } = await req.json()
    
    if (!walletAddress || !signature || !message) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 })
    }
    
    // Verify the signature
    try {
      const recoveredAddress = verifyMessage(message, signature)
      
      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    } catch (err) {
      return NextResponse.json({ error: "Signature verification failed" }, { status: 401 })
    }
    
    // Find or create user
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
      // Update last login time
      await prisma.user.update({
        where: { walletAddress },
        data: { lastLogin: new Date() },
      })
    }
    
    console.log(`[Auth]: User ${walletAddress} authenticated successfully`)
    return NextResponse.json({ message: "User authenticated", user }, { status: 200 })
  } catch (error) {
    console.error("[Auth Error]:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}