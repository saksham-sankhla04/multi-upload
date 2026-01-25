// LinkedIn OAuth Token Generator
// Run: node linkedin-auth.js

import 'dotenv/config';
import http from 'http';

const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3333/callback';
const SCOPES = 'openid profile w_member_social';

const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}`;

console.log('\n=== LINKEDIN OAUTH ===\n');
console.log('Server started. Open this URL in browser:\n');
console.log(authUrl);
console.log('\nWaiting for callback...\n');

const server = http.createServer(async (req, res) => {
  if (!req.url.startsWith('/callback')) return;

  const url = new URL(req.url, 'http://localhost:3333');
  const code = url.searchParams.get('code');

  if (!code) {
    res.end('No code received');
    return;
  }

  console.log('Got code, exchanging for token...');

  try {
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
      }),
    });

    const data = await tokenRes.json();

    if (data.access_token) {
      console.log('\n=== SUCCESS ===\n');
      console.log('ACCESS TOKEN:\n');
      console.log(data.access_token);
      console.log('\n\nAdd this to your .env file as LINKEDIN_ACCESS_TOKEN\n');
      res.end('Success! Check your terminal for the token.');
    } else {
      console.log('Error:', data);
      res.end('Error: ' + JSON.stringify(data));
    }
  } catch (err) {
    console.log('Error:', err.message);
    res.end('Error: ' + err.message);
  }

  server.close();
});

server.listen(3333, () => {
  console.log('Server listening on port 3333...');
});
