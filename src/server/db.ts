import { supabaseAdmin } from './supabase.ts';

import type {
  JobRecord,
  CertificateRecord,
  RecipientFailure,
  JobStatus,
} from '../types.ts';

/**
 * Throw Supabase errors and return the query data.
 */
function unwrap<T>(result: {
  data: T | null;
  error: { message: string } | null;
}): T | null {
  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data;
}

/**
 * Parse recipient metadata regardless of whether the database
 * returns JSON directly or a JSON string.
 */
function parseMetadata(
  value: unknown,
): Record<string, string | number> {
  if (!value) {
    return {};
  }

  if (typeof value === 'object' && value !== null) {
    return value as Record<string, string | number>;
  }

  if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value);

      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        !Array.isArray(parsed)
      ) {
        return parsed as Record<string, string | number>;
      }
    } catch {
      return {};
    }
  }

  return {};
}

/**
 * Convert a Supabase jobs row into a JobRecord.
 *
 * IMPORTANT: owner_id must be mapped here.
 * The API uses it to verify that the logged-in user owns the job.
 */
function mapJob(row: any): JobRecord {
  return {
    id: row.id,
    owner_id: row.owner_id ?? null,
    title: row.title,
    instructor_name: row.instructor_name,
    organization_name: row.organization_name,
    issue_date: row.issue_date,
    description: row.description || undefined,
    status: row.status as JobStatus,
    total_count: Number(row.total_count ?? 0),
    processed_count: Number(row.processed_count ?? 0),
    success_count: Number(row.success_count ?? 0),
    failure_count: Number(row.failure_count ?? 0),
    created_at: row.created_at,
    updated_at: row.updated_at,
    completed_at: row.completed_at ?? null,
  };
}

/**
 * Convert a Supabase job_failures row into a RecipientFailure.
 */
function mapFailure(row: any): RecipientFailure {
  return {
    id: row.id,
    job_id: row.job_id,
    recipient_name: row.recipient_name,
    recipient_email: row.recipient_email,
    error_reason: row.error_reason,
    error_code: row.error_code,
    created_at: row.created_at,
  };
}

/**
 * Convert a Supabase certificates row into a CertificateRecord.
 * Job details are obtained from the associated job when available.
 */
function mapCertificate(
  row: any,
  job?: JobRecord | null,
): CertificateRecord {
  return {
    id: row.id,
    job_id: row.job_id,
    recipient_name: row.recipient_name,
    recipient_email: row.recipient_email,
    recipient_metadata: parseMetadata(row.recipient_metadata),
    verification_hash: row.verification_hash,
    svg_content: row.svg_content || undefined,
    created_at: row.created_at,
    course_title: job?.title || row.course_title || undefined,
    instructor_name:
      job?.instructor_name ||
      row.instructor_name ||
      undefined,
    organization_name:
      job?.organization_name ||
      row.organization_name ||
      undefined,
    issue_date: job?.issue_date || row.issue_date || undefined,
    description:
      job?.description || row.description || undefined,
  };
}

/**
 * Initialize/check the Supabase database connection.
 * Called by server.ts during startup.
 */
export async function getDb(): Promise<void> {
  const result = await supabaseAdmin
    .from('jobs')
    .select('id')
    .limit(1);

  if (result.error) {
    throw new Error(
      `Supabase connection failed: ${result.error.message}`,
    );
  }
}

/**
 * Kept for compatibility with code that previously persisted SQLite.
 * Supabase writes are persisted by each database operation.
 */
export async function persistDb(): Promise<void> {
  // No manual persistence is necessary for Supabase.
}

/**
 * Create a generation job and save its owner.
 */
export async function createJob(job: {
  id: string;
  title: string;
  instructor_name: string;
  organization_name: string;
  issue_date: string;
  description?: string;
  total_count: number;
  owner_id?: string | null;
}): Promise<JobRecord> {
  const now = new Date().toISOString();

  const record = {
    id: job.id,
    owner_id: job.owner_id ?? null,
    title: job.title,
    instructor_name: job.instructor_name,
    organization_name: job.organization_name,
    issue_date: job.issue_date,
    description: job.description ?? null,
    status: 'pending',
    total_count: job.total_count,
    processed_count: 0,
    success_count: 0,
    failure_count: 0,
    created_at: now,
    updated_at: now,
    completed_at: null,
  };

  const result = await supabaseAdmin
    .from('jobs')
    .insert(record)
    .select('*')
    .single();

  const created = unwrap(result);

  if (!created) {
    throw new Error('Supabase did not return the created job.');
  }

  return mapJob(created);
}

/**
 * Update the status and progress of a job.
 */
export async function updateJobStatus(
  jobId: string,
  updates: {
    status?: JobStatus;
    processed_count?: number;
    success_count?: number;
    failure_count?: number;
    completed_at?: string | null;
  },
): Promise<void> {
  const result = await supabaseAdmin
    .from('jobs')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);

  unwrap(result);
}

/**
 * Save an issued certificate.
 */
export async function insertCertificate(cert: {
  id: string;
  job_id: string;
  recipient_name: string;
  recipient_email: string;
  recipient_metadata?: Record<string, string | number>;
  verification_hash: string;
  svg_content: string;
}): Promise<void> {
  const result = await supabaseAdmin
    .from('certificates')
    .insert({
      id: cert.id,
      job_id: cert.job_id,
      recipient_name: cert.recipient_name,
      recipient_email: cert.recipient_email,
      recipient_metadata: JSON.stringify(
        cert.recipient_metadata || {},
      ),
      verification_hash: cert.verification_hash,
      svg_content: cert.svg_content,
      pdf_path: null,
    });

  unwrap(result);
}

/**
 * Save an isolated recipient failure.
 */
export async function insertJobFailure(
  failure: Omit<RecipientFailure, 'created_at'> & {
    created_at?: string;
  },
): Promise<void> {
  const result = await supabaseAdmin
    .from('job_failures')
    .insert({
      id: failure.id,
      job_id: failure.job_id,
      recipient_name: failure.recipient_name,
      recipient_email: failure.recipient_email,
      error_reason: failure.error_reason,
      error_code: failure.error_code,
      created_at:
        failure.created_at || new Date().toISOString(),
    });

  unwrap(result);
}

/**
 * Retrieve a job by ID.
 *
 * When includeDetails is true, also retrieves its failures
 * and issued certificates.
 */
export async function getJobById(
  jobId: string,
  includeDetails = true,
): Promise<JobRecord | null> {
  const jobResult = await supabaseAdmin
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .maybeSingle();

  const row = unwrap(jobResult);

  if (!row) {
    return null;
  }

  const job = mapJob(row);

  if (includeDetails) {
    job.failures = await getFailuresByJobId(jobId);
    job.certificates = await getCertificatesByJobId(
      jobId,
      false,
    );
  }

  return job;
}

/**
 * List jobs. Pass ownerId for user-specific results.
 * The authenticated routes should always supply ownerId.
 */
export async function listJobs(
  limit = 50,
  offset = 0,
  ownerId?: string,
): Promise<JobRecord[]> {
  let query = supabaseAdmin
    .from('jobs')
    .select('*');

  if (ownerId) {
    query = query.eq('owner_id', ownerId);
  }

  const result = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const rows = unwrap(result) ?? [];

  return rows.map(mapJob);
}

/**
 * Retrieve all certificates associated with a job.
 */
export async function getCertificatesByJobId(
  jobId: string,
  _includeSvg = true,
): Promise<CertificateRecord[]> {
  const result = await supabaseAdmin
    .from('certificates')
    .select('*')
    .eq('job_id', jobId)
    .order('created_at', { ascending: true });

  const rows = unwrap(result) ?? [];
  const job = await getJobById(jobId, false);

  return rows.map((row: any) =>
    mapCertificate(row, job),
  );
}

/**
 * Retrieve all recorded failures for a job.
 */
export async function getFailuresByJobId(
  jobId: string,
): Promise<RecipientFailure[]> {
  const result = await supabaseAdmin
    .from('job_failures')
    .select('*')
    .eq('job_id', jobId)
    .order('created_at', { ascending: true });

  const rows = unwrap(result) ?? [];

  return rows.map(mapFailure);
}

/**
 * Retrieve one certificate and its associated job details.
 */
export async function getCertificateById(
  certId: string,
): Promise<CertificateRecord | null> {
  const certResult = await supabaseAdmin
    .from('certificates')
    .select('*')
    .eq('id', certId)
    .maybeSingle();

  const row = unwrap(certResult);

  if (!row) {
    return null;
  }

  const job = await getJobById(row.job_id, false);

  return mapCertificate(row, job);
}

/**
 * Global destructive clearing is intentionally disabled.
 * Do not delete all Supabase data during normal operation.
 */
export async function clearDatabase(): Promise<void> {
  throw new Error(
    'clearDatabase is disabled for Supabase. Use isolated test records instead.',
  );
}
export async function updateCertificateEmailStatus(
  certificateId: string,
  updates: {
    email_status:
      | 'not_configured'
      | 'test_submitted'
      | 'submitted'
      | 'failed';
    email_id?: string | null;
    email_error?: string | null;
    email_submitted_at?: string | null;
  },
): Promise<void> {
  const result = await supabaseAdmin
    .from('certificates')
    .update({
      email_status: updates.email_status,
      email_id: updates.email_id ?? null,
      email_error: updates.email_error ?? null,
      email_submitted_at:
        updates.email_submitted_at ?? null,
    })
    .eq('id', certificateId);

  unwrap(result);
}