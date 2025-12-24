CREATE TABLE `workHours` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dayOfWeek` int NOT NULL,
	`startTime` varchar(5) NOT NULL,
	`endTime` varchar(5) NOT NULL,
	`isWorkingDay` boolean NOT NULL DEFAULT true,
	`slotDurationMinutes` int NOT NULL DEFAULT 30,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workHours_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
DROP TABLE `work_hours`;--> statement-breakpoint
ALTER TABLE `users` DROP INDEX `users_openId_unique`;--> statement-breakpoint
ALTER TABLE `appointments` DROP FOREIGN KEY `appointments_userId_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `appointments` DROP FOREIGN KEY `appointments_serviceId_services_id_fk`;
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `phone` varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE `services` ADD `descriptionAr` text;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_phone_unique` UNIQUE(`phone`);--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `openId`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `email`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `loginMethod`;