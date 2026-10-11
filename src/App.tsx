import React, { useState, useEffect } from 'react';
import { Award } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

import { supabase } from './lib/supabase.ts';
import { apiFetch } from './lib/api.ts';

import { LoginView } from './components/LoginView.tsx';
import { Header } from './components/Header.tsx';
import { OverviewView } from './components/OverviewView.tsx';
import { BatchCreatorView } from './components/BatchCreatorView.tsx';
import { JobsListView } from './components/JobsListView.tsx';
import { ApiPlaygroundView } from './components/ApiPlaygroundView.tsx';
import { TestRunnerView } from './components/TestRunnerView.tsx';
import { PythonCodebaseView } from './components/PythonCodebaseView.tsx';
import { DocumentationView } from './components/DocumentationView.tsx';
import { JobDetailModal } from './components/JobDetailModal.tsx';
import { CertificatePreviewModal } from './components/CertificatePreviewModal.tsx';
import { VerifyModal } from './components/VerifyModal.tsx';

import type { JobRecord } from './types.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');

  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);

  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  const [activeJobModalId, setActiveJobModalId] =
    useState<string | null>(null);

  const [previewCertId, setPreviewCertId] =
    useState<string | null>(null);

  const [verifyCertId, setVerifyCertId] =
    useState<string | null>(null);

  const [isVerifyModalOpen, setIsVerifyModalOpen] =
    useState(false);

  // Check the saved session and listen for login/logout events.
  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (!mounted) return;

        if (error) {
          console.error(
            'Could not read Supabase session:',
            error.message,
          );
        }

        setUser(session?.user ?? null);
        setIsAuthLoading(false);
      })
      .catch((error) => {
        if (!mounted) return;

        console.error(
          'Could not read Supabase session:',
          error,
        );

        setIsAuthLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setIsGuest(false);
        setIsAuthLoading(false);
      },
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Sign out failed:', error.message);
      return;
    }

    setUser(null);
    setIsGuest(false);
    setJobs([]);
    setActiveJobModalId(null);
    setPreviewCertId(null);
  };

  // Fetch only jobs belonging to the authenticated user.
  const fetchJobs = async () => {
    if (!user) {
      setJobs([]);
      setIsLoadingJobs(false);
      return;
    }

    try {
      const response = await apiFetch(
        '/api/certificates/jobs',
      );

      if (response.status === 401) {
        console.warn(
          'Your session is invalid or expired. Please sign in again.',
        );

        setJobs([]);
        return;
      }

      if (!response.ok) {
        const message = await response.text();

        throw new Error(
          message || `Request failed: ${response.status}`,
        );
      }

      const data = await response.json();

      setJobs(data.jobs ?? []);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  // Start fetching only after authentication has been resolved.
  useEffect(() => {
    if (isAuthLoading) return;

    if (!user) {
      setJobs([]);
      setIsLoadingJobs(false);
      return;
    }

    setIsLoadingJobs(true);

    void fetchJobs();

    const interval = window.setInterval(() => {
      void fetchJobs();
    }, 4000);

    return () => {
      window.clearInterval(interval);
    };
  }, [user, isAuthLoading]);

  const handleJobCreated = (jobId: string) => {
    void fetchJobs();
    setActiveJobModalId(jobId);
    setActiveTab('jobs');
  };

  const handleOpenVerify = (certId: string) => {
    setVerifyCertId(certId);
    setIsVerifyModalOpen(true);
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-inner">
          <Award className="w-6 h-6 animate-spin" />
        </div>

        <p className="text-sm font-medium text-slate-300">
          Checking authentication...
        </p>
      </div>
    );
  }

  if (!user && !isGuest) {
    return (
      <LoginView
        onGuestContinue={() => setIsGuest(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewJobClick={() => setActiveTab('create')}
        user={user}
        onSignOut={handleSignOut}
        onSignIn={() => setIsGuest(false)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {activeTab === 'overview' && (
          <OverviewView
            jobs={jobs}
            onSelectJob={(jobId) =>
              setActiveJobModalId(jobId)
            }
            onNavigate={(tab) => setActiveTab(tab)}
            onRefresh={fetchJobs}
            isLoading={isLoadingJobs}
          />
        )}

        {activeTab === 'create' && (
          <BatchCreatorView
            onJobCreated={handleJobCreated}
          />
        )}

        {activeTab === 'jobs' && (
          <JobsListView
            jobs={jobs}
            onSelectJob={(jobId) =>
              setActiveJobModalId(jobId)
            }
            onNavigateToCreate={() =>
              setActiveTab('create')
            }
            onRefresh={fetchJobs}
            isLoading={isLoadingJobs}
          />
        )}

        {activeTab === 'playground' && (
          <ApiPlaygroundView />
        )}

        {activeTab === 'tests' && (
          <TestRunnerView />
        )}

        {activeTab === 'python' && (
          <PythonCodebaseView />
        )}

        {activeTab === 'docs' && (
          <DocumentationView />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">
              CertifyBulk API
            </span>

            <span aria-hidden="true">·</span>

            <span>
              Bulk Certificate Generator Assignment Deliverable
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>
              FastAPI &amp; Express Relational Engines
            </span>

            <span aria-hidden="true">·</span>

            <button
              onClick={() => {
                setVerifyCertId('');
                setIsVerifyModalOpen(true);
              }}
              className="text-slate-600 hover:text-slate-900 underline"
            >
              Verify Certificate
            </button>
          </div>
        </div>
      </footer>

      {activeJobModalId && (
        <JobDetailModal
          jobId={activeJobModalId}
          onClose={() => {
            setActiveJobModalId(null);
            void fetchJobs();
          }}
          onPreviewCert={(certId) =>
            setPreviewCertId(certId)
          }
          onVerifyCert={(certId) =>
            handleOpenVerify(certId)
          }
        />
      )}

      {previewCertId && (
        <CertificatePreviewModal
          certId={previewCertId}
          onClose={() => setPreviewCertId(null)}
          onVerify={(certId) =>
            handleOpenVerify(certId)
          }
        />
      )}

      {isVerifyModalOpen && (
        <VerifyModal
          initialCertId={verifyCertId || ''}
          onClose={() => {
            setIsVerifyModalOpen(false);
            setVerifyCertId(null);
          }}
        />
      )}
    </div>
  );
}