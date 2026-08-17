import { describe, expect, it } from "vitest";
import { normalizeMetaPayload } from "./meta";

describe("Meta event normalization", () => {
  it("normalizes a direct Instagram message", () => {
    const events = normalizeMetaPayload({ object: "instagram", entry: [{ id: "ig-1", messaging: [{ sender: { id: "customer-1" }, timestamp: 1000, message: { mid: "message-1", text: "English" } }] }] });
    expect(events[0]).toMatchObject({ externalEventId: "message-1", channel: "instagram_dm", senderId: "customer-1", body: "English" });
  });
  it("normalizes a Facebook Page comment", () => {
    const events = normalizeMetaPayload({ object: "page", entry: [{ id: "page-1", changes: [{ field: "feed", value: { item: "comment", comment_id: "comment-1", from: { id: "customer-2" }, message: "Fees?" } }] }] });
    expect(events[0]).toMatchObject({ channel: "facebook_comment", targetId: "comment-1", body: "Fees?" });
  });
});
