import React, { useState } from 'react';
import { Smartphone, Monitor, Laptop, Send, Layers } from 'lucide-react';
import { useStore } from '../store/useStore';

interface ClientNodeProps {
  id: number;
}

const ClientNode: React.FC<ClientNodeProps> = ({ id }) => {
  // Select only the action needed
  const addRequest = useStore(state => state.addRequest);
  const [burstCount, setBurstCount] = useState(5);

  const getIcon = () => {
    if (id % 3 === 0) return <Monitor size={32} className="text-slate-300" />;
    if (id % 3 === 1) return <Smartphone size={32} className="text-slate-300" />;
    return <Laptop size={32} className="text-slate-300" />;
  };

  const handleBatch = () => {
    addRequest(id, burstCount);
  };

  return (
    <div 
      id={`client-${id}`}
      className="bg-surface border border-slate-700 rounded-xl p-4 flex flex-col items-center gap-4 shadow-lg hover:border-slate-500 transition-colors relative"
    >
      <div className="absolute -top-3 bg-slate-800 text-slate-400 text-xs px-2 py-1 rounded border border-slate-700 font-mono">
        Client #{id + 1}
      </div>
      
      <div className="p-4 bg-slate-800 rounded-full border border-slate-600 shadow-inner mt-2">
        {getIcon()}
      </div>

      <div className="flex flex-col gap-2 w-full mt-2">
        <button 
          onClick={() => addRequest(id)}
          className="bg-slate-700 hover:bg-primary hover:text-white text-slate-300 py-2 px-3 rounded flex items-center justify-center gap-2 text-xs font-medium transition-all"
        >
          <Send size={14} /> Send 1 Request
        </button>
        
        <div className="flex gap-2">
          <input 
            type="number" 
            min={2} 
            max={20}
            value={burstCount}
            onChange={(e) => setBurstCount(Math.max(2, parseInt(e.target.value)))}
            className="w-12 bg-slate-900 border border-slate-700 rounded text-center text-xs text-white"
          />
          <button 
            onClick={handleBatch}
            className="flex-1 bg-accent/20 hover:bg-accent/30 text-accent border border-accent/20 py-2 px-2 rounded flex items-center justify-center gap-1 text-xs font-medium transition-all"
          >
            <Layers size={14} /> Batch
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientNode;