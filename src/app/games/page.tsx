"use client";

export default function Page() {
  return (
    <div style={{ padding: "60px 34px", maxWidth: 520 }}>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--gold)", marginBottom: 10 }}>
        05 — games
      </p>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, margin: "0 0 10px" }}>
        Your notes, reshaped into a memory match
      </h2>
      <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--ash-dark)", margin: "0 0 18px" }}>
        Pull terms straight from a source or your roughwork pad and turn them into a matching game for quick recall practice.
      </p>
      <button className="btn btn-primary" type="button">Build a game from a source</button>
    </div>
  );
}
