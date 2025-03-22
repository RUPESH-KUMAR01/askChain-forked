import { type NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"

// In a real app, this would be a database
const questions = []

export async function GET(request: NextRequest) {
  // Get query parameters
  const url = new URL(request.url)
  const category = url.searchParams.get("category")

  // Filter questions by category if provided
  const filteredQuestions = category ? questions.filter((q) => q.category === category) : questions

  return NextResponse.json(filteredQuestions)
}

export async function POST(request: NextRequest) {
  try {
    const { title, content, category, reward, userId } = await request.json()

    if (!title || !content || !category || !reward || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const newQuestion = {
      id: uuidv4(),
      title,
      content,
      category,
      reward,
      userId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      answers: [],
      status: "open",
    }

    // In a real app, save to database
    questions.push(newQuestion)

    return NextResponse.json(newQuestion, { status: 201 })
  } catch (error) {
    console.error("Error creating question:", error)
    return NextResponse.json({ error: "Failed to create question" }, { status: 500 })
  }
}

