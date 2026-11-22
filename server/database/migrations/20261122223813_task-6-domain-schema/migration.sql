CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY,
	`event_type` text NOT NULL,
	`summary` text NOT NULL,
	`actor_id` text,
	`target_type` text,
	`target_id` text,
	`metadata_json` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_audit_logs_actor_id_user_id_fk` FOREIGN KEY (`actor_id`) REFERENCES `user`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `manual_accounts` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`account_number` text,
	`holder_name` text NOT NULL,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`created_by_id` text,
	`updated_by_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_manual_accounts_created_by_id_user_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `user`(`id`) ON DELETE SET NULL,
	CONSTRAINT `fk_manual_accounts_updated_by_id_user_id_fk` FOREIGN KEY (`updated_by_id`) REFERENCES `user`(`id`) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`phone` text,
	`status` text DEFAULT 'ACTIVE' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY,
	`tx_type` text NOT NULL,
	`fund_purpose` text,
	`tx_date` text NOT NULL,
	`debit_account` text NOT NULL,
	`credit_account` text NOT NULL,
	`amount` integer NOT NULL,
	`description` text NOT NULL,
	`meeting_reference` text,
	`related_transaction_id` text,
	`member_id` text,
	`destination_account` text,
	`source_account` text,
	`attachment_url` text NOT NULL,
	`attachment_drive_id` text NOT NULL,
	`created_by_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT `fk_transactions_member_id_members_id_fk` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_transactions_destination_account_manual_accounts_id_fk` FOREIGN KEY (`destination_account`) REFERENCES `manual_accounts`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_transactions_source_account_manual_accounts_id_fk` FOREIGN KEY (`source_account`) REFERENCES `manual_accounts`(`id`) ON DELETE RESTRICT,
	CONSTRAINT `fk_transactions_created_by_id_user_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE INDEX `audit_log_event_type_idx` ON `audit_logs` (`event_type`);--> statement-breakpoint
CREATE INDEX `audit_log_actor_idx` ON `audit_logs` (`actor_id`);--> statement-breakpoint
CREATE INDEX `audit_log_created_at_idx` ON `audit_logs` (`created_at`);--> statement-breakpoint
CREATE INDEX `audit_log_target_idx` ON `audit_logs` (`target_type`,`target_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `manual_account_name_unique` ON `manual_accounts` (`name`);--> statement-breakpoint
CREATE INDEX `manual_account_status_idx` ON `manual_accounts` (`status`);--> statement-breakpoint
CREATE INDEX `manual_account_created_by_idx` ON `manual_accounts` (`created_by_id`);--> statement-breakpoint
CREATE INDEX `manual_account_updated_by_idx` ON `manual_accounts` (`updated_by_id`);--> statement-breakpoint
CREATE INDEX `member_status_idx` ON `members` (`status`);--> statement-breakpoint
CREATE INDEX `transaction_type_idx` ON `transactions` (`tx_type`);--> statement-breakpoint
CREATE INDEX `transaction_date_idx` ON `transactions` (`tx_date`);--> statement-breakpoint
CREATE INDEX `transaction_member_idx` ON `transactions` (`member_id`);--> statement-breakpoint
CREATE INDEX `transaction_related_idx` ON `transactions` (`related_transaction_id`);--> statement-breakpoint
CREATE INDEX `transaction_destination_account_idx` ON `transactions` (`destination_account`);--> statement-breakpoint
CREATE INDEX `transaction_source_account_idx` ON `transactions` (`source_account`);--> statement-breakpoint
CREATE INDEX `transaction_created_by_idx` ON `transactions` (`created_by_id`);