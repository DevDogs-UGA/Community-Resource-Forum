ALTER TABLE `comments` ADD `score` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `comments` ADD `depth` int NOT NULL;--> statement-breakpoint
ALTER TABLE `comments` ADD `replyCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `post` ADD `commentCount` int DEFAULT 0 NOT NULL;