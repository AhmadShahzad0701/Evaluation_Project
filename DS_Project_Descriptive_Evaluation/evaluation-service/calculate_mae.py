import pandas as pd

df = pd.read_csv("phase1_with_system_scores.csv")

df["absolute_error"] = abs(df["human_score"] - df["system_score"])

mae = df["absolute_error"].mean()

print("📊 Mean Absolute Error (MAE):", round(mae, 3))
