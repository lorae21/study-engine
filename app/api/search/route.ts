import { NextRequest, NextResponse } from "next/server";

// Standard TypeScript definitions to keep your layout strictly safe
interface ConsolidatedResource {
  title: string;
  source: string;
  url: string;
  abstract: string;
}

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  const encodedQuery = encodeURIComponent(query);
  
  // Create an array to safely accumulate data from all working open libraries
  let globalResources: ConsolidatedResource[] = [];

  // Fire all network requests concurrently using Promise.allSettled to prevent single-source timeouts
  const fetchPromises = [
    // 🏛️ Source 1: Open Library (Textbook Database)
    fetch(`https://openlibrary.org{encodedQuery}&limit=3`)
      .then(r => r.json())
      .then(data => {
        data.docs?.forEach((doc: any) => {
          globalResources.push({
            title: doc.title,
            source: "Open Library (Textbook Catalog)",
            url: `https://openlibrary.org${doc.key}`,
            abstract: `Author: ${doc.author_name?.join(", ") || "Unknown"}. Published: ${doc.first_publish_year || "N/A"}. Subject tags: ${doc.subject?.slice(0, 5).join(", ") || "General Academic"}`
          });
        });
      }).catch(() => null), // Silently catch errors so one failure doesn't crash the whole app

    // 🔬 Source 2: OpenAlex (Massive Global Scientific Graph)
    fetch(`https://openalex.org{encodedQuery}&per_page=3`)
      .then(r => r.json())
      .then(data => {
        data.results?.forEach((work: any) => {
          globalResources.push({
            title: work.title,
            source: "OpenAlex Open Science Grid",
            url: work.doi || work.id,
            abstract: work.abstract_inverted_index ? "Abstract indexed and compiled." : "Open educational reference work."
          });
        });
      }).catch(() => null),

    // 📖 Source 3: DOAJ (Directory of Open Access Journals)
    fetch(`https://doaj.org{encodedQuery}?pageSize=3`)
      .then(r => r.json())
      .then(data => {
        data.results?.forEach((item: any) => {
          const bib = item.bibjson;
          globalResources.push({
            title: bib.title,
            source: "DOAJ Peer-Reviewed Index",
            url: bib.link?.[0]?.url || "https://doaj.org",
            abstract: bib.abstract || "Full text open access educational asset."
          });
        });
      }).catch(() => null)
  ];

  // Wait for all active endpoints to complete their task
  await Promise.allSettled(fetchPromises);

  // Fallback check: If all internet sources went down, return a clean empty array 
  // so Groq smoothly takes over using its core academic text data models.
  return NextResponse.json({ papers: globalResources });
}
