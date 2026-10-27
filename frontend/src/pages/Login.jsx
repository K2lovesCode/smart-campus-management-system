import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  function fill(role) {
    setEmail(role === 'faculty' ? 'faculty@campus.edu' : 'student@campus.edu');
    setPassword('password123');
  }

  return (
    <div className="login-wrap">
      <div className="card login-card">
        <h2 style={{ color: 'var(--primary)' }}>🎓 Smart Campus Login</h2>
        <p className="muted">Sign in as a student or faculty member.</p>

        {error && <div className="alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@campus.edu"
            required
          />
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
          <button type="submit" disabled={busy} style={{ width: '100%', marginTop: 16 }}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="row" style={{ marginTop: 16 }}>
          <button className="ghost" type="button" onClick={() => fill('student')}>
            Demo student
          </button>
          <button className="ghost" type="button" onClick={() => fill('faculty')}>
            Demo faculty
          </button>
        </div>

        <p className="muted" style={{ marginTop: 14 }}>
          Students: log in with the email and password your faculty set for you
          (faculty create accounts under the “Students” tab).
        </p>
      </div>
    </div>
  );
}
