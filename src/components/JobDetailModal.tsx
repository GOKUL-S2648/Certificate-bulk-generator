import React, { useEffect, useState } from 'react';
import type {
  JobRecord,
  CertificateRecord,
} from '../types.ts';

import { apiDownload, apiFetch } from '../lib/api.ts';

import {
  X,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Archive,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

interface JobDetailModalProps {
  jobId: string;
  onClose: () => void;
  onPreviewCert: (certId: string) => void;
  onVerifyCert: (certId: string) => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  jobId,
  onClose,
  onPreviewCert,
  onVerifyCert,
}) => {
  const [job, setJob] = useState<JobRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  /**
   * Load one job using the authenticated API.
   */
  const fetchJob = async () => {
    try {
      const response = await apiFetch(
        `/api/certificates/jobs/${encodeURIComponent(jobId)}`,
      );

      if (!response.ok) {
        let message = `Request failed (${response.status})`;

        try {
          const data = await response.json();
          message =
            data.message ||
            data.error ||
            message;
        } catch {
          // Retain the fallback message.
        }

        if (response.status === 401) {
          message =
            'Your login session is missing or expired. Sign in again.';
        } else if (response.status === 404) {
          message =
            'Job not found, or this job does not belong to your account.';
        }

        setJob(null);
        setLoadError(message);
        return;
      }

      const data: JobRecord = await response.json();

      setJob(data);
      setLoadError(null);
    } catch (error) {
      console.error('Error fetching job:', error);

      setLoadError(
        error instanceof Error
          ? error.message
          : 'Unable to load job details.',
      );

      setJob(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);

      try {
        const response = await apiFetch(
          `/api/certificates/jobs/${encodeURIComponent(jobId)}`,
        );

        if (cancelled) return;

        if (!response.ok) {
          let message = `Request failed (${response.status})`;

          try {
            const data = await response.json();

            message =
              data.message ||
              data.error ||
              message;
          } catch {
            // Retain the fallback message.
          }

          if (response.status === 401) {
            message =
              'Your login session is missing or expired. Sign in again.';
          } else if (response.status === 404) {
            message =
              'Job not found, or this job does not belong to your account.';
          }

          setJob(null);
          setLoadError(message);
          return;
        }

        const data: JobRecord = await response.json();

        if (cancelled) return;

        setJob(data);
        setLoadError(null);
      } catch (error) {
        if (cancelled) return;

        console.error('Error fetching job:', error);

        setLoadError(
          error instanceof Error
            ? error.message
            : 'Unable to load job details.',
        );

        setJob(null);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [jobId]);

  /**
   * Poll for updated progress while a job is running.
   */
  useEffect(() => {
    if (
      !job ||
      (job.status !== 'processing' &&
        job.status !== 'pending')
    ) {
      return;
    }

    const interval = window.setInterval(() => {
      void fetchJob();
    }, 2000);

    return () => {
      window.clearInterval(interval);
    };
  }, [job?.status, jobId]);

  /**
   * Authenticated file download handler.
   */
  const handleDownload = async (
    url: string,
    filename: string,
    downloadKey: string,
  ) => {
    try {
      setDownloading(downloadKey);
      setDownloadError(null);

      await apiDownload(url, filename);
    } catch (error) {
      console.error('Download failed:', error);

      setDownloadError(
        error instanceof Error
          ? error.message
          : 'Download failed. Please try again.',
      );
    } finally {
      setDownloading(null);
    }
  };

  const copyToClipboard = async (
    text: string,
    id: string,
  ) => {
    try {
      await navigator.clipboard.writeText(text);

      setCopiedId(id);

      window.setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch (error) {
      console.error('Clipboard copy failed:', error);
    }
  };

  if (!job && isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
        <div className="bg-white rounded-xl p-8 max-w-sm w-full text-center space-y-3">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />

          <p className="text-sm font-medium text-slate-800">
            Loading Job Details...
          </p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
        <div className="bg-white rounded-xl p-6 max-w-md w-full text-center space-y-4">
          <p className="text-sm font-semibold text-slate-900">
            Unable to open job
          </p>

          <p className="text-sm text-slate-600 break-words">
            {loadError || 'Job not found.'}
          </p>

          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsLoading(true);
                void fetchJob();
              }}
              className="px-4 py-2 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Try again
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const pct =
    job.total_count > 0
      ? Math.round(
          (job.processed_count / job.total_count) * 100,
        )
      : 0;

  let statusBadge =
    'bg-slate-100 text-slate-700 border-slate-200';

  if (job.status === 'completed') {
    statusBadge =
      'bg-emerald-50 text-emerald-700 border-emerald-200';
  }

  if (job.status === 'partial') {
    statusBadge =
      'bg-amber-50 text-amber-700 border-amber-200';
  }

  if (job.status === 'failed') {
    statusBadge =
      'bg-rose-50 text-rose-700 border-rose-200';
  }

  if (job.status === 'processing') {
    statusBadge =
      'bg-blue-50 text-blue-700 border-blue-200';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${statusBadge}`}
              >
                {job.status.toUpperCase()}
              </span>

              <span className="text-xs font-mono text-slate-500">
                {job.id}
              </span>
            </div>

            <h2 className="text-base font-bold text-slate-900">
              {job.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsLoading(true);
                void fetchJob();
              }}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-md transition-colors"
              title="Refresh status"
            >
              <RefreshCw
                className={`w-4 h-4 ${
                  job.status === 'processing'
                    ? 'animate-spin'
                    : ''
                }`}
              />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-md transition-colors"
              aria-label="Close job details"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Progress */}
          <div className="border border-slate-200 bg-slate-50/50 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-2">
              <span className="flex items-center gap-2">
                <span>
                  Progress: {job.processed_count} of{' '}
                  {job.total_count} processed
                </span>

                {job.status === 'processing' && (
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                )}
              </span>

              <span className="font-mono tabular-nums font-semibold text-slate-900">
                {pct}%
              </span>
            </div>

            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  job.status === 'completed'
                    ? 'bg-emerald-500'
                    : job.status === 'failed'
                      ? 'bg-rose-500'
                      : 'bg-amber-500'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>

            <div className="grid grid-cols-4 gap-3 mt-4 text-center">
              <div className="border border-slate-200 bg-white rounded-lg p-2.5">
                <div className="text-[11px] text-slate-500">
                  Total
                </div>
                <div className="text-base font-bold font-mono text-slate-900">
                  {job.total_count}
                </div>
              </div>

              <div className="border border-slate-200 bg-white rounded-lg p-2.5">
                <div className="text-[11px] text-slate-500">
                  Processed
                </div>
                <div className="text-base font-bold font-mono text-slate-900">
                  {job.processed_count}
                </div>
              </div>

              <div className="border border-emerald-200 bg-emerald-50/40 rounded-lg p-2.5">
                <div className="text-[11px] text-emerald-700">
                  Succeeded
                </div>
                <div className="text-base font-bold font-mono text-emerald-700">
                  {job.success_count}
                </div>
              </div>

              <div className="border border-rose-200 bg-rose-50/40 rounded-lg p-2.5">
                <div className="text-[11px] text-rose-700">
                  Failed
                </div>
                <div className="text-base font-bold font-mono text-rose-700">
                  {job.failure_count}
                </div>
              </div>
            </div>
          </div>

          {/* Download ZIP */}
          {job.success_count > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-amber-50/60 border border-amber-200 rounded-xl">
              <div>
                <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <Archive className="w-4 h-4 text-amber-600" />

                  <span>
                    Bulk Certificate Download Package
                  </span>
                </h4>

                <p className="text-[11px] text-amber-800 mt-0.5">
                  Download all {job.success_count} issued
                  certificates as PDFs with a cryptographic manifest.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  void handleDownload(
                    `/api/certificates/jobs/${encodeURIComponent(
                      job.id,
                    )}/download-zip`,
                    `certificates-${job.id}.zip`,
                    'zip',
                  )
                }
                disabled={downloading !== null}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />

                <span>
                  {downloading === 'zip'
                    ? 'Preparing ZIP...'
                    : 'Download All (.zip)'}
                </span>
              </button>
            </div>
          )}

          {downloadError && (
            <div
              role="alert"
              className="border border-rose-200 bg-rose-50 text-rose-800 rounded-lg p-3 text-xs"
            >
              {downloadError}
            </div>
          )}

          {/* Failure diagnostics */}
          {job.failures && job.failures.length > 0 && (
            <div className="border border-rose-200 bg-rose-50/40 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />

                  <span>
                    Isolated Failures ({job.failures.length})
                  </span>
                </h3>

                <span className="text-[11px] text-rose-700">
                  Other valid certificates were processed.
                </span>
              </div>

              <div className="space-y-2">
                {job.failures.map((failure) => (
                  <div
                    key={failure.id}
                    className="border border-rose-200/80 bg-white rounded-lg p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-semibold text-slate-900">
                        {failure.recipient_name ||
                          '<Empty Recipient Name>'}
                      </div>

                      <div className="text-[11px] text-slate-500 font-mono">
                        {failure.recipient_email ||
                          '<Empty Email>'}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-semibold">
                        {failure.error_code}
                      </span>

                      <span className="text-[11px] text-rose-700 font-medium">
                        {failure.error_reason}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Issued certificates */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />

                <span>
                  Successfully Issued Certificates (
                  {job.certificates?.length || 0})
                </span>
              </h3>
            </div>

            {!job.certificates ||
            job.certificates.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                {job.status === 'processing'
                  ? 'Generating certificates in progress...'
                  : 'No successful certificates generated for this batch.'}
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {job.certificates.map(
                  (cert: CertificateRecord) => (
                    <div
                      key={cert.id}
                      className="p-3 hover:bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">
                          {cert.recipient_name}
                        </div>

                        <div className="text-[11px] text-slate-500">
                          {cert.recipient_email}
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1 rounded">
                            {cert.id}
                          </span>

                          <span className="text-slate-400 text-[10px]">
                            ·
                          </span>

                          <span
                            className="font-mono text-[10px] text-slate-500 truncate max-w-xs"
                            title={cert.verification_hash}
                          >
                            Hash:{' '}
                            {cert.verification_hash.substring(
                              0,
                              12,
                            )}
                            ...
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            onPreviewCert(cert.id)
                          }
                          className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded flex items-center gap-1 transition-colors"
                          title="Preview certificate"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Preview</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void handleDownload(
                              `/api/certificates/${encodeURIComponent(
                                cert.id,
                              )}/download?format=pdf`,
                              `certificate-${cert.id}.pdf`,
                              `pdf-${cert.id}`,
                            )
                          }
                          disabled={downloading !== null}
                          className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded flex items-center gap-1 transition-colors disabled:opacity-50"
                          title="Download PDF"
                        >
                          <Download className="w-3 h-3" />

                          <span>
                            {downloading === `pdf-${cert.id}`
                              ? 'Preparing...'
                              : 'PDF'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void handleDownload(
                              `/api/certificates/${encodeURIComponent(
                                cert.id,
                              )}/download?format=svg`,
                              `certificate-${cert.id}.svg`,
                              `svg-${cert.id}`,
                            )
                          }
                          disabled={downloading !== null}
                          className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded flex items-center gap-1 transition-colors disabled:opacity-50"
                          title="Download SVG"
                        >
                          <span>
                            {downloading === `svg-${cert.id}`
                              ? 'Preparing...'
                              : 'SVG'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onVerifyCert(cert.id)
                          }
                          className="px-2.5 py-1 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded flex items-center gap-1 transition-colors"
                          title="Verify certificate"
                        >
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>Verify</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void copyToClipboard(
                              cert.id,
                              cert.id,
                            )
                          }
                          className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded flex items-center gap-1"
                          title="Copy certificate ID"
                        >
                          <span>
                            {copiedId === cert.id
                              ? 'Copied'
                              : 'Copy ID'}
                          </span>
                        </button>
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <span>
            Instructor: {job.instructor_name} · Organization:{' '}
            {job.organization_name}
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};