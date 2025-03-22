from pydantic import BaseModel
from typing import List
from langchain.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq
from dotenv import load_dotenv
import os

load_dotenv()
openai_key = os.getenv("OPENAI_API_KEY")
print(openai_key)

class QuestionProfile(BaseModel):
    topics: List[str]
    question: str
    details: str

class MathAgent:
    def __init__(self, model="llama3-70b-8192"):
        self.llm = ChatGroq(model_name=model, api_key=os.getenv("GROQ_API_KEY"))

        self.math_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a university mathematics professor that is suited to help undergraduate students with their 
             mathematics-related questions. Make sure to use known and proven theorems while providing answers uniquely tailored to the student's query. 
             While answering, you should either (exclusive or)
             - provide adjacent theorems in full statement
             - quote the theorem and provide external links to articles related to the relevant theorems

             You are now an expert in the following topics: {topics}
             
             You can keep the answer as long as you like but adjust it to the length appropriate for the complexity of the question asked. """),
            ("human", "Topics for the current query: {topics}, Question: {question}, Additional details: {details}")
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
            return response.content  # ✅ Fix: Extract content correctly
        except Exception as e:
            return f"Error generating answer: {str(e)}"

def run_agent(topics: List[str], question: str, details: str):
    agent = MathAgent()

    q_prof = QuestionProfile(
        topics=topics,
        question=question,
        details=details
    )

    response = agent.get_math_answer(q_prof)
    return response

if __name__ == "__main__":
    print(run_agent(
        ["Linear Algebra", "Calculus"], 
        "How are matrices used in calculus?", 
        "I am struggling with the connection between the domains"
    ))
