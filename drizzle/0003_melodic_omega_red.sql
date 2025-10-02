ALTER TABLE `tag` DROP FOREIGN KEY `tag_parentId_tag_id_fk`;
--> statement-breakpoint
ALTER TABLE `tag` ADD `lft` int NOT NULL;--> statement-breakpoint
ALTER TABLE `tag` ADD `rgt` int NOT NULL;--> statement-breakpoint
ALTER TABLE `tag` DROP COLUMN `parentId`;