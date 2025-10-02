import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyJwt } from '@/lib/auth';
import { 
  getLdapFromCache, 
  setLdapInCache,
  setOpenaiBaseUrlInCache,
  setOpenaiApiKeyInCache,
  setModelNameInCache,
  setGitlabUrlInCache
} from '@/lib/settings-cache';

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  const payload = verifyJwt(token);
  if (!payload) return null;
  const user = await prisma.user.findUnique({ where: { id: payload.uid } });
  if (!user || user.role !== 'ADMIN') return null;
  return user;
}

export async function GET() {
  const sys = await prisma.systemSettings.findFirst();
  const ldap = getLdapFromCache();
  return NextResponse.json({
    // Global settings
    openaiBaseUrl: sys?.openaiBaseUrl ?? process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
    openaiApiKey: sys?.openaiApiKey ?? process.env.OPENAI_API_KEY ?? '',
    modelName: sys?.modelName ?? process.env.MODEL_NAME ?? 'gpt-oss-120b',
    gitlabUrl: sys?.gitlabUrl ?? process.env.GITLAB_URL ?? 'https://git.lab/api/v4',
    // LDAP settings
    ldap: {
      host: ldap?.host ?? sys?.ldapHost ?? '',
      port: ldap?.port ?? sys?.ldapPort ?? 389,
      uidAttr: ldap?.uidAttr ?? sys?.ldapUidAttr ?? 'sAMAccountName',
      bindDn: ldap?.bindDn ?? sys?.ldapBindDn ?? '',
      encryption: ldap?.encryption ?? sys?.ldapEncryption ?? 'plain',
      baseDn: ldap?.baseDn ?? sys?.ldapBaseDn ?? '',
    },
  });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  
  const { openaiBaseUrl, openaiApiKey, modelName, gitlabUrl, ldap } = await req.json();

  const sys = await prisma.systemSettings.findFirst();
  const data = {
    // Global settings
    openaiBaseUrl: openaiBaseUrl ?? undefined,
    openaiApiKey: openaiApiKey ?? undefined,
    modelName: modelName ?? undefined,
    gitlabUrl: gitlabUrl ?? undefined,
    // LDAP settings
    ldapHost: ldap?.host ?? undefined,
    ldapPort: typeof ldap?.port === 'number' ? ldap.port : undefined,
    ldapUidAttr: ldap?.uidAttr ?? undefined,
    ldapBindDn: ldap?.bindDn ?? undefined,
    ldapBindPassword: ldap?.bindPassword ?? undefined,
    ldapEncryption: ldap?.encryption ?? undefined,
    ldapBaseDn: ldap?.baseDn ?? undefined,
  } as any;

  if (!sys) {
    await prisma.systemSettings.create({ data });
  } else {
    await prisma.systemSettings.update({ where: { id: sys.id }, data });
  }
  
  // Update caches
  if (ldap) setLdapInCache(ldap);
  if (openaiBaseUrl !== undefined) setOpenaiBaseUrlInCache(openaiBaseUrl);
  if (openaiApiKey !== undefined) setOpenaiApiKeyInCache(openaiApiKey);
  if (modelName !== undefined) setModelNameInCache(modelName);
  if (gitlabUrl !== undefined) setGitlabUrlInCache(gitlabUrl);
  
  return NextResponse.json({ success: true });
}


