import * as db from "../db";
import { resolveFacebookPageAccessToken, resolveMetaAccounts } from "./meta";
const graphBase = process.env.META_GRAPH_API_BASE ?? "https://graph.facebook.com/v26.0";
const instagramGraphBase = process.env.META_INSTAGRAM_API_BASE ?? "https://graph.instagram.com/v26.0";
async function graphGet(base: string, path: string, token: string) {
  const response = await fetch(`${base}/${path}${path.includes("?") ? "&" : "?"}access_token=${encodeURIComponent(token)}`);
  if (!response.ok) throw new Error(`Meta metrics request failed: ${await response.text()}`);
  return response.json() as Promise<any>;
}
export async function refreshSocialMetrics() {
  const { pageId, instagramId } = await resolveMetaAccounts(); const result: Record<string, unknown> = {};
  if (pageId) { const pageToken = await resolveFacebookPageAccessToken(pageId); const page = await graphGet(graphBase, `${pageId}?fields=fan_count,followers_count,name`, pageToken); await db.insertMetricSnapshot({ platform: "facebook", followers: Number(page.followers_count ?? page.fan_count ?? 0), payload: { pageName: page.name ?? null, fanCount: page.fan_count ?? null } }); result.facebook = page; }
  if (instagramId) { const instagramToken = process.env.META_INSTAGRAM_ACCESS_TOKEN; if (!instagramToken) throw new Error("META_INSTAGRAM_ACCESS_TOKEN is not configured."); const instagram = await graphGet(instagramGraphBase, `${instagramId}?fields=followers_count,media_count,username`, instagramToken); await db.insertMetricSnapshot({ platform: "instagram", followers: Number(instagram.followers_count ?? 0), payload: { username: instagram.username ?? null, mediaCount: instagram.media_count ?? null } }); result.instagram = instagram; }
  return result;
}
