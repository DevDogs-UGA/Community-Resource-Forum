CREATE TABLE `commentVote` (
	`userId` varchar(255) NOT NULL,
	`commentId` varchar(255) NOT NULL,
	`value` enum('up','down.incorrect','down.harmful','down.spam') NOT NULL,
	CONSTRAINT `commentVote_userId_commentId_pk` PRIMARY KEY(`userId`,`commentId`)
);
--> statement-breakpoint
RENAME TABLE `vote` TO `postVote`;--> statement-breakpoint
ALTER TABLE `postVote` DROP FOREIGN KEY `vote_userId_user_id_fk`;
--> statement-breakpoint
ALTER TABLE `postVote` DROP FOREIGN KEY `vote_postId_post_id_fk`;
--> statement-breakpoint
ALTER TABLE `postVote` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `postVote` ADD PRIMARY KEY(`userId`,`postId`);--> statement-breakpoint
ALTER TABLE `commentVote` ADD CONSTRAINT `commentVote_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `commentVote` ADD CONSTRAINT `commentVote_commentId_comments_id_fk` FOREIGN KEY (`commentId`) REFERENCES `comments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `postVote` ADD CONSTRAINT `postVote_userId_user_id_fk` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `postVote` ADD CONSTRAINT `postVote_postId_post_id_fk` FOREIGN KEY (`postId`) REFERENCES `post`(`id`) ON DELETE no action ON UPDATE no action;