import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  db: {
    recordWebhookDelivery: vi.fn(),
    upsertConversation: vi.fn(),
    appendMessageEvent: vi.fn(),
    getApprovedFaqEntries: vi.fn(),
    markConversationEscalated: vi.fn(),
    createStaffNotification: vi.fn(),
    setConversationLanguage: vi.fn(),
    getRecentUnselectedInbound: vi.fn(),
  },
  sendMetaReply: vi.fn(async () => ({ sent: true, mode: "live" })),
}));
vi.mock("../db", () => mocks.db);
vi.mock("./meta", () => ({ sendMetaReply: mocks.sendMetaReply }));

import { handleInboundEvent } from "./engine";

const fees = {
  id: 7, slug: "fees", status: "approved", source: "website",
  questionEn: "What are the class fees?", questionAr: "ما هي رسوم الحصص؟",
  answerEn: "Fees vary by level.", answerAr: "تختلف الرسوم حسب المستوى.",
  keywordsEn: ["fees", "price"], keywordsAr: ["الرسوم"], intentAliases: [],
  sortOrder: 1, createdAt: new Date(), updatedAt: new Date(),
};
const event = (body: string, id: string) => ({
  externalEventId: id, platform: "instagram" as const, channel: "instagram_dm" as const,
  senderId: "c1", body, occurredAt: new Date(), rawType: "message",
});

describe("answering the question asked before the language choice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.db.recordWebhookDelivery.mockResolvedValue(true);
    mocks.db.upsertConversation.mockResolvedValue({ id: 1, language: "unselected" });
    mocks.db.getApprovedFaqEntries.mockResolvedValue([fees]);
  });

  it("answers the earlier fees question right after the language is chosen", async () => {
    mocks.db.getRecentUnselectedInbound.mockResolvedValue([
      { externalMessageId: "m2", body: "English" },
      { externalMessageId: "m1", body: "What are the fees?" },
    ]);
    const result = await handleInboundEvent(event("English", "m2"));
    expect(result).toMatchObject({ handled: "language-selected", language: "en", answeredPending: 7 });
    const sent = mocks.sendMetaReply.mock.calls.map(call => (call as unknown as [unknown, string])[1]);
    expect(sent).toHaveLength(2);
    expect(sent[1]).toBe("Fees vary by level.");
  });

  it("sends only the confirmation when the earlier message is not answerable", async () => {
    mocks.db.getRecentUnselectedInbound.mockResolvedValue([
      { externalMessageId: "m2", body: "English" },
      { externalMessageId: "m1", body: "Can you diagnose my injury?" },
    ]);
    await handleInboundEvent(event("English", "m2"));
    expect(mocks.sendMetaReply).toHaveBeenCalledTimes(1);
  });
});

describe("reply delivery failures", () => {
  it("raises a staff alert instead of throwing when Meta cannot be reached", async () => {
    mocks.db.recordWebhookDelivery.mockResolvedValue(true);
    mocks.db.upsertConversation.mockResolvedValue({ id: 1, language: "en" });
    mocks.db.getApprovedFaqEntries.mockResolvedValue([fees]);
    mocks.sendMetaReply.mockResolvedValueOnce({ sent: false, mode: "unavailable", detail: "Network error contacting Meta: timeout" } as never);
    await handleInboundEvent(event("What are the fees?", "m9"));
    expect(mocks.db.createStaffNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: "reply_failure", severity: "critical" })
    );
  });
});
