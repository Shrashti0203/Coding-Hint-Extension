from flask import Flask, request,jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
import re
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("models/gemini-2.5-flash")

app= Flask(__name__)
CORS(app, resources={r"/*":{"origins":"*"}})

@app.route("/generate-hints",methods=["POST"])
def generate_hints():
    try:
        data=request.json
        title=data.get("title","")
        description=data.get("description","")

        prompt = f"""
    You are a programming mentor.
    A student is solving the following coding problem.
    Title: {title}
    Description:{description}
    Generate:
    1. Exactly 5 progressive hints
    2. 1 alternative hint (different approach)

    Rules:
    - No code
    - No final answer
    - Each hint must be clear and useful
    - Alternative hint must be different from the above hints

    Format strictly like:

    1. ...
    2. ...
    3. ...
    4. ...
    5. ...

    Alternative:
    Alt: ...
    """
        response=model.generate_content(prompt)
        text = response.text

        print("RAW RESPONSE:", text)

        lines = text.split("\n")

        hints = []
        alt_hint = "Try approaching the problem differently"

        for line in lines:
            line = line.strip()

            if re.match(r"^\d+\.", line):
                hints.append({
                    "text": re.sub(r"^\d+\.\s*", "", line)
                })

            elif line.lower().startswith("alt:"):
                alt_hint = line.replace("Alt:", "").strip()

        while len(hints) < 5:
            hints.append({"text": "Think step-by-step"})

        if not alt_hint:
            alt_hint = "Try approaching the problem differently"

        return jsonify({
            "hints": hints,
            "alt_hint": alt_hint
        })
    
    except Exception as e:
        print("ERROR:", e)
        
        return jsonify({
            "hints":[
                {"text": "Break the problem"},
                {"text": "Think step-by-step"},
                {"text": "Try brute force first"},
                {"text": "Optimize your approach"},
                {"text": "Check edge cases"}
            ],
            "alt_hint": "Try approaching the problem differently"
        }), 200
    
@app.route("/generate-explanation", methods=["POST"])
def generate_explanation():
    try:
        data = request.json
        title = data.get("title", "")
        description = data.get("description", "")

        prompt = f"""
    You are a programming mentor.

    A student is solving this problem:

    Title: {title}
    Description: {description}

    Provide a COMPLETE explanation.

    Structure:
    1. Intuition (why this approach works)
    2. Step-by-step approach
    3. Edge cases to consider

    Rules:
    - No direct code (or minimal pseudo only)
    - Keep it simple and clear
    - Make it beginner-friendly
    """

        try:
            response = model.generate_content(prompt)
            explanation = response.text if response.text else "No explanation generated."
        except:
            explanation = "Step 1: Understand the problem\nStep 2: Break into parts\nStep 3: Solve logically\nStep 4: Check edge cases"

        return jsonify({
            "explanation": explanation
        })

    except Exception as e:
        print("ERROR:", e)
        return jsonify({
            "explanation": "Try solving step-by-step using the hints again."
        }), 200

if __name__=="__main__":
    app.run(port=5000,debug=True)
    
    