import { describe, expect, it } from "vitest";
import { metaReadiness } from "./meta";
import { publishSocialPost } from "./publisher";

describe("publishing safety gate", () => {
  it("does not report live publishing as active without explicit configuration", () => {
    const original = process.env.META_SEND_ENABLED;
    delete process.env.META_SEND_ENABLED;
    expect(metaReadiness().liveSendingEnabled).toBe(false);
    if (original) process.env.META_SEND_ENABLED = original;
  });

  it("rejects any release request before live sending is enabled, even if a post ID is supplied", async () => {
    const original = process.env.META_SEND_ENABLED;
    delete process.env.META_SEND_ENABLED;
    await expect(publishSocialPost({ postId: 1 })).rejects.toThrow("Live publishing is locked");
    if (original) process.env.META_SEND_ENABLED = original;
  });
});
