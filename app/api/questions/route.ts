// app/api/questions/route.ts
//
// Generates a set of sourced practice questions for a topic.
// Reuses the same "ground first, then synthesize" pattern as /api/synthesize
// and /api/wiki: we fetch real source material first, then ask the model to
// write questions that are traceable back to that material, returned as
// strict JSON (no prose, no markdown fences).

import { NextRequest, NextResponse } from "next/server";

// ---- Types -----------------------------------------------------------

export interface QuestionSource {
  title: string;
  author?: string;
  citation: string; // e.g. "Ogata, Modern Control Engineering, 5th ed., Ch. 3, p. 112"
  url?: string;
}

export interface GeneratedQuestion {
  id: string;
  prompt: string;
  type: "multiple_choice" | "short_answer" | "problem";
  options?: string[]; // only for multiple_choice
  correctAnswer: string;
  hasWorkedSolution: boolean;
  solutionSteps: string[]; // empty array if hasWorkedSolution is false
  alternativeApproaches: string[]; // other valid ways to solve/answer
  source: QuestionSource;
}

interface RequestBody {
  topic: string;
  constraints?: string; // free-text: "5 questions, mix of MC and problems, undergrad level"
  count?: number;
}

// ---- Source gathering --------------------------------------------------
// Lightweight reuse of the same idea as your /api/wiki route: pull a
// grounding extract so the model isn't inventing citations from nothing.

async function fetchWikipediaExtract(topic: string) {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&format=json&origin=*&titles=${encodeURIComponent(
        topic
      )}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data?.query?.pages;
    if (!pages) return null;
    const page = Object.values(pages)[0] as any;
    if (!page || page.missing || !page.extract) return null;
    return {
      title: page.title as string,
      extract: page.extract as string,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(
        page.title.replace(/ /g, "_")
      )}`,
    };
  } catch {
    return null;
  }
}

// ---- Model call ---------------------------------------------------------

const SYSTEM_INSTRUCTION = `You are a practice-question generator for a study app.

You will be given a topic, optional constraints, and (when available) a grounding
extract pulled from a real source. Your job is to output ONLY a JSON array of
question objects — no prose before or after, no markdown code fences.

Each object must match this shape exactly:
{
  "prompt": string,                 // the question itself
  "type": "multiple_choice" | "short_answer" | "problem",
  "options": string[] | null,       // 3-5 options, ONLY if type is multiple_choice, else null
  "correctAnswer": string,          // the final correct answer, stated plainly
  "hasWorkedSolution": boolean,     // true if a step-by-step derivation is meaningful
  "solutionSteps": string[],        // ordered steps, [] if hasWorkedSolution is false
  "alternativeApproaches": string[],// other valid methods/framings, [] if none exist
  "sourceTitle": string,            // the book/article/reference this question draws on
  "sourceAuthor": string | null,
  "sourceCitation": string,         // as specific as possible: edition, chapter, page if known
  "sourceUrl": string | null
}

Rules:
1. If a grounding extract was provided, base the questions on it and cite it as the source
   (use its title and URL). If no grounding extract was provided, you may draw on a
   well-known standard reference for the topic (e.g. a widely used textbook), but you must
   be honest in sourceCitation — if you cannot name a specific edition/chapter/page confidently,
   say so plainly (e.g. "Standard treatment in most introductory textbooks on this topic;
   no specific edition verified") rather than inventing a page number.
2. Never fabricate a precise page number, chapter number, or ISBN you are not confident in.
   A vaguer but honest citation is always better than a fabricated precise one.
3. Vary question type unless constraints say otherwise.
4. Respect any constraints given (count, difficulty, question type mix, subtopic focus).
5. Output valid JSON only. No commentary, no markdown fences.`;

async function generateQuestions(
  topic: string,
  constraints: string,
  count: number,
  grounding: { title: string; extract: string; url: string } | null
): Promise<Omit<GeneratedQuestion, "id">[]> {
  const userContent = [
    `Topic: ${topic}`,
    constraints ? `Constraints: ${constraints}` : `Constraints: none given, use your judgment`,
    `Number of questions: ${count}`,
    grounding
      ? `Grounding extract (source: "${grounding.title}", ${grounding.url}):\n${grounding.extract}`
      : `No grounding extract was found for this topic. Use a standard reference and cite honestly per rule 2.`,
  ].join("\n\n");

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY is not set. Add it to .env.local and restart the dev server."
    );
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      // Match whatever model your /api/synthesize route uses for consistency.
      // llama-3.3-70b-versatile is a solid current default on Groq if you're unsure.
      model: "llama-3.3-70b-versatile",
      max_tokens: 4000,
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        { role: "user", content: userContent },
      ],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    // Surface the real reason (bad key, rate limit, bad model name, etc.)
    // instead of masking it as a JSON-parsing failure.
    throw new Error(
      `Groq API error (${response.status}): ${data?.error?.message ?? JSON.stringify(data)}`
    );
  }

  const text = data?.choices?.[0]?.message?.content ?? "";

  const cleaned = text.replace(/```json|```/g, "").trim();

  let parsed: any[];
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      `Model did not return valid JSON. Raw response was: ${text.slice(0, 500)}`
    );
  }

  return parsed.map((q) => ({
    prompt: q.prompt,
    type: q.type,
    options: q.options ?? undefined,
    correctAnswer: q.correctAnswer,
    hasWorkedSolution: !!q.hasWorkedSolution,
    solutionSteps: Array.isArray(q.solutionSteps) ? q.solutionSteps : [],
    alternativeApproaches: Array.isArray(q.alternativeApproaches)
      ? q.alternativeApproaches
      : [],
    source: {
      title: q.sourceTitle ?? "Unknown source",
      author: q.sourceAuthor ?? undefined,
      citation: q.sourceCitation ?? "No specific citation available.",
      url: q.sourceUrl ?? undefined,
    },
  }));
}

// ---- Route handler --------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    const topic = (body.topic ?? "").trim();
    const constraints = (body.constraints ?? "").trim();
    const count = Math.min(Math.max(body.count ?? 5, 1), 15);

    if (!topic) {
      return NextResponse.json({ error: "Topic is required." }, { status: 400 });
    }

    const grounding = await fetchWikipediaExtract(topic);
    const rawQuestions = await generateQuestions(topic, constraints, count, grounding);

    const questions: GeneratedQuestion[] = rawQuestions.map((q, i) => ({
      id: `${Date.now()}-${i}`,
      ...q,
    }));

    return NextResponse.json({ questions, grounded: !!grounding });
  } catch (err) {
    console.error("Question generation error:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate questions." },
      { status: 500 }
    );
  }
}