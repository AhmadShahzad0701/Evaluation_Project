"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LucideIcon, Zap, Scale, ShieldCheck } from "lucide-react";

import TeacherNavbar from "@/app/evaluation/components/TeacherNavbar";

import { Card } from "@/app/evaluation/components/card";
import { Button } from "@/app/evaluation/components/button";
import { Input } from "@/app/evaluation/components/input";
import { Textarea } from "@/app/evaluation/components/textarea";

import { evaluateAnswer } from "@/app/evaluation/services/evaluationService";

type Mode = "fast" | "balanced" | "strict";

export default function EvaluationPage() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("balanced");
  const [isEvaluating, setIsEvaluating] = useState(false);

  const [form, setForm] = useState({
    student_id: "",
    question_id: "",
    question: "",
    model_answer: "",
    student_answer: "",
  });

  const handleEvaluate = async () => {
    setIsEvaluating(true);

    const payload = {
      evaluations: [
        {
          student_id: form.student_id,
          question_id: form.question_id,
          question_type: "descriptive" as const,
          question: form.question,
          model_answer: form.model_answer,
          student_answer: form.student_answer,
          rubric:
            mode === "fast"
              ? { "Conceptual Understanding": 4, Clarity: 2, Completeness: 1 }
              : mode === "strict"
              ? { "Conceptual Understanding": 6, Clarity: 3, Completeness: 1 }
              : { "Conceptual Understanding": 5, Clarity: 3, Completeness: 2 },
          max_score: 10,
        },
      ],
    };

    try {
      const result = await evaluateAnswer(payload);
      localStorage.setItem("evaluationResult", JSON.stringify(result));
      router.push("/evaluation/results");
    } catch (error) {
      console.error(error);
      alert("Evaluation failed. Please try again.");
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <TeacherNavbar />

      <main className="pt-20 pb-14 px-4">
        <div className="max-w-7xl mx-auto space-y-10">

          {/* HEADER */}
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              AI Evaluation
            </h1>
            <p className="text-muted-foreground mt-1">
              Evaluate student answers using Quizora’s AI-powered grading engine
            </p>
          </div>

          {/* MODE SELECTION */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Evaluation Style
            </h2>

            <div className="grid md:grid-cols-3 gap-5">
              <EvalModeCard
                title="Fast"
                desc="Quick & lenient checking"
                icon={Zap}
                active={mode === "fast"}
                onClick={() => setMode("fast")}
              />
              <EvalModeCard
                title="Balanced"
                desc="Recommended default"
                icon={Scale}
                active={mode === "balanced"}
                onClick={() => setMode("balanced")}
              />
              <EvalModeCard
                title="Strict"
                desc="Exam-level evaluation"
                icon={ShieldCheck}
                active={mode === "strict"}
                onClick={() => setMode("strict")}
              />
            </div>
          </div>

          {/* INPUT DETAILS */}
          <Card className="p-6 space-y-5">
            <h2 className="text-lg font-semibold">
              Evaluation Details
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              <Input
                placeholder="Student ID (e.g. S5)"
                value={form.student_id}
                onChange={(e) =>
                  setForm({ ...form, student_id: e.target.value })
                }
              />
              <Input
                placeholder="Question ID (e.g. Q1)"
                value={form.question_id}
                onChange={(e) =>
                  setForm({ ...form, question_id: e.target.value })
                }
              />
            </div>

            <Textarea
              placeholder="Question statement"
              rows={3}
              value={form.question}
              onChange={(e) =>
                setForm({ ...form, question: e.target.value })
              }
            />

            <Textarea
              placeholder="Expected / Model Answer (Teacher Answer)"
              rows={4}
              value={form.model_answer}
              onChange={(e) =>
                setForm({ ...form, model_answer: e.target.value })
              }
            />

            <Textarea
              placeholder="Student answer (leave empty if not attempted)"
              rows={5}
              value={form.student_answer}
              onChange={(e) =>
                setForm({ ...form, student_answer: e.target.value })
              }
            />
          </Card>

          {/* ACTION */}
          <div className="flex justify-end">
            <Button
              disabled={isEvaluating}
              onClick={handleEvaluate}
              className="bg-gradient-primary hover:opacity-90"
            >
              {isEvaluating ? "Evaluating..." : "Start Evaluation"}
            </Button>
          </div>

        </div>
      </main>
    </div>
  );
}

/* --------------------------- */
/* Evaluation Mode Card */
/* --------------------------- */
function EvalModeCard({
  title,
  desc,
  icon: Icon,
  active,
  onClick,
}: {
  title: string;
  desc: string;
  icon: LucideIcon;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Card
      onClick={onClick}
      className={`p-5 cursor-pointer transition-all ${
        active
          ? "border-primary bg-primary/5 shadow-sm"
          : "hover:border-muted-foreground/30"
      }`}
    >
      <div className="space-y-3">
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            active ? "bg-primary text-white" : "bg-muted"
          }`}
        >
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground">{desc}</p>
        </div>
      </div>
    </Card>
  );
}
