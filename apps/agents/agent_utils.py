from pydantic import BaseModel
from typing import List
from abc import ABC, abstractmethod

class QuestionProfile(BaseModel):
    topics: List[str]
    question: str
    details: str

class Agent(ABC):
    @abstractmethod
    def finetune(self, *args, **kwargs) -> str:
        """Fine-tune the agent using given data. Arguments can vary by implementation."""
        pass

    @abstractmethod
    def resolve_query(self, user_profile: QuestionProfile, *args, **kwargs) -> str:
        """Resolve a query using the agent. Arguments can vary by implementation."""
        pass

class AgentException(Exception):
    """Custom exception class for handling errors in the MathAgent."""
    def __init__(self, message: str):
        super().__init__(message)


def run_agent(agent : Agent, topics: List[str], question: str, details: str):
    q_prof = QuestionProfile(
        topics=topics,
        question=question,
        details=details
    )

    response = agent.resolve_query(q_prof)
    return response

langchain_base_model = "llama3-70b-8192"
finetune_base_model_name = "Qwen/QwQ-32B"
finetune_prefix = "llama3_finetuned"