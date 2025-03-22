import { type NextRequest, NextResponse } from "next/server"
import { AgentService, type AgentType } from "@/lib/agents/agent-service"

const agentService = new AgentService()

export async function POST(request: NextRequest) {
  try {
    const { agentType, question } = await request.json()

    if (!agentType || !question) {
      return NextResponse.json({ error: "Agent type and question are required" }, { status: 400 })
    }

    if (!["math", "physics", "chemistry"].includes(agentType)) {
      return NextResponse.json({ error: "Invalid agent type. Must be math, physics, or chemistry" }, { status: 400 })
    }

    const response = await agentService.processQuestion(agentType as AgentType, question)

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error processing agent request:", error)
    return NextResponse.json({ error: "Failed to process question" }, { status: 500 })
  }
}

