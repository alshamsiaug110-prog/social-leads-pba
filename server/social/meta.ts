import { createHmac, timingSafeEqual } from "crypto";
import type { InboundSocialEvent, MetaSendResult, SocialChannel } from "./types";
const graphBase = process.env.META_GRAPH_API_BASE ?? "https://graph.facebook.com/v23.0";

export function metaReadiness() {
  const hasAppSecret = Boolean(process.env.META_APP_SECRET);
  const hasVerifyToken = Boolean(process.env.META_VERIFY_TOKEN);
  const hasPageToken = Boolean(process.env.META_PAGE_ACCESS_TOKEN);
  const hasPageId = Boolean(process.env.META_PAGE_ID);
  const hasInstagramId = Boolean(process.env.META_INSTAGRAM_ACCOUNT_ID);
  return { hasAppSecret, hasVerifyToken, hasPageToken, hasPageId, hasInstagramId, liveSendingEnabled: process.env.META_SEND_ENABLED === "true", readyForWebhook: hasAppSecret && hasVerifyToken, readyForReplies: hasPageToken && hasPageId && hasInstagramId };
}

export function verifyMetaSignature(rawBody: Buffer | undefined, signature: string | undefined) {
  const secret = process.env.META_APP_SECRET;
  if (!secret || !rawBody || !signature?.startsWith("sha256=")) return false;
  const digest = `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
  const incoming = Buffer.from(signature, "utf8");
  const expected = Buffer.from(digest, "utf8");
  return incoming.length === expected.length && timingSafeEqual(incoming, expected);
}
function channelFor(platform: "instagram" | "facebook", messaging: Record<string, unknown>): SocialChannel {
  if (platform === "instagram" && (messaging.reply_to as Record<string, unknown> | undefined)?.story) return "instagram_story_reply";
  return platform === "instagram" ? "instagram_dm" : "facebook_messenger";
}
function textFromMessage(message: Record<string, unknown>) { return typeof message.text === "string" ? message.text.trim() : ""; }

export function normalizeMetaPayload(payload: any): InboundSocialEvent[] {
  const platform = payload?.object === "instagram" ? "instagram" : payload?.object === "page" ? "facebook" : null;
  if (!platform || !Array.isArray(payload?.entry)) return [];
  const events: InboundSocialEvent[] = [];
  for (const entry of payload.entry) {
    for (const messaging of entry.messaging ?? []) {
      if (messaging?.message?.is_echo) continue;
      const body = textFromMessage(messaging.message ?? {});
      if (!body) continue;
      events.push({ externalEventId: messaging?.message?.mid ?? `${entry.id}:${messaging.timestamp}:${messaging.sender?.id}`, platform, channel: channelFor(platform, messaging), senderId: String(messaging?.sender?.id ?? ""), body, occurredAt: new Date(Number(messaging?.timestamp ?? Date.now())), rawType: "message" });
    }
    for (const change of entry.changes ?? []) {
      const value = change?.value ?? {};
      if (String(value.item ?? "") !== "comment" && !value.comment_id) continue;
      const body = String(value.message ?? value.text ?? "").trim();
      if (!body) continue;
      events.push({ externalEventId: String(value.comment_id ?? value.id ?? `${entry.id}:${change.field}:${value.created_time ?? Date.now()}`), platform, channel: platform === "instagram" ? "instagram_comment" : "facebook_comment", senderId: String(value.from?.id ?? value.sender_id ?? "unknown"), body, targetId: String(value.comment_id ?? value.id ?? ""), occurredAt: new Date(value.created_time ? Number(value.created_time) * 1000 : Date.now()), rawType: "comment" });
    }
  }
  return events.filter(event => event.senderId.length > 0);
}

export async function sendMetaReply(event: InboundSocialEvent, text: string): Promise<MetaSendResult> {
  const readiness = metaReadiness();
  if (!readiness.liveSendingEnabled) return { sent: false, mode: "dry-run", detail: "META_SEND_ENABLED is not true." };
  if (!readiness.hasPageToken) return { sent: false, mode: "unavailable", detail: "Missing META_PAGE_ACCESS_TOKEN." };
  const token = process.env.META_PAGE_ACCESS_TOKEN as string;
  let url: string; let payload: Record<string, unknown>;
  if (event.channel === "instagram_comment" || event.channel === "facebook_comment") {
    if (!event.targetId) return { sent: false, mode: "unavailable", detail: "Comment identifier is missing." };
    url = `${graphBase}/${event.targetId}/replies`; payload = { message: text };
  } else {
    const accountId = event.platform === "instagram" ? process.env.META_INSTAGRAM_ACCOUNT_ID : process.env.META_PAGE_ID;
    if (!accountId) return { sent: false, mode: "unavailable", detail: "Platform account identifier is missing." };
    url = `${graphBase}/${accountId}/messages`; payload = { recipient: { id: event.senderId }, message: { text } };
  }
  const response = await fetch(`${url}?access_token=${encodeURIComponent(token)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  if (!response.ok) return { sent: false, mode: "live", detail: (await response.text()).slice(0, 500) };
  return { sent: true, mode: "live" };
}
