import { NextRequest, NextResponse } from "next/server";

// -------------------------------------------------------------------
// Server-side calls to Gemini's free tier. The API key never reaches
// the browser because this file only runs on the server.
//
// Key fix vs the old version: we ask Gemini to return structured
// JSON (steps, a plain-language takeaway, quiz items with correct
// answers) instead of one long blob of prose. That's what lets the
// UI render readable step cards instead of a wall of text.
// -------------------------------------------------------------------

const MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

async function callGemini(prompt: string, asJson: boolean, personalKey?: string): Promise<string> {
  const apiKey = personalKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing GEMINI_API_KEY. Add it to your .env.local file (no quotes, no spaces) and restart the server, or add your own key in Settings."
    );
  }

  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: asJson
        ? { responseMimeType: "application/json", maxOutputTokens: 4096 }
        : { maxOutputTokens: 2048 },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini request failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("\n");
  if (!text) throw new Error("Gemini returned an empty response.");
  return text;
}

function safeParseJson(text: string): any {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Common failure mode: the model writes LaTeX like \ddot{x} or \sum
    // inside a JSON string. A single backslash there is invalid JSON
    // (only \", \\, \/, \b, \f, \n, \r, \t, \uXXXX are legal escapes),
    // so JSON.parse throws. Repair by doubling any backslash that isn't
    // already part of a valid escape sequence, then retry.
    const repaired = cleaned.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
    try {
      return JSON.parse(repaired);
    } catch {
      return null;
    }
  }
}

const MATH_RULE = `Formatting rule for any mathematical notation: write it as LaTeX. Wrap inline math in single dollar signs, like $m\\ddot{x} + kx = 0$, and wrap standalone/display equations in double dollar signs on their own, like $$m\\ddot{x} + kx = 0$$. Never use backticks, code blocks, or plain-text approximations (like x^2 or sqrt(x)) for math — always real LaTeX inside $ or $$ delimiters. IMPORTANT: because your response is embedded inside a JSON string, every backslash in your LaTeX must be written DOUBLED — write \\\\ddot, \\\\sum, \\\\frac, \\\\sqrt, \\\\omega etc. (two backslashes), not a single backslash, or the JSON will be invalid. Keep the whole response concise enough to finish completely — do not run out of room mid-answer.`;

// ---------- Prompt builders ----------

function buildSolvePrompt(body: any): string {
  const { field, subject, subtopic, style, notes, sources, history, question } = body;

  const historyText = (history || [])
    .map((turn: any) => `${turn.role === "user" ? "Student" : "Tutor"}: ${turn.content}`)
    .join("\n");

  return `You are a warm, encouraging tutor helping a student in ${field} → ${subject} → ${subtopic}.
Explanation style requested: ${style}

${notes ? `The student's class notes for context:\n${notes}\n` : ""}
${sources ? `Sources retrieved for grounding (reference them naturally where relevant):\n${sources}\n` : ""}
${historyText ? `Prior conversation:\n${historyText}\n` : ""}
Student's question or problem:
${question}

${MATH_RULE}

Respond with ONLY valid JSON matching this exact shape, no markdown fences, no extra text:
{
  "takeaway": "one warm, plain-language sentence (max ~18 words) capturing the single most important thing to remember — written like a sticky note from a tutor, encouraging tone",
  "summary": "1-2 sentence plain-language overview of the approach, no jargon",
  "steps": [
    { "title": "short step title (3-6 words)", "content": "the full explanation for this step, clear and concrete" }
  ]
}
Use 2-6 steps depending on complexity. Keep each step content focused and readable, not a wall of text.`;
}

function buildExplainStepPrompt(body: any): string {
  const { style, lastSolution, question } = body;
  return `You previously gave this step-by-step solution (as JSON): ${lastSolution}

The student wants a deeper explanation of this specific part: "${question}"
Explanation style requested: ${style}

Explain just that part in more depth, warmly and clearly, in 2-4 short paragraphs of plain text. Do not repeat the entire original solution. Return plain text only, no JSON.

${MATH_RULE}`;
}

function buildFlashcardsPrompt(body: any): string {
  const { field, subject, subtopic, notes } = body;
  return `Create 6 flashcards for a student studying ${field} → ${subject}, focused on "${subtopic}".
${notes ? `Base them on these class notes where possible:\n${notes}\n` : ""}
${MATH_RULE}

Respond with ONLY valid JSON matching this exact shape, no markdown fences, no extra text:
{
  "cards": [
    { "front": "short term, question, or prompt", "back": "clear, concise answer or explanation (1-3 sentences)" }
  ]
}
Mix definitions, quick concept checks, and one or two "why does this matter" cards. Keep each side short enough to read at a glance.`;
}

function buildTestPrompt(body: any): string {
  const { field, subject, subtopic, notes } = body;
  return `Write 3 test questions for a student studying ${field} → ${subject}, focused specifically on "${subtopic}".
${notes ? `Base them on these class notes where possible:\n${notes}\n` : ""}
${MATH_RULE}

Respond with ONLY valid JSON matching this exact shape, no markdown fences, no extra text:
{
  "questions": ["question 1 text", "question 2 text", "question 3 text"]
}
Vary difficulty from easier to harder. No answers included.`;
}

function buildGradePrompt(body: any): string {
  const { style, questions, answer } = body;
  return `Here are test questions given to a student (JSON): ${questions}
Here is the student's combined answer/explanation:
${answer}

Explanation style requested: ${style}

${MATH_RULE}

Grade fairly and kindly. Respond with ONLY valid JSON matching this exact shape, no markdown fences, no extra text:
{
  "items": [
    { "verdict": "correct" | "partial" | "incorrect", "explanation": "why, and the correct approach if needed, 1-3 sentences" }
  ],
  "overallTip": "one warm, encouraging sentence with a concrete tip for improvement — written like a sticky note from a tutor"
}
Include one item per question, in order.`;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { mode, apiKey: personalKey } = body;

  try {
    switch (mode) {
      case "solve": {
        const raw = await callGemini(buildSolvePrompt(body), true, personalKey);
        const parsed = safeParseJson(raw);
        if (!parsed) {
          return NextResponse.json({
            takeaway: "Here's what I found — formatting hiccup, but the content's below.",
            summary: "",
            steps: [{ title: "Answer", content: raw }],
          });
        }
        return NextResponse.json(parsed);
      }
      case "explain_step": {
        const answer = await callGemini(buildExplainStepPrompt(body), false, personalKey);
        return NextResponse.json({ answer });
      }
      case "memory": {
        const raw = await callGemini(buildFlashcardsPrompt(body), true, personalKey);
        const parsed = safeParseJson(raw);
        return NextResponse.json(parsed || { cards: [] });
      }
      case "flashcards": {
        const raw = await callGemini(buildFlashcardsPrompt(body), true, personalKey);
        const parsed = safeParseJson(raw);
        return NextResponse.json(parsed || { cards: [] });
      }
      case "test": {
        const raw = await callGemini(buildTestPrompt(body), true, personalKey);
        const parsed = safeParseJson(raw);
        return NextResponse.json(parsed || { questions: [raw] });
      }
      case "grade": {
        const raw = await callGemini(buildGradePrompt(body), true, personalKey);
        const parsed = safeParseJson(raw);
        return NextResponse.json(
          parsed || { items: [{ verdict: "partial", explanation: raw }], overallTip: "" }
        );
      }
      default:
        return NextResponse.json({ error: `Unknown mode: ${mode}` }, { status: 400 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
  }
}