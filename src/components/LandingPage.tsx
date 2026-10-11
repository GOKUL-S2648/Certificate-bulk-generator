import React from 'react';
import {
  Award,
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Mail,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onSignIn,
}) => {
  return (
    <div className="cb-landing min-h-screen overflow-hidden">
      {/* Navigation */}
      <header className="cb-nav-wrap">
        <nav className="cb-nav">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3 text-left"
          >
            <span className="cb-brand-icon">
              <Award size={22} />
            </span>
            <span>
              <span className="block text-lg font-bold tracking-tight">
                Certify<span className="cb-brand-accent">Bulk</span>
              </span>
              <span className="block text-[9px] uppercase tracking-[0.22em] text-[#817d70]">
                Certificates, simplified
              </span>
            </span>
          </button>

          <div className="hidden items-center gap-8 text-sm text-[#66665b] md:flex">
            <a href="#features" className="cb-nav-link">Features</a>
            <a href="#workflow" className="cb-nav-link">How it works</a>
            <a href="#trust" className="cb-nav-link">Why CertifyBulk</a>
          </div>

          <button
            type="button"
            onClick={onSignIn}
            className="cb-outline-button"
          >
            Sign in <ArrowRight size={15} />
          </button>
        </nav>
      </header>

      {/* Hero */}
      <main>
        <section className="cb-hero">
          <div className="cb-hero-copy">
            <div className="cb-eyebrow">
              <span className="cb-live-dot" />
              BULK CERTIFICATE AUTOMATION
            </div>

            <h1 className="cb-headline">
              Every achievement
              <br />
              deserves a <span>certificate.</span>
            </h1>

            <p className="cb-description">
              Create, generate and deliver certificates in batches.
              Turn spreadsheets into beautifully issued certificates
              without the repetitive work.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onGetStarted}
                className="cb-primary-button"
              >
                Start creating <ArrowRight size={17} />
              </button>

              <a href="#workflow" className="cb-secondary-button">
                See how it works
              </a>
            </div>

            <div className="cb-proof-row">
              <div className="cb-proof-icon">
                <CheckCircle2 size={17} />
              </div>
              <p>
                Batch generation
                <span> · </span>
                PDF downloads
                <span> · </span>
                Email delivery
              </p>
            </div>
          </div>

          {/* Certificate preview */}
          <div className="cb-hero-visual">
            <div className="cb-orbit cb-orbit-one" />
            <div className="cb-orbit cb-orbit-two" />

            <div className="cb-float-note cb-note-top">
              <span className="cb-note-icon"><Zap size={17} /></span>
              <span>
                <strong>Batch ready</strong>
                <small>Less repetitive work</small>
              </span>
            </div>

            <div className="cb-certificate">
              <div className="cb-certificate-inner">
                <div className="cb-cert-topline">
                  <span>CERTIFYBULK</span>
                  <span>01 / 01</span>
                </div>

                <div className="cb-cert-emblem">
                  <Award size={31} strokeWidth={1.4} />
                </div>

                <p className="cb-cert-kicker">CERTIFICATE OF</p>
                <h2>Achievement</h2>

                <p className="cb-cert-intro">
                  This certificate is proudly presented to
                </p>

                <p className="cb-recipient">Alex Morgan</p>

                <div className="cb-cert-rule" />

                <p className="cb-cert-body">
                  In recognition of dedication, effort, and successful
                  completion of the programme.
                </p>

                <div className="cb-cert-bottom">
                  <div>
                    <div className="cb-signature">A. Williams</div>
                    <div className="cb-sign-line" />
                    <small>PROGRAM DIRECTOR</small>
                  </div>

                  <div className="cb-seal">
                    <ShieldCheck size={24} />
                    <span>VERIFIED</span>
                  </div>

                  <div className="cb-cert-date">
                    <strong>2026</strong>
                    <div className="cb-sign-line" />
                    <small>ISSUED</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="cb-float-note cb-note-bottom">
              <span className="cb-note-icon cb-note-green">
                <Mail size={17} />
              </span>
              <span>
                <strong>Ready for delivery</strong>
                <small>PDF certificates and email</small>
              </span>
              <CheckCircle2 size={17} className="text-[#59765b]" />
            </div>
          </div>
        </section>

        {/* Capability strip */}
        <section className="cb-capabilities" id="features">
          <div className="cb-capability-heading">
            <span>BUILT FOR REPEATABLE WORKFLOWS</span>
            <h2>From recipient list to finished certificates.</h2>
          </div>

          <div className="cb-feature-grid">
            <article className="cb-feature-card">
              <div className="cb-feature-icon">
                <FileSpreadsheet size={21} />
              </div>
              <h3>One batch, many recipients</h3>
              <p>
                Prepare recipient details and create a batch instead of
                producing every certificate individually.
              </p>
            </article>

            <article className="cb-feature-card">
              <div className="cb-feature-icon">
                <FileText size={21} />
              </div>
              <h3>Downloadable PDFs</h3>
              <p>
                Generate certificate PDFs and review available outputs
                from your batch jobs.
              </p>
            </article>

            <article className="cb-feature-card">
              <div className="cb-feature-icon">
                <Mail size={21} />
              </div>
              <h3>Delivery made simpler</h3>
              <p>
                Use the supported email workflow to deliver generated
                certificates to recipients.
              </p>
            </article>
          </div>
        </section>

        {/* Workflow */}
        <section className="cb-workflow" id="workflow">
          <div className="cb-workflow-copy">
            <span className="cb-section-label">A SIMPLER PROCESS</span>
            <h2>
              Less admin.
              <br />
              More celebrating.
            </h2>
            <p>
              Keep the process organised, from setting up a certificate
              batch to reviewing the results.
            </p>

            <button
              type="button"
              onClick={onGetStarted}
              className="cb-primary-button mt-6"
            >
              Get started <ArrowRight size={17} />
            </button>
          </div>

          <div className="cb-steps">
            <div className="cb-step">
              <span className="cb-step-number">01</span>
              <div>
                <h3>Set up your batch</h3>
                <p>Enter the certificate details and recipient information.</p>
              </div>
              <FileSpreadsheet size={21} />
            </div>

            <div className="cb-step">
              <span className="cb-step-number">02</span>
              <div>
                <h3>Generate certificates</h3>
                <p>Submit the batch and let the generation workflow run.</p>
              </div>
              <Sparkles size={21} />
            </div>

            <div className="cb-step">
              <span className="cb-step-number">03</span>
              <div>
                <h3>Review and deliver</h3>
                <p>Review job results, access PDFs and use email delivery.</p>
              </div>
              <CheckCircle2 size={21} />
            </div>
          </div>
        </section>

        {/* Trust / CTA */}
        <section className="cb-final-cta" id="trust">
          <div className="cb-cta-emblem">
            <Award size={25} />
          </div>
          <span className="cb-section-label">YOUR NEXT BATCH STARTS HERE</span>
          <h2>Make every certificate count.</h2>
          <p>
            Bring your recipient list. CertifyBulk helps take care of
            the repetitive certificate workflow.
          </p>
          <button
            type="button"
            onClick={onGetStarted}
            className="cb-cta-button"
          >
            Start with CertifyBulk <ArrowRight size={17} />
          </button>
        </section>
      </main>

      {/* Footer */}
      <footer className="cb-footer">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2"
        >
          <span className="cb-footer-icon"><Award size={17} /></span>
          <span className="font-bold">CertifyBulk</span>
        </button>

        <p>Certificate creation, without the busywork.</p>

        <button type="button" onClick={onSignIn} className="cb-footer-link">
          Sign in to your workspace <ArrowRight size={14} />
        </button>
      </footer>
    </div>
  );
};
