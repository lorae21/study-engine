"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkBreaks from "remark-breaks";
import rehypeKatex from "rehype-katex";
import type { Paper } from "../lib/types";

interface WikiImage {
  title: string;
  url: string;
  thumbUrl: string;
  descriptionUrl: string; // Commons file page — required attribution link
  license: string;
  author: string;
  width: number;
  height: number;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  papers?: Paper[];
  groundingSource?: "wikipedia" | "research" | "none";
  images?: WikiImage[];
  imagesChecked?: boolean; // true once we've actually attempted the lookup
  isError?: boolean;
}

// Research-flavored queries ("latest developments in X", "recent papers on Y")
// benefit from arXiv/Semantic Scholar abstracts. Everything else — the vast
// majority of student study questions — is better grounded against a stable,
// well-established reference like Wikipedia, where research abstracts written
// for specialists tend to confuse rather than clarify fundamentals.
function classifyQuery(query: string): "foundational" | "research" {
  const researchSignals = [
    "latest",
    "recent",
    "state of the art",
    "state-of-the-art",
    "research",
    "paper",
    "papers",
    "study shows",
    "survey",
    "review of",
    "advances in",
    "current developments",
    "cutting edge",
  ];
  const lower = query.toLowerCase();
  return researchSignals.some((signal) => lower.includes(signal)) ? "research" : "foundational";
}

