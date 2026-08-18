import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  db: {
    recordWebhookDelivery: vi.fn(), upsertConversation: vi.fn(), appendMessageEvent: vi.fn(), getApprovedFaqEntries: vi.fn(), markConversationEscalated: vi.fn(), createStaffNotification: vi.fn(), setConversationLanguage: vi.fn(),
  },
}));
const db = mocks.db;
vi.mock("../db", () => mocks.db);
vi.mock("./meta", () => ({ sendMetaReply: vi.fn(async () => ({ sent: false, mode: "dry-run", detail: "disabled" })) }));
vi.mock("./faq", () => ({ detectLanguageChoice: vi.fn(), matchApprovedFaq: vi.fn(() => null) }));
vi.mock("./constants", () => ({ BOT_COPY: { opening: { en: "Hello" }, languageSelected: { en: "Selected", ar: "Selected" }, commentReply: "Thanks" }, escalationMessage: vi.fn(() => "WhatsApp handoff") }));

import { handleInboundEvent } from "./engine";

describe("staff notification escalation trigger", () => {
  beforeEach(() => { vi.clearAllMocks(); db.recordWebhookDelivery.mockResolvedValue(true); db.upsertConversation.mockResolvedValue({ id: 42, language: "en" }); db.getApprovedFaqEntries.mockResolvedValue([]); });
  it("creates a privacy-safe staff notification for an unmatched customer question", async () => {
    await handleInboundEvent({ externalEventId: "event-42", platform: "instagram", channel: "instagram_dm", senderId: "customer-42", body: "A new question", occurredAt: new Date(), rawType: "message" });
    expect(db.createStaffNotification).toHaveBeenCalledWith(expect.objectContaining({ type: "escalation", severity: "warning", title: "New WhatsApp escalation", href: "/conversations" }));
    expect(String(db.createStaffNotification.mock.calls[0][0].detail)).not.toContain("A new question");
  });
});
