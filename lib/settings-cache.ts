type GlobalCache = {
  __settingsCache?: {
    gitlabUrl?: string;
    userTokenById: Map<string, string>;
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