export default function ChatThread() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [styleMode, setStyleMode] = useState<"academic" | "eli5">("academic");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend(query: string) {
    if (!query.trim() || loading) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: query };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    let foundResources: Paper[] = [];
    let foundImages: WikiImage[] = [];
    let imagesChecked = false;
    const queryType = classifyQuery(query);
    const groundingSource: "wikipedia" | "research" = queryType === "research" ? "research" : "wikipedia";
    const groundingEndpoint = groundingSource === "research" ? "/api/search" : "/api/wiki";

    try {
      const [searchRes, imagesRes] = await Promise.allSettled([
        fetch(groundingEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        }),
        fetch("/api/images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        }),
      ]);

      if (searchRes.status === "fulfilled" && searchRes.value.ok) {
        const searchData = await searchRes.value.json();
        if (searchData.papers && searchData.papers.length > 0) {
          foundResources = searchData.papers;
        }
      } else {
        console.error("Search request failed");
      }

      if (imagesRes.status === "fulfilled" && imagesRes.value.ok) {
        imagesChecked = true;
        const imagesData = await imagesRes.value.json();
        if (imagesData.images && imagesData.images.length > 0) {
          foundImages = imagesData.images;
        }
      } else {
        console.error("Image search failed");
      }

      const stylingDirectives =
        styleMode === "eli5"
          ? "TONE: You are an incredibly engaging, warm, clear tutor explaining to an interested 5-year old. Use clear physical analogies, a highly conversational layout, and simplified math explanations but stay academically educational.\n"
          : "TONE: You are an elite university professor speaking to a senior researcher. Use authoritative, highly precise, rigorous language.\n";

      const formattingRule =
        `${stylingDirectives}` +
        "CRITICAL MATH FORMATTING RULE: EVERY equation, no matter how short, MUST be written ONLY ONCE using display math syntax: a blank line, then $$equation$$, then a blank line. NEVER write an equation inline in the middle of a sentence using single dollar signs. NEVER state a variable or equation in plain text and then immediately repeat it in math notation right after — pick ONE representation per equation. Reference variables in prose as plain text (e.g. 'the mass m and spring constant k'), and reserve $$...$$ blocks exclusively for full standalone equations.\n" +
        "CRITICAL CITATION RULE: Do NOT include links or paper citations inside your paragraph text. Instead, place a short, specific citation — book title, author, edition if known, and chapter — under a single dedicated '## Sources' header at the very end of your response. Be as specific as possible about chapter/section so a reader could find the exact material.";

      const synthRes = await fetch("/api/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          papers: foundResources,
          customInstructions: formattingRule,
        }),
      });

      if (!synthRes.ok) {
        const errBody = await synthRes.text().catch(() => "");
        throw new Error(`Synthesis engine returned status ${synthRes.status}${errBody ? ` — ${errBody}` : ""}`);
      }

      const synthData = await synthRes.json();

      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: synthData.answer || "No response text returned.",
          papers: foundResources.length > 0 ? foundResources : undefined,
          groundingSource: foundResources.length > 0 ? groundingSource : "none",
          images: foundImages.length > 0 ? foundImages : undefined,
          imagesChecked,
          isError: false,
        },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `System Error: Unable to complete request. ${String(err)}. Please check your backend terminal server logs.`,
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div
        style={{
          padding: "12px 20px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          gap: "10px",
          alignItems: "center",
          justifyContent: "flex-end",
        }}
      >
        <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>
          Learning Style:
        </span>
        <button
          onClick={() => setStyleMode("academic")}
          style={{
            fontSize: "12px",
            padding: "4px 12px",
            borderRadius: "6px",
            border: "1px solid var(--border-strong)",
            background: styleMode === "academic" ? "var(--text)" : "transparent",
            color: styleMode === "academic" ? "var(--bg)" : "var(--text-muted)",
            fontWeight: 500,
            transition: "all 0.2s",
            cursor: "pointer",
          }}
        >
          🎓 Academic Professor
        </button>
        <button
          onClick={() => setStyleMode("eli5")}
          style={{
            fontSize: "12px",
            padding: "4px 12px",
            borderRadius: "6px",
            border: "1px solid var(--border-strong)",
            background: styleMode === "eli5" ? "var(--text)" : "transparent",
            color: styleMode === "eli5" ? "var(--bg)" : "var(--text-muted)",
            fontWeight: 500,
            transition: "all 0.2s",
            cursor: "pointer",
          }}
        >
          🧸 Explain Like I'm 5
        </button>
      </div>

      {isEmpty ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 20px",
          }}
        >
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: "0 0 8px" }}>
            What are you studying today?
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "var(--text-muted)",
              margin: "0 0 28px",
              textAlign: "center",
            }}
          >
            Type any academic query to generate structured textbook notes in your chosen
            learning style.
          </p>
          <Composer input={input} setInput={setInput} onSend={handleSend} loading={loading} centered />
        </div>
      ) : (
        <>
          <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px 8px" }}>
            <div style={{ maxWidth: 720, margin: "0 auto" }}>
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
              {loading && (
                <div style={{ color: "var(--text-muted)", fontSize: 13.5, padding: "8px 0 24px" }}>
                  Analyzing open resource databases and structuring layout equations…
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>
          <div style={{ padding: "0 20px 20px" }}>
            <div style={{ maxWidth: 720, margin: "0 auto" }}>
              <Composer input={input} setInput={setInput} onSend={handleSend} loading={loading} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  // Split off a trailing "## Sources" section so it can be styled
  // separately from the main synthesis body.
  const sourcesSplit = message.content.split(/\n##\s*Sources\s*\n/i);
  const mainContent = sourcesSplit[0];
  const sourcesText = sourcesSplit.length > 1 ? sourcesSplit[1].trim() : null;

  // Turn bracketed citation markers like [1], [2] into markdown links the
  // custom `a` renderer below can turn into clickable source pills.
  const citablePapers = message.papers || [];
  const contentWithCiteLinks =
    citablePapers.length > 0
      ? mainContent.replace(/\[(\d+)\]/g, (match, num) => {
          const idx = parseInt(num, 10) - 1;
          return idx >= 0 && idx < citablePapers.length ? `[${num}](cite:${num})` : match;
        })
      : mainContent;
  const hasImages = !!message.images && message.images.length > 0;
  const showNoImageFallback = !isUser && message.imagesChecked && !hasImages;

  return (
    <div style={{ marginBottom: 22 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: "var(--text-faint)",
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {isUser ? "You" : "Study Engine Master Synthesis"}
        </span>
        {!isUser && message.groundingSource === "wikipedia" && (
          <span className="grounding-badge grounding-badge--grounded">✓ Grounded · Wikipedia</span>
        )}
        {!isUser && message.groundingSource === "research" && (
          <span className="grounding-badge grounding-badge--grounded">✓ Grounded · Research papers</span>
        )}
        {!isUser && message.groundingSource === "none" && (
          <span className="grounding-badge grounding-badge--general">General knowledge — verify independently</span>
        )}
      </div>

      <div
        className="message-markdown"
        style={{
          background: isUser ? "var(--bg-raised)" : "transparent",
          border: isUser ? "1px solid var(--border)" : "none",
          borderRadius: 10,
          padding: isUser ? "12px 16px" : "0",
          fontSize: 14.5,
          lineHeight: 1.75,
          color: message.isError ? "#E28C7C" : "var(--text)",
        }}
      >
        {isUser ? (
          <span style={{ whiteSpace: "pre-wrap" }}>{message.content}</span>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkMath, remarkBreaks]}
            rehypePlugins={[rehypeKatex]}
            components={{
              a: ({ href, children, ...props }) => {
                if (href?.startsWith("cite:")) {
                  const idx = parseInt(href.replace("cite:", ""), 10) - 1;
                  const paper = citablePapers[idx];
                  if (paper) {
                    return (
                      <a
                        href={paper.url}
                        target="_blank"
                        rel="noreferrer"
                        title={paper.title}
                        className="citation-pill"
                      >
                        {paper.source || `Source ${idx + 1}`}
                      </a>
                    );
                  }
                }
                return (
                  <a href={href} target="_blank" rel="noreferrer" {...props}>
                    {children}
                  </a>
                );
              },
            }}
          >
            {contentWithCiteLinks}
          </ReactMarkdown>
        )}
      </div>

      {/* Visual references — only ever legally-licensed Wikimedia Commons images, always credited */}
      {hasImages && (
        <div style={{ marginTop: 20 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-faint)",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: 0.3,
            }}
          >
            Visual References
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: 12,
            }}
          >
            {message.images!.map((img, i) => (
              <a
                key={img.url + i}
                href={img.descriptionUrl}
                target="_blank"
                rel="noreferrer"
                style={{ display: "block", textDecoration: "none" }}
              >
                <img
                  src={img.thumbUrl}
                  alt={img.title}
                  style={{
                    width: "100%",
                    height: 120,
                    objectFit: "contain",
                    background: "var(--bg-raised)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    display: "block",
                  }}
                />
                <div style={{ fontSize: 10.5, color: "var(--text-faint)", marginTop: 4, lineHeight: 1.4 }}>
                  {img.author} · {img.license} · Wikimedia Commons
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* No legally-usable image was found — point the user straight at the book instead of guessing */}
      {showNoImageFallback && sourcesText && (
        <div
          style={{
            marginTop: 16,
            padding: "10px 12px",
            border: "1px dashed var(--border)",
            borderRadius: 8,
            fontSize: 12.5,
            color: "var(--text-muted)",
            lineHeight: 1.6,
          }}
        >
          No freely-licensed diagram was found for this topic. For a visual reference, consult
          the source material directly: {sourcesText}
        </div>
      )}

      {sourcesText && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 10,
            borderTop: "1px dashed var(--border)",
            fontSize: 12,
            color: "var(--text-faint)",
            lineHeight: 1.6,
          }}
        >
          <span style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3, marginRight: 6 }}>
            Sources
          </span>
          {sourcesText}
        </div>
      )}

      {message.papers && message.papers.length > 0 && (
        <div style={{ marginTop: 24, paddingTop: 12, borderTop: "1px dashed var(--border)" }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-faint)",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: 0.3,
            }}
          >
            📚 Grounded Dataset Attachments:
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {message.papers.map((p, i) => (
              <a
                key={p.url + i}
                href={p.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: "var(--bg-raised)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "10px 12px",
                  display: "block",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--teal)" }}>{p.title}</div>
                <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>{p.source}</div>
              </a>
            ))}
          </div>
        </div>
      )}

      <style jsx global>{`
        .message-markdown p {
          margin: 0 0 14px;
        }
        .message-markdown p:last-child {
          margin-bottom: 0;
        }
        .message-markdown h1,
        .message-markdown h2,
        .message-markdown h3 {
          margin: 20px 0 10px;
          font-weight: 600;
          color: var(--text);
        }
        .message-markdown ul,
        .message-markdown ol {
          margin: 0 0 14px;
          padding-left: 22px;
        }
        .message-markdown li {
          margin-bottom: 4px;
        }
        .message-markdown code {
          background: var(--bg-raised);
          padding: 1px 5px;
          border-radius: 4px;
          font-size: 13px;
        }
        .message-markdown .katex-display {
          margin: 16px 0;
          overflow-x: auto;
          overflow-y: hidden;
        }
        .message-markdown .katex {
          font-size: 1.05em;
        }
        .citation-pill {
          display: inline-block;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.3px;
          text-transform: uppercase;
          text-decoration: none;
          color: var(--text-muted);
          background: var(--bg-raised);
          border: 1px solid var(--border-strong);
          border-radius: 5px;
          padding: 1px 6px;
          margin: 0 2px;
          white-space: nowrap;
          vertical-align: 1px;
        }
        .citation-pill:hover {
          color: var(--text);
          border-color: var(--text-faint);
        }
        .grounding-badge {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.2px;
          padding: 2px 8px;
          border-radius: 10px;
          white-space: nowrap;
        }
        .grounding-badge--grounded {
          color: #7FBF8F;
          background: rgba(127, 191, 143, 0.12);
          border: 1px solid rgba(127, 191, 143, 0.35);
        }
        .grounding-badge--general {
          color: var(--text-faint);
          background: var(--bg-raised);
          border: 1px solid var(--border);
        }
      `}</style>
    </div>
  );
}

