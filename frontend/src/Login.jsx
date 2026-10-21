import { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldAlert, ShieldCheck, Loader2, X } from 'lucide-react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [biometricUrl, setBiometricUrl] = useState('');
  const [inquiry, setInquiry] = useState('');
  const [waiting, setWaiting] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true); setError(''); setBiometricUrl(''); setWaiting(false);
    try {
      const res = await axios.post('http://127.0.0.1:8080/login', { email, password });
      if (res.data.status === 'success') onLogin();
      else if (res.data.status === 'biometrics_required') { setBiometricUrl(res.data.url); setInquiry(res.data.inquiry); }
      else setError(res.data.message || 'Login failed');
    } catch (err) { setError('Cannot connect to backend.'); }
    setLoading(false);
  };

  useEffect(() => {
    if (!waiting || !inquiry) return;
    let stopped = false;
    const timer = setInterval(async () => {
      try {
        const res = await axios.post('http://127.0.0.1:8080/verify-biometrics', { inquiry });
        if (!stopped && res.data.status === 'success') { stopped = true; clearInterval(timer); onLogin(); }
      } catch (err) {}
    }, 2500);
    return () => { stopped = true; clearInterval(timer); };
  }, [waiting, inquiry, onLogin]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-surface rounded-lg border border-gray-700 flex items-center justify-center"><span className="text-primary font-bold text-xl">α</span></div>
        <h1 className="text-2xl font-bold tracking-wide">Alpha Engine</h1>
      </div>
      <div className="bg-surface p-8 rounded-xl border border-gray-800 w-full max-w-md shadow-2xl">
        <h2 className="text-2xl font-bold text-center mb-1">Sign in to BRAIN</h2>
        {error && <div className="bg-red-900/30 border border-red-900/50 text-red-200 p-3 rounded-lg mb-4 text-sm mt-4">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-4 mt-6">
          <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-[#1a1f2b] border border-gray-700 rounded-lg p-2.5 text-white" /></div>
          <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-[#1a1f2b] border border-gray-700 rounded-lg p-2.5 text-white" /></div>
          {biometricUrl && (
            <div className="bg-[#1a1f2b] border border-yellow-900/50 p-4 rounded-lg mt-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="text-yellow-500 mt-0.5 shrink-0" size={20} />
                <div className="w-full">
                  <h3 className="text-yellow-500 font-medium text-sm mb-1">Verification Required</h3>
                  {!waiting ? (
                    <a href={biometricUrl} target="_blank" rel="noreferrer" onClick={() => setWaiting(true)} className="bg-primary/20 text-primary border border-primary/30 py-1.5 px-4 rounded-md text-sm font-medium hover:bg-primary/30 transition-colors inline-flex justify-center items-center gap-2 mt-2">
                      <ShieldCheck size={16} /> Verify in Browser
                    </a>
                  ) : (
                    <div className="flex flex-col gap-2 mt-2">
                      <span className="flex items-center gap-2 text-sm text-yellow-500"><Loader2 size={16} className="animate-spin" /> Waiting for BRAIN...</span>
                      <button type="button" onClick={() => setWaiting(false)} className="text-xs text-red-400 flex items-center gap-1"><X size={12} /> Cancel</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <button type="submit" disabled={loading} className="w-full py-2.5 rounded-lg font-medium bg-primary text-white hover:bg-blue-600 mt-2">{loading ? 'Processing...' : (biometricUrl ? 'Get New Link' : 'Sign in')}</button>
        </form>
      </div>
    </div>
  );
}
