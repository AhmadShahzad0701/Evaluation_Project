"use client";

import { useState } from "react";
import Header from "./components/Header";
import ProgressBar from "./components/ProgressBar";
import Card from "./components/Card";
import StudentForm from "./components/StudentForm";
import MarksForm from "./components/MarksForm";
import ResultView from "./components/ResultView";
import LoadingOverlay from "./components/LoadingOverlay";
import SuccessScreen from "./components/SuccessScreen";

export default function EvaluationPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [student, setStudent] = useState({
    name: "",
    rollNo: "",
    subject: "",
  });

  const [marks, setMarks] = useState({
    q1: "",
    q2: "",
    q3: "",
  });

  const submitEvaluation = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      {loading && <LoadingOverlay />}

      <div className="w-full max-w-2xl">
        <Header />

        <ProgressBar step={step} />

        <Card>
          {!submitted && step === 1 && (
            <StudentForm
              data={student}
              setData={setStudent}
              next={() => setStep(2)}
            />
          )}

          {!submitted && step === 2 && (
            <MarksForm
              marks={marks}
              setMarks={setMarks}
              back={() => setStep(1)}
              next={() => setStep(3)}
            />
          )}

          {!submitted && step === 3 && (
            <ResultView
              student={student}
              marks={marks}
              back={() => setStep(2)}
              submit={submitEvaluation}
            />
          )}

          {submitted && <SuccessScreen />}
        </Card>
      </div>
    </div>
  );
}
