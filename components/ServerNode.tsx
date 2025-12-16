import React from 'react';
import { Server as ServerIcon, Cpu, CheckCircle2, Power, AlertTriangle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { RequestStatus } from '../types';

interface ServerNodeProps {
  id: number;
}

const ServerNode: React.FC<ServerNodeProps> = ({ id }) => {
  const { servers, requests, resolveRequestAtServer, toggleServerStatus } = useStore();
  
  const serverStats = servers.find(s => s.id === id);
  const activeRequests = requests.filter(r => r.serverId === id && r.status === RequestStatus.AT_SERVER);
  const isDown = serverStats?.isDown || false;

  return (
    <div 
      id={`server-${id}`}
      className={`
        border rounded-xl p-4 flex flex-col w-full shadow-lg relative min-h-[180px] transition-all duration-300
        ${isDown ? 'bg-slate-900/50 border-red-900/50 grayscale opacity-80' : 'bg-surface border-slate-700 hover:border-slate-500'}
      `}
    >
      {/* Power Button */}
      <button 
        onClick={() => toggleServerStatus(id)}
        className={`absolute top-2 right-2 p-1.5 rounded-full transition-colors ${isDown ? 'bg-red-500/20 text-red-500 hover:bg-red-500/40' : 'bg-slate-800 text-slate-500 hover:text-green-400 hover:bg-slate-700'}`}
        title={isDown ? "Turn Server ON" : "Turn Server OFF"}
      >
        <Power size={14} />
      </button>

      <div className="flex justify-between items-start mb-4 pr-6">
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg transition-colors ${isDown ? 'bg-slate-800 text-slate-600' : (activeRequests.length > 3 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400')}`}>
                <ServerIcon size={24} />
            </div>
            <div>
                <h3 className="text-sm font-bold text-slate-200">Server #{id + 1}</h3>
                <span className={`text-xs flex items-center gap-1 ${isDown ? 'text-red-500' : 'text-slate-500'}`}>
                    {isDown ? <><AlertTriangle size={10} /> OFFLINE</> : <><Cpu size={10} /> Load: {serverStats?.activeRequestCount || 0}</>}
                </span>
            </div>
        </div>
      </div>

      <div className={`flex-1 rounded-lg p-2 border overflow-y-auto max-h-[200px] min-h-[100px] transition-colors ${isDown ? 'bg-black/20 border-transparent' : 'bg-slate-900/50 border-slate-800/50'}`}>
        {isDown ? (
             <div className="h-full flex flex-col items-center justify-center text-red-900/50 gap-2">
                <AlertTriangle size={24} />
                <span className="text-xs font-bold uppercase tracking-widest">System Down</span>
             </div>
        ) : activeRequests.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-700 text-xs italic">
                Idle
            </div>
        ) : (
            <div className="space-y-2">
                {activeRequests.map(req => (
                    <button
                        key={req.id}
                        onClick={() => resolveRequestAtServer(req.id)}
                        className="w-full flex items-center justify-between p-2 rounded bg-slate-800 border border-slate-700 hover:border-green-500 hover:bg-slate-700 transition-all group"
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: req.color }}></div>
                            <span className="text-xs font-mono text-slate-300">{req.payload}</span>
                        </div>
                        <CheckCircle2 size={14} className="text-slate-600 group-hover:text-green-500 transition-colors" />
                    </button>
                ))}
            </div>
        )}
      </div>
      
      {!isDown && (
          <div className="mt-2 text-[10px] text-slate-600 font-mono text-right">
             Total Processed: {serverStats?.totalProcessed}
          </div>
      )}
    </div>
  );
};

export default ServerNode;