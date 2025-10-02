RENAME TABLE `reply` TO `comments`;--> statement-breakpoint
RENAME TABLE `like` TO `vote`;--> statement-breakpoint
ALTER TABLE `post` RENAME COLUMN `likeCount` TO `score`;--> statement-breakpoint
ALTER TABLE `vote` DROP FOREIGN KEY `like_userId_user_id_fk`;
--> statement-breakpoint
ALTER TABLE `vote` DROP FOREIGN KEY `like_postId_post_id_fk`;
--> statement-breakpoint
ALTER TABLE `comments` DROP FOREIGN KEY `reply_authorId_profile_id_fk`;
--> statement-breakpoint
ALTER TABLE `comments` DROP FOREIGN KEY `reply_postId_post_id_fk`;
--> statement-breakpoint
ALTER TABLE `comments` DROP FOREIGN KEY `reply_parentId_reply_id_fk`;
--> statement-breakpoint
ALTER TABLE `vote` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `comments` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `vote` ADD PRIMARY KEY(`userId`,`postId`);--> statement-breakpoint
ALTER TABLE `comments` ADD PRIMARY KEY(`id`);--> statement-breakpoint
ALTER TABLE `vote` ADD `value` enum('up','down.incorrect','down.harmful','down.spam') NOT NULL;--> statement-breakpoint
ALTER TABLE `vote` ADD CONSTRAINT `vote_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `vote` ADD CONSTRAINT `vote_postId_post_id_fk` FOREIGN KEY (`postId`) REFERENCES `post`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comments` ADD CONSTRAINT `comments_authorId_profile_id_fk` FOREIGN KEY (`authorId`) REFERENCES `profile`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comments` ADD CONSTRAINT `comments_postId_post_id_fk` FOREIGN KEY (`postId`) REFERENCES `post`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comments` ADD CONSTRAINT `comments_parentId_comments_id_fk` FOREIGN KEY (`parentId`) REFERENCES `comments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comments` DROP COLUMN `updatedAt`;