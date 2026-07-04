import { NextRequest, NextResponse } from "next/server";
import type { Paper } from "../../lib/types";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

function buildContext(papers: Paper[]): string {
  return papers
    .map((p) => `Source URL: ${p.url}\nTitle: ${p.title}\nAbstract: ${p.abstract}\n\n---\n`)
    .join("\n");
}

export async function POST(req: NextRequest) {
  const { query, papers } = (await req.json()) as { query: string; papers: Paper[] };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { answer: "No Gemini API key configured on the server (set GEMINI_API_KEY)." },
      { status: 500 }
    );
  }

  if (!papers || papers.length === 0) {
    return NextResponse.json({ answer: "No academic sources found to analyze." });
  }

  const context = buildContext(papers);
  const systemInstruction =
    "You are a strict, zero-hallucination academic assistant. Answer the query using ONLY the " +
    "provided context. Do not extrapolate. Include markdown source links matching the exact URLs " +
    "provided in the context.";

  const payload = {
    contents: [{ parts: [{ text: `Context:\n${context}\n\nQuery: ${query}` }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: { temperature: 0.0 },
  };

  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ answer: `Gemini error: ${errText}` }, { status: 502 });
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return NextResponse.json({ answer: text ?? "No response text returned." });
  } catch (err) {
    return NextResponse.json(
      { answer: `Connection to Gemini failed: ${String(err)}` },
      { status: 500 }
    );
  }
}
