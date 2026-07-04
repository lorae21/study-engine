"use client";

export default function Page() {
  return (
    <div style={{ padding: "60px 34px", maxWidth: 520 }}>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--gold)", marginBottom: 10 }}>
        02 — test & flashcards
      </p>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, margin: "0 0 10px" }}>
        A deck built straight from your sources
      </h2>
      <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--ash-dark)", margin: "0 0 18px" }}>
        Generate flashcard-style question and answer sets from whatever you searched in Research, ready to flip through or turn into a mind map.
      </p>
      <button className="btn btn-primary" type="button">Generate from current research</button>
    </div>
  );
}
