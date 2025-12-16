import React from 'react';
import { useStore } from '../store/useStore';
import { Algorithm } from '../types';
import { Play, RotateCcw, Settings2 } from 'lucide-react';

const ConfigPanel: React.FC = () => {
  const { 
    numClients, numServers, algorithm, isInitialized,
    initialize, reset 
  } = useStore();

  const [localClients, setLocalClients] = React.useState(numClients);
  const [localServers, setLocalServers] = React.useState(numServers);
  const [localAlgo, setLocalAlgo] = React.useState(algorithm);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    initialize(localClients, localServers, localAlgo);
  };

  if (isInitialized) {
    return (
      <div className="bg-surface border border-slate-700 p-4 rounded-xl flex items-center justify-between shadow-xl mb-6">
        <div className="flex gap-6 text-sm text-slate-300">
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500 uppercase">Configuration</span>
            <span className="font-mono text-white">
              {localClients} Clients &rarr; {localServers} Servers
            </span>
          </div>
          <div className="flex flex-col">
             <span className="text-xs font-semibold text-slate-500 uppercase">Algorithm</span>
             <span className="text-accent font-medium">
               {localAlgo === Algorithm.ROUND_ROBIN && 'Round Robin'}
               {localAlgo === Algorithm.LEAST_CONNECTIONS && 'Least Connections'}
               {localAlgo === Algorithm.RANDOM && 'Random Distribution'}
               {localAlgo === Algorithm.IP_HASH && 'IP Hash (Source)'}
             </span>
          </div>
        </div>
        <button 
          onClick={reset}
          className="flex items-center gap-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 px-4 py-2 rounded-lg transition-colors text-sm font-medium border border-red-500/20"
        >
          <RotateCcw size={16} />
          Reset Simulation
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-slate-700 p-6 rounded-xl shadow-2xl mb-8">
      <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
        <Settings2 className="text-primary" />
        <h2 className="text-xl font-bold text-white">System Configuration</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Number of Clients</label>
          <input 
            type="number" 
            min={1} 
            max={6}
            value={localClients}
            onChange={(e) => setLocalClients(parseInt(e.target.value))}
            className="w-full bg-background border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Number of Servers</label>
          <input 
            type="number" 
            min={1} 
            max={8}
            value={localServers}
            onChange={(e) => setLocalServers(parseInt(e.target.value))}
            className="w-full bg-background border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Load Balancing Algorithm</label>
          <select 
            value={localAlgo}
            onChange={(e) => setLocalAlgo(e.target.value as Algorithm)}
            className="w-full bg-background border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          >
            <option value={Algorithm.ROUND_ROBIN}>Round Robin</option>
            <option value={Algorithm.LEAST_CONNECTIONS}>Least Connections</option>
            <option value={Algorithm.RANDOM}>Random</option>
            <option value={Algorithm.IP_HASH}>IP Hash</option>
          </select>
        </div>
      </div>
      
      <button 
        type="submit"
        className="w-full bg-primary hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
      >
        <Play size={20} />
        Initialize System
      </button>
    </form>
  );
};

export default ConfigPanel;