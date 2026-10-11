import React, { useEffect, useState } from 'react';
import { CertificateRecord } from '../types.ts';
import { X, Download, ShieldCheck, Copy, Check, ExternalLink } from 'lucide-react';

interface CertificatePreviewModalProps {
  certId: string;
  onClose: () => void;
  onVerify: (certId: string) => void;
}

export const CertificatePreviewModal: React.FC<CertificatePreviewModalProps> = ({
  certId,
  onClose,
  onVerify,
}) => {
  const [cert, setCert] = useState<CertificateRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedHash, setCopiedHash] = useState(false);

  useEffect(() => {
    const fetchCert = async () => {
      try {
        const res = await fetch(`/api/certificates/${certId}`);
        if (res.ok) {
          const data = await res.json();
          setCert(data);
        }
      } catch (err) {
        console.error('Error fetching cert:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCert();
  }, [certId]);

  const copyHash = () => {
    if (!cert) return;
    navigator.clipboard.writeText(cert.verification_hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[96vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {certId}
              </span>
              <span className="text-xs text-slate-500">Official Certificate Render</span>
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-0.5">
              {cert?.recipient_name || 'Loading Certificate...'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onVerify(certId)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verify Authenticity</span>
            </button>
            <a
              href={`/api/certificates/${certId}/download?format=pdf`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Display Canvas */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100 flex items-center justify-center">
          {isLoading ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-600 font-medium">Rendering vector certificate template...</p>
            </div>
          ) : cert?.svg_content ? (
            <div
              className="w-full max-w-4xl bg-white shadow-xl rounded-lg overflow-hidden border border-slate-300"
              dangerouslySetInnerHTML={{ __html: cert.svg_content }}
            />
          ) : (
            <div className="py-20 text-center text-xs text-rose-600">
              Failed to load certificate template graphics.
            </div>
          )}
        </div>

        {/* Footer Meta bar */}
        {cert && (
          <div className="px-6 py-3 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between text-xs text-slate-600 gap-3">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 font-mono text-[11px]">
                <span className="text-slate-400">HASH:</span>
                <span className="text-slate-800 font-medium">{cert.verification_hash}</span>
                <button
                  onClick={copyHash}
                  className="p-1 text-slate-400 hover:text-slate-700 transition-colors ml-1"
                  title="Copy verification hash"
                >
                  {copiedHash ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-500" />}
                </button>
              </span>
              <span className="text-slate-400">·</span>
              <span>Issued: {cert.issue_date || new Date(cert.created_at).toLocaleDateString()}</span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`/api/certificates/${certId}/download?format=svg`}
                className="text-xs text-slate-600 hover:text-slate-900 underline"
              >
                Download Raw SVG
              </a>
              <button
                onClick={onClose}
                className="px-3 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
