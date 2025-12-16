import { create } from 'zustand';
import { Algorithm, RequestItem, RequestStatus, ServerStats, SimulationStep } from '../types';

interface AppState {
  // Configuration
  numClients: number;
  numServers: number;
  algorithm: Algorithm;
  isInitialized: boolean;
  
  // Runtime State
  requests: RequestItem[];
  servers: ServerStats[];
  lbLogs: string[];
  rrIndex: number; // Round robin cursor

  // Simulation Mode
  isAutoMode: boolean;
  simulationStep: SimulationStep;
  simulationDetails: { type: 'INFO' | 'SUCCESS' | 'ERROR', message: string } | null;
  processingRequestId: string | null;

  // Actions
  initialize: (clients: number, servers: number, algo: Algorithm) => void;
  reset: () => void;
  toggleServerStatus: (serverId: number) => void;
  toggleAutoMode: () => void;
  nextStep: () => void;
  
  addRequest: (clientId: number, count?: number) => void;
  processBatchAtLB: (requestId: string) => void;
  
  updateRequestStatus: (requestId: string, status: RequestStatus) => void;
  assignServer: (requestId: string) => void;
  resolveRequestAtServer: (requestId: string) => void;
  removeRequest: (requestId: string) => void;
  addLog: (msg: string) => void;
}

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#06b6d4', '#8b5cf6', '#d946ef', '#f43f5e'];

const generateId = () => Math.random().toString(36).substring(7);

// Helper to select server based on algorithm
const selectServer = (
  servers: ServerStats[], 
  algorithm: Algorithm, 
  rrIndex: number,
  clientId?: number
): { serverId: number, log: string, nextRrIndex: number, analysis: string } => {
  const activeServers = servers.filter(s => !s.isDown);
  
  if (activeServers.length === 0) {
    return { 
      serverId: -1, 
      log: 'No active servers available!', 
      nextRrIndex: rrIndex,
      analysis: 'CRITICAL: Checking server health...\n\nResult: All servers are currently OFFLINE or unreachable.\nAction: Dropping request.' 
    };
  }

  let targetId = -1;
  let log = '';
  let nextRr = rrIndex;
  let analysis = '';

  if (algorithm === Algorithm.IP_HASH && clientId !== undefined) {
    const index = clientId % activeServers.length;
    targetId = activeServers[index].id;
    log = `[IP-HASH] Client ${clientId + 1} -> Server ${targetId + 1}`;
    analysis = `1. Reading Client Header...\n   -> Request is from Client #${clientId + 1}.\n\n2. Hashing...\n   -> Applying formula: ClientID % ActiveServers.\n   -> ${clientId + 1} % ${activeServers.length} = Index ${index}.\n\n3. Decision:\n   -> This index maps directly to Server #${targetId + 1}.`;
  } else if (algorithm === Algorithm.ROUND_ROBIN) {
    // We need to map the global rrIndex to the filtered list
    const server = activeServers[rrIndex % activeServers.length];
    targetId = server.id;
    log = `[RR] Selected Server ${targetId + 1}`;
    analysis = `1. Checking Sequence...\n   -> Previous request went to the server before this one.\n   -> Current sequential pointer is at position ${rrIndex + 1}.\n\n2. Selecting...\n   -> Moving down the list of active servers.\n   -> The next server in line is Server #${targetId + 1}.\n\n3. Action:\n   -> Routing request to Server #${targetId + 1} and advancing pointer.`;
    nextRr = rrIndex + 1;
  } else if (algorithm === Algorithm.RANDOM) {
    const randomIndex = Math.floor(Math.random() * activeServers.length);
    targetId = activeServers[randomIndex].id;
    log = `[RND] Selected Server ${targetId + 1}`;
    analysis = `1. Identifying Pool...\n   -> Found ${activeServers.length} healthy servers available.\n\n2. Randomizing...\n   -> "Rolling the dice" to pick a number between 1 and ${activeServers.length}.\n   -> Result: Index ${randomIndex}.\n\n3. Decision:\n   -> Random selection chose Server #${targetId + 1}.`;
  } else if (algorithm === Algorithm.LEAST_CONNECTIONS) {
    // Sort by active requests, then by ID to ensure stability
    const sorted = [...activeServers].sort((a, b) => {
      if (a.activeRequestCount === b.activeRequestCount) return a.id - b.id;
      return a.activeRequestCount - b.activeRequestCount;
    });
    targetId = sorted[0].id;
    log = `[LC] Selected Server ${targetId + 1} (Load: ${sorted[0].activeRequestCount})`;
    
    // Create a readable list of loads for the analysis
    const loadList = activeServers.slice(0, 3).map(s => `Server ${s.id+1}: ${s.activeRequestCount} active`).join(', ');
    const more = activeServers.length > 3 ? '...' : '';

    analysis = `1. Polling Server Loads...\n   -> Querying active connections on all servers.\n   -> Current Loads: [ ${loadList}${more} ]\n\n2. Comparing...\n   -> Server #${targetId + 1} currently has the fewest connections (${sorted[0].activeRequestCount}).\n\n3. Decision:\n   -> sending to Server #${targetId + 1} to balance the load.`;
  }

  return { serverId: targetId, log, nextRrIndex: nextRr, analysis };
};

