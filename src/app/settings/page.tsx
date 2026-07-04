"use client";

export default function Page() {
  return (
    <div style={{ padding: "60px 34px", maxWidth: 520 }}>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--gold)", marginBottom: 10 }}>
        07 — settings & billing
      </p>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, margin: "0 0 10px" }}>
        Workspace controls
      </h2>
      <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--ash-dark)", margin: "0 0 18px" }}>
        Manage your Gemini API key, default source databases, and subscription tier here once billing is wired up.
      </p>
      <button className="btn btn-primary" type="button">Save settings</button>
    </div>
  );
}
