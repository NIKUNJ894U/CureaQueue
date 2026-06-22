/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Users, 
  Tv, 
  Activity, 
  Plus, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  Heart, 
  Search, 
  ShieldAlert, 
  Zap, 
  Calendar,
  Sparkles,
  Stethoscope,
  Terminal,
  MousePointerClick
} from 'lucide-react';
import { QueueState } from '../types';
import CuraQueueLogo from './CuraQueueLogo';

interface LandingPageProps {
  state: QueueState;
  onNavigate: (tab: 'dual' | 'reception' | 'monitor' | 'audit') => void;
}

export default function LandingPage({ state, onNavigate }: LandingPageProps) {
  // Metrics calculation
  const activePatients = state.patients.filter(p => p.status !== 'cancelled');
  const lobbyWaiting = activePatients.filter(p => p.status === 'waiting').length;
  const inConsultation = activePatients.filter(p => p.status === 'current').length;
  const emergencyCount = activePatients.filter(p => p.status === 'waiting' && p.isEmergency).length;

  return (
    <div className="bg-white text-slate-700 min-h-screen relative overflow-hidden font-sans">
      
      {/* Background Decorative Circles in Soft Light Sky Blue & Light Mint */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-sky-50 rounded-full filter blur-3xl opacity-75 -z-10 animate-pulse-slow"></div>
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-sky-100/50 rounded-full filter blur-3xl opacity-60 -z-10"></div>
      <div className="absolute -bottom-10 right-10 w-[300px] h-[300px] bg-sky-50 rounded-full filter blur-3xl opacity-70 -z-10"></div>

      {/* Thin Radial Background Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#e0f2fe_1px,transparent_1px)] [background-size:24px_24px] opacity-70 -z-20"></div>

      {/* Main Hero & Top Visual Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left Column: Clean headlines and quick actions */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Soft Sky Blue Trust Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-50 text-sky-700 border border-sky-100 rounded-full text-xs font-bold uppercase tracking-wider">
              <Stethoscope size={14} className="text-sky-500" />
              <span>Real-Time Clinical Queue Synchronization</span>
            </div>

            {/* Black bold headlines */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
              Instantly Unify <span className="text-sky-600 block sm:inline">Clinic Desks</span><br />
              With <span className="text-sky-500">Patient Waiting Rooms</span>
            </h1>

            <p className="text-slate-550 text-base sm:text-lg max-w-2xl font-normal leading-relaxed">
              CuraQueue establishes a dynamic interface between receptionists, active patients, and consulting staff. Remove waiting hall doubts, minimize consulting bottlenecking, and ensure care with instant updates.
            </p>

            {/* Primary Action Buttons styled in clean White and Sky Blue (No Dark Blue) */}
            <div className="flex flex-wrap gap-4 pt-4">
              <button
                onClick={() => onNavigate('dual')}
                className="flex items-center gap-2.5 bg-sky-500 hover:bg-sky-600 text-white font-extrabold px-6 py-4 rounded-2xl shadow-lg shadow-sky-400/20 hover:shadow-xl hover:shadow-sky-400/30 cursor-pointer transition-all duration-200 active:scale-98"
                id="hero-launch-dual-btn"
              >
                <span>Launch Dual Portal</span>
                <ArrowRight size={16} />
              </button>
              
              <button
                onClick={() => onNavigate('monitor')}
                className="flex items-center gap-2.5 bg-white hover:bg-sky-50 text-sky-600 border-2 border-sky-200 font-extrabold px-6 py-4 rounded-2xl cursor-pointer transition-all duration-200 active:scale-98"
                id="hero-open-tv-btn"
              >
                <Tv size={16} />
                <span>Open Lobby Monitor</span>
              </button>
            </div>

            {/* Micro Stats Row in soft skies */}
            <div className="grid grid-cols-3 gap-4 border-t border-sky-100 pt-8 mt-6">
              <div className="space-y-1">
                <span className="text-2xl font-black text-sky-600 font-mono">01</span>
                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Alt+N Keyboard Hotkey</p>
              </div>
              <div className="space-y-1">
                <span className="text-2xl font-black text-sky-600 font-mono">Instant</span>
                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">WebSocket Broadcast</p>
              </div>
              <div className="space-y-1">
                <span className="text-2xl font-black text-slate-800 font-mono">99.9%</span>
                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">System Availability</p>
              </div>
            </div>

          </div>

          {/* Hero Right Column: Engaging Hero Image of Reception Desk with a floating Live State Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-sky-100 bg-slate-50 aspect-video lg:aspect-square">
              
              {/* Actual Image of premium professional clinic receptionist checker counter */}
              <img 
                src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800" 
                alt="Modern Medical Consultation Reception and Lobby Coordination Desk"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                id="hero-clinic-display-img"
              />

              {/* Skyblue Overlay gradient at bottom */}
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-sky-400/30 to-transparent pointer-events-none"></div>

              {/* Suspended Interactive Lobby Status Tracker Badge */}
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-sky-100 pointer-events-auto">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CuraQueueLogo size={28} />
                    <span className="text-xs font-black text-slate-800 uppercase tracking-tight">Active Roster Status</span>
                  </div>
                  <span className="flex items-center gap-1 bg-sky-50 border border-sky-100 text-sky-600 text-[9px] font-black uppercase px-2 py-0.5 rounded-full select-none animate-pulse">
                    <span className="w-1.5 h-1.5 bg-sky-400 rounded-full"></span>
                    <span>Monitoring Live</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center mt-3">
                  <div className="bg-sky-50/50 p-2 rounded-xl border border-sky-100">
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase block leading-none">In Waiting</span>
                    <span className="text-lg font-black text-sky-600 font-mono">{lobbyWaiting}</span>
                  </div>
                  <div className="bg-sky-50/50 p-2 rounded-xl border border-sky-100">
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase block leading-none">Being Seen</span>
                    <span className="text-lg font-black text-sky-600 font-mono">{inConsultation}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Engaging Visual Walkthrough Section with Live Action Photos */}
      <section className="bg-sky-50/40 border-y border-sky-100/80 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold text-sky-600 uppercase tracking-widest block">System Walkthrough</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">The Three-Way Interactive Sequence</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Designed to connect each critical point of the clinic journey, keeping both staff and waiting patients perfectly aligned and at ease.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            
            {/* Step 1: Reception Check-In */}
            <div className="bg-white rounded-2xl overflow-hidden border border-sky-100 hover:border-sky-305 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between">
              <div>
                <div className="h-44 bg-slate-100 relative">
                  <img 
                    src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=400" 
                    alt="Clinic receptionist checking in a patient"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    id="step1-reception-img"
                  />
                  <div className="absolute top-3 left-3 bg-white text-sky-600 font-mono font-black text-xs px-2.5 py-1 rounded-lg border border-sky-100 shadow-sm">
                    01 • Ingress
                  </div>
                </div>
                <div className="p-6">
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-2">Clerk Check-In Desk</h4>
                  <p className="text-xs text-slate-505 leading-relaxed">
                    Receptionists use Alt+N key bindings for instant token allocations. Input raw names, toggling urgencies or emergency priorities on a streamlined keyboard-driven grid.
                  </p>
                </div>
              </div>
              <div className="p-6 pt-0">
                <button
                  onClick={() => onNavigate('reception')}
                  className="w-full py-2 bg-sky-50 hover:bg-sky-500 text-sky-600 hover:text-white font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer text-center"
                >
                  Configure Reception
                </button>
              </div>
            </div>

            {/* Step 2: Waiting Hall Display */}
            <div className="bg-white rounded-2xl overflow-hidden border border-sky-100 hover:border-sky-305 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between">
              <div>
                <div className="h-44 bg-slate-100 relative">
                  <img 
                    src="https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=400" 
                    alt="Digital TV display monitor showing live medical queue status"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    id="step2-waiting-img"
                  />
                  <div className="absolute top-3 left-3 bg-white text-sky-600 font-mono font-black text-xs px-2.5 py-1 rounded-lg border border-sky-100 shadow-sm">
                    02 • Broadcast
                  </div>
                </div>
                <div className="p-6">
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-2">Lobby Board & Mutos</h4>
                  <p className="text-xs text-slate-505 leading-relaxed">
                    A beautiful, crisp waiting hall monitor. Patients track their estimated wait time with a specialized live bar chart, receiving custom chime auditory calls when assigned space.
                  </p>
                </div>
              </div>
              <div className="p-6 pt-0">
                <button
                  onClick={() => onNavigate('monitor')}
                  className="w-full py-2 bg-sky-50 hover:bg-sky-500 text-sky-600 hover:text-white font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer text-center"
                >
                  View Lobby Monitor
                </button>
              </div>
            </div>

            {/* Step 3: Operational Audits */}
            <div className="bg-white rounded-2xl overflow-hidden border border-sky-100 hover:border-sky-305 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between">
              <div>
                <div className="h-44 bg-slate-100 relative">
                  <img 
                    src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=400" 
                    alt="Audit data analysis and clinical efficiency visualization graphs"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    id="step3-audit-img"
                  />
                  <div className="absolute top-3 left-3 bg-white text-sky-600 font-mono font-black text-xs px-2.5 py-1 rounded-lg border border-sky-100 shadow-sm">
                    03 • Analysis
                  </div>
                </div>
                <div className="p-6">
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-2">Practice Flow Audit</h4>
                  <p className="text-xs text-slate-505 leading-relaxed">
                    Administrators analyze deep clinic timestamps. Observe registered vs seen durations, average consultations logs, and filter records directly with persistent database reporting rules.
                  </p>
                </div>
              </div>
              <div className="p-6 pt-0">
                <button
                  onClick={() => onNavigate('audit')}
                  className="w-full py-2 bg-sky-50 hover:bg-sky-500 text-sky-600 hover:text-white font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer text-center"
                >
                  View Audit Reports
                </button>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Simplified, Bright Core Capabilities Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        
        {/* Title elements in pristine slate/black and skyblue */}
        <div className="flex flex-col sm:flex-row items-baseline justify-between mb-12 gap-2 border-b border-sky-50 pb-6">
          <div>
            <span className="text-xs font-bold text-sky-600 uppercase tracking-widest block mb-1">Core Modules Launcher</span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Access Clinic Terminals</h3>
          </div>
          <span className="text-xs text-slate-400 font-semibold bg-sky-50/50 border border-sky-100 px-3 py-1 rounded-xl">
            Live client synchronizer online
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Launcher Grid */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Terminal 1: Clerk Panel */}
            <div className="bg-white border-2 border-sky-100 hover:border-sky-300 rounded-3xl p-6 transition-all duration-300 shadow-sm hover:shadow-lg flex flex-col justify-between h-[250px]">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
                    <Users size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-950 uppercase tracking-wider">Desk Panel</h4>
                    <p className="text-[10px] text-slate-400 font-bold">RECEPTIONIST CONTROLLER</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-normal mb-4">
                  Check-in patients, manage list sorting, edit urgency statuses, and transmit calls directly to the Doctor with an optimized input stream.
                </p>
              </div>
              <button
                onClick={() => onNavigate('reception')}
                className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer text-center mt-auto flex items-center justify-center gap-1"
              >
                <span>Clerk Portal</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {/* Terminal 2: Lobby Area */}
            <div className="bg-white border-2 border-sky-100 hover:border-sky-300 rounded-3xl p-6 transition-all duration-300 shadow-sm hover:shadow-lg flex flex-col justify-between h-[250px]">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
                    <Tv size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-950 uppercase tracking-wider">Lobby TV</h4>
                    <p className="text-[10px] text-slate-400 font-bold">BROADCAST TICKET VIEW</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-normal mb-4">
                  A high-contrast billboard view to mount in patient wait areas. Synthesizes standard call alarms and outputs estimated waiting slots graph.
                </p>
              </div>
              <button
                onClick={() => onNavigate('monitor')}
                className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer text-center mt-auto flex items-center justify-center gap-1"
              >
                <span>Open Lobby TV</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {/* Terminal 3: Audit & Efficiency */}
            <div className="bg-white border-2 border-sky-100 hover:border-sky-300 rounded-3xl p-6 transition-all duration-300 shadow-sm hover:shadow-lg flex flex-col justify-between h-[250px] sm:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
                    <Activity size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-950 uppercase tracking-wider">Clinical Efficiency Audit</h4>
                    <p className="text-[10px] text-slate-400 font-bold font-mono">TIMESTAMPS & LOGS REPORTING</p>
                  </div>
                </div>
                <span className="text-[10px] text-sky-600 bg-sky-50 border border-sky-100 font-bold px-2 py-0.5 rounded-full select-none uppercase tracking-wider self-start sm:self-auto">
                  Database Connected
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Analyze clinic throughput times, complete patient durations, search historic records, and audit actual registration vs called-in timestamps instantly with continuous FireStore data persistence.
              </p>
              <button
                onClick={() => onNavigate('audit')}
                className="w-full py-2.5 bg-white border border-sky-200 hover:bg-sky-50 text-sky-600 font-black text-xs uppercase tracking-widest rounded-xl transition cursor-pointer text-center mt-auto flex items-center justify-center gap-1"
              >
                <span>Launch Analytics Console</span>
                <ArrowRight size={13} />
              </button>
            </div>

          </div>

          {/* Quick Info & Features list (Right column of the Launcher Grid) */}
          <div className="lg:col-span-4 rounded-3xl border-2 border-sky-100 bg-sky-50/20 p-6 space-y-6">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-sky-100 pb-3">
              Application Core Capabilities
            </h4>
            
            <ul className="space-y-4 text-xs font-semibold text-slate-650">
              <li className="flex items-start gap-2.5">
                <div className="p-1 bg-sky-100 text-sky-600 rounded-md mt-0.5">
                  <Zap size={14} />
                </div>
                <div>
                  <p className="text-slate-900 uppercase text-[9px] font-extrabold">Instant Synchronization</p>
                  <p className="text-[11px] text-slate-500 font-normal leading-normal mt-0.5">State modification triggers immediate Broadcasts down to Lobby TV monitors.</p>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <div className="p-1 bg-sky-100 text-sky-600 rounded-md mt-0.5">
                  <ShieldAlert size={14} />
                </div>
                <div>
                  <p className="text-slate-900 uppercase text-[9px] font-extrabold">Emergency Shunting</p>
                  <p className="text-[11px] text-slate-500 font-normal leading-normal mt-0.5">Urgent priority cases automatically move to the front of the queue lobby board.</p>
                </div>
              </li>

              <li className="flex items-start gap-2.5">
                <div className="p-1 bg-sky-100 text-sky-600 rounded-md mt-0.5">
                  <Terminal size={14} />
                </div>
                <div>
                  <p className="text-slate-900 uppercase text-[9px] font-extrabold">Keyboard Optimized</p>
                  <p className="text-[11px] text-slate-500 font-normal leading-normal mt-0.5">Reception clerk panel is fine-tuned for high-speed hotkey input.</p>
                </div>
              </li>
            </ul>

            <div className="pt-4 border-t border-sky-100 flex items-center justify-between">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-sky-200 border-2 border-white flex items-center justify-center text-[10px] font-black text-sky-700">1</div>
                <div className="w-8 h-8 rounded-full bg-sky-300 border-2 border-white flex items-center justify-center text-[10px] font-black text-sky-800">2</div>
                <div className="w-8 h-8 rounded-full bg-sky-400 border-2 border-white flex items-center justify-center text-[10px] font-black text-white">3</div>
              </div>
              <span className="text-[9px] text-slate-400 font-extrabold uppercase">3 Active Views</span>
            </div>

          </div>

        </div>
      </section>

      {/* Pure White Aesthetic Quote section - Complies with colors and does not mention specific names */}
      <section className="bg-sky-50/50 border-t border-sky-100 py-16 relative">
        <div className="absolute right-12 bottom-4 opacity-5 pointer-events-none select-none">
          <CuraQueueLogo size={140} />
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="flex justify-center">
            <CuraQueueLogo size={56} />
          </div>
          
          <blockquote className="text-lg sm:text-xl font-bold italic text-slate-700 leading-relaxed">
            "Eliminating waiting room uncertainty is about much more than speed—it is about restoring patient dignity, keeping practitioners focused on clinical care, and optimizing overall practice efficiency."
          </blockquote>
          
          <div className="space-y-1 pt-2">
            <h5 className="font-extrabold text-xs uppercase tracking-wider text-sky-600">Operations Director</h5>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Clinical Practice & Patient Experience Operations</p>
          </div>
        </div>
      </section>

    </div>
  );
}
