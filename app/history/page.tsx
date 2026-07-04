"use client";

export default function Page() {
  return (
    <div style={{ padding: "60px 34px", maxWidth: 520 }}>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--teal)", marginBottom: 10 }}>
        06 — history
      </p>
      <h2 style={{ fontFamily: "var(--font-sans)", fontSize: 22, fontWeight: 600, margin: "0 0 10px" }}>
        Nothing searched yet this session
      </h2>
      <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--text-muted)", margin: "0 0 18px" }}>
        Past questions, the sources they surfaced, and any decks or games you built from them will collect here.
      </p>
      <button className="btn btn-primary" type="button">Back to research</button>
    </div>
  );
}
