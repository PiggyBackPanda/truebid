import { guides as allGuides } from "../../content/guides";

export type Guide = {
  slug: string;
  title: string;
  category: string;
  summary: string;
  readTime: string;
  content: string; // markdown
};

export const CATEGORIES: Record<string, string> = {
  "selling-without-an-agent": "Selling Without an Agent",
  "pricing-your-property": "Pricing Your Property",
  "open-offers-explained": "Understanding Live Offers",
  "buying-on-truebid": "Buying on TrueBid",
  "legal-and-costs": "Legal and Costs",
};

// Ordered list of category slugs for consistent display order
export const CATEGORY_ORDER = [
  "selling-without-an-agent",
  "pricing-your-property",
  "open-offers-explained",
  "buying-on-truebid",
  "legal-and-costs",
];

export function getAllGuides(): Guide[] {
  return allGuides;
}

export function getGuideBySlug(slug: string): Guide | undefined {
  return allGuides.find((g) => g.slug === slug);
}

export function getGuidesByCategory(category: string): Guide[] {
  return allGuides.filter((g) => g.category === category);
}

export function getGuidesGroupedByCategory(): Array<{
  category: string;
  label: string;
  guides: Guide[];
}> {
  const groups = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORIES[cat] ?? cat,
    guides: getGuidesByCategory(cat),
  })).filter((g) => g.guides.length > 0);

  // Any guides with an unrecognised category fall into a catch-all group
  const knownCategories = new Set(CATEGORY_ORDER);
  const ungrouped = allGuides.filter((g) => !knownCategories.has(g.category));
  if (ungrouped.length > 0) {
    groups.push({ category: "other", label: "Other", guides: ungrouped });
  }

  return groups;
}
