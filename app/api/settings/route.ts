import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyJwt } from '@/lib/auth';
import { getGitlabUrlFromCache, setGitlabUrlInCache } from '@/lib/settings-cache';

async function getSessionUser(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  const payload = verifyJwt(token);
  if (!payload) return null;
  const user = await prisma.user.findUnique({ where: { id: payload.uid } });
  return user;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    let settings = user
      ? await prisma.userSettings.findFirst({ where: { userId: user.id } })
      : await prisma.userSettings.findFirst();
    
    if (!settings) {
      // Create default settings if none exist
      settings = await prisma.userSettings.create({
        data: {
          openaiBaseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
          openaiApiKey: process.env.OPENAI_API_KEY || '',
          modelName: process.env.MODEL_NAME || 'gpt-oss-120b',
          gitlabUrl: process.env.GITLAB_URL || 'https://git.lab/api/v4',
          gitlabToken: process.env.GITLAB_TOKEN || '',
          userId: user ? user.id : null,
        },
      });
    }

    return NextResponse.json({
      openaiBaseUrl: settings.openaiBaseUrl,
      openaiApiKey: settings.openaiApiKey,
      modelName: settings.modelName,
      gitlabUrl: settings.gitlabUrl || getGitlabUrlFromCache() || process.env.GITLAB_URL || 'https://git.lab/api/v4',
      gitlabToken: settings.gitlabToken,
    });
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { openaiBaseUrl, openaiApiKey, modelName, gitlabUrl, gitlabToken } = await request.json();
    const user = await getSessionUser(request);
    let settings = user
      ? await prisma.userSettings.findFirst({ where: { userId: user.id } })
      : await prisma.userSettings.findFirst();
    
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          openaiBaseUrl: openaiBaseUrl || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
          openaiApiKey: openaiApiKey || process.env.OPENAI_API_KEY || '',
          modelName: modelName || process.env.MODEL_NAME || 'gpt-oss-120b',
          gitlabUrl: gitlabUrl || process.env.GITLAB_URL || 'https://git.lab/api/v4',
          gitlabToken: gitlabToken || process.env.GITLAB_TOKEN || '',
          userId: user ? user.id : null,
        },
      });
    } else {
      settings = await prisma.userSettings.update({
        where: { id: settings.id },
        data: {
          openaiBaseUrl: openaiBaseUrl || settings.openaiBaseUrl,
          openaiApiKey: openaiApiKey || settings.openaiApiKey,
          modelName: modelName || settings.modelName,
          gitlabUrl: gitlabUrl || settings.gitlabUrl,
          gitlabToken: gitlabToken || settings.gitlabToken,
        },
      });
    }

    // If an admin updates GitLab URL, apply to all users and cache it in-memory for quick reads
    if (user && user.role === 'ADMIN' && gitlabUrl) {
      await prisma.userSettings.updateMany({ data: { gitlabUrl } });
      setGitlabUrlInCache(gitlabUrl);
    }

    return NextResponse.json({
      openaiBaseUrl: settings.openaiBaseUrl,
      openaiApiKey: settings.openaiApiKey,
      modelName: settings.modelName,
      gitlabUrl: settings.gitlabUrl,
      gitlabToken: settings.gitlabToken,
    });
  } catch (error) {
    console.error('Failed to save settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}