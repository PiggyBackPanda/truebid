/**
 * Shared offer utilities — no server-side dependencies.
 * Safe to import in both Server Components and Client Components.
 */

export type PublicOffer = {
  id: string;
  publicAlias: string;
  amountCents: number;
  conditionType: string;
  conditionText: string | null;
  settlementDays: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Calculate an offer's "strength" score (0–60) for display purposes.
 * Purely informational — does NOT affect ranking.
 */
export function offerStrengthScore(offer: {
  conditionType: string;
  settlementDays: number;
}): number {
  let score = 0;

  switch (offer.conditionType) {
    case "UNCONDITIONAL":             score += 40; break;
    case "SUBJECT_TO_BUILDING_PEST":  score += 30; break;
    case "SUBJECT_TO_FINANCE":        score += 20; break;
    case "SUBJECT_TO_BOTH":           score += 10; break;
    case "SUBJECT_TO_SALE":           score += 5;  break;
    default:                          score += 0;
  }

  if (offer.settlementDays <= 30)      score += 20;
  else if (offer.settlementDays <= 45) score += 15;
  else if (offer.settlementDays <= 60) score += 10;
  else                                 score += 5;

  return score;
}

/**
 * Sort offers for the public board:
 *   ACTIVE   → by amountCents DESC, then createdAt ASC (first-in wins ties)
 *   WITHDRAWN → below active, by createdAt ASC
 *   All other statuses follow withdrawn
 */
export function rankOffers<T extends {
  amountCents: number;
  status: string;
  createdAt: string | Date;
}>(offers: T[]): T[] {
  const active = offers
    .filter((o) => o.status === "ACTIVE")
    .sort((a, b) => {
      if (b.amountCents !== a.amountCents) return b.amountCents - a.amountCents;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

  const withdrawn = offers
    .filter((o) => o.status === "WITHDRAWN")
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const rest = offers.filter(
    (o) => o.status !== "ACTIVE" && o.status !== "WITHDRAWN"
  );

  return [...active, ...withdrawn, ...rest];
}
