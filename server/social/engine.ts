import * as db from "../db";
import { BOT_COPY, escalationMessage } from "./constants";
import { detectLanguageChoice, matchApprovedFaq } from "./faq";
import { sendMetaReply } from "./meta";
import type { InboundSocialEvent } from "./types";

async function emit(
  event: InboundSocialEvent,
  conversationId: number | null,
  text: string,
  language: "en" | "ar" | "unselected",
  matchedFaqId: number | null,
  escalated: boolean
) {
  const result = await sendMetaReply(event, text);
  if (conversationId)
    await db.appendMessageEvent({
      conversationId,
      externalMessageId: `${event.externalEventId}:reply:${Date.now()}`,
      externalTargetId: event.targetId ?? null,
      channel: event.channel,
      direction: "outbound",
      body: text,
      language,
      matchedFaqId,
      escalated,
    });
  if (!result.sent && result.mode !== "dry-run") {
    const detail =
      result.detail?.trim() || "Meta did not return an error detail.";
    await db.createStaffNotification({
      type: "reply_failure",
      severity: "critical",
      title: "Automated reply needs attention",
      detail: `A ${event.channel.replaceAll("_", " ")} reply could not be sent. Meta detail: ${detail.slice(0, 500)}`,
      href: "/conversations",
    });
  }
  return result;
}

export async function handleInboundEvent(event: InboundSocialEvent) {
  const accepted = await db.recordWebhookDelivery({
    externalEventId: event.externalEventId,
    platform: event.platform,
    eventType: event.rawType,
  });
  if (!accepted) return { skipped: "duplicate" as const };
  if (
    event.channel === "instagram_comment" ||
    event.channel === "facebook_comment"
  ) {
    await emit(event, null, BOT_COPY.commentReply, "unselected", null, false);
    return { handled: "comment" as const };
  }
  const conversation = await db.upsertConversation({
    conversationKey: `${event.platform}:${event.channel}:${event.senderId}`,
    senderId: event.senderId,
    channel: event.channel,
  });
  await db.appendMessageEvent({
    conversationId: conversation.id,
    externalMessageId: event.externalEventId,
    externalTargetId: event.targetId ?? null,
    channel: event.channel,
    direction: "inbound",
    body: event.body,
    language: conversation.language,
    matchedFaqId: null,
    escalated: false,
  });
  if (conversation.language === "unselected") {
    const choice = detectLanguageChoice(event.body);
    if (!choice) {
      await emit(
        event,
        conversation.id,
        BOT_COPY.opening.en,
        "unselected",
        null,
        false
      );
      return { handled: "language-prompt" as const };
    }
    await db.setConversationLanguage(conversation.id, choice);
    await emit(
      event,
      conversation.id,
      BOT_COPY.languageSelected[choice],
      choice,
      null,
      false
    );
    return { handled: "language-selected" as const, language: choice };
  }
  const match = matchApprovedFaq(event.body, await db.getApprovedFaqEntries());
  if (match) {
    await emit(
      event,
      conversation.id,
      conversation.language === "ar"
        ? match.entry.answerAr
        : match.entry.answerEn,
      conversation.language,
      match.entry.id,
      false
    );
    return { handled: "faq" as const, faqId: match.entry.id };
  }
  await db.markConversationEscalated(conversation.id);
  await db.createStaffNotification({
    type: "escalation",
    severity: "warning",
    title: "New WhatsApp escalation",
    detail: `An unanswered ${event.channel.replaceAll("_", " ")} question was handed off to the branch team.`,
    href: "/conversations",
  });
  await emit(
    event,
    conversation.id,
    escalationMessage(conversation.language, event.body),
    conversation.language,
    null,
    true
  );
  return { handled: "escalation" as const };
}
