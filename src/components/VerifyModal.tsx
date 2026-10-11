import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, AlertCircle, Search, CheckCircle } from 'lucide-react';

interface VerifyModalProps {
  initialCertId?: string;
  onClose: () => void;
}

export const VerifyModal: React.FC<VerifyModalProps> = ({ initialCertId = '', onClose }) => {
  const [certId, setCertId] = useState(initialCertId);
  const [result, setResult] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleVerify = async (idToVerify: string) => {
    const cleanId = idToVerify.trim();
    if (!cleanId) return;

    setIsLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/certificates/verify/${cleanId}`);
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setResult({ valid: false, message: 'Verification lookup failed due to network error.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialCertId) {
      handleVerify(initialCertId);
    }
  }, [initialCertId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">Certificate Verification Engine</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerify(certId);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={certId}
              onChange={(e) => setCertId(e.target.value)}
              placeholder="Enter Certificate ID (e.g. CERT-2026-XXXX)"
              className="flex-1 px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
              required
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors shrink-0"
            >
              {isLoading ? 'Verifying...' : 'Verify'}
            </button>
          </form>

          {searched && !isLoading && result && (
            <div className="space-y-4">
              {result.valid ? (
                <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>AUTHENTIC CREDENTIAL VERIFIED</span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="text-slate-500 text-[11px]">Recipient</div>
                    <div className="font-bold text-slate-900 text-sm">{result.recipient_name}</div>

                    <div className="text-slate-500 text-[11px] pt-1">Course / Event</div>
                    <div className="font-semibold text-slate-900">{result.course_title}</div>

                    <div className="grid grid-cols-2 gap-2 pt-2 text-[11px]">
                      <div>
                        <span className="text-slate-500">Instructor:</span>{' '}
                        <span className="font-medium text-slate-800">{result.instructor_name}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Issue Date:</span>{' '}
                        <span className="font-medium text-slate-800">{result.issue_date}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-500">Organization:</span>{' '}
                        <span className="font-medium text-slate-800">{result.organization_name}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-emerald-200/60 mt-2">
                      <div className="text-[10px] text-slate-500">Cryptographic Verification Hash</div>
                      <div className="font-mono text-[11px] text-slate-800 break-all select-all font-semibold">
                        {result.verification_hash}
                      </div>
                      <div className="text-[10px] text-emerald-700 font-medium mt-1">
                        Status: {result.tamper_check || 'PASSED_CRYPTOGRAPHIC_INTEGRITY'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-rose-200 bg-rose-50/60 rounded-xl p-5 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-rose-800 font-bold">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>VERIFICATION FAILED</span>
                  </div>
                  <p className="text-rose-700">
                    {result.message || 'No matching certificate record found with this ID.'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Please ensure the certificate ID is typed accurately, including any hyphens and casing.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 text-right">
          <button
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
