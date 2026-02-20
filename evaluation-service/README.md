# Evaluation Service

> **A multi-signal, AI-powered academic answer evaluation backend built with FastAPI, GPT-4o-mini, Sentence Transformers, and a Transformer-based NLI model.**

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Folder Structure Breakdown](#3-folder-structure-breakdown)
4. [API Architecture](#4-api-architecture)
5. [Evaluation Pipeline Deep Dive](#5-evaluation-pipeline-deep-dive)
6. [Model Usage and Justification](#6-model-usage-and-justification)
7. [Signal Processing Logic](#7-signal-processing-logic)
8. [Scoring and Aggregation System](#8-scoring-and-aggregation-system)
9. [Strictness and Threshold Logic](#9-strictness-and-threshold-logic)
10. [Confidence Calculation](#10-confidence-calculation)
11. [Error Handling Strategy](#11-error-handling-strategy)
12. [Environment Variables Explanation](#12-environment-variables-explanation)
13. [Example Request & Response](#13-example-request--response)
14. [Design Philosophy](#14-design-philosophy)
15. [Technical Trade-offs](#15-technical-trade-offs)
16. [Why This Architecture Was Chosen](#16-why-this-architecture-was-chosen)
17. [Limitations (Visible from Existing Code)](#17-limitations-visible-from-existing-code)
18. [Conclusion](#18-conclusion)

---

## 1. Project Overview

The **Evaluation Service** is the backend engine of a student answer grading system. Its purpose is to accept a student's short or descriptive answer to an academic question, evaluate it against a configurable rubric, and return a structured grade — including a final score, percentage, letter grade, per-criterion breakdown, raw signal metrics, and natural-language feedback.

The system is **not a simple keyword matcher or similarity scorer**. It implements a **three-layer evaluation pipeline**:

1. **Deterministic Layer** — fast, rule-based structural and spam checks.
2. **Signal Layer** — machine-learning-based semantic and logical signals.
3. **Reasoning Layer** — LLM-powered holistic judgment that integrates all signals into a final rubric-driven score.

### Key Capabilities

| Capability | Detail |
|---|---|
| Multi-signal evaluation | LLM score + NLI entailment + semantic similarity |
| Adaptive depth awareness | Expected answer depth scales with total marks |
| Rubric-driven scoring | Weighted formula across concept, completeness, clarity |
| Hallucination detection | NLI cross-checks LLM output against semantic signals |
| Anti-gaming validation | Spam repetition and gibberish filters enforce answer quality |
| Flexible rubric schema | Supports both legacy 6-key and modern 3-key rubric formats |
| Contextual grading style | `balanced`, `concept-focused`, and `strict` evaluation modes |
| Structured JSON API | Fully typed Pydantic schemas on input and output |

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          External Client                            │
│                  (Frontend / Testing Script / Postman)              │
└────────────────────────────┬────────────────────────────────────────┘
                             │  HTTP POST /evaluate/
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      FastAPI Application                            │
│                        (app/main.py)                                │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │              evaluation_routes.py (APIRouter)               │   │
│   │   POST /evaluate/   →   EvaluationService.evaluate()        │   │
│   └─────────────────────────┬───────────────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│               EvaluationService (services/evaluation_service.py)    │
│                    Central Orchestration Layer                       │
│                                                                     │
│  ┌──────────────┐  ┌──────────────────┐  ┌─────────────────────┐   │
│  │  Validator   │  │  DepthEstimator  │  │  SimilarityEngine   │   │
│  │  (Layer 1)   │  │  (Layer 1)       │  │  (Layer 2)          │   │
│  └──────────────┘  └──────────────────┘  └─────────────────────┘   │
│  ┌──────────────┐  ┌───────────────────────────────────────────┐   │
│  │  NLIEngine   │  │           LLMJudge  (Layer 3)             │   │
│  │  (Layer 2)   │  │   → LLMClient → OpenRouter API             │   │
│  └──────────────┘  │   → GPT-4o-mini (ADAPTIVE_EVAL_PROMPT)    │   │
│                    └───────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │           Hybrid Concept Stabilization Formula               │   │
│  │     hybrid_concept = llm_w * llm + sim_w * sim + nli_w * nli│   │
│  └──────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                         Aggregator                           │   │
│  │   final_score = (concept*w_c + completeness*w_comp +         │   │
│  │                  clarity*w_cl) / sum(w) * total_marks        │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
                    EvaluationResponse JSON
          { final_score, percentage, grade, feedback,
            rubric_breakdown, metrics, confidence }
```

> The `SpellingEngine` and `DescriptiveEngine` are instantiated within `EvaluationService` but their outputs are **not used in the current active evaluation pipeline** — they exist as architectural placeholders ready for future integration.

---

## 3. Folder Structure Breakdown

```
evaluation-service/
│
├── .env                            # Actual secret environment file (gitignored)
├── .env.example                    # Template showing required env variables
├── .gitignore                      # Standard Python gitignore
├── requirements.txt                # Python dependencies
├── pyrightconfig.json              # Type-checking configuration for Pyright
│
├── calculate_mae.py                # Utility: Calculates Mean Absolute Error on dataset
├── phase1_final_dataset.csv        # Dataset used for Phase 1 evaluation benchmarking
├── phase1_with_system_scores.csv   # Dataset annotated with system-generated scores
├── run_phase1_evaluation.py        # Script: Runs evaluation against phase1 dataset
├── test_refactored_system.py       # Comprehensive integration test suite
├── verify_api_fix.py               # Verification script for API correctness
├── verify_backend.py               # Verification script for contract validation
│
└── app/
    ├── __init__.py
    ├── main.py                     # FastAPI application entry point, CORS, routing
    │
    ├── api/
    │   ├── __init__.py
    │   └── evaluation_routes.py    # HTTP route definitions (POST /evaluate/)
    │
    ├── schemas/
    │   ├── __init__.py
    │   └── evaluation_schemas.py   # Pydantic input/output contract definitions
    │
    ├── services/
    │   └── evaluation_service.py   # Central orchestrator; wires all engines together
    │
    ├── engines/
    │   ├── __init__.py
    │   ├── validator.py            # Layer 1: Structural & spam validation
    │   ├── depth_estimator.py      # Layer 1: Heuristic depth signal
    │   ├── similarity_engine.py    # Layer 2: Semantic cosine similarity (MiniLM)
    │   ├── nli_engine.py           # Layer 2: NLI entailment score (DistilRoBERTa)
    │   ├── spelling_engine.py      # Placeholder: Spelling accuracy (returns 1.0)
    │   ├── descriptive_engine.py   # Standalone rubric engine (not in active pipeline)
    │   ├── aggregator.py           # Final score calculation & grade assignment
    │   └── llm/
    │       ├── __init__.py
    │       ├── client.py           # Async HTTP client for OpenRouter API
    │       ├── judge.py            # LLM orchestrator; builds prompts, parses output
    │       └── prompts.py          # Prompt templates (EVALUATION_PROMPT, ADAPTIVE_EVALUATION_PROMPT)
    │
    └── utils/
        └── __init__.py             # Utility namespace (currently empty)
```

### File-by-File Purpose

| File | Role | Layer |
|---|---|---|
| `main.py` | App boot, `.env` discovery, CORS, router mounting | Infrastructure |
| `evaluation_routes.py` | HTTP interface, request logging, error surfacing | API |
| `evaluation_schemas.py` | Pydantic type contracts for request and response | Contract |
| `evaluation_service.py` | Orchestration of all engines and formula application | Business Logic |
| `validator.py` | Pre-evaluation quality gate | Layer 1 |
| `depth_estimator.py` | Sentence-count-based depth heuristic | Layer 1 |
| `similarity_engine.py` | MiniLM-based semantic similarity | Layer 2 |
| `nli_engine.py` | DistilRoBERTa-based NLI entailment | Layer 2 |
| `spelling_engine.py` | Placeholder spelling scorer | Layer 2 (inactive) |
| `descriptive_engine.py` | Keyword-based rubric evaluator | Standalone (inactive in pipeline) |
| `aggregator.py` | Weighted score formula + grade assignment | Post-processing |
| `llm/judge.py` | Builds adaptive prompt, calls client, parses result | Layer 3 |
| `llm/client.py` | Async OpenRouter HTTP client with retry logic | Layer 3 |
| `llm/prompts.py` | Structured prompt templates | Layer 3 |

---

## 4. API Architecture

### Base URL

```
http://localhost:8000
```

### Registered Routes

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health probe — returns `{"status": "ok"}` |
| `POST` | `/evaluate/` | Main evaluation endpoint |

### Route: `POST /evaluate/`

**Defined in:** `app/api/evaluation_routes.py`

**Mounted in:** `app/main.py` with prefix `/evaluate`

```python
app.include_router(evaluate_router, prefix="/evaluate")
```

This means the full path is `/evaluate/`.

#### Singleton Initialization

The `EvaluationService` instance is created **once at module import time** in `evaluation_routes.py`:

```python
evaluation_service = EvaluationService()
```

This is intentional. The ML models (`SentenceTransformer`, `NLI DistilRoBERTa`) are heavy to load. Loading them once at startup avoids per-request initialization latency. This implements a **de facto Singleton pattern**.

#### CORS Configuration

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # All origins allowed
    allow_credentials=True,
    allow_methods=["*"],       # All HTTP methods
    allow_headers=["*"],       # All headers
)
```

`allow_origins=["*"]` permits requests from any frontend origin. This is suitable for development; production deployments should restrict to specific domains.

#### Error Handling in Routes

```python
except Exception as e:
    logger.error(f"❌ SERVICE ERROR: {str(e)}", exc_info=True)
    raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")
```

All unhandled exceptions bubble up as **HTTP 500** responses. The full traceback is logged server-side via Python's `logging` module, while the client receives a sanitized error message.

---

## 5. Evaluation Pipeline Deep Dive

The pipeline in `EvaluationService.evaluate_student_answer()` executes in strictly ordered phases:

---

### Phase 0 — Normalization & Context Setup

```python
total_marks = request.total_marks if request.total_marks is not None else request.max_score
normalized_rubric = self._normalize_rubric(request.rubric)
```

**What happens:**

- `total_marks` is resolved: if `total_marks` is provided in the request, it overrides `max_score`. This allows legacy clients sending `max_score` and new clients sending `total_marks` to both function correctly.
- The rubric is normalized from either the legacy 6-key schema or the new 3-key schema into a unified `{"concept", "completeness", "clarity"}` dictionary.

**Rubric Normalization (`_normalize_rubric`):**

If the new 3-key schema (`concept`, `completeness`, `clarity`) is detected:

```python
return {
    "concept": r.concept or 0.0,
    "completeness": r.completeness or 0.0,
    "clarity": r.clarity or 0.0
}
```

If the legacy 6-key schema is detected, a mapping is applied:

| New Key | Legacy Keys Merged |
|---|---|
| `concept` | `conceptual_understanding` + `handling_incorrect` |
| `completeness` | `answer_completeness` + `effort_bonus` |
| `clarity` | `language_clarity` + `spelling_accuracy` |

This backward-compatibility bridge ensures that older API consumers continue to work without code changes.

---

### Phase 1 — Layer 1: Deterministic Structural Checks

#### 1a. Adaptive Validation (`Validator.validate_adaptive`)

```python
is_valid, validation_msg = self.validator.validate_adaptive(request.student_answer, total_marks)
```

Three checks are run in order:

**Check 1: Empty Answer**
```python
if not answer or not answer.strip():
    return False, "Answer is empty"
```

**Check 2: Spam / Repetition Detection (`_is_spam`)**

The spam detector counts unique vs. total words.

```python
# Rule 1: If total_words > 6, unique/total ratio must be ≥ 0.4
if total_words > 6:
    ratio = unique_words / total_words
    if ratio < 0.4:
        return True  # Spam detected

# Rule 2: No single word can dominate > 50% for answers > 3 words
for count in freq.values():
    if count > total_words * 0.5 and total_words > 3:
        return True  # Spam detected
```

| Parameter | Value | Meaning |
|---|---|---|
| Minimum total words before ratio check | `> 6` | Allows short answers through |
| Unique word ratio threshold | `0.4` | 40% of words must be unique |
| Single-word dominance cap | `0.5` (50%) | No word can appear in more than half the answer |

*What if 0.4 increases?* More varied vocabulary is required, causing legitimate but repetitive academic sentences to fail.  
*What if 0.4 decreases?* Keyword-stuffed answers could pass validation.

**Check 3: Gibberish Detection (`_is_gibberish`)**

```python
if avg_len > 30:
    return True  # Gibberish detected
```

| Parameter | Value | Meaning |
|---|---|---|
| Average word length threshold | `30 characters` | Catches non-word character strings |

An average word length above 30 characters indicates a non-human-readable input (random character sequences).

**Check 4: Meaningful Word Count (`_has_enough_meaningful_words`)**

```python
meaningful = [w for w in words if w.lower() not in STOPWORDS]
return len(meaningful) >= min_words  # min_words = 1 (always)
```

A fixed stopword set of 20 common English function words is filtered out. If the answer has zero non-stopword words, it fails.

> **Note:** The `validate_adaptive` signature accepts `total_marks` but the current implementation always applies `min_words=1` regardless of marks. The adaptive branching described in the docstring (`total_marks <= 2 → 1 word; > 2 → 3 words`) is present in the docstring but is not currently reflected in the code body — both paths call `_has_enough_meaningful_words(words, min_words=1)`.

---

#### 1b. Zero-Weight Early Exit

```python
if sum(normalized_rubric.values()) == 0:
    return self._create_zero_response("No active rubric weights.", normalized_rubric)
```

If a caller sends all rubric weights as zero, the pipeline short-circuits before calling any ML model. This saves compute resources.

---

#### 1c. Depth Estimation (`DepthEstimator.estimate`)

```python
depth_signals = self.depth_estimator.estimate(request.student_answer, total_marks)
```

The depth estimator is a **pure heuristic** that produces signals — it does not score the answer itself. It informs the LLM prompt later.

**Expected depth by marks:**

| `total_marks` | `expected_points` | Interpretation |
|---|---|---|
| `<= 2` | `1` | Definition only |
| `<= 5` | `2` | Definition + Explanation |
| `<= 10` | `3` | Structured explanation |
| `> 10` | `4` | Detailed analysis |

**Actual depth estimation:**

The answer is split by sentence terminators (`.`, `!`, `?`, `\n`, `;`). Segments with fewer than 3 words are discarded. The count of remaining segments is `actual_points`.

```python
score = min(actual_points / expected_points, 1.0)  # Capped at 1.0
```

**Connector word bonus:**

If the answer contains any of `["because", "therefore", "however", "additionally", "firstly", "contrast"]`, and `score < 1.0`, the depth score receives a `+0.1` bonus (capped at 1.0). This rewards structured reasoning.

**Output dict:**

```python
{
    "expected_depth": float,        # Number of units expected
    "actual_depth_heuristic": float, # Number of units detected
    "depth_score": float             # Ratio, 0.0 to 1.0
}
```

This dict is passed directly into the LLM prompt as a signal.

---

### Phase 2 — Layer 2: Signal Generation (NLI + Similarity)

#### 2a. Similarity Signal (`SimilarityEngine.evaluate`)

```python
similarity_score = self.similarity_engine.evaluate(request.student_answer, reference)
```

- If `reference_answer` is `None`: returns a **neutral fallback of `0.5`**, allowing evaluation to proceed without a reference.
- If `reference_answer` is provided: encodes both texts using `all-MiniLM-L6-v2`, computes cosine similarity, normalizes from `[-1, 1]` to `[0, 1]`.

**Normalization formula:**

```python
similarity_score = (cosine_similarity + 1) / 2
```

This ensures the output is always in `[0, 1]` even for negative cosine values (which are rare in practice for sentence pairs but theoretically possible).

#### 2b. NLI Signal (`NLIEngine.evaluate`)

```python
nli_score = self.nli_engine.evaluate(request.question, request.student_answer, "")
```

> **Important observation:** The call passes an **empty string** as `reference_answer`. Inside `NLIEngine.evaluate`, an empty reference triggers the neutral fallback:
>
> ```python
> if not reference_answer:
>     return 0.5
> ```
>
> This means **NLI always returns 0.5** in the current pipeline because the reference answer is never passed. Based on code behavior, this appears to be a known trade-off — the NLI score still participates in the hybrid formula (contributing `nli_w * 0.5`), ensuring it does not distort scores while preserving the engine's structural presence.

---

### Phase 3 — Rubric Weight Re-normalization

```python
total_weight = sum(normalized_rubric.values())
if total_weight > 0:
    normalized_rubric = {
        k: v / total_weight for k, v in normalized_rubric.items()
    }
```

The rubric weights are divided by their sum, converting them into proportions that sum to exactly 1.0. This ensures the final score formula is scale-invariant: a rubric of `{concept: 40, completeness: 30, clarity: 30}` produces identical results to `{concept: 0.4, completeness: 0.3, clarity: 0.3}`.

---

### Phase 4 — Layer 3: LLM Reasoning (`LLMJudge.evaluate_adaptive`)

```python
llm_result = await self.llm_judge.evaluate_adaptive(
    question=request.question,
    student_answer=request.student_answer,
    rubric_weights=normalized_rubric,
    total_marks=total_marks,
    style=request.evaluation_style,
    signals={
        "similarity": similarity_score,
        "nli": nli_score,
        "depth": depth_signals
    }
)
```

`LLMJudge._build_adaptive_prompt()` formats the `ADAPTIVE_EVALUATION_PROMPT` template with all context. The final prompt instructs GPT-4o-mini to return a JSON object with:

```json
{
  "concept": <float 0.0–1.0>,
  "completeness": <float 0.0–1.0>,
  "clarity": <float 0.0–1.0>,
  "feedback": "<natural language explanation>",
  "reasoning": "<explanation of score logic>"
}
```

The LLM receives knowledge of:
- The question text
- The student's answer
- The normalized rubric weights (expressed as proportions)
- The total marks (to contextualize expected depth)
- The evaluation style (`balanced`, `concept-focused`, `strict`)
- All three signals (similarity, NLI, depth)

The prompt contains hard-coded grading guidance:

| Rule | Purpose |
|---|---|
| `1-2 Marks: Expect concise definitions` | Prevents penalizing short but correct answers |
| `3-5 Marks: Expect short explanation` | Moderate depth expectation |
| `6-10+ Marks: Expect detailed reasoning` | Full-answer expectation |
| NLI < 0.5 but Similarity high → be skeptical | Hallucination / keyword stuffing guard |
| Completeness weight 0.0 → ignore length | Rubric-driven length evaluation |

**The LLM's role:** It acts as the primary judge. The signals (similarity, NLI, depth) are explicitly marked as "guidance only" in the prompt; the rubric weights are described as "final authority."

---

### Phase 5 — Hybrid Concept Stabilization Formula

This is the most mathematically significant step in the pipeline. The concept score is not taken directly from the LLM — it is **blended** with the signal scores using dynamically computed weights:

```python
concept_importance = normalized_rubric.get("concept", 0.0)

# Dynamic signal weights
nli_w  = 0.1 + 0.2 * concept_importance
sim_w  = 0.25 - 0.15 * concept_importance
llm_w  = 1.0 - (nli_w + sim_w)

# Enforce LLM dominance (minimum 50% weight)
if llm_w < 0.5:
    llm_w = 0.5
    remaining = 0.5
    total_signal = nli_w + sim_w
    nli_w = remaining * (nli_w / total_signal)
    sim_w = remaining * (sim_w / total_signal)

hybrid_concept = llm_w * llm_concept + sim_w * similarity_score + nli_w * nli_score
hybrid_concept = max(0.0, min(hybrid_concept, 1.0))
```

**Weight dynamics by concept importance:**

| `concept_importance` | `nli_w` | `sim_w` | `llm_w` |
|---|---|---|---|
| `0.0` | `0.10` | `0.25` | `0.65` |
| `0.5` | `0.20` | `0.175` | `0.625` |
| `1.0` | `0.30` | `0.10` | `0.60` |

> As the `concept` rubric weight increases, the NLI signal gains more influence (logical entailment becomes more important) and similarity's influence decreases. LLM always retains at least 50% weight — it is the primary scorer.

**Why blend at all?** The LLM is capable of confident-sounding but directionally unstable outputs (especially for borderline answers). The similarity and NLI signals act as **anchors** grounded in deterministic model outputs, reducing score volatility across repeated evaluations.

---

### Phase 6 — Rubric Breakdown Construction

```python
breakdown = RubricBreakdown(
    conceptual_understanding=hybrid_concept,          # Hybrid formula output
    completeness_length=llm_result.get("completeness", 0.0),  # Pure LLM output
    language_clarity=llm_result.get("clarity", 0.0),          # Pure LLM output
    spelling_accuracy=0.0,       # Hardcoded: SpellingEngine not active in pipeline
    handling_incorrect=0.0,      # Hardcoded: Not used in adaptive pipeline
    effort_bonus=0.0             # Hardcoded: Not used in adaptive pipeline
)
```

Only `conceptual_understanding` gets the stabilized hybrid value. `completeness` and `clarity` are taken directly from GPT-4o-mini's JSON response.

---

### Phase 7 — Final Score Aggregation (`Aggregator.aggregate_adaptive`)

```python
aggregated = self.aggregator.aggregate_adaptive(
    breakdown=breakdown,
    weights=normalized_rubric,
    total_marks=total_marks
)
```

**Formula:**

```
numerator = (conceptual_understanding × w_concept) +
            (completeness_length       × w_completeness) +
            (language_clarity          × w_clarity)

total_weight = w_concept + w_completeness + w_clarity

final_score (0–1) = numerator / total_weight

final_absolute = final_score × total_marks
```

Since `normalized_rubric` was already made to sum to 1.0 in Phase 3, `total_weight` here will equal 1.0, making the division a no-op. The formula is defensive — it handles the case where weights might not sum to 1.0.

**Grade assignment:**

| Percentage | Grade |
|---|---|
| ≥ 90% | A |
| ≥ 80% | B |
| ≥ 70% | C |
| ≥ 60% | D |
| < 60% | F |

---

### Phase 8 — Response Construction

```python
return EvaluationResponse(
    final_score=aggregated["final_score"],
    percentage=aggregated["percentage"],
    grade=aggregated["grade"],
    feedback=llm_result.get("feedback", "No feedback provided."),
    rubric_breakdown=breakdown,
    metrics=Metrics(
        llm=llm_concept,        # Raw LLM concept score (before hybridization)
        nli=nli_score,
        similarity=similarity_score
    ),
    confidence=llm_result.get("confidence", 1.0)
)
```

The `metrics` field exposes the **raw** LLM concept score (pre-hybrid) alongside the NLI and similarity values. This allows consumers to inspect individual signals independently.

---

## 6. Model Usage and Justification

### Model 1: `openai/gpt-4o-mini` via OpenRouter

| Property | Detail |
|---|---|
| **Model Name** | `openai/gpt-4o-mini` |
| **Type** | Large Language Model (LLM) — Instruction-tuned |
| **Provider** | OpenAI, accessed via OpenRouter API |
| **Role** | Primary evaluator: concept understanding, completeness, clarity, feedback |
| **API Endpoint** | `https://openrouter.ai/api/v1/chat/completions` |

**Why GPT-4o-mini?**
- It is OpenAI's smallest capable model in the GPT-4 class, providing strong instruction-following and JSON output reliability.
- It is significantly more cost-effective than GPT-4o or GPT-4-turbo while having comparable quality for short-answer grading tasks.
- The model reliably follows structured JSON output instructions, which is critical for machine-readable parsing.

**What it does:**
The model receives the full evaluation context (question, answer, rubric proportions, total marks, all three signals, evaluation style) and returns `concept`, `completeness`, `clarity`, and `feedback` values all between 0.0 and 1.0.

**Key configuration parameters:**

| Parameter | Value | Impact |
|---|---|---|
| `temperature` | `0` | Forces deterministic, reproducible output |
| `max_tokens` | `500` | Limits response length; sufficient for JSON + brief feedback |
| `retries` | `1` (default in `send_prompt`) | One retry on failure before raising exception |
| `timeout` | `45.0` seconds | Gives the API sufficient time to respond |

*If `temperature` increases above 0:* Scores become non-deterministic — the same answer may receive slightly different scores on repeated calls, reducing grade fairness.  
*If `max_tokens` decreases below ~150:* The JSON response may be truncated, causing `json.loads` to fail.  
*If removed:* The primary concept score, completeness, clarity, feedback, and the adaptive depth awareness are all lost. The system would have no reasoning-capable component.

---

### Model 2: `sentence-transformers/all-MiniLM-L6-v2`

| Property | Detail |
|---|---|
| **Model Name** | `all-MiniLM-L6-v2` |
| **Type** | Sentence Embedding / Bi-Encoder model |
| **Provider** | HuggingFace Sentence Transformers library |
| **Role** | Semantic similarity signal between student answer and reference |
| **Library** | `sentence-transformers` |

**Why all-MiniLM-L6-v2?**
- It is one of the most widely used semantic similarity models. It encodes 384-dimensional dense vectors and is explicitly designed for sentence-level similarity tasks.
- The model is lightweight (~80MB), loads quickly, runs without a GPU, and delivers high-quality cosine similarity scores for English text.
- Comments in the code confirm this selection: "Lightweight, fast, production-friendly."

**What it does:**

```python
embeddings = self.model.encode([student_answer, reference_answer], convert_to_numpy=True)
cosine = dot(emb[0], emb[1]) / (norm(emb[0]) * norm(emb[1]))
similarity_score = (cosine + 1) / 2  # Normalize to [0, 1]
```

**Fallback behavior:** When no `reference_answer` is provided (as is the current default in the pipeline), returns `0.5` — a neutral midpoint that neither rewards nor penalizes the student on this signal.

*If removed:* The hybrid concept formula loses the `sim_w * similarity_score` term, making the LLM solely responsible for concept scoring. Score stability decreases.

---

### Model 3: `cross-encoder/nli-distilroberta-base`

| Property | Detail |
|---|---|
| **Model Name** | `cross-encoder/nli-distilroberta-base` |
| **Type** | Natural Language Inference (NLI) — Cross-Encoder for Sequence Classification |
| **Provider** | HuggingFace Transformers (`cross-encoder` organization) |
| **Role** | Logical entailment detection: does the student answer logically follow from the reference? |
| **Library** | `transformers`, `torch` |

**Why cross-encoder/nli-distilroberta-base?**
- Cross-encoders for NLI concatenate two texts and produce a classification over three classes: `contradiction`, `neutral`, `entailment`. This is semantically richer than simple similarity — two answers can have high lexical overlap without logical entailment (hallucination case).
- DistilRoBERTa is a distilled (compressed) version of RoBERTa, making it faster and smaller while preserving NLI quality.
- The entailment score acts as a logical consistency check: if a student's answer truly follows from the correct answer, the NLI entailment probability is high.

**What it does:**

```python
logits = model(premise=reference, hypothesis=student_answer)
probs = F.softmax(logits, dim=1)
entailment_score = probs[0][2].item()  # Index 2 = entailment class
```

**Fallback behavior:** When no reference is provided (current pipeline), returns `0.5`.

**Hallucination detection (in LLM prompt):**
The `ADAPTIVE_EVALUATION_PROMPT` contains the instruction:
> "If NLI is low (<0.5) but Similarity is high, be skeptical (possible keyword stuffing)."

This means that if a student answer has high surface similarity to a reference but low logical entailment, the LLM is told to reduce trust in the similarity signal.

*If removed:* The hybrid formula replaces the `nli_w * nli_score` term with zero, slightly increasing LLM and similarity weights. The hallucination guard prompt instruction becomes meaningless.

---

## 7. Signal Processing Logic

The evaluation produces three numeric signals in the range `[0.0, 1.0]`:

| Signal | Engine | Method | Fallback (no reference) |
|---|---|---|---|
| `similarity` | `SimilarityEngine` | Cosine similarity of MiniLM embeddings | `0.5` |
| `nli` | `NLIEngine` | Softmax entailment probability (DistilRoBERTa) | `0.5` |
| `depth` | `DepthEstimator` | Segment count ratio + connector bonus | Always computed |

These signals are passed to the LLM as context. The LLM is instructed to treat them as "guidance only" — not to blindly adopt them.

After the LLM response, `similarity` and `nli` participate in the **Hybrid Concept Stabilization** formula alongside the LLM's own concept score. The depth signal is used only in the prompt; it does not appear independently in the final formula.

---

## 8. Scoring and Aggregation System

### Three Criteria

All scoring ultimately resolves to three criteria:

| Criterion | Source | Description |
|---|---|---|
| `conceptual_understanding` | Hybrid formula | Blended LLM + similarity + NLI |
| `completeness_length` | LLM only | How thoroughly the answer addresses the question depth |
| `language_clarity` | LLM only | Structure, grammar, and expressiveness |

### Final Score Formula

```
W_c    = normalized rubric weight for concept
W_comp = normalized rubric weight for completeness
W_cl   = normalized rubric weight for clarity

numerator = (conceptual_understanding × W_c)
          + (completeness_length       × W_comp)
          + (language_clarity          × W_cl)

percentage (0–100) = numerator / (W_c + W_comp + W_cl) × 100
final_score (0–N)  = percentage / 100 × total_marks
```

### Grade Boundaries

```
percentage ≥ 90  →  A
percentage ≥ 80  →  B
percentage ≥ 70  →  C
percentage ≥ 60  →  D
percentage  < 60 →  F
```

These are standard Western academic grade boundaries coded directly in `Aggregator._finalize_score()`.

### Zero-Score Conditions

A zero score (`0.0`, `0%`, `F`) is returned immediately if:

1. The answer is empty.
2. The answer contains excessive word repetition (spam).
3. The answer consists of extremely long "words" (gibberish, avg length > 30 chars).
4. All rubric weights sum to zero.
5. The LLM call raises an exception (caught by the service).

In all cases, the `feedback` field in the response contains the reason for the zero score.

---

## 9. Strictness and Threshold Logic

### Validation Thresholds

| Rule | Threshold | Location |
|---|---|---|
| Spam ratio | `< 0.4` unique/total | `validator.py` `_is_spam` |
| Single-word dominance | `> 50%` of total words | `validator.py` `_is_spam` |
| Minimum words for ratio check | `> 6` total words | `validator.py` `_is_spam` |
| Single-word dominance check | `> 3` total words | `validator.py` `_is_spam` |
| Average word gibberish cap | `> 30` characters | `validator.py` `_is_gibberish` |
| Meaningful word minimum | `>= 1` non-stopword | `validator.py` `_has_enough_meaningful_words` |

### Evaluation Style

The `evaluation_style` field (default: `"balanced"`) is injected directly into the `ADAPTIVE_EVALUATION_PROMPT` as `{style}`. The LLM is instructed:

```
Grading Style: {style}
```

The styles available (per the schema default and test scripts) are:
- `"balanced"` — equilibrium between leniency and strictness
- `"concept-focused"` — prioritizes conceptual understanding over completeness or clarity
- `"strict"` — higher bar for all criteria

The interpretation of these styles is entirely governed by GPT-4o-mini's instruction-following. There is no additional code-level strictness multiplier — the style is a natural language instruction embedded in the prompt.

### Depth Thresholds (DepthEstimator)

| Condition | Connector Bonus Applied |
|---|---|
| `depth_score < 1.0` AND connector word found | `+0.1` (capped at 1.0) |

This is the only score-modifying threshold in the deterministic layer. All other thresholds are binary pass/fail gates in the validator.

### LLM Prompt Thresholds

The `ADAPTIVE_EVALUATION_PROMPT` embeds the following explicit threshold instruction:

```
If NLI is low (<0.5) but Similarity is high, be skeptical (possible keyword stuffing).
```

| NLI | Similarity | LLM Instruction |
|---|---|---|
| `< 0.5` | `high` | Be skeptical — likely keyword stuffing |
| Any combination | Any | Rubric weights are the final authority |

---

## 10. Confidence Calculation

### Current Implementation

The `confidence` field in `EvaluationResponse` is sourced from:

```python
confidence=llm_result.get("confidence", 1.0)
```

Inside `LLMJudge.evaluate_adaptive`, the return value is:

```python
"confidence": 1.0  # Placeholder for now
```

This means **confidence is hardcoded to `1.0`** for all successful evaluations in the adaptive pipeline. The comment `# Placeholder for now` confirms this is a known placeholder awaiting a real implementation.

The legacy `LLMJudge.evaluate` method (non-adaptive path) does extract:

```python
confidence = float(parsed.get("confidence", 0.5))
```

...expecting the LLM itself to return a confidence score. However, this path is not invoked by `EvaluationService`; only `evaluate_adaptive` is used.

The `Aggregator._finalize_score` also returns `"confidence": 1.0` as a hardcoded value, noting that "Aggregation is deterministic."

**Summary:** In the current codebase, confidence is always `1.0` for successful evaluations and not a meaningful signal. The architecture supports a real confidence value flowing through from the LLM — the scaffolding exists, but the implementation is pending.

---

## 11. Error Handling Strategy

### Layer 1 — Validation Failure

```python
if not is_valid:
    return self._create_zero_response(validation_msg, normalized_rubric)
```

Returns a structured zero-score response. The reason is surfaced in the `feedback` field. **No exception is raised.**

### Layer 3 — LLM Failure

```python
try:
    llm_result = await self.llm_judge.evaluate_adaptive(...)
except Exception as e:
    logger.error(f"LLM Evaluation failed: {e}")
    return self._create_zero_response(f"Evaluation Error: {str(e)}", normalized_rubric)
```

LLM failures (network errors, API key issues, malformed JSON) also resolve to a zero-score response. The route-level handler does NOT see this exception — the service swallows it and returns a clean API response. **This prevents 500 errors from propagating to the client for LLM issues.**

### HTTP Client — Retry Logic

```python
for attempt in range(retries + 1):  # retries=1, so 2 total attempts
    try:
        ...
    except (httpx.RequestError, ValueError, RuntimeError) as e:
        await asyncio.sleep(1)  # 1-second backoff between retries
```

Each attempt has a 45-second timeout. After all attempts (default: 2), a `RuntimeError` is raised to `LLMJudge`, which propagates to `EvaluationService`, which catches it and returns a zero-score response.

### JSON Parsing — LLM Output Cleanup

```python
match = re.search(r"```(?:json)?\s*(.*)\s*```", cleaned, re.DOTALL)
if match:
    cleaned = match.group(1).strip()

return json.loads(cleaned)
```

LLMs sometimes wrap JSON in markdown code blocks (` ```json ... ``` `). The `_parse_json` method strips these fences before parsing. If `json.loads` still fails, a `RuntimeError` is raised with the first 500 characters of the raw LLM output logged for debugging.

### Zero-Score Response (`_create_zero_response`)

Every error pathway returns a fully valid `EvaluationResponse` with:
- `final_score=0.0`
- `percentage=0.0`
- `grade="F"`
- `feedback=<reason string>`
- All rubric breakdown values = `0.0`
- `metrics={llm: 0.0, nli: 0.0, similarity: 0.0}`
- `confidence=1.0`

This design keeps the API contract **always satisfied** — the response schema never changes regardless of errors.

---

## 12. Environment Variables Explanation

The application uses a single environment variable:

| Variable | Required | Description |
|---|---|---|
| `OPENROUTER_API_KEY` | **Yes** | Bearer token for the OpenRouter API |

### How it is loaded

`app/main.py` implements a **directory-traversal `.env` discovery** mechanism:

```python
for parent in current_file.parents:
    candidate = parent / ".env"
    if candidate.exists():
        env_path = candidate
        break

if env_path is None:
    raise RuntimeError("❌ .env file NOT FOUND anywhere above main.py")

load_dotenv(env_path, override=True)
```

Starting from the directory containing `main.py`, the code walks up the directory tree until it finds a `.env` file. `override=True` means values in the file always overwrite any existing OS environment variables with the same name.

**Why walk up directories?** This pattern is used in monorepo structures where the `.env` may sit several levels above the service's folder.

### `OPENROUTER_API_KEY`

| Aspect | Detail |
|---|---|
| **Purpose** | Authenticates requests to `https://openrouter.ai/api/v1/chat/completions` |
| **Format** | String prefixed with `sk-or-v1-` |
| **Loaded at** | First LLM request (read via `os.getenv("OPENROUTER_API_KEY")` in `client.py`) |
| **If missing** | `RuntimeError: "OPENROUTER_API_KEY not found in environment"` is raised, causing a zero-score response |
| **Where set** | `.env` file in the repository root |

---

## 13. Example Request & Response

### Request

`POST /evaluate/`

```json
{
  "question": "What is Machine Learning?",
  "student_answer": "Machine Learning is a subset of AI that enables systems to learn from data and improve from experience without being explicitly programmed.",
  "rubric": {
    "concept": 0.5,
    "completeness": 0.3,
    "clarity": 0.2
  },
  "max_score": 10.0,
  "total_marks": 10.0,
  "evaluation_style": "balanced",
  "reference_answer": null
}
```

**Field explanations:**

| Field | Type | Required | Description |
|---|---|---|---|
| `question` | `str` | Yes | The academic question being answered |
| `student_answer` | `str` | Yes | The student's submitted answer |
| `rubric` | `RubricWeight` | Yes | Weight distribution (new 3-key or legacy 6-key schema) |
| `max_score` | `float` | No | Default total marks (default: `10.0`) |
| `total_marks` | `float` | No | Overrides `max_score` if provided |
| `evaluation_style` | `str` | No | `"balanced"` / `"concept-focused"` / `"strict"` (default: `"balanced"`) |
| `reference_answer` | `str` | No | Reference/model answer for similarity and NLI signals |

### Response

```json
{
  "final_score": 7.85,
  "percentage": 78.5,
  "grade": "C",
  "feedback": "The answer correctly identifies Machine Learning as AI subset and mentions data-driven learning. Could expand on examples or types of ML algorithms for a higher marks question.",
  "rubric_breakdown": {
    "conceptual_understanding": 0.84,
    "completeness_length": 0.72,
    "language_clarity": 0.88
  },
  "metrics": {
    "llm": 0.82,
    "nli": 0.5,
    "similarity": 0.5
  },
  "confidence": 1.0
}
```

**Field explanations:**

| Field | Type | Description |
|---|---|---|
| `final_score` | `float` | Absolute score on the `total_marks` scale (e.g., 7.85 out of 10) |
| `percentage` | `float` | Score as percentage (0–100) |
| `grade` | `str` | Letter grade: `A`, `B`, `C`, `D`, or `F` |
| `feedback` | `str` | GPT-4o-mini-generated natural language feedback |
| `rubric_breakdown.conceptual_understanding` | `float` | Hybrid concept score (0.0–1.0) |
| `rubric_breakdown.completeness_length` | `float` | LLM completeness score (0.0–1.0) |
| `rubric_breakdown.language_clarity` | `float` | LLM clarity score (0.0–1.0) |
| `metrics.llm` | `float` | Raw LLM concept score before hybridization |
| `metrics.nli` | `float` | NLI entailment score (0.5 when no reference provided) |
| `metrics.similarity` | `float` | Semantic similarity score (0.5 when no reference provided) |
| `confidence` | `float` | Currently always `1.0` (placeholder) |

> **Note on `nli` and `similarity` being `0.5`:** When no `reference_answer` is provided, both engines return a default of `0.5`. This is neutral — it neither added points nor removed them. The signals appear in `metrics` as `0.5` in this case.

---

## 14. Design Philosophy

### 1. LLM as Primary Judge, Signals as Anchors

The architecture does not trust any single source of truth. The LLM provides nuanced, contextual reasoning that rule-based systems cannot replicate. However, LLMs can be non-deterministic and occasionally overconfident. The similarity and NLI signals provide deterministic anchors that stabilize the concept score through the hybrid formula.

### 2. Separation of Concerns

Each engine has a single, testable responsibility:
- `Validator` knows nothing about scoring — only pass/fail.
- `DepthEstimator` knows nothing about models — only heuristics.
- `SimilarityEngine` knows nothing about rubrics — only cosine distance.
- `NLIEngine` knows nothing about weights — only entailment probability.
- `LLMJudge` knows nothing about aggregation — only prompt construction and parsing.
- `Aggregator` knows nothing about models — only arithmetic.

### 3. Contract-Driven API

The route is designed around strict Pydantic schemas. All inputs are validated before reaching the service layer. All outputs conform to a fixed schema regardless of internal state. This makes the API predictable for frontend developers.

### 4. Fail-Safe Zero Responses

The system never crashes the API contract. Every failure mode (validation failure, LLM timeout, JSON parse error) resolves to a valid `EvaluationResponse` with zero scores and an explanatory `feedback` string. This design prioritizes API stability over noisy error propagation.

### 5. Adaptive Evaluation

A 1-mark question expecting a one-sentence definition should not be graded by the same depth expectation as a 10-mark analytical essay. The `DepthEstimator` and the LLM prompt both scale expectations based on `total_marks`. The goal is **fairness through context** — short answers to short questions should not be penalized.

---

## 15. Technical Trade-offs

### 1. OpenRouter vs. Direct OpenAI API

Using OpenRouter adds one hop of network latency but provides:
- A unified API across multiple model providers
- Usage tracking and rate-limit management via a single key
- Easy model switching (e.g., `openai/gpt-4o-mini` → `anthropic/claude-haiku`) without code changes

**Trade-off:** Slightly higher latency and dependency on a third-party proxy. Mitigated by the 45-second timeout.

### 2. Cross-Encoder NLI vs. Bi-Encoder for NLI

Cross-encoders process both texts jointly through the model, which is more accurate than bi-encoders for NLI because they can model token-level interactions between premise and hypothesis. The trade-off is that cross-encoders do not produce reusable embeddings — both texts must be processed together every time.

**Trade-off:** More accurate NLI at the cost of not being able to pre-encode reference answers.

### 3. `temperature=0` for LLM

Setting `temperature` to 0 forces greedy decoding, maximizing determinism. This is correct for a grading system where the same answer should receive the same score.

**Trade-off:** Eliminates creative variation in feedback language. All feedback for similar inputs will be similar in wording.

### 4. Hardcoded `confidence=1.0`

Confidence is a structurally sound field in the schema and formula, but its implementation is a placeholder. The architecture is ready for a real uncertainty quantification method (e.g., LLM self-reported confidence, score variance across multiple sampling passes).

**Trade-off:** Consumers receive a confidence value that cannot currently be used for decision-making.

### 5. NLI Always Receives Empty Reference

The NLI engine is called with `reference_answer=""`, meaning it always returns `0.5`. The engine is architecturally present and functional — it simply does not participate meaningfully in scoring without a reference answer being passed through. This is a known state: the signal machinery exists and can be activated by passing the actual reference answer to the NLI call.

**Trade-off:** NLI contributes only a constant `0.5 × nli_w` term to the hybrid formula, making it act as a weighting correction rather than a real signal.

---

## 16. Why This Architecture Was Chosen

### Why FastAPI?

FastAPI provides native `async/await` support, which is essential here — the LLM HTTP call uses `httpx.AsyncClient`, and the main route handler is `async`. Using a synchronous framework (e.g., Flask) would block the entire server thread during the LLM wait, destroying concurrency.

### Why Pydantic Schemas?

Pydantic provides runtime type validation at the boundary between HTTP and business logic. Any malformed input (wrong types, missing required fields) is rejected automatically with a descriptive `422 Unprocessable Entity` before the code runs. This replaces manual validation code.

### Why a Separate `Aggregator`?

Separating score compilation from signal generation means the weighting formula can be changed without touching any ML engine. It is also the only component that directly implements the grade boundaries — centralizing this logic prevents it from being duplicated.

### Why Two Rubric Schemas?

The legacy 6-key schema (`conceptual_understanding`, `language_clarity`, `answer_completeness`, `spelling_accuracy`, `handling_incorrect`, `effort_bonus`) was the original contract. The new 3-key schema (`concept`, `completeness`, `clarity`) was introduced for simplicity. Supporting both in `_normalize_rubric` allows the service to upgrade its internal model without breaking existing clients.

### Why the `.env` Directory Walker?

The `main.py` `.env` discovery mechanism (`for parent in current_file.parents`) exists to support operating this service from various working directories or within a parent monorepo, where the `.env` may live in a parent directory rather than adjacent to the service's files.

---

## 17. Limitations (Visible from Existing Code)

1. **NLI signal is always 0.5** when no reference answer is provided — which is always the case in the current call path (`nli_engine.evaluate(question, student_answer, "")`). The NLI engine is functional but not fully wired.

2. **`SpellingEngine` always returns `1.0`** — as documented in its own code: "Taking a safe 1.0 default… waiting for a proper dictionary dependency." Spelling accuracy is not scored.

3. **`DescriptiveEngine` is not used in the main pipeline** — it is instantiated in `EvaluationService` but its `evaluate_components` or scoring methods are never called in `evaluate_student_answer`. It is architecturally present but dormant.

4. **`confidence` is always `1.0`** in the adaptive path — the field is a placeholder pending a real uncertainty quantification approach.

5. **`Aggregator.aggregate()` (legacy method) is a no-op** — it returns `_finalize_score(0.0, 1.0, max_score)` unconditionally. It exists as a safety fallback but is not called by the active pipeline.

6. **CORS is fully open** (`allow_origins=["*"]`) — appropriate for development, but not production-safe.

7. **No authentication on the API** — any client with network access can POST to `/evaluate/`. No API key or token validation is enforced at the application layer.

8. **Retry count is hardcoded** — `LLMClient.send_prompt` has a `retries=1` default parameter, giving 2 total attempts. This is not configurable via environment variable.

9. **`validate_adaptive` does not actually adapt** — despite the docstring stating different minimum word counts for `total_marks <= 2` vs `> 2`, the code always uses `min_words=1` regardless of marks.

---

## 18. Conclusion

The **Evaluation Service** is a layered, signal-driven academic answer grading system. It combines:

- **Fast deterministic pre-filters** (Validator, DepthEstimator) to reject clearly invalid inputs and provide context signals.
- **Lightweight ML signals** (MiniLM semantic similarity, DistilRoBERTa NLI entailment) to generate objective anchors.
- **LLM reasoning** (GPT-4o-mini via OpenRouter) as the primary judge for nuanced evaluation of concept understanding, completeness, and clarity.
- **A hybrid stabilization formula** that blends LLM output with ML signals to produce a more robust concept score than any single source alone.
- **A deterministic weighted aggregator** that converts normalized criterion scores into a final absolute mark and letter grade.

The architecture is contract-driven, fail-safe, and extensible. Its three-layer pipeline mirrors professional human marking: a quick check for validity, objective signal gathering, and then holistic judgment — all resolved into a single, structured JSON grade report.

---

*This README documents the repository as it exists at the time of writing. All descriptions are based directly on the source code.*
