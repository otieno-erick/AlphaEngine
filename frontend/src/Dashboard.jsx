import { Activity, Brain, Dna, Key, PlayCircle } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-surface border-r border-gray-800 p-4">
        <h1 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
          <Brain className="text-primary" /> AlphaEngine
        </h1>
        <nav className="space-y-2">
          <button className="w-full flex items-center gap-3 bg-primary/20 text-primary p-3 rounded-lg text-left">
            <Activity size={18} /> Task Manager
          </button>
          <button className="w-full flex items-center gap-3 text-gray-400 hover:bg-gray-800 p-3 rounded-lg text-left transition-colors">
            <Dna size={18} /> Evolution Lab
          </button>
          <button className="w-full flex items-center gap-3 text-gray-400 hover:bg-gray-800 p-3 rounded-lg text-left transition-colors">
            <Key size={18} /> LLM Hub
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Simulation Task Manager</h2>
        
        <div className="bg-surface border border-gray-800 rounded-xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Active Queue</h3>
            <button className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm transition-colors">
              <PlayCircle size={16} /> Run New Simulation
            </button>
          </div>
          
          <div className="text-center py-12 text-gray-500 border border-dashed border-gray-700 rounded-lg">
            No active simulations. Start one to begin mining alphas.
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="bg-surface p-6 rounded-xl border border-gray-800">
            <h4 className="text-gray-400 text-sm mb-2">Concurrent Slots</h4>
            <div className="text-3xl font-bold">0 / 10</div>
          </div>
          <div className="bg-surface p-6 rounded-xl border border-gray-800">
            <h4 className="text-gray-400 text-sm mb-2">Simulations Today</h4>
            <div className="text-3xl font-bold">0</div>
          </div>
          <div className="bg-surface p-6 rounded-xl border border-gray-800">
            <h4 className="text-gray-400 text-sm mb-2">Passed Submissions</h4>
            <div className="text-3xl font-bold text-green-400">0</div>
          </div>
        </div>
      </div>
    </div>
  );
}
