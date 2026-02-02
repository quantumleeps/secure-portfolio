import { notFound } from "next/navigation";
import type { PortfolioData } from "@/lib/types";
import { PortfolioViewer } from "@/components/portfolio-viewer";

interface PageProps {
  searchParams: Promise<{ r?: string }>;
}

async function fetchPortfolio(slug: string): Promise<PortfolioData | null> {
  const endpoint = process.env.NEXT_PUBLIC_API_ENDPOINT;
  if (!endpoint) {
    console.error("NEXT_PUBLIC_API_ENDPOINT is not configured");
    return null;
  }

  try {
    const res = await fetch(`${endpoint}/api/portfolio?r=${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });

    if (!res.ok) return null;
    return res.json();
  } catch (err) {
    console.error("Failed to fetch portfolio:", err);
    return null;
  }
}

export default async function PortfolioPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const slug = params.r;

  if (!slug) notFound();

  const data = await fetchPortfolio(slug);
  if (!data) notFound();

  return <PortfolioViewer data={data} />;
}
