"use client";

import { useState } from "react";

export default function LandingHero({
  onSearch,
}: {
  onSearch: (query: string) => void;
}) {
  const [query, setQuery] = useState("");

  return (
    <div
      style={{
        minHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 20px 20px",
        textAlign: "center",
        background: "#0D1013",
        color: "#F1ECDF",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            background: "#3E8577",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: 15,
            color: "#0d1013",
          }}
        >
          S
        </div>
        <div style={{ fontSize: 17, fontWeight: 500 }}>Study Engine</div>
      </div>

      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 600, margin: "14px 0 30px" }}>
        Research starts here
      </h1>

      <div
        style={{
          width: "100%",
          maxWidth: 680,
          background: "#171B20",
          border: "1px solid rgba(241,236,223,0.1)",
          borderRadius: 16,
          padding: "16px 18px 12px",
        }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && query.trim() && onSearch(query)}
          placeholder="Ask a question, or paste a topic to study..."
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#F1ECDF",
            fontSize: 15,
            padding: "6px 4px 14px",
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              style={{
                background: "#20252B",
                border: "1px dashed rgba(241,236,223,0.1)",
                borderRadius: 20,
                padding: "7px 12px",
                fontSize: 13,
                color: "#F1ECDF",
              }}
            >
              +
            </button>
            <button
              type="button"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "#20252B",
                border: "1px solid rgba(241,236,223,0.1)",
                borderRadius: 20,
                padding: "7px 12px",
                fontSize: 13,
                color: "#F1ECDF",
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#3E8577" }} />
              Deep +
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: "#7D8087" }}>▤</span>
            <button
              type="button"
              onClick={() => query.trim() && onSearch(query)}
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "#B98A3E",
                border: "none",
                color: "#241804",
                fontSize: 16,
              }}
            >
              →
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 22, flexWrap: "wrap", justifyContent: "center" }}>
        {["Quick summary", "Run a deep review", "Search with filters"].map((label) => (
          <button
            key={label}
            type="button"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              background: "#171B20",
              border: "1px solid rgba(241,236,223,0.1)",
              borderRadius: 20,
              padding: "9px 16px",
              fontSize: 13.5,
              color: "#F1ECDF",
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
