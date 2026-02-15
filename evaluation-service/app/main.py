from pathlib import Path
from dotenv import load_dotenv
import os

# 🔍 Find .env by walking up directories
current_file = Path(__file__).resolve()
env_path = None

for parent in current_file.parents:
    candidate = parent / ".env"
    if candidate.exists():
        env_path = candidate
        break

if env_path is None:
    raise RuntimeError("❌ .env file NOT FOUND anywhere above main.py")

load_dotenv(env_path, override=True)

print("Loaded .env from:", env_path)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.evaluation_routes import router as evaluate_router

app = FastAPI(title="Evaluation Service")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# FastAPI app ka entry point
app.include_router(evaluate_router, prefix="/evaluate")

@app.get("/health")
def health_check():
    return {"status": "ok"}
