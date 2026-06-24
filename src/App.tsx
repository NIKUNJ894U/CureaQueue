/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Building2, 
  Tv, 
  Users, 
  Activity, 
  Activity as StatsIcon,
  Wifi,
  WifiOff,
  Clock,
  LayoutGrid,
  Sun,
  Moon
} from 'lucide-react';
import { QueueState, QueueAction, ClientMessage, ServerMessage } from './types';
import ReceptionistPanel from './components/ReceptionistPanel';
import WaitingRoomPanel from './components/WaitingRoomPanel';
import ClinicalAuditReport from './components/ClinicalAuditReport';
import LandingPage from './components/LandingPage';
import CuraQueueLogo from './components/CuraQueueLogo';
import LobbyTVMode from './components/LobbyTVMode';

export default function App() {
  const [state, setState] = useState<QueueState | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('disconnected');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [currentTab, setCurrentTab] = useState<'home' | 'dual' | 'reception' | 'monitor' | 'audit' | 'tv-fullscreen'>('home');
  const [isReceptionAuthenticated, setIsReceptionAuthenticated] = useState(false);


  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const pingIntervalRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef<number>(0);

  // Helper: Clear any active timers
  const clearTimers = () => {
    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (pingIntervalRef.current) {
      window.clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  };

  // Fallback REST fetching for resilience
  const fetchStateFallback = async () => {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        setState(data);
      }
    } catch (err) {
      console.warn("Fallback state retrieval polling error:", err);
    }
  };

  // Primary WebSocket constructor
  const connectWebSocket = () => {
    clearTimers();
    
    const isHttps = window.location.protocol === 'https:';
    const wsProtocol = isHttps ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}`;

    console.log(`[ClinicSync] Initiating connection to ${wsUrl}...`);
    setConnectionStatus(reconnectAttemptRef.current > 0 ? 'reconnecting' : 'disconnected');

    try {
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        console.log('[ClinicSync] WebSocket pipeline secured and synchronized.');
        setConnectionStatus('connected');
        reconnectAttemptRef.current = 0; // reset retry counter

        // Configure dynamic PING heartbeats every 5 seconds to track network latency jitter
        pingIntervalRef.current = window.setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            const pingPayload: ClientMessage = { type: 'PING', ts: Date.now() };
            socket.send(JSON.stringify(pingPayload));
          }
        }, 5000);
      };

      socket.onmessage = (event) => {
        try {
          const data: ServerMessage = JSON.parse(event.data);
          
          if (data.type === 'STATE_INIT' || data.type === 'STATE_UPDATE') {
            setState(data.state);
          } else if (data.type === 'PONG') {
            const now = Date.now();
            const originalTs = data.ts;
            const diff = now - originalTs;
            setLatencyMs(diff);
          }
        } catch (err) {
          console.error('[ClinicSync] Payload processing error:', err);
        }
      };

      socket.onclose = (event) => {
        console.warn(`[ClinicSync] Websocket disconnect observed (code: ${event.code}). Triaging retry...`);
        setConnectionStatus('disconnected');
        setLatencyMs(null);
        scheduleReconnection();
      };

      socket.onerror = (error) => {
        console.error('[ClinicSync] WebSocket error flagged:', error);
        // Error closures are handled safely by socket.onclose
      };

    } catch (err) {
      console.error('[ClinicSync] Execution breakdown in socket creator:', err);
      scheduleReconnection();
    }
  };

  // Exponential Backoff connector
  const scheduleReconnection = () => {
    clearTimers();
    
    // Cap exponential sequence caps safely at 16s to avoid lockouts
    const attempt = reconnectAttemptRef.current;
    const delay = Math.min(1000 * Math.pow(2, attempt), 16000);
    console.log(`[ClinicSync] Queueing reconnection retry #${attempt + 1} in ${delay}ms...`);

    reconnectTimeoutRef.current = window.setTimeout(() => {
      reconnectAttemptRef.current += 1;
      connectWebSocket();
    }, delay);
  };

  // Initialize and tear down connections gracefully
  useEffect(() => {
    // Initial data pull
    fetchStateFallback();
    
    // Secure WebSocket tunnel
    connectWebSocket();

    // Secondary Polling backup loop: if connection falls flat, HTTP polls every 4s
    const fallbackPollInterval = window.setInterval(() => {
      if (connectionStatus !== 'connected') {
        console.log("[ClinicSync] WebSocket offline. Engaging REST health-poll cycle.");
        fetchStateFallback();
      }
    }, 4000);

    return () => {
      clearTimers();
      window.clearInterval(fallbackPollInterval);
      if (wsRef.current) {
        wsRef.current.onclose = null; // isolate unmounting triggers
        wsRef.current.close();
      }
    };
  }, [connectionStatus]);

  // Command Action Dispatcher
  const sendAction = (action: QueueAction) => {
    // 1. Optimistic layout updates where possible for instant local clicking satisfaction
    if (state) {
      const optimisticState = { ...state };
      if (action.type === 'UPDATE_CONSULT_TIME') {
        optimisticState.averageConsultTime = action.mins;
        setState(optimisticState);
      }
    }

    // 2. Broadcast via socket if online
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const msg: ClientMessage = { type: 'ACTION', action };
      wsRef.current.send(JSON.stringify(msg));
    } else {
      // 3. Resilient endpoint posting fallback
      console.log("[ClinicSync] WebSocket unavailable. Forwarding action over REST Bridge...", action);
      fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action)
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error("API dispatch down");
      })
      .then(data => {
        if (data.success && data.state) {
          setState(data.state);
        }
      })
      .catch(err => {
        console.error("[ClinicSync] Error triggering action fallback:", err);
      });
    }
  };

  return (
    <div className="min-h-screen text-slate-800 flex flex-col antialiased">
      
      {/* Sleek Interface Header */}
      {currentTab !== 'tv-fullscreen' && (
        <header className="glass border-b border-slate-200 sticky top-0 z-30 shadow-xs bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Brand Identity with SVG Logo */}
          <div className="flex items-center gap-3">
            <div className="cursor-pointer" onClick={() => setCurrentTab('home')}>
              <CuraQueueLogo size={42} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-slate-800 leading-none cursor-pointer" onClick={() => setCurrentTab('home')}>CuraQueue</h1>
              </div>
              <p className="text-slate-400 text-[10px] mt-1 font-extrabold uppercase tracking-wider">
                Live Coordinator Console
              </p>
            </div>
          </div>



          {/* Navigation Tabs */}
          <nav className="flex bg-slate-100/80 p-0.5 rounded-xl border border-slate-200 gap-1 text-[11px] sm:text-xs flex-wrap justify-center">
            <button
              onClick={() => setCurrentTab('home')}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 font-bold transition rounded-lg cursor-pointer ${
                currentTab === 'home'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/10'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <LayoutGrid size={13} />
              Home Landing
            </button>
            <button
              onClick={() => setCurrentTab('dual')}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 font-bold transition rounded-lg cursor-pointer ${
                currentTab === 'dual'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/10'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Users size={13} />
              Dual Preview Screen
            </button>
            <button
              onClick={() => setCurrentTab('reception')}
              className={`flex items-center gap-1.5 px-3.5 py-2 font-bold transition rounded-lg cursor-pointer ${
                currentTab === 'reception'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/10'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Users size={13} />
              Reception Panel
            </button>
            <button
              onClick={() => setCurrentTab('monitor')}
              className={`flex items-center gap-1.5 px-3.5 py-2 font-bold transition rounded-lg cursor-pointer ${
                currentTab === 'monitor'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/10'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Tv size={13} />
              Lobby TV Monitor
            </button>
            <button
              onClick={() => setCurrentTab('audit')}
              className={`flex items-center gap-1.5 px-3.5 py-2 font-bold transition rounded-lg cursor-pointer ${
                currentTab === 'audit'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/10'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Activity size={13} />
              Clinical Audit
            </button>
            <button
              onClick={() => setCurrentTab('tv-fullscreen')}
              className={`flex items-center gap-1.5 px-3.5 py-2 font-bold transition rounded-lg cursor-pointer ${
                currentTab === 'tv-fullscreen'
                  ? 'bg-red-500 text-white shadow-md shadow-red-500/10'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Tv size={13} />
              🖥️ TV Fullscreen
            </button>
          </nav>
        </div>
      </header>
      )}

      {/* Main Container Layout */}
      <main className={`flex-1 flex flex-col justify-start ${
        currentTab === 'home' || currentTab === 'tv-fullscreen' 
          ? 'w-full' 
          : 'max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8'
      }`}>
        {!state ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-20">
            <Activity className="animate-spin-slow text-blue-600 mb-3" size={36} />
            <p className="text-sm font-semibold">Synchronizing Clinic Queue State...</p>
            <p className="text-xs text-slate-400 mt-1">Connecting to Express Server WS Bridge</p>
          </div>
        ) : (
          <div className="flex-1">
            
            {/* View renders */}
            {currentTab === 'home' && (
              <LandingPage state={state} onNavigate={(tab) => setCurrentTab(tab)} />
            )}

            {currentTab === 'dual' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                {/* Desk Side */}
                <div className="h-full">
                  <ReceptionistPanel
                    state={state}
                    sendAction={sendAction}
                    latencyMs={latencyMs}
                    connectionStatus={connectionStatus}
                    isAuthenticatedForReception={isReceptionAuthenticated}
                    onAuthenticate={() => setIsReceptionAuthenticated(true)}
                  />
                </div>
                
                {/* Screen Side */}
                <div className="h-full">
                  <WaitingRoomPanel state={state} />
                </div>
              </div>
            )}

            {currentTab === 'reception' && (
              <div className="max-w-xl mx-auto w-full">
                <ReceptionistPanel
                  state={state}
                  sendAction={sendAction}
                  latencyMs={latencyMs}
                  connectionStatus={connectionStatus}
                  isAuthenticatedForReception={isReceptionAuthenticated}
                  onAuthenticate={() => setIsReceptionAuthenticated(true)}
                />
              </div>
            )}

            {currentTab === 'monitor' && (
              <div className="max-w-xl mx-auto w-full">
                <WaitingRoomPanel state={state} />
              </div>
            )}

            {currentTab === 'audit' && (
              <div className="w-full">
                <ClinicalAuditReport />
              </div>
            )}

            {currentTab === 'tv-fullscreen' && (
              <div className="fixed inset-0 z-50 bg-slate-900 overflow-y-auto">
                <LobbyTVMode state={state} enableVoice={true} onExitFullscreen={() => setCurrentTab('home')} />
              </div>
            )}

          </div>
        )}
      </main>

      {/* Universal Status Footer */}
      {currentTab !== 'tv-fullscreen' && (
        <footer className="bg-slate-100 border-t border-slate-200 py-3 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-2">
            <span>
              Designed for <strong>India's clinical healthcare adoption</strong> efforts. Offline resilience guaranteed.
            </span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                Server Time: {new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </span>
              <span className="border-l border-slate-200 pl-3">
                Client Engine v1.0
              </span>

            </div>
          </div>
        </footer>
      )}

      {/* Brand selector removed - using single site logo across pages */}

    </div>
  );
}

