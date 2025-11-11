Reading schema files:
/Users/zayanh/Documents/Community-Resource-Forum/Community-Resource-Forum/src/server/db/schema.ts

CREATE TABLE `commentVote` (
	`userId` varchar(255) NOT NULL,
	`commentId` varchar(255) NOT NULL,
	`value` enum('up','down.incorrect','down.harmful','down.spam') NOT NULL,
	CONSTRAINT `commentVote_userId_commentId_pk` PRIMARY KEY(`userId`,`commentId`)
);

CREATE TABLE `comment` (
	`id` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`score` int NOT NULL DEFAULT 0,
	`authorId` varchar(255) NOT NULL,
	`postId` varchar(255) NOT NULL,
	`replyCount` int NOT NULL DEFAULT 0,
	`parentId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `comment_id` PRIMARY KEY(`id`)
);

CREATE TABLE `event` (
	`id` varchar(255) NOT NULL,
	`organizerId` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`start` datetime NOT NULL,
	`end` datetime NOT NULL,
	`allDay` boolean NOT NULL,
	`location` varchar(255),
	`tags` json,
	CONSTRAINT `event_id` PRIMARY KEY(`id`)
);

CREATE TABLE `flags` (
	`userId` varchar(255) NOT NULL,
	`postId` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `flags_userId_postId_pk` PRIMARY KEY(`userId`,`postId`)
);

CREATE TABLE `organization` (
	`organizationId` varchar(255) NOT NULL,
	`userId` varchar(255) NOT NULL,
	`role` enum('member','officer','owner'),
	CONSTRAINT `organization_organizationId_userId_pk` PRIMARY KEY(`organizationId`,`userId`)
);

CREATE TABLE `postVote` (
	`userId` varchar(255) NOT NULL,
	`postId` varchar(255) NOT NULL,
	`value` enum('up','down.incorrect','down.harmful','down.spam') NOT NULL,
	CONSTRAINT `postVote_userId_postId_pk` PRIMARY KEY(`userId`,`postId`)
);

CREATE TABLE `post` (
	`id` varchar(255) NOT NULL,
	`content` text,
	`authorId` varchar(255) NOT NULL,
	`eventId` varchar(255),
	`score` int NOT NULL DEFAULT 0,
	`commentCount` int NOT NULL DEFAULT 0,
	`flagCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `post_id` PRIMARY KEY(`id`)
);

CREATE TABLE `profile` (
	`id` varchar(255) NOT NULL,
	`type` enum('user','organization') NOT NULL,
	`name` varchar(255) NOT NULL,
	`bio` text,
	`linkedin` varchar(255),
	`github` varchar(255),
	`personalSite` varchar(255),
	`image` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `profile_id` PRIMARY KEY(`id`)
);

CREATE TABLE `session` (
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`userAgent` text,
	`userId` varchar(255) NOT NULL,
	`token` varchar(255) NOT NULL,
	CONSTRAINT `session_token` PRIMARY KEY(`token`)
);

CREATE TABLE `subscription` (
	`userId` varchar(255) NOT NULL,
	`tagId` varchar(255) NOT NULL,
	CONSTRAINT `subscription_userId_tagId_pk` PRIMARY KEY(`userId`,`tagId`)
);

CREATE TABLE `tag` (
	`id` varchar(255) NOT NULL,
	`lft` int NOT NULL,
	`rgt` int NOT NULL,
	`depth` int NOT NULL,
	`name` varchar(255) NOT NULL,
	CONSTRAINT `tag_id` PRIMARY KEY(`id`),
	CONSTRAINT `tag_name_unique` UNIQUE(`name`)
);

CREATE TABLE `tags_to_posts` (
	`tagId` varchar(255) NOT NULL,
	`postId` varchar(255) NOT NULL,
	CONSTRAINT `tags_to_posts_tagId_postId_pk` PRIMARY KEY(`tagId`,`postId`)
);

CREATE TABLE `user` (
	`id` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_idx` UNIQUE((lower(`email`)))
);

ALTER TABLE `commentVote` ADD CONSTRAINT `commentVote_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `commentVote` ADD CONSTRAINT `commentVote_commentId_comment_id_fk` FOREIGN KEY (`commentId`) REFERENCES `comment`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `comment` ADD CONSTRAINT `comment_authorId_profile_id_fk` FOREIGN KEY (`authorId`) REFERENCES `profile`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `comment` ADD CONSTRAINT `comment_postId_post_id_fk` FOREIGN KEY (`postId`) REFERENCES `post`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `comment` ADD CONSTRAINT `comment_parentId_comment_id_fk` FOREIGN KEY (`parentId`) REFERENCES `comment`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `event` ADD CONSTRAINT `event_organizerId_profile_id_fk` FOREIGN KEY (`organizerId`) REFERENCES `profile`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `flags` ADD CONSTRAINT `flags_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `flags` ADD CONSTRAINT `flags_postId_post_id_fk` FOREIGN KEY (`postId`) REFERENCES `post`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `organization` ADD CONSTRAINT `organization_organizationId_profile_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `profile`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `organization` ADD CONSTRAINT `organization_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `postVote` ADD CONSTRAINT `postVote_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `postVote` ADD CONSTRAINT `postVote_postId_post_id_fk` FOREIGN KEY (`postId`) REFERENCES `post`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `post` ADD CONSTRAINT `post_authorId_profile_id_fk` FOREIGN KEY (`authorId`) REFERENCES `profile`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `post` ADD CONSTRAINT `post_eventId_event_id_fk` FOREIGN KEY (`eventId`) REFERENCES `event`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `session` ADD CONSTRAINT `session_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `subscription` ADD CONSTRAINT `subscription_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `subscription` ADD CONSTRAINT `subscription_tagId_tag_id_fk` FOREIGN KEY (`tagId`) REFERENCES `tag`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `tags_to_posts` ADD CONSTRAINT `tags_to_posts_tagId_tag_id_fk` FOREIGN KEY (`tagId`) REFERENCES `tag`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `tags_to_posts` ADD CONSTRAINT `tags_to_posts_postId_post_id_fk` FOREIGN KEY (`postId`) REFERENCES `post`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `user` ADD CONSTRAINT `user_id_profile_id_fk` FOREIGN KEY (`id`) REFERENCES `profile`(`id`) ON DELETE no action ON UPDATE no action;
CREATE INDEX `author_idx` ON `comment` (`authorId`);
CREATE INDEX `author_idx` ON `post` (`authorId`);
