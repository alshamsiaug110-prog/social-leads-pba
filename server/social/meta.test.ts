import { createHmac } from "crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as db from "../db";
import {
  activateFacebookPageWebhook,
  buildMetaReplyRequest,
  discoverMetaAccounts,
  normalizeMetaPayload,
  resolveFacebookPageAccessToken,
  verifyMetaSignature,
} from "./meta";

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
  vi.unstubAllEnvs();
});

describe("Meta event normalization", () => {
  it("normalizes a direct Instagram message", () => {
    const events = normalizeMetaPayload({
      object: "instagram",
      entry: [
        {
          id: "ig-1",
          messaging: [
            {
              sender: { id: "customer-1" },
              timestamp: 1000,
              message: { mid: "message-1", text: "English" },
            },
          ],
        },
      ],
    });
    expect(events[0]).toMatchObject({
      externalEventId: "message-1",
      channel: "instagram_dm",
      senderId: "customer-1",
      body: "English",
    });
  });
  it("normalizes a Facebook Page comment", () => {
    const events = normalizeMetaPayload({
      object: "page",
      entry: [
        {
          id: "page-1",
          changes: [
            {
              field: "feed",
              value: {
                item: "comment",
                comment_id: "comment-1",
                from: { id: "customer-2" },
                message: "Fees?",
              },
            },
          ],
        },
      ],
    });
    expect(events[0]).toMatchObject({
      channel: "facebook_comment",
      targetId: "comment-1",
      body: "Fees?",
    });
  });

  it("normalizes a real-shaped Instagram comment webhook (field comments, id and text)", () => {
    const events = normalizeMetaPayload({
      object: "instagram",
      entry: [
        {
          id: "ig-account-1",
          changes: [
            {
              field: "comments",
              value: {
                id: "ig-comment-1",
                text: "How much are the fees?",
                from: { id: "customer-3", username: "parent" },
                media: { id: "media-1" },
              },
            },
          ],
        },
      ],
    });
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      platform: "instagram",
      channel: "instagram_comment",
      targetId: "ig-comment-1",
      senderId: "customer-3",
      body: "How much are the fees?",
    });
  });

  it("ignores comments written by the academy's own Page or Instagram account", () => {
    vi.stubEnv("META_PAGE_ID", "page-1");
    vi.stubEnv("META_INSTAGRAM_ACCOUNT_ID", "ig-account-1");
    const facebook = normalizeMetaPayload({
      object: "page",
      entry: [
        {
          id: "page-1",
          changes: [
            {
              field: "feed",
              value: {
                item: "comment",
                verb: "add",
                comment_id: "bot-reply-1",
                from: { id: "page-1" },
                message: "Hello — you are interacting with the automated assistant.",
              },
            },
          ],
        },
      ],
    });
    const instagram = normalizeMetaPayload({
      object: "instagram",
      entry: [
        {
          id: "ig-account-1",
          changes: [
            {
              field: "comments",
              value: {
                id: "bot-reply-2",
                text: "Hello — you are interacting with the automated assistant.",
                from: { id: "ig-account-1" },
              },
            },
          ],
        },
      ],
    });
    expect(facebook).toHaveLength(0);
    expect(instagram).toHaveLength(0);
  });

  it("only replies to newly added Facebook comments, not edits or removals", () => {
    const payload = (verb: string) => ({
      object: "page",
      entry: [
        {
          id: "page-1",
          changes: [
            {
              field: "feed",
              value: {
                item: "comment",
                verb,
                comment_id: `comment-${verb}`,
                from: { id: "customer-4" },
                message: "Fees?",
              },
            },
          ],
        },
      ],
    });
    expect(normalizeMetaPayload(payload("add"))).toHaveLength(1);
    expect(normalizeMetaPayload(payload("edited"))).toHaveLength(0);
    expect(normalizeMetaPayload(payload("remove"))).toHaveLength(0);
  });

  it("replies to Facebook comments on /comments and Instagram comments on /replies", () => {
    vi.stubEnv("META_PAGE_ACCESS_TOKEN", "page-token");
    vi.stubEnv("META_INSTAGRAM_ACCESS_TOKEN", "instagram-token");
    const base = {
      externalEventId: "c-1",
      senderId: "customer-5",
      body: "Fees?",
      targetId: "comment-123",
      occurredAt: new Date(),
      rawType: "comment",
    } as const;
    const facebook = buildMetaReplyRequest(
      { ...base, platform: "facebook", channel: "facebook_comment" },
      "Hello",
      { pageId: "page-1" }
    );
    const instagram = buildMetaReplyRequest(
      { ...base, platform: "instagram", channel: "instagram_comment" },
      "Hello",
      { instagramId: "ig-1" }
    );
    expect(facebook).toMatchObject({
      url: "https://graph.facebook.com/v26.0/comment-123/comments",
      payload: { message: "Hello" },
    });
    expect(instagram).toMatchObject({
      url: "https://graph.instagram.com/v26.0/comment-123/replies",
      payload: { message: "Hello" },
    });
  });

  it("routes Instagram replies through the Instagram API with the dedicated Instagram token", () => {
    vi.stubEnv("META_INSTAGRAM_ACCESS_TOKEN", "instagram-token");
    const request = buildMetaReplyRequest(
      {
        externalEventId: "message-1",
        platform: "instagram",
        channel: "instagram_dm",
        senderId: "customer-1",
        body: "English",
        occurredAt: new Date(),
      },
      "Hello",
      { instagramId: "17841405576066697" }
    );
    expect(request).toMatchObject({
      url: "https://graph.instagram.com/v26.0/17841405576066697/messages",
      token: "instagram-token",
      payload: { recipient: { id: "customer-1" }, message: { text: "Hello" } },
    });
  });

  it("routes Facebook replies through the Page token", () => {
    vi.stubEnv("META_PAGE_ACCESS_TOKEN", "page-token");
    const request = buildMetaReplyRequest(
      {
        externalEventId: "message-2",
        platform: "facebook",
        channel: "facebook_messenger",
        senderId: "customer-2",
        body: "Arabic",
        occurredAt: new Date(),
      },
      "Hello",
      { pageId: "1097461780292447" }
    );
    expect(request).toMatchObject({
      url: "https://graph.facebook.com/v26.0/1097461780292447/messages",
      token: "page-token",
      payload: {
        recipient: { id: "customer-2" },
        message: { text: "Hello" },
        messaging_type: "RESPONSE",
      },
    });
  });

  it("accepts valid webhook signatures from either the Facebook app or the separate Instagram API app", () => {
    const body = Buffer.from('{"object":"instagram"}');
    vi.stubEnv("META_APP_SECRET", "facebook-secret");
    vi.stubEnv("META_INSTAGRAM_APP_SECRET", "instagram-secret");
    const facebookSignature = `sha256=${createHmac("sha256", "facebook-secret").update(body).digest("hex")}`;
    const instagramSignature = `sha256=${createHmac("sha256", "instagram-secret").update(body).digest("hex")}`;
    expect(verifyMetaSignature(body, facebookSignature)).toBe(true);
    expect(verifyMetaSignature(body, instagramSignature)).toBe(true);
    expect(verifyMetaSignature(body, "sha256=not-a-real-signature")).toBe(
      false
    );
  });

  it("derives the Page-specific token when the configured Facebook credential is a user token", async () => {
    vi.stubEnv("META_PAGE_ACCESS_TOKEN", "user-token");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "user-1" }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              id: "1097461780292447",
              name: "Premier Ballet Academy",
              access_token: "page-token",
            },
          ],
        }),
      });
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      resolveFacebookPageAccessToken("1097461780292447")
    ).resolves.toBe("page-token");
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain(
      "fields=id,name,access_token,instagram_business_account"
    );
  });

  it("activates the academy Page subscription with the derived Page-specific token", async () => {
    vi.stubEnv("META_PAGE_ACCESS_TOKEN", "user-token");
    vi.mocked(db.getIntegrationMetadata).mockResolvedValue({
      metadata: { pageId: "1097461780292447" },
    } as never);
    vi.mocked(db.upsertIntegrationMetadata).mockResolvedValue(undefined);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "user-1" }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              id: "1097461780292447",
              name: "Premier Ballet Academy",
              access_token: "derived-page-token",
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });
    vi.stubGlobal("fetch", fetchMock);

    await expect(activateFacebookPageWebhook()).resolves.toMatchObject({
      pageId: "1097461780292447",
      active: true,
    });
    expect(String(fetchMock.mock.calls[2]?.[0])).toContain(
      "/1097461780292447/subscribed_apps"
    );
    expect(String(fetchMock.mock.calls[2]?.[1]?.body)).toContain(
      "access_token=derived-page-token"
    );
  });

  it("re-checks the confirmed academy Page when the account list omits its Instagram linkage", async () => {
    vi.stubEnv("META_PAGE_ACCESS_TOKEN", "page-token");
    vi.stubEnv("META_INSTAGRAM_ACCESS_TOKEN", "");
    vi.mocked(db.getIntegrationMetadata).mockResolvedValue(undefined);
    vi.mocked(db.upsertIntegrationMetadata).mockResolvedValue(undefined);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "page-principal" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ id: "1097461780292447", name: "Premier Ballet Academy" }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "1097461780292447",
          name: "Premier Ballet Academy",
          instagram_business_account: {
            id: "17841405576066697",
            username: "premierballet_academy",
          },
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    await expect(discoverMetaAccounts()).resolves.toMatchObject({
      pageId: "1097461780292447",
      instagramId: "17841405576066697",
      instagramUsername: "premierballet_academy",
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(String(fetchMock.mock.calls[2]?.[0])).toContain(
      "/1097461780292447?fields=id,name,instagram_business_account"
    );
  });
});
