import { NextRequest, NextResponse } from "next/server";

const WIKI_API = "https://en.wikipedia.org/w/api.php";

interface WikiPaper {
  title: string;
  url: string;
  abstract: string;
  source: string;
}

export async function POST(req: NextRequest) {
  try {
    const { query } = (await req.json()) as { query: string };

    if (!query || !query.trim()) {
      return NextResponse.json({ papers: [] });
    }

    // 1. Find the best-matching page title
    const searchParams = new URLSearchParams({
      action: "query",
      format: "json",
      list: "search",
      srsearch: query,
      srlimit: "3",
      origin: "*",
    });

    const searchRes = await fetch(`${WIKI_API}?${searchParams.toString()}`);
    if (!searchRes.ok) {
      return NextResponse.json({ papers: [] });
    }

    const searchData = await searchRes.json();
    const results = searchData?.query?.search;

    if (!results || results.length === 0) {
      return NextResponse.json({ papers: [] });
    }

    // 2. Pull a clean plain-text extract for the top match(es)
    const titles = results.slice(0, 2).map((r: any) => r.title);

    const extractParams = new URLSearchParams({
      action: "query",
      format: "json",
      prop: "extracts",
      exintro: "true",
      explaintext: "true",
      redirects: "1",
      titles: titles.join("|"),
      origin: "*",
    });

    const extractRes = await fetch(`${WIKI_API}?${extractParams.toString()}`);
    if (!extractRes.ok) {
      return NextResponse.json({ papers: [] });
    }

    const extractData = await extractRes.json();
    const pages = extractData?.query?.pages;

    if (!pages) {
      return NextResponse.json({ papers: [] });
    }

    const papers: WikiPaper[] = Object.values(pages)
      .map((page: any) => {
        if (!page.extract || page.extract.trim().length < 40) return null;
        return {
          title: page.title,
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, "_"))}`,
          abstract: page.extract.slice(0, 1500),
          source: "Wikipedia",
        };
      })
      .filter((p): p is WikiPaper => p !== null);

    return NextResponse.json({ papers });
  } catch (err) {
    return NextResponse.json({ papers: [], error: String(err) }, { status: 500 });
  }
}