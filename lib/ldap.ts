import { getLdapFromCache } from '@/lib/settings-cache';
import { prisma } from '@/lib/db';
import { Client } from 'ldapts';

export async function authenticateLdap(userlogon: string, password: string): Promise<{ ok: boolean; error?: string }>{
  const cfg = getLdapFromCache();
  const sys = await prisma.systemSettings.findFirst();
  const host = cfg?.host ?? sys?.ldapHost;
  const port = cfg?.port ?? sys?.ldapPort ?? 389;
  const base = cfg?.baseDn ?? sys?.ldapBaseDn;
  const uid = cfg?.uidAttr ?? sys?.ldapUidAttr ?? 'sAMAccountName';
  const bindDn = cfg?.bindDn ?? sys?.ldapBindDn;
  const bindPassword = cfg?.bindPassword ?? sys?.ldapBindPassword;
  console.log('ldap json ', { host, port, base, uid, bindDn, bindPassword });

  if (!host || !base || !bindDn || !bindPassword) return { ok: false, error: 'LDAP is not configured' };

  const client = new Client({ url: `ldap://${host}:${port}` });

  const searchAsync = async (): Promise<string | null> => {
    const filter = `(${uid}=${userlogon})`;
    console.log('ldapts search', { base, uid, userlogon, filter });
    const { searchEntries } = await client.search(base!, { scope: 'sub', filter, attributes: ['dn'] });
    const dn = searchEntries?.[0]?.dn ?? null;
    console.log('ldapts search result dn', dn);
    return dn;
  };

  try {
    await client.bind(bindDn!, bindPassword!);
    const userDn = await searchAsync();
    if (!userDn) return { ok: false, error: 'User not found in LDAP' };
    await client.bind(userDn, password);
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'LDAP error' };
  } finally {
    try { await client.unbind(); } catch {}
  }
}


