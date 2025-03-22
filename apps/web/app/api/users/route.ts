import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(request) {
  try {
    console.log("Fetching upvotes received started")
    const { searchParams } = new URL(request.url)
    const walletAddress = searchParams.get('walletAddress')
    
    console.log("Request data:", { walletAddress })
    
    if (!walletAddress) {
      console.log("Validation failed: Missing wallet address")
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      )
    }
    
    console.log("Finding user with wallet address:", walletAddress)
    const user = await prisma.user.findUnique({
      where: { walletAddress }
    })

    if (!user) {
      console.log("User not found with wallet address:", walletAddress)
      return NextResponse.json(
        { error: "User not found. Please connect your wallet first." },
        { status: 404 }
      )
    }
    
    console.log("User found:", user.id)
    
    // Find all answers by this user
    const userAnswers = await prisma.answer.findMany({
      where: {
        responderId: user.id
      }
    })
    
    console.log(`Found ${userAnswers.length} answers by user`)
    
    if (userAnswers.length === 0) {
      return NextResponse.json({ upvotes: 0, votedAnswers: [] }, { status: 200 })
    }
    
    // Get the answer IDs
    const answerIds = userAnswers.map(answer => answer.id)
    
    // Find all votes for these answers
    const votesReceived = await prisma.vote.findMany({
      where: {
        answerId: {
          in: answerIds
        }
      },
      include: {
        answer: true,
        voter: {
          select: {
            id: true,
            walletAddress: true
          }
        }
      }
    })
    
    console.log(`Found ${votesReceived.length} upvotes received by user's answers`)
    
    // Group votes by answer for more structured data
    const votedAnswers = answerIds.map(answerId => {
      const answerVotes = votesReceived.filter(vote => vote.answerId === answerId)
      const answer = userAnswers.find(a => a.id === answerId)
      
      return {
        answerId,
        questionId: answer.questionId,
        content: answer.content,
        createdAt: answer.createdAt,
        upvotes: answerVotes.length,
        voters: answerVotes.map(vote => vote.voter)
      }
    })
    
    // Return total upvotes and detailed information
    return NextResponse.json({
      upvotes: votesReceived.length,
      votedAnswers
    }, { status: 200 })
  } catch (err) {
    console.log("Error fetching received upvotes", err)
    return NextResponse.json(
      { error: "Failed to fetch received upvotes", message: err.message },
      { status: 500 }
    )
  }
}   