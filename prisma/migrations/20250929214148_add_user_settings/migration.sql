-- CreateTable
CREATE TABLE "user_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "openaiBaseUrl" TEXT DEFAULT 'https://api.openai.com/v1',
    "openaiApiKey" TEXT,
    "modelName" TEXT DEFAULT 'gpt-4',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
