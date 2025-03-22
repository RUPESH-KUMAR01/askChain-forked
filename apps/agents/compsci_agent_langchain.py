from langchain.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq

from apps.agents.agent_utils import *
from dotenv import load_dotenv
import os

load_dotenv()

class CompSciAgent(Agent):
    def __init__(self, model=langchain_base_model):
        self.llm = ChatGroq(model_name=model, api_key=os.getenv("GROQ_API_KEY"))

        self.compsci_template = ChatPromptTemplate.from_messages([
            ("system", """You are a university computer science professor that is suited to help undergraduate students with their 
             computer technology-related questions. Make sure to use known and proven theorems while providing answers uniquely tailored to the student's query. 
             Try your best to give simple answers as complexity is NOT favored but be thoroughly explicit in any prerequisites and prior setup if required. 
             You can keep the answer as long as you like but try to convey a chronological explanation/story if you're leading upto some kind of conclusion so that its more human-intuitive.
                
            Attempt to give external links to relevant reading or documentation if its applicable.
             You are now an expert in the following topics: {topics}
             """),
            ("human", "Question: {question}, Additional details: {details}")
        ])

        self.query_chain = self.compsci_template | self.llm

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

if __name__ == "__main__":
    agent = CompSciAgent()
    res = run_agent(
        agent,
        ["C++"], 
        "How does an array decay into a pointer when passed as a parameter?", 
        "I really don't understand how this could ever be useful..."
    )

    print(res)