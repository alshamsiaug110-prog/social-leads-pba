CREATE TABLE `staff_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('escalation','reply_failure','integration_failure','publishing') NOT NULL,
	`severity` enum('info','warning','critical') NOT NULL DEFAULT 'info',
	`title` varchar(180) NOT NULL,
	`detail` text,
	`href` varchar(255),
	`read_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `staff_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `staff_notifications_created_index` ON `staff_notifications` (`created_at`);--> statement-breakpoint
CREATE INDEX `staff_notifications_unread_index` ON `staff_notifications` (`read_at`);