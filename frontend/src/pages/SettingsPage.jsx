import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const API = 'http://localhost:3001';

export default function SettingsPage() {
  const [accounts, setAccounts] = useState([]);
  const [bsHandle, setBsHandle] = useState('');
  const [bsPassword, setBsPassword] = useState('');
  const [bsLoading, setBsLoading] = useState(false);
  const [bsError, setBsError] = useState('');
  const [searchParams] = useSearchParams();

  const loadAccounts = () => {
    fetch(`${API}/settings/accounts`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setAccounts(data.accounts));
  };

  useEffect(() => { loadAccounts(); }, []);

  const linkedinAccount = accounts.find((a) => a.platform === 'linkedin');
  const blueskyAccount = accounts.find((a) => a.platform === 'bluesky');
  const linkedinJustConnected = searchParams.get('linkedin') === 'connected';

  const connectLinkedIn = async () => {
    const res = await fetch(`${API}/settings/linkedin/connect`, { credentials: 'include' });
    const { url } = await res.json();
    window.location.href = url;
  };

  const connectBluesky = async (e) => {
    e.preventDefault();
    setBsError('');
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
        loadAccounts();
      } else {
        setBsError(data.error);
      }
    } catch {
      setBsError('Connection failed');
    } finally {
      setBsLoading(false);
    }
  };

  const disconnect = async (platform) => {
    await fetch(`${API}/settings/accounts/${platform}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    loadAccounts();
  };

  return (
    <div>
      <h1>Settings</h1>
      <h2>Connected Accounts</h2>

      {linkedinJustConnected && (
        <div className="result success">LinkedIn connected successfully!</div>
      )}

      <div className="account-card">
        <h3>LinkedIn</h3>
        {linkedinAccount ? (
          <div className="account-connected">
            <span>Connected (ID: {linkedinAccount.platform_user_id})</span>
            <button className="disconnect-btn" onClick={() => disconnect('linkedin')}>Disconnect</button>
          </div>
        ) : (
          <button onClick={connectLinkedIn}>Connect LinkedIn</button>
        )}
      </div>

      <div className="account-card">
        <h3>Bluesky</h3>
        {blueskyAccount ? (
          <div className="account-connected">
            <span>Connected as {blueskyAccount.handle}</span>
            <button className="disconnect-btn" onClick={() => disconnect('bluesky')}>Disconnect</button>
          </div>
        ) : (
          <form onSubmit={connectBluesky} className="connect-form">
            <input
              type="text"
              placeholder="Handle (e.g., name.bsky.social)"
              value={bsHandle}
              onChange={(e) => setBsHandle(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="App Password"
              value={bsPassword}
              onChange={(e) => setBsPassword(e.target.value)}
              required
            />
            <button type="submit" disabled={bsLoading}>
              {bsLoading ? 'Connecting...' : 'Connect Bluesky'}
            </button>
            {bsError && <div className="result error">{bsError}</div>}
            <p className="media-hint">
              Get an App Password from Bluesky: Settings &gt; App Passwords &gt; Add
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
