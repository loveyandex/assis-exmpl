import { prisma } from '@/lib/db';
import { verifyJwt } from '@/lib/auth';

interface GitLabUser {
  id: number;
  username: string;
  name: string;
  email: string;
}

interface ImpersonationTokenResponse {
  id: number;
  name: string;
  revoked: boolean;
  created_at: string;
  description: string | null;
  scopes: string[];
  user_id: number;
  last_used_at: string | null;
  active: boolean;
  expires_at: string;
  token: string;
  impersonation: boolean;
}

/**
 * Get admin user's GitLab token from database
 */
async function getAdminGitLabToken(): Promise<string> {
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    include: { settings: true }
  });

  if (!adminUser?.settings?.gitlabToken) {
    throw new Error('Admin GitLab token is not configured. Please set it in admin settings.');
  }

  return adminUser.settings.gitlabToken;
}

/**
 * Get GitLab user ID by username using admin token
 */
async function getGitLabUserIdByUsername(username: string): Promise<number> {
  const adminToken = await getAdminGitLabToken();
  
  // Get system settings for GitLab URL
  const sysSettings = await prisma.systemSettings.findFirst();
  const gitlabUrl = sysSettings?.gitlabUrl || process.env.GITLAB_URL || 'https://git.lab/api/v4';

  const response = await fetch(`${gitlabUrl}/users?username=${encodeURIComponent(username)}`, {
    headers: {
      'PRIVATE-TOKEN': adminToken,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch GitLab user: HTTP ${response.status}`);
  }

  const users: GitLabUser[] = await response.json();
  
  if (!users.length) {
    throw new Error(`GitLab user '${username}' not found`);
  }

  return users[0].id;
}

/**
 * Create impersonation token for a GitLab user
 */
async function createImpersonationToken(gitlabUserId: number, tokenName: string): Promise<string> {
  const adminToken = await getAdminGitLabToken();
  
  // Get system settings for GitLab URL
  const sysSettings = await prisma.systemSettings.findFirst();
  const gitlabUrl = sysSettings?.gitlabUrl || process.env.GITLAB_URL || 'https://git.lab/api/v4';

  // Create expiry date 300 days from now
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 300);

  const requestBody = {
    name: tokenName,
    scopes: ['api'],
    expires_at: expiresAt.toISOString().split('T')[0], // YYYY-MM-DD format
  };

  const response = await fetch(`${gitlabUrl}/users/${gitlabUserId}/impersonation_tokens`, {
    method: 'POST',
    headers: {
      'PRIVATE-TOKEN': adminToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Failed to create impersonation token: HTTP ${response.status} - ${errorText}`);
  }

  const tokenData: ImpersonationTokenResponse = await response.json();
  return tokenData.token;
}

/**
 * Auto-generate GitLab token for a user if they don't have one
 */
export async function autoGenerateGitLabToken(currentUserId: string, currentUsername: string): Promise<string> {
  try {
    // Get current user's GitLab token
    const userSettings = await prisma.userSettings.findFirst({ 
      where: { userId: currentUserId } 
    });

    // If user already has a token, return it
    if (userSettings?.gitlabToken) {
      return userSettings.gitlabToken;
    }

    console.log(`Generating GitLab token for user: ${currentUsername}`);
    
    // Get GitLab user ID by username
    const gitlabUserId = await getGitLabUserIdByUsername(currentUsername);
    
    // Create impersonation token
    const tokenName = `nemo-auto-${currentUsername}-${Date.now()}`;
    const impersonationToken = await createImpersonationToken(gitlabUserId, tokenName);
    
    // Save token to user settings
    await prisma.userSettings.upsert({
      where: { userId: currentUserId },
      update: { gitlabToken: impersonationToken },
      create: { 
        userId: currentUserId,
        gitlabToken: impersonationToken 
      },
    });

    console.log(`Successfully generated and saved GitLab token for user: ${currentUsername}`);
    return impersonationToken;

  } catch (error) {
    console.error('Failed to auto-generate GitLab token:', error);
    throw new Error(`Auto-token generation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get GitLab token for current user, trying auto-generation if needed
 */
export async function getGitLabTokenForUser(currentUserId: string, currentUsername: string): Promise<string> {
  try {
    // Get system settings for GitLab URL
    const sysSettings = await prisma.systemSettings.findFirst();
    const gitlabUrl = sysSettings?.gitlabUrl || process.env.GITLAB_URL || 'https://git.lab/api/v4';
    
    // Get user settings for GitLab token
    const userSettings = await prisma.userSettings.findFirst({ 
      where: { userId: currentUserId } 
    });
    
    let gitlabToken = userSettings?.gitlabToken || process.env.GITLAB_TOKEN;
    
    // If no token found, try to auto-generate one
    // I am commenting this out for now to surprise stackholders in next version //dont forget to remove this comment in next version when i say to uncomment it
    // if (!gitlabToken) {
    //   console.log(`No GitLab token found for user ${currentUsername}, attempting auto-generation...`);
    //   gitlabToken = await autoGenerateGitLabToken(currentUserId, currentUsername);
    // }
    
    if (!gitlabToken) {
      throw new Error("GitLab token is not configured. Please set it in settings or contact admin.");
    }
    
    return gitlabToken;
    
  } catch (error) {
    console.error('Failed to get GitLab token for user:', error);
    throw new Error(`GitLab token error: ${error instanceof Error ? error.message : String(error)}`);
  }
}
