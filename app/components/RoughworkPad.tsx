"use client";

import { useState } from "react";

export default function RoughworkPad() {
  const [notes, setNotes] = useState("");

  return (
    <div style={{ flex: 1, padding: "22px 34px 40px 20px", borderLeft: "1px solid rgba(18,24,28,0.1)", minWidth: 0 }}>
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: 1,
          textTransform: "uppercase",
          color: "var(--ash-dark)",
          margin: "0 0 12px",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ width: 7, height: 7, background: "var(--rule-blue-soft)", borderRadius: "50%" }} />
        Roughwork studio
      </p>

      <div
        style={{
          background: "#fff",
          border: "1px solid rgba(18,24,28,0.12)",
          borderRadius: 5,
          backgroundImage:
            "repeating-linear-gradient(#fff 0 27px, var(--rule-blue-soft) 27px 28px)",
          backgroundPosition: "0 8px",
          position: "relative",
          padding: "8px 16px 8px 34px",
          minHeight: 420,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 24,
            top: 0,
            bottom: 0,
            width: 1,
            background: "var(--margin-red)",
            opacity: 0.55,
          }}
        />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Mind-dump what you remember, then check it against the evidence on the left."
          style={{
            width: "100%",
            height: 404,
            border: "none",
            background: "transparent",
            resize: "none",
            outline: "none",
            fontFamily: "var(--font-sans)",
            fontSize: 13.5,
            lineHeight: "28px",
            color: "var(--ink)",
          }}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
        <button className="btn btn-ghost" type="button" onClick={() => localStorage.setItem("roughwork", notes)}>
          Save to session
        </button>
      </div>
    </div>
  );
}
