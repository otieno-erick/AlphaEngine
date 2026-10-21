import { useState } from 'react';
import axios from 'axios';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [biometricUrl, setBiometricUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Point directly to the Python backend for production
      const res = await axios.post('http://127.0.0.1:8080/login', { email, password });
      
      if (res.data.status === 'success') {
        onLogin();
      } else if (res.data.status === 'biometrics_required') {
        setBiometricUrl(res.data.url);
      } else {
        setError(res.data.message || 'Login failed');
      }
    } catch (err) {
      setError('Cannot connect to backend. Is the Python server running?');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-surface p-10 rounded-xl border border-gray-800 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-2">Sign in to BRAIN</h2>
        <p className="text-gray-400 text-center mb-8 text-sm">Use your WorldQuant BRAIN account.</p>

        {error && <div className="bg-red-900/50 text-red-200 p-3 rounded mb-4 text-sm">{error}</div>}

        {biometricUrl ? (
          <div className="text-center">
            <p className="mb-4 text-yellow-400">Biometrics required!</p>
            <a href={biometricUrl} target="_blank" rel="noreferrer" className="bg-primary text-white py-2 px-4 rounded hover:bg-blue-600 inline-block mb-4">
              Click here to verify
            </a>
            <button onClick={onLogin} className="w-full bg-green-600 text-white py-2 rounded mt-2">
              I have verified, continue
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full bg-background border border-gray-700 rounded p-2 text-white focus:outline-none focus:border-primary"
                placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full bg-background border border-gray-700 rounded p-2 text-white focus:outline-none focus:border-primary"
                placeholder="Your BRAIN password" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-primary text-white py-2 rounded font-medium hover:bg-blue-600 transition-colors">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
