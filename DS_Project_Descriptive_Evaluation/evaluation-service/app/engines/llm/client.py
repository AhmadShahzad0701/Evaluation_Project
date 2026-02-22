import os
import json
import httpx
import re
import time
import logging
import asyncio
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class LLMClient:
    OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

    def __init__(self, model: str):
        self.model = model

    async def send_prompt(self, prompt: str, retries: int = 1) -> Dict[str, Any]:
        api_key = os.getenv("OPENROUTER_API_KEY")

        if not api_key:
            raise RuntimeError("OPENROUTER_API_KEY not found in environment")

        payload = {
            "model": self.model,
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "temperature": 0, # Deterministic output
            "max_tokens": 500
        }

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost",
            "X-Title": "Evaluation Service"
        }

        last_error = None

        async with httpx.AsyncClient(timeout=45.0) as client:
            for attempt in range(retries + 1):
                try:
                    response = await client.post(
                        self.OPENROUTER_API_URL,
                        headers=headers,
                        json=payload
                    )

                    if response.status_code != 200:
                        error_msg = f"OpenRouter API Error {response.status_code}: {response.text}"
                        logger.warning(f"Attempt {attempt+1} failed: {error_msg}")
                        last_error = error_msg
                        await asyncio.sleep(1) # Backoff
                        continue

                    data = response.json()
                    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                    
                    if not content:
                        raise ValueError("Empty content from LLM")

                    return self._parse_json(content)

                except (httpx.RequestError, ValueError, RuntimeError) as e:
                    last_error = str(e)
                    logger.warning(f"Attempt {attempt+1} exception: {e}")
                    await asyncio.sleep(1)
        
        # If all retries fail
        logger.error(f"All LLM attempts failed. Last error: {last_error}")
        raise RuntimeError(f"LLM Interaction Failed: {last_error}")

    def _parse_json(self, content: str) -> Dict[str, Any]:
        """
        Robustly cleaner and parses JSON from LLM output.
        Removes markdown code blocks if present.
        """
        cleaned = content.strip()
        
        # Remove markdown code blocks ```json ... ```
        # Regex looks for ```json (content) ``` or just ``` (content) ```
        match = re.search(r"```(?:json)?\s*(.*)\s*```", cleaned, re.DOTALL)
        if match:
            cleaned = match.group(1).strip()
        
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as e:
            logger.error(f"JSON Decode Failed. Content: {content[:500]}...")
            raise RuntimeError(f"Invalid JSON format from LLM: {str(e)}")
