import React, { useState } from 'react';

interface LoginProps {
  onLogin: (credentials: { username: string; password: string }) => Promise<boolean>;
  loading: boolean;
  error: string;
}

const Login: React.FC<LoginProps> = ({ onLogin, loading, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login form submitted with:', { username, password });
    const result = await onLogin({ username, password });
    console.log('Login result:', result);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1 className="login-title">Image Labeling System Login</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
};

export default Login;

