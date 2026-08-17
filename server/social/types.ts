export type ConversationLanguage = "en" | "ar" | "unselected";

export type SocialChannel =
  | "instagram_dm"
  | "instagram_story_reply"
  | "instagram_comment"
  | "facebook_messenger"
  | "facebook_comment";

export type InboundSocialEvent = {
  externalEventId: string;
  platform: "instagram" | "facebook";
  channel: SocialChannel;
  senderId: string;
  body: string;
  targetId?: string;
  occurredAt: Date;
  rawType: string;
};

export type MetaSendResult = {
  sent: boolean;
  mode: "live" | "dry-run" | "unavailable";
  detail?: string;
};

export type FaqSeed = {
  slug: string;
  source: "website" | "psi";
  questionEn: string;
  questionAr: string;
  answerEn: string;
  answerAr: string;
  keywordsEn: string[];
  keywordsAr: string[];
  intentAliases: string[];
  sortOrder: number;
};
