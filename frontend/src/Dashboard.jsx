import { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Brain, Dna, Key, PlayCircle, Loader2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('simulate');
  
  // Simulation State
  const [expression, setExpression] = useState('rank(-ts_delta(close, 5))');
  const [region, setRegion] = useState('USA');
  const [universe, setUniverse] = useState('TOP3000');
  const [delay, setDelay] = useState(1);
  const [neutralization, setNeutralization] = useState('SUBINDUSTRY');
  const [tasks, setTasks] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync & Evolution State
  const [alphas, setAlphas] = useState([]);
  const [syncing, setSyncing] = useState(false);

  // LLM State
  const [provider, setProvider] = useState('groq');
  const [apiKey, setApiKey] = useState('');
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);

  // Poll Tasks
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get('http://127.0.0.1:8080/tasks');
        setTasks(res.data);
      } catch (err) {}
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulate = async () => {
    setIsSubmitting(true);
    const payload = {
      alpha_payload: {
        type: "REGULAR",
        settings: { instrumentType: "EQUITY", region, universe, delay, decay: 0, neutralization, truncation: 0.08, pasteurization: "ON", unitHandling: "VERIFY", nanHandling: "OFF", language: "FASTEXPR", visualization: false },
        regular: expression
      }
    };
    try { await axios.post('http://127.0.0.1:8080/simulate', payload); } catch (err) { alert("Error"); }
    setIsSubmitting(false);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await axios.post('http://127.0.0.1:8080/sync');
      const res = await axios.get('http://127.0.0.1:8080/alphas');
      setAlphas(res.data);
    } catch (err) { alert("Sync failed"); }
    setSyncing(false);
  };

  const handleLLMKey = async () => {
    try { await axios.post('http://127.0.0.1:8080/add-llm-key', { provider, api_key: apiKey }); alert("Key Added!"); } catch (err) { alert("Error"); }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await axios.post('http://127.0.0.1:8080/generate-alpha', { prompt });
      if (res.data.result) setExpression(res.data.result);
    } catch (err) { alert("LLM Error"); }
    setGenerating(false);
  };

  return (
    <div className="flex h-screen">
      <div className="w-64 bg-surface border-r border-gray-800 p-4">
        <h1 className="text-xl font-bold text-white mb-8 flex items-center gap-2"><Brain className="text-primary" /> AlphaEngine</h1>
        <nav className="space-y-2">
          <button onClick={() => setActiveTab('simulate')} className={`w-full flex items-center gap-3 p-3 rounded-lg text-left ${activeTab === 'simulate' ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:bg-gray-800'}`}><Activity size={18} /> Simulate</button>
          <button onClick={() => setActiveTab('evolution')} className={`w-full flex items-center gap-3 p-3 rounded-lg text-left ${activeTab === 'evolution' ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:bg-gray-800'}`}><Dna size={18} /> Evolution Lab</button>
          <button onClick={() => setActiveTab('llm')} className={`w-full flex items-center gap-3 p-3 rounded-lg text-left ${activeTab === 'llm' ? 'bg-primary/20 text-primary' : 'text-gray-400 hover:bg-gray-800'}`}><Key size={18} /> LLM Hub</button>
        </nav>
      </div>

      <div className="flex-1 p-8 overflow-y-auto flex gap-8">
        {activeTab === 'simulate' && (
          <>
            <div className="w-1/3">
              <h2 className="text-2xl font-bold mb-6">Run Simulation</h2>
              <div className="bg-surface border border-gray-800 rounded-xl p-6 space-y-4">
                <textarea value={expression} onChange={e => setExpression(e.target.value)} rows={3} className="w-full bg-[#1a1f2b] border border-gray-700 rounded-lg p-3 text-white font-mono text-sm" />
                <div className="grid grid-cols-2 gap-4">
                  <select value={region} onChange={e => setRegion(e.target.value)} className="bg-[#1a1f2b] text-white p-2.5 rounded-lg border border-gray-700"><option value="USA">USA</option><option value="EUR">EUR</option><option value="ASI">ASI</option><option value="GLB">GLB</option><option value="ALL">ALL (RA)</option></select>
                  <select value={universe} onChange={e => setUniverse(e.target.value)} className="bg-[#1a1f2b] text-white p-2.5 rounded-lg border border-gray-700"><option value="TOP3000">TOP3000</option><option value="TOP1000">TOP1000</option><option value="TOP500">TOP500</option></select>
                  <select value={delay} onChange={e => setDelay(Number(e.target.value))} className="bg-[#1a1f2b] text-white p-2.5 rounded-lg border border-gray-700"><option value={1}>Delay 1</option><option value={0}>Delay 0</option></select>
                  <select value={neutralization} onChange={e => setNeutralization(e.target.value)} className="bg-[#1a1f2b] text-white p-2.5 rounded-lg border border-gray-700"><option value="SUBINDUSTRY">Subindustry</option><option value="INDUSTRY">Industry</option><option value="SECTOR">Sector</option><option value="MARKET">Market</option></select>
                </div>
                <button onClick={handleSimulate} disabled={isSubmitting} className="w-full mt-4 bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg font-medium flex justify-center items-center gap-2">
                  {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <PlayCircle size={18}/>} Run
                </button>
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-6">Active Queue</h2>
              <div className="space-y-4">
                {Object.entries(tasks).reverse().map(([id, task]) => (
                  <div key={id} className="bg-surface border border-gray-800 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-mono text-sm truncate text-gray-300 pr-4">{task.expression}</div>
                      <div>{task.status === 'success' ? <CheckCircle2 className="text-green-500" size={16}/> : task.status === 'error' ? <XCircle className="text-red-500" size={16}/> : <Loader2 className="text-blue-500 animate-spin" size={16}/>}</div>
                    </div>
                    {task.result && task.result.status !== 'error' && (
                      <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-800 text-sm">
                        <div><div className="text-gray-500 text-xs">Sharpe</div>{task.result.sharpe?.toFixed(2)}</div>
                        <div><div className="text-gray-500 text-xs">Fitness</div>{task.result.fitness?.toFixed(2)}</div>
                        <div><div className="text-gray-500 text-xs">Turnover</div>{(task.result.turnover * 100).toFixed(1)}%</div>
                        <div><div className="text-gray-500 text-xs">Returns</div>{(task.result.returns * 100).toFixed(1)}%</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'evolution' && (
          <div className="w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Evolution Lab</h2>
              <button onClick={handleSync} className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2">{syncing ? <Loader2 className="animate-spin" size={16}/> : <RefreshCw size={16}/>} Sync Alphas</button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {alphas.map(a => (
                <div key={a.id} className="bg-surface border border-gray-800 p-4 rounded-xl">
                  <div className="font-mono text-xs text-gray-400 truncate mb-2">{a.regular?.code}</div>
                  <div className="text-sm">Sharpe: {a.is?.sharpe?.toFixed(2)}</div>
                  <button className="mt-4 w-full bg-primary/20 text-primary py-1 rounded">Mutate</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'llm' && (
          <div className="w-1/2">
            <h2 className="text-2xl font-bold mb-6">LLM Hub</h2>
            <div className="bg-surface border border-gray-800 rounded-xl p-6 space-y-4">
              <div>
                <label className="block text-sm mb-1.5 text-gray-300">Provider</label>
                <select value={provider} onChange={e => setProvider(e.target.value)} className="w-full bg-[#1a1f2b] text-white p-2.5 rounded-lg border border-gray-700"><option value="groq">Groq</option><option value="openai">OpenAI</option></select>
              </div>
              <div>
                <label className="block text-sm mb-1.5 text-gray-300">API Key</label>
                <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} className="w-full bg-[#1a1f2b] text-white p-2.5 rounded-lg border border-gray-700" />
              </div>
              <button onClick={handleLLMKey} className="w-full bg-blue-600 py-2 rounded-lg">Save Key</button>
              
              <hr className="border-gray-700 my-4" />
              
              <div>
                <label className="block text-sm mb-1.5 text-gray-300">Idea Prompt</label>
                <input type="text" value={prompt} onChange={e => setPrompt(e.target.value)} className="w-full bg-[#1a1f2b] text-white p-2.5 rounded-lg border border-gray-700" placeholder="Mean reversion on high volume..." />
              </div>
              <button onClick={handleGenerate} disabled={generating} className="w-full bg-green-600 py-2 rounded-lg flex justify-center items-center gap-2">
                {generating ? <Loader2 className="animate-spin" size={16}/> : <Dna size={16}/>} Generate Alpha
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
