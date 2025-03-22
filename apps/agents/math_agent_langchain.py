from langchain.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq

from apps.agents.agent_utils import *
from dotenv import load_dotenv
import os

load_dotenv()

class MathAgent(Agent):
    def __init__(self, model=langchain_base_model):
        self.llm = ChatGroq(model_name=model, api_key=os.getenv("GROQ_API_KEY"))

        self.math_template = ChatPromptTemplate.from_messages([
            ("system", """You are a university mathematics professor that is suited to help undergraduate students with their 
             mathematics-related questions. Make sure to use known and proven theorems while providing answers uniquely tailored to the student's query. 
             Make sure to not give too simplistic answers and make sure to not give too advanced answers. You can keep the answer as long as you like but adjust it to the length appropriate for the complexity of the question asked.

             While answering, you should either (exclusive or)
             - provide adjacent theorems in full statement
             - quote the theorem and provide external links to articles related to the relevant theorems

             You are now an expert in the following topics: {topics}
             """),
            ("human", "Question: {question}, Additional details: {details}")
        ])

        self.query_chain = self.math_template | self.llm

    def resolve_query(self, user_profile: QuestionProfile) -> str:
        """Provide the question profile which includes topics of the question, the actual question, and any additional details from the asker."""
        try:
            response = self.query_chain.invoke({
                "topics": user_profile.topics,
                "question": user_profile.question,
                "details": user_profile.details
            })
            return response.content
        except Exception as e:
            raise AgentException(f"Error generating answer: {str(e)}") from e
        
    def finetune(self):
        """Placeholder for actual finetuning behavior for this specific kind of agent. Future issue"""

def run_agent(topics: List[str], question: str, details: str):
    agent = MathAgent()

    q_prof = QuestionProfile(
        topics=topics,
        question=question,
        details=details
    )

    response = agent.resolve_query(q_prof)
    return response

if __name__ == "__main__":
    agent = MathAgent()

    res = run_agent(
        agent,
        ["Linear Algebra"], 
        "What are orthogonal matrices and why are they useful?", 
        "I really don't understand the geometry of these matrices, can you focus more on their visual explanation?"
    )

    print(res)