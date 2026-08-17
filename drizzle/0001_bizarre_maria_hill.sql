CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversation_key` varchar(350) NOT NULL,
	`sender_id` varchar(255) NOT NULL,
	`channel` enum('instagram_dm','instagram_story_reply','instagram_comment','facebook_messenger','facebook_comment') NOT NULL,
	`language` enum('en','ar','unselected') NOT NULL DEFAULT 'unselected',
	`status` enum('active','escalated','closed') NOT NULL DEFAULT 'active',
	`is_escalated` boolean NOT NULL DEFAULT false,
	`last_message_at` timestamp NOT NULL DEFAULT (now()),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`),
	CONSTRAINT `conversations_key_unique` UNIQUE(`conversation_key`)
);
--> statement-breakpoint
CREATE TABLE `faq_candidates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`import_id` int NOT NULL,
	`question` text NOT NULL,
	`suggested_answer` text,
	`language` enum('en','ar') NOT NULL,
	`frequency` int NOT NULL DEFAULT 1,
	`sample_thread_ref` varchar(300),
	`status` enum('pending','promoted','rejected') NOT NULL DEFAULT 'pending',
	`created_faq_id` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `faq_candidates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `faq_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(160) NOT NULL,
	`status` enum('draft','approved','archived') NOT NULL DEFAULT 'draft',
	`source` enum('website','psi','inbox','staff') NOT NULL DEFAULT 'staff',
	`question_en` text NOT NULL,
	`question_ar` text NOT NULL,
	`answer_en` text NOT NULL,
	`answer_ar` text NOT NULL,
	`keywords_en` json NOT NULL,
	`keywords_ar` json NOT NULL,
	`intent_aliases` json NOT NULL,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `faq_entries_id` PRIMARY KEY(`id`),
	CONSTRAINT `faq_entries_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `inbox_imports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`file_name` varchar(255) NOT NULL,
	`file_count` int NOT NULL DEFAULT 0,
	`total_customer_messages` int NOT NULL DEFAULT 0,
	`unique_question_count` int NOT NULL DEFAULT 0,
	`repeated_question_messages` int NOT NULL DEFAULT 0,
	`repeated_question_rate_basis_points` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inbox_imports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `message_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversation_id` int NOT NULL,
	`external_message_id` varchar(320) NOT NULL,
	`channel` enum('instagram_dm','instagram_story_reply','instagram_comment','facebook_messenger','facebook_comment') NOT NULL,
	`direction` enum('inbound','outbound') NOT NULL,
	`body` text NOT NULL,
	`language` enum('en','ar','unselected') NOT NULL DEFAULT 'unselected',
	`matched_faq_id` int,
	`escalated` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `message_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `message_events_external_unique` UNIQUE(`external_message_id`)
);
--> statement-breakpoint
CREATE TABLE `metric_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`platform` enum('instagram','facebook') NOT NULL,
	`followers` int NOT NULL DEFAULT 0,
	`payload` json NOT NULL,
	`collected_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `metric_snapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `social_posts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`platform` enum('instagram','facebook') NOT NULL,
	`external_post_id` varchar(255),
	`caption` text NOT NULL,
	`media_url` text,
	`status` enum('draft','published','failed') NOT NULL DEFAULT 'draft',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`published_at` timestamp,
	CONSTRAINT `social_posts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `webhook_deliveries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`external_event_id` varchar(320) NOT NULL,
	`platform` enum('instagram','facebook') NOT NULL,
	`event_type` varchar(80) NOT NULL,
	`received_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `webhook_deliveries_id` PRIMARY KEY(`id`),
	CONSTRAINT `webhook_deliveries_event_unique` UNIQUE(`external_event_id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','user') NOT NULL DEFAULT 'user';--> statement-breakpoint
CREATE INDEX `conversations_recent_index` ON `conversations` (`last_message_at`);--> statement-breakpoint
CREATE INDEX `faq_candidates_import_index` ON `faq_candidates` (`import_id`);--> statement-breakpoint
CREATE INDEX `faq_candidates_status_index` ON `faq_candidates` (`status`);--> statement-breakpoint
CREATE INDEX `faq_entries_status_index` ON `faq_entries` (`status`);--> statement-breakpoint
CREATE INDEX `message_events_conversation_index` ON `message_events` (`conversation_id`);--> statement-breakpoint
CREATE INDEX `message_events_created_index` ON `message_events` (`created_at`);--> statement-breakpoint
CREATE INDEX `metric_snapshots_collected_index` ON `metric_snapshots` (`collected_at`);