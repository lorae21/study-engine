import { NextRequest, NextResponse } from "next/server";
import type { Paper } from "../../lib/types";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

function buildContext(papers: Paper[]): string {
  if (!papers || papers.length === 0) {
    return "No physical paper abstracts fetched. Rely entirely on authoritative engineering and mathematical textbook knowledge to synthesize the topic.";
  }

  return papers
    .map((p, i) => `[${i + 1}] Source URL: ${p.url}\nTitle: ${p.title}\nAbstract: ${p.abstract}\n\n---\n`)
    .join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const { query, papers, customInstructions } = (await req.json()) as {
      query: string;
      papers: Paper[];
      customInstructions?: string;
    };

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { answer: "No Groq API key configured on the server (set GROQ_API_KEY)." },
        { status: 500 }
      );
    }

    const context = buildContext(papers);

    const baseInstruction =
      "You are an elite, hyper-accurate academic synthesis engine. Your goal is to completely outperform standard conversational models like ChatGPT by delivering precise, deeply rigorous, textbook-grade breakdowns that are also easy to scan and study from.\n\n" +
      "CRITICAL DIRECTIVES FOR ACCURACY AND TONE:\n" +
      "1. NO CONVERSATIONAL FLUFF: Do not use meta-commentary, greetings, or generic transitional text (e.g., 'Sure, here is what you need', 'Based on the papers provided...'). Start directly with the core scientific layout.\n" +
      "2. SYNTHESIZE KEY PRINCIPLES: When paper extracts are present, do not just summarize or list document titles. Extract and explain the ACTUAL governing physical principles, dynamics, and mathematical implications.\n" +
      "3. HYBRID KNOWLEDGE FALLBACK: If paper extracts are empty or limited, seamlessly draw directly from deep, authoritative engineering physics principles to provide a complete, robust overview of the query.\n" +
      "4. LATEX FORMATTING: NEVER use inline single-dollar math ($...$). ALWAYS write every equation, however short, as a standalone display block using double dollar signs with a blank line before and after ($$...$$). Never state an equation in plain words and then repeat it in math notation immediately after — pick one form per equation.\n" +
      "5. STRUCTURE LIKE A STUDY GUIDE, NOT A WALL OF TEXT: Break the answer into clearly numbered sections using markdown headers (## 1. Section Title, ## 2. Next Section, etc.). Each section should cover one coherent idea (definition, governing equation, key terms, worked example, practical implications). Aim for 3-6 sections depending on the topic's depth.\n" +
      "6. BOLD KEY TERMS: The first time a technical term is introduced or defined (e.g. **natural frequency**, **damping ratio**), bold it. Do not bold entire sentences — only the term itself.\n" +
      "7. USE BULLET LISTS FOR EXAMPLES OR ENUMERATIONS: Whenever you give real-world examples, a list of related concepts, or step-by-step reasoning, use a markdown bullet or numbered list instead of folding them into a paragraph.\n" +
      "8. SHORT PARAGRAPHS: Keep paragraphs to 2-4 sentences. If a paragraph is doing more than one job (defining a term AND deriving an equation AND giving an example), split it into separate sections or list items.\n" +
      "9. INLINE CITATIONS: If numbered sources like [1], [2] appear in the Context Paper Abstracts below, cite them inline immediately after the specific claim they support, using that exact bracketed number (e.g., 'the natural frequency depends on stiffness and mass [2]'). Only cite a number if you are actually drawing from that specific source's abstract. If the context says no paper abstracts were fetched, do NOT invent bracketed citation numbers anywhere in your answer — rely on plain textbook explanation instead.";

    const finalSystemPrompt = `${baseInstruction}\n\n${customInstructions || ""}`;

    const payload = {
      model: GROQ_MODEL,
      temperature: 0.5,
      messages: [
        { role: "system", content: finalSystemPrompt },
        { role: "user", content: `Context Paper Abstracts:\n${context}\n\nUser Query Topic: ${query}` },
      ],
    };

    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Groq API error:", errText);
      return NextResponse.json({ answer: `Groq error: ${errText}` }, { status: 502 });
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;

    return NextResponse.json({ answer: text ?? "No response text returned." });
  } catch (err) {
    return NextResponse.json(
      { answer: `Connection to Groq failed: ${String(err)}` },
      { status: 500 }
    );
  }
}