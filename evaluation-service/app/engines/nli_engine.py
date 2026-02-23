from typing import Optional
import torch
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModelForSequenceClassification


class NLIEngine:
    """
    Transformer-based NLI using a lightweight cross-encoder model.
    Returns entailment score between 0.0 and 1.0.
    """

    def __init__(self):
        model_name = "cross-encoder/nli-distilroberta-base"
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForSequenceClassification.from_pretrained(model_name)
        self.model.eval()

    def evaluate(
        self,
        question: str,
        student_answer: str,
        reference_answer: Optional[str] = None
    ) -> float:

        if not student_answer or student_answer.strip() == "":
            return 0.0

        # If no teacher reference → neutral
        if not reference_answer:
            return 0.5

        premise = reference_answer
        hypothesis = student_answer

        inputs = self.tokenizer(
            premise,
            hypothesis,
            return_tensors="pt",
            truncation=True,
            padding=True
        )

        with torch.no_grad():
            outputs = self.model(**inputs)

        logits = outputs.logits
        probs = F.softmax(logits, dim=1)

        # Model label mapping (cross-encoder/nli-distilroberta-base):
        #   index 0 = contradiction
        #   index 1 = entailment   ← correct index to use
        #   index 2 = neutral
        entailment_score = probs[0][1].item()

        return round(entailment_score, 3)
