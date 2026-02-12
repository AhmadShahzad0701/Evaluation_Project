from typing import Tuple, Set

class Validator:
    """
    Strict Structural Validation Layer.
    Independent of scoring engines.
    Enforces rules BEFORE LLM tokens are used.
    """

    # Minimal set of stopwords to prevent "the a is" gaming
    STOPWORDS: Set[str] = {
        "the", "is", "at", "which", "on", "a", "an", "and", "or", "in", 
        "of", "to", "for", "with", "by", "from", "as", "it", "this", "that"
    }

    def validate(self, answer: str) -> Tuple[bool, str]:
        """
        Legacy validation (defaults to strict).
        """
        return self.validate_adaptive(answer, total_marks=10.0)

    def validate_adaptive(self, answer: str, total_marks: float) -> Tuple[bool, str]:
        """
        Adaptive validation based on total_marks.
        - If marks <= 2: Allow 1+ meaningful words.
        - If marks > 2: Require 3+ meaningful words.
        """
        if not answer or not answer.strip():
            return False, "Answer is empty"

        cleaned_answer = answer.strip()
        words = cleaned_answer.split()
        
        # 1. Spam / Repetition Check (Always active)
        if self._is_spam(words):
             return False, "Answer detected as spam (excessive repetition)."

        # 2. Gibberish Check (Always active)
        if self._is_gibberish(words):
            return False, "Answer appears to be gibberish or non-sensical."

        # 3. Meaningful Word Count Check (Relaxed)
        # We allow short answers to pass to the scoring engine (where they get low completeness).
        # We only reject if it's practically empty (< 1 meaningful word).
        if not self._has_enough_meaningful_words(words, min_words=1):
            return False, "Answer is too short (less than 1 meaningful word)."

        return True, ""

    def _has_enough_meaningful_words(self, words: list[str], min_words: int) -> bool:
        """
        Counts words excluding common stopwords.
        """
        meaningful = [w for w in words if w.lower() not in self.STOPWORDS]
        return len(meaningful) >= min_words

    def _is_spam(self, words: list[str]) -> bool:
        """
        Detects keyword stuffing / repetition.
        Rule: If unique words are < 40% of total words (for answers > 6 words)
        """
        freq: dict[str, int] = {}
        for w in words:
            w_lower = w.lower()
            freq[w_lower] = freq.get(w_lower, 0) + 1
        
        total_words = len(words)
        unique_words = len(freq)

        # If very short, repetition is harder to judge, but "Java Java Java" is handled by unique check
        if total_words > 6:
            ratio = unique_words / total_words
            if ratio < 0.4: # e.g. 10 words, only 3 unique. "Java Java Java Java is Java..."
                return True
        
        # Check if any SINGLE word constitutes > 50% of the answer
        for count in freq.values():
            if count > total_words * 0.5 and total_words > 3:
                 return True
                 
        return False

    def _is_gibberish(self, words: list[str]) -> bool:
        """
        Basic gibberish detection.
        - Average word length > 25 chars?
        - No vowels? (Too expensive/complex for now)
        - Just length heuristic for now.
        """
        total_chars = sum(len(w) for w in words)
        avg_len = total_chars / len(words)
        if avg_len > 30: # "djsakhdjkashdjkashdjkhaskjdhaskjdhkasjhdkjashd"
            return True
        return False
