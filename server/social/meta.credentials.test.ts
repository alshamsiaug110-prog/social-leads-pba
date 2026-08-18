import { describe, expect, it } from "vitest";

const graphBase = process.env.META_GRAPH_API_BASE ?? "https://graph.facebook.com/v26.0";
const instagramGraphBase = process.env.META_INSTAGRAM_API_BASE ?? "https://graph.instagram.com/v26.0";
const academyPageId = process.env.META_PAGE_ID ?? "1097461780292447";

describe("Meta Page token validation", () => {
  it("validates that the supplied credential is accepted by Meta", async () => {
    const token = process.env.META_PAGE_ACCESS_TOKEN;
    expect(token, "META_PAGE_ACCESS_TOKEN must be configured").toBeTruthy();

    const response = await fetch(`${graphBase}/me?fields=id,name&access_token=${encodeURIComponent(token as string)}`);
    const payload = await response.json() as { id?: string; error?: { code?: number; message?: string } };
    expect(response.ok, `Meta account lookup failed with ${response.status}${payload.error?.code ? ` (code ${payload.error.code})` : ""}: ${payload.error?.message ?? "no error message returned"}`).toBe(true);

    const page = payload;
    expect(page.id).toBeTruthy();
  }, 20_000);

  it("retrieves the confirmed Premier Ballet Academy Page", async () => {
    const token = process.env.META_PAGE_ACCESS_TOKEN;
    expect(token, "META_PAGE_ACCESS_TOKEN must be configured").toBeTruthy();
    const response = await fetch(`${graphBase}/${academyPageId}?fields=id,name,instagram_business_account{id,username}&access_token=${encodeURIComponent(token as string)}`);
    const page = await response.json() as { id?: string; instagram_business_account?: { id?: string }; error?: { code?: number; message?: string } };
    expect(response.ok, `Meta Page linkage lookup failed with ${response.status}${page.error?.code ? ` (code ${page.error.code})` : ""}: ${page.error?.message ?? "no error message returned"}`).toBe(true);
    expect(page.id).toBe(academyPageId);
  }, 20_000);
});

describe("Instagram token validation", () => {
  it("validates the generated Instagram API token", async () => {
    const token = process.env.META_INSTAGRAM_ACCESS_TOKEN;
    expect(token, "META_INSTAGRAM_ACCESS_TOKEN must be configured").toBeTruthy();
    const response = await fetch(`${instagramGraphBase}/me?fields=user_id,username&access_token=${encodeURIComponent(token as string)}`);
    const payload = await response.json() as { data?: Array<{ user_id?: string; username?: string }>; error?: { code?: number; message?: string } };
    expect(response.ok, `Instagram token validation failed with ${response.status}${payload.error?.code ? ` (code ${payload.error.code})` : ""}: ${payload.error?.message ?? "no error message returned"}`).toBe(true);
    expect(payload.data?.[0]?.user_id, "Instagram token validation did not return a professional-account identifier.").toBeTruthy();
  }, 20_000);
});
