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
        res = requests.post(URL, json=payload, timeout=150) # Increased timeout for slow LLM

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

        print("\nTesting Length Sensitivity...")
        
        short_answer = "ML is learning from data."
        
        # Test 1: High Marks (10) -> Expect Low Completeness
        payload_high = {
            "question": "What is Machine Learning?",
            "student_answer": short_answer,
            "rubric": {"conceptual_understanding": 50, "completeness_length": 30, "language_clarity": 20},
            "max_score": 10
        }
        res_high = requests.post(URL, json=payload_high).json()
        score_high = res_high["rubric_breakdown"]["completeness_length"]
        print(f"High Marks (10) Completeness Score: {score_high}")

        # Test 2: Low Marks (2) -> Expect High Completeness
        payload_low = {
            "question": "What is Machine Learning?",
            "student_answer": short_answer,
            "rubric": {"conceptual_understanding": 50, "completeness_length": 30, "language_clarity": 20},
            "max_score": 2
        }
        res_low = requests.post(URL, json=payload_low).json()
        score_low = res_low["rubric_breakdown"]["completeness_length"]
        print(f"Low Marks (2) Completeness Score: {score_low}")

        if score_low > score_high:
            print("✅ SUCCESS: Low marks received higher completeness for short answer.")
        else:
            print("⚠️ WARNING: Length sensitivity might need tuning.")
        
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_contract()
