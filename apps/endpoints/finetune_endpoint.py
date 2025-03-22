from flask import Flask, request, jsonify
from collections import defaultdict
from endpoint_utils import *
import json
import os

app = Flask(__name__)

def load_agent_data():
    """Load stored agent data from file if it exists."""
    if os.path.exists(data_file):
        with open(data_file, "r", encoding="utf-8") as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return defaultdict(list)
    return defaultdict(list)

def save_agent_data(agent_data):
    """Save agent data to file."""
    with open(data_file, "w", encoding="utf-8") as f:
        json.dump(agent_data, f, indent=4)

@app.route("/finetune", methods=["POST"])
def finetune_all():
    try:
        data = request.get_json()

        if not data or "data" not in data:
            return jsonify({"error": "Invalid JSON format, 'data' key missing"}), 400

        # Load existing stored data
        agent_data = load_agent_data()

        # Process new entries
        for entry in data["data"]:
            agent_name = entry.get("agent_name", "unknown")
            question = entry.get("question", "No question provided")
            answer = entry.get("answer", "No answer provided")

            if agent_name == "unknown" or question == "No question provided" or answer == "No answer provided":
                continue  # Skip invalid entries

            agent_data.setdefault(agent_name, []).append({"question": question, "answer": answer})

        # Save updated data
        save_agent_data(agent_data)

        return jsonify({"status": "Success! In the future, this will represent a succesful fine-tuning operation but for now it is a placeholder.", "errors": None}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
