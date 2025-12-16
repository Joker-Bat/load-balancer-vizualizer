import React, { useEffect, useState } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { RequestItem, RequestStatus } from '../types';
import { useStore } from '../store/useStore';
import { FileCode2, Layers } from 'lucide-react';

interface PacketProps {
  request: RequestItem;
}

const PacketComponent: React.FC<PacketProps> = ({ request }) => {
  const [coords, setCoords] = useState<{ from: { x: number, y: number }, to: { x: number, y: number } } | null>(null);
  
  const updateRequestStatus = useStore(state => state.updateRequestStatus);
  const assignServer = useStore(state => state.assignServer);
  const removeRequest = useStore(state => state.removeRequest);
  const processBatchAtLB = useStore(state => state.processBatchAtLB);
  const isAutoMode = useStore(state => state.isAutoMode);

  useEffect(() => {
    // Determine source and target DOM IDs based on status
    let fromId = '';
    let toId = '';

    switch (request.status) {
      case RequestStatus.CLIENT_TO_LB:
        fromId = `client-${request.clientId}`;
        toId = 'lb-node';
        break;
      case RequestStatus.AT_LB:
        fromId = 'lb-node';
        toId = 'lb-node';
        break;
      case RequestStatus.LB_TO_SERVER:
        fromId = 'lb-node';
        toId = `server-${request.serverId}`;
        break;
      case RequestStatus.AT_SERVER:
        fromId = `server-${request.serverId}`;
        toId = `server-${request.serverId}`;
        break;
      case RequestStatus.SERVER_TO_LB:
        fromId = `server-${request.serverId}`;
        toId = 'lb-node';
        break;
      case RequestStatus.LB_TO_CLIENT:
        fromId = 'lb-node';
        toId = `client-${request.clientId}`;
        break;
      case RequestStatus.COMPLETED:
        // No animation coords needed, it will unmount
        return;
    }

    const fromEl = document.getElementById(fromId);
    const toEl = document.getElementById(toId);

    if (fromEl && toEl) {
      const fromRect = fromEl.getBoundingClientRect();
      const toRect = toEl.getBoundingClientRect();

      setCoords({
        from: { x: fromRect.left + fromRect.width / 2, y: fromRect.top + fromRect.height / 2 },
        to: { x: toRect.left + toRect.width / 2, y: toRect.top + toRect.height / 2 }
      });
    }
  }, [request.status, request.clientId, request.serverId]);

  const styles = useSpring({
    from: { left: coords?.from.x || 0, top: coords?.from.y || 0 },
    to: { left: coords?.to.x || 0, top: coords?.to.y || 0 },
    reset: true,
    config: { duration: 800 }, // Travel time
    onRest: () => {
      if (!coords) return;

      switch (request.status) {
        case RequestStatus.CLIENT_TO_LB:
          updateRequestStatus(request.id, RequestStatus.AT_LB);
          
          if (request.type === 'BATCH') {
            // Processing batch takes a moment visually, then explodes
            setTimeout(() => processBatchAtLB(request.id), 300);
          } else {
            // Only auto-assign if we are in auto mode
            if (isAutoMode) {
                setTimeout(() => assignServer(request.id), 300);
            }
          }
          break;
        case RequestStatus.LB_TO_SERVER:
          updateRequestStatus(request.id, RequestStatus.AT_SERVER);
          break;
        case RequestStatus.SERVER_TO_LB:
          updateRequestStatus(request.id, RequestStatus.LB_TO_CLIENT);
          break;
        case RequestStatus.LB_TO_CLIENT:
          updateRequestStatus(request.id, RequestStatus.COMPLETED);
          removeRequest(request.id);
          break;
      }
    },
    // Pause if no coords. If status is AT_LB, we still want to render at 'to' coords, 
    // effectively pausing movement but keeping element visible.
    pause: !coords || request.status === RequestStatus.AT_LB
  });

  // Hide the packet when it is at the server (displayed in list) OR waiting at LB (Manual mode)
  if (!coords || request.status === RequestStatus.AT_SERVER || request.status === RequestStatus.AT_LB) return null;

  return (
    <animated.div
      style={{
        ...styles,
        position: 'fixed',
        zIndex: 50,
        transform: 'translate(-50%, -50%)',
      }}
      className="pointer-events-none"
    >
      <div 
        className="relative flex items-center justify-center"
      >
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white transition-all duration-300"
          style={{ 
            backgroundColor: request.color,
            transform: request.type === 'BATCH' ? 'scale(1.2)' : 'scale(1)'
          }}
        >
          {request.type === 'BATCH' ? <Layers size={16} className="text-white" /> : <FileCode2 size={16} className="text-white" />}
        </div>
        
        {/* Count Badge for Batch */}
        {request.type === 'BATCH' && (
           <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border border-white">
             {request.batchCount}
           </div>
        )}

        {/* Label */}
        <div className="absolute top-9 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-md">
          {request.payload}
        </div>
      </div>
    </animated.div>
  );
};

export default React.memo(PacketComponent);