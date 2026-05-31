import type { IdentityStatus } from '../models/celebrityProfile';
import { getConfig } from '../config';

const DEFAULT_THRESHOLD = 0.72;

export function getReviewThreshold(): number {
  const raw = getConfig().CELEB_CONFIDENCE_REVIEW_THRESHOLD ?? DEFAULT_THRESHOLD;
  if (Number.isNaN(raw) || raw < 0 || raw > 1) {
    return DEFAULT_THRESHOLD;
  }

  return raw;
}

export function scoreIdentityConfidence(
  canonicalHint: string | undefined,
  candidateCount: number,
  topNameMatch: boolean
): number {
  const hintBoost = canonicalHint ? 0.15 : 0;
  const densityPenalty = candidateCount > 3 ? 0.2 : candidateCount > 1 ? 0.1 : 0;
  const nameBoost = topNameMatch ? 0.2 : 0;
  const base = 0.65 + hintBoost + nameBoost - densityPenalty;

  return Math.max(0, Math.min(1, Number(base.toFixed(2))));
}

export function resolveIdentityStatus(confidenceScore: number): IdentityStatus {
  const threshold = getReviewThreshold();

  if (confidenceScore >= threshold + 0.15) {
    return 'resolved';
  }

  if (confidenceScore >= threshold) {
    return 'ambiguous';
  }

  return 'manual_review_required';
}
