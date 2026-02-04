import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { ButtonSpinner } from '../components/Spinner';

const API = 'http://localhost:3001';

export default function SettingsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bsHandle, setBsHandle] = useState('');
  const [bsPassword, setBsPassword] = useState('');
  const [bsLoading, setBsLoading] = useState(false);
  const [linkedinLoading, setLinkedinLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState(null);
  const [linkedinStatus, setLinkedinStatus] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const loadAccounts = async () => {
    try {
      const [accountsRes, linkedinStatusRes] = await Promise.all([
        fetch(`${API}/settings/accounts`, { credentials: 'include' }),
        fetch(`${API}/settings/linkedin/status`, { credentials: 'include' }),
      ]);
      const accountsData = await accountsRes.json();
      const statusData = await linkedinStatusRes.json();
      setAccounts(accountsData.accounts);
      setLinkedinStatus(statusData);
    } catch {
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();

    // Handle OAuth callback
    if (searchParams.get('linkedin') === 'connected') {
      toast.success('LinkedIn connected successfully!');
      setSearchParams({});
    }
  }, []);

  const linkedinAccount = accounts.find((a) => a.platform === 'linkedin');
  const blueskyAccount = accounts.find((a) => a.platform === 'bluesky');

  const connectLinkedIn = async () => {
    setLinkedinLoading(true);
    try {
      const res = await fetch(`${API}/settings/linkedin/connect`, { credentials: 'include' });
      const { url } = await res.json();
      window.location.href = url;
    } catch {
      toast.error('Failed to start LinkedIn connection');
      setLinkedinLoading(false);
    }
  };

  const connectBluesky = async (e) => {
    e.preventDefault();
    setBsLoading(true);
    try {
      const res = await fetch(`${API}/settings/bluesky/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ handle: bsHandle, appPassword: bsPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setBsHandle('');
        setBsPassword('');
        toast.success('Bluesky connected successfully!');
        loadAccounts();
      } else {
        toast.error(data.error || 'Failed to connect Bluesky');
      }
    } catch {
      toast.error('Connection failed');
    } finally {
      setBsLoading(false);
    }
  };

  const disconnect = async (platform) => {
    setDisconnecting(platform);
    try {
      await fetch(`${API}/settings/accounts/${platform}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      toast.success(`${platform.charAt(0).toUpperCase() + platform.slice(1)} disconnected`);
      loadAccounts();
    } catch {
      toast.error('Failed to disconnect');
    } finally {
      setDisconnecting(null);
    }
  };

  if (loading) {
    return (
      <div>
        <h1>Settings</h1>
        <h2>Connected Accounts</h2>
        <div className="account-card">
          <div className="skeleton" style={{ height: 24, width: 100, marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 40 }} />
        </div>
        <div className="account-card">
          <div className="skeleton" style={{ height: 24, width: 80, marginBottom: 12 }} />
          <div className="skeleton" style={{ height: 40 }} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1>Settings</h1>
      <h2>Connected Accounts</h2>

      <div className="account-card">
        <h3>
          LinkedIn
          {linkedinAccount && !linkedinStatus?.needsReconnect && (
            <span className="status-badge connected">Connected</span>
          )}
          {linkedinStatus?.needsReconnect && (
            <span className="status-badge" style={{ background: '#fef3c7', color: '#92400e' }}>
              Needs Reconnect
            </span>
          )}
        </h3>
        {linkedinAccount ? (
          <div className="account-connected">
            <div style={{ flex: 1 }}>
              <span>Connected as {linkedinAccount.platform_user_id}</span>
              {linkedinStatus?.expiresAt && !linkedinStatus?.needsReconnect && (
                <p className="help-text" style={{ marginTop: 4 }}>
                  Token expires: {new Date(linkedinStatus.expiresAt).toLocaleDateString()}
                  {linkedinStatus.canRefresh && ' (auto-refreshes)'}
                </p>
              )}
              {linkedinStatus?.needsReconnect && (
                <p className="help-text" style={{ marginTop: 4, color: '#92400e' }}>
                  Your token has expired. Please reconnect to continue posting.
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {linkedinStatus?.needsReconnect && (
                <button onClick={connectLinkedIn} disabled={linkedinLoading}>
                  {linkedinLoading ? <><ButtonSpinner /> Reconnecting...</> : 'Reconnect'}
                </button>
              )}
              <button
                className="disconnect-btn"
                onClick={() => disconnect('linkedin')}
                disabled={disconnecting === 'linkedin'}
              >
                {disconnecting === 'linkedin' ? (
                  <>
                    <ButtonSpinner /> Disconnecting...
                  </>
                ) : (
                  'Disconnect'
                )}
              </button>
            </div>
          </div>
        ) : (
          <button onClick={connectLinkedIn} disabled={linkedinLoading}>
            {linkedinLoading ? (
              <>
                <ButtonSpinner /> Connecting...
              </>
            ) : (
              'Connect LinkedIn'
            )}
          </button>
        )}
      </div>

      <div className="account-card">
        <h3>
          Bluesky
          {blueskyAccount && <span className="status-badge connected">Connected</span>}
        </h3>
        {blueskyAccount ? (
          <div className="account-connected">
            <span>Connected as @{blueskyAccount.handle}</span>
            <button
              className="disconnect-btn"
              onClick={() => disconnect('bluesky')}
              disabled={disconnecting === 'bluesky'}
            >
              {disconnecting === 'bluesky' ? (
                <>
                  <ButtonSpinner /> Disconnecting...
                </>
              ) : (
                'Disconnect'
              )}
            </button>
          </div>
        ) : (
          <form onSubmit={connectBluesky} className="connect-form">
            <input
              type="text"
              placeholder="Handle (e.g., yourname.bsky.social)"
              value={bsHandle}
              onChange={(e) => setBsHandle(e.target.value)}
              disabled={bsLoading}
              required
            />
            <input
              type="password"
              placeholder="App Password"
              value={bsPassword}
              onChange={(e) => setBsPassword(e.target.value)}
              disabled={bsLoading}
              required
            />
            <button type="submit" disabled={bsLoading}>
              {bsLoading ? (
                <>
                  <ButtonSpinner /> Connecting...
                </>
              ) : (
                'Connect Bluesky'
              )}
            </button>
            <p className="help-text">
              Get an App Password from Bluesky: Settings &rarr; Privacy and Security &rarr; App Passwords &rarr; Add App Password
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
