/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Play, 
  Sliders, 
  RotateCcw, 
  Trash2, 
  Clock, 
  CheckCircle, 
  Clock3,
  UserCheck,
  AlertCircle,
  Search,
  Keyboard,
  ArrowUpDown,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { QueueState, QueueAction, Patient } from '../types';

interface ReceptionistPanelProps {
  state: QueueState;
  sendAction: (action: QueueAction) => void;
  latencyMs: number | null;
  connectionStatus: 'connected' | 'reconnecting' | 'disconnected';
  isAuthenticatedForReception?: boolean;
  onAuthenticate?: () => void;
}

export default function ReceptionistPanel({
  state,
  sendAction,
  latencyMs,
  isAuthenticatedForReception = true,
  onAuthenticate,
  connectionStatus
}: ReceptionistPanelProps) {
  const [patientName, setPatientName] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Authentication state
  const [usernameInput, setUsernameInput] = useState('');
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [showAccessCodeInput, setShowAccessCodeInput] = useState(false);
  const [authErrorMsg, setAuthErrorMsg] = useState('');
  const [altHeld, setAltHeld] = useState(false);
  const [showShortcutsLegend, setShowShortcutsLegend] = useState(false);

  // Sorting and Capacity limits hooks
  const [sortBy, setSortBy] = useState<'waiting' | 'urgency' | 'alphabetical'>('waiting');
  const [capacityLimit, setCapacityLimit] = useState(8);

  const activePatients = state.patients.filter(p => p.status !== 'cancelled');
  const nowServing = activePatients.find(p => p.status === 'current');
  const waitingList = activePatients.filter(p => p.status === 'waiting');
  const seenCount = activePatients.filter(p => p.status === 'seen').length;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        setAltHeld(true);
      }
      
      // Perform shortcuts
      if (e.altKey) {
        const key = e.key.toLowerCase();
        if (key === 'n') {
          e.preventDefault();
          if (inputRef.current) {
            inputRef.current.focus();
          }
        } else if (key === 'c') {
          e.preventDefault();
          if (waitingList.length > 0) {
            sendAction({ type: 'CALL_NEXT' });
          }
        } else if (key === 's') {
          e.preventDefault();
          if (searchInputRef.current) {
            searchInputRef.current.focus();
          }
        } else if (key === 'e') {
          e.preventDefault();
          setIsEmergency(prev => !prev);
        } else if (key === 'r') {
          e.preventDefault();
          handleResetQueue();
        }
      } else if (e.key === 'Escape') {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        setSearchQuery('');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt') {
        setAltHeld(false);
      }
    };

    const handleBlur = () => {
      setAltHeld(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [waitingList.length, state.nextTokenNumber]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameInput.trim() === 'NIKUNJ' && accessCodeInput.trim() === '357') {
      if (onAuthenticate) {
        onAuthenticate();
      }
      setAuthErrorMsg('');
    } else {
      setAuthErrorMsg('Incorrect Username or Unique Code. Access Denied.');
    }
  };

  const handleClearCompleted = () => {
    if (window.confirm("Are you sure you want to clear completed patients from the database?")) {
      sendAction({ type: 'CLEAR_COMPLETED' });
    }
  };

  if (!isAuthenticatedForReception) {
    return (
      <div id="receptionist-auth-root" className="glass rounded-2xl shadow-xl overflow-hidden flex flex-col h-full font-sans max-w-md mx-auto">
        <div className="bg-slate-50/60 border-b border-slate-200 p-6 text-center">
          <div className="mx-auto w-12 h-12 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center mb-3 border border-sky-100">
            <Lock size={20} className="animate-pulse" />
          </div>
          <h2 className="text-sm font-extrabold text-slate-800 tracking-tight uppercase">Security Bypass</h2>
          <p className="text-slate-500 text-xs mt-1">Credentials required to access Reception panel</p>
        </div>
        <form onSubmit={handleLoginSubmit} className="p-6 flex flex-col gap-4 flex-1 justify-center">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Username</label>
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="Enter username (e.g. NIKUNJ)"
              className="w-full h-10 px-3.5 text-xs bg-white text-slate-800 border border-slate-250 rounded-xl outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 font-semibold"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5 relative">
            <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Unique Code</label>
            <div className="relative">
              <input
                type={showAccessCodeInput ? "text" : "password"}
                value={accessCodeInput}
                onChange={(e) => setAccessCodeInput(e.target.value)}
                placeholder="Enter unique code (e.g. 357)"
                className="w-full h-10 pl-3.5 pr-10 text-xs bg-white text-slate-800 border border-slate-250 rounded-xl outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 font-mono font-bold"
                required
              />
              <button
                type="button"
                onClick={() => setShowAccessCodeInput(!showAccessCodeInput)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                {showAccessCodeInput ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          {authErrorMsg && (
            <p className="text-rose-600 text-xs font-bold bg-rose-50 border border-rose-100 px-3 py-2 rounded-lg animate-fade-in">
              ⚠️ {authErrorMsg}
            </p>
          )}
          <button
            type="submit"
            className="w-full mt-2 bg-slate-900 hover:bg-slate-800 text-white font-bold h-10 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wider text-xs"
          >
            <span>Verify & Access Panel</span>
          </button>
        </form>
      </div>
    );
  }

  const filteredPatients = state.patients.filter(patient => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      patient.name.toLowerCase().includes(query) ||
      patient.id.toLowerCase().includes(query) ||
      `#${patient.token}`.includes(query) ||
      String(patient.token) === query
    );
  });

  const sortedPatients = [...filteredPatients].sort((a, b) => {
    if (sortBy === 'urgency') {
      const aEmerg = !!a.isEmergency;
      const bEmerg = !!b.isEmergency;
      if (aEmerg && !bEmerg) return -1;
      if (!aEmerg && bEmerg) return 1;
      return a.addedAt - b.addedAt;
    }
    if (sortBy === 'alphabetical') {
      return a.name.localeCompare(b.name);
    }
    // Default: Waiting Time (longest waiting / earliest addedAt first)
    return a.addedAt - b.addedAt;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = patientName.trim();
    if (!trimmed) return;
    
    if (waitingList.length >= 10 && !isEmergency) {
      return;
    }
    
    setIsAdding(true);
    sendAction({ type: 'ADD_PATIENT', name: trimmed, isEmergency });
    setPatientName('');
    setIsEmergency(false);
    setIsAdding(false);
    
    // Auto-focus input for fast data entry
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleCallNext = () => {
    sendAction({ type: 'CALL_NEXT' });
  };

  const handleConsultTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const mins = Number(e.target.value);
    sendAction({ type: 'UPDATE_CONSULT_TIME', mins });
  };

  const handleCancelPatient = (id: string) => {
    sendAction({ type: 'CANCEL_PATIENT', id });
  };

  const handleCompletePatient = (id: string) => {
    sendAction({ type: 'COMPLETE_PATIENT', id });
  };

  const handleResetQueue = () => {
    if (window.confirm("Are you sure you want to clear the entire patient queue? This will restart the demo from Token #1.")) {
      sendAction({ type: 'RESET_QUEUE' });
    }
  };

  // Custom precise state: Active if any patients remain to be seen or are with consultant, Inactive otherwise
  const hasRemaining = activePatients.some(p => p.status === 'waiting' || p.status === 'current');

  return (
    <div id="receptionist-panel-root" className="glass rounded-2xl shadow-xl overflow-hidden flex flex-col h-full font-sans">
      
      {/* Panel Sticky Header */}
      <div className="bg-slate-50/60 border-b border-slate-200 p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1 px-3 bg-sky-50 text-sky-600 text-xs font-bold rounded-full border border-sky-100">
            Desk Console
          </div>
          <h2 className="text-sm font-extrabold text-slate-800 tracking-tight uppercase">Receptionist Actions</h2>
        </div>

        {/* Sync Indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-slate-200 text-[11px] font-bold font-mono shadow-xs">
            {hasRemaining ? (
              <>
                <span className="status-pulse"></span>
                <span className="text-emerald-600">Active</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                <span className="text-slate-400">Inactive</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col gap-5 overflow-y-auto">        {/* Quick Search Patients */}
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search patients by name, token # or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-14 text-xs bg-white text-slate-800 placeholder-slate-400 border border-slate-250 rounded-xl outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 transition-all font-medium shadow-2xs"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Search size={14} />
          </div>
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-2 py-0.5 text-[10px] font-bold text-slate-550 hover:text-rose-600 hover:bg-rose-50/60 rounded border border-slate-200 hover:border-rose-250 transition-all cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Quick Statistics Banner */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-sky-50/50 border border-sky-100/60 rounded-xl p-3.5 text-center flex flex-col justify-between items-center min-h-[105px]">
            <div>
              <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">Now Serving</p>
              <p className="text-2xl font-black text-sky-600 mt-1">
                {nowServing ? `#${nowServing.token}` : '—'}
              </p>
              <p className="text-[10px] text-slate-600 font-bold truncate mt-0.5">
                {nowServing ? nowServing.name : 'None called'}
              </p>
            </div>
            {nowServing && (
              <button
                onClick={() => handleCompletePatient(nowServing.id)}
                id="complete-now-serving-btn"
                className="mt-2.5 w-full bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold py-1 px-2.5 rounded-lg shadow-sm transition-all cursor-pointer uppercase flex items-center justify-center gap-1 border-0"
              >
                <CheckCircle size={10} />
                <span>Complete</span>
              </button>
            )}
          </div>
          
          <div className="bg-emerald-50/30 border border-emerald-100/70 rounded-xl p-3.5 text-center">
            <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">Waiting Room</p>
            <p className="text-2xl font-black text-slate-850 mt-1">
              {waitingList.length}
            </p>
            <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
              Pending
            </p>
          </div>

          <div className="bg-emerald-50/30 border border-emerald-100/70 rounded-xl p-3.5 text-center">
            <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">Completed</p>
            <p className="text-2xl font-black text-slate-850 mt-1">
              {seenCount}
            </p>
            <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
              Done today
            </p>
          </div>
        </div>

        {/* Primary Call Action */}
        <div>
          <button
            onClick={handleCallNext}
            disabled={waitingList.length === 0}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 text-white disabled:text-slate-400 border border-slate-700/10 disabled:border-slate-200 h-12 rounded-xl font-bold text-sm tracking-wide shadow-lg flex items-center justify-center gap-2 cursor-pointer transition disabled:cursor-not-allowed active:scale-[0.99] transform"
          >
            <Play size={16} fill="currentColor" />
            <span>CALL NEXT TOKEN</span>
          </button>
          {waitingList.length === 0 && (
            <p className="text-center text-[11px] text-slate-500 mt-1.5 flex items-center justify-center gap-1 font-medium italic">
              <AlertCircle size={12} /> No patients currently waiting in queue.
            </p>
          )}
        </div>

        {/* Add Patient Section */}
        <div className="border border-emerald-100/70 rounded-xl p-4.5 bg-emerald-50/20">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <UserPlus size={14} className="text-slate-400" />
            Patient Check-In (New Ticket)
          </h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center mb-0.5">
                <label htmlFor="receptionist-patient-name-input" className="text-[11px] font-semibold text-slate-600">Patient Full Name</label>
              </div>
              <input
                ref={inputRef}
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Enter patient full name..."
                maxLength={28}
                disabled={isAdding}
                id="receptionist-patient-name-input"
                className="w-full h-10 px-3.5 text-xs bg-white text-slate-800 placeholder-slate-400 border border-slate-250 rounded-xl outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 disabled:bg-slate-100 transition-all font-medium"
              />
            </div>
            
            <div className="flex items-center justify-between gap-2 mt-0.5 mb-1.5 bg-rose-50/50 border border-rose-100/50 rounded-lg p-2.5">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="receptionist-emergency-checkbox"
                  checked={isEmergency}
                  onChange={(e) => setIsEmergency(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <label htmlFor="receptionist-emergency-checkbox" className="text-[11px] font-bold text-rose-700 flex items-center gap-1 cursor-pointer select-none">
                  <AlertCircle size={13} className="text-rose-500 animate-pulse" />
                  Mark as Emergency Priority
                </label>
              </div>
            </div>

            {waitingList.length >= 10 && (
              <div className="px-3 py-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800 font-bold flex flex-col gap-1 animate-fade-in shadow-2xs">
                <span className="flex items-center gap-1.5">
                  <AlertCircle size={13} className="text-rose-500 shrink-0 animate-bounce" />
                  Queue is full right now! (Maximum capacity of 10 reached)
                </span>
                {!isEmergency && (
                  <span className="text-[10px] text-rose-600 font-semibold font-sans mt-0.5 ml-4.5">
                    * Standard ticket issuance is blocked. Try marking as emergency if critical.
                  </span>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isAdding || !patientName.trim() || (waitingList.length >= 10 && !isEmergency)}
              className="w-full bg-sky-500 hover:bg-sky-600 disabled:bg-slate-200 text-white disabled:text-slate-400 font-semibold py-2.5 text-xs rounded-xl shadow-md shadow-sky-500/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed uppercase tracking-wider"
            >
              {(waitingList.length >= 10 && !isEmergency) ? "Queue is Full" : `Issue Token #${state.nextTokenNumber}`}
            </button>
          </form>
        </div>

        {/* Live List Section */}
        <div className="flex-1 flex flex-col min-h-[160px]">
          <div className="flex justify-between items-center mb-2.5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Users size={14} className="text-slate-400" />
              Upcoming Queue Registry
            </h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-white/80 border border-slate-200 rounded-lg px-2 py-0.5 shadow-2xs">
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Cap Alert:</span>
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={capacityLimit}
                  onChange={(e) => setCapacityLimit(Math.max(2, Math.min(10, Number(e.target.value) || 8)))}
                  className="w-10 bg-transparent text-[10px] font-extrabold text-slate-700 focus:outline-none text-center"
                />
              </div>
              <div className="flex items-center gap-1 bg-white/80 border border-slate-200 rounded-lg px-2 py-0.5 shadow-2xs">
                <ArrowUpDown size={11} className="text-slate-450" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent border-none text-[10px] font-bold text-slate-600 outline-none pr-1 py-0.5 cursor-pointer font-sans custom-select"
                >
                  <option value="waiting">Waiting Time</option>
                  <option value="urgency">Urgency Level</option>
                  <option value="alphabetical">Alphabetical</option>
                </select>
              </div>
              <span className="text-[10px] text-sky-600 font-bold bg-sky-50/60 border border-sky-100 rounded-full px-2 py-1 leading-none">
                {waitingList.length} Pending
              </span>
            </div>
          </div>

          {waitingList.length >= capacityLimit && (
            <div className="mb-2.5 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 font-bold flex items-center gap-1.5 animate-fade-in shadow-2xs">
              <AlertCircle size={13} className="text-amber-500 shrink-0" />
              <span>Soft Capacity reached! Queue registry has {waitingList.length} / {capacityLimit} pending patients.</span>
            </div>
          )}

          <div className={`border rounded-xl flex-1 overflow-y-auto max-h-[220px] transition-all duration-300 ${
            waitingList.length >= capacityLimit 
              ? 'bg-amber-50/60 border-amber-300 shadow-md shadow-amber-500/5' 
              : 'border-slate-200 bg-slate-50/40'
          }`}>
            {state.patients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <Users size={28} strokeWidth={1.5} className="mb-1 text-slate-300" />
                <p className="text-xs">No registered patients in queue.</p>
                <p className="text-[10px] text-slate-500">Check in a patient above to begin.</p>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400 text-center px-4">
                <Search size={22} strokeWidth={1.5} className="mb-1 text-slate-300" />
                <p className="text-xs font-bold text-slate-600">No matching patients found</p>
                <p className="text-[10px] text-slate-450 mt-0.5">Try a different name, token, or patient ID.</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 font-bold px-2 py-0.5 rounded transition-all cursor-pointer"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-150">
                {sortedPatients.map((patient) => {
                  const isCurrent = patient.status === 'current';
                  const isSeen = patient.status === 'seen';
                  const isCancelled = patient.status === 'cancelled';

                  return (
                    <div
                      key={patient.id}
                      className={`flex items-center justify-between p-3 transition-all ${
                        isCurrent
                          ? 'bg-sky-50/45 font-medium border-l-2 border-sky-500'
                          : isSeen
                          ? 'opacity-60 bg-slate-50/20'
                          : isCancelled
                          ? 'opacity-40 bg-rose-50/5'
                          : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 max-w-[70%]">
                        <span className={`w-9 h-7 text-xs font-black font-mono rounded-lg flex items-center justify-center border ${
                          isCurrent
                            ? 'bg-sky-500 text-white border-sky-500 shadow-xs'
                            : isSeen
                            ? 'bg-slate-100 text-slate-400 border-slate-200'
                            : isCancelled
                            ? 'bg-rose-100 text-rose-500 border-rose-200 line-through'
                            : 'bg-white text-slate-700 border-slate-200 shadow-2xs'
                        }`}>
                          #{patient.token}
                        </span>
                        
                        <div className="truncate">
                          <p className={`text-xs font-bold flex items-center gap-1.5 ${isCancelled ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                            {patient.name}
                            {patient.isEmergency && (
                              <span className="inline-flex items-center gap-0.5 text-[8px] font-extrabold bg-rose-50 text-rose-600 border border-rose-100 px-1.5 py-0.5 rounded tracking-wide animate-pulse uppercase">
                                Emergency
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            Arrived {new Date(patient.addedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      {/* Status indicator / remove action */}
                      <div className="flex items-center gap-2">
                        {isCurrent ? (
                          <div className="flex items-center gap-1.5">
                            <span className="flex items-center gap-1.5 text-[10px] bg-sky-100 text-sky-800 border border-sky-200 font-bold px-2.5 py-1 rounded-lg">
                              <Clock3 size={11} className="animate-spin-slow" /> Consulting
                            </span>
                            <button
                              onClick={() => handleCompletePatient(patient.id)}
                              title="Mark as completed & call next"
                              id={`complete-btn-${patient.id}`}
                              className="p-1 text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100/85 rounded-lg border border-emerald-250 transition-all cursor-pointer font-bold text-[10px] flex items-center gap-0.5"
                            >
                              <CheckCircle size={10} />
                              <span>Complete</span>
                            </button>
                          </div>
                        ) : isSeen ? (
                          <span className="flex items-center gap-1 text-[10px] bg-slate-100 text-slate-500 border border-slate-200 font-bold px-2 py-0.5 rounded-md">
                            <CheckCircle size={10} /> Completed
                          </span>
                        ) : isCancelled ? (
                          <span className="text-[10px] bg-rose-50 text-rose-600 border border-rose-100 font-semibold px-2 py-0.5 rounded-md">
                            Cancelled
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {patient.isEmergency ? (
                              <span className="text-[10px] bg-rose-50 border border-rose-100 text-rose-600 font-extrabold px-2 py-0.5 rounded-md animate-pulse uppercase">
                                Priority Wait
                              </span>
                            ) : (
                              <span className="text-[10px] bg-slate-100 text-slate-500 border border-slate-200 font-bold px-2.5 py-0.5 rounded-md">
                                Waiting
                              </span>
                            )}

                            <button
                              onClick={() => sendAction({ type: 'TOGGLE_EMERGENCY', id: patient.id })}
                              title={patient.isEmergency ? "Remove emergency status" : "Mark as Emergency priority"}
                              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                                patient.isEmergency
                                  ? 'text-rose-600 bg-rose-50 hover:bg-rose-100/80 animate-pulse'
                                  : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              }`}
                            >
                              <AlertCircle size={13} />
                            </button>

                            <button
                              onClick={() => handleCompletePatient(patient.id)}
                              title="End visit / Mark as done"
                              id={`complete-btn-${patient.id}`}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer"
                            >
                              <CheckCircle size={13} />
                            </button>

                            <button
                              onClick={() => handleCancelPatient(patient.id)}
                              title="Cancel slot"
                              id={`cancel-btn-${patient.id}`}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Average Consultation Slider */}
        <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/20">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Sliders size={14} className="text-slate-400" />
              Doctor Pace Control
            </span>
            <span className="text-xs font-black text-sky-600 font-mono">
              {state.averageConsultTime} min / patient
            </span>
          </div>
          <input
            type="range"
            min="3"
            max="30"
            value={state.averageConsultTime}
            onChange={handleConsultTimeChange}
            id="consultation-time-input-slider"
            className="w-full accent-sky-500 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1.5">
            <span>Fast Consultation (3m)</span>
            <span>Comprehensive Check (30m)</span>
          </div>
        </div>

        {/* Global Reset & Clear Completed */}
        <div className="pt-2.5 border-t border-slate-150 flex justify-between items-center">
          <button
            onClick={handleClearCompleted}
            id="clear-completed-button"
            className="text-[11px] font-bold text-sky-600 hover:text-sky-700 hover:bg-sky-50 border border-sky-200 hover:border-sky-300 rounded-lg px-3 py-2 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
          >
            <Trash2 size={12} />
            <span>Clear Completed Tickets</span>
          </button>
          
          <button
            onClick={handleResetQueue}
            id="reset-queue-button"
            className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 hover:border-rose-300 rounded-lg px-3 py-2 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
          >
            <RotateCcw size={12} />
            <span>System Hard Reset</span>
          </button>
        </div>

      </div>
    </div>
  );
}
