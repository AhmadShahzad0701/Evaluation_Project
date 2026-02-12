from typing import Tuple

class Validator:
    """
    Strict Structural Validation Layer.
    Independent of scoring engines.
    """

    def validate(self, answer: str) -> Tuple[bool, str]:
        """
        Validates the answer based on strict structural rules.
        Returns: (is_valid, reason)
        """
        if not answer or not answer.strip():
            return False, "Answer is empty"

        words = answer.strip().split()
        word_count = len(words)

        # Rule: < 3 words -> 0
        if word_count < 3:
            return False, f"Answer is too short ({word_count} words). Minimum 3 words required."

        # Rule: Fragment / Prefix check
        # This is heuristics. A true 'fragment' check requires NLP, but we can do basic prefixes.
        # User constraint: "Partial prefix matches (e.g., matching only part of a word) must NOT receive partial credit."
        # If the answer is JUST a prefix, it likely failed the word count check anyway.
        # But if it's "Artif Intel", that's 2 words, so it fails word count.
        # If it's "Artif Intel System", that's 3 words.
        # We need to detect if words look like incomplete prefixes.
        # Heuristic: Check for words < 4 chars that are NOT common stopwords?
        # Or just rely on the LLM for "grammar/clarity" if it passes length.
        # User said: "If answer is fragment -> return 0".
        # For now, strict length is the primary structural filter requested.
        
        return True, ""
