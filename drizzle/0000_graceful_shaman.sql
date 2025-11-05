-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE `_prisma_migrations` (
	`id` varchar(36) NOT NULL,
	`checksum` varchar(64) NOT NULL,
	`finished_at` datetime(3),
	`migration_name` varchar(255) NOT NULL,
	`logs` text,
	`rolled_back_at` datetime(3),
	`started_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`applied_steps_count` int unsigned NOT NULL DEFAULT 0,
	CONSTRAINT `_prisma_migrations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `_ShowToUser` (
	`A` varchar(191) NOT NULL,
	`B` varchar(191) NOT NULL,
	CONSTRAINT `_ShowToUser_AB_unique` UNIQUE(`A`,`B`)
);
--> statement-breakpoint
CREATE TABLE `AiGuest` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(191) NOT NULL,
	`showNote` int NOT NULL,
	CONSTRAINT `AiGuest_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `AiShowNote` (
	`id` int AUTO_INCREMENT NOT NULL,
	`show_number` int NOT NULL,
	`title` varchar(191) NOT NULL,
	`description` varchar(1500) NOT NULL,
	`provider` varchar(191) NOT NULL DEFAULT 'gpt3.5',
	CONSTRAINT `AiShowNote_id` PRIMARY KEY(`id`),
	CONSTRAINT `AiShowNote_show_number_key` UNIQUE(`show_number`)
);
--> statement-breakpoint
CREATE TABLE `AiSummaryEntry` (
	`id` int AUTO_INCREMENT NOT NULL,
	`time` varchar(191) NOT NULL,
	`text` varchar(191) NOT NULL,
	`description` varchar(191),
	`showNote` int NOT NULL,
	CONSTRAINT `AiSummaryEntry_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `AiTweet` (
	`id` int AUTO_INCREMENT NOT NULL,
	`content` varchar(350) NOT NULL,
	`showNote` int NOT NULL,
	CONSTRAINT `AiTweet_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Guest` (
	`id` varchar(191) NOT NULL,
	`name` varchar(191) NOT NULL,
	`name_slug` varchar(191) NOT NULL,
	`twitter` varchar(191),
	`github` varchar(191),
	`url` varchar(191),
	`of` varchar(191) DEFAULT '',
	CONSTRAINT `Guest_id` PRIMARY KEY(`id`),
	CONSTRAINT `Guest_name_slug_key` UNIQUE(`name_slug`),
	CONSTRAINT `Guest_twitter_key` UNIQUE(`twitter`),
	CONSTRAINT `Guest_github_key` UNIQUE(`github`)
);
--> statement-breakpoint
CREATE TABLE `Link` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(191) NOT NULL,
	`url` varchar(191) NOT NULL,
	`timestamp` varchar(191),
	`showNote` int NOT NULL,
	CONSTRAINT `Link_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Playlist` (
	`id` varchar(191) NOT NULL,
	`title` varchar(191) NOT NULL,
	`description` text,
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`slug` varchar(191) NOT NULL,
	`unlisted` tinyint(1) DEFAULT 0,
	CONSTRAINT `Playlist_id` PRIMARY KEY(`id`),
	CONSTRAINT `Playlist_slug_key` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `PlaylistOnVideo` (
	`video_id` varchar(191) NOT NULL,
	`playlist_id` varchar(191) NOT NULL,
	`order` int NOT NULL,
	CONSTRAINT `PlaylistOnVideo_video_id_playlist_id` PRIMARY KEY(`video_id`,`playlist_id`),
	CONSTRAINT `PlaylistOnVideo_video_id_playlist_id_key` UNIQUE(`video_id`,`playlist_id`)
);
--> statement-breakpoint
CREATE TABLE `RemotePlaylist` (
	`playlist_id` varchar(191) NOT NULL,
	`title` varchar(191) NOT NULL,
	`videos_count` int NOT NULL,
	`created_at` datetime(3) NOT NULL,
	CONSTRAINT `RemotePlaylist_playlist_id` PRIMARY KEY(`playlist_id`)
);
--> statement-breakpoint
CREATE TABLE `Role` (
	`id` varchar(191) NOT NULL,
	`name` varchar(191) NOT NULL,
	CONSTRAINT `Role_id` PRIMARY KEY(`id`),
	CONSTRAINT `Role_name_key` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `Session` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` varchar(191),
	`access_token` varchar(191),
	`session_token` varchar(191) NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` datetime(3) NOT NULL,
	`ip` varchar(191),
	`country` varchar(191),
	CONSTRAINT `Session_id` PRIMARY KEY(`id`),
	CONSTRAINT `Session_session_token_key` UNIQUE(`session_token`),
	CONSTRAINT `Session_access_token_key` UNIQUE(`access_token`)
);
--> statement-breakpoint
CREATE TABLE `Show` (
	`id` varchar(191) NOT NULL,
	`number` int NOT NULL,
	`title` text NOT NULL,
	`date` datetime(3) NOT NULL,
	`url` varchar(191) NOT NULL,
	`show_notes` text NOT NULL,
	`hash` varchar(191) NOT NULL,
	`slug` varchar(191) NOT NULL,
	`md_file` varchar(191) NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` datetime(3) NOT NULL,
	`show_type` enum('HASTY','TASTY','SUPPER','SPECIAL') NOT NULL DEFAULT 'SPECIAL',
	`youtube_url` varchar(191),
	`spotify_id` varchar(191),
	CONSTRAINT `Show_id` PRIMARY KEY(`id`),
	CONSTRAINT `Show_number_key` UNIQUE(`number`),
	CONSTRAINT `Show_hash_key` UNIQUE(`hash`),
	CONSTRAINT `Show_md_file_key` UNIQUE(`md_file`)
);
--> statement-breakpoint
CREATE TABLE `ShowGuest` (
	`id` varchar(191) NOT NULL,
	`showId` varchar(191) NOT NULL,
	`guestId` varchar(191) NOT NULL,
	`transcriptId` varchar(191),
	CONSTRAINT `ShowGuest_id` PRIMARY KEY(`id`),
	CONSTRAINT `ShowGuest_showId_guestId_key` UNIQUE(`showId`,`guestId`)
);
--> statement-breakpoint
CREATE TABLE `ShowVideo` (
	`showId` varchar(191) NOT NULL,
	`videoId` varchar(191) NOT NULL,
	CONSTRAINT `ShowVideo_showId_videoId` PRIMARY KEY(`showId`,`videoId`)
);
--> statement-breakpoint
CREATE TABLE `SocialLink` (
	`id` varchar(191) NOT NULL,
	`link` varchar(191) NOT NULL,
	`guest_id` varchar(191) NOT NULL,
	CONSTRAINT `SocialLink_id` PRIMARY KEY(`id`),
	CONSTRAINT `SocialLink_link_guest_id_key` UNIQUE(`link`,`guest_id`)
);
--> statement-breakpoint
CREATE TABLE `Topic` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(191) NOT NULL,
	`showNote` int NOT NULL,
	CONSTRAINT `Topic_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Transcript` (
	`id` varchar(191) NOT NULL,
	`show_number` int NOT NULL,
	CONSTRAINT `Transcript_id` PRIMARY KEY(`id`),
	CONSTRAINT `Transcript_show_number_key` UNIQUE(`show_number`)
);
--> statement-breakpoint
CREATE TABLE `TranscriptUtterance` (
	`id` varchar(191) NOT NULL,
	`start` double NOT NULL,
	`end` double NOT NULL,
	`confidence` double NOT NULL,
	`channel` int NOT NULL,
	`transcript_value` text NOT NULL,
	`speaker` int NOT NULL,
	`speakerName` varchar(191),
	`transcriptId` varchar(191) NOT NULL,
	CONSTRAINT `TranscriptUtterance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `TranscriptUtteranceWord` (
	`id` varchar(191) NOT NULL,
	`word` varchar(191) NOT NULL,
	`start` double NOT NULL,
	`end` double NOT NULL,
	`confidence` double NOT NULL,
	`speaker` int NOT NULL,
	`speaker_confidence` double NOT NULL,
	`punctuated_word` varchar(191) NOT NULL,
	`transcriptUtteranceId` varchar(191) NOT NULL,
	CONSTRAINT `TranscriptUtteranceWord_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `User` (
	`id` varchar(191) NOT NULL,
	`avatar_url` varchar(191),
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`email` varchar(191),
	`github_id` int NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	`username` varchar(191),
	`theme` varchar(191) NOT NULL DEFAULT 'system',
	`name` varchar(191),
	`twitter` varchar(191),
	CONSTRAINT `User_id` PRIMARY KEY(`id`),
	CONSTRAINT `User_github_id_key` UNIQUE(`github_id`),
	CONSTRAINT `User_email_key` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `UserRole` (
	`id` varchar(191) NOT NULL,
	`userId` varchar(191) NOT NULL,
	`roleId` varchar(191) NOT NULL,
	CONSTRAINT `UserRole_id` PRIMARY KEY(`id`),
	CONSTRAINT `UserRole_userId_roleId_key` UNIQUE(`userId`,`roleId`)
);
--> statement-breakpoint
CREATE TABLE `UserSubmission` (
	`id` varchar(191) NOT NULL,
	`name` varchar(191),
	`email` varchar(191),
	`body` text NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP(3)),
	`updated_at` datetime(3) NOT NULL,
	`audio_url` varchar(191),
	`status` enum('PENDING','APPROVED','COMPLETED','REJECTED') NOT NULL DEFAULT 'PENDING',
	`submission_type` enum('POTLUCK','SPOOKY','GUEST','FEEDBACK','OTHER','OSS') NOT NULL DEFAULT 'OTHER',
	CONSTRAINT `UserSubmission_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Video` (
	`id` varchar(191) NOT NULL,
	`title` varchar(191) NOT NULL,
	`description` text,
	`url` varchar(191) NOT NULL,
	`published_at` datetime(3) NOT NULL,
	`thumbnail` varchar(191) NOT NULL,
	`slug` varchar(191) NOT NULL,
	CONSTRAINT `Video_id` PRIMARY KEY(`id`),
	CONSTRAINT `Video_slug_key` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE INDEX `_ShowToUser_B_index` ON `_ShowToUser` (`B`);--> statement-breakpoint
CREATE INDEX `AiSummaryEntry_showNote_idx` ON `AiSummaryEntry` (`showNote`);--> statement-breakpoint
CREATE INDEX `Guest_name_idx` ON `Guest` (`name`);--> statement-breakpoint
CREATE INDEX `PlaylistOnVideo_video_id_idx` ON `PlaylistOnVideo` (`video_id`);--> statement-breakpoint
CREATE INDEX `PlaylistOnVideo_playlist_id_idx` ON `PlaylistOnVideo` (`playlist_id`);--> statement-breakpoint
CREATE INDEX `Session_user_id_idx` ON `Session` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_show_number_date` ON `Show` (`number`,`date`);--> statement-breakpoint
CREATE INDEX `Show_number_idx` ON `Show` (`number`);--> statement-breakpoint
CREATE INDEX `ShowGuest_transcriptId_idx` ON `ShowGuest` (`transcriptId`);--> statement-breakpoint
CREATE INDEX `ShowGuest_guestId_idx` ON `ShowGuest` (`guestId`);--> statement-breakpoint
CREATE INDEX `ShowVideo_showId_idx` ON `ShowVideo` (`showId`);--> statement-breakpoint
CREATE INDEX `ShowVideo_videoId_idx` ON `ShowVideo` (`videoId`);--> statement-breakpoint
CREATE INDEX `SocialLink_guest_id_idx` ON `SocialLink` (`guest_id`);--> statement-breakpoint
CREATE INDEX `Topic_showNote_idx` ON `Topic` (`showNote`);--> statement-breakpoint
CREATE INDEX `TranscriptUtterance_transcriptId_idx` ON `TranscriptUtterance` (`transcriptId`);--> statement-breakpoint
CREATE INDEX `TranscriptUtteranceWord_transcriptUtteranceId_idx` ON `TranscriptUtteranceWord` (`transcriptUtteranceId`);--> statement-breakpoint
CREATE INDEX `UserRole_userId_idx` ON `UserRole` (`userId`);--> statement-breakpoint
CREATE INDEX `UserRole_roleId_idx` ON `UserRole` (`roleId`);
*/