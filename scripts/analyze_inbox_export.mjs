import { execFileSync, spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const [zipPath, outputPath] = process.argv.slice(2);
if (!zipPath || !outputPath) {
  throw new Error("Usage: node analyze_inbox_export.mjs <inbox.zip> <output.json>");
}

function cleanText(value) {
  return String(value)
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[email removed]")
    .replace(/(?:\+?20)?\s?0?1[0-9\s-]{8,}/g, "[phone removed]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 700);
}

function normalizedKey(value) {
  return cleanText(value)
    .toLocaleLowerCase()
    .replace(/[^A-Za-z0-9\u0600-\u06FF\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isAcademySender(sender) {
  return String(sender ?? "").toLocaleLowerCase().includes("premier ballet academy");
}

function looksLikeQuestion(value) {
  return value.includes("?") || /^(how|what|when|where|can|do|is|are|could|would|fees|price|schedule|class|age|hello|hi|details|عايزة|عايز|ممكن|ما|متى|فين|كم|هل|مرحبا)/.test(value.toLocaleLowerCase());
}

function languageFor(value) {
  return /[\u0600-\u06FF]/.test(value) ? "ar" : "en";
}

function isReviewableQuestion(value) {
  const normalized = value.toLocaleLowerCase();
  if (value.includes("[phone removed]") || value.includes("[email removed]") || value.length > 280) return false;
  if (/^facebook created this chat|^@meta ai|^hi, congrats on setting up business ai/.test(normalized)) return false;
  return !["hi", "hello", "hello my dear", "details", "details please", "details plz"].includes(normalized);
}

function usableHistoricalAnswer(value) {
  if (!value) return null;
  const normalized = value.toLocaleLowerCase();
  if (normalized.includes("your ai agent will respond") || normalized.includes("this chat was assigned") || normalized.includes("lead stage set")) return null;
  return value;
}

const entryNames = execFileSync("unzip", ["-Z1", zipPath], { encoding: "utf8" })
  .split("\n")
  .filter(name => /(^|\/)message_\d+\.json$/.test(name));
const aggregate = new Map();
let totalCustomerMessages = 0;
let processedFiles = 0;

for (const entryName of entryNames) {
  const result = spawnSync("unzip", ["-p", zipPath, entryName], { encoding: "utf8", maxBuffer: 12 * 1024 * 1024 });
  if (result.status !== 0 || !result.stdout) continue;
  let thread;
  try { thread = JSON.parse(result.stdout); } catch { continue; }
  processedFiles += 1;
  const messages = (thread.messages ?? [])
    .filter(message => typeof message.content === "string" && message.content.trim().length > 0)
    .sort((a, b) => Number(a.timestamp_ms ?? 0) - Number(b.timestamp_ms ?? 0));
  for (let index = 0; index < messages.length; index += 1) {
    const message = messages[index];
    if (isAcademySender(message.sender_name) || !message.content) continue;
    const question = cleanText(message.content);
    if (!looksLikeQuestion(question) || !isReviewableQuestion(question)) continue;
    totalCustomerMessages += 1;
    const reply = messages.slice(index + 1, index + 7).find(next => isAcademySender(next.sender_name) && next.content);
    const answer = usableHistoricalAnswer(reply?.content ? cleanText(reply.content) : null);
    const key = normalizedKey(question);
    if (!key) continue;
    const existing = aggregate.get(key);
    if (existing) {
      existing.frequency += 1;
      if (!existing.answer && answer) existing.answer = answer;
    } else {
      aggregate.set(key, { question, answer, language: languageFor(question), frequency: 1, sampleThreadRef: null });
    }
  }
}

const candidates = [...aggregate.values()]
  .filter(candidate => candidate.frequency >= 2)
  .sort((a, b) => b.frequency - a.frequency || a.question.localeCompare(b.question))
  .slice(0, 500);
const repeatedQuestionMessages = candidates.filter(candidate => candidate.frequency > 1).reduce((sum, candidate) => sum + candidate.frequency, 0);
const output = {
  source: "Facebook Inbox export — analysed locally and not retained",
  processedFiles,
  totalCustomerMessages,
  uniqueQuestionCount: aggregate.size,
  repeatedQuestionMessages,
  repeatedQuestionRate: totalCustomerMessages === 0 ? 0 : Math.round((repeatedQuestionMessages / totalCustomerMessages) * 10000) / 100,
  candidates,
};
writeFileSync(outputPath, JSON.stringify(output, null, 2));
console.log(JSON.stringify({ ...output, candidates: output.candidates.slice(0, 5) }, null, 2));
