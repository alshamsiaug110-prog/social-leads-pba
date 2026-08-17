import AdmZip from "adm-zip";

type FacebookMessage = { sender_name?: string; timestamp_ms?: number; content?: string };
type FacebookThread = { title?: string; thread_path?: string; messages?: FacebookMessage[] };
export type ImportedCandidate = { question: string; answer: string | null; language: "en" | "ar"; frequency: number; sampleThreadRef: string | null };
export type InboxImportAnalysis = { fileCount: number; totalCustomerMessages: number; uniqueQuestionCount: number; repeatedQuestionMessages: number; repeatedQuestionRate: number; candidates: ImportedCandidate[] };
const MAX_ZIP_BYTES = 25 * 1024 * 1024;
const MAX_JSON_FILES = 2500;

function cleanText(value: string) {
  return value.replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[email removed]").replace(/(?:\+?20)?\s?0?1[0-9\s-]{8,}/g, "[phone removed]").replace(/\s+/g, " ").trim().slice(0, 700);
}
function normalizedKey(value: string) { return cleanText(value).toLocaleLowerCase().replace(/[^A-Za-z0-9\u0600-\u06FF\s]/g, " ").replace(/\s+/g, " ").trim(); }
function isAcademySender(sender: string | undefined) { return (sender ?? "").toLocaleLowerCase().includes("premier ballet academy"); }
function looksLikeQuestion(value: string) { return value.includes("?") || /^(how|what|when|where|can|do|is|are|could|would|fees|price|schedule|class|age|hello|hi|details|عايزة|عايز|ممكن|ما|متى|فين|كم|هل|مرحبا)/.test(value.toLocaleLowerCase()); }
function languageFor(value: string): "en" | "ar" { return /[\u0600-\u06FF]/.test(value) ? "ar" : "en"; }
function isReviewableQuestion(value: string) {
  const normalized = value.toLocaleLowerCase();
  if (value.includes("[phone removed]") || value.includes("[email removed]") || value.length > 280) return false;
  if (/^facebook created this chat|^@meta ai|^hi, congrats on setting up business ai/.test(normalized)) return false;
  return !["hi", "hello", "hello my dear", "details", "details please", "details plz"].includes(normalized);
}
function usableHistoricalAnswer(value: string | null) {
  if (!value) return null;
  const normalized = value.toLocaleLowerCase();
  if (normalized.includes("your ai agent will respond") || normalized.includes("this chat was assigned") || normalized.includes("lead stage set")) return null;
  return value;
}

export function parseFacebookInboxZip(zipBuffer: Buffer): InboxImportAnalysis {
  if (zipBuffer.length > MAX_ZIP_BYTES) throw new Error("The ZIP file exceeds the 25 MB safety limit.");
  const entries = new AdmZip(zipBuffer).getEntries().filter(entry => /(^|\/)message_\d+\.json$/.test(entry.entryName)).slice(0, MAX_JSON_FILES);
  const aggregate = new Map<string, { question: string; answer: string | null; language: "en" | "ar"; frequency: number; thread: string | null }>();
  let totalCustomerMessages = 0;
  for (const entry of entries) {
    let thread: FacebookThread;
    try { thread = JSON.parse(entry.getData().toString("utf8")) as FacebookThread; } catch { continue; }
    const messages = [...(thread.messages ?? [])].filter(message => typeof message.content === "string" && message.content.trim().length > 0).sort((a, b) => (a.timestamp_ms ?? 0) - (b.timestamp_ms ?? 0));
    for (let index = 0; index < messages.length; index += 1) {
      const message = messages[index];
      if (isAcademySender(message.sender_name) || !message.content) continue;
      const question = cleanText(message.content);
      if (!looksLikeQuestion(question) || !isReviewableQuestion(question)) continue;
      totalCustomerMessages += 1;
      const nextReply = messages.slice(index + 1, index + 7).find(next => isAcademySender(next.sender_name) && next.content);
      const answer = usableHistoricalAnswer(nextReply?.content ? cleanText(nextReply.content) : null);
      const key = normalizedKey(question);
      if (!key) continue;
      const existing = aggregate.get(key);
      if (existing) { existing.frequency += 1; if (!existing.answer && answer) existing.answer = answer; }
      else aggregate.set(key, { question, answer, language: languageFor(question), frequency: 1, thread: null });
    }
  }
  const candidates = Array.from(aggregate.values()).filter(candidate => candidate.frequency >= 2).sort((a, b) => b.frequency - a.frequency || a.question.localeCompare(b.question)).slice(0, 500).map(candidate => ({ question: candidate.question, answer: candidate.answer, language: candidate.language, frequency: candidate.frequency, sampleThreadRef: candidate.thread }));
  const repeatedQuestionMessages = candidates.filter(candidate => candidate.frequency > 1).reduce((sum, candidate) => sum + candidate.frequency, 0);
  return { fileCount: entries.length, totalCustomerMessages, uniqueQuestionCount: aggregate.size, repeatedQuestionMessages, repeatedQuestionRate: totalCustomerMessages === 0 ? 0 : Math.round((repeatedQuestionMessages / totalCustomerMessages) * 10000) / 100, candidates };
}
