import re
from typing import Dict, Optional, List, Set, Tuple, Any


class DescriptiveEngine:
    """
    Rubric-based evaluation engine for descriptive answers.
    Uses keyword matching, length analysis, and concept coverage.
    """
    
    DEFAULT_RUBRIC = {
        "Conceptual Understanding": 5,
        "Clarity": 3,
        "Completeness": 2
    }
    
    def _normalize_text(self, text: str) -> Set[str]:
        """Normalize text to lowercase tokens, removing punctuation."""
        text = text.lower()
        text = re.sub(r'[^a-z0-9\s]', '', text)
        return set(text.split())
    
    def _extract_key_terms(self, text: str) -> Set[str]:
        """
        Extract important terms (words longer than 3 characters OR uppercase acronyms).
        This ensures we capture both regular keywords and acronyms like AI, ML, NLP.
        """
        # Get original tokens and remove punctuation to detect acronyms
        original_tokens = text.split()
        acronyms = set()
        for word in original_tokens:
            # Remove punctuation for acronym check
            clean_word = re.sub(r'[^a-zA-Z0-9]', '', word)
            if clean_word.isupper() and len(clean_word) >= 2:
                acronyms.add(clean_word.lower())
        
        # Get normalized tokens
        tokens = self._normalize_text(text)
        
        # Include words >3 chars OR acronyms
        key_terms = {word for word in tokens if len(word) > 3}
        key_terms.update(acronyms)
        
        return key_terms
    
    def validate_answer(self, answer: str) -> tuple[bool, str]:
        """
        Strict structural validation of the answer.
        Returns (is_valid, reason)
        """
        if not answer or not answer.strip():
            return False, "Answer is empty"
            
        # 1. Check word count (Rule: < 3 meaningful words = 0)
        # We'll rely on a simple split for now, but "meaningful" implies ignoring stopwords.
        # For strictness, let's just count total words first.
        words = answer.strip().split()
        if len(words) < 3:
            # Exception: "Complete and correct concept"
            # Since we can't easily judge "correct concept" without semantic analysis,
            # we will rely on a very strict length check for now as requested by user pseudo-code:
            # if word_count < 3: return 0.0
            return False, "Answer is too short (less than 3 words)"
            
        # 2. Check for fragments (heuristic: ends with typical sentence enders? 
        # No, that might be too strict for bullet points. 
        # But "fragmented" or "partial word" is mentioned).
        # We can check if the last word looks complete. 
        # For now, we'll assume the LLM or further checks handle subtle fragments, 
        # but the length check covers "Artif".
        
        return True, ""

    def _is_unattempted_or_wrong(self, answer: str, question: str) -> tuple[bool, str]:
        """
        Detect if answer is unattempted, completely wrong, or invalid.
        
        Returns:
            (is_wrong, reason) tuple
        """
        # strict validation first
        is_valid, reason = self.validate_answer(answer)
        if not is_valid:
            return True, reason

        answer_lower = answer.lower().strip()
        
        # Common "I don't know" phrases
        UNATTEMPTED_PHRASES = {
            "i don't know", "i dont know", "idk", "no idea", 
            "don't know", "dont know", "not sure", "no clue",
            "i have no idea", "i am not sure", "im not sure",
            "i do not know", "i dunno", "dunno", "not known",
            "unknown", "can't say", "cannot say", "cant say"
        }
        
        # Check for exact phrase matches
        for phrase in UNATTEMPTED_PHRASES:
            if phrase in answer_lower:
                return True, f"Answer contains '{phrase}' - marked as unattempted"
        
        # Check if answer is just "no" or very short denial
        if answer_lower in {"no", "nope", "nah", "na", "nothing", "none"}:
            return True, "Answer is a simple denial or 'nothing'"
        
        # Check for completely wrong answers (zero conceptual overlap)
        question_terms = self._extract_key_terms(question)
        answer_terms = self._extract_key_terms(answer)
        
        # Only flag as wrong if BOTH conditions are met:
        # 1. Zero overlap with question concepts
        # 2. Short answer (5 words or less)
        if question_terms and len(answer.split()) <= 5:
            overlap = len(question_terms.intersection(answer_terms))
            if overlap == 0:
                return True, "Answer has zero conceptual overlap with question"
        
        return False, ""

    
    def _score_conceptual_understanding(
        self: "DescriptiveEngine", 
        question: str, 
        answer: str, 
        max_points: int
    ) -> int:
        """
        Score based on conceptual understanding.
        Works for ANY subject (Math, History, Science, etc.) by checking:
        1. Keyword overlap with question
        2. Elaboration (new relevant terms introduced)
        """
        question_terms = self._extract_key_terms(question)
        answer_terms = self._extract_key_terms(answer)
        
        if not question_terms:
            # If no key terms in question, use answer length as proxy
            word_count = len(answer.split())
            if word_count >= 15:
                return max_points
            elif word_count >= 10:
                return int(max_points * 0.7)
            else:
                return int(max_points * 0.5)
        
        # Calculate overlap ratio
        overlap = len(question_terms.intersection(answer_terms))
        coverage_ratio = overlap / len(question_terms) if question_terms else 0
        
        # Check if answer introduces relevant new terms (not just repeating question)
        answer_only_terms = answer_terms - question_terms
        has_elaboration = len(answer_only_terms) >= 2  # At least 2 new relevant terms
        
        # Score based on coverage + elaboration
        if coverage_ratio >= 0.7:
            # High overlap with question concepts
            if has_elaboration:
                return max_points  # Perfect: covers concepts AND elaborates
            else:
                return int(max_points * 0.85)  # Good coverage but minimal elaboration
        elif coverage_ratio >= 0.5:
            # Moderate overlap
            if has_elaboration:
                return int(max_points * 0.80)
            else:
                return int(max_points * 0.65)
        elif coverage_ratio >= 0.3:
            # Some overlap
            if has_elaboration:
                return int(max_points * 0.65)
            else:
                return int(max_points * 0.50)
        else:
            # Low/no overlap - might be wrong or very different approach
            if has_elaboration and len(answer.split()) >= 10:
                # Long answer with new terms might still be valid
                return int(max_points * 0.45)
            else:
                return int(max_points * 0.30)
    
    def _score_clarity(self: "DescriptiveEngine", answer: str, max_points: int) -> int:
        """
        Score based on answer structure and clarity.
        Considers length, sentence count, and word diversity.
        """
        words = answer.split()
        word_count = len(words)
        
        # Penalize very short answers
        if word_count < 5:
            return int(max_points * 0.3)
        elif word_count < 10:
            return int(max_points * 0.6)
        
        # Check sentence structure (basic)
        sentences = re.split(r'[.!?]+', answer)
        sentence_count = len([s for s in sentences if s.strip()])
        
        # Award points for well-structured answers
        if sentence_count >= 2 and word_count >= 15:
            return max_points
        elif sentence_count >= 1 and word_count >= 10:
            return int(max_points * 0.8)
        else:
            return int(max_points * 0.6)
    
    def _score_completeness(self: "DescriptiveEngine", answer: str, max_points: int) -> int:
        """
        Score based on answer completeness.
        Considers length and detail level.
        """
        word_count = len(answer.split())
        
        # Award points based on length (proxy for detail)
        if word_count >= 20:
            return max_points
        elif word_count >= 15:
            return int(max_points * 0.9)
        elif word_count >= 10:
            return int(max_points * 0.7)
        elif word_count >= 5:
            return int(max_points * 0.5)
        else:
            return int(max_points * 0.3)
    
    def evaluate_components(self, answer: str) -> dict:
        """
        Returns component scores (0.0 to 1.0) for:
        - answer_completeness
        - effort_bonus
        """
        if not answer or not answer.strip():
            return {"answer_completeness": 0.0, "effort_bonus": 0.0}
            
        word_count = len(answer.split())
        
        # 1. Answer Completeness (normalized 0.0 to 1.0)
        if word_count >= 20: completeness = 1.0
        elif word_count >= 15: completeness = 0.9
        elif word_count >= 10: completeness = 0.7
        elif word_count >= 5: completeness = 0.5
        else: completeness = 0.3
        
        # 2. Effort Bonus (normalized 0.0 to 1.0)
        # Heuristic: Usage of formatting? Bullet points? 
        # Or just length > 30?
        # Let's say: structured answer (bullet points) gets bonus.
        effort = 0.0
        if "-" in answer or "*" in answer or "\n" in answer:
            effort = 0.5
        if word_count > 30:
            effort = 1.0
            
        return {
            "answer_completeness": completeness,
            "effort_bonus": effort
        }

