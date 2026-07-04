import type { Paper } from "../lib/types";

export default function EvidencePanel({
  answer,
  papers,
}: {
  answer: string | null;
  papers: Paper[];
}) {
  return (
    <div style={{ flex: 2, padding: "22px 20px 40px 34px", minWidth: 0 }}>
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
        <span
          style={{ width: 7, height: 7, background: "var(--teal)", borderRadius: "50%" }}
        />
        Evidence summary
      </p>

      {answer ? (
        <div
          style={{
            background: "#fff",
            border: "1px solid rgba(18,24,28,0.12)",
            borderRadius: 5,
            padding: "16px 18px",
            marginBottom: 14,
            fontSize: 13.5,
            lineHeight: 1.65,
            color: "var(--ash-dark)",
            whiteSpace: "pre-wrap",
          }}
        >
          {answer}
        </div>
      ) : (
        <div
          style={{
            background: "var(--paper-2)",
            border: "1px dashed rgba(18,24,28,0.2)",
            borderRadius: 5,
            padding: "16px 18px",
            marginBottom: 14,
            fontSize: 13.5,
            color: "var(--ash-dark)",
          }}
        >
          Ask a question above to generate a grounded summary from the sources found below.
        </div>
      )}

      {papers.length > 0 && (
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
          <span style={{ width: 7, height: 7, background: "var(--gold)", borderRadius: "50%" }} />
          Verified source stream
        </p>
      )}

      {papers.map((paper, i) => (
        <div
          key={paper.url + i}
          style={{
            background: "var(--paper-2)",
            border: "1px solid rgba(18,24,28,0.1)",
            borderRadius: 5,
            padding: "14px 16px",
            marginBottom: 10,
            display: "flex",
            gap: 12,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--gold)",
              flexShrink: 0,
              paddingTop: 2,
            }}
          >
            {String(i + 1).padStart(2, "0")}
          </div>
          <div>
            <a href={paper.url} target="_blank" rel="noreferrer">
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 14.5,
                  fontWeight: 600,
                  margin: "0 0 3px",
                  color: "var(--ink)",
                }}
              >
                {paper.title}
              </p>
            </a>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                color: "var(--ash)",
                textTransform: "uppercase",
                letterSpacing: 0.4,
                margin: 0,
              }}
            >
              {paper.source}
            </p>
            <p style={{ fontSize: 12.5, color: "var(--ash-dark)", marginTop: 6, lineHeight: 1.55 }}>
              {paper.abstract}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
