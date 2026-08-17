CREATE TABLE `integration_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`settings_key` varchar(100) NOT NULL,
	`metadata` json NOT NULL,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `integration_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `integration_settings_key_unique` UNIQUE(`settings_key`)
);
--> statement-breakpoint
ALTER TABLE `social_posts` MODIFY COLUMN `status` enum('draft','approved','published','failed') NOT NULL DEFAULT 'draft';