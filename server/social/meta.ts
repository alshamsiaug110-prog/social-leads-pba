import { createHmac, timingSafeEqual } from "crypto";
import * as db from "../db";
import type { InboundSocialEvent, MetaSendResult, SocialChannel } from "./types";

const graphBase = process.env.META_GRAPH_API_BASE ?? "https://graph.facebook.com/v26.0";
const instagramGraphBase = process.env.META_INSTAGRAM_API_BASE ?? "https://graph.instagram.com/v26.0";
const academyPageId = process.env.META_PAGE_ID ?? "1097461780292447";
type MetaAccountIds = { pageId?: string; instagramId?: string; pageName?: string; instagramUsername?: string };
type MetaReplyRequest = { url: string; payload: Record<string, unknown>; token: string };

export function metaReadiness() {
  const hasAppSecret = Boolean(process.env.META_APP_SECRET);
  const hasVerifyToken = Boolean(process.env.META_VERIFY_TOKEN);
  const hasPageToken = Boolean(process.env.META_PAGE_ACCESS_TOKEN);
  const hasInstagramToken = Boolean(process.env.META_INSTAGRAM_ACCESS_TOKEN);
  const hasPageId = Boolean(process.env.META_PAGE_ID);
  const hasInstagramId = Boolean(process.env.META_INSTAGRAM_ACCOUNT_ID);
  const readyForFacebookReplies = hasPageToken && hasPageId;
  const readyForInstagramReplies = hasInstagramToken && hasInstagramId;
  return { hasAppSecret, hasVerifyToken, hasPageToken, hasInstagramToken, hasPageId, hasInstagramId, liveSendingEnabled: process.env.META_SEND_ENABLED === "true", readyForWebhook: hasAppSecret && hasVerifyToken, readyForFacebookReplies, readyForInstagramReplies, readyForReplies: readyForFacebookReplies && readyForInstagramReplies };
}

export async function resolveMetaAccounts(): Promise<MetaAccountIds> {
  const stored = await db.getIntegrationMetadata();
  const metadata = stored?.metadata ?? {};
  return {
    pageId: process.env.META_PAGE_ID ?? (typeof metadata.pageId === "string" ? metadata.pageId : undefined),
    instagramId: process.env.META_INSTAGRAM_ACCOUNT_ID ?? (typeof metadata.instagramId === "string" ? metadata.instagramId : undefined),
    pageName: typeof metadata.pageName === "string" ? metadata.pageName : undefined,
    instagramUsername: typeof metadata.instagramUsername === "string" ? metadata.instagramUsername : undefined,
  };
}

export async function metaReadinessWithStoredAccounts() {
  const accounts = await resolveMetaAccounts();
  const base = metaReadiness();
  const hasPageId = Boolean(accounts.pageId);
  const hasInstagramId = Boolean(accounts.instagramId);
  return { ...base, hasPageId, hasInstagramId, readyForReplies: base.hasPageToken && hasPageId && hasInstagramId, accounts };
}

