import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import PostPage from './pages/PostPage';
import SettingsPage from './pages/SettingsPage';

const API = 'http://localhost:3001';

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch(`${API}/auth/me`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => { setUser(data.user); setChecking(false); })
      .catch(() => setChecking(false));
  }, []);

  const handleLogout = async () => {
    await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' });
    setUser(null);
  };

  if (checking) return <div className="loading">Loading...</div>;
  if (!user) return <LoginPage onLogin={setUser} />;

  return (
    <div>
      <nav className="nav-bar">
        <Link to="/" className="nav-link">Post</Link>
        <Link to="/settings" className="nav-link">Settings</Link>
        <span className="nav-right">
          {user.email}
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </span>
      </nav>
      <Routes>
        <Route path="/" element={<PostPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}
