from fastapi import APIRouter, HTTPException
from app.schemas.evaluation_schemas import (
    EvaluationRequest,
    EvaluationResponse,
    EvaluationResult
)

from app.engines.descriptive_engine import DescriptiveEngine
from app.engines.similarity_engine import SimilarityEngine
from app.engines.nli_engine import NLIEngine
from app.engines.llm.judge import LLMJudge
from app.engines.aggregator import Aggregator

router = APIRouter()

descriptive_engine = DescriptiveEngine()
similarity_engine = SimilarityEngine()
nli_engine = NLIEngine()
aggregator = Aggregator()


@router.post("/", response_model=EvaluationResponse)
def evaluate(request: EvaluationRequest):
    llm_judge = LLMJudge()  # may timeout → handled safely
    results = []
    overall_max_marks = 0
    overall_obtained_marks = 0.0

    try:
        for item in request.evaluations:

            if item.question_type != "descriptive":
                continue

            # ---------- STEP 1: BASE RUBRIC EVAL ----------
            base_eval = descriptive_engine.evaluate(
                question=item.question,
                answer=item.student_answer or "",
                rubric=item.rubric,
                max_score=item.max_score
            )

            # ---------- STEP 2: SIMILARITY ----------
            similarity_score = similarity_engine.evaluate(
                student_answer=item.student_answer or "",
                reference_answer=None
            )

            # ---------- STEP 3: NLI ----------
            nli_score = nli_engine.evaluate(
                question=item.question,
                student_answer=item.student_answer or "",
                reference_answer=None
            )

            # ---------- STEP 4: LLM (SAFE FALLBACK) ----------
            try:
                llm_eval = llm_judge.evaluate(
                    question=item.question,
                    student_answer=item.student_answer or "",
                    rubric=item.rubric or descriptive_engine.DEFAULT_RUBRIC,
                    max_score=item.max_score
                )
            except Exception as llm_error:
                print("⚠️ LLM ERROR (fallback used):", llm_error)

                llm_eval = {
                    "score": (
                        base_eval["total_score"] / item.max_score
                        if item.max_score > 0
                        else 0.0
                    ),
                    "justification": (
                        "LLM evaluation unavailable. "
                        "Rubric-based scoring applied."
                    ),
                    "weight_adjustment": None
                }

            # ---------- STEP 5: AGGREGATION ----------
            aggregated = aggregator.aggregate(
                scores={
                    "llm": llm_eval["score"],
                    "nli": nli_score,
                    "similarity": similarity_score
                },
                rubric=item.rubric or descriptive_engine.DEFAULT_RUBRIC,
                max_score=item.max_score,
                llm_adjustment=llm_eval.get("weight_adjustment")
            )

            obtained = round(aggregated["final_marks"], 2)

            overall_max_marks += item.max_score
            overall_obtained_marks += obtained

            # ---------- STEP 6: RESULT ----------
            results.append(
                EvaluationResult(
                    student_id=item.student_id or "unknown",
                    question_id=item.question_id or "unknown",
                    max_marks=item.max_score,
                    obtained_marks=obtained,
                    breakdown=base_eval["breakdown"],
                    feedback=llm_eval["justification"],
                    signals={
                        "llm": round(llm_eval["score"], 3),
                        "nli": round(nli_score, 3),
                        "similarity": round(similarity_score, 3)
                    },
                    confidence=round(aggregated["final_percentage"], 3)
                )
            )

        return EvaluationResponse(
            results=results,
            overall_max_marks=overall_max_marks,
            overall_obtained_marks=round(overall_obtained_marks, 2)
        )

    except Exception as e:
        print("❌ ENGINE ERROR:", str(e))
        raise HTTPException(status_code=500, detail="Evaluation failed")
