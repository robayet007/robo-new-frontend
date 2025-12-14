import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminLogin({ onLogin }: { onLogin: (u: string, p: string) => boolean }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const ok = onLogin(username.trim(), password.trim());
    if (ok) {
      navigate('/admin');
    } else {
      setError('Username or password wrong');
    }
  };

  return (
    <div className="auth-card">
      <p className="pill">Admin</p>
      <h2>Login to manage packs</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          Username
          <input
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
          />
        </label>
        <label>
          Password
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="...."
          />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button className="btn primary" type="submit">
          Login
        </button>
      </form>
    </div>
  );
}

export default AdminLogin;

