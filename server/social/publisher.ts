import * as db from "../db";
import { metaReadiness, resolveFacebookPageAccessToken, resolveMetaAccounts } from "./meta";

const graphBase = process.env.META_GRAPH_API_BASE ?? "https://graph.facebook.com/v26.0";
const instagramGraphBase = process.env.META_INSTAGRAM_API_BASE ?? "https://graph.instagram.com/v26.0";

async function graphPost(base: string, path: string, payload: Record<string, string>, token: string) {
  const body = new URLSearchParams(payload);
  const response = await fetch(`${base}/${path}?access_token=${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) throw new Error((await response.text()).slice(0, 500));
  return response.json() as Promise<Record<string, string>>;
}

export async function publishSocialPost(input: { postId: number }) {
  const readiness = metaReadiness();
  if (!readiness.liveSendingEnabled) throw new Error("Live publishing is locked. Set META_SEND_ENABLED=true only after staff approval and Meta verification.");
  const approvedPost = await db.getSocialPost(input.postId);
  if (!approvedPost || approvedPost.status !== "approved") throw new Error("Only staff-approved posts can be sent live.");
  const accounts = await resolveMetaAccounts();
  try {
    let externalPostId: string;
    if (approvedPost.platform === "facebook") {
      if (!accounts.pageId) throw new Error("Connected Facebook Page ID has not been discovered.");
      const pageToken = await resolveFacebookPageAccessToken(accounts.pageId);
      const response = await graphPost(graphBase, `${accounts.pageId}/feed`, { message: approvedPost.caption, ...(approvedPost.mediaUrl ? { link: approvedPost.mediaUrl } : {}) }, pageToken);
      externalPostId = response.id ?? "";
    } else {
      if (!accounts.instagramId) throw new Error("Connected Instagram professional account ID has not been discovered.");
      if (!approvedPost.mediaUrl) throw new Error("Instagram publishing requires a public image URL.");
      const instagramToken = process.env.META_INSTAGRAM_ACCESS_TOKEN;
      if (!instagramToken) throw new Error("META_INSTAGRAM_ACCESS_TOKEN is not configured.");
      const container = await graphPost(instagramGraphBase, `${accounts.instagramId}/media`, { image_url: approvedPost.mediaUrl, caption: approvedPost.caption }, instagramToken);
      const published = await graphPost(instagramGraphBase, `${accounts.instagramId}/media_publish`, { creation_id: container.id }, instagramToken);
      externalPostId = published.id ?? "";
    }
    await db.updateSocialPost(approvedPost.id, { status: "published", externalPostId, publishedAt: new Date() });
    return { id: approvedPost.id, externalPostId };
  } catch (error) {
    await db.updateSocialPost(approvedPost.id, { status: "failed" });
    throw error;
  }
}
