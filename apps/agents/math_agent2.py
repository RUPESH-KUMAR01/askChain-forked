from langchain.prompts import ChatPromptTemplate
from langchain_community.chat_models import ChatOllama
from pydantic import BaseModel
from agent_utils import *
from typing import List

class QuestionProfile(BaseModel):
    topics: List[str]
    question: str
    details: str

class MathAgent:
    def __init__(self, model="incept5/llama3.1-claude"):
        self.llm = ChatOllama(model=model)

        self.math_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a university mathematics professor that is suited to help undergraduate students with their 
             mathematics-related questions. Make sure to use known and proven theorems while providing answers uniquely tailored to the student's query.
             Make sure to not give too simplistic or advanced answers. You can keep the answer as long as you like but adjust it to the length appropriate for the complexity of the question asked. 
             While answering, you should either (exclusive or)
             - provide theorems in full statement with equations written in mathjax or markdown format
             - quote the theorem and provide external links to articles related to the relevant theorems

             You are now an expert in the following topics: {topics}"""
            ),
            ("human", "Question: {question}, Additional details: {details}")
        ])

        self.query_chain = self.math_prompt | self.llm

    def get_math_answer(self, user_profile: QuestionProfile) -> str:
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
        
        

# Example Usage
if __name__ == "__main__":
    agent = MathAgent()
    
    q_prof = QuestionProfile(
        topics=["Linear Algebra", "Calculus"],
        question="How are matrices used in calculus?",
        details="I am struggling with the connection between the domains."
    )

    response = agent.get_math_answer(q_prof)
    print(response)