export async function discoverMetaAccounts() {
  const pageToken = process.env.META_PAGE_ACCESS_TOKEN;
  const instagramToken = process.env.META_INSTAGRAM_ACCESS_TOKEN;
  if (!pageToken && !instagramToken) throw new Error("Add the Meta Page token and/or Instagram API token before discovering connected accounts.");

  let page: { id?: string; name?: string; instagram_business_account?: { id?: string; username?: string } } | undefined;
  if (pageToken) {
    const principalResponse = await fetch(`${graphBase}/me?fields=id,name&access_token=${encodeURIComponent(pageToken)}`);
    if (!principalResponse.ok) throw new Error(`Meta Page-token validation failed: ${(await principalResponse.text()).slice(0, 500)}`);
    const accountsResponse = await fetch(`${graphBase}/me/accounts?fields=id,name,instagram_business_account{id,username}&access_token=${encodeURIComponent(pageToken)}`);
    const accountsPayload = accountsResponse.ok ? await accountsResponse.json() as { data?: Array<{ id?: string; name?: string; instagram_business_account?: { id?: string; username?: string } }> } : null;
    const authorisedPages = accountsPayload?.data?.filter(candidate => candidate.id) ?? [];
    const namedPage = authorisedPages.find(candidate => candidate.name?.toLowerCase().includes("premier ballet academy"));
    page = namedPage ?? (authorisedPages.length === 1 ? authorisedPages[0] : undefined);
    if (!page) {
      const directPageResponse = await fetch(`${graphBase}/${academyPageId}?fields=id,name,instagram_business_account{id,username}&access_token=${encodeURIComponent(pageToken)}`);
      if (directPageResponse.ok) page = await directPageResponse.json() as typeof page;
    }
  }

  let instagramId = page?.instagram_business_account?.id;
  let instagramUsername = page?.instagram_business_account?.username;
  if (instagramToken) {
    const instagramResponse = await fetch(`${instagramGraphBase}/me?fields=user_id,username&access_token=${encodeURIComponent(instagramToken)}`);
    const instagramPayload = await instagramResponse.json() as { data?: Array<{ user_id?: string; username?: string }>; error?: { message?: string } };
    if (!instagramResponse.ok) throw new Error(`Instagram token validation failed: ${instagramPayload.error?.message ?? "no error message returned"}`);
    const account = instagramPayload.data?.[0];
    if (!account?.user_id) throw new Error("Instagram token validation did not return the professional-account identifier.");
    instagramId = account.user_id;
    instagramUsername = account.username;
  }
  if (!page?.id) throw new Error("Meta did not return the Premier Ballet Academy Page. Confirm the Page token has Page access.");
  if (!instagramId) throw new Error("Meta did not return the linked Instagram professional account. Add the Instagram API token generated for @premierballet_academy.");
  const existing = await db.getIntegrationMetadata();
  const metadata = { ...(existing?.metadata ?? {}), pageId: page.id, pageName: page.name ?? null, instagramId, instagramUsername: instagramUsername ?? null, discoveredAt: new Date().toISOString() };
  await db.upsertIntegrationMetadata(metadata);
  return { pageId: page.id, pageName: page.name ?? null, instagramId, instagramUsername: instagramUsername ?? null };
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

export function buildMetaReplyRequest(event: InboundSocialEvent, text: string, accounts: MetaAccountIds): MetaReplyRequest | { detail: string } {
  const isInstagram = event.platform === "instagram";
  const token = isInstagram ? process.env.META_INSTAGRAM_ACCESS_TOKEN : process.env.META_PAGE_ACCESS_TOKEN;
  if (!token) return { detail: isInstagram ? "Missing META_INSTAGRAM_ACCESS_TOKEN." : "Missing META_PAGE_ACCESS_TOKEN." };
  const host = isInstagram ? instagramGraphBase : graphBase;
  if (event.channel === "instagram_comment" || event.channel === "facebook_comment") {
    if (!event.targetId) return { detail: "Comment identifier is missing." };
    return { url: `${host}/${event.targetId}/replies`, payload: { message: text }, token };
  }
  const accountId = isInstagram ? accounts.instagramId : accounts.pageId;
  if (!accountId) return { detail: "Platform account identifier has not been discovered." };
  return { url: `${host}/${accountId}/messages`, payload: { recipient: { id: event.senderId }, message: { text } }, token };
}

export async function sendMetaReply(event: InboundSocialEvent, text: string): Promise<MetaSendResult> {
  const readiness = metaReadiness();
  if (!readiness.liveSendingEnabled) return { sent: false, mode: "dry-run", detail: "META_SEND_ENABLED is not true." };
  const accounts = await resolveMetaAccounts();
  const request = buildMetaReplyRequest(event, text, accounts);
  if ("detail" in request) return { sent: false, mode: "unavailable", detail: request.detail };
  const response = await fetch(request.url, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${request.token}` }, body: JSON.stringify(request.payload) });
  if (!response.ok) return { sent: false, mode: "live", detail: (await response.text()).slice(0, 500) };
  return { sent: true, mode: "live" };
}
