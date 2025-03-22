from langchain.prompts import ChatPromptTemplate
from langchain_community.chat_models import ChatOllama
from unsloth import FastLlamaModel, FastLanguageModel
from pydantic import BaseModel
import torch
from agent_utils import *
from typing import List, Tuple
import os

class QuestionProfile(BaseModel):
    topics: List[str]
    question: str
    details: str

class MathAgent:
    def __init__(self, base_model="unsloth/tinyllama-bnb-4bit", finetuned_model_dir="./finetuned_agent_math"):
        """Initialize the MathAgent with either a fine-tuned model or the base model."""
        self.base_model = base_model
        self.finetuned_model_dir = finetuned_model_dir

        if os.path.exists(self.finetuned_model_dir):
            print(f"Loading fine-tuned model from {self.finetuned_model_dir}...")
            self.llm, self.tokenizer = FastLanguageModel.from_pretrained(
                model_name=self.finetuned_model_dir,
                max_seq_length=2048,
                load_in_4bit=False,
                load_in_8bit=True,
            )
        else:
            print(f"Fine-tuned model not found. Falling back to base model: {self.base_model}")
            self.llm, self.tokenizer = FastLanguageModel.from_pretrained(
                model_name=self.base_model,
                max_seq_length=2048,
                load_in_4bit=False,
                load_in_8bit=True,
            )

        # # Define prompt template
        # self.math_prompt = ChatPromptTemplate.from_messages([
        #     ("system", """You are a university mathematics professor that is suited to help undergraduate students with their 
        #      mathematics-related questions. Make sure to use known and proven theorems while providing answers uniquely tailored to the student's query.
        #      Make sure to not give too simplistic or advanced answers. You can keep the answer as long as you like but adjust it to the length appropriate for the complexity of the question asked. 
        #      While answering, you should either (exclusive or)
        #      - provide theorems in full statement with equations written in mathjax or markdown format
        #      - quote the theorem and provide external links to articles related to the relevant theorems

        #      You are now an expert in the following topics: {topics}"""
        #     ),
        #     ("human", "Question: {question}, Additional details: {details}")
        # ])

        # self.query_chain = self.math_prompt | self.llm
    def format_prompt(self, topics, question, details):
        """Formats a structured prompt for Unsloth-based chat models."""
        return f"""<|system|>
You are a university mathematics professor that is suited to help undergraduate students with their mathematics-related questions.
Make sure to use known and proven theorems while providing answers uniquely tailored to the student's query.
Make sure to not give too simplistic or advanced answers.
You can keep the answer as long as you like but adjust it to the length appropriate for the complexity of the question asked.
While answering, you should either (exclusive or):
- Provide theorems in full statement with equations written in MathJax or Markdown format.
- Quote the theorem and provide external links to articles related to the relevant theorems.

You are now an expert in the following topics: {topics}

<|user|>
Question: {question}
Additional details: {details}

<|assistant|>
"""
    
    def get_math_answer(self, q_prof : QuestionProfile):
        topics = q_prof.topics
        question = q_prof.question
        details = q_prof.details

        
        """Generates an answer using the Unsloth fine-tuned model."""
        try:
            prompt = self.format_prompt(topics, question, details)
            inputs = self.tokenizer(prompt, return_tensors="pt").to("cuda" if torch.cuda.is_available() else "cpu")

            output = self.llm.generate(**inputs, max_length=4096, do_sample=True)
            response = self.tokenizer.decode(output[0], skip_special_tokens=True)

            return response.split("<|assistant|>")[-1].strip()  # Extract only the assistant's response
        except Exception as e:
            raise RuntimeError(f"Error generating answer: {str(e)}") from e

    def finetune(self, dataset : List[Tuple[str, str]], num_train_epochs: int = 3, batch_size: int = 2):
        """Fine-tune the agent on a given dataset and save the updated model for future incremental fine-tuning."""

        model_name = self.finetuned_model_dir if os.path.exists(self.finetuned_model_dir) else self.base_model
        model, tokenizer = FastLlamaModel.from_pretrained(
            model_name=model_name,
            load_in_8bit=False,
            load_in_4bit=True,
            torch_dtype=torch.float16
        )

        # Train with new dataset
        trainer = FastLlamaModel.finetune(
            model=model,
            tokenizer=tokenizer,
            dataset=dataset_path,
            output_dir=self.finetuned_model_dir,  # Save to same directory for incremental fine-tuning
            num_train_epochs=num_train_epochs,
            batch_size=batch_size
        )

        print(f"Fine-tuning complete! Updated model saved in {self.finetuned_model_dir}.")

        # Reload the updated model
        self.llm, self.tokenizer = FastLlamaModel.from_pretrained(
            model_name=self.finetuned_model_dir,
            load_in_8bit=False,
            load_in_4bit=True,
            torch_dtype=torch.float16
        )
        print("Updated fine-tuned model loaded successfully!")
        
        

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
