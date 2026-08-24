import type { Priority, ScoreBreakdown } from "./types";

export interface ScoreInput {
  peopleAffected: number;
  quantityRequired: number;
  quantityFulfilled?: number;
  durationDays: number;
  urgency: number;
}

export interface ScoreResult {
  score: number;
  priority: Priority;
  breakdown: ScoreBreakdown;
}

/**
 * Rule-based "AI Priority Score" for the prototype.
 * Weighted signals: people at risk, unfilled resource gap, time pressure, stated urgency.
 */
export function computePriorityScore(input: ScoreInput): ScoreResult {
  const fulfilled = input.quantityFulfilled ?? 0;
  const remainRatio =
    input.quantityRequired <= 0
      ? 0
      : Math.max(0, Math.min(1, 1 - fulfilled / input.quantityRequired));

  const people = Math.round(Math.min(30, input.peopleAffected / 80));
  const gap = Math.round(remainRatio * 20);
  const time = Math.round(Math.max(0, 15 - input.durationDays));
  const urgency = Math.round(Math.max(1, Math.min(5, input.urgency)) * 7);

  const raw = people + gap + time + urgency;
  const score = Math.max(1, Math.min(100, raw));

  let priority: Priority;
  if (score >= 78) priority = "critical";
  else if (score >= 58) priority = "high";
  else if (score >= 40) priority = "moderate";
  else priority = "low";

  return { score, priority, breakdown: { people, gap, time, urgency } };
}

export function mockVerifyAmount(
  entered: number,
  expected: number,
): "pending_review" | "verified" | "mismatch_flagged" {
  if (!entered || entered <= 0) return "pending_review";
  const delta = Math.abs(entered - expected) / Math.max(expected, 1);
  if (delta > 0.08) return "mismatch_flagged";
  return "verified";
}
