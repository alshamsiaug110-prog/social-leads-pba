import * as db from "../db";
const graphBase = process.env.META_GRAPH_API_BASE ?? "https://graph.facebook.com/v23.0";
async function graphGet(path: string) {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  if (!token) throw new Error("META_PAGE_ACCESS_TOKEN is not configured.");
  const response = await fetch(`${graphBase}/${path}${path.includes("?") ? "&" : "?"}access_token=${encodeURIComponent(token)}`);
  if (!response.ok) throw new Error(`Meta metrics request failed: ${await response.text()}`);
  return response.json() as Promise<any>;
}
export async function refreshSocialMetrics() {
  const pageId = process.env.META_PAGE_ID; const instagramId = process.env.META_INSTAGRAM_ACCOUNT_ID; const result: Record<string, unknown> = {};
  if (pageId) { const page = await graphGet(`${pageId}?fields=fan_count,followers_count,name`); await db.insertMetricSnapshot({ platform: "facebook", followers: Number(page.followers_count ?? page.fan_count ?? 0), payload: { pageName: page.name ?? null, fanCount: page.fan_count ?? null } }); result.facebook = page; }
  if (instagramId) { const instagram = await graphGet(`${instagramId}?fields=followers_count,media_count,username`); await db.insertMetricSnapshot({ platform: "instagram", followers: Number(instagram.followers_count ?? 0), payload: { username: instagram.username ?? null, mediaCount: instagram.media_count ?? null } }); result.instagram = instagram; }
  return result;
}
