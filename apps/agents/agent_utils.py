class AgentException(Exception):
    """Custom exception class for handling errors in the MathAgent."""
    def __init__(self, message: str):
        super().__init__(message)

base_model_name = "meta-llama/Meta-Llama-3-8B"
finetune_prefix = "llama3_finetuned"