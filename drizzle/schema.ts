import { boolean, index, int, json, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["admin", "user"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const faqEntries = mysqlTable("faq_entries", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 160 }).notNull(),
  status: mysqlEnum("status", ["draft", "approved", "archived"]).default("draft").notNull(),
  source: mysqlEnum("source", ["website", "psi", "inbox", "staff"]).default("staff").notNull(),
  questionEn: text("question_en").notNull(),
  questionAr: text("question_ar").notNull(),
  answerEn: text("answer_en").notNull(),
  answerAr: text("answer_ar").notNull(),
  keywordsEn: json("keywords_en").$type<string[]>().notNull(),
  keywordsAr: json("keywords_ar").$type<string[]>().notNull(),
  intentAliases: json("intent_aliases").$type<string[]>().notNull(),
  sortOrder: int("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, table => ({ slugUnique: uniqueIndex("faq_entries_slug_unique").on(table.slug), statusIndex: index("faq_entries_status_index").on(table.status) }));

export const inboxImports = mysqlTable("inbox_imports", {
  id: int("id").autoincrement().primaryKey(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileCount: int("file_count").default(0).notNull(),
  totalCustomerMessages: int("total_customer_messages").default(0).notNull(),
  uniqueQuestionCount: int("unique_question_count").default(0).notNull(),
  repeatedQuestionMessages: int("repeated_question_messages").default(0).notNull(),
  repeatedQuestionRate: int("repeated_question_rate_basis_points").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const faqCandidates = mysqlTable("faq_candidates", {
  id: int("id").autoincrement().primaryKey(),
  importId: int("import_id").notNull(),
  question: text("question").notNull(),
  suggestedAnswer: text("suggested_answer"),
  language: mysqlEnum("language", ["en", "ar"]).notNull(),
  frequency: int("frequency").default(1).notNull(),
  sampleThreadRef: varchar("sample_thread_ref", { length: 300 }),
  status: mysqlEnum("status", ["pending", "promoted", "rejected"]).default("pending").notNull(),
  createdFaqId: int("created_faq_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, table => ({ importIndex: index("faq_candidates_import_index").on(table.importId), statusIndex: index("faq_candidates_status_index").on(table.status) }));

export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  conversationKey: varchar("conversation_key", { length: 350 }).notNull(),
  senderId: varchar("sender_id", { length: 255 }).notNull(),
  channel: mysqlEnum("channel", ["instagram_dm", "instagram_story_reply", "instagram_comment", "facebook_messenger", "facebook_comment"]).notNull(),
  language: mysqlEnum("language", ["en", "ar", "unselected"]).default("unselected").notNull(),
  status: mysqlEnum("status", ["active", "escalated", "closed"]).default("active").notNull(),
  isEscalated: boolean("is_escalated").default(false).notNull(),
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, table => ({ conversationUnique: uniqueIndex("conversations_key_unique").on(table.conversationKey), recentIndex: index("conversations_recent_index").on(table.lastMessageAt) }));

export const messageEvents = mysqlTable("message_events", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversation_id").notNull(),
  externalMessageId: varchar("external_message_id", { length: 320 }).notNull(),
  externalTargetId: varchar("external_target_id", { length: 320 }),
  channel: mysqlEnum("channel", ["instagram_dm", "instagram_story_reply", "instagram_comment", "facebook_messenger", "facebook_comment"]).notNull(),
  direction: mysqlEnum("direction", ["inbound", "outbound"]).notNull(),
  body: text("body").notNull(),
  language: mysqlEnum("language", ["en", "ar", "unselected"]).default("unselected").notNull(),
  matchedFaqId: int("matched_faq_id"),
  escalated: boolean("escalated").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, table => ({ externalUnique: uniqueIndex("message_events_external_unique").on(table.externalMessageId), conversationIndex: index("message_events_conversation_index").on(table.conversationId), createdIndex: index("message_events_created_index").on(table.createdAt) }));

export const webhookDeliveries = mysqlTable("webhook_deliveries", {
  id: int("id").autoincrement().primaryKey(),
  externalEventId: varchar("external_event_id", { length: 320 }).notNull(),
  platform: mysqlEnum("platform", ["instagram", "facebook"]).notNull(),
  eventType: varchar("event_type", { length: 80 }).notNull(),
  receivedAt: timestamp("received_at").defaultNow().notNull(),
}, table => ({ eventUnique: uniqueIndex("webhook_deliveries_event_unique").on(table.externalEventId) }));

export const socialPosts = mysqlTable("social_posts", {
  id: int("id").autoincrement().primaryKey(),
  platform: mysqlEnum("platform", ["instagram", "facebook"]).notNull(),
  externalPostId: varchar("external_post_id", { length: 255 }),
  caption: text("caption").notNull(),
  mediaUrl: text("media_url"),
  status: mysqlEnum("status", ["draft", "approved", "published", "failed"]).default("draft").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  publishedAt: timestamp("published_at"),
});

export const metricSnapshots = mysqlTable("metric_snapshots", {
  id: int("id").autoincrement().primaryKey(),
  platform: mysqlEnum("platform", ["instagram", "facebook"]).notNull(),
  followers: int("followers").default(0).notNull(),
  payload: json("payload").$type<Record<string, unknown>>().notNull(),
  collectedAt: timestamp("collected_at").defaultNow().notNull(),
}, table => ({ collectedIndex: index("metric_snapshots_collected_index").on(table.collectedAt) }));

export const systemJobs = mysqlTable("system_jobs", {
  id: int("id").autoincrement().primaryKey(),
  jobKey: varchar("job_key", { length: 100 }).notNull(),
  taskUid: varchar("task_uid", { length: 65 }),
  cronExpression: varchar("cron_expression", { length: 100 }).notNull(),
  callbackPath: varchar("callback_path", { length: 255 }).notNull(),
  isEnabled: boolean("is_enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, table => ({ jobKeyUnique: uniqueIndex("system_jobs_key_unique").on(table.jobKey), taskUidIndex: index("system_jobs_task_uid_index").on(table.taskUid) }));

export const integrationSettings = mysqlTable("integration_settings", {
  id: int("id").autoincrement().primaryKey(),
  settingsKey: varchar("settings_key", { length: 100 }).notNull(),
  metadata: json("metadata").$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
}, table => ({ settingsKeyUnique: uniqueIndex("integration_settings_key_unique").on(table.settingsKey) }));

export const staffNotifications = mysqlTable("staff_notifications", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["escalation", "reply_failure", "integration_failure", "publishing"]).notNull(),
  severity: mysqlEnum("severity", ["info", "warning", "critical"]).default("info").notNull(),
  title: varchar("title", { length: 180 }).notNull(),
  detail: text("detail"),
  href: varchar("href", { length: 255 }),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, table => ({ createdIndex: index("staff_notifications_created_index").on(table.createdAt), unreadIndex: index("staff_notifications_unread_index").on(table.readAt) }));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type FAQEntry = typeof faqEntries.$inferSelect;
export type InsertFAQEntry = typeof faqEntries.$inferInsert;
export type StaffNotification = typeof staffNotifications.$inferSelect;
