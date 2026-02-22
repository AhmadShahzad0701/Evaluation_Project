# Evaluation Service — Quizora

A FastAPI-based microservice that evaluates student short-answer responses using a three-layer pipeline: structural validation, semantic signal generation, and LLM-based reasoning. The final score is computed from a fixed Balanced Teacher formula rather than arbitrary rubric weights.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Data Flow](#3-data-flow)
4. [Evaluation Logic Breakdown](#4-evaluation-logic-breakdown)
5. [Folder Structure](#5-folder-structure)
6. [API Endpoints](#6-api-endpoints)
7. [Models Used](#7-models-used)
8. [Installation & Running](#8-installation--running)
9. [Known Limitations](#9-known-limitations)

---

## 1. Project Overview

The Evaluation Service is a single-responsibility REST API that accepts a student answer alongside a question, an optional reference answer, a rubric weight object, and a `total_marks` value. It returns a numeric score, letter grade, per-component breakdown, signal metrics, and natural-language feedback.

**What the service does in practice:**

- Rejects structurally invalid answers (empty, spam, purely symbolic/numeric strings) before touching any model.
- Computes a semantic similarity score and similarity band (`Noise` / `Partial` / `Full`) using sentence embeddings.
- Computes an NLI entailment score between the reference answer and the student answer using a cross-encoder model.
- Estimates answer depth deterministically from word count and sentence segmentation.
- Calls an external LLM (`openai/gpt-4o-mini` via OpenRouter) with all signals bundled in a structured prompt.
- Applies code-level guardrails on top of the LLM scores before running the final scoring formula.
- Returns a structured JSON response.

The `rubric` field in the request is normalised internally but **does not directly affect the final score formula** in the current implementation. The final score is always:

```
Final Ratio = (concept × 0.8) + (clarity × 0.2)
Hard rule   : if concept == 0.0 → Final Ratio = 0.0
Final Score  = Final Ratio × total_marks
```

---

## 2. System Architecture

### High-Level Components

```
HTTP Client
    │
    ▼
┌─────────────────────┐
│   FastAPI App        │   app/main.py
│   (CORS enabled)     │
└────────┬────────────┘
         │  POST /evaluate/
         ▼
┌─────────────────────┐
│  EvaluationRoutes   │   app/api/evaluation_routes.py
│  (thin HTTP layer)  │
└────────┬────────────┘
         │  delegates to
         ▼
┌────────────────────────────────────────────────────────┐
│                  EvaluationService                      │   app/services/evaluation_service.py
│                                                         │
│  Layer 1a: Validator          (structural gate)         │
│  Layer 1b: DepthEstimator     (heuristic signal)        │
│  Layer 2:  SimilarityEngine   (MiniLM embeddings)       │
│            NLIEngine          (cross-encoder NLI)       │
│  Layer 3:  LLMJudge           (GPT-4o-mini via OR)      │
│                                                         │
│  Score formula + guardrails applied after layer 3       │
└────────────────────────────────────────────────────────┘
```

### Services & Integrations

| Component | Role | External Dependency |
|---|---|---|
| `FastAPI` | HTTP framework | — |
| `Validator` | Pre-LLM structural gate | — |
| `DepthEstimator` | Depth heuristic signal | — |
| `SimilarityEngine` | Semantic similarity + band | `sentence-transformers/all-MiniLM-L6-v2` (HuggingFace) |
| `NLIEngine` | Entailment score | `cross-encoder/nli-distilroberta-base` (HuggingFace) |
| `LLMJudge` | Balanced scoring + feedback | OpenRouter → `openai/gpt-4o-mini` |
| `Aggregator` | Legacy utility (not called in active path) | — |
| `SpellingEngine` | Placeholder (always returns 1.0) | — |
| `DescriptiveEngine` | Standalone rubric engine (not called in active path) | — |

---

## 3. Data Flow

```
POST /evaluate/
  │
  │  EvaluationRequest {question, student_answer, rubric, max_score,
  │                      total_marks?, evaluation_style, reference_answer?}
  │
  ▼
[Context Normalisation]
  • total_marks = total_marks ?? max_score
  • rubric is normalised to {concept, completeness, clarity}

  ▼
[Layer 1a — Structural Validation]  Validator.validate_adaptive()
  • Empty / blank check
  • Spam / repetition check  (unique words < 40% for >6-word inputs)
  • Gibberish check          (no letters / avg word > 30 chars /
                               consonant-to-vowel ratio > 6:1)
  • Minimum meaningful word  (≥ 1 non-stopword token)
  ── If invalid → return zero-score EvaluationResponse immediately ──

  ▼
[Layer 1b — Depth Heuristic]  DepthEstimator.estimate()
  • expected_points based on total_marks tiers (1-2 / 3-5 / 6-10 / >10)
  • actual_points = meaningful sentence/bullet segments (≥3 words)
  • depth_score = min(actual / expected, 1.0) + 0.1 connector bonus
  • Result is a dict passed as a signal to the LLM; does NOT affect scoring formula

  ▼
[Layer 2a — Semantic Similarity]  SimilarityEngine.evaluate_with_band()
  • If student_answer empty              → (0.0, "Noise")
  • If no reference_answer provided      → (0.5, "Partial")  ← fallback
  • Exact-match / token-containment      → (1.0, "Full")
  • Otherwise: MiniLM cosine similarity, normalised to [0,1],
    classified as Noise(<0.30) / Partial(0.30–0.70) / Full(>0.70)
  • Noise band forces similarity_score = 0.0

[Layer 2b — NLI Entailment]  NLIEngine.evaluate()
  • If student_answer empty              → 0.0
  • If reference_answer is None or ""   → 0.5  ← neutral fallback
  • Otherwise: cross-encoder softmax,
    extracts probability of entailment label (index 2 of [contradiction,
    neutral, entailment])
  NOTE: In evaluation_service.py (line 89) the call passes an empty
  string ("") as reference_answer regardless of whether
  request.reference_answer is set. Based on current implementation,
  the NLI score therefore always returns the neutral fallback value
  of 0.5 when the LLM receives the nli_score signal.

  ▼
[Layer 3 — LLM Reasoning]  LLMJudge.evaluate_balanced()
  • Builds BALANCED_TEACHER_PROMPT with:
      - question, student_answer, reference_answer (or "Not provided")
      - total_marks, similarity_band
      - sim_score, nli_score, depth_score (informational signals)
  • Sends prompt to openai/gpt-4o-mini via OpenRouter (temperature=0,
    max_tokens=500, timeout=45 s, 1 retry with 1 s back-off)
  • Parses JSON response: {concept, completeness, clarity, feedback}
  • Post-processing guardrails inside LLMJudge:
      - Full band        → concept = max(concept, 0.85)
      - Full band + ≤3w  → clarity = max(clarity, 0.70)
      - Noise band + ≤3w → concept = 0.0

  ▼
[Score Extraction & Guardrails in EvaluationService]
  • Additional short-form boost (≤3 words + Full band):
      llm_concept = max(llm_concept, 0.85)

  ▼
[Balanced Teacher Formula]
  • if concept == 0.0 → final_ratio = 0.0
  • else              → final_ratio = (concept × 0.8) + (clarity × 0.2)
  • final_ratio clamped to [0.0, 1.0]
  • final_score = round(final_ratio × total_marks, 2)
  • percentage  = round(final_ratio × 100, 2)

  ▼
[Grade Assignment]
  • ≥90% → A | ≥80% → B | ≥70% → C | ≥60% → D | <60% → F

  ▼
EvaluationResponse {
  final_score, percentage, grade, feedback,
  rubric_breakdown {conceptual_understanding, completeness_length,
                    language_clarity, spelling_accuracy=0.0,
                    handling_incorrect=0.0, effort_bonus=0.0},
  metrics {llm (=concept), nli, similarity},
  confidence
}
```

---

## 4. Evaluation Logic Breakdown

### Scoring Formula

```
Final Ratio = (concept × 0.8) + (clarity × 0.2)
Final Score  = Final Ratio × total_marks
```

`completeness` from the LLM is stored in `rubric_breakdown.completeness_length` for display purposes only. It has **zero weight** in the formula.

### Fixed Weights (immutable constants in `EvaluationService`)

| Weight Constant | Value |
|---|---|
| `CONCEPT_WEIGHT` | `0.8` |
| `CLARITY_WEIGHT` | `0.2` |

### Scoring Components

| Component | Source | Range | Formula Role |
|---|---|---|---|
| `concept` | LLM + guardrails | 0.0 – 1.0 | Primary (80%) |
| `clarity` | LLM + guardrails | 0.0 – 1.0 | Secondary (20%) |
| `completeness` | LLM (metadata only) | 0.0 – 1.0 | Display only |
| `similarity_score` | MiniLM cosine | 0.0 – 1.0 | LLM signal |
| `nli_score` | NLI cross-encoder | 0.0 – 1.0 | LLM signal |
| `depth_score` | DepthEstimator heuristic | 0.0 – 1.0 | LLM signal |
| `spelling_accuracy` | SpellingEngine (placeholder) | Always 1.0 | Not used in formula |

### Guardrails (Applied in Code, Not Only in Prompt)

| Condition | Effect |
|---|---|
| `similarity_band == "Full"` (in `LLMJudge`) | `concept = max(concept, 0.85)` |
| `similarity_band == "Full"` + `word_count ≤ 3` (in `LLMJudge`) | `clarity = max(clarity, 0.70)` |
| `similarity_band == "Noise"` + `word_count ≤ 3` (in `LLMJudge`) | `concept = 0.0` |
| `word_count ≤ 3` + `similarity_band == "Full"` (in `EvaluationService`) | `concept = max(concept, 0.85)` (duplicated guard) |
| `concept == 0.0` (in `EvaluationService`) | `final_ratio = 0.0` (no marks awarded) |

### Similarity Band Thresholds

| Band | Cosine Score Range | Similarity Score Used |
|---|---|---|
| `Noise` | `< 0.30` | `0.0` (suppressed) |
| `Partial` | `0.30 – 0.70` | Raw cosine value |
| `Full` | `> 0.70` | Raw cosine value |

Exact-match and token-containment overrides (student tokens ⊆ reference tokens, ≤ 4 words) short-circuit to `(1.0, "Full")` before cosine computation.

### Rubric Normalisation

Incoming `rubric` is normalised to a `{concept, completeness, clarity}` dict via `_normalize_rubric()`:

- **3-key schema**: uses `concept / completeness / clarity` directly.
- **Legacy 6-key schema**: maps `conceptual_understanding + handling_incorrect → concept`, `answer_completeness + effort_bonus → completeness`, `language_clarity + spelling_accuracy → clarity`.

The normalised rubric is then proportionally scaled so all weights sum to 1.0. In the current scoring formula, these normalised weights are **not applied** to compute `final_score`; they are used only to detect an all-zero rubric (early exit) and are carried through as metadata.

### Grade Scale

| Percentage | Grade |
|---|---|
| ≥ 90 | A |
| ≥ 80 | B |
| ≥ 70 | C |
| ≥ 60 | D |
| < 60 | F |

---

## 5. Folder Structure

```
evaluation-service/
│
├── app/                          # Main application package
│   ├── main.py                   # FastAPI app creation, CORS, router inclusion, .env loading
│   │
│   ├── api/
│   │   └── evaluation_routes.py  # Single POST route; delegates to EvaluationService
│   │
│   ├── schemas/
│   │   └── evaluation_schemas.py # Pydantic models: EvaluationRequest, EvaluationResponse,
│   │                             #   RubricWeight, RubricBreakdown, Metrics
│   │
│   ├── services/
│   │   └── evaluation_service.py # Orchestration: 3-layer pipeline, scoring formula,
│   │                             #   guardrails, grade assignment
│   │
│   ├── engines/
│   │   ├── validator.py          # Structural validation (empty, spam, gibberish checks)
│   │   ├── depth_estimator.py    # Heuristic depth signal (segments, connectors)
│   │   ├── similarity_engine.py  # MiniLM semantic similarity + band classification
│   │   ├── nli_engine.py         # NLI cross-encoder entailment scoring
│   │   ├── aggregator.py         # Legacy aggregation utility (not called in active path)
│   │   ├── spelling_engine.py    # Placeholder spelling engine (always returns 1.0)
│   │   ├── descriptive_engine.py # Standalone rubric engine (not called in active path)
│   │   └── llm/
│   │       ├── client.py         # Async HTTP client for OpenRouter; JSON parsing; retry logic
│   │       ├── judge.py          # LLMJudge: prompt construction, LLM call, guardrails
│   │       └── prompts.py        # Three prompt templates: EVALUATION_PROMPT,
│   │                             #   ADAPTIVE_EVALUATION_PROMPT, BALANCED_TEACHER_PROMPT
│   │
│   └── utils/
│       └── __init__.py           # Empty (reserved for utility functions)
│
├── Test/                         # Manual/ad-hoc test scripts (contents not part of production flow)
│
├── .env                          # Active environment file (not committed; contains OPENROUTER_API_KEY)
├── .env.example                  # Example: OPENROUTER_API_KEY=<value>
├── requirements.txt              # Python package dependencies
├── pyrightconfig.json            # Pyright type-checker configuration
├── calculate_mae.py              # Standalone script: computes MAE on phase1 eval data
├── run_phase1_evaluation.py      # Standalone script: runs batch evaluation on phase1 CSV
├── phase1_final_dataset.csv      # Phase 1 raw evaluation dataset
├── phase1_with_system_scores.csv # Phase 1 dataset augmented with system scores
├── verify_api_fix.py             # Standalone verification script for API correctness
└── verify_backend.py             # Standalone verification script for backend behaviour
```

---

## 6. API Endpoints

### `GET /health`

**Purpose:** Health check.

**Response:**
```json
{ "status": "ok" }
```

---

### `POST /evaluate/`

**Purpose:** Evaluate a student short-answer response.

**Request Body (`application/json`):**

```json
{
  "question": "What is the capital of Pakistan?",
  "student_answer": "Islamabad",
  "rubric": {
    "concept": 0.6,
    "completeness": 0.2,
    "clarity": 0.2
  },
  "max_score": 10.0,
  "total_marks": 2.0,
  "evaluation_style": "balanced",
  "reference_answer": "Islamabad is the capital city of Pakistan."
}
```

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `question` | `string` | ✅ | — | The quiz question |
| `student_answer` | `string` | ✅ | — | Student's response |
| `rubric` | `RubricWeight` | ✅ | — | See schema below |
| `max_score` | `float` | ❌ | `10.0` | Used if `total_marks` is absent |
| `total_marks` | `float` | ❌ | `null` | Overrides `max_score` when present |
| `evaluation_style` | `string` | ❌ | `"balanced"` | Field accepted but not forwarded to active prompt |
| `reference_answer` | `string` | ❌ | `null` | Used by SimilarityEngine; see NLI note in §3 |

**`RubricWeight` — accepted keys:**

*3-key (preferred):*

| Key | Type |
|---|---|
| `concept` | `float` |
| `completeness` | `float` |
| `clarity` | `float` |

*Legacy 6-key (mapped internally):*

| Key | Maps to |
|---|---|
| `conceptual_understanding` | `concept` |
| `handling_incorrect` | `concept` |
| `answer_completeness` | `completeness` |
| `effort_bonus` | `completeness` |
| `language_clarity` | `clarity` |
| `spelling_accuracy` | `clarity` |

**Response Body (`200 OK`):**

```json
{
  "final_score": 1.8,
  "percentage": 90.0,
  "grade": "A",
  "feedback": "Correct. Islamabad is the capital of Pakistan.",
  "rubric_breakdown": {
    "conceptual_understanding": 1.0,
    "completeness_length": 0.6,
    "language_clarity": 0.8,
    "spelling_accuracy": 0.0,
    "handling_incorrect": 0.0,
    "effort_bonus": 0.0
  },
  "metrics": {
    "llm": 1.0,
    "nli": 0.5,
    "similarity": 1.0
  },
  "confidence": 1.0
}
```

| Field | Type | Description |
|---|---|---|
| `final_score` | `float` | Absolute score out of `total_marks` |
| `percentage` | `float` | `final_ratio × 100` |
| `grade` | `string` | `A` / `B` / `C` / `D` / `F` |
| `feedback` | `string` | Natural-language feedback from LLM; validation reason on early exits |
| `rubric_breakdown.conceptual_understanding` | `float` | LLM concept score |
| `rubric_breakdown.completeness_length` | `float` | LLM completeness (metadata only; not in formula) |
| `rubric_breakdown.language_clarity` | `float` | LLM clarity score |
| `rubric_breakdown.spelling_accuracy` | `float` | Always `0.0` (not populated) |
| `rubric_breakdown.handling_incorrect` | `float` | Always `0.0` (not populated) |
| `rubric_breakdown.effort_bonus` | `float` | Always `0.0` (not populated) |
| `metrics.llm` | `float` | Equal to `rubric_breakdown.conceptual_understanding` |
| `metrics.nli` | `float` | NLI entailment score (see §3 for current behaviour) |
| `metrics.similarity` | `float` | Raw cosine similarity score (or override value) |
| `confidence` | `float` | Always `1.0` in current implementation |

**Error Response (`500`):**

```json
{ "detail": "Evaluation failed: <error message>" }
```

---

## 7. Models Used

### `sentence-transformers/all-MiniLM-L6-v2`

| | |
|---|---|
| **Type** | Sentence embedding model (bi-encoder) |
| **Loaded in** | `SimilarityEngine.__init__()` via `sentence_transformers.SentenceTransformer` |
| **How used** | Encodes student answer and reference answer into 384-dim vectors; cosine similarity computed via NumPy; score normalised from `[-1,1]` to `[0,1]` |
| **Download** | Automatic from HuggingFace Hub on first startup |

### `cross-encoder/nli-distilroberta-base`

| | |
|---|---|
| **Type** | Cross-encoder classification model (NLI, 3-class: contradiction / neutral / entailment) |
| **Loaded in** | `NLIEngine.__init__()` via `transformers.AutoTokenizer` and `AutoModelForSequenceClassification` |
| **How used** | Tokenizes `(premise=reference_answer, hypothesis=student_answer)`; runs forward pass with `torch.no_grad()`; applies softmax; extracts entailment class probability at index `2` |
| **Inference mode** | `model.eval()` (CPU; no gradient computation) |
| **Download** | Automatic from HuggingFace Hub on first startup |

### `openai/gpt-4o-mini` (via OpenRouter)

| | |
|---|---|
| **Type** | External LLM API |
| **Accessed in** | `LLMClient.send_prompt()` — `https://openrouter.ai/api/v1/chat/completions` |
| **Configured in** | `LLMJudge.__init__()`: `self.model = "openai/gpt-4o-mini"` |
| **Request settings** | `temperature=0` (deterministic), `max_tokens=500`, `timeout=45.0 s`, `retries=1` |
| **Prompt used** | `BALANCED_TEACHER_PROMPT` (from `app/engines/llm/prompts.py`) |
| **Output parsed** | JSON with keys: `concept`, `completeness`, `clarity`, `feedback`, `reasoning` |
| **Authentication** | `OPENROUTER_API_KEY` environment variable |

---

## 8. Installation & Running

### Prerequisites

- Python 3.10+
- An [OpenRouter](https://openrouter.ai) API key
- Internet access for model downloads on first startup (HuggingFace Hub)

### 1. Clone and Enter the Directory

```bash
git clone <repository-url>
cd evaluation-service
```

### 2. Create a Virtual Environment

```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Linux / macOS
source venv/bin/activate
```

### 3. Install Dependencies

The `requirements.txt` pins the following packages. Additional packages required by the ML models (`torch`, `transformers`, `sentence-transformers`) must be installed separately as they are not listed in `requirements.txt`.

```bash
pip install -r requirements.txt
pip install torch transformers sentence-transformers httpx
```

### 4. Configure Environment

Copy the example and add your API key:

```bash
cp .env.example .env
```

Edit `.env`:

```
OPENROUTER_API_KEY=sk-or-v1-<your-key-here>
```

The application searches for `.env` by walking up the directory tree from `main.py`. The file must exist at or above the `app/` directory.

### 5. Run the Service

```bash
uvicorn app.main:app --reload --port 8001
```

The service will be available at `http://localhost:8001`.

On first startup, `SimilarityEngine` and `NLIEngine` will download their respective models from HuggingFace Hub, which requires a network connection and may take several minutes.

### 6. Verify

```bash
curl http://localhost:8001/health
# Expected: {"status":"ok"}
```

```bash
curl -X POST http://localhost:8001/evaluate/ \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is the capital of Pakistan?",
    "student_answer": "Islamabad",
    "rubric": {"concept": 0.6, "completeness": 0.2, "clarity": 0.2},
    "total_marks": 2
  }'
```

---

## 9. Known Limitations

### NLI Reference Wiring

In `evaluation_service.py` line 89, `NLIEngine.evaluate()` is called with a hardcoded empty string `""` as the `reference_answer` argument:

```python
nli_score = self.nli_engine.evaluate(request.question, request.student_answer, "")
```

Because `NLIEngine.evaluate()` returns the neutral fallback (`0.5`) whenever `reference_answer` is empty or falsy, the `nli_score` in `metrics.nli` and in the LLM signal is always `0.5` regardless of whether a `reference_answer` was provided in the request. The NLI model is loaded and initialised but does not perform a real semantic comparison in the current execution path.

### `SpellingEngine` Is a Placeholder

`SpellingEngine.check()` always returns `1.0`. The class acknowledges this in its own docstring. It is instantiated in `EvaluationService.__init__()` but its return value is never used anywhere in the active scoring path.

### `Aggregator` and `DescriptiveEngine` Are Not Called

Both `Aggregator` and `DescriptiveEngine` are imported and instantiated in `EvaluationService.__init__()` but are never invoked in the `evaluate_student_answer()` method. Their logic does not contribute to any response produced by the service.

### `evaluation_style` Field Is Not Forwarded

`EvaluationRequest.evaluation_style` is accepted in the schema (default `"balanced"`) but is not passed to `LLMJudge.evaluate_balanced()`. The `BALANCED_TEACHER_PROMPT` template does not include a style parameter slot.

### `rubric` Weights Do Not Affect Final Score

The incoming rubric weights are normalised and checked for an all-zero condition but are not substituted into the scoring formula. The formula always applies `concept × 0.8 + clarity × 0.2` regardless of the weight distribution sent by the caller.

### `confidence` Is Always `1.0`

`LLMJudge.evaluate_balanced()` hardcodes `"confidence": 1.0` in its return dict. This value is passed through to `EvaluationResponse.confidence` without modification.

### `requirements.txt` Is Incomplete

`torch`, `transformers`, `sentence-transformers`, and `httpx` are required at runtime but are absent from `requirements.txt`. A fresh install from the file alone will fail on startup.

### No Rate Limiting or Authentication

The API has no authentication layer and no rate limiting. CORS is configured as `allow_origins=["*"]`.
