import React, { useState } from 'react';
import { login } from '../api/auth';

const USER_STORAGE_KEY = 'user';

interface LoginProps {
  onSuccess: () => void;
}

export function Login({ onSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login(username.trim(), password);
      if (res.access_token) {
        localStorage.setItem('access_token', res.access_token);
        if (res.user) {
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.user));
        }
        localStorage.setItem('p2p_asset_auth', '1');
        onSuccess();
      } else {
        setError('Login failed');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
          P2P Asset Management
        </h1>
        <p className="text-gray-600 text-sm mb-6 text-center">Sign in with your TLOG credentials</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username (Employee Code)
            </label>
            <input
              id="username"
              type="text"
              inputMode="text"
              value={username}
              onChange={(e) => {
                const v = e.target.value.replace(/[^a-zA-Z0-9_-]/g, '');
                setUsername(v);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Employee code (e.g. 3456R)"
              required
              autoComplete="username"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter password"
              required
              autoComplete="current-password"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
