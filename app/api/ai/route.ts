import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

// -------------------------------------------------------------------
// Server-side calls to Groq. The API key never reaches
// the browser because this file only runs on the server.
// -------------------------------------------------------------------

async function callGroq(prompt: string, asJson: boolean, personalKey?: string): Promise<string> {
  const apiKey = personalKey || process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing GROQ_API_KEY. Add it to your .env.local file (no quotes, no spaces) and restart the server, or add your own key in Settings."
    );
  }

  // Initialize the official Groq client wrapper
  const groq = new Groq({ apiKey });

  const response = await groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    // Using Groq's high-reasoning, cost-effective flagship academic model
    model: "llama-3.3-70b-versatile", 
    temperature: 0.3, // Keeps definitions and math strict and deterministic
    // If json is required, use Groq's native json object mode to prevent formatting bugs
    response_format: asJson ? { type: "json_object" } : undefined,
    max_completion_tokens: asJson ? 4096 : 2048,
  });

  const text = response.choices[0]?.message?.content;
  if (!text) throw new Error("Groq returned an empty response.");
  return text;
}

function safeParseJson(text: string): any {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Repairs LaTeX escape string serialization issues common in JSON generation blocks
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
        const raw = await callGroq(buildSolvePrompt(body), true, personalKey);
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
        const answer = await callGroq(buildExplainStepPrompt(body), false, personalKey);
        return NextResponse.json({ answer });
      }
      case "memory":
      case "flashcards": {
        const raw = await callGroq(buildFlashcardsPrompt(body), true, personalKey);
        const parsed = safeParseJson(raw);
        return NextResponse.json(parsed || { cards: [] });
      }
      case "test": {
        const raw = await callGroq(buildTestPrompt(body), true, personalKey);
        const parsed = safeParseJson(raw);
        return NextResponse.json(parsed || { questions: [] });
      }
      case "grade": {
        const raw = await callGroq(buildGradePrompt(body), true, personalKey);
        const parsed = safeParseJson(raw);
        return NextResponse.json(parsed || { items: [], overallTip: "Keep practicing!" });
      }
      default:
        return NextResponse.json({ error: "Invalid study tool mode selection" }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "An unexpected error occurred during execution." }, { status: 500 });
  }
}
