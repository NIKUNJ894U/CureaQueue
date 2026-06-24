/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Search, 
  Filter, 
  TrendingUp, 
  User, 
  Users,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Patient } from '../types';

export default function ClinicalAuditReport() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadAuditData = async (showPulse = false) => {
    if (showPulse) setIsRefreshing(true);
    else setLoading(true);
    
    setError(null);
    try {
      const res = await fetch('/api/audit-report');
      if (!res.ok) {
        throw new Error(`Failed to retrieve audit records (Status: ${res.status})`);
      }
      const data = await res.json();
      if (data && Array.isArray(data.patients)) {
        setPatients(data.patients);
      } else {
        setPatients([]);
      }
    } catch (err) {
      console.error("Clinical Audit retrieve error:", err);
      setError(err instanceof Error ? err.message : "Internal fetching error");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAuditData();
  }, []);

  // Filter patient list based on search query and status filter
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          `#${patient.token}`.includes(searchQuery) ||
                          patient.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || patient.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Dynamic calculations for Clinical Audit Operational KPIs
  const totalRegistrations = patients.length;
  const completedConsults = patients.filter(p => p.status === 'seen').length;
  const currentConsulting = patients.filter(p => p.status === 'current').length;
  const waitingPatients = patients.filter(p => p.status === 'waiting').length;
  const cancelledAppointments = patients.filter(p => p.status === 'cancelled').length;

  // Calculate actual waiting time (from addedAt to calledAt) for patents who were called
  const patientsWithWaitTime = patients.filter(p => p.calledAt && p.addedAt);
  const avgWaitTimeMs = patientsWithWaitTime.reduce((sum, p) => {
    const wait = (p.calledAt || 0) - p.addedAt;
    return sum + (wait > 0 ? wait : 0);
  }, 0);
  const avgWaitTimeMins = patientsWithWaitTime.length > 0 
    ? Math.round(avgWaitTimeMs / patientsWithWaitTime.length / 60000 * 10) / 10 
    : 0;

  // Calculate actual consultation time (from calledAt to completedAt) for patients who completed consultation
  const patientsWithConsultTime = patients.filter(p => p.calledAt && p.completedAt && p.status === 'seen');
  const avgConsultDurationMs = patientsWithConsultTime.reduce((sum, p) => {
    const duration = (p.completedAt || 0) - (p.calledAt || 0);
    return sum + (duration > 0 ? duration : 0);
  }, 0);
  const avgConsultDurationMins = patientsWithConsultTime.length > 0 
    ? Math.round(avgConsultDurationMs / patientsWithConsultTime.length / 60000 * 10) / 10 
    : 0;

  // Average overall lifecycle time (registered to completion)
  const patientsWithTotalCycle = patients.filter(p => p.addedAt && p.completedAt && p.status === 'seen');
  const avgTotalCycleMs = patientsWithTotalCycle.reduce((sum, p) => {
    const cycle = (p.completedAt || 0) - p.addedAt;
    return sum + (cycle > 0 ? cycle : 0);
  }, 0);
  const avgTotalCycleMins = patientsWithTotalCycle.length > 0 
    ? Math.round(avgTotalCycleMs / patientsWithTotalCycle.length / 60000 * 10) / 10 
    : 0;

  // Helper format dates
  const formatTime = (ts?: number) => {
    if (!ts) return "—";
    return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });
  };

  const getDurationDisplay = (start?: number, end?: number) => {
    if (!start || !end) return "—";
    const diffMs = end - start;
    if (diffMs <= 0) return "—";
    const mins = Math.floor(diffMs / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div id="clinical-audit-root" className="glass rounded-2xl shadow-xl overflow-hidden flex flex-col h-full font-sans text-slate-700 bg-white">
      
      {/* Audit Header */}
      <div className="bg-slate-50/80 p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-1 px-2.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full border border-indigo-100 tracking-wider uppercase flex items-center gap-1">
              <Activity size={10} /> Administrative Reporting
            </span>
          </div>
          <h2 className="text-base font-extrabold text-slate-800 tracking-tight">
            Clinical Efficiency & Audit Reporting
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Real-time operations intelligence, visit timestamps auditing, and wait time optimization KPIs.
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadAuditData(true)}
              disabled={loading || isRefreshing}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-800 transition shadow-2xs cursor-pointer text-slate-600 focus:outline-none"
            >
              <RefreshCw size={12} className={isRefreshing || loading ? 'animate-spin' : ''} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Records'}
            </button>

            <button
              onClick={() => {
                // Export the currently filtered patients as CSV
                const rows = filteredPatients.map(p => {
                  const wait = p.calledAt && p.addedAt ? getDurationDisplay(p.addedAt, p.calledAt) : '';
                  const consult = p.calledAt && p.completedAt ? getDurationDisplay(p.calledAt, p.completedAt) : '';
                  return {
                    token: `#${p.token}`,
                    id: p.id,
                    name: p.name,
                    registeredAt: p.addedAt ? new Date(p.addedAt).toISOString() : '',
                    calledAt: p.calledAt ? new Date(p.calledAt).toISOString() : '',
                    completedAt: p.completedAt ? new Date(p.completedAt).toISOString() : '',
                    waitTime: wait,
                    consultDuration: consult,
                    status: p.status
                  };
                });

                const header = ['Token','Patient UID','Patient Name','Registered At','Called At','Completed At','Wait Time','Consult Duration','Status'];
                const csvLines = [header.join(',')].concat(rows.map(r =>
                  [r.token, r.id, `"${(r.name||'').replace(/"/g,'""')}"`, r.registeredAt, r.calledAt, r.completedAt, r.waitTime, r.consultDuration, r.status].join(',')
                ));

                const csv = csvLines.join('\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const date = new Date().toISOString().slice(0,10);
                a.download = `clinical-audit-${date}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-800 transition shadow-2xs cursor-pointer text-slate-600 focus:outline-none"
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto">
        
        {loading ? (
          <div className="flex-1 flex flex-col justify-center items-center py-24 text-slate-400">
            <RefreshCw className="animate-spin text-indigo-600 mb-3" size={32} />
            <p className="text-sm font-semibold text-slate-600">Accessing Cloud Firestore Logs...</p>
            <p className="text-xs">Compiles timestamps and queue logs from database records.</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 text-center my-6">
            <AlertCircle className="text-rose-605 mx-auto mb-2" size={28} />
            <p className="text-xs font-bold text-rose-800">Operational Retrieval Error</p>
            <p className="text-[11px] text-rose-600 mt-1">{error}</p>
          </div>
        ) : (
          <>
            {/* Audit Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              {/* Card 1: Patients Checked-In */}
              <div className="border border-slate-200 bg-slate-50/50 p-4.5 rounded-xl text-center flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 mb-2">
                    <Users size={16} />
                  </div>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Total Registers</p>
                  <p className="text-2xl font-black text-slate-850 mt-1">{totalRegistrations}</p>
                </div>
                <div className="text-[10px] text-slate-500 font-bold border-t border-slate-200/50 pt-2 mt-2 flex justify-between">
                  <span>Completed: {completedConsults}</span>
                  <span>Cancelled: {cancelledAppointments}</span>
                </div>
              </div>

              {/* Card 2: Actual Avg Consultation Duration */}
              <div className="border border-slate-200 bg-slate-50/50 p-4.5 rounded-xl text-center flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-sky-50 border border-sky-100 text-sky-600 mb-2">
                    <Activity size={16} />
                  </div>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Avg Consult Duration</p>
                  <p className="text-2xl font-black text-sky-600 mt-1">
                    {avgConsultDurationMins > 0 ? `${avgConsultDurationMins}m` : '—'}
                  </p>
                </div>
                <div className="text-[10px] text-slate-500 font-semibold border-t border-slate-200/50 pt-2 mt-2">
                  Based on {patientsWithConsultTime.length} finalized consultation sessions today
                </div>
              </div>

              {/* Card 3: Actual Waiting Time */}
              <div className="border border-slate-200 bg-slate-50/50 p-4.5 rounded-xl text-center flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 text-amber-600 mb-2">
                    <Clock size={16} />
                  </div>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Actual Avg Wait Time</p>
                  <p className="text-2xl font-black text-amber-600 mt-1">
                    {avgWaitTimeMins > 0 ? `${avgWaitTimeMins}m` : '—'}
                  </p>
                </div>
                <div className="text-[10px] text-slate-500 font-semibold border-t border-slate-200/50 pt-2 mt-2">
                  Wait duration from check-in to exam call
                </div>
              </div>

              {/* Card 4: Total Operational Patient Cycle */}
              <div className="border border-slate-200 bg-slate-50/50 p-4.5 rounded-xl text-center flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 mb-2">
                    <TrendingUp size={16} />
                  </div>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">Avg Total Cycle Time</p>
                  <p className="text-2xl font-black text-emerald-600 mt-1">
                    {avgTotalCycleMins > 0 ? `${avgTotalCycleMins}m` : '—'}
                  </p>
                </div>
                <div className="text-[10px] text-slate-500 font-semibold border-t border-slate-200/50 pt-2 mt-2">
                  Total clinic visit duration (entry to exit)
                </div>
              </div>

            </div>

            {/* Filter controls */}
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between border-b border-slate-100 pb-4">
              <div className="w-full md:w-72 relative">
                <input
                  type="text"
                  placeholder="Query patient name or token ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-9 pr-4 text-xs bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white outline-none rounded-xl font-medium transition"
                />
                <Search className="absolute left-3.5 top-3.5 text-slate-450" size={13} />
              </div>

              <div className="flex gap-2 w-full md:w-auto overflow-x-auto self-start md:self-auto pb-1 md:pb-0">
                {[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'seen', label: 'Completed (Seen)' },
                  { value: 'current', label: 'In Consultation' },
                  { value: 'waiting', label: 'Waiting Room' },
                  { value: 'cancelled', label: 'Cancelled' }
                ].map(tab => (
                  <button
                    key={tab.value}
                    onClick={() => setStatusFilter(tab.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer whitespace-nowrap ${
                      statusFilter === tab.value
                        ? 'bg-slate-900 border-slate-900 text-white'
                        : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Auditable records grid list */}
            <div className="border border-slate-250 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4">Token</th>
                    <th className="py-3 px-4">Patient UID</th>
                    <th className="py-3 px-4">Patient Name</th>
                    <th className="py-3 px-4">Registered At</th>
                    <th className="py-3 px-4">Called Room</th>
                    <th className="py-3 px-4">Done Consult</th>
                    <th className="py-3 px-4">Wait Time</th>
                    <th className="py-3 px-4">Consult Duration</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-xs text-slate-600">
                  {filteredPatients.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                        No clinical audit records matched your current query filter.
                      </td>
                    </tr>
                  ) : (
                    filteredPatients.map(patient => {
                      const isSeen = patient.status === 'seen';
                      const isCurrent = patient.status === 'current';
                      const isWaiting = patient.status === 'waiting';
                      const isCancelled = patient.status === 'cancelled';

                      return (
                        <tr key={patient.id} className="hover:bg-slate-50/50 transition duration-150">
                          
                          {/* Token */}
                          <td className="py-3.5 px-4 font-mono font-black text-slate-800">
                            #{patient.token}
                          </td>

                          {/* Patient UID */}
                          <td className="py-3.5 px-4 font-mono text-[10px] text-slate-400">
                            {patient.id}
                          </td>

                          {/* Patient Name */}
                          <td className="py-3.5 px-4 font-bold text-slate-800">
                            {patient.name}
                          </td>

                          {/* Registered At */}
                          <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500">
                            {formatTime(patient.addedAt)}
                          </td>

                          {/* Called To consultation room */}
                          <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500">
                            {formatTime(patient.calledAt)}
                          </td>

                          {/* Done consultation */}
                          <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500 font-medium">
                            {formatTime(patient.completedAt)}
                          </td>

                          {/* Actual wait time */}
                          <td className="py-3.5 px-4 font-mono text-[11px] font-bold text-slate-650">
                            {patient.calledAt ? getDurationDisplay(patient.addedAt, patient.calledAt) : '—'}
                          </td>

                          {/* Actual consult duration */}
                          <td className="py-3.5 px-4 font-mono text-[11px] font-bold text-slate-650">
                            {patient.calledAt && patient.completedAt ? getDurationDisplay(patient.calledAt, patient.completedAt) : '—'}
                          </td>

                          {/* Status Badge */}
                          <td className="py-3.5 px-4">
                            {isSeen ? (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md px-2 py-0.5">
                                <CheckCircle2 size={10} /> Seen
                              </span>
                            ) : isCurrent ? (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-105 rounded-md px-2 py-0.5">
                                <Activity size={10} className="animate-pulse" /> Serving
                              </span>
                            ) : isWaiting ? (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 rounded-md px-2 py-0.5">
                                <Clock size={10} /> Waiting
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100 rounded-md px-2 py-0.5">
                                <XCircle size={10} /> Cancelled
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
