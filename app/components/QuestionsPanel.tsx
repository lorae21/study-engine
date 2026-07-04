// components/QuestionsPanel.tsx
//
// Left-panel tab, sibling to your Flashcards tab. Flow:
//   1. User enters a topic + optional constraints.
//   2. POST /api/questions -> a list of sourced GeneratedQuestion objects.
//   3. Each question renders as a card:
//        - answer area (type OR draw, toggle-able — draw is meant for
//          stylus/tablet use)
//        - a collapsed "Reveal" section that expands into source citation,
//          correct answer, step-by-step solution (if any), and alternative
//          approaches.
//
// No new dependencies. Drawing uses a plain <canvas> with Pointer Events,
// which already covers mouse, touch, and stylus/pen input (incl. pressure
// on devices that report it) without any extra library.

"use client";

import { useRef, useState, useEffect, useCallback } from "react";

// ---- Types (mirrors app/api/questions/route.ts) ---------------------------

interface QuestionSource {
  title: string;
  author?: string;
  citation: string;
  url?: string;
}

interface GeneratedQuestion {
  id: string;
  prompt: string;
  type: "multiple_choice" | "short_answer" | "problem";
  options?: string[];
  correctAnswer: string;
  hasWorkedSolution: boolean;
  solutionSteps: string[];
  alternativeApproaches: string[];
  source: QuestionSource;
}

// ---- Small drawing canvas for stylus/tablet answers -----------------------

function AnswerCanvas({ questionId }: { questionId: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Reset the backing store whenever the question changes.
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, [questionId]);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    drawing.current = true;
    last.current = getPos(e);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !last.current) return;
    const pos = getPos(e);
    const pressure = e.pressure && e.pressure > 0 ? e.pressure : 0.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1f2933";
    ctx.lineWidth = Math.max(1.5, pressure * 4);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    last.current = pos;
  };

  const stopDrawing = () => {
    drawing.current = false;
    last.current = null;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="qp-canvas-wrap">
      <canvas
        ref={canvasRef}
        width={640}
        height={220}
        className="qp-canvas"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stopDrawing}
        onPointerLeave={stopDrawing}
      />
      <button type="button" className="qp-btn qp-btn-ghost qp-canvas-clear" onClick={clear}>
        Clear
      </button>
    </div>
  );
}

// ---- One question card ------------------------------------------------

