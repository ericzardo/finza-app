-- DropForeignKey
ALTER TABLE `buckets` DROP FOREIGN KEY `buckets_workspace_id_fkey`;

-- DropForeignKey
ALTER TABLE `workspaces` DROP FOREIGN KEY `workspaces_user_id_fkey`;

-- AddForeignKey
ALTER TABLE `workspaces` ADD CONSTRAINT `workspaces_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `buckets` ADD CONSTRAINT `buckets_workspace_id_fkey` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
