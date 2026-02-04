import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import Spinner from './components/Spinner';
import LoginPage from './pages/LoginPage';
import PostPage from './pages/PostPage';
import SettingsPage from './pages/SettingsPage';

const API = 'http://localhost:3001';

function AppContent() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const location = useLocation();

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

  if (checking) {
    return (
      <div className="loading">
        <Spinner size={32} />
        <span>Loading...</span>
      </div>
    );
  }

  if (!user) return <LoginPage onLogin={setUser} />;

  const isActive = (path) => location.pathname === path;

  return (
    <div>
      <nav className="nav-bar">
        <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>Post</Link>
        <Link to="/settings" className={`nav-link ${isActive('/settings') ? 'active' : ''}`}>Settings</Link>
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

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
