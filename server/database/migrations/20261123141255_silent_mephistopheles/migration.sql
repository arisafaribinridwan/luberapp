ALTER TABLE `members` ADD `user_id` text REFERENCES user(id) ON DELETE SET NULL;--> statement-breakpoint
CREATE INDEX `member_user_idx` ON `members` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `member_user_unique` ON `members` (`user_id`);