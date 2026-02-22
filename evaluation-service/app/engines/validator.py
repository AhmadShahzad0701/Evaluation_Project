import re
from typing import Tuple, Set


class Validator:
    """
    Structural Validation Layer — runs BEFORE the LLM to filter
    obviously invalid input.

    All checks are independent of domain or subject matter.
    """

    # Common stopwords to filter for meaningful word count checks
    STOPWORDS: Set[str] = {
        "the", "is", "at", "which", "on", "a", "an", "and", "or", "in",
        "of", "to", "for", "with", "by", "from", "as", "it", "this", "that"
    }

    # Maximum character total below which consonant/length heuristics are
    # SKIPPED — protects short-form answers and technical acronyms.
    # "AI" = 2 chars, "Islamabad" = 9 chars, "TCP/IP" = 6 chars — all safe.
    # Set to 10: strings of 10+ chars are long enough to reliably apply
    # the consonant-ratio check without risking false positives on real words.
    SHORT_ANSWER_CHAR_LIMIT = 10

    def validate(self, answer: str) -> Tuple[bool, str]:
        """
        Legacy validation entry-point — delegates to adaptive.
        """
        return self.validate_adaptive(answer, total_marks=10.0)

    def validate_adaptive(self, answer: str, total_marks: float) -> Tuple[bool, str]:
        """
        Adaptive validation.
        Runs before any scoring engine or LLM call.

        Checks (in order):
        1. Empty / blank answer.
        2. Spam / excessive repetition.
        3. Meaningful Text Check (gibberish / symbolic / no-letter strings).
        4. Minimum meaningful word count (at least 1 non-stopword token).
        """
        if not answer or not answer.strip():
            return False, "Answer is empty."

        cleaned = answer.strip()
        words   = cleaned.split()

        # ── 1. Spam / repetition ──────────────────────────────────────────
        if self._is_spam(words):
            return False, "Answer detected as spam (excessive repetition)."

        # ── 2. Meaningful Text / Gibberish Check ──────────────────────────
        is_gibberish, reason = self._is_gibberish(cleaned, words)
        if is_gibberish:
            return False, reason

        # ── 3. Minimum meaningful word count ──────────────────────────────
        if not self._has_enough_meaningful_words(words, min_words=1):
            return False, "Answer is too short (less than 1 meaningful word)."

        return True, ""

    # ─────────────────────────────────────────────────────────────────────────
    # Internal helpers
    # ─────────────────────────────────────────────────────────────────────────

    def _has_enough_meaningful_words(self, words: list, min_words: int) -> bool:
        meaningful = [w for w in words if w.lower() not in self.STOPWORDS]
        return len(meaningful) >= min_words

    def _is_spam(self, words: list) -> bool:
        """
        Detects keyword stuffing / word repetition.
        Rule: unique words < 40% of total (only for answers > 6 words).
        Additionally, any single word that accounts for > 50% of a > 3 word answer.
        """
        if not words:
            return False

        freq: dict = {}
        for w in words:
            key = w.lower()
            freq[key] = freq.get(key, 0) + 1

        total_words  = len(words)
        unique_words = len(freq)

        if total_words > 6 and (unique_words / total_words) < 0.4:
            return True

        for count in freq.values():
            if count > total_words * 0.5 and total_words > 3:
                return True

        return False

    def _is_gibberish(self, cleaned: str, words: list) -> Tuple[bool, str]:
        """
        Two-stage gibberish detection:

        Stage A — Unconditional (applies to all lengths):
            • No alphabetic characters at all → e.g. "123@#$", "??? !!!"
              These are never valid regardless of answer length.

        Stage B — Heuristics (SKIPPED if total characters < SHORT_ANSWER_CHAR_LIMIT):
            • Average word length > 30 chars (runaway gibberish string)
            • Consonant-to-vowel ratio > 6:1 in the whole cleaned string
              (detects "zxcvbnm", "sdkjhsdkjh")

        The SHORT_ANSWER_CHAR_LIMIT exemption protects:
            - Single-word entities: "Islamabad" (9 chars)
            - Acronyms: "AI", "ML", "API", "TCP/IP"
            - Short technical terms: any legitimate answer ≤ 15 chars
        """
        # ── Stage A: No letters at all ────────────────────────────────────
        letters_only = re.sub(r'[^a-zA-Z]', '', cleaned)
        if len(letters_only) == 0:
            return True, "Answer contains no recognizable words (appears to be symbols/numbers only)."

        # ── Acronym-safe gate ─────────────────────────────────────────────
        # Skip all character-level heuristics for short inputs.
        if len(cleaned) < self.SHORT_ANSWER_CHAR_LIMIT:
            return False, ""

        # ── Stage B: Length heuristic ─────────────────────────────────────
        if words:
            avg_len = sum(len(w) for w in words) / len(words)
            if avg_len > 30:
                return True, "Answer appears to be gibberish (unusually long token detected)."

        # ── Stage B: Consonant-to-vowel ratio ────────────────────────────
        vowels_count     = len(re.findall(r'[aeiouAEIOU]', letters_only))
        consonants_count = len(letters_only) - vowels_count

        if vowels_count == 0 and consonants_count > 4:
            # e.g. "zxcvbnm", "sdkjhsdkjh" — no vowels, > 4 consonants
            return True, "Answer appears to be gibberish (no vowels detected)."

        if vowels_count > 0 and (consonants_count / vowels_count) > 6:
            # Extreme consonant dominance
            return True, "Answer appears to be gibberish (consonant-to-vowel ratio too high)."

        return False, ""
