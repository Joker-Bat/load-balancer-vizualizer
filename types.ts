export enum Algorithm {
  ROUND_ROBIN = 'ROUND_ROBIN',
  LEAST_CONNECTIONS = 'LEAST_CONNECTIONS',
  RANDOM = 'RANDOM',
  IP_HASH = 'IP_HASH'
}

export enum RequestStatus {
  CLIENT_TO_LB = 'CLIENT_TO_LB',
  AT_LB = 'AT_LB',
  LB_TO_SERVER = 'LB_TO_SERVER',
  AT_SERVER = 'AT_SERVER',
  SERVER_TO_LB = 'SERVER_TO_LB',
  AT_LB_RETURN = 'AT_LB_RETURN',
  LB_TO_CLIENT = 'LB_TO_CLIENT',
  COMPLETED = 'COMPLETED'
}

export enum SimulationStep {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING'
}

export interface RequestItem {
  id: string;
  clientId: number;
  serverId: number | null;
  status: RequestStatus;
  payload: string;
  color: string;
  logs: string[];
  type: 'SINGLE' | 'BATCH';
  batchCount?: number;
}

export interface ServerStats {
  id: number;
  activeRequestCount: number;
  totalProcessed: number;
  health: number; // 0-100
  isDown: boolean;
}

export interface Coordinates {
  x: number;
  y: number;
}