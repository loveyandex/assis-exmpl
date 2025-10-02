-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ldapHost" TEXT,
    "ldapPort" INTEGER DEFAULT 389,
    "ldapUidAttr" TEXT DEFAULT 'sAMAccountName',
    "ldapBindDn" TEXT,
    "ldapBindPassword" TEXT,
    "ldapEncryption" TEXT DEFAULT 'plain',
    "ldapActiveDirectory" BOOLEAN DEFAULT true,
    "ldapBaseDn" TEXT,
    "allowUsernameOrEmailLogin" BOOLEAN DEFAULT true,
    "blockAutoCreatedUsers" BOOLEAN DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
