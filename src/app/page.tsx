"use client";

import { useState } from "react";
import QuestionBar from "./components/QuestionBar";
import EvidencePanel from "./components/EvidencePanel";
import RoughworkPad from "./components/RoughworkPad";
import type { Paper } from "./lib/types";

export default function ResearchPage() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSearch(query: string) {
    setLoading(true);
    setAnswer(null);
    try {
      const searchRes = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const { papers: found }: { papers: Paper[] } = await searchRes.json();
      setPapers(found);

      if (found.length > 0) {
        const synthRes = await fetch("/api/synthesize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, papers: found }),
        });
        const { answer: text }: { answer: string } = await synthRes.json();
        setAnswer(text);
      }
    } catch (err) {
      setAnswer("Something went wrong reaching the search or AI service. Check the server logs.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <QuestionBar onSearch={handleSearch} loading={loading} />
      <div style={{ display: "flex", alignItems: "stretch" }}>
        <EvidencePanel answer={answer} papers={papers} />
        <RoughworkPad />
      </div>
    </>
  );
}
