// app/questions/page.tsx
//
// Mirrors however your app/flashcards/page.tsx is structured — this just
// renders the panel inside your existing page shell/layout. If your
// flashcards page wraps its content in a specific container (e.g. a
// max-width div, a page header), copy that same wrapper here so the two
// pages feel consistent.

import QuestionsPanel from "../components/QuestionsPanel";

export default function QuestionsPage() {
  return (
    <div style={{ padding: "24px", maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
        Questions
      </h1>
      <QuestionsPanel />
    </div>
  );
}