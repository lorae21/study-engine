"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const WORKSPACE_ITEMS = [
  { num: 1, label: "Research & analysis", href: "/" },
  { num: 2, label: "Test & flashcards", href: "/flashcards" },
  { num: 3, label: "Presentation", href: "/presentation" },
  { num: 4, label: "Teams", href: "/teams" },
  { num: 5, label: "Games", href: "/games" },
];

const ACCOUNT_ITEMS = [
  { num: 6, label: "History", href: "/history" },
  { num: 7, label: "Settings & billing", href: "/settings" },
];

function NavItem({
  num,
  label,
  href,
  active,
}: {
  num: number;
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 11,
        padding: "9px 10px",
        borderRadius: 3,
        fontSize: 13.5,
        opacity: active ? 1 : 0.72,
        background: active ? "rgba(185,138,62,0.12)" : "transparent",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10.5,
          color: active ? "var(--gold)" : "var(--ash)",
          width: 20,
          height: 20,
          border: `1px solid ${active ? "var(--gold)" : "rgba(241,236,223,0.25)"}`,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {num}
      </span>
      {label}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: 232,
        flexShrink: 0,
        background: "var(--ink)",
        borderRight: "1px solid rgba(241,236,223,0.08)",
        display: "flex",
        flexDirection: "column",
        padding: "22px 0",
      }}
    >
      <div
        style={{
          padding: "0 20px 20px",
          borderBottom: "1px solid rgba(241,236,223,0.08)",
          marginBottom: 14,
        }}
      >
        <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600 }}>
          Study Engine
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10.5,
            color: "var(--ash)",
            letterSpacing: 1,
            textTransform: "uppercase",
            marginTop: 3,
          }}
        >
          Grounded research workspace
        </div>
      </div>

      <div style={{ padding: "0 12px" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            color: "var(--ash)",
            padding: "14px 10px 6px",
          }}
        >
          Workspace
        </div>
        {WORKSPACE_ITEMS.map((item) => (
          <NavItem key={item.href} {...item} active={pathname === item.href} />
        ))}
      </div>

      <div style={{ padding: "0 12px" }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            color: "var(--ash)",
            padding: "14px 10px 6px",
          }}
        >
          Account
        </div>
        {ACCOUNT_ITEMS.map((item) => (
          <NavItem key={item.href} {...item} active={pathname === item.href} />
        ))}
      </div>

      <div
        style={{
          marginTop: "auto",
          padding: "14px 20px 0",
          borderTop: "1px solid rgba(241,236,223,0.08)",
        }}
      >
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--ash)" }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--teal)",
              display: "inline-block",
              marginRight: 6,
            }}
          />
          arXiv + Semantic Scholar live
        </div>
      </div>
    </aside>
  );
}