function Composer({
  input,
  setInput,
  onSend,
  loading,
  centered,
}: {
  input: string;
  setInput: (v: string) => void;
  onSend: (q: string) => void;
  loading: boolean;
  centered?: boolean;
}) {
  return (
    <div
      style={{
        width: centered ? 560 : "100%",
        maxWidth: "100%",
        background: "var(--bg-raised)",
        border: "1px solid var(--border-strong)",
        borderRadius: 14,
        padding: "10px 10px 10px 16px",
        display: "flex",
        alignItems: "flex-end",
        gap: 8,
      }}
    >
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend(input);
          }
        }}
        placeholder="Ask a study question…"
        rows={1}
        style={{
          flex: 1,
          background: "transparent",
          border: "none",
          outline: "none",
          resize: "none",
          color: "var(--text)",
          fontSize: 14.5,
          lineHeight: 1.5,
          padding: "6px 0",
          maxHeight: 160,
        }}
      />
      <button
        type="button"
        disabled={loading || !input.trim()}
        onClick={() => onSend(input)}
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: loading || !input.trim() ? "var(--bg-raised-2)" : "var(--text)",
          color: loading || !input.trim() ? "var(--text-faint)" : "var(--bg)",
          border: "none",
          flexShrink: 0,
          fontSize: 14,
          cursor: loading || !input.trim() ? "default" : "pointer",
        }}
      >
        ↑
      </button>
    </div>
  );
}