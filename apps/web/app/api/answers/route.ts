import { type NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"

// In a real app, this would be a database
const answers = []

export async function GET(request: NextRequest) {
  // Get query parameters
  const url = new URL(request.url)
  const questionId = url.searchParams.get("questionId")

  if (!questionId) {
    return NextResponse.json({ error: "Question ID is required" }, { status: 400 })
  }

  // Filter answers by questionId
  const filteredAnswers = answers.filter((a) => a.questionId === questionId)

  return NextResponse.json(filteredAnswers)
}

export async function POST(request: NextRequest) {
  try {
    const { questionId, content, userId, contentType } = await request.json()

    if (!questionId || !content || !userId || !contentType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!["markdown", "loom"].includes(contentType)) {
      return NextResponse.json({ error: "Content type must be markdown or loom" }, { status: 400 })
    }

    const newAnswer = {
      id: uuidv4(),
      questionId,
      content,
      contentType,
      userId,
      createdAt: new Date().toISOString(),
      upvotes: 0,
      downvotes: 0,
    }

    // In a real app, save to database
    answers.push(newAnswer)

    return NextResponse.json(newAnswer, { status: 201 })
  } catch (error) {
    console.error("Error creating answer:", error)
    return NextResponse.json({ error: "Failed to create answer" }, { status: 500 })
  }
}

