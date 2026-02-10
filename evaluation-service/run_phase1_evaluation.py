import pandas as pd
import requests
import time

API_URL = "http://127.0.0.1:8000/evaluate/"

# Load dataset
df = pd.read_csv("phase1_final_dataset.csv")

system_scores = []

for idx, row in df.iterrows():
    payload = {
        "evaluations": [
            {
                "student_id": f"S{idx}",
                "question_id": row["question_id"],
                "question_type": "descriptive",
                "question": row["question"],
                "student_answer": row["student_answer"],
                "model_answer": row["question"],  # simple baseline
                "rubric": {
                    "content": int(row["max_score"])
                },
                "max_score": int(row["max_score"])
            }
        ]
    }

    response = requests.post(API_URL, json=payload)

    if response.status_code != 200:
        print(f"❌ Error at row {idx}: {response.text}")
        system_scores.append(None)
        continue

    result = response.json()["results"][0]
    system_scores.append(result["obtained_marks"])

    time.sleep(1)  # rate limit safety

df["system_score"] = system_scores
df.to_csv("phase1_with_system_scores.csv", index=False)

print("✅ Phase-1 evaluation completed.")
print("📄 Output file created: phase1_with_system_scores.csv")
