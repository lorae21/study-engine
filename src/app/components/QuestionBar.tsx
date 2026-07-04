"use client";

import { useState } from "react";

export default function QuestionBar({
  onSearch,
  loading,
}: {
  onSearch: (query: string) => void;
  loading: boolean;
}) {
  const [query, setQuery] = useState("");

  return (
    <div
      style={{
        padding: "26px 34px 18px",
        borderBottom: "1px solid rgba(18,24,28,0.1)",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          color: "var(--ash-dark)",
          margin: "0 0 6px",
        }}
      >
        Research & analysis
      </p>
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 26,
          fontWeight: 600,
          margin: "0 0 18px",
        }}
      >
        Ask a question, get it answered from real papers
      </h1>

      <div style={{ display: "flex", gap: 10 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && query.trim() && onSearch(query)}
          placeholder="e.g. How does CRISPR-Cas9 correct genetic mutations?"
          style={{
            flex: 1,
            background: "#fff",
            border: "1px solid rgba(18,24,28,0.15)",
            borderRadius: 4,
            padding: "12px 16px",
            fontSize: 14.5,
            color: "var(--ink)",
          }}
        />
        <button className="btn btn-ghost" type="button">
          + Add resources
        </button>
      </div>

      <button
        className="btn btn-search"
        type="button"
        disabled={loading || !query.trim()}
        onClick={() => onSearch(query)}
        style={{ opacity: loading || !query.trim() ? 0.6 : 1 }}
      >
        {loading ? "Searching…" : "Search & analyze sources"}
      </button>
    </div>
  );
}
