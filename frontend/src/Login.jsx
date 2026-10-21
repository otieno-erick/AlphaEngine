import { useState } from 'react';
import axios from 'axios';
import { ShieldAlert, Loader2, ShieldCheck, Copy, CheckCircle2 } from 'lucide-react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [biometricUrl, setBiometricUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [waitingForBiometrics, setWaitingForBiometrics] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
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

  const checkBiometrics = async () => {
    setLoading(true);
    try {
      const res = await axios.post('http://127.0.0.1:8080/verify-biometrics', {
        persona_url: biometricUrl
      });
      if (res.data.status === 'success') {
        onLogin();
      } else {
        setError(res.data.message || 'Verification failed. Please try again.');
        setWaitingForBiometrics(false);
      }
    } catch (err) {
      setError('Verification error.');
      setWaitingForBiometrics(false);
    }
    setLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(biometricUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-surface rounded-lg border border-gray-700 flex items-center justify-center">
          <span className="text-primary font-bold text-xl">α</span>
        </div>
        <h1 className="text-2xl font-bold tracking-wide">Alpha Engine</h1>
      </div>

      <div className="bg-surface p-8 rounded-xl border border-gray-800 w-full max-w-md shadow-2xl">
        <h2 className="text-2xl font-bold text-center mb-1">Sign in to BRAIN</h2>
        <p className="text-gray-400 text-center mb-8 text-sm">Use your WorldQuant BRAIN account.</p>

        {error && <div className="bg-red-900/30 border border-red-900/50 text-red-200 p-3 rounded-lg mb-4 text-sm">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full bg-[#1a1f2b] border border-gray-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-primary transition-colors"
              placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
            <div className="relative">
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full bg-[#1a1f2b] border border-gray-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-primary transition-colors pr-16"
                placeholder="Your BRAIN password" />
            </div>
          </div>

          {biometricUrl && (
            <div className="bg-[#1a1f2b] border border-yellow-900/50 p-4 rounded-lg mt-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="text-yellow-500 mt-0.5 shrink-0" size={20} />
                <div className="w-full">
                  <h3 className="text-yellow-500 font-medium text-sm mb-1">BRAIN needs to verify your identity</h3>
                  <p className="text-gray-400 text-xs mb-3">
                    Copy the link below and paste it into Chrome/Edge, OR click "Open in Browser".
                  </p>
                  
                  {/* THE COPY/PASTE LINK BOX */}
                  <div className="flex items-center gap-2 mb-3">
                    <input 
                      type="text" 
                      readOnly 
                      value={biometricUrl} 
                      className="flex-1 bg-black border border-gray-700 text-xs text-gray-400 p-2 rounded focus:outline-none"
                    />
                    <button 
                      type="button" 
                      onClick={copyToClipboard}
                      className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded transition-colors"
                      title="Copy Link"
                    >
                      {copied ? <CheckCircle2 size={16} className="text-green-400" /> : <Copy size={16} />}
                    </button>
                  </div>

                  <div className="flex flex-col gap-3">
                    <a 
                      href={biometricUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      onClick={() => setWaitingForBiometrics(true)}
                      className="bg-primary/20 text-primary border border-primary/30 py-1.5 px-4 rounded-md text-sm font-medium hover:bg-primary/30 transition-colors inline-flex justify-center items-center gap-2"
                    >
                      <ShieldCheck size={16} /> Open in Browser
                    </a>
                    
                    {waitingForBiometrics && (
                      <button 
                        type="button" 
                        onClick={checkBiometrics} 
                        className="bg-green-600 hover:bg-green-500 text-white py-2 rounded-md text-sm font-medium transition-colors w-full mt-2"
                      >
                        I have verified, continue
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <button type="submit" disabled={loading || !!biometricUrl}
            className={`w-full py-2.5 rounded-lg font-medium transition-colors mt-2 ${loading || !!biometricUrl ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-primary text-white hover:bg-blue-600'}`}>
            {loading ? 'Processing...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
