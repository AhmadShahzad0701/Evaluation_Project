import asyncio
import sys
import os
from unittest.mock import MagicMock, AsyncMock

# Add current directory to path so we can import app
sys.path.append(os.getcwd())

from app.api.evaluation_routes import evaluate, evaluation_service
from app.schemas.evaluation_schemas import EvaluationRequest, EvaluationResponse, RubricBreakdown, Metrics

async def verify_fix():
    print("🚀 Starting verification of Async API Fix...")

    # Mock the service method to be async
    # The bug was that the route was not awaiting this, so it got a coroutine object.
    # Now that the route is async/await, it should get the actual return value.
    
    mock_response = EvaluationResponse(
        final_score=8.5,
        percentage=85.0,
        grade="A",
        feedback="Test feedback",
        rubric_breakdown=RubricBreakdown(
            conceptual_understanding=1.0,
            completeness_length=1.0,
            language_clarity=1.0,
            spelling_accuracy=1.0,
            handling_incorrect=1.0,
            effort_bonus=0.0
        ),
        metrics=Metrics(llm=1.0, nli=1.0, similarity=1.0),
        confidence=1.0
    )

    # IMPORTANT: We must mock it as an AsyncMock to simulate the real async service
    evaluation_service.evaluate_student_answer = AsyncMock(return_value=mock_response)

    request = EvaluationRequest(
        question="Test Question",
        student_answer="Test Answer",
        max_score=10.0,
        rubric={}
    )

    print("running: await evaluate(request)")
    
    # If the route is fixed (async def), we can await it.
    try:
        if not asyncio.iscoroutinefunction(evaluate):
            print("❌ FAILURE: 'evaluate' route is NOT an async function!")
            return

        result = await evaluate(request)
        
        if isinstance(result, EvaluationResponse):
            print("✅ SUCCESS: API route returned EvaluationResponse object.")
        else:
            print(f"❌ FAILURE: API route returned {type(result)} instead of EvaluationResponse.")
            if asyncio.iscoroutine(result):
                print("   (This means it returned a coroutine, ensuring the bug persists if not awaited)")

    except Exception as e:
        print(f"❌ CRITICAL FAILURE: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(verify_fix())
