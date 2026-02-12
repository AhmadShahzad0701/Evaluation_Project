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
            "language_clarity": 10,
            "answer_completeness": 20,
            "spelling_accuracy": 10,
            "handling_incorrect": 5,
            "effort_bonus": 5
        },
        "max_score": 10
    }
    
    try:
        # Retry logic for server startup
        for i in range(10):
            try:
                res = requests.post(URL, json=payload, timeout=5)
                break
            except requests.exceptions.ConnectionError:
                print(f"Waiting for server... ({i+1}/10)")
                time.sleep(2)
        else:
            print("❌ Server unreachable")
            return

        if res.status_code != 200:
            print(f"❌ Error {res.status_code}: {res.text}")
            return

        data = res.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        
        # Verify structure
        expected_keys = ["final_score", "percentage", "grade", "rubric_breakdown", "metrics", "confidence"]
        for k in expected_keys:
            if k not in data:
                print(f"❌ Missing key: {k}")
                return

        # Verify rubric breakdown keys
        rubric_keys = ["conceptual_understanding", "language_clarity", "answer_completeness", "spelling_accuracy", "handling_incorrect", "effort_bonus"]
        for k in rubric_keys:
            if k not in data["rubric_breakdown"]:
                 print(f"❌ Missing rubric key: {k}")
                 return

        print("✅ Contract Verified! Response structure is correct.")
        
    except Exception as e:
        print(f"❌ Exception: {e}")

if __name__ == "__main__":
    test_contract()
