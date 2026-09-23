/**
 * Maps a GapLevel onto the localized label of the *active* dictionary.
 *
 * GAP_COPY in scoring.ts keeps English strings for the server-side analysis
 * shape; the UI renders labels through this indirection so the same analysis
 * object can be displayed in either language.
 */

import { useI18n } from "@/lib/i18n";

export function useGapLabels() {
  const { t } = useI18n();
  return {
    low: t.gapLow,
    medium: t.gapMedium,
    high: t.gapHigh,
  };
}

export function useGapHeadlines() {
  const { t } = useI18n();
  return {
    low: t.gapHeadlineLow,
    medium: t.gapHeadlineMedium,
    high: t.gapHeadlineHigh,
  };
}

export function useGapDetails() {
  const { t } = useI18n();
  return {
    low: t.gapDetailLow,
    medium: t.gapDetailMedium,
    high: t.gapDetailHigh,
  };
}
