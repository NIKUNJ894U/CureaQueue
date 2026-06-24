/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Tv,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Volume2,
  Zap,
  Users,
  BarChart3,
  X,
} from 'lucide-react';
import { QueueState, Patient } from '../types';
import { voiceAnnouncer } from '../services/VoiceAnnouncer';
import { analyticsService } from '../services/QueueAnalytics';
import HealthTipDisplay from './HealthTipDisplay';

interface LobbyTVModeProps {
  state: QueueState;
  enableVoice?: boolean;
  onExitFullscreen?: () => void;
}

export default function LobbyTVMode({ state, enableVoice = true, onExitFullscreen }: LobbyTVModeProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [analytics, setAnalytics] = useState(analyticsService.analyze(state));
  const [lastAnnouncedToken, setLastAnnouncedToken] = useState<number | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(enableVoice);
  const [countdown, setCountdown] = useState<number>(0);
  const refreshIntervalRef = useRef<number | null>(null);

  const activePatients = state.patients.filter(p => p.status !== 'cancelled');
  const currentPatient = activePatients.find(p => p.status === 'current');
  const waitingPatients = activePatients.filter(p => p.status === 'waiting');
  const nextPatient = waitingPatients[0];

  // Update time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Update analytics
  useEffect(() => {
    analyticsService.recordSnapshot(state);
    setAnalytics(analyticsService.analyze(state));
  }, [state]);

  // Voice announcement on token change
  useEffect(() => {
    if (!voiceEnabled || !currentPatient) return;

    if (currentPatient.token !== lastAnnouncedToken) {
      // Small delay to ensure smooth transition
      const timeout = setTimeout(() => {
        voiceAnnouncer.announceToken(
          currentPatient.token,
          currentPatient.name.split(' ')[0],
          'Cabin 1'
        );
        setLastAnnouncedToken(currentPatient.token);
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [currentPatient, lastAnnouncedToken, voiceEnabled]);

  // Emergency alert
  useEffect(() => {
    if (!voiceEnabled || !currentPatient?.isEmergency) return;
    voiceAnnouncer.playEmergencyAlert(currentPatient.name.split(' ')[0]);
  }, [currentPatient?.isEmergency, voiceEnabled]);

  // Countdown to next patient
  useEffect(() => {
    if (!nextPatient) {
      setCountdown(0);
      return;
    }

    const updateCountdown = () => {
      const estimatedFinishMs = analytics.estimatedFinishTime(currentPatient || nextPatient, state);
      const msRemaining = estimatedFinishMs - Date.now();
      const secondsRemaining = Math.max(0, Math.round(msRemaining / 1000));
      setCountdown(secondsRemaining);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [nextPatient, currentPatient, state, analytics]);

  // Auto-refresh page every 2 hours to prevent burn-in
  useEffect(() => {
    refreshIntervalRef.current = window.setInterval(() => {
      window.location.reload();
    }, 2 * 60 * 60 * 1000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  const countdownMinutes = Math.floor(countdown / 60);
  const countdownSeconds = countdown % 60;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col p-8 overflow-hidden relative">
      {/* Top Header: Time & Date + Status */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-sky-500/10 rounded-full border border-sky-500/30">
            <Tv className="w-8 h-8 text-sky-400" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight">Clinic Queue System</h1>
            <p className="text-sky-300 text-sm mt-1">Lobby Display Mode</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-5xl font-black font-mono text-white mb-1">
              {formatTime(currentTime)}
            </div>
            <p className="text-lg text-slate-400 font-semibold">{formatDate(currentTime)}</p>
          </div>

          {onExitFullscreen && (
            <button
              onClick={onExitFullscreen}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white font-extrabold text-xs uppercase tracking-widest rounded-full transition-all duration-200 cursor-pointer shadow-lg backdrop-blur-md flex items-center gap-2 hover:scale-[1.03] active:scale-[0.97] transform shrink-0 select-none"
              title="Exit Fullscreen Mode"
            >
              <X className="w-4 h-4 text-sky-400" />
              <span>Exit TV Monitor</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Token Display - MASSIVE */}
      <div
        className={`rounded-3xl p-12 text-center mb-8 shadow-2xl transition-all duration-500 ${
          currentPatient?.isEmergency
            ? 'bg-gradient-to-br from-red-600 via-red-700 to-orange-700 ring-4 ring-red-500/50 animate-pulse'
            : 'bg-gradient-to-br from-sky-500 via-sky-600 to-cyan-600 ring-4 ring-sky-500/30'
        }`}
      >
        {/* Radar animation */}
        {currentPatient && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <div className="w-40 h-40 rounded-full border-2 border-white/40 animate-radar" />
            <div className="w-56 h-56 rounded-full border-2 border-white/20 animate-radar" />
          </div>
        )}

        <div className="relative z-10">
          {currentPatient ? (
            <>
              <p className="text-2xl font-bold text-white/80 mb-4 uppercase tracking-wider flex items-center justify-center gap-2">
                {currentPatient.isEmergency ? (
                  <>
                    <span className="text-4xl">🚨</span> EMERGENCY PRIORITY
                  </>
                ) : (
                  <>
                    <Volume2 className="w-6 h-6 animate-pulse" /> NOW WITH CONSULTANT
                  </>
                )}
              </p>
              <div className="mb-6">
                <h2 className="text-9xl font-black leading-none tracking-tight drop-shadow-lg mb-3">
                  T-{currentPatient.token}
                </h2>
                <p className="text-4xl font-bold text-white/90">{currentPatient.name}</p>
              </div>
              <div className="inline-block px-8 py-3 bg-white/15 border-2 border-white/30 rounded-2xl text-2xl font-bold backdrop-blur-sm">
                📍 Please proceed to Cabin #1
              </div>
            </>
          ) : (
            <>
              <h2 className="text-6xl font-black text-white/50 italic mb-4">No Active Token</h2>
              <p className="text-2xl text-white/60">
                The medical team is organizing the queue...
              </p>
            </>
          )}
        </div>
      </div>

      {/* Countdown to Next Patient */}
      {nextPatient && (
        <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-2 border-amber-500/50 rounded-2xl p-6 mb-8">
          <p className="text-amber-300 text-xl font-bold mb-3 flex items-center gap-2">
            <Zap className="w-6 h-6" /> Next Patient Calling In:
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-black text-white font-mono">
                {countdownMinutes}:{countdownSeconds.toString().padStart(2, '0')}
              </p>
              <p className="text-amber-200 text-sm mt-1">
                Token {nextPatient.token} • {nextPatient.name}
              </p>
            </div>
            <div className="text-right">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <div className="text-5xl font-black text-white">
                  {countdownMinutes}:{countdownSeconds.toString().padStart(2, '0')}
                </div>
              </div>
            </div>
          </div>

          {/* Visual progress bar */}
          <div className="mt-4 h-3 bg-black/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-1000 rounded-full"
              style={{
                width: `${(countdown / (state.averageConsultTime * 60)) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Queue Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {/* Total Waiting */}
        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-blue-400" />
            <p className="text-blue-300 text-xs font-bold uppercase">Waiting</p>
          </div>
          <p className="text-3xl font-black text-white">{waitingPatients.length}</p>
        </div>

        {/* Average Wait Time */}
        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-purple-400" />
            <p className="text-purple-300 text-xs font-bold uppercase">Avg Wait</p>
          </div>
          <p className="text-3xl font-black text-white">{analytics.averageWaitTime}m</p>
        </div>

        {/* Efficiency Score */}
        <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-emerald-400" />
            <p className="text-emerald-300 text-xs font-bold uppercase">Efficiency</p>
          </div>
          <p className="text-3xl font-black text-white">{analytics.efficiencyScore}%</p>
        </div>

        {/* Anomaly Status */}
        <div
          className={`bg-gradient-to-br ${
            analytics.anomalyDetected
              ? 'from-red-500/20 to-orange-500/20 border-red-500/30'
              : 'from-green-500/20 to-emerald-500/20 border-green-500/30'
          } border rounded-xl p-4`}
        >
          <div className="flex items-center gap-2 mb-2">
            {analytics.anomalyDetected ? (
              <AlertCircle className="w-5 h-5 text-red-400" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-400" />
            )}
            <p
              className={`text-xs font-bold uppercase ${
                analytics.anomalyDetected ? 'text-red-300' : 'text-green-300'
              }`}
            >
              {analytics.anomalyDetected ? 'Alert' : 'Normal'}
            </p>
          </div>
          <p className="text-sm font-black text-white">
            {analytics.anomalyDetected ? (
              <>
                {analytics.anomalyType === 'slow' && '⏱️ Running Behind'}
                {analytics.anomalyType === 'fast' && '⚡ Moving Fast'}
                {analytics.anomalyType === 'backlog' && '📈 High Backlog'}
              </>
            ) : (
              '✓ On Track'
            )}
          </p>
        </div>
      </div>

      {/* Health Tips - Gamified Entertainment */}
      <div className="mb-8">
        <HealthTipDisplay rotationInterval={8000} />
      </div>

      {/* Queue Analytics Trend — Dual Smooth Curve Chart */}
      <div className="bg-black/80 border border-slate-800 rounded-2xl p-6 mb-8 flex flex-col flex-1 min-h-[260px] shadow-2xl backdrop-blur-md relative overflow-hidden">
        {/* Glow decorative accent */}
        <div className="absolute -right-20 -top-20 w-40 h-40 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-40 h-40 rounded-full bg-violet-500/5 blur-3xl pointer-events-none" />
        
        <div className="flex items-center justify-between mb-4 shrink-0 relative z-10">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-extrabold text-white tracking-wider uppercase">Queue Trend (Last Hour)</h3>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-emerald-300 shadow-sm shadow-emerald-400/40" />
              <span className="text-emerald-300">Waiting</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-400 border border-violet-300 shadow-sm shadow-violet-400/40" />
              <span className="text-violet-300">Completed</span>
            </span>
          </div>
        </div>

        {analytics.trendData.length > 0 ? (() => {
          const trendPoints = analytics.trendData.slice(-12);
          const maxVal = Math.max(
            ...trendPoints.map(p => p.queueLength),
            ...trendPoints.map(p => p.patientsCompleted),
            1
          );

          // Chart area coordinates (in percentage)
          const padTop = 10;   // % from top
          const padBot = 88;   // % y-baseline
          const yRange = padBot - padTop;

          const toCoords = (points: number[]) =>
            points.map((val, idx) => ({
              x: (idx / Math.max(points.length - 1, 1)) * 100,
              y: padBot - (val / maxVal) * yRange,
            }));

          const waitingCoords = toCoords(trendPoints.map(p => p.queueLength));
          const completedCoords = toCoords(trendPoints.map(p => p.patientsCompleted));

          // Catmull-Rom → Cubic Bezier smooth curve builder
          const smoothPath = (coords: { x: number; y: number }[]) => {
            if (coords.length < 2) return '';
            if (coords.length === 2) return `M ${coords[0].x} ${coords[0].y} L ${coords[1].x} ${coords[1].y}`;

            const tension = 0.35;
            let d = `M ${coords[0].x} ${coords[0].y}`;

            for (let i = 0; i < coords.length - 1; i++) {
              const p0 = coords[Math.max(i - 1, 0)];
              const p1 = coords[i];
              const p2 = coords[i + 1];
              const p3 = coords[Math.min(i + 2, coords.length - 1)];

              const cp1x = p1.x + (p2.x - p0.x) * tension;
              const cp1y = p1.y + (p2.y - p0.y) * tension;
              const cp2x = p2.x - (p3.x - p1.x) * tension;
              const cp2y = p2.y - (p3.y - p1.y) * tension;

              d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
            }
            return d;
          };

          // Create area fill by closing the smooth path down to the baseline
          const smoothArea = (coords: { x: number; y: number }[]) => {
            const line = smoothPath(coords);
            if (!line || coords.length < 2) return '';
            return `${line} L ${coords[coords.length - 1].x} ${padBot} L ${coords[0].x} ${padBot} Z`;
          };

          const waitingLine = smoothPath(waitingCoords);
          const waitingArea = smoothArea(waitingCoords);
          const completedLine = smoothPath(completedCoords);
          const completedArea = smoothArea(completedCoords);

          return (
            <div className="flex-grow w-full select-none pl-8 pr-4 pb-6 flex flex-col relative z-10">
              <div className="relative w-full flex-grow">
                {/* SVG for smooth curves and filled areas */}
                <svg className="absolute inset-0 w-full h-full animate-fade-in" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <defs>
                    {/* Green/Mint gradient for Waiting */}
                    <linearGradient id="waitingAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity="0.35" />
                      <stop offset="70%" stopColor="#10b981" stopOpacity="0.08" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
                    </linearGradient>
                    {/* Purple/Lavender gradient for Completed */}
                    <linearGradient id="completedAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.35" />
                      <stop offset="70%" stopColor="#8b5cf6" stopOpacity="0.08" />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>

                  {/* Filled areas (rendered first, behind lines) */}
                  <path d={waitingArea} fill="url(#waitingAreaGrad)" />
                  <path d={completedArea} fill="url(#completedAreaGrad)" />

                  {/* Smooth curve lines */}
                  <path d={waitingLine} fill="none" stroke="#34d399" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                  <path d={completedLine} fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                </svg>

                {/* Horizontal grid lines */}
                <div className="absolute left-0 right-0 border-t border-slate-700/25 border-dashed" style={{ top: `${padTop}%` }} />
                <div className="absolute left-0 right-0 border-t border-slate-700/15 border-dashed" style={{ top: `${padTop + yRange * 0.33}%` }} />
                <div className="absolute left-0 right-0 border-t border-slate-700/15 border-dashed" style={{ top: `${padTop + yRange * 0.66}%` }} />
                <div className="absolute left-0 right-0 border-t border-slate-700/30" style={{ top: `${padBot}%` }} />

                {/* Vertical grid lines */}
                {waitingCoords.map((c, idx) => (
                  <div 
                    key={`v-${idx}`}
                    className="absolute top-0 bottom-0 border-l border-slate-700/12 border-dashed"
                    style={{ left: `${c.x}%` }}
                  />
                ))}

                {/* Y-axis labels */}
                <span className="absolute left-[-28px] -translate-y-1/2 text-[9px] font-mono text-slate-500 font-semibold" style={{ top: `${padTop}%` }}>{maxVal}</span>
                <span className="absolute left-[-28px] -translate-y-1/2 text-[9px] font-mono text-slate-500 font-semibold" style={{ top: `${padTop + yRange * 0.5}%` }}>{Math.round(maxVal / 2)}</span>
                <span className="absolute left-[-28px] -translate-y-1/2 text-[9px] font-mono text-slate-500 font-semibold" style={{ top: `${padBot}%` }}>0</span>

                {/* Data points — Waiting (green) */}
                {waitingCoords.map((c, idx) => (
                  <div 
                    key={`w-${idx}`}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10"
                    style={{ left: `${c.x}%`, top: `${c.y}%` }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-[2px] border-black shadow-sm shadow-emerald-400/30 group-hover:scale-150 group-hover:bg-white transition-transform duration-150" />
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-black/95 text-slate-200 text-[10px] font-bold font-mono px-2.5 py-1.5 rounded-lg shadow-xl border border-emerald-500/30 whitespace-nowrap pointer-events-none z-30 flex flex-col items-center">
                      <span className="text-emerald-300 font-extrabold">{trendPoints[idx].queueLength} waiting</span>
                      <span className="text-[8px] text-slate-400 font-normal mt-0.5">
                        {new Date(trendPoints[idx].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Data points — Completed (purple) */}
                {completedCoords.map((c, idx) => (
                  <div 
                    key={`c-${idx}`}
                    className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10"
                    style={{ left: `${c.x}%`, top: `${c.y}%` }}
                  >
                    <div className="w-2.5 h-2.5 rounded-sm rotate-45 bg-violet-400 border-[2px] border-black shadow-sm shadow-violet-400/30 group-hover:scale-150 group-hover:bg-white transition-transform duration-150" />
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-black/95 text-slate-200 text-[10px] font-bold font-mono px-2.5 py-1.5 rounded-lg shadow-xl border border-violet-500/30 whitespace-nowrap pointer-events-none z-30 flex flex-col items-center">
                      <span className="text-violet-300 font-extrabold">{trendPoints[idx].patientsCompleted} done</span>
                      <span className="text-[8px] text-slate-400 font-normal mt-0.5">
                        {new Date(trendPoints[idx].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}

                {/* X-axis labels */}
                {waitingCoords.length > 0 && (
                  <>
                    <span className="absolute bottom-[-18px] left-0 text-[8px] font-semibold font-mono text-slate-500">
                      {new Date(trendPoints[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span className="absolute bottom-[-18px] left-1/2 -translate-x-1/2 text-[8px] font-semibold font-mono text-slate-500">
                      {new Date(trendPoints[Math.floor(trendPoints.length / 2)].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span className="absolute bottom-[-18px] right-0 text-[8px] font-semibold font-mono text-slate-500">
                      {new Date(trendPoints[trendPoints.length - 1].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })() : (
          <p className="text-slate-400 text-center py-8">Collecting trend data...</p>
        )}
      </div>

      {/* Voice Status & Footer */}
      <div className="flex items-center justify-between text-sm text-slate-400 mt-auto">
        <div className="flex items-center gap-2">
          {voiceEnabled && voiceAnnouncer.isAvailable() ? (
            <>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Voice Announcements Active</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-slate-500" />
              <span>Voice Announcements Disabled</span>
            </>
          )}
        </div>
        <p className="text-xs">CuraQueue™ • Clinic Queue Management System</p>
      </div>
    </div>
  );
}
