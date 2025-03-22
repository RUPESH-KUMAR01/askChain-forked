Run `pip install -r requirements.txt` while your virtual environment is active to get the required libraries for running agents and endpoints. Also ensure that you have a `.env` file **in the root directory of this whole project** with your `GROQ_API_KEY`.

To run endpoints as a standalone server (from project directory):
1. ask_endpoints - `python -m apps.endpoints.ask_endpoints.py`
2. finetune_endpoint - `python -m apps.endpoints.finetune_endpoint.py`