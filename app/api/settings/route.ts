import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // For now, we'll use a single settings record
    // In a real app, you'd associate this with a user
    let settings = await prisma.userSettings.findFirst();
    
    if (!settings) {
      // Create default settings if none exist
      settings = await prisma.userSettings.create({
        data: {
          openaiBaseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
          openaiApiKey: process.env.OPENAI_API_KEY || '',
          modelName: process.env.MODEL_NAME || 'gpt-4',
        },
      });
    }

    return NextResponse.json({
      openaiBaseUrl: settings.openaiBaseUrl,
      openaiApiKey: settings.openaiApiKey,
      modelName: settings.modelName,
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
    const { openaiBaseUrl, openaiApiKey, modelName } = await request.json();
    
    // For now, we'll update the first settings record
    // In a real app, you'd associate this with a user
    let settings = await prisma.userSettings.findFirst();
    
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          openaiBaseUrl: openaiBaseUrl || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
          openaiApiKey: openaiApiKey || process.env.OPENAI_API_KEY || '',
          modelName: modelName || process.env.MODEL_NAME || 'gpt-4',
        },
      });
    } else {
      settings = await prisma.userSettings.update({
        where: { id: settings.id },
        data: {
          openaiBaseUrl: openaiBaseUrl || settings.openaiBaseUrl,
          openaiApiKey: openaiApiKey || settings.openaiApiKey,
          modelName: modelName || settings.modelName,
        },
      });
    }

    return NextResponse.json({
      openaiBaseUrl: settings.openaiBaseUrl,
      openaiApiKey: settings.openaiApiKey,
      modelName: settings.modelName,
    });
  } catch (error) {
    console.error('Failed to save settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}

