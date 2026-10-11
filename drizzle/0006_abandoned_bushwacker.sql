CREATE TABLE `browser_automation_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`external_run_id` varchar(64) NOT NULL,
	`task` text NOT NULL,
	`status` enum('queued','dispatching','running','completed','failed','cancelled') NOT NULL DEFAULT 'queued',
	`result` text,
	`error` text,
	`model` varchar(80),
	`total_cost_usd` varchar(32),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `browser_automation_runs_id` PRIMARY KEY(`id`),
	CONSTRAINT `browser_automation_runs_external_unique` UNIQUE(`external_run_id`)
);
--> statement-breakpoint
CREATE INDEX `browser_automation_runs_created_index` ON `browser_automation_runs` (`created_at`);--> statement-breakpoint
CREATE INDEX `browser_automation_runs_status_index` ON `browser_automation_runs` (`status`);