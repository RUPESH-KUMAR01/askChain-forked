from flask import Flask, request, jsonify
from collections import defaultdict
from typing import List

from apps.endpoints.ask_endpoints import math_agent

app = Flask(__name__)

@app.route("/finetune", methods=["POST"])
def finetune_all():
    try:
        data = request.get_json()

        if not data or "data" not in data:
            return jsonify({"error": "Invalid JSON format, 'data' key missing"}), 400
        agent_data = defaultdict(list)

        for entry in data["data"]:
            agent_name = entry.get("agent_name", "unknown")
            question = entry.get("question", "No question provided")
            answer = entry.get("answer", "No answer provided")

            if(agent_name=="unknown" or question=="No question provided" or answer=="No answer provided"):
                continue
            agent_data[agent_name].append({"question": question, "answer": answer})

        errors = {}
        for agent_name, qa_pairs_list in agent_data.items():
            if(agent_name=="math"):
                math_agent.finetune(qa_pairs_list)
            # TODO: Add the rest of the subjects...

        # If any errors occurred, return them
        if errors:
            return jsonify({"status": "error", "errors": errors}), 500

        return jsonify({"status": "success", "errors": None}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
