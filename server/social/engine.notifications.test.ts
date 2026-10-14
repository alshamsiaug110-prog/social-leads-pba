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
  },
  sendMetaReply: vi.fn(async () => ({
    sent: false,
    mode: "dry-run",
    detail: "disabled",
  })),
}));
const db = mocks.db;
vi.mock("../db", () => mocks.db);
vi.mock("./meta", () => ({ sendMetaReply: mocks.sendMetaReply }));
vi.mock("./faq", () => ({
  detectLanguageChoice: vi.fn(),
  matchApprovedFaq: vi.fn(() => null),
}));
vi.mock("./constants", () => ({
  BOT_COPY: {
    opening: { en: "Hello" },
    languageSelected: { en: "Selected", ar: "Selected" },
    commentReply: "Thanks",
  },
  escalationMessage: vi.fn(() => "WhatsApp handoff"),
}));

import { handleInboundEvent } from "./engine";

describe("staff notification escalation trigger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.recordWebhookDelivery.mockResolvedValue(true);
    db.upsertConversation.mockResolvedValue({ id: 42, language: "en" });
    db.getApprovedFaqEntries.mockResolvedValue([]);
  });
  it("creates a privacy-safe staff notification for an unmatched customer question", async () => {
    await handleInboundEvent({
      externalEventId: "event-42",
      platform: "instagram",
      channel: "instagram_dm",
      senderId: "customer-42",
      body: "A new question",
      occurredAt: new Date(),
      rawType: "message",
    });
    expect(db.createStaffNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "escalation",
        severity: "warning",
        title: "New WhatsApp escalation",
        href: "/conversations",
      })
    );
    expect(
      String(db.createStaffNotification.mock.calls[0][0].detail)
    ).not.toContain("A new question");
  });

  it("includes Meta's failure detail when a live automated reply is rejected", async () => {
    mocks.sendMetaReply.mockResolvedValue({
      sent: false,
      mode: "live",
      detail: "(#10) The user is not reachable by this messaging app.",
    });
    await handleInboundEvent({
      externalEventId: "event-43",
      platform: "instagram",
      channel: "instagram_dm",
      senderId: "customer-43",
      body: "English",
      occurredAt: new Date(),
      rawType: "message",
    });
    expect(db.createStaffNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "reply_failure",
        severity: "critical",
        detail: expect.stringContaining(
          "The user is not reachable by this messaging app."
        ),
      })
    );
  });
});
