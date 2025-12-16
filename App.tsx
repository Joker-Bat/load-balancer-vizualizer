import React from 'react';
import { useStore } from './store/useStore';
import ConfigPanel from './components/ConfigPanel';
import ClientNode from './components/ClientNode';
import LoadBalancerNode from './components/LoadBalancerNode';
import ServerNode from './components/ServerNode';
import Packet from './components/Packet';
import { Layers } from 'lucide-react';

const App: React.FC = () => {
  const { isInitialized, numClients, numServers, requests } = useStore();

  return (
    <div className="min-h-screen bg-background text-slate-200 p-4 md:p-8 font-sans selection:bg-primary/30">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg text-white shadow-lg shadow-blue-500/20">
            <Layers size={28} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Load Balancer <span className="text-primary">Viz</span></h1>
            <p className="text-slate-400 text-sm">Interactive visualization of traffic distribution algorithms</p>
          </div>
        </header>

        <ConfigPanel />

        {isInitialized && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative min-h-[600px]">
             
             {/* Packet Layer - Renders animated packets on top of everything */}
             {requests.map(req => (
               <Packet key={req.id} request={req} />
             ))}

            {/* Column 1: Clients */}
            <div className="lg:col-span-3 flex flex-col gap-4 border-r border-slate-800/50 pr-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest text-center mb-2">Clients Area</h3>
              <div className="space-y-4">
                {Array.from({ length: numClients }).map((_, i) => (
                  <ClientNode key={i} id={i} />
                ))}
              </div>
            </div>

            {/* Column 2: Load Balancer */}
            <div className="lg:col-span-4 flex flex-col">
               <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest text-center mb-6">Network Gateway</h3>
               <LoadBalancerNode />
            </div>

            {/* Column 3: Servers */}
            <div className="lg:col-span-5 flex flex-col gap-4 border-l border-slate-800/50 pl-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest text-center mb-2">Server Cluster</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: numServers }).map((_, i) => (
                  <ServerNode key={i} id={i} />
                ))}
              </div>
            </div>
          </div>
        )}
        
        {!isInitialized && (
            <div className="text-center py-20 text-slate-600 border-2 border-dashed border-slate-800 rounded-xl">
                <Layers size={48} className="mx-auto mb-4 opacity-20" />
                <p>Configure the parameters above and click Initialize to start the simulation.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default App;