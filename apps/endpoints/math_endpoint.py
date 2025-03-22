from flask import Flask, Request, request, jsonify
from typing import List
from agents.math_agent import MathAgent, QuestionProfile 

app = Flask(__name__)
math_agent = MathAgent(model="llama3-70b-8192")

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
        
        q_prof = QuestionProfile(
            topics=topics,
            question=question,
            details=details
        )
        response = math_agent.get_math_answer(q_prof)

        return jsonify({"answer": response}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/math/finetune", methods=["POST"])
def fine_tune() -> jsonify:
    try:
        req: Request = request
        data: dict = req.json

        new_training_data: List[dict] = data.get("examples", [])

        if not new_training_data:
            return jsonify({
                "error": f"Missing required field 'examples'. Received: {data}"
            }), 400

        # response: str = fine_tune_model(new_training_data) #Have to replace this with actual fine tuning

        return jsonify({"message": response}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
