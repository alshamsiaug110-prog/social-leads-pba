import { afterEach, describe, expect, it, vi } from "vitest";
import * as db from "../db";
import { buildMetaReplyRequest, discoverMetaAccounts, normalizeMetaPayload } from "./meta";

vi.mock("../db", () => ({
  getIntegrationMetadata: vi.fn(),
  upsertIntegrationMetadata: vi.fn(),
}));

const originalInstagramToken = process.env.META_INSTAGRAM_ACCESS_TOKEN;
const originalPageToken = process.env.META_PAGE_ACCESS_TOKEN;

afterEach(() => {
  process.env.META_INSTAGRAM_ACCESS_TOKEN = originalInstagramToken;
  process.env.META_PAGE_ACCESS_TOKEN = originalPageToken;
  vi.restoreAllMocks();
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

  it("re-checks the confirmed academy Page when the account list omits its Instagram linkage", async () => {
    vi.stubEnv("META_PAGE_ACCESS_TOKEN", "page-token");
    vi.stubEnv("META_INSTAGRAM_ACCESS_TOKEN", "");
    vi.mocked(db.getIntegrationMetadata).mockResolvedValue(undefined);
    vi.mocked(db.upsertIntegrationMetadata).mockResolvedValue(undefined);
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "page-principal" }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [{ id: "1097461780292447", name: "Premier Ballet Academy" }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "1097461780292447", name: "Premier Ballet Academy", instagram_business_account: { id: "17841405576066697", username: "premierballet_academy" } }) });
    vi.stubGlobal("fetch", fetchMock);

    await expect(discoverMetaAccounts()).resolves.toMatchObject({ pageId: "1097461780292447", instagramId: "17841405576066697", instagramUsername: "premierballet_academy" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(String(fetchMock.mock.calls[2]?.[0])).toContain("/1097461780292447?fields=id,name,instagram_business_account");
  });
});
