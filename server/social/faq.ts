import type { FAQEntry } from "../../drizzle/schema";

export type FaqMatch = { entry: FAQEntry; score: number };

export function normalizeText(value: string) {
  return value.toLocaleLowerCase().replace(/[\u064B-\u065F\u0670]/g, "").replace(/[^A-Za-z0-9\u0600-\u06FF\s+]/g, " ").replace(/\s+/g, " ").trim();
}

export function detectLanguageChoice(value: string): "en" | "ar" | null {
  const normalized = normalizeText(value);
  if (["1", "english", "en", "انجليزي", "الانجليزية", "الإنجليزية"].includes(normalized)) return "en";
  if (["2", "arabic", "ar", "عربي", "العربية"].includes(normalized)) return "ar";
  return null;
}

function keywords(entry: FAQEntry) {
  return [...(Array.isArray(entry.keywordsEn) ? entry.keywordsEn : []), ...(Array.isArray(entry.keywordsAr) ? entry.keywordsAr : []), ...(Array.isArray(entry.intentAliases) ? entry.intentAliases : [])].map(normalizeText);
}

const LATIN_ONLY = /^[a-z0-9+\s]+$/;

// Latin keywords must match whole words ("fee" must not fire inside "feedback").
// Arabic keywords keep substring matching because Arabic attaches prefixes
// (e.g. "بالرسوم" contains "الرسوم").
function containsKeyword(text: string, keyword: string) {
  if (LATIN_ONLY.test(keyword)) return ` ${text} `.includes(` ${keyword} `);
  return text.includes(keyword);
}

export function matchApprovedFaq(input: string, entries: FAQEntry[]): FaqMatch | null {
  const text = normalizeText(input);
  if (text.length < 2) return null;
  let best: FaqMatch | null = null;
  for (const entry of entries) {
    let score = [normalizeText(entry.questionEn), normalizeText(entry.questionAr)].includes(text) ? 12 : 0;
    for (const keyword of keywords(entry)) {
      if (keyword && keyword.length >= 2 && containsKeyword(text, keyword)) score += keyword.includes(" ") ? 5 : 3;
    }
    if (score > (best?.score ?? 0)) best = { entry, score };
  }
  return best && best.score >= 3 ? best : null;
}
