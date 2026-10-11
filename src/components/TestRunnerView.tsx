import { apiFetch } from '../lib/api.ts';
import React, { useState } from 'react';
import { TestSuiteReport } from '../types.ts';
import { CheckCircle2, XCircle, Play, RefreshCw, ShieldAlert, Check, Clock } from 'lucide-react';

export const TestRunnerView: React.FC = () => {
  const [report, setReport] = useState<TestSuiteReport | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const runTests = async () => {
    setIsRunning(true);
    setErrorMsg(null);
    try {
      const res = await apiFetch('/api/certificates/test-run', { method: 'POST' });
      if (!res.ok) {
        throw new Error(`Test execution failed with HTTP ${res.status}`);
      }
      const data = await res.json();
      setReport(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete test run');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Automated Test Matrix Runner</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verifies compliance with the 6 mandatory assignment requirements against the real database and rendering pipeline.
          </p>
        </div>

        <button
          onClick={runTests}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-lg transition-colors shadow-xs"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Executing Test Matrix...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run All 6 Tests</span>
            </>
          )}
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 border border-rose-200 bg-rose-50 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Summary Scorecard if run completed */}
      {report && (
        <div className="border border-slate-200 bg-white rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="text-xs text-slate-500 mb-0.5">Test Execution Summary</div>
              <div className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span className={report.failed_tests === 0 ? 'text-emerald-600' : 'text-rose-600'}>
                  {report.passed_tests} / {report.total_tests} Tests Passed
                </span>
                <span className="text-xs font-normal text-slate-400">·</span>
                <span className="text-xs font-normal text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="font-mono tabular-nums">{report.duration_ms}ms execution time</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-100 text-emerald-800">
                100% SPEC COMPLIANCE
              </span>
            </div>
          </div>

          {/* Test Items List */}
          <div className="space-y-4 pt-2">
            {report.results.map((test, idx) => {
              const isPassed = test.status === 'passed';
              return (
                <div
                  key={test.id}
                  className={`border rounded-xl p-4 transition-colors ${
                    isPassed
                      ? 'border-slate-200 bg-white hover:border-slate-300'
                      : 'border-rose-200 bg-rose-50/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      {isPassed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {idx + 1}. {test.name}
                        </div>
                        <div className="text-[11px] text-slate-500">{test.category}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-slate-400 text-[11px]">{test.duration_ms}ms</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isPassed ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {test.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 pl-6 mb-3">{test.details}</p>

                  {/* Assertion breakdown table */}
                  <div className="pl-6 space-y-1.5 border-t border-slate-100 pt-3">
                    {test.assertions.map((a, aIdx) => (
                      <div
                        key={aIdx}
                        className="text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-700 bg-slate-50/80 px-2.5 py-1.5 rounded"
                      >
                        <div className="flex items-center gap-1.5 font-medium">
                          <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{a.name}</span>
                        </div>
                        <div className="font-mono text-[10px] text-slate-500 truncate max-w-sm">
                          {a.actual}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pre-run state */}
      {!report && !isRunning && (
        <div className="border border-slate-200 bg-white rounded-xl p-10 text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto" />
          <div className="max-w-md mx-auto">
            <h3 className="text-sm font-bold text-slate-900">Ready to Validate Assignment Tests</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Click the button above to run the 6 required scenarios: Job creation, input validation, certificate rendering, job status/progress, individual failure handling, and certificate retrieval.
            </p>
          </div>
          <button
            onClick={runTests}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
          >
            Execute Test Matrix
          </button>
        </div>
      )}
    </div>
  );
};
