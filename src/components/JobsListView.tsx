import React, { useState } from 'react';
import { JobRecord } from '../types.ts';
import { Search, RefreshCw, Plus, Award } from 'lucide-react';

interface JobsListViewProps {
  jobs: JobRecord[];
  onSelectJob: (jobId: string) => void;
  onNavigateToCreate: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const JobsListView: React.FC<JobsListViewProps> = ({
  jobs,
  onSelectJob,
  onNavigateToCreate,
  onRefresh,
  isLoading,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredJobs = jobs.filter((j) => {
    if (filterStatus !== 'all' && j.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = j.title.toLowerCase().includes(q);
      const matchOrg = j.organization_name.toLowerCase().includes(q);
      const matchId = j.id.toLowerCase().includes(q);
      if (!matchTitle && !matchOrg && !matchId) return false;
    }
    return true;
  });

  return (
    <div className="py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Certificate Generation Jobs</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Relational registry of all batch processing tasks, issue status, and recipient outcomes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={onNavigateToCreate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-amber-400 rounded-lg hover:bg-amber-300 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Batch Job</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Segmented Filter Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
          {['all', 'completed', 'partial', 'processing', 'failed'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap capitalize ${
                filterStatus === st
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, org, or ID..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
          />
        </div>
      </div>

      {/* Jobs Table */}
      <div className="border border-slate-200 bg-white rounded-xl shadow-xs overflow-hidden">
        {filteredJobs.length === 0 ? (
          <div className="p-12 text-center">
            <Award className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800">No jobs match your filter</p>
            <p className="text-xs text-slate-500 mt-1">Try resetting the filter or submit a new batch.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold">Job ID &amp; Course Title</th>
                  <th className="py-3 px-4 font-semibold">Organization &amp; Instructor</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Progress</th>
                  <th className="py-3 px-4 font-semibold text-right">Success / Fail</th>
                  <th className="py-3 px-4 font-semibold">Date Created</th>
                  <th className="py-3 px-4 font-semibold text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredJobs.map((job) => {
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
                      className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{job.title}</div>
                        <div className="font-mono text-[11px] text-slate-400">{job.id}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800">{job.organization_name}</div>
                        <div className="text-[11px] text-slate-500">{job.instructor_name}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${statusBadgeClass}`}>
                          {job.status.toUpperCase()}
                        </span>
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
                        {new Date(job.created_at).toLocaleDateString()} {new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectJob(job.id);
                          }}
                          className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                        >
                          Inspect
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