export const useStore = create<AppState>((set, get) => ({
  numClients: 2,
  numServers: 3,
  algorithm: Algorithm.ROUND_ROBIN,
  isInitialized: false,
  isAutoMode: true,
  simulationStep: SimulationStep.IDLE,
  simulationDetails: null,
  processingRequestId: null,
  
  requests: [],
  servers: [],
  lbLogs: [],
  rrIndex: 0,

  initialize: (numClients, numServers, algorithm) => {
    const servers: ServerStats[] = Array.from({ length: numServers }, (_, i) => ({
      id: i,
      activeRequestCount: 0,
      totalProcessed: 0,
      health: 100,
      isDown: false
    }));

    set({
      numClients,
      numServers,
      algorithm,
      servers,
      requests: [],
      lbLogs: ['System Initialized. Waiting for requests...'],
      rrIndex: 0,
      isInitialized: true,
      simulationStep: SimulationStep.IDLE,
      simulationDetails: null,
      processingRequestId: null
    });
  },

  reset: () => {
    set({
      isInitialized: false,
      requests: [],
      servers: [],
      lbLogs: [],
      rrIndex: 0,
      isAutoMode: true,
      simulationStep: SimulationStep.IDLE,
      simulationDetails: null,
      processingRequestId: null
    });
  },

  toggleAutoMode: () => {
    const state = get();
    const willBeAuto = !state.isAutoMode;

    if (willBeAuto) {
        // Clear any manual simulation state
        set({ 
            isAutoMode: true,
            simulationStep: SimulationStep.IDLE,
            simulationDetails: null,
            processingRequestId: null
        });

        // Find pending requests and dispatch them
        const pending = state.requests.filter(r => r.status === RequestStatus.AT_LB);
        
        pending.forEach((req, idx) => {
            setTimeout(() => {
                // Ensure we use latest state/logic
                get().assignServer(req.id);
            }, idx * 200); // Stagger the dispatch slightly for visual clarity
        });
    } else {
        set({ isAutoMode: false });
    }
  },

  toggleServerStatus: (serverId) => {
    set(state => ({
      servers: state.servers.map(s => 
        s.id === serverId ? { ...s, isDown: !s.isDown } : s
      ),
      lbLogs: [`Server ${serverId + 1} marked as ${!state.servers.find(s => s.id === serverId)?.isDown ? 'DOWN' : 'UP'}`, ...state.lbLogs].slice(0, 10)
    }));
  },

  addRequest: (clientId, count = 1) => {
    const id = generateId();
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const isBatch = count > 1;
    
    const newReq: RequestItem = {
      id,
      clientId,
      serverId: null,
      status: RequestStatus.CLIENT_TO_LB,
      payload: isBatch ? `BATCH (${count})` : `REQ-${id.toUpperCase()}`,
      color,
      logs: [],
      type: isBatch ? 'BATCH' : 'SINGLE',
      batchCount: count
    };

    set(state => ({
      requests: [...state.requests, newReq]
    }));
  },

  processBatchAtLB: (requestId) => {
    const state = get();
    const batchReq = state.requests.find(r => r.id === requestId);
    if (!batchReq || batchReq.type !== 'BATCH' || !batchReq.batchCount) return;

    // Remove the batch request and create N individual requests
    const count = batchReq.batchCount;
    const newRequests: RequestItem[] = [];
    
    // If we are in manual mode, we simply create the requests at AT_LB and let the user step through them
    if (!state.isAutoMode) {
        for (let i = 0; i < count; i++) {
            const subId = generateId();
            newRequests.push({
                id: subId,
                clientId: batchReq.clientId,
                serverId: null,
                status: RequestStatus.AT_LB, // Waiting at LB
                payload: `REQ-${subId.toUpperCase()}`,
                color: batchReq.color,
                logs: [],
                type: 'SINGLE'
            });
        }
        set(state => ({
            requests: [...state.requests.filter(r => r.id !== requestId), ...newRequests],
            lbLogs: [`Expanded Batch into ${count} requests. Waiting for manual processing...`, ...state.lbLogs].slice(0, 10)
        }));
        return;
    }

    // Auto Mode Batch Logic (Original efficient logic)
    let tempServers = [...state.servers];
    let tempRrIndex = state.rrIndex;
    const newLogs = [...state.lbLogs];

    for (let i = 0; i < count; i++) {
      const { serverId, log, nextRrIndex } = selectServer(tempServers, state.algorithm, tempRrIndex, batchReq.clientId);
      tempRrIndex = nextRrIndex;
      
      const subId = generateId();
      newRequests.push({
        id: subId,
        clientId: batchReq.clientId,
        serverId: serverId === -1 ? null : serverId,
        status: serverId === -1 ? RequestStatus.LB_TO_CLIENT : RequestStatus.LB_TO_SERVER,
        payload: `REQ-${subId.toUpperCase()}`,
        color: batchReq.color,
        logs: [],
        type: 'SINGLE'
      });

      if (serverId !== -1) {
        newLogs.unshift(log);
        tempServers = tempServers.map(s => 
          s.id === serverId ? { ...s, activeRequestCount: s.activeRequestCount + 1 } : s
        );
      } else {
        newLogs.unshift("[ERR] Request dropped - No servers available");
      }
    }

    set(state => ({
      requests: [...state.requests.filter(r => r.id !== requestId), ...newRequests],
      servers: tempServers,
      rrIndex: tempRrIndex,
      lbLogs: newLogs.slice(0, 20)
    }));
  },

  nextStep: () => {
      const state = get();
      
      // If we are currently displaying an analysis, commit the action
      if (state.simulationStep === SimulationStep.ANALYZING && state.processingRequestId) {
          state.assignServer(state.processingRequestId);
          set({ 
              simulationStep: SimulationStep.IDLE, 
              processingRequestId: null, 
              simulationDetails: null 
          });
          return;
      }

      // Otherwise, look for the next waiting request
      const nextRequest = state.requests.find(r => r.status === RequestStatus.AT_LB);
      
      if (!nextRequest) {
          set({ simulationDetails: { type: 'INFO', message: 'No requests waiting at Load Balancer.' }});
          setTimeout(() => set({ simulationDetails: null }), 2000);
          return;
      }

      // Analyze the next request
      const { serverId, analysis } = selectServer(state.servers, state.algorithm, state.rrIndex, nextRequest.clientId);
      
      set({
          simulationStep: SimulationStep.ANALYZING,
          processingRequestId: nextRequest.id,
          simulationDetails: {
              type: serverId === -1 ? 'ERROR' : 'SUCCESS',
              message: analysis
          }
      });
  },

  updateRequestStatus: (requestId, status) => {
    set(state => ({
      requests: state.requests.map(r => r.id === requestId ? { ...r, status } : r)
    }));
  },

  assignServer: (requestId) => {
    const state = get();
    
    const req = state.requests.find(r => r.id === requestId);
    if (!req) return;

    const { serverId, log, nextRrIndex } = selectServer(state.servers, state.algorithm, state.rrIndex, req.clientId);
    
    // If no server available, bounce back
    if (serverId === -1) {
        set(state => ({
            requests: state.requests.map(r => r.id === requestId ? { ...r, status: RequestStatus.LB_TO_CLIENT, color: '#ef4444', payload: 'DROPPED' } : r),
            lbLogs: [log, ...state.lbLogs].slice(0, 10)
        }));
        return;
    }

    set(state => ({
        servers: state.servers.map(s => 
            s.id === serverId 
            ? { ...s, activeRequestCount: s.activeRequestCount + 1 } 
            : s
        ),
        requests: state.requests.map(r => 
            r.id === requestId 
            ? { ...r, serverId, status: RequestStatus.LB_TO_SERVER } 
            : r
        ),
        rrIndex: nextRrIndex,
        lbLogs: [log, ...state.lbLogs].slice(0, 10)
    }));
  },

  resolveRequestAtServer: (requestId) => {
    set(state => {
        const req = state.requests.find(r => r.id === requestId);
        if (!req || req.serverId === null) return {};

        const serverId = req.serverId;

        const newServers = state.servers.map(s => 
            s.id === serverId 
            ? { ...s, activeRequestCount: Math.max(0, s.activeRequestCount - 1), totalProcessed: s.totalProcessed + 1 } 
            : s
        );

        const newRequests = state.requests.map(r => 
            r.id === requestId 
            ? { ...r, status: RequestStatus.SERVER_TO_LB } 
            : r
        );

        return {
            servers: newServers,
            requests: newRequests,
            lbLogs: [`[RESP] Server ${serverId + 1} resolved ${req.payload}. Returning...`, ...state.lbLogs].slice(0, 10)
        };
    });
  },

  removeRequest: (requestId) => {
    set(state => ({
        requests: state.requests.filter(r => r.id !== requestId)
    }));
  },

  addLog: (msg) => set(state => ({ lbLogs: [msg, ...state.lbLogs].slice(0, 10) }))
}));