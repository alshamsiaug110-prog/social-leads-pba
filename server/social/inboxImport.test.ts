import AdmZip from "adm-zip";
import { describe, expect, it } from "vitest";
import { parseFacebookInboxZip } from "./inboxImport";

describe("Facebook Inbox importer", () => {
  it("extracts repeated customer questions as review candidates without auto-approving them", () => {
    const zip = new AdmZip();
    zip.addFile("inbox/thread/message_1.json", Buffer.from(JSON.stringify({ thread_path: "inbox/thread", messages: [
      { sender_name: "Customer", timestamp_ms: 1, content: "What are the fees?" },
      { sender_name: "Premier Ballet Academy", timestamp_ms: 2, content: "Fees vary by level." },
      { sender_name: "Customer", timestamp_ms: 3, content: "What are the fees?" },
      { sender_name: "Premier Ballet Academy", timestamp_ms: 4, content: "Fees vary by level." },
    ] })));
    const result = parseFacebookInboxZip(zip.toBuffer());
    expect(result.uniqueQuestionCount).toBe(1);
    expect(result.repeatedQuestionRate).toBe(100);
    expect(result.candidates[0]).toMatchObject({ question: "What are the fees?", frequency: 2 });
  });

  it("excludes platform notices and contact-bearing customer messages from the review queue", () => {
    const zip = new AdmZip();
    zip.addFile("inbox/thread/message_1.json", Buffer.from(JSON.stringify({ messages: [
      { sender_name: "Customer", timestamp_ms: 1, content: "Facebook created this chat because a customer commented on your post." },
      { sender_name: "Customer", timestamp_ms: 2, content: "Can you call me at +20 10 12345678?" },
      { sender_name: "Premier Ballet Academy", timestamp_ms: 3, content: "We will assist." },
    ] })));
    const result = parseFacebookInboxZip(zip.toBuffer());
    expect(result.candidates).toHaveLength(0);
  });
});
