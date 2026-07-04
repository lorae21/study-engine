"use client";

export default function Page() {
  return (
    <div style={{ padding: "60px 34px", maxWidth: 520 }}>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, color: "var(--teal)", marginBottom: 10 }}>
        03 — presentation
      </p>
      <h2 style={{ fontFamily: "var(--font-sans)", fontSize: 22, fontWeight: 600, margin: "0 0 10px" }}>
        Turn this research into something you can present
      </h2>
      <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--text-muted)", margin: "0 0 18px" }}>
        Generate a slideshow, a short video script, or a narrated audio brief from whatever you already gathered.
      </p>
      <button className="btn btn-primary" type="button">Generate from current research</button>
    </div>
  );
}
