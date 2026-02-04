import { useState } from 'react';
import { ButtonSpinner } from '../components/Spinner';

const API = 'http://localhost:3001';

export default function LoginPage({ onLogin }) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isSignup ? '/auth/signup' : '/auth/login';
    try {
      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        onLogin(data.user);
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch {
      setError('Cannot connect to server');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = (e) => {
    e.preventDefault();
    setIsSignup(!isSignup);
    setError('');
  };

  return (
    <div className="login-page">
      <h1>Multi-Post</h1>
      <h2>{isSignup ? 'Create your account' : 'Welcome back'}</h2>
      <form onSubmit={handleSubmit} className="login-form">
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          autoComplete="email"
          required
        />
        <input
          type="password"
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          disabled={loading}
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          required
        />
        {error && <div className="result error">{error}</div>}
        <button type="submit" disabled={loading}>
          {loading ? (
            <>
              <ButtonSpinner /> {isSignup ? 'Creating account...' : 'Signing in...'}
            </>
          ) : (
            isSignup ? 'Sign Up' : 'Log In'
          )}
        </button>
      </form>
      <p className="toggle-auth">
        {isSignup ? 'Already have an account?' : "Don't have an account?"}
        {' '}
        <a href="#" onClick={toggleMode}>
          {isSignup ? 'Log In' : 'Sign Up'}
        </a>
      </p>
    </div>
  );
}