function QuestionCard({ question }: { question: GeneratedQuestion }) {
  const [answerMode, setAnswerMode] = useState<"type" | "draw">("type");
  const [typedAnswer, setTypedAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="qp-card">
      <div className="qp-card-head">
        <span className={`qp-badge qp-badge-${question.type}`}>
          {question.type === "multiple_choice"
            ? "Multiple choice"
            : question.type === "problem"
            ? "Problem"
            : "Short answer"}
        </span>
      </div>

      <p className="qp-prompt">{question.prompt}</p>

      {question.type === "multiple_choice" && question.options ? (
        <div className="qp-options">
          {question.options.map((opt, i) => (
            <label key={i} className="qp-option">
              <input
                type="radio"
                name={`q-${question.id}`}
                checked={selectedOption === opt}
                onChange={() => setSelectedOption(opt)}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      ) : (
        <div className="qp-answer-area">
          <div className="qp-answer-toggle">
            <button
              type="button"
              className={`qp-btn qp-toggle-btn ${answerMode === "type" ? "active" : ""}`}
              onClick={() => setAnswerMode("type")}
            >
              Type answer
            </button>
            <button
              type="button"
              className={`qp-btn qp-toggle-btn ${answerMode === "draw" ? "active" : ""}`}
              onClick={() => setAnswerMode("draw")}
            >
              Draw answer
            </button>
          </div>

          {answerMode === "type" ? (
            <textarea
              className="qp-textarea"
              placeholder="Work through it here..."
              value={typedAnswer}
              onChange={(e) => setTypedAnswer(e.target.value)}
              rows={4}
            />
          ) : (
            <AnswerCanvas questionId={question.id} />
          )}
        </div>
      )}

      <button
        type="button"
        className="qp-reveal-toggle"
        onClick={() => setRevealed((r) => !r)}
        aria-expanded={revealed}
      >
        {revealed ? "Hide answer & source ▲" : "Reveal answer & source ▼"}
      </button>

      {revealed && (
        <div className="qp-reveal">
          <div className="qp-reveal-section">
            <div className="qp-reveal-label">Source</div>
            <div className="qp-source">
              <div className="qp-source-title">{question.source.title}</div>
              {question.source.author && (
                <div className="qp-source-meta">{question.source.author}</div>
              )}
              <div className="qp-source-citation">{question.source.citation}</div>
              {question.source.url && (
                <a
                  href={question.source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="qp-source-link"
                >
                  View source ↗
                </a>
              )}
            </div>
          </div>

          <div className="qp-reveal-section">
            <div className="qp-reveal-label">Correct answer</div>
            <div className="qp-correct-answer">{question.correctAnswer}</div>
          </div>

          {question.hasWorkedSolution && question.solutionSteps.length > 0 && (
            <div className="qp-reveal-section">
              <div className="qp-reveal-label">Step-by-step solution</div>
              <ol className="qp-steps">
                {question.solutionSteps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          {question.alternativeApproaches.length > 0 && (
            <div className="qp-reveal-section">
              <div className="qp-reveal-label">Other ways to approach it</div>
              <ul className="qp-alt-approaches">
                {question.alternativeApproaches.map((alt, i) => (
                  <li key={i}>{alt}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---- Panel: topic/constraints form + generated list ------------------

export default function QuestionsPanel() {
  const [topic, setTopic] = useState("");
  const [constraints, setConstraints] = useState("");
  const [count, setCount] = useState(5);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [grounded, setGrounded] = useState<boolean | null>(null);

  const generate = useCallback(async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, constraints, count }),
      });
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      setQuestions(data.questions ?? []);
      setGrounded(data.grounded ?? null);
    } catch {
      setError("Couldn't generate questions. Try again, or narrow the topic.");
    } finally {
      setLoading(false);
    }
  }, [topic, constraints, count]);

  return (
    <div className="qp-panel">
      <style>{QP_STYLES}</style>

      <div className="qp-form">
        <label className="qp-field-label">Topic</label>
        <input
          className="qp-input"
          placeholder="e.g. undamped harmonic oscillators"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />

        <label className="qp-field-label">Constraints (optional)</label>
        <input
          className="qp-input"
          placeholder="e.g. mix of problems and short answer, undergrad level"
          value={constraints}
          onChange={(e) => setConstraints(e.target.value)}
        />

        <div className="qp-form-row">
          <label className="qp-field-label qp-inline-label">
            Count
            <input
              type="number"
              min={1}
              max={15}
              className="qp-input qp-count-input"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            />
          </label>

          <button
            type="button"
            className="qp-btn qp-btn-primary"
            onClick={generate}
            disabled={loading || !topic.trim()}
          >
            {loading ? "Generating…" : "Generate questions"}
          </button>
        </div>

        {error && <div className="qp-error">{error}</div>}
      </div>

      {questions.length > 0 && (
        <div className="qp-results-head">
          <span>{questions.length} question{questions.length !== 1 ? "s" : ""}</span>
          {grounded !== null && (
            <span className={`qp-grounding-badge ${grounded ? "grounded" : "ungrounded"}`}>
              {grounded ? "✓ Grounded in a real source" : "General knowledge — verify independently"}
            </span>
          )}
        </div>
      )}

      <div className="qp-list">
        {questions.map((q) => (
          <QuestionCard key={q.id} question={q} />
        ))}
      </div>
    </div>
  );
}

// ---- Styles -------------------------------------------------------------
// Plain CSS scoped by the qp- prefix so this drops into any project
// regardless of whether you're using Tailwind elsewhere.

const QP_STYLES = `
.qp-panel { display: flex; flex-direction: column; gap: 16px; font-size: 14px; color: #1f2933; }
.qp-form { display: flex; flex-direction: column; gap: 6px; }
.qp-field-label { font-size: 12px; font-weight: 600; color: #52606d; margin-top: 6px; }
.qp-inline-label { display: flex; align-items: center; gap: 8px; margin-top: 0; }
.qp-input { border: 1px solid #d9dde3; border-radius: 8px; padding: 8px 10px; font-size: 14px; outline: none; }
.qp-input:focus { border-color: #7b8794; }
.qp-count-input { width: 60px; }
.qp-form-row { display: flex; align-items: center; justify-content: space-between; margin-top: 4px; gap: 10px; }
.qp-btn { border: 1px solid #d9dde3; background: #fff; border-radius: 8px; padding: 8px 14px; font-size: 13px; cursor: pointer; }
.qp-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.qp-btn-primary { background: #1f2933; color: #fff; border-color: #1f2933; }
.qp-btn-ghost { background: transparent; }
.qp-error { color: #b91c1c; font-size: 13px; margin-top: 4px; }

.qp-results-head { display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: #52606d; }
.qp-grounding-badge { font-size: 11px; padding: 3px 8px; border-radius: 999px; }
.qp-grounding-badge.grounded { background: #e3f9e5; color: #1b7a2c; }
.qp-grounding-badge.ungrounded { background: #f0f1f3; color: #616e7c; }

.qp-list { display: flex; flex-direction: column; gap: 12px; }
.qp-card { border: 1px solid #e4e7eb; border-radius: 10px; padding: 14px; background: #fff; }
.qp-card-head { display: flex; margin-bottom: 6px; }
.qp-badge { font-size: 11px; padding: 2px 8px; border-radius: 999px; background: #f0f1f3; color: #52606d; }
.qp-prompt { font-size: 14px; line-height: 1.5; margin: 4px 0 10px; }

.qp-options { display: flex; flex-direction: column; gap: 6px; margin-bottom: 8px; }
.qp-option { display: flex; align-items: center; gap: 8px; font-size: 13px; }

.qp-answer-area { margin-bottom: 10px; }
.qp-answer-toggle { display: flex; gap: 6px; margin-bottom: 8px; }
.qp-toggle-btn { padding: 6px 10px; font-size: 12px; }
.qp-toggle-btn.active { background: #1f2933; color: #fff; border-color: #1f2933; }
.qp-textarea { width: 100%; border: 1px solid #d9dde3; border-radius: 8px; padding: 8px 10px; font-size: 13px; resize: vertical; box-sizing: border-box; }

.qp-canvas-wrap { position: relative; }
.qp-canvas { width: 100%; height: 220px; border: 1px dashed #cbd2d9; border-radius: 8px; touch-action: none; background: #fafbfc; }
.qp-canvas-clear { position: absolute; top: 6px; right: 6px; padding: 4px 8px; font-size: 11px; }

.qp-reveal-toggle { border: none; background: none; color: #2563eb; font-size: 13px; cursor: pointer; padding: 0; }
.qp-reveal { margin-top: 10px; border-top: 1px dashed #e4e7eb; padding-top: 10px; display: flex; flex-direction: column; gap: 10px; }
.qp-reveal-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; color: #7b8794; margin-bottom: 3px; }
.qp-source { background: #f8f9fa; border-radius: 8px; padding: 8px 10px; }
.qp-source-title { font-weight: 600; font-size: 13px; }
.qp-source-meta { font-size: 12px; color: #616e7c; }
.qp-source-citation { font-size: 12px; color: #52606d; margin-top: 2px; }
.qp-source-link { font-size: 12px; color: #2563eb; text-decoration: none; }
.qp-correct-answer { font-size: 13px; background: #e3f9e5; color: #1b4d21; border-radius: 8px; padding: 8px 10px; }
.qp-steps { margin: 0; padding-left: 18px; font-size: 13px; display: flex; flex-direction: column; gap: 4px; }
.qp-alt-approaches { margin: 0; padding-left: 18px; font-size: 13px; display: flex; flex-direction: column; gap: 4px; }
`;