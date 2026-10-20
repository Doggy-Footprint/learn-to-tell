import { cmp, dayNumber } from "./common.mjs";

export const FRESH_DAYS = 14;
export const FADING_DAYS = 60;

export function freshness(history, today) {
  const quizzed = (history ?? [])
    .map((h, i) => ({ h, i }))
    .filter(({ h }) => h.quiz === "pass" || h.quiz === "fail")
    .sort((a, b) => cmp(a.h.date, b.h.date) || cmp(a.h.lesson ?? "", b.h.lesson ?? "") || a.i - b.i);
  if (quizzed.length === 0) return "unquizzed";
  const latest = quizzed[quizzed.length - 1].h;
  if (latest.quiz === "fail") return "weak";
  const days = dayNumber(today) - dayNumber(latest.date);
  if (days <= FRESH_DAYS) return "fresh";
  return days <= FADING_DAYS ? "fading" : "stale";
}
