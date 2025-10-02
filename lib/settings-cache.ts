type GlobalCache = {
  __settingsCache?: {
    // Global settings
    openaiBaseUrl?: string;
    openaiApiKey?: string;
    modelName?: string;
    gitlabUrl?: string;
    userTokenById: Map<string, string>;
    ldap?: {
      host?: string;
      port?: number;
      uidAttr?: string;
      bindDn?: string;
      bindPassword?: string;
      encryption?: string;
      activeDirectory?: boolean;
      baseDn?: string;
      allowUsernameOrEmailLogin?: boolean;
      blockAutoCreatedUsers?: boolean;
    };
  };
};

const g = globalThis as unknown as GlobalCache;
if (!g.__settingsCache) {
  g.__settingsCache = { userTokenById: new Map() };
}

export function getGitlabUrlFromCache(): string | undefined {
  return g.__settingsCache!.gitlabUrl;
}

export function setGitlabUrlInCache(url: string | undefined) {
  g.__settingsCache!.gitlabUrl = url;
}

export function getUserGitlabTokenFromCache(userId: string): string | undefined {
  return g.__settingsCache!.userTokenById.get(userId);
}

export function setUserGitlabTokenInCache(userId: string, token: string | undefined) {
  if (token === undefined) return;
  if (token === '') {
    g.__settingsCache!.userTokenById.delete(userId);
  } else {
    g.__settingsCache!.userTokenById.set(userId, token);
  }
}

export function getLdapFromCache() {
  return g.__settingsCache!.ldap;
}

export function setLdapInCache(ldap: Partial<NonNullable<GlobalCache['__settingsCache']>['ldap']>) {
  g.__settingsCache!.ldap = { ...(g.__settingsCache!.ldap || {}), ...ldap };
}

// Global settings cache functions
export function getOpenaiBaseUrlFromCache(): string | undefined {
  return g.__settingsCache!.openaiBaseUrl;
}

export function setOpenaiBaseUrlInCache(url: string | undefined) {
  g.__settingsCache!.openaiBaseUrl = url;
}

export function getOpenaiApiKeyFromCache(): string | undefined {
  return g.__settingsCache!.openaiApiKey;
}

export function setOpenaiApiKeyInCache(key: string | undefined) {
  g.__settingsCache!.openaiApiKey = key;
}

export function getModelNameFromCache(): string | undefined {
  return g.__settingsCache!.modelName;
}

export function setModelNameInCache(name: string | undefined) {
  g.__settingsCache!.modelName = name;
}


