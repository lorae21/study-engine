import { NextRequest, NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";
import type { Paper } from "../../lib/types";

async function fetchArxiv(query: string, limit = 3): Promise<Paper[]> {
  const url = "https://export.arxiv.org/api/query";
  const params = new URLSearchParams({
    search_query: `all:${query}`,
    start: "0",
    max_results: String(limit),
  });

  try {
    const res = await fetch(`${url}?${params.toString()}`);
    if (!res.ok) return [];
    const xml = await res.text();
    const parser = new XMLParser({ ignoreAttributes: false });
    const parsed = parser.parse(xml);
    const entries = parsed?.feed?.entry;
    const list = Array.isArray(entries) ? entries : entries ? [entries] : [];

    return list.map((entry: any) => ({
      title: String(entry.title).replace(/\s+/g, " ").trim(),
      abstract: String(entry.summary).replace(/\s+/g, " ").trim(),
      url: typeof entry.id === "string" ? entry.id.trim() : "#",
      source: "arXiv",
    }));
  } catch {
    return [];
  }
}

async function fetchSemanticScholar(query: string, limit = 3): Promise<Paper[]> {
  const url = "https://api.semanticscholar.org/graph/v1/paper/search";
  const params = new URLSearchParams({
    query,
    limit: String(limit),
    fields: "title,abstract,url,year",
  });

  try {
    const res = await fetch(`${url}?${params.toString()}`);
    if (!res.ok) return [];
    const data = await res.json();
    const list = data?.data ?? [];

    return list.map((paper: any) => ({
      title: paper.title || "No title",
      abstract: paper.abstract || "No abstract available.",
      url: paper.url || "#",
      source: `Semantic Scholar (${paper.year ?? "N/A"})`,
    }));
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  const { query } = await req.json();

  if (!query || typeof query !== "string" || !query.trim()) {
    return NextResponse.json({ papers: [] }, { status: 400 });
  }

  const [arxivPapers, scholarPapers] = await Promise.all([
    fetchArxiv(query),
    fetchSemanticScholar(query),
  ]);

  return NextResponse.json({ papers: [...arxivPapers, ...scholarPapers] });
}
