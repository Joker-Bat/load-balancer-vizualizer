import React from 'react';
import { Network, Activity, StepForward, PlayCircle, PauseCircle, BrainCircuit } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Algorithm, SimulationStep, RequestStatus } from '../types';

const ALGO_INFO = {
    [Algorithm.ROUND_ROBIN]: "Sequentially distributes requests to each server in order. Ideal for servers with identical specifications.",
    [Algorithm.LEAST_CONNECTIONS]: "Directs traffic to the server with the fewest active connections. Best when request processing times vary.",
    [Algorithm.RANDOM]: "Randomly selects a server. effective for large clusters where probability ensures even distribution over time.",
    [Algorithm.IP_HASH]: "Uses the client's IP (ID) to determine the server. Ensures a client always connects to the same server (Persistence)."
};

const LoadBalancerNode: React.FC = () => {
  const { 
      lbLogs, requests, algorithm, isAutoMode, 
      simulationStep, simulationDetails, nextStep, toggleAutoMode 
  } = useStore();
  
  const activeCount = requests.filter(r => r.status !== 'COMPLETED').length;
  const waitingCount = requests.filter(r => r.status === RequestStatus.AT_LB).length;

  return (
    <div className="flex flex-col h-full gap-4">
        {/* Algorithm Info Header */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-xs text-slate-400">
            <strong className="text-primary block mb-1">Current Strategy: {algorithm.replace('_', ' ')}</strong>
            {ALGO_INFO[algorithm]}
        </div>

        {/* The visual Node */}
        <div 
            id="lb-node"
            className={`
                bg-surface border-2 rounded-2xl p-6 flex flex-col items-center justify-center 
                shadow-[0_0_30px_rgba(139,92,246,0.15)] relative z-10 min-h-[160px] transition-all
                ${isAutoMode ? 'border-accent/50' : 'border-orange-500/50'}
            `}
        >
            <div className={`absolute -top-3 ${isAutoMode ? 'bg-accent' : 'bg-orange-500'} text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-2`}>
                {isAutoMode ? <Activity size={12} /> : <BrainCircuit size={12} />}
                {isAutoMode ? 'AUTO MODE' : 'MANUAL MODE'}
            </div>
            
            <div className={`p-4 rounded-full mb-3 ${isAutoMode ? 'bg-accent/10 text-accent animate-pulse' : 'bg-orange-500/10 text-orange-500'}`}>
                <Network size={48} />
            </div>
            
            <div className="text-center">
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Traffic Controller</div>
                <div className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1">
                    {waitingCount > 0 ? (
                        <span className="text-orange-400 font-bold">{waitingCount} Waiting for Decision</span>
                    ) : (
                        <span>{activeCount} Requests in flight</span>
                    )}
                </div>
            </div>

            {/* Manual Controls */}
            {!isAutoMode && (
                <div className="mt-4 w-full flex flex-col items-center gap-2">
                    <button
                        onClick={nextStep}
                        disabled={waitingCount === 0 && simulationStep === SimulationStep.IDLE}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all w-full justify-center
                            ${simulationStep === SimulationStep.ANALYZING 
                                ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20' 
                                : 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed'}
                        `}
                    >
                        {simulationStep === SimulationStep.ANALYZING ? (
                            <>Dispatch Request <StepForward size={16} /></>
                        ) : (
                            <>Next Step <StepForward size={16} /></>
                        )}
                    </button>
                    
                    {simulationDetails && (
                        <div className={`mt-2 p-3 rounded text-xs font-mono text-left w-full border ${simulationDetails.type === 'ERROR' ? 'bg-red-900/30 border-red-500/50 text-red-200' : 'bg-slate-900/80 border-slate-600 text-green-300'}`}>
                            <div className="font-bold border-b border-slate-600/50 pb-1 mb-1">Decision Logic:</div>
                            <pre className="whitespace-pre-wrap font-sans">{simulationDetails.message}</pre>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Mode Toggle & Logs */}
        <div className="flex-1 bg-black/40 border border-slate-800 rounded-lg overflow-hidden flex flex-col font-mono text-xs">
             <div className="p-2 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                 <span className="text-slate-500">>_ System Logs</span>
                 <button 
                    onClick={toggleAutoMode}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors ${isAutoMode ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-accent text-white'}`}
                 >
                    {isAutoMode ? <PauseCircle size={12} /> : <PlayCircle size={12} />}
                    {isAutoMode ? 'Pause & Step' : 'Resume Auto'}
                 </button>
             </div>
            <div className="overflow-y-auto flex flex-col-reverse gap-1 h-full p-2 custom-scrollbar max-h-[200px]">
                {lbLogs.map((log, idx) => (
                    <div key={idx} className="text-slate-300 border-l-2 border-slate-700 pl-2 py-0.5 opacity-90 hover:opacity-100">
                        <span className="text-slate-600 mr-2">[{new Date().toLocaleTimeString().split(' ')[0]}]</span>
                        {log}
                    </div>
                ))}
                {lbLogs.length === 0 && <span className="text-slate-700 italic">No activity recorded...</span>}
            </div>
        </div>
    </div>
  );
};

export default LoadBalancerNode;