/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Tv, 
  Hourglass, 
  Clock, 
  Search, 
  CheckCircle2, 
  Users, 
  CircleDot,
  HeartPulse,
  Signal,
  HelpCircle,
  BarChart2,
  Volume2,
  VolumeX,
  HelpCircle as QuestionIcon
} from 'lucide-react';
import { QueueState, Patient } from '../types';

interface WaitingRoomPanelProps {
  state: QueueState;
}

export default function WaitingRoomPanel({ state }: WaitingRoomPanelProps) {
  const [selectedTokenNum, setSelectedTokenNum] = useState<number | ''>('');
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState<{
    found: boolean;
    patient?: Patient;
    tokensAhead?: number;
    estWaitMinutes?: number;
  } | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const prevPatientsRef = useRef<Patient[]>(state.patients);

  const playChime = () => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) {
        console.warn("Speech/Audio API not fully supported.");
        return;
      }
      const audioCtx = new AudioCtxClass();
      
      // Tone 1 (ding) - High crisp pitch
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5 note
      gain1.gain.setValueAtTime(0, audioCtx.currentTime);
      gain1.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime + 0.04);
      gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
      
      osc1.start(audioCtx.currentTime);
      osc1.stop(audioCtx.currentTime + 0.48);
      
      // Tone 2 (dong) - Deep medical chime pitch
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(523.25, audioCtx.currentTime + 0.12); // C5 note
      gain2.gain.setValueAtTime(0, audioCtx.currentTime + 0.12);
      gain2.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime + 0.16);
      gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.65);
      
      osc2.start(audioCtx.currentTime + 0.12);
      osc2.stop(audioCtx.currentTime + 0.68);
    } catch (err) {
      console.error("Clinical audio chime synthesis failed:", err);
    }
  };

  const handleToggleAudio = () => {
    const nextVal = !audioEnabled;
    setAudioEnabled(nextVal);
    if (nextVal) {
      // Play a short demonstration chime to verify audio works and bypass browser gesture blocking
      setTimeout(() => {
        playChime();
      }, 50);
    }
  };

  useEffect(() => {
    const prev = prevPatientsRef.current;
    if (prev && prev.length > 0) {
      const becameCurrent = state.patients.some(p => {
        if (p.status === 'current') {
          const old = prev.find(oldP => oldP.id === p.id);
          // Only play if they were in previous list as 'waiting'
          return old && old.status === 'waiting';
        }
        return false;
      });

      if (becameCurrent && audioEnabled) {
        playChime();
      }
    }
    prevPatientsRef.current = state.patients;
  }, [state.patients, audioEnabled]);

  // Filter active (non-cancelled) patients
  const activePatients = state.patients.filter(p => p.status !== 'cancelled');
  const currentPatient = activePatients.find(p => p.status === 'current');
  const waitingPatients = activePatients.filter(p => p.status === 'waiting');

  const handleSearchToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTokenNum === '') {
      setSearchFeedback(null);
      return;
    }

    const tNum = Number(selectedTokenNum);
    // Find patient in entire state
    const p = state.patients.find(pat => pat.token === tNum);

    if (!p) {
      setSearchFeedback({ found: false });
      return;
    }

    if (p.status === 'seen') {
      setSearchFeedback({
        found: true,
        patient: p,
        tokensAhead: 0,
        estWaitMinutes: 0
      });
      return;
    }

    if (p.status === 'current') {
      setSearchFeedback({
        found: true,
        patient: p,
        tokensAhead: 0,
        estWaitMinutes: 0
      });
      return;
    }

    if (p.status === 'cancelled') {
      setSearchFeedback({
        found: true,
        patient: p,
        tokensAhead: -1,
        estWaitMinutes: -1
      });
      return;
    }

    // It's waiting. Let's count how many patients are waiting BEFORE this patient.
    // Order in state.patients defines check-in order.
    const waitingList = state.patients.filter(pat => pat.status === 'waiting');
    const indexInWaiting = waitingList.findIndex(pat => pat.id === p.id);

    // Tokens ahead = index in waitingList + 1 (since current is with doctor, and first waiting is next).
    // Let's count precisely:
    const ahead = indexInWaiting; // patients waiting in front of them
    const waitTime = (ahead + 1) * state.averageConsultTime; // Wait time is (ahead + current remaining/buffer) = (ahead + 1) * pace

    setSearchFeedback({
      found: true,
      patient: p,
      tokensAhead: ahead + 1, // Including the one currently being seen, there are 'ahead' people waiting + 1 current with doctor
      estWaitMinutes: waitTime
    });
  };

  // Calculate dynamic average queue values
  const totalWaitingCount = waitingPatients.length;
  const globalEstimatedWait = totalWaitingCount * state.averageConsultTime;

  // Support up to 8 waiting patients in the visual bar chart representation to keep it crisp
  const chartPatients = waitingPatients.slice(0, 8);
  const avgPace = state.averageConsultTime || 10;
  
  const waitTimesData = chartPatients.map((p, index) => {
    const ahead = index;
    const estWait = (ahead + 1) * avgPace;
    return {
      token: `${p.token}`,
      name: p.name,
      wait: estWait,
    };
  });

  // Scale calculations for SVG rendering
  const maxTimeInChart = waitTimesData.length > 0 
    ? waitTimesData[waitTimesData.length - 1].wait 
    : 0;
  const yCeiling = Math.max(maxTimeInChart + 10, avgPace + 15, 30);

  const plotLeft = 45;
  const plotRight = 475;
  const plotTop = 25;
  const plotBottom = 155;
  const plotHeight = plotBottom - plotTop; // 130px
  const plotWidth = plotRight - plotLeft;  // 430px
  
  const yReference = plotBottom - (plotHeight * (avgPace / yCeiling));

  return (
    <div id="waiting-room-panel-root" className="glass rounded-2xl shadow-xl p-6 text-slate-800 flex flex-col h-full relative overflow-hidden font-sans">
      
      {/* Background clinical layout highlights */}
      <div className="absolute inset-0 bg-radial-gradient(from_center,_rgba(14,165,233,0.02)_1px,_transparent_1px) [background-size:16px_16px] pointer-events-none"></div>

      {/* Screen Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-5 mb-5 relative z-10 select-none">
        <div className="flex items-center gap-3">
          <div className="p-1 px-3 bg-sky-50 text-sky-600 text-xs font-bold rounded-full border border-sky-100 uppercase tracking-wider flex items-center gap-1.5">
            <Tv size={12} className="animate-pulse" />
            Lobby Monitor
          </div>
          <h2 className="text-sm font-extrabold text-slate-800 tracking-tight uppercase">Waiting Hall Display</h2>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Audio Chime Permissive Controller */}
          <button
            onClick={handleToggleAudio}
            title={audioEnabled ? "Disable chime notifications" : "Enable chime notifications"}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              audioEnabled
                ? 'bg-emerald-50 text-emerald-700 border-emerald-250 shadow-xs'
                : 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse shadow-xs'
            }`}
          >
            {audioEnabled ? (
              <>
                <Volume2 size={12} className="text-emerald-600" />
                <span>Chime Active</span>
              </>
            ) : (
              <>
                <VolumeX size={12} className="text-rose-500" />
                <span>Muted (Turn On)</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2 text-[10px] font-extrabold text-sky-600 uppercase tracking-widest font-mono">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping2"></span>
            Real-Time Broadcast
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-6 relative z-10 overflow-y-auto">
        
        {/* Massive Clinic Caller Billboard */}
        <div className={`transition-all duration-300 rounded-2xl p-7 text-center relative overflow-hidden shadow-lg flex flex-col items-center justify-center min-h-[175px] ${
          currentPatient?.isEmergency
            ? 'bg-gradient-to-br from-rose-700 via-rose-800 to-amber-800 ring-4 ring-rose-500/20'
            : 'bg-gradient-to-br from-sky-500 to-sky-600 text-white'
        }`}>
          
          {/* Animated decorative radar rings when patient is with doctor */}
          {currentPatient && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <div className="w-32 h-32 rounded-full border border-white/40 animate-radar"></div>
              <div className="w-48 h-48 rounded-full border border-white/30 animate-radar"></div>
            </div>
          )}

          {currentPatient?.isEmergency && (
            <div className="absolute inset-0 bg-red-950/20 animate-pulse pointer-events-none" />
          )}

          <p className="text-[10px] font-black tracking-widest text-sky-100 uppercase mb-2.5 flex items-center gap-1.5 z-10">
            {currentPatient?.isEmergency ? (
              <span className="bg-red-600 border border-red-400 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-bounce shadow-md">
                🚨 EMERGENCY PRIORITY CASE
              </span>
            ) : (
              <>
                <HeartPulse size={12} className="animate-pulse text-white" /> Now with the Consultant
              </>
            )}
          </p>

          <div className="relative">
            {currentPatient ? (
              <>
                <h3 className="text-6xl md:text-7xl font-black text-white leading-none tracking-tight font-sans drop-shadow-md">
                  T-{currentPatient.token}
                </h3>
                <p className="text-sky-100 text-sm font-bold tracking-wide mt-2">
                  {currentPatient.name}
                </p>
                <span className="inline-flex items-center gap-1.5 mt-3 px-3.5 py-1 bg-white/10 text-white border border-white/10 text-xs font-semibold rounded-full uppercase tracking-wider">
                  Please proceed to Cabin #1
                </span>
              </>
            ) : (
              <>
                <h3 className="text-4xl font-black text-white/50 italic py-4">
                  No Active Token
                </h3>
                <p className="text-white/70 text-xs font-semibold">
                  The medical assistant is organizing the queue...
                </p>
              </>
            )}
          </div>
        </div>

        {/* Dynamic Wait Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50/70 border border-slate-200/80 p-4 rounded-xl text-center flex flex-col justify-between">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1.5 flex items-center justify-center gap-1.5">
              <Users size={12} className="text-slate-400" /> Pending Queue
            </div>
            <div className="text-xl font-bold font-mono text-amber-600">
              {totalWaitingCount} <span className="text-xs font-semibold text-slate-400">tokens ahead</span>
            </div>
          </div>

          <div className="bg-slate-50/70 border border-slate-200/80 p-4 rounded-xl text-center flex flex-col justify-between">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1.5 flex items-center justify-center gap-1.5">
              <Hourglass size={12} className="text-slate-400" /> General Est. Wait
            </div>
            <div className="text-xl font-bold font-mono text-sky-600">
              {globalEstimatedWait > 0 ? `${globalEstimatedWait} min` : 'Next up!'}
            </div>
          </div>
        </div>

        {/* Wait Times Distribution Bar Chart */}
        <div className="border border-slate-200 rounded-xl p-4.5 bg-slate-50/50 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <BarChart2 size={14} className="text-sky-500" />
              <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Distribution of Waiting Times
              </h4>
            </div>
            <span className="text-[10px] text-slate-400 font-bold bg-white border border-slate-200 px-2 py-0.5 rounded-md">
              Target: {avgPace}m per patient
            </span>
          </div>

          {waitTimesData.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mb-1.5">
                <BarChart2 className="text-slate-400" size={18} />
              </div>
              <p className="text-xs font-bold text-slate-500">No Pending Waiting Times</p>
              <p className="text-[10px] text-slate-400 mt-0.5 max-w-[240px]">
                The lobby queue is empty. New patient entries will propagate here in real-time.
              </p>
            </div>
          ) : (
            <div className="relative">
              <svg 
                viewBox="0 0 500 220" 
                className="w-full h-auto select-none overflow-visible"
              >
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.4" />
                  </linearGradient>
                  <linearGradient id="activeBarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0284c7" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#0369a1" stopOpacity="0.6" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                {/* Baseline */}
                <line x1={plotLeft} y1={plotBottom} x2={plotRight} y2={plotBottom} stroke="#cbd5e1" strokeWidth="1" />
                {/* Half ceiling line */}
                <line 
                  x1={plotLeft} 
                  y1={plotTop + plotHeight / 2} 
                  x2={plotRight} 
                  y2={plotTop + plotHeight / 2} 
                  stroke="#e2e8f0" 
                  strokeWidth="1" 
                  strokeDasharray="2 2" 
                />
                {/* Ceiling line */}
                <line x1={plotLeft} y1={plotTop} x2={plotRight} y2={plotTop} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="2 2" />

                {/* Y Axis Labels */}
                <text x={plotLeft - 8} y={plotBottom + 3} textAnchor="end" className="text-[9px] font-bold fill-slate-400 font-mono">0m</text>
                <text x={plotLeft - 8} y={plotTop + plotHeight / 2 + 3} textAnchor="end" className="text-[9px] font-bold fill-slate-400 font-mono">
                  {Math.round(yCeiling / 2)}m
                </text>
                <text x={plotLeft - 8} y={plotTop + 3} textAnchor="end" className="text-[9px] font-bold fill-slate-400 font-mono">{yCeiling}m</text>

                {/* Doctor's Average Consultation reference line */}
                <line 
                  x1={plotLeft - 5} 
                  y1={yReference} 
                  x2={plotRight + 5} 
                  y2={yReference} 
                  stroke="#0ea5e9" 
                  strokeWidth="1.5" 
                  strokeDasharray="4 4" 
                />
                
                {/* Reference line highlight label */}
                <text 
                  x={plotRight} 
                  y={yReference - 5} 
                  textAnchor="end" 
                  className="text-[9px] font-extrabold fill-sky-600 uppercase tracking-widest font-mono"
                >
                  Clinic Avg Pace ({avgPace} min)
                </text>

                {/* Columns rendering */}
                {(() => {
                  const colWidth = plotWidth / waitTimesData.length;
                  const barWidth = Math.min(colWidth * 0.5, 30);
                  
                  return waitTimesData.map((item, index) => {
                    const xCenter = plotLeft + colWidth * (index + 0.5);
                    const xBar = xCenter - barWidth / 2;
                    const barHeight = plotHeight * (item.wait / yCeiling);
                    const yBar = plotBottom - barHeight;
                    const isHovered = hoveredIndex === index;

                    return (
                      <g 
                        key={index} 
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      >
                        {/* Interactive Invisible Hover Zone */}
                        <rect 
                          x={xCenter - colWidth / 2} 
                          y={plotTop} 
                          width={colWidth} 
                          height={plotHeight} 
                          fill="transparent" 
                        />

                        {/* Flat baseline patch to make rounded corners grounded */}
                        <rect 
                          x={xBar} 
                          y={plotBottom - 4} 
                          width={barWidth} 
                          height={4} 
                          fill={isHovered ? "url(#activeBarGradient)" : "url(#barGradient)"} 
                          className="transition-all duration-200"
                        />

                        {/* Principal rounded bar */}
                        <rect 
                          x={xBar} 
                          y={yBar} 
                          width={barWidth} 
                          height={barHeight} 
                          rx={4} 
                          fill={isHovered ? "url(#activeBarGradient)" : "url(#barGradient)"} 
                          className="transition-all duration-200"
                        />

                        {/* Value indicator on top of bar */}
                        <text 
                          x={xCenter} 
                          y={yBar - 6} 
                          textAnchor="middle" 
                          className="text-[9px] font-black font-mono fill-sky-700"
                        >
                          {item.wait}m
                        </text>

                        {/* Patient Token Text label */}
                        <text 
                          x={xCenter} 
                          y={plotBottom + 16} 
                          textAnchor="middle" 
                          className="text-[10px] font-bold fill-slate-500 font-mono"
                        >
                          T-{item.token}
                        </text>

                        {/* Patient Name Text label */}
                        <text 
                          x={xCenter} 
                          y={plotBottom + 28} 
                          textAnchor="middle" 
                          className="text-[9px] font-bold fill-slate-400 font-sans"
                        >
                          {item.name.split(' ')[0]}
                        </text>
                      </g>
                    );
                  });
                })()}

                {/* Floating dynamic rich tooltip */}
                {hoveredIndex !== null && waitTimesData[hoveredIndex] && (
                  <g className="pointer-events-none">
                    {(() => {
                      const item = waitTimesData[hoveredIndex];
                      const colWidth = plotWidth / waitTimesData.length;
                      const xCenter = plotLeft + colWidth * (hoveredIndex + 0.5);
                      const barHeight = plotHeight * (item.wait / yCeiling);
                      const yBar = plotBottom - barHeight;
                      const tooltipY = Math.max(yBar - 34, 10);
                      
                      return (
                        <>
                          <rect
                            x={xCenter - 65}
                            y={tooltipY - 14}
                            width={130}
                            height={24}
                            rx={6}
                            fill="#0f172a"
                            stroke="#1e293b"
                            strokeWidth="1"
                          />
                          <polygon
                            points={`${xCenter - 4},${tooltipY + 10} ${xCenter + 4},${tooltipY + 10} ${xCenter},${tooltipY + 14}`}
                            fill="#0f172a"
                          />
                          <text
                            x={xCenter}
                            y={tooltipY + 1}
                            textAnchor="middle"
                            className="text-[9px] font-black fill-white font-sans"
                          >
                            {item.name}: {item.wait} mins wait
                          </text>
                        </>
                      );
                    })()}
                  </g>
                )}
              </svg>
              <div className="text-[9px] text-slate-400 font-bold text-center mt-1">
                Hover over specific bars to query detailed patient estimates
              </div>
            </div>
          )}
        </div>

        {/* Personalized "Patient Token Locator Search" */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
            <Search size={14} className="text-slate-400" />
            Check Your Live Slot Position
          </h4>
          <form onSubmit={handleSearchToken} className="flex gap-2">
            <input
              type="number"
              value={selectedTokenNum}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedTokenNum(val === '' ? '' : Number(val));
              }}
              min={1}
              placeholder="Enter your token number (e.g. 3)"
              className="flex-1 bg-white border border-slate-250 text-xs rounded-xl px-3.5 h-10 text-slate-700 outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 font-mono font-bold"
            />
            <button
              type="submit"
              className="bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold px-4.5 h-10 rounded-xl shadow-md shadow-sky-500/10 transition-all cursor-pointer uppercase tracking-wider"
            >
              Analyze
            </button>
          </form>

          {/* Search Verdict output */}
          {searchFeedback && (
            <div className="mt-3.5 p-3.5 bg-white border border-slate-200 rounded-xl text-xs leading-relaxed animate-fade-in shadow-xs">
              {searchFeedback.found ? (
                <div className="space-y-1.5">
                  <p className="font-bold text-slate-700">
                    Roster Status: <span className="text-sky-600 font-black">{searchFeedback.patient?.name}</span> (Token #{searchFeedback.patient?.token})
                  </p>
                  {searchFeedback.patient?.status === 'waiting' && (
                    <div className="space-y-1.5 mt-2 text-slate-600">
                      <p className="font-semibold">
                        Outstanding Tokens Ahead: <span className="text-amber-600 font-black font-mono">{searchFeedback.tokensAhead}</span>
                      </p>
                      <p className="font-semibold">
                        Estimated Wait Time: <span className="text-sky-600 font-black font-mono">~{searchFeedback.estWaitMinutes} min</span>
                      </p>
                      <p className="text-[10px] text-slate-400 italic font-medium leading-normal pt-1 border-t border-slate-100">
                        *Estimates fluctuate based on active clinical cases. Please remain in the waiting hall.
                      </p>
                    </div>
                  )}
                  {searchFeedback.patient?.status === 'current' && (
                    <p className="text-emerald-600 font-black flex items-center gap-1">
                      <CheckCircle2 size={13} /> You are being consulted! Please proceed to Cabin #1 right now.
                    </p>
                  )}
                  {searchFeedback.patient?.status === 'seen' && (
                    <p className="text-slate-500 font-bold italic flex items-center gap-1">
                      <CheckCircle2 size={13} className="text-slate-400" /> Ticket called and completed. Thank you!
                    </p>
                  )}
                  {searchFeedback.patient?.status === 'cancelled' && (
                    <p className="text-rose-500 font-bold italic">
                      ⚠️ This slot was marked as cancelled by registration. Please verify with desk.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-rose-500 font-bold">
                  ❌ Token number not found in today's active schedule. Please check with reception.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Scrollable Timeline tracker */}
        <div className="flex-1 flex flex-col">
          <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 font-sans">
            <CircleDot size={12} className="text-sky-500" /> Live Lobby Timeline Board
          </p>
          <div className="flex-1 border border-slate-200 rounded-xl bg-slate-50/20 overflow-y-auto max-h-[220px]">
            {activePatients.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs italic font-medium">
                Waiting room is currently empty.
              </div>
            ) : (
              <div className="p-3.5 space-y-2">
                {activePatients.map((p) => {
                  const isCurrent = p.status === 'current';
                  const isSeen = p.status === 'seen';
                  const isEmergency = !!p.isEmergency;

                  return (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-all ${
                        isCurrent
                          ? isEmergency 
                            ? 'bg-rose-50 border-rose-500 text-slate-800 font-bold shadow-xs'
                            : 'bg-sky-50 border-sky-400/30 text-slate-800 font-bold shadow-xs'
                          : isSeen
                          ? 'bg-slate-100/40 border-slate-150 opacity-50 text-slate-400 line-through'
                          : isEmergency
                          ? 'bg-rose-50/75 border-rose-250 text-rose-950 font-semibold shadow-xs animate-pulse-slow'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-10 h-6 text-[10px] font-black font-mono rounded-lg flex items-center justify-center ${
                          isCurrent
                            ? isEmergency
                              ? 'bg-rose-600 text-white animate-pulse'
                              : 'bg-sky-500 text-white'
                            : isSeen
                            ? 'bg-slate-200 text-slate-500'
                            : isEmergency
                            ? 'bg-rose-600 text-white border border-rose-400'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          #{p.token}
                        </span>
                        <span className="truncate max-w-[120px] font-semibold flex items-center gap-1.5">
                          {p.name}
                          {isEmergency && !isSeen && (
                            <span className="text-[8px] font-extrabold bg-rose-100 text-rose-700 border border-rose-200 px-1 rounded animate-pulse uppercase tracking-wider">
                              Emerg
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Status badge */}
                      <div>
                        {isCurrent ? (
                          <span className={`px-2 py-1 font-black text-[9px] uppercase tracking-wider rounded-lg border animate-pulse ${
                            isEmergency
                              ? 'bg-rose-100 text-rose-850 border-rose-300'
                              : 'bg-sky-100 text-sky-850 border border-sky-200'
                          }`}>
                            Consulting
                          </span>
                        ) : isSeen ? (
                          <span className="text-[9px] font-bold text-slate-400">
                            Completed
                          </span>
                        ) : (
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            isEmergency
                              ? 'bg-rose-100 border border-rose-200 text-rose-700'
                              : 'bg-slate-50/40 border border-slate-150 text-slate-400'
                          }`}>
                            {isEmergency ? 'Priority Call' : `Lobby (${waitingPatients.findIndex(pat => pat.id === p.id) + 1} behind)`}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
