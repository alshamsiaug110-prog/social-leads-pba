CREATE TABLE `system_jobs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`job_key` varchar(100) NOT NULL,
	`task_uid` varchar(65),
	`cron_expression` varchar(100) NOT NULL,
	`callback_path` varchar(255) NOT NULL,
	`is_enabled` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `system_jobs_id` PRIMARY KEY(`id`),
	CONSTRAINT `system_jobs_key_unique` UNIQUE(`job_key`)
);
--> statement-breakpoint
CREATE INDEX `system_jobs_task_uid_index` ON `system_jobs` (`task_uid`);