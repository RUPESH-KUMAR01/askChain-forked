class AgentException(Exception):
    """Custom exception class for handling errors in the MathAgent."""
    def __init__(self, message: str):
        super().__init__(message)

base_model_name = "incept5/llama3.1-claude"
finetune_prefix = "llama3_finetuned"