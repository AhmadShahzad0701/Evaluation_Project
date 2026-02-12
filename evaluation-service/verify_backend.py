import requests
import json
import time
import sys

URL = "http://localhost:8000/evaluate/"

def test_contract():
    print("Testing strict contract...")
    payload = {
        "question": "What is Machine Learning?",
        "student_answer": "Machine Learning is a subset of AI that enables systems to learn from data and improve from experience without being explicitly programmed.",
        "rubric": {
            "conceptual_understanding": 50,
            "completeness_length": 30,
            "language_clarity": 20
        },
        "max_score": 10
    }
    
    try:
        res = requests.post(URL, json=payload, timeout=30) # Increased timeout for initial load

        if res.status_code != 200:
            print(f"Error {res.status_code}: {res.text}")
            return

        data = res.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        # Verify structure
        expected_keys = ["final_score", "percentage", "grade", "rubric_breakdown", "metrics", "confidence"]
        for k in expected_keys:
            if k not in data:
                print(f"Missing key: {k}")
                return

        # Verify rubric breakdown keys
        rubric_keys = ["conceptual_understanding", "completeness_length", "language_clarity"]
        for k in rubric_keys:
            if k not in data["rubric_breakdown"]:
                 print(f"Missing rubric key: {k}")
                 return

        print("Contract Verified! Response structure is correct.")
        
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_contract()
