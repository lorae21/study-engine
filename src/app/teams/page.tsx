"use client";

export default function Page() {
  return (
    <div style={{ padding: "60px 34px", maxWidth: 520 }}>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--gold)", marginBottom: 10 }}>
        04 — teams
      </p>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, margin: "0 0 10px" }}>
        Study rooms for working through sources together
      </h2>
      <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--ash-dark)", margin: "0 0 18px" }}>
        Open a shared workspace where your group can search, annotate, and mind-dump against the same source stream in real time.
      </p>
      <button className="btn btn-primary" type="button">Create a study room</button>
    </div>
  );
}
