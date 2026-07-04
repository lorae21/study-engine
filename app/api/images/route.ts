import { NextRequest, NextResponse } from "next/server";

const COMMONS_API = "https://commons.wikimedia.org/w/api.php";

export interface WikiImage {
  title: string;
  url: string; // full-resolution original
  thumbUrl: string; // smaller preview for the UI
  descriptionUrl: string; // Commons file page — REQUIRED attribution link
  license: string;
  author: string;
  width: number;
  height: number;
}

// Only licenses that are safe to reuse with attribution.
// Anything not matching one of these (e.g. "All rights reserved", "Fair use") is skipped entirely.
const ALLOWED_LICENSE_SUBSTRINGS = [
  "public domain",
  "pd",
  "cc0",
  "cc-by",
  "cc by",
];

function isLicenseAllowed(licenseShortName?: string): boolean {
  if (!licenseShortName) return false;
  const normalized = licenseShortName.toLowerCase();
  // Explicitly exclude non-commercial / no-derivatives variants —
  // those still restrict reuse in ways that make them unsafe to auto-embed.
  if (normalized.includes("nc") || normalized.includes("nd")) return false;
  return ALLOWED_LICENSE_SUBSTRINGS.some((allowed) => normalized.includes(allowed));
}

function stripHtml(html?: string): string {
  if (!html) return "Unknown author";
  const text = html.replace(/<[^>]*>/g, "").trim();
  return text || "Unknown author";
}

export async function POST(req: NextRequest) {
  try {
    const { query } = (await req.json()) as { query: string };

    if (!query || !query.trim()) {
      return NextResponse.json({ images: [] });
    }

    const params = new URLSearchParams({
      action: "query",
      format: "json",
      generator: "search",
      gsrnamespace: "6", // File: namespace only
      gsrsearch: `${query} diagram`,
      gsrlimit: "15",
      prop: "imageinfo",
      iiprop: "url|extmetadata|size",
      iiurlwidth: "500",
      origin: "*",
    });

    const res = await fetch(`${COMMONS_API}?${params.toString()}`);

    if (!res.ok) {
      return NextResponse.json(
        { images: [], error: `Commons lookup failed with status ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const pages = data?.query?.pages;

    if (!pages) {
      return NextResponse.json({ images: [] });
    }

    const images: WikiImage[] = Object.values(pages)
      .map((page: any) => {
        const info = page?.imageinfo?.[0];
        if (!info) return null;

        const meta = info.extmetadata || {};
        const licenseShortName: string | undefined = meta.LicenseShortName?.value;

        if (!isLicenseAllowed(licenseShortName)) return null;

        // Filter out tiny icons/logos that aren't real diagrams
        if ((info.width ?? 0) < 200 || (info.height ?? 0) < 200) return null;

        return {
          title: String(page.title).replace(/^File:/, ""),
          url: info.url,
          thumbUrl: info.thumburl || info.url,
          descriptionUrl: info.descriptionurl,
          license: licenseShortName as string,
          author: stripHtml(meta.Artist?.value),
          width: info.width,
          height: info.height,
        };
      })
      .filter((img): img is WikiImage => img !== null)
      .slice(0, 4);

    return NextResponse.json({ images });
  } catch (err) {
    return NextResponse.json({ images: [], error: String(err) }, { status: 500 });
  }
}