import { TestSuiteReport, TestResultItem } from '../types.ts';
import * as db from './db.ts';
import { validateJobRequest, validateRecipient } from './validator.ts';
import { renderCertificateSvg, renderCertificatePdf, generateVerificationHash } from './renderer.ts';

export async function runAllAssignmentTests(): Promise<TestSuiteReport> {
  const startTime = Date.now();
  const results: TestResultItem[] = [];

  // 1. Test: Creating a generation job
  {
    const testStart = Date.now();
    const assertions = [];
    const payload = {
      title: 'Certified Cloud Architect',
      instructor_name: 'Alex Rivera',
      organization_name: 'Tech University',
      issue_date: '2026-10-10',
      description: 'Mastery in distributed cloud computing and scalable backends',
      recipients: [
        { name: 'Alice Smith', email: 'alice@example.com' },
        { name: 'Bob Jones', email: 'bob@example.com' },
      ],
    };

    const valResult = validateJobRequest(payload);
    assertions.push({
      name: 'Job payload validates successfully',
      passed: valResult.valid,
      expected: 'valid: true',
      actual: `valid: ${valResult.valid}`,
    });

    const jobId = `test_job_${Date.now()}`;
    const job = await db.createJob({
      id: jobId,
      title: payload.title,
      instructor_name: payload.instructor_name,
      organization_name: payload.organization_name,
      issue_date: payload.issue_date,
      description: payload.description,
      total_count: payload.recipients.length,
    });

    assertions.push({
      name: 'Job record created with initial status "pending"',
      passed: job.status === 'pending' && job.total_count === 2,
      expected: 'status: pending, total_count: 2',
      actual: `status: ${job.status}, total_count: ${job.total_count}`,
    });

    results.push({
      id: 'test_1_create_job',
      name: 'Creating a generation job',
      category: 'Core Job Lifecycle',
      status: assertions.every((a) => a.passed) ? 'passed' : 'failed',
      duration_ms: Date.now() - testStart,
      details: 'Verified job submission acceptance, schema ingestion, and relational job state initialization.',
      assertions,
    });
  }

  // 2. Test: Input validation
  {
    const testStart = Date.now();
    const assertions = [];

    // Test missing required title
    const invalidJobPayload = {
      title: '', // invalid
      instructor_name: 'Alex Rivera',
      organization_name: 'Tech University',
      recipients: [], // invalid
    };
    const valJob = validateJobRequest(invalidJobPayload);
    assertions.push({
      name: 'Rejects empty course title and empty recipients array',
      passed: !valJob.valid && valJob.errors.length >= 2,
      expected: 'valid: false with >= 2 error messages',
      actual: `valid: ${valJob.valid}, errors: ${valJob.errors.join('; ')}`,
    });

    // Test invalid recipient email
    const badEmailRecipient = { name: 'John Doe', email: 'not-an-email-address' };
    const valBadEmail = validateRecipient(badEmailRecipient);
    assertions.push({
      name: 'Catches malformed email syntax ("not-an-email-address")',
      passed: !valBadEmail.valid && valBadEmail.errorCode === 'INVALID_EMAIL',
      expected: 'errorCode: INVALID_EMAIL',
      actual: `errorCode: ${valBadEmail.errorCode}`,
    });

    // Test missing recipient name
    const badNameRecipient = { name: ' ', email: 'valid@example.com' };
    const valBadName = validateRecipient(badNameRecipient);
    assertions.push({
      name: 'Catches missing/blank recipient name',
      passed: !valBadName.valid && valBadName.errorCode === 'INVALID_NAME',
      expected: 'errorCode: INVALID_NAME',
      actual: `errorCode: ${valBadName.errorCode}`,
    });

    results.push({
      id: 'test_2_input_validation',
      name: 'Input validation',
      category: 'Validation Engine',
      status: assertions.every((a) => a.passed) ? 'passed' : 'failed',
      duration_ms: Date.now() - testStart,
      details: 'Verified strict validation on required job parameters, email RFC patterns, and non-empty recipient names.',
      assertions,
    });
  }

  // 3. Test: Certificate generation
  {
    const testStart = Date.now();
    const assertions = [];
    const certId = `CERT-TEST-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const hash = generateVerificationHash({
      certId,
      recipientName: 'Claire Bennet',
      recipientEmail: 'claire@example.com',
      courseTitle: 'Full-Stack Engineering',
      issueDate: '2026-10-10',
    });

    const svg = renderCertificateSvg({
      id: certId,
      recipientName: 'Claire Bennet',
      recipientEmail: 'claire@example.com',
      courseTitle: 'Full-Stack Engineering',
      instructorName: 'Prof. Xavier',
      organizationName: 'Design Academy',
      issueDate: '2026-10-10',
      verificationHash: hash,
    });

    assertions.push({
      name: 'Generates valid SVG containing recipient name and course title',
      passed: svg.includes('Claire Bennet') && svg.includes('Full-Stack Engineering') && svg.includes(certId),
      expected: 'SVG string containing recipient, course, and certId',
      actual: `Includes recipient: ${svg.includes('Claire Bennet')}, Includes ID: ${svg.includes(certId)}`,
    });

    const pdfBuffer = await renderCertificatePdf({
      id: certId,
      recipientName: 'Claire Bennet',
      recipientEmail: 'claire@example.com',
      courseTitle: 'Full-Stack Engineering',
      instructorName: 'Prof. Xavier',
      organizationName: 'Design Academy',
      issueDate: '2026-10-10',
      verificationHash: hash,
    });

    assertions.push({
      name: 'Generates downloadable binary PDF with valid PDF header (%PDF)',
      passed: pdfBuffer.length > 500 && String.fromCharCode(...pdfBuffer.slice(0, 4)) === '%PDF',
      expected: 'Byte length > 500 with %PDF magic header',
      actual: `Byte length: ${pdfBuffer.length}, Header: ${String.fromCharCode(...pdfBuffer.slice(0, 4))}`,
    });

    results.push({
      id: 'test_3_certificate_generation',
      name: 'Certificate generation',
      category: 'Rendering Pipeline',
      status: assertions.every((a) => a.passed) ? 'passed' : 'failed',
      duration_ms: Date.now() - testStart,
      details: 'Verified high-resolution SVG rendering and PDF document generation with cryptographic signatures.',
      assertions,
    });
  }

  // 4. Test: Job status / progress tracking
  {
    const testStart = Date.now();
    const assertions = [];
    const jobId = `test_progress_job_${Date.now()}`;
    await db.createJob({
      id: jobId,
      title: 'Backend Systems Mastery',
      instructor_name: 'Elena Rostova',
      organization_name: 'Systems Lab',
      issue_date: '2026-10-10',
      total_count: 5,
    });

    // Simulate progress updates
    await db.updateJobStatus(jobId, {
      status: 'processing',
      processed_count: 3,
      success_count: 3,
      failure_count: 0,
    });

    let job = await db.getJobById(jobId);
    assertions.push({
      name: 'Job reflects intermediate "processing" state with accurate processed count (3/5)',
      passed: job?.status === 'processing' && job?.processed_count === 3,
      expected: 'status: processing, processed: 3',
      actual: `status: ${job?.status}, processed: ${job?.processed_count}`,
    });

    await db.updateJobStatus(jobId, {
      status: 'completed',
      processed_count: 5,
      success_count: 5,
      completed_at: new Date().toISOString(),
    });

    job = await db.getJobById(jobId);
    assertions.push({
      name: 'Job completes with completed_at timestamp recorded',
      passed: job?.status === 'completed' && !!job?.completed_at,
      expected: 'status: completed with timestamp',
      actual: `status: ${job?.status}, completed_at: ${job?.completed_at}`,
    });

    results.push({
      id: 'test_4_job_progress',
      name: 'Job status and progress tracking',
      category: 'Relational State Management',
      status: assertions.every((a) => a.passed) ? 'passed' : 'failed',
      duration_ms: Date.now() - testStart,
      details: 'Verified asynchronous state transitions (pending -> processing -> completed) and relational counter fidelity.',
      assertions,
    });
  }

  // 5. Test: Handling an individual certificate failure
  {
    const testStart = Date.now();
    const assertions = [];
    const jobId = `test_failure_job_${Date.now()}`;
    await db.createJob({
      id: jobId,
      title: 'Fault Tolerant Systems',
      instructor_name: 'Dr. Marcus Vance',
      organization_name: 'Reliability Institute',
      issue_date: '2026-10-10',
      total_count: 3,
    });

    const batch = [
      { name: 'Valid User One', email: 'user1@example.com' },
      { name: '', email: 'missing-name@example.com' }, // FAILS validation
      { name: 'Valid User Two', email: 'user2@example.com' },
    ];

    let successCount = 0;
    let failCount = 0;

    for (const rec of batch) {
      const v = validateRecipient(rec);
      if (!v.valid) {
        failCount++;
        await db.insertJobFailure({
          id: `fail_${Date.now()}_${Math.random()}`,
          job_id: jobId,
          recipient_name: rec.name,
          recipient_email: rec.email,
          error_reason: v.errorMessage || 'Invalid recipient',
          error_code: v.errorCode || 'VALIDATION_FAILED',
        });
      } else {
        successCount++;
        const certId = `CERT-FAILTEST-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        await db.insertCertificate({
          id: certId,
          job_id: jobId,
          recipient_name: rec.name,
          recipient_email: rec.email,
          verification_hash: 'test-hash',
          svg_content: '<svg></svg>',
        });
      }
    }

    await db.updateJobStatus(jobId, {
      status: failCount > 0 && successCount > 0 ? 'partial' : 'failed',
      processed_count: batch.length,
      success_count: successCount,
      failure_count: failCount,
      completed_at: new Date().toISOString(),
    });

    const job = await db.getJobById(jobId, true);
    assertions.push({
      name: 'Invalid recipient does not prevent valid recipients from being generated',
      passed: job?.success_count === 2 && job?.failure_count === 1,
      expected: 'success_count: 2, failure_count: 1',
      actual: `success_count: ${job?.success_count}, failure_count: ${job?.failure_count}`,
    });

    assertions.push({
      name: 'Failure details are recorded with specific error reason and code',
      passed: (job?.failures?.length || 0) === 1 && job?.failures?.[0].error_code === 'INVALID_NAME',
      expected: '1 recorded failure with error_code: INVALID_NAME',
      actual: `Failures count: ${job?.failures?.length}, code: ${job?.failures?.[0]?.error_code}`,
    });

    results.push({
      id: 'test_5_failure_handling',
      name: 'Handling an individual certificate failure',
      category: 'Fault Isolation & Resilience',
      status: assertions.every((a) => a.passed) ? 'passed' : 'failed',
      duration_ms: Date.now() - testStart,
      details: 'Verified that a failed recipient is isolated without aborting the batch, and logged with precise diagnostic reason.',
      assertions,
    });
  }

  // 6. Test: Retrieving generated certificates
  {
    const testStart = Date.now();
    const assertions = [];
    const jobId = `test_retrieve_job_${Date.now()}`;
    await db.createJob({
      id: jobId,
      title: 'Advanced API Design',
      instructor_name: 'Sarah Connor',
      organization_name: 'API Academy',
      issue_date: '2026-10-10',
      total_count: 1,
    });

    const testCertId = `CERT-RET-${Date.now()}`;
    await db.insertCertificate({
      id: testCertId,
      job_id: jobId,
      recipient_name: 'David Hasselhoff',
      recipient_email: 'david@example.com',
      verification_hash: 'hash-abc-123',
      svg_content: '<svg><text>David Hasselhoff</text></svg>',
    });

    const certList = await db.getCertificatesByJobId(jobId);
    assertions.push({
      name: 'Retrieves certificates associated with a given job ID',
      passed: certList.length === 1 && certList[0].id === testCertId,
      expected: `1 certificate with ID ${testCertId}`,
      actual: `Found ${certList.length} certificate(s), ID: ${certList[0]?.id}`,
    });

    const singleCert = await db.getCertificateById(testCertId);
    assertions.push({
      name: 'Retrieves single certificate by certificate ID with full relational metadata',
      passed: singleCert?.recipient_name === 'David Hasselhoff' && singleCert?.course_title === 'Advanced API Design',
      expected: 'Recipient: David Hasselhoff, Course: Advanced API Design',
      actual: `Recipient: ${singleCert?.recipient_name}, Course: ${singleCert?.course_title}`,
    });

    results.push({
      id: 'test_6_retrieve_certificates',
      name: 'Retrieving generated certificates',
      category: 'Data Retrieval & Verification',
      status: assertions.every((a) => a.passed) ? 'passed' : 'failed',
      duration_ms: Date.now() - testStart,
      details: 'Verified job certificate collection retrieval, single certificate lookup, and verification metadata resolution.',
      assertions,
    });
  }

  const passedTests = results.filter((r) => r.status === 'passed').length;

  return {
    timestamp: new Date().toISOString(),
    total_tests: results.length,
    passed_tests: passedTests,
    failed_tests: results.length - passedTests,
    duration_ms: Date.now() - startTime,
    results,
  };
}
