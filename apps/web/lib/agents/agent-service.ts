import { MathAgent } from "./math-agent"
import { PhysicsAgent } from "./physics-agent"
import { ChemistryAgent } from "./chemistry-agent"

export type AgentType = "math" | "physics" | "chemistry"

export interface AgentResponse {
  answer: string
  confidence: number
}

export class AgentService {
  private mathAgent: MathAgent
  private physicsAgent: PhysicsAgent
  private chemistryAgent: ChemistryAgent

  constructor() {
    this.mathAgent = new MathAgent()
    this.physicsAgent = new PhysicsAgent()
    this.chemistryAgent = new ChemistryAgent()
  }

  async processQuestion(agentType: AgentType, question: string): Promise<AgentResponse> {
    switch (agentType) {
      case "math":
        return this.mathAgent.processQuestion(question)
      case "physics":
        return this.physicsAgent.processQuestion(question)
      case "chemistry":
        return this.chemistryAgent.processQuestion(question)
      default:
        throw new Error(`Unknown agent type: ${agentType}`)
    }
  }
}

