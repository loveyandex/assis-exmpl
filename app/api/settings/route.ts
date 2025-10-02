import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyJwt } from '@/lib/auth';
import { setUserGitlabTokenInCache } from '@/lib/settings-cache';

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
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    let settings = await prisma.userSettings.findFirst({ where: { userId: user.id } });
    
    if (!settings) {
      // Create default settings if none exist
      settings = await prisma.userSettings.create({
        data: {
          gitlabToken: '',
          userId: user.id,
        },
      });
    }

    return NextResponse.json({
      gitlabToken: settings.gitlabToken || '',
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
    const { gitlabToken } = await request.json();
    const user = await getSessionUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    let settings = await prisma.userSettings.findFirst({ where: { userId: user.id } });
    
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          gitlabToken: gitlabToken || '',
          userId: user.id,
        },
      });
    } else {
      settings = await prisma.userSettings.update({
        where: { id: settings.id },
        data: {
          gitlabToken: gitlabToken || settings.gitlabToken,
        },
      });
    }

    // Update cache
    setUserGitlabTokenInCache(user.id, gitlabToken);

    return NextResponse.json({
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