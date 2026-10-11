import React from 'react';
import { BookOpen, CheckCircle, Database, Shield, Zap, FileCode, Server } from 'lucide-react';

export const DocumentationView: React.FC = () => {
  return (
    <div className="py-6 max-w-4xl mx-auto space-y-8">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-500" />
          <span>System Architecture &amp; Design Decisions</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Comprehensive justification of design trade-offs, relational schema, concurrency model, and failure resilience.
        </p>
      </div>

      {/* 1. Asynchronous Queue vs Synchronous Execution */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Zap className="w-4 h-4 text-indigo-600" />
          <span>1. Concurrency &amp; Processing Model: Async Background Queue</span>
        </h2>
        <div className="border border-slate-200 bg-white rounded-xl p-5 shadow-xs space-y-3 text-xs text-slate-700 leading-relaxed">
          <p>
            <strong>The Core Dilemma:</strong> A bulk generation request may contain 50 to 500 recipients. Generating vector certificates, calculating SHA-256 cryptographic hashes, and creating high-resolution PDF documents takes approximately 50ms to 150ms per certificate. Holding an HTTP connection open for 500 recipients would block for 25 to 75 seconds, triggering client gateway timeouts (HTTP 504), proxy disconnects, and thread pool exhaustion.
          </p>
          <p>
            <strong>The Architectural Solution:</strong> The API adopts an <em>asynchronous queue-backed architecture</em>:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li>
              When a client sends <code>POST /api/certificates/generate</code>, the request is immediately accepted with <strong>HTTP 202 Accepted</strong> and returns a unique <code>job_id</code> in &lt; 15ms.
            </li>
            <li>
              A background worker processes recipients asynchronously while committing real-time progress counters (<code>processed_count</code>, <code>success_count</code>, <code>failure_count</code>) to the relational database.
            </li>
            <li>
              Clients can poll <code>GET /api/certificates/jobs/:jobId</code> to inspect real-time progress, failure logs, and download links.
            </li>
            <li>
              For testing or lightweight batches, a query flag <code>?sync=true</code> is supported to block until completion.
            </li>
          </ul>
        </div>
      </section>

      {/* 2. Failure Isolation Architecture */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-600" />
          <span>2. Validation &amp; Fault Isolation (Zero Cascading Failure)</span>
        </h2>
        <div className="border border-slate-200 bg-white rounded-xl p-5 shadow-xs space-y-3 text-xs text-slate-700 leading-relaxed">
          <p>
            In bulk enterprise workflows, it is unacceptable for a single corrupted email address or missing recipient name to abort the issuance of 200 other valid certificates.
          </p>
          <p>
            <strong>Isolation Mechanism:</strong> The worker operates on a per-recipient try/catch boundary:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="font-semibold text-slate-900 mb-1">Pre-Render Validation</div>
              <p className="text-slate-600 text-[11px]">
                Validates RFC 5322 email patterns, non-empty recipient name length (2–100 chars), and required metadata. Invalid records are categorized with codes (<code>INVALID_EMAIL</code>, <code>INVALID_NAME</code>).
              </p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="font-semibold text-slate-900 mb-1">Decoupled Failure Log</div>
              <p className="text-slate-600 text-[11px]">
                Failed items are stored in a dedicated <code>job_failures</code> relational table. The parent job transitions to <code>partial</code> status instead of <code>failed</code> if at least one certificate succeeded.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Relational Database Schema */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-600" />
          <span>3. Relational Schema Design &amp; Indexing</span>
        </h2>
        <div className="border border-slate-200 bg-white rounded-xl p-5 shadow-xs space-y-3 text-xs text-slate-700 leading-relaxed">
          <p>
            A relational database (SQLite / PostgreSQL) provides strict ACID transaction guarantees, foreign key enforcement, and fast indexed lookups:
          </p>
          <div className="font-mono text-[11px] bg-slate-900 text-slate-200 p-4 rounded-lg overflow-x-auto space-y-2">
            <div><strong>jobs</strong>: (id [PK], title, instructor, organization, issue_date, status, total, processed, success, failures, created_at)</div>
            <div><strong>certificates</strong>: (id [PK], job_id [FK -&gt; jobs.id ON DELETE CASCADE], recipient_name, recipient_email, verification_hash, svg_content, created_at)</div>
            <div><strong>job_failures</strong>: (id [PK], job_id [FK -&gt; jobs.id ON DELETE CASCADE], recipient_name, recipient_email, error_reason, error_code, created_at)</div>
            <div className="text-amber-400">INDEXES: (certificates.job_id), (certificates.verification_hash), (certificates.recipient_email), (job_failures.job_id)</div>
          </div>
        </div>
      </section>

      {/* 4. Cryptographic Verification Engine */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-blue-600" />
          <span>4. Tamper-Evident Verification Engine</span>
        </h2>
        <div className="border border-slate-200 bg-white rounded-xl p-5 shadow-xs space-y-2 text-xs text-slate-700 leading-relaxed">
          <p>
            Every certificate is stamped with a deterministic SHA-256 verification hash derived from:
          </p>
          <div className="font-mono bg-slate-100 p-2 rounded text-slate-800 text-[11px]">
            SHA-256(cert_id + ":" + recipient_name + ":" + recipient_email + ":" + course_title + ":" + issue_date)
          </div>
          <p>
            When queried at <code>GET /api/certificates/verify/:certId</code>, the server re-computes the hash dynamically against stored immutable data. If an adversary attempts to modify the recipient name or title in the database, the checksum validation fails immediately.
          </p>
        </div>
      </section>
    </div>
  );
};
