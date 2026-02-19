import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { PortfolioData, Intro, Slide } from "./types";

interface SeedRoleVersion {
  role_version: string;
  intro: Intro & { slide_id?: string; section?: string };
  slide_order: string[];
}

interface SeedData {
  slides: Slide[];
  roleVersions: SeedRoleVersion[];
}

export function loadPreviewData(roleVersion: string): PortfolioData | null {
  try {
    const seedPath = join(process.cwd(), "..", "scripts", "seed-data.json");
    const raw = readFileSync(seedPath, "utf-8");
    const seed: SeedData = JSON.parse(raw);

    const rv = seed.roleVersions.find((r) => r.role_version === roleVersion);
    if (!rv) {
      console.warn(
        `[preview] role_version "${roleVersion}" not found in seed data`
      );
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { slide_id, section, ...intro } = rv.intro;

    const slideMap = new Map(seed.slides.map((s) => [s.slide_id, s]));
    const slides: Slide[] = [];
    for (const id of rv.slide_order) {
      const slide = slideMap.get(id);
      if (slide) {
        slides.push(slide);
      } else {
        console.warn(
          `[preview] slide_id "${id}" in slide_order but not found in slides`
        );
      }
    }

    return {
      slug: "preview",
      visit_id: "preview-local",
      intro: intro as Intro,
      slides,
    };
  } catch (err) {
    console.error("[preview] Failed to load seed data:", err);
    return null;
  }
}
