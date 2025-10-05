// test-ldap.js
const ldap = require('ldapjs');

const client = ldap.createClient({
  url: 'ldap://ldap.forumsys.com:389'
});

const adminDN = 'cn=read-only-admin,dc=example,dc=com';
const adminPassword = 'password';

const searchBase = 'dc=example,dc=com';
const searchFilter = '(uid=gauss)';
const userPassword = 'password';

client.bind(adminDN, adminPassword, (err) => {
  if (err) {
    console.error('Admin bind failed:', err.message);
    return client.unbind();
  }

  console.log('Admin bind successful');

  client.search(searchBase, { filter: searchFilter, scope: 'sub' }, (err, res) => {
    if (err) {
      console.error('Search failed:', err.message);
      return client.unbind();
    }

    let userDN = null;

    res.on('searchEntry', (entry) => {
      const data = entry.pojo || entry.object || {};
      console.log(JSON.stringify(data, null, 2));
      console.log('User entry found:', data);
      userDN = entry.dn?.toString(); // safest way to extract DN
    });

    res.on('error', (err) => {
      console.error('Search error:', err.message);
      client.unbind();
    });

    res.on('end', () => {
      if (!userDN || typeof userDN !== 'string') {
        console.error('User DN not found or invalid');
        return client.unbind();
      }

      client.bind(userDN, userPassword, (err) => {
        if (err) {
          console.error('User bind failed:', err.message);
        } else {
          console.log('LDAP login successful for:', userDN);
        }
        client.unbind();
      });
    });
  });
});
