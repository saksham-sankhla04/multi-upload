// LinkedIn Token Management Service
// Handles token refresh and validation

import db from '../db.js';

const TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // Refresh 5 minutes before expiry

/**
 * Check if a token is expired or about to expire
 */
export function isTokenExpired(expiresAt) {
  if (!expiresAt) return true;
  const expiryTime = new Date(expiresAt).getTime();
  return Date.now() >= expiryTime - TOKEN_REFRESH_BUFFER;
}

/**
 * Refresh LinkedIn access token using refresh token
 */
export async function refreshLinkedInToken(refreshToken) {
  const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: process.env.LINKEDIN_CLIENT_ID,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Token refresh failed: ${error.error_description || error.error || 'Unknown error'}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken, // LinkedIn may or may not return new refresh token
    expiresAt: new Date(Date.now() + (data.expires_in * 1000)).toISOString(),
  };
}

/**
 * Update tokens in database
 */
export function updateStoredTokens(userId, accessToken, refreshToken, expiresAt) {
  db.prepare(`
    UPDATE connected_accounts
    SET access_token = ?, refresh_token = ?, token_expires_at = ?
    WHERE user_id = ? AND platform = 'linkedin'
  `).run(accessToken, refreshToken, expiresAt, userId);
}

/**
 * Get valid LinkedIn access token for a user
 * Automatically refreshes if expired
 */
export async function getValidLinkedInToken(userId) {
  const account = db.prepare(`
    SELECT access_token, refresh_token, token_expires_at
    FROM connected_accounts
    WHERE user_id = ? AND platform = 'linkedin'
  `).get(userId);

  if (!account) {
    throw new Error('LinkedIn account not connected');
  }

  // Check if token is still valid
  if (!isTokenExpired(account.token_expires_at)) {
    return {
      accessToken: account.access_token,
      refreshed: false,
    };
  }

  // Token is expired, try to refresh
  if (!account.refresh_token) {
    throw new Error('LinkedIn token expired and no refresh token available. Please reconnect your LinkedIn account.');
  }

  try {
    const newTokens = await refreshLinkedInToken(account.refresh_token);

    // Update database with new tokens
    updateStoredTokens(userId, newTokens.accessToken, newTokens.refreshToken, newTokens.expiresAt);

    return {
      accessToken: newTokens.accessToken,
      refreshed: true,
    };
  } catch (error) {
    // If refresh fails, mark as needing reconnection
    throw new Error(`LinkedIn token refresh failed: ${error.message}. Please reconnect your LinkedIn account.`);
  }
}

/**
 * Check token status for a user (for UI display)
 */
export function getLinkedInTokenStatus(userId) {
  const account = db.prepare(`
    SELECT token_expires_at, refresh_token
    FROM connected_accounts
    WHERE user_id = ? AND platform = 'linkedin'
  `).get(userId);

  if (!account) {
    return { connected: false };
  }

  const expiresAt = account.token_expires_at ? new Date(account.token_expires_at) : null;
  const isExpired = isTokenExpired(account.token_expires_at);
  const hasRefreshToken = !!account.refresh_token;

  return {
    connected: true,
    expiresAt,
    isExpired,
    canRefresh: hasRefreshToken,
    needsReconnect: isExpired && !hasRefreshToken,
  };
}
