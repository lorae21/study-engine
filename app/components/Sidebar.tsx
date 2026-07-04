"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const WORKSPACE_ITEMS = [
  { icon: "?", label: "Ask & study", href: "/" },
  { icon: "#", label: "Flashcards", href: "/flashcards" },
  { icon: "!", label: "Questions", href: "/questions" },   // ← add this line
  { icon: "▷", label: "Presentation", href: "/presentation" },
  { icon: "@", label: "Teams", href: "/teams" },
  { icon: "◆", label: "Games", href: "/games" },
];

const ACCOUNT_ITEMS = [
  { icon: "○", label: "History", href: "/history" },
  { icon: "•", label: "Settings", href: "/settings" },
];

function NavItem({
  icon,
  label,
  href,
  active,
  collapsed,
}: {
  icon: string;
  label: string;
  href: string;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 11,
        justifyContent: collapsed ? "center" : "flex-start",
        padding: collapsed ? "9px 0" : "9px 10px",
        borderRadius: 6,
        fontSize: 13.5,
        color: active ? "var(--text)" : "var(--text-muted)",
        background: active ? "var(--bg-raised-2)" : "transparent",
      }}
    >
      <span style={{ width: 16, textAlign: "center", flexShrink: 0, fontSize: 13 }}>{icon}</span>
      {!collapsed && label}
    </Link>
  );
}

export default function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: collapsed ? 60 : 224,
        flexShrink: 0,
        background: "var(--bg)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        padding: "16px 0",
        transition: "width 0.15s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          padding: "0 14px 16px",
        }}
      >
        {!collapsed && (
          <div style={{ fontSize: 14.5, fontWeight: 600 }}>Study Engine</div>
        )}
        <button
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: "transparent",
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
          }}
        >
          ☰
        </button>
      </div>

      <div style={{ padding: "0 10px" }}>
        {WORKSPACE_ITEMS.map((item) => (
          <NavItem key={item.href} {...item} active={pathname === item.href} collapsed={collapsed} />
        ))}
      </div>

      <div style={{ height: 1, background: "var(--border)", margin: "12px 14px" }} />

      <div style={{ padding: "0 10px" }}>
        {ACCOUNT_ITEMS.map((item) => (
          <NavItem key={item.href} {...item} active={pathname === item.href} collapsed={collapsed} />
        ))}
      </div>

      <div style={{ marginTop: "auto", padding: "14px 14px 0" }}>
        {!collapsed && (
          <div style={{ fontSize: 11, color: "var(--text-faint)" }}>
            arXiv + Semantic Scholar live
          </div>
        )}
      </div>
    </aside>
  );
}
