from flask import Flask, Request, request, jsonify
from typing import List
from apps.agents.math_agent_langchain import MathAgent
from apps.agents.compsci_agent_langchain import CompSciAgent
from apps.agents.physics_agent_langchain import PhysicsAgent
from apps.agents.agent_utils import run_agent

app = Flask(__name__)

math_agent = MathAgent()
cs_agent = CompSciAgent()
phys_agent = PhysicsAgent()

@app.route("/math/ask", methods=["POST"])
def ask_math() -> jsonify:
    try:
        req: Request = request
        data: dict = req.json
        
        question: str = data.get("question", "")
        topics: List[str] = data.get("topics", [])
        details: str = data.get("details", "")

        if not question or not topics:
            return jsonify({"error": f"Missing required fields. Received following request load: {data}"}), 400
        
        response = run_agent(math_agent, topics, question, details)

        return jsonify({"answer": response}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route("/compsci/ask", methods=["POST"])
def ask_compsci() -> jsonify:
    try:
        req: Request = request
        data: dict = req.json
        
        question: str = data.get("question", "")
        topics: List[str] = data.get("topics", [])
        details: str = data.get("details", "")

        if not question or not topics:
            return jsonify({"error": f"Missing required fields. Received following request load: {data}"}), 400
        
        response = run_agent(cs_agent, topics, question, details)

        return jsonify({"answer": response}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route("/physics/ask", methods=["POST"])
def ask_physics() -> jsonify:
    try:
        req: Request = request
        data: dict = req.json
        
        question: str = data.get("question", "")
        topics: List[str] = data.get("topics", [])
        details: str = data.get("details", "")

        if not question or not topics:
            return jsonify({"error": f"Missing required fields. Received following request load: {data}"}), 400
        
        response = run_agent(phys_agent, topics, question, details)

        return jsonify({"answer": response}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
