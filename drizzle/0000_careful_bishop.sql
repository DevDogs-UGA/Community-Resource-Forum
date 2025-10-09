CREATE TABLE `account` (
	`id` varchar(255) NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` timestamp,
	`refresh_token_expires_at` timestamp,
	`scope` text,
	`password` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL,
	CONSTRAINT `account_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `event` (
	`id` varchar(255) NOT NULL,
	`organizerId` varchar(255),
	`title` varchar(255) NOT NULL,
	`start` datetime NOT NULL,
	`end` datetime NOT NULL,
	`allDay` boolean NOT NULL,
	`location` varchar(255),
	CONSTRAINT `event_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`organization` varchar(255) NOT NULL,
	`user` varchar(255) NOT NULL,
	`role` enum('member','officer','owner'),
	CONSTRAINT `organizations_organization_user_pk` PRIMARY KEY(`organization`,`user`),
	CONSTRAINT `profile_is_organization` CHECK(`organizations`.`organization` = 'organization')
);
--> statement-breakpoint
CREATE TABLE `post` (
	`id` varchar(255) NOT NULL,
	`content` text,
	`authorId` varchar(255) NOT NULL,
	`eventId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `post_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `profile` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255) DEFAULT 'UGA Student',
	`displayName` varchar(255),
	`image` varchar(255),
	`type` enum('user','organization'),
	CONSTRAINT `profile_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reply` (
	`id` varchar(255) NOT NULL,
	`content` text,
	`authorId` varchar(255) NOT NULL,
	`postId` varchar(255) NOT NULL,
	`parentId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reply_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` varchar(255) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`token` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` varchar(255) NOT NULL,
	CONSTRAINT `session_id` PRIMARY KEY(`id`),
	CONSTRAINT `session_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `tag` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`parentId` varchar(255),
	CONSTRAINT `tag_id` PRIMARY KEY(`id`),
	CONSTRAINT `tag_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `tags_to_posts` (
	`tagId` varchar(255) NOT NULL,
	`postId` varchar(255) NOT NULL,
	CONSTRAINT `tags_to_posts_tagId_postId_pk` PRIMARY KEY(`tagId`,`postId`)
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` varchar(255) NOT NULL,
	`name` text NOT NULL,
	`email` varchar(255) NOT NULL,
	`email_verified` boolean NOT NULL DEFAULT false,
	`image` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `users_to_tags` (
	`userId` varchar(255) NOT NULL,
	`tagId` varchar(255) NOT NULL,
	CONSTRAINT `users_to_tags_userId_tagId_pk` PRIMARY KEY(`userId`,`tagId`)
);
--> statement-breakpoint
CREATE TABLE `verification` (
	`id` varchar(255) NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `verification_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `account` ADD CONSTRAINT `account_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `event` ADD CONSTRAINT `event_organizerId_profile_id_fk` FOREIGN KEY (`organizerId`) REFERENCES `profile`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organizations` ADD CONSTRAINT `organizations_organization_profile_id_fk` FOREIGN KEY (`organization`) REFERENCES `profile`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organizations` ADD CONSTRAINT `organizations_user_profile_id_fk` FOREIGN KEY (`user`) REFERENCES `profile`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post` ADD CONSTRAINT `post_authorId_profile_id_fk` FOREIGN KEY (`authorId`) REFERENCES `profile`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post` ADD CONSTRAINT `post_eventId_event_id_fk` FOREIGN KEY (`eventId`) REFERENCES `event`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reply` ADD CONSTRAINT `reply_authorId_profile_id_fk` FOREIGN KEY (`authorId`) REFERENCES `profile`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reply` ADD CONSTRAINT `reply_postId_post_id_fk` FOREIGN KEY (`postId`) REFERENCES `post`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reply` ADD CONSTRAINT `reply_parentId_reply_id_fk` FOREIGN KEY (`parentId`) REFERENCES `reply`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `session` ADD CONSTRAINT `session_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tag` ADD CONSTRAINT `tag_parentId_tag_id_fk` FOREIGN KEY (`parentId`) REFERENCES `tag`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tags_to_posts` ADD CONSTRAINT `tags_to_posts_tagId_tag_id_fk` FOREIGN KEY (`tagId`) REFERENCES `tag`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tags_to_posts` ADD CONSTRAINT `tags_to_posts_postId_post_id_fk` FOREIGN KEY (`postId`) REFERENCES `post`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user` ADD CONSTRAINT `user_id_profile_id_fk` FOREIGN KEY (`id`) REFERENCES `profile`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users_to_tags` ADD CONSTRAINT `users_to_tags_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users_to_tags` ADD CONSTRAINT `users_to_tags_tagId_tag_id_fk` FOREIGN KEY (`tagId`) REFERENCES `tag`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `author_idx` ON `post` (`authorId`);--> statement-breakpoint
CREATE INDEX `author_idx` ON `reply` (`authorId`);