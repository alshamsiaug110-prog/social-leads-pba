import * as db from "../db";
import { metaReadiness, resolveMetaAccounts } from "./meta";

const graphBase = process.env.META_GRAPH_API_BASE ?? "https://graph.facebook.com/v23.0";

async function graphPost(path: string, payload: Record<string, string>) {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  if (!token) throw new Error("META_PAGE_ACCESS_TOKEN is not configured.");
  const body = new URLSearchParams(payload);
  const response = await fetch(`${graphBase}/${path}?access_token=${encodeURIComponent(token)}`, {
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
      const response = await graphPost(`${accounts.pageId}/feed`, { message: approvedPost.caption, ...(approvedPost.mediaUrl ? { link: approvedPost.mediaUrl } : {}) });
      externalPostId = response.id ?? "";
    } else {
      if (!accounts.instagramId) throw new Error("Connected Instagram professional account ID has not been discovered.");
      if (!approvedPost.mediaUrl) throw new Error("Instagram publishing requires a public image URL.");
      const container = await graphPost(`${accounts.instagramId}/media`, { image_url: approvedPost.mediaUrl, caption: approvedPost.caption });
      const published = await graphPost(`${accounts.instagramId}/media_publish`, { creation_id: container.id });
      externalPostId = published.id ?? "";
    }
    await db.updateSocialPost(approvedPost.id, { status: "published", externalPostId, publishedAt: new Date() });
    return { id: approvedPost.id, externalPostId };
  } catch (error) {
    await db.updateSocialPost(approvedPost.id, { status: "failed" });
    throw error;
  }
}
