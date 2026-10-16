export const ID_RE = /^[a-z0-9][a-z0-9-]*$/;
export const DOMAIN_RE = /^[a-z0-9-]+$/;
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const QUIZ_VALUES = ["pass", "fail", "skipped", "none"];

export const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

export function uniqSorted(list) {
  return [...new Set(list)].sort(cmp);
}

export function toDay(value) {
  if (value instanceof Date) {
    const p = (n) => String(n).padStart(2, "0");
    return `${value.getFullYear()}-${p(value.getMonth() + 1)}-${p(value.getDate())}`;
  }
  return String(value);
}

export function dayNumber(day) {
  const [y, m, d] = toDay(day).split("-").map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

export function normalize(text) {
  return String(text ?? "").normalize("NFKC").toLowerCase().replace(/[\s_-]+/g, "");
}

export function conceptList(concepts) {
  if (Array.isArray(concepts)) return concepts;
  return concepts && typeof concepts === "object" ? Object.values(concepts) : [];
}
