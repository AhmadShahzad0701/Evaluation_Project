import os
import json
import requests
from typing import Dict, Any, Optional


class LLMClient:
    OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

    def __init__(self, model: str):
        self.model = model

    def send_prompt(self, prompt: str) -> Dict[str, Any]:
        api_key = os.getenv("OPENROUTER_API_KEY")

        if not api_key:
            raise RuntimeError("OPENROUTER_API_KEY not found in environment")

        payload = {
            "model": self.model,
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": 0,
            "max_tokens": 300
        }

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost",
            "X-Title": "Evaluation Service"
        }

        response = requests.post(
            self.OPENROUTER_API_URL,
            headers=headers,
            json=payload,
            timeout=120  # Increased from 60s to 120s for slower responses
        )

        if response.status_code != 200:
            raise RuntimeError(
                f"OpenRouter API Error {response.status_code}: {response.text}"
            )

        content = response.json()["choices"][0]["message"]["content"]

        try:
            return json.loads(content)
        except json.JSONDecodeError:
            raise RuntimeError(f"Invalid JSON from model: {content}")
