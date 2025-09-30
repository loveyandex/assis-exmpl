-- AlterTable
ALTER TABLE "user_settings" ADD COLUMN "gitlabToken" TEXT;
ALTER TABLE "user_settings" ADD COLUMN "gitlabUrl" TEXT DEFAULT 'https://gitlab.com/api/v4';
