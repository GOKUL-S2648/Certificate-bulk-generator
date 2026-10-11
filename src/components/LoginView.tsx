import React, { useState } from 'react';
import { Award, ShieldCheck, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase.ts';

interface LoginViewProps {
  onGuestContinue?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onGuestContinue }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to start Google sign-in. Please try again.';
      setError(message);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-linear-to-b from-slate-900 via-slate-900 to-slate-950 flex items-center justify-center px-4 py-12">
      <section className="w-full max-w-md bg-white border border-slate-200/80 rounded-2xl shadow-2xl p-8 text-center backdrop-blur-sm">
        <div className="mx-auto mb-5 h-14 w-14 flex items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 shadow-inner">
          <Award className="h-8 w-8" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          CertifyBulk API
        </h1>

        <p className="mt-1.5 text-sm text-slate-500">
          High-Throughput Certificate Generator &amp; Verification Engine
        </p>

        <div className="mt-8 text-left bg-slate-50 rounded-xl p-4 border border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">
            Sign in to your account
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Authenticate using Google OAuth to manage batch jobs, issue certificates, and download PDF archives.
          </p>
        </div>

        {!isSupabaseConfigured && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-left flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Supabase public keys are not detected in <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">.env.local</code>. Please verify your environment configuration.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="mt-6 w-full flex items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 hover:border-slate-400 active:scale-[0.99] disabled:opacity-60 transition-all shadow-xs cursor-pointer"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12c0 1.97.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
          )}
          <span>{loading ? 'Connecting to Google...' : 'Continue with Google'}</span>
        </button>

        {error && (
          <div role="alert" className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-left flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {onGuestContinue && (
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center">
            <button
              type="button"
              onClick={onGuestContinue}
              className="group text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1.5 py-1 px-2 rounded-md hover:bg-slate-50"
            >
              <span>Explore Dashboard as Guest</span>
              <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}

        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>Secured with Supabase Authentication</span>
        </p>
      </section>
    </main>
  );
};
