export type JobStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'partial'
  | 'failed';

export type RecipientStatus = 'success' | 'failed';

export interface RecipientInput {
  name: string;
  email: string;
  metadata?: Record<string, string | number>;
}

export interface CreateJobRequest {
  title: string;
  instructor_name: string;
  organization_name: string;
  issue_date?: string;
  description?: string;
  recipients: RecipientInput[];
}

export interface RecipientFailure {
  id: string;
  job_id: string;
  recipient_name: string;
  recipient_email: string;
  error_reason: string;
  error_code: string;
  created_at: string;
}

export interface CertificateRecord {
  id: string;
  job_id: string;
  recipient_name: string;
  recipient_email: string;
  recipient_metadata?: Record<string, string | number>;
  verification_hash: string;
  svg_content?: string;
  created_at: string;
  course_title?: string;
  instructor_name?: string;
  organization_name?: string;
  issue_date?: string;
  description?: string;
}

export interface JobRecord {
  id: string;

  // Supabase auth.users ID of the job owner.
  owner_id?: string | null;

  title: string;
  instructor_name: string;
  organization_name: string;
  issue_date: string;
  description?: string;

  status: JobStatus;

  total_count: number;
  processed_count: number;
  success_count: number;
  failure_count: number;

  created_at: string;
  updated_at: string;
  completed_at?: string | null;

  failures?: RecipientFailure[];
  certificates?: CertificateRecord[];
}

export interface TestResultItem {
  id: string;
  name: string;
  category: string;
  status: 'passed' | 'failed' | 'running';
  duration_ms: number;
  details: string;

  assertions: {
    name: string;
    passed: boolean;
    expected?: string;
    actual?: string;
  }[];
}

export interface TestSuiteReport {
  timestamp: string;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  duration_ms: number;
  results: TestResultItem[];
}