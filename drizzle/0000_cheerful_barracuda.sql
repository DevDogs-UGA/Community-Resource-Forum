CREATE TABLE `event` (
	`id` varchar(255) NOT NULL,
	`organizerId` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`start` datetime NOT NULL,
	`end` datetime NOT NULL,
	`allDay` boolean NOT NULL,
	`location` varchar(255),
	CONSTRAINT `event_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organization` (
	`organizationId` varchar(255) NOT NULL,
	`userId` varchar(255) NOT NULL,
	`role` enum('member','officer','owner'),
	CONSTRAINT `organization_organizationId_userId_pk` PRIMARY KEY(`organizationId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `post` (
	`id` varchar(255) NOT NULL,
	`content` text,
	`authorId` varchar(255) NOT NULL,
	`eventId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `post_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `profile` (
	`id` varchar(255) NOT NULL,
	`type` enum('user','organization') NOT NULL,
	`name` varchar(255) NOT NULL,
	`image` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `profile_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reply` (
	`id` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`authorId` varchar(255) NOT NULL,
	`postId` varchar(255) NOT NULL,
	`parentId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reply_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `session` (
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`userAgent` text,
	`userId` varchar(255) NOT NULL,
	`token` varchar(255) NOT NULL,
	CONSTRAINT `session_token` PRIMARY KEY(`token`)
);
--> statement-breakpoint
CREATE TABLE `subscription` (
	`userId` varchar(255) NOT NULL,
	`tagId` varchar(255) NOT NULL,
	CONSTRAINT `subscription_userId_tagId_pk` PRIMARY KEY(`userId`,`tagId`)
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
	`email` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_idx` UNIQUE((lower(`email`)))
);
--> statement-breakpoint
ALTER TABLE `event` ADD CONSTRAINT `event_organizerId_profile_id_fk` FOREIGN KEY (`organizerId`) REFERENCES `profile`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organization` ADD CONSTRAINT `organization_organizationId_profile_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `profile`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organization` ADD CONSTRAINT `organization_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post` ADD CONSTRAINT `post_authorId_profile_id_fk` FOREIGN KEY (`authorId`) REFERENCES `profile`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `post` ADD CONSTRAINT `post_eventId_event_id_fk` FOREIGN KEY (`eventId`) REFERENCES `event`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reply` ADD CONSTRAINT `reply_authorId_profile_id_fk` FOREIGN KEY (`authorId`) REFERENCES `profile`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reply` ADD CONSTRAINT `reply_postId_post_id_fk` FOREIGN KEY (`postId`) REFERENCES `post`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reply` ADD CONSTRAINT `reply_parentId_reply_id_fk` FOREIGN KEY (`parentId`) REFERENCES `reply`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `session` ADD CONSTRAINT `session_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscription` ADD CONSTRAINT `subscription_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscription` ADD CONSTRAINT `subscription_tagId_tag_id_fk` FOREIGN KEY (`tagId`) REFERENCES `tag`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tag` ADD CONSTRAINT `tag_parentId_tag_id_fk` FOREIGN KEY (`parentId`) REFERENCES `tag`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tags_to_posts` ADD CONSTRAINT `tags_to_posts_tagId_tag_id_fk` FOREIGN KEY (`tagId`) REFERENCES `tag`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tags_to_posts` ADD CONSTRAINT `tags_to_posts_postId_post_id_fk` FOREIGN KEY (`postId`) REFERENCES `post`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user` ADD CONSTRAINT `user_id_profile_id_fk` FOREIGN KEY (`id`) REFERENCES `profile`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `author_idx` ON `post` (`authorId`);--> statement-breakpoint
CREATE INDEX `author_idx` ON `reply` (`authorId`);