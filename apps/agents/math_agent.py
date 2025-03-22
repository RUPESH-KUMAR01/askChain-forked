# Ignore this file completely!!

from langchain.prompts import ChatPromptTemplate
from langchain_huggingface import HuggingFacePipeline
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline

import torch
from transformers import TrainingArguments, Trainer, DataCollatorForLanguageModeling
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from datasets import Dataset

from pydantic import BaseModel
from dotenv import load_dotenv
from typing import List
from agent_utils import *
import os

load_dotenv()

class QuestionProfile(BaseModel):
    topics: List[str]
    question: str
    details: str

class MathAgent:
    def __init__(self, model_path=finetune_prefix+"_math", use_finetuned=True):
        if use_finetuned and os.path.exists(model_path):
            print("Loading fine-tuned model...")
            self.tokenizer = AutoTokenizer.from_pretrained(model_path, use_auth_token=os.getenv("HUGGINGFACE_TOKEN"))
            self.model = AutoModelForCausalLM.from_pretrained(model_path, use_auth_token=os.getenv("HUGGINGFACE_TOKEN"), torch_dtype=torch.float16, device_map="auto")
        else:
            print("Using base Llama-3 model...")
            self.tokenizer = AutoTokenizer.from_pretrained(base_model_name, use_auth_token=os.getenv("HUGGINGFACE_TOKEN"))
            self.model = AutoModelForCausalLM.from_pretrained(base_model_name, use_auth_token=os.getenv("HUGGINGFACE_TOKEN"), torch_dtype=torch.float16, device_map="auto")

        self.pipeline = pipeline("text-generation", model=self.model, tokenizer=self.tokenizer, device=0)
        self.llm = HuggingFacePipeline(pipeline=self.pipeline)
        
        self.math_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a university mathematics professor that is suited to help undergraduate students with their 
             mathematics-related questions. Make sure to use known and proven theorems while providing answers uniquely tailored to the student's query. 
             While answering, you should either (exclusive or)
             - provide adjacent theorems in full statement
             - quote the theorem and provide external links to articles related to the relevant theorems

             You are now an expert in the following topics: {topics}
             Make sure to not give too simplistic answers and make sure to not give too advanced answers.

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
            return response.content
        except Exception as e:
            raise AgentException(f"Error generating answer: {str(e)}") from e
        
    def finetune(self, training_data: List[dict], epochs: int = 3, batch_size: int = 4):
        """Fine-tunes the Llama-3 model and saves it in the same directory for incremental updates."""
        if not training_data:
            raise ValueError("Training data cannot be empty.")

        dataset = Dataset.from_list([{"text": f"Q: {item['question']}\nA: {item['answer']}"} for item in training_data])
        tokenized_dataset = dataset.map(lambda x: self.tokenizer(x["text"], truncation=True, padding="max_length"), batched=True)

        model_path = self.model.config._name_or_path
        os.makedirs(model_path, exist_ok=True)

        # LoRA fine-tuning configuration
        lora_config = LoraConfig(
            r=16,  
            lora_alpha=32,
            lora_dropout=0.05,
            bias="none",
            task_type="CAUSAL_LM"
        )

        # Prepare model for LoRA fine-tuning
        self.model = prepare_model_for_kbit_training(self.model)
        self.model = get_peft_model(self.model, lora_config)

        # Define training arguments
        training_args = TrainingArguments(
            output_dir=model_path,  # Save fine-tuned model to the same directory
            per_device_train_batch_size=batch_size,
            gradient_accumulation_steps=8,
            num_train_epochs=epochs,
            save_strategy="epoch",
            logging_dir=f"{model_path}/logs",
            logging_steps=10,
            fp16=True,
            evaluation_strategy="no"
        )

        # Data collator for batch processing
        data_collator = DataCollatorForLanguageModeling(
            tokenizer=self.tokenizer,
            mlm=False
        )

        # Initialize Trainer
        trainer = Trainer(
            model=self.model,
            args=training_args,
            train_dataset=tokenized_dataset,
            data_collator=data_collator
        )

        trainer.train()

        self.model.save_pretrained(model_path)
        self.tokenizer.save_pretrained(model_path)
        
        return f"Fine-tuned model updated at {model_path}"




# Dummy function to test new agents
def run_new_agent(topics: List[str], question: str, details: str):
    agent = MathAgent()

    q_prof = QuestionProfile(
        topics=topics,
        question=question,
        details=details
    )

    response = agent.get_math_answer(q_prof)
    return response

if __name__ == "__main__":
    print(run_new_agent(
        ["Linear Algebra", "Calculus"], 
        "How are matrices used in calculus?", 
        "I am struggling with the connection between the domains"
    ))
