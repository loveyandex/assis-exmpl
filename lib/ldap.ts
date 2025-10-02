import { getLdapFromCache } from '@/lib/settings-cache';
import { prisma } from '@/lib/db';

// Dynamic import to avoid bundling when unused
async function getLdapClient() {
  const ldap = await import('ldapjs');
  return ldap;
}

export async function authenticateLdap(userlogon: string, password: string): Promise<{ ok: boolean; error?: string }>{
  const cfg = getLdapFromCache();
  const sys = await prisma.systemSettings.findFirst();
  const host = cfg?.host ?? sys?.ldapHost;
  const port = cfg?.port ?? sys?.ldapPort ?? 389;
  const base = cfg?.baseDn ?? sys?.ldapBaseDn;
  const uid = cfg?.uidAttr ?? sys?.ldapUidAttr ?? 'sAMAccountName';
  console.log('uid', uid);
  const bindDn = cfg?.bindDn ?? sys?.ldapBindDn;
  const bindPassword = cfg?.bindPassword ?? sys?.ldapBindPassword;
  if (!host || !base || !bindDn || !bindPassword) return { ok: false, error: 'LDAP is not configured' };

  const { createClient } = await getLdapClient();
  const client = createClient({ url: `ldap://${host}:${port}` });

  const bindAsync = () => new Promise<void>((resolve, reject) => {
    client.bind(bindDn, bindPassword, (err: any) => err ? reject(err) : resolve());
  });

  const searchAsync = () => new Promise<string | null>((resolve, reject) => {
    const opts = { filter: `(${uid}=${userlogon})`, scope: 'sub' as const };
    client.search(base!, opts, (err: any, res: any) => {
      if (err) return reject(err);
      let dn: string | null = null;
      res.on('searchEntry', (entry: any) => { 
        // Safest way to extract DN as string
        dn = entry.dn?.toString() || entry.objectName?.toString() || null; 
      });
      res.on('error', (e: any) => reject(e));
      res.on('end', () => resolve(dn));
    });
  });

  const userBindAsync = (dn: string) => new Promise<void>((resolve, reject) => {
    client.bind(dn, password, (err: any) => err ? reject(err) : resolve());
  });

  try {
    await bindAsync();
    const userDn = await searchAsync();
    if (!userDn) return { ok: false, error: 'User not found in LDAP' };
    await userBindAsync(userDn);
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'LDAP error' };
  } finally {
    try { (client as any)?.unbind?.(); } catch {}
  }
}


