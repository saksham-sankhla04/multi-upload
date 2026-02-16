import { Router } from 'express';
import crypto from 'crypto';
import { requireAuth } from '../middleware/auth.js';
import db from '../db.js';
import { getLinkedInTokenStatus } from '../services/linkedin-token.service.js';

const router = Router();

// Environment-based URLs
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// List connected accounts (never expose tokens)
router.get('/accounts', requireAuth, (req, res) => {
  const accounts = db.prepare(
    'SELECT id, platform, platform_user_id, handle, created_at FROM connected_accounts WHERE user_id = ?'
  ).all(req.session.userId);
  res.json({ accounts });
});

// Get LinkedIn token status
router.get('/linkedin/status', requireAuth, (req, res) => {
  const status = getLinkedInTokenStatus(req.session.userId);
  res.json(status);
});

// Start LinkedIn OAuth flow
router.get('/linkedin/connect', requireAuth, (req, res) => {
  const redirectUri = `${BACKEND_URL}/settings/linkedin/callback`;
  const scopes = 'openid profile w_member_social';

  // Generate a random state token and store it with the userId
  const state = crypto.randomUUID();
  db.prepare('DELETE FROM oauth_states WHERE user_id = ?').run(req.session.userId);
  db.prepare('INSERT INTO oauth_states (state, user_id) VALUES (?, ?)').run(state, req.session.userId);

  const url = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${state}`;
  res.json({ url });
});

// LinkedIn OAuth callback (browser redirect, not API call)
router.get('/linkedin/callback', async (req, res) => {
  const { code, state } = req.query;

  // Look up userId from the state token (doesn't rely on session cookies)
  const stateRow = state ? db.prepare('SELECT user_id FROM oauth_states WHERE state = ?').get(state) : null;
  const userId = stateRow?.user_id || req.session?.userId;

  if (!userId) {
    return res.redirect(`${FRONTEND_URL}/settings?error=not_logged_in`);
  }

  // Clean up used state token
  if (state) {
    db.prepare('DELETE FROM oauth_states WHERE state = ?').run(state);
  }

  if (!code) {
    return res.redirect(`${FRONTEND_URL}/settings?error=no_code`);
  }

  try {
    const redirectUri = `${BACKEND_URL}/settings/linkedin/callback`;

    // Exchange code for access token
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return res.redirect(`${FRONTEND_URL}/settings?error=${encodeURIComponent(tokenData.error_description || 'token_failed')}`);
    }

    // Calculate token expiration time (expires_in is in seconds)
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString();

    // Fetch user profile to get person ID
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();

    // Store in database with refresh token and expiration
    db.prepare(`
      INSERT OR REPLACE INTO connected_accounts
      (user_id, platform, access_token, refresh_token, token_expires_at, platform_user_id)
      VALUES (?, 'linkedin', ?, ?, ?, ?)
    `).run(
      userId,
      tokenData.access_token,
      tokenData.refresh_token || null,
      expiresAt,
      profile.sub
    );

    res.redirect(`${FRONTEND_URL}/settings?linkedin=connected`);
  } catch (err) {
    res.redirect(`${FRONTEND_URL}/settings?error=${encodeURIComponent(err.message)}`);
  }
});

// Connect Bluesky (validate + store)
router.post('/bluesky/connect', requireAuth, async (req, res) => {
  const { handle, appPassword } = req.body;
  if (!handle || !appPassword) {
    return res.status(400).json({ error: 'Handle and app password required' });
  }

  try {
    // Validate credentials by logging in
    const loginRes = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: handle, password: appPassword }),
    });

    if (!loginRes.ok) {
      const err = await loginRes.json();
      return res.status(400).json({ error: `Bluesky login failed: ${err.message}` });
    }

    const session = await loginRes.json();

    // Store in database
    db.prepare(`
      INSERT OR REPLACE INTO connected_accounts (user_id, platform, handle, app_password, platform_user_id)
      VALUES (?, 'bluesky', ?, ?, ?)
    `).run(req.session.userId, handle, appPassword, session.did);

    res.json({ success: true, handle, did: session.did });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Disconnect account
router.delete('/accounts/:platform', requireAuth, (req, res) => {
  const { platform } = req.params;
  if (!['linkedin', 'bluesky'].includes(platform)) {
    return res.status(400).json({ error: 'Invalid platform' });
  }
  db.prepare('DELETE FROM connected_accounts WHERE user_id = ? AND platform = ?').run(req.session.userId, platform);
  res.json({ ok: true });
});

export default router;
