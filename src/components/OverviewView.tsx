import React from 'react';
import { JobRecord } from '../types.ts';
import { 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  Database, 
  ArrowRight, 
  Zap, 
  FileCheck, 
  ExternalLink,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

interface OverviewViewProps {
  jobs: JobRecord[];
  onSelectJob: (jobId: string) => void;
  onNavigate: (tab: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  jobs,
  onSelectJob,
  onNavigate,
  onRefresh,
  isLoading,
}) => {
  const totalJobs = jobs.length;
  const totalCertificates = jobs.reduce((acc, j) => acc + (j.success_count || 0), 0);
  const totalFailures = jobs.reduce((acc, j) => acc + (j.failure_count || 0), 0);
  const totalRecipients = jobs.reduce((acc, j) => acc + (j.total_count || 0), 0);

  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8 py-6">
      {/* Intro hero banner */}
      <div className="border border-slate-200 bg-white rounded-xl p-6 sm:p-8 shadow-xs">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-medium text-amber-700 mb-2">
            <span>Production-Grade Architecture</span>
            <span aria-hidden="true">·</span>
            <span>FastAPI &amp; Express Relational Implementations</span>
            <span aria-hidden="true">·</span>
            <span>Fault-Isolated Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-3">
            Bulk Certificate Generator API Workbench
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            High-throughput certificate generation engine accepting bulk recipient batches, enforcing strict schema validation, isolating recipient failures without aborting valid rows, and issuing tamper-evident credentials with cryptographic checksums.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              onClick={() => onNavigate('create')}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
            >
              <span>Dispatch Bulk Generation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigate('tests')}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Run 6-Point Test Matrix</span>
            </button>
            <button
              onClick={() => onNavigate('python')}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-amber-800 bg-amber-50 rounded-lg hover:bg-amber-100 border border-amber-200 transition-colors"
            >
              <span>Inspect Python FastAPI Code</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-slate-200 bg-white rounded-xl p-5 shadow-xs">
          <div className="text-xs font-medium text-slate-500 mb-1">Total Generation Jobs</div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
            {totalJobs}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span>{totalRecipients} total recipients received</span>
          </div>
        </div>

        <div className="border border-slate-200 bg-white rounded-xl p-5 shadow-xs">
          <div className="text-xs font-medium text-slate-500 mb-1">Certificates Issued</div>
          <div className="text-2xl font-bold tracking-tight text-emerald-600 font-mono tabular-nums">
            {totalCertificates}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>Cryptographically signed</span>
          </div>
        </div>

        <div className="border border-slate-200 bg-white rounded-xl p-5 shadow-xs">
          <div className="text-xs font-medium text-slate-500 mb-1">Isolated Failures</div>
          <div className="text-2xl font-bold tracking-tight text-amber-600 font-mono tabular-nums">
            {totalFailures}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            <span>Handled without aborting job</span>
          </div>
        </div>

        <div className="border border-slate-200 bg-white rounded-xl p-5 shadow-xs">
          <div className="text-xs font-medium text-slate-500 mb-1">Relational Database</div>
          <div className="text-base font-semibold text-slate-900 flex items-center gap-2 mt-1">
            <Database className="w-4 h-4 text-slate-700" />
            <span>SQLite Embedded</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            <span>PRAGMA foreign_keys = ON</span>
          </div>
        </div>
      </div>

      {/* Core Architectural Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-slate-200 bg-white rounded-xl p-5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 mb-3">
            <Zap className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 mb-1">Asynchronous Batch Queue</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Requests return <span className="font-mono text-slate-800">202 Accepted</span> immediately. Worker processes hundreds of recipients with zero timeout risk, updating progress continuously.
          </p>
        </div>

        <div className="border border-slate-200 bg-white rounded-xl p-5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-3">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 mb-1">Zero-Cascading Failure Isolation</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            An invalid email or corrupted name does not fail the batch. Errors are logged to the relational failure index, while all valid recipients receive certificates.
          </p>
        </div>

        <div className="border border-slate-200 bg-white rounded-xl p-5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-3">
            <FileCheck className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 mb-1">PDF/SVG &amp; Verification Hash</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Generates vector SVGs and downloadable PDFs with SHA-256 integrity signatures, verifiable via public endpoint or scanned verification QR code.
          </p>
        </div>
      </div>

      {/* Recent Jobs Table */}
      <div className="border border-slate-200 bg-white rounded-xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Recent Generation Jobs</h2>
            <p className="text-xs text-slate-500">Live relational state tracking across all batches</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
              title="Refresh Jobs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => onNavigate('create')}
              className="text-xs font-medium text-amber-700 hover:text-amber-800 px-2 py-1"
            >
              + Create New
            </button>
          </div>
        </div>

        {jobs.length === 0 ? (
          <div className="p-8 text-center">
            <Award className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
            <p className="text-sm font-medium text-slate-900">No generation jobs found</p>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Dispatch your first certificate batch or load a preset test cohort.
            </p>
            <button
              onClick={() => onNavigate('create')}
              className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Create First Batch
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Job ID &amp; Course</th>
                  <th className="py-3 px-4 font-semibold">Organization</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Processed / Total</th>
                  <th className="py-3 px-4 font-semibold text-right">Success / Failed</th>
                  <th className="py-3 px-4 font-semibold">Created</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {jobs.map((job) => {
                  const pct = job.total_count > 0 ? Math.round((job.processed_count / job.total_count) * 100) : 0;
                  
                  let statusBadgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
                  if (job.status === 'completed') statusBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  if (job.status === 'partial') statusBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
                  if (job.status === 'failed') statusBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
                  if (job.status === 'processing') statusBadgeClass = 'bg-blue-50 text-blue-700 border-blue-200';

                  return (
                    <tr
                      key={job.id}
                      onClick={() => onSelectJob(job.id)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{job.title}</div>
                        <div className="font-mono text-[11px] text-slate-500">{job.id}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800">{job.organization_name}</div>
                        <div className="text-[11px] text-slate-500">{job.instructor_name}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${statusBadgeClass}`}>
                          {job.status.toUpperCase()}
                        </span>
                        {job.status === 'processing' && (
                          <div className="w-20 bg-slate-200 rounded-full h-1 mt-1.5 overflow-hidden">
                            <div
                              className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        {job.processed_count} / {job.total_count}
                        <span className="text-slate-400 text-[10px] ml-1">({pct}%)</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        <span className="text-emerald-600 font-medium">{job.success_count}</span>
                        <span className="text-slate-400 mx-1">/</span>
                        <span className={job.failure_count > 0 ? 'text-rose-600 font-medium' : 'text-slate-400'}>
                          {job.failure_count}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {formatDateTime(job.created_at)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectJob(job.id);
                          }}
                          className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                        >
                          View Job
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
