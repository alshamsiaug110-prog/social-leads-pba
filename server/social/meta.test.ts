import { afterEach, describe, expect, it, vi } from "vitest";
import { buildMetaReplyRequest, normalizeMetaPayload } from "./meta";

const originalInstagramToken = process.env.META_INSTAGRAM_ACCESS_TOKEN;
const originalPageToken = process.env.META_PAGE_ACCESS_TOKEN;

afterEach(() => {
  process.env.META_INSTAGRAM_ACCESS_TOKEN = originalInstagramToken;
  process.env.META_PAGE_ACCESS_TOKEN = originalPageToken;
});

describe("Meta event normalization", () => {
  it("normalizes a direct Instagram message", () => {
    const events = normalizeMetaPayload({ object: "instagram", entry: [{ id: "ig-1", messaging: [{ sender: { id: "customer-1" }, timestamp: 1000, message: { mid: "message-1", text: "English" } }] }] });
    expect(events[0]).toMatchObject({ externalEventId: "message-1", channel: "instagram_dm", senderId: "customer-1", body: "English" });
  });
  it("normalizes a Facebook Page comment", () => {
    const events = normalizeMetaPayload({ object: "page", entry: [{ id: "page-1", changes: [{ field: "feed", value: { item: "comment", comment_id: "comment-1", from: { id: "customer-2" }, message: "Fees?" } }] }] });
    expect(events[0]).toMatchObject({ channel: "facebook_comment", targetId: "comment-1", body: "Fees?" });
  });

  it("routes Instagram replies through the Instagram API with the dedicated Instagram token", () => {
    vi.stubEnv("META_INSTAGRAM_ACCESS_TOKEN", "instagram-token");
    const request = buildMetaReplyRequest({ externalEventId: "message-1", platform: "instagram", channel: "instagram_dm", senderId: "customer-1", body: "English", occurredAt: new Date() }, "Hello", { instagramId: "17841405576066697" });
    expect(request).toMatchObject({ url: "https://graph.instagram.com/v26.0/17841405576066697/messages", token: "instagram-token", payload: { recipient: { id: "customer-1" }, message: { text: "Hello" } } });
  });

  it("routes Facebook replies through the Page token", () => {
    vi.stubEnv("META_PAGE_ACCESS_TOKEN", "page-token");
    const request = buildMetaReplyRequest({ externalEventId: "message-2", platform: "facebook", channel: "facebook_messenger", senderId: "customer-2", body: "Arabic", occurredAt: new Date() }, "Hello", { pageId: "1097461780292447" });
    expect(request).toMatchObject({ url: "https://graph.facebook.com/v26.0/1097461780292447/messages", token: "page-token", payload: { recipient: { id: "customer-2" }, message: { text: "Hello" } } });
  });
});
