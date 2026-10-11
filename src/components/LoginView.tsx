
import React, { useState } from 'react';
import {
  Award,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Loader2,
} from 'lucide-react';

import {
  supabase,
  isSupabaseConfigured,
} from '../lib/supabase.ts';

interface LoginViewProps {
  onGuestContinue?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onGuestContinue,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    if (!isSupabaseConfigured) {
      setError(
        'Supabase is not configured. Please check your environment variables.',
      );
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: authError } =
        await supabase.auth.signInWithOAuth({
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
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to start Google sign-in. Please try again.';

      setError(message);
      setLoading(false);
    }
  };

  return (
    <main className="cb-login-page">
      <section className="cb-login-shell">
        {/* Left image panel */}
        <aside className="cb-login-image-panel">
          <img
            className="cb-login-image"
            src="/certificate-login.png"
            alt="Elegant certificate with gold and sage-green details"
          />

          <div className="cb-login-image-overlay">
            <div className="cb-login-image-brand">
              <span className="cb-login-image-logo">
                <Award size={24} />
              </span>

              <div>
                <strong>CertifyBulk</strong>
                <span>CERTIFICATES, SIMPLIFIED</span>
              </div>
            </div>

            <div className="cb-login-image-caption">
              <span className="cb-login-image-kicker">
                EVERY ACHIEVEMENT MATTERS
              </span>

              <h2>
                Celebrate success.
                <br />
                <em>One certificate at a time.</em>
              </h2>

              <p>
                Create, generate, and deliver beautiful certificates
                with a simpler workflow.
              </p>
            </div>
          </div>
        </aside>

        {/* Right login panel */}
        <div className="cb-login-form-panel">
          <button
            type="button"
            className="cb-login-back"
            onClick={() => {
              window.location.href = '/';
            }}
            aria-label="Return to home"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="cb-login-content">
            <div className="cb-login-brand">
              <span className="cb-login-brand-icon">
                <Award size={23} />
              </span>

              <span>
                Certify<span>Bulk</span>
              </span>
            </div>

            <div className="cb-login-heading">
              <h1>Login to your account</h1>

              <p>
                Welcome back! Sign in to access your certificate
                workspace.
              </p>
            </div>

            <div className="cb-login-info">
              <span className="cb-login-info-icon">
                <ShieldCheck size={19} />
              </span>

              <div>
                <strong>Your certificate workspace</strong>
                <p>
                  Manage batch jobs, issue certificates, and access
                  generated PDF files.
                </p>
              </div>
            </div>

            {!isSupabaseConfigured && (
              <div className="cb-login-error" role="alert">
                <AlertCircle size={18} />

                <p>
                  Supabase configuration is missing. Check your
                  environment variables and restart the development
                  server.
                </p>
              </div>
            )}

            {error && (
              <div className="cb-login-error" role="alert">
                <AlertCircle size={18} />
                <p>{error}</p>
              </div>
            )}

            <div className="cb-login-actions">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading || !isSupabaseConfigured}
                className="cb-login-google"
              >
                {loading ? (
                  <Loader2
                    size={20}
                    className="animate-spin"
                  />
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 37.98 46.98 31.88 46.98 24.55Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19Z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.45-4.89 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"
                    />
                  </svg>
                )}

                <span>
                  {loading
                    ? 'Connecting to Google...'
                    : 'Sign in with Google'}
                </span>

                {!loading && (
                  <ArrowRight
                    size={17}
                    className="cb-login-google-arrow"
                  />
                )}
              </button>
            </div>

            {onGuestContinue && (
              <div className="cb-login-guest">
                <span>Want to explore first?</span>

                <button
                  type="button"
                  onClick={onGuestContinue}
                >
                  Continue as guest
                  <ArrowRight size={14} />
                </button>
              </div>
            )}

            <div className="cb-login-security">
              <ShieldCheck size={16} />
              <span>Secured with Supabase Authentication</span>
            </div>
          </div>

          <footer className="cb-login-footer">
            <span>© {new Date().getFullYear()} CertifyBulk</span>
            <span>Certificates, simplified.</span>
          </footer>
        </div>
      </section>
    </main>
  );
};
