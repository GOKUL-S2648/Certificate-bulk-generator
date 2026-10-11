import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';

import * as db from './db.ts';
import { requireAuth } from './auth.ts';

import {
  validateJobRequest,
  validateRecipient,
} from './validator.ts';

import {
  renderCertificateSvg,
  renderCertificatePdf,
  generateVerificationHash,
} from './renderer.ts';

import { runAllAssignmentTests } from './tests.ts';
import { JobStatus } from '../types.ts';

import {
  isCertificateEmailEnabled,
  sendCertificateEmail,
} from './email.ts';

export const certificateRouter = Router();

type AuthUser = {
  id: string;
  email?: string | null;
};

function getAuthUser(res: Response): AuthUser {
  return res.locals.authUser as AuthUser;
}

/**
 * Get a job only if the authenticated user owns it.
 */
async function getOwnedJob(
  jobId: string,
  userId: string,
) {
  const job = await db.getJobById(jobId, true);

  if (!job || job.owner_id !== userId) {
    return null;
  }

  return job;
}

/**
 * Verify certificate ownership through its parent job.
 */
async function certificateBelongsToUser(
  jobId: string,
  userId: string,
): Promise<boolean> {
  const job = await db.getJobById(jobId, false);

  return Boolean(job && job.owner_id === userId);
}

/**
 * Process recipients independently.
 *
 * A certificate that generates successfully remains successful
 * even if its email submission fails.
 */
async function processBatchJob(
  jobId: string,
  recipients: any[],
  jobDetails: {
    title: string;
    instructor_name: string;
    organization_name: string;
    issue_date: string;
    description?: string;
  },
) {
  try {
    await db.updateJobStatus(jobId, {
      status: 'processing',
    });

    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      const validation = validateRecipient(recipient);

      if (!validation.valid) {
        failureCount++;

        await db.insertJobFailure({
          id: `fail_${Date.now()}_${crypto
            .randomBytes(3)
            .toString('hex')}`,
          job_id: jobId,
          recipient_name: recipient?.name || '',
          recipient_email: recipient?.email || '',
          error_reason:
            validation.errorMessage ||
            'Invalid recipient entry',
          error_code:
            validation.errorCode ||
            'VALIDATION_FAILED',
        });
      } else {
        try {
          const certificateId =
            `CERT-${new Date().getFullYear()}-` +
            crypto.randomBytes(4).toString('hex').toUpperCase();

          const verificationHash =
            generateVerificationHash({
              certId: certificateId,
              recipientName: recipient.name.trim(),
              recipientEmail: recipient.email.trim(),
              courseTitle: jobDetails.title,
              issueDate: jobDetails.issue_date,
            });

          const svg = renderCertificateSvg({
            id: certificateId,
            recipientName: recipient.name.trim(),
            recipientEmail: recipient.email.trim(),
            courseTitle: jobDetails.title,
            instructorName: jobDetails.instructor_name,
            organizationName: jobDetails.organization_name,
            issueDate: jobDetails.issue_date,
            description: jobDetails.description,
            verificationHash,
          });

          // Save certificate first.
          await db.insertCertificate({
            id: certificateId,
            job_id: jobId,
            recipient_name: recipient.name.trim(),
            recipient_email: recipient.email.trim(),
            recipient_metadata: recipient.metadata || {},
            verification_hash: verificationHash,
            svg_content: svg,
          });

          // Generate PDF and submit email when enabled.
          if (isCertificateEmailEnabled()) {
            try {
              const pdfBytes = await renderCertificatePdf({
                id: certificateId,
                recipientName: recipient.name.trim(),
                recipientEmail: recipient.email.trim(),
                courseTitle: jobDetails.title,
                instructorName: jobDetails.instructor_name,
                organizationName:
                  jobDetails.organization_name,
                issueDate: jobDetails.issue_date,
                description: jobDetails.description,
                verificationHash,
              });

              const emailOutcome =
                await sendCertificateEmail({
                  recipientEmail: recipient.email.trim(),
                  recipientName: recipient.name.trim(),
                  courseTitle: jobDetails.title,
                  certificateId,
                  pdfBytes,
                });

              await db.updateCertificateEmailStatus(
                certificateId,
                emailOutcome,
              );

              if (emailOutcome.email_status === 'failed') {
                console.error(
                  `Certificate ${certificateId} was generated, ` +
                  'but email submission failed:',
                  emailOutcome.email_error,
                );
              } else {
                console.log(
                  `Email status for ${certificateId}:`,
                  emailOutcome.email_status,
                  emailOutcome.email_id || '',
                );
              }
            } catch (emailError: unknown) {
              const message =
                emailError instanceof Error
                  ? emailError.message
                  : 'Unknown email processing error.';

              console.error(
                `Email processing failed for ${certificateId}:`,
                message,
              );

              try {
                await db.updateCertificateEmailStatus(
                  certificateId,
                  {
                    email_status: 'failed',
                    email_id: null,
                    email_error: message,
                    email_submitted_at: null,
                  },
                );
              } catch (databaseError) {
                console.error(
                  'Could not save the email status:',
                  databaseError,
                );
              }
            }
          }

          // Email failure must not invalidate certificate generation.
          successCount++;
        } catch (generationError: any) {
          failureCount++;

          await db.insertJobFailure({
            id: `fail_${Date.now()}_${crypto
              .randomBytes(3)
              .toString('hex')}`,
            job_id: jobId,
            recipient_name: recipient?.name || '',
            recipient_email: recipient?.email || '',
            error_reason:
              `Rendering error: ${
                generationError.message ||
                'Template generation failed'
              }`,
            error_code: 'RENDER_EXCEPTION',
          });
        }
      }

      await db.updateJobStatus(jobId, {
        processed_count: i + 1,
        success_count: successCount,
        failure_count: failureCount,
      });

      if (recipients.length > 3) {
        await new Promise((resolve) =>
          setTimeout(resolve, 60),
        );
      }
    }

    let finalStatus: JobStatus = 'completed';

    if (successCount === 0 && failureCount > 0) {
      finalStatus = 'failed';
    } else if (successCount > 0 && failureCount > 0) {
      finalStatus = 'partial';
    }

    await db.updateJobStatus(jobId, {
      status: finalStatus,
      completed_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      `Error processing job ${jobId}:`,
      error,
    );

    await db.updateJobStatus(jobId, {
      status: 'failed',
      completed_at: new Date().toISOString(),
    });
  }
}

/**
 * 1. Create a certificate generation job.
 */
certificateRouter.post(
  '/generate',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const validation = validateJobRequest(req.body);

      if (!validation.valid) {
        res.status(400).json({
          error: 'Validation failed',
          details: validation.errors,
        });
        return;
      }

      const {
        title,
        instructor_name,
        organization_name,
        issue_date,
        description,
        recipients,
      } = req.body;

      const authUser = getAuthUser(res);

      const finalDate =
        issue_date ||
        new Date().toISOString().split('T')[0];

      const jobId =
        `job_${Date.now()}_` +
        crypto.randomBytes(3).toString('hex');

      const job = await db.createJob({
        id: jobId,
        owner_id: authUser.id,
        title: title.trim(),
        instructor_name: instructor_name.trim(),
        organization_name: organization_name.trim(),
        issue_date: finalDate,
        description: description?.trim(),
        total_count: recipients.length,
      });

      const isSync =
        req.query.sync === 'true' ||
        req.query.sync === '1';

      const jobPromise = processBatchJob(
        jobId,
        recipients,
        {
          title: title.trim(),
          instructor_name: instructor_name.trim(),
          organization_name: organization_name.trim(),
          issue_date: finalDate,
          description: description?.trim(),
        },
      );

      if (isSync) {
        await jobPromise;

        const completedJob = await getOwnedJob(
          jobId,
          authUser.id,
        );

        res.status(201).json(completedJob);
        return;
      }

      res.status(202).json({
        job_id: jobId,
        status: 'pending',
        message:
          'Certificate generation request accepted for processing.',
        total_recipients: recipients.length,
        check_status_url:
          `/api/certificates/jobs/${jobId}`,
        created_at: job.created_at,
      });
    } catch (error: any) {
      console.error(
        'Error creating certificate generation job:',
        error,
      );

      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
      });
    }
  },
);

/**
 * 2. List the authenticated user's jobs.
 */
certificateRouter.get(
  '/jobs',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const limit = Math.min(
        Number(req.query.limit) || 50,
        100,
      );

      const offset = Math.max(
        Number(req.query.offset) || 0,
        0,
      );

      const authUser = getAuthUser(res);

      const jobs = await db.listJobs(
        limit,
        offset,
        authUser.id,
      );

      res.json({
        total: jobs.length,
        jobs,
      });
    } catch (error: any) {
      res.status(500).json({
        error: error.message,
      });
    }
  },
);

/**
 * 3. Retrieve a single owned job.
 */
certificateRouter.get(
  '/jobs/:jobId',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const authUser = getAuthUser(res);

      const job = await getOwnedJob(
        req.params.jobId,
        authUser.id,
      );

      if (!job) {
        res.status(404).json({
          error: 'Job not found',
        });
        return;
      }

      const progress_percentage =
        job.total_count > 0
          ? Number(
              (
                (job.processed_count / job.total_count) *
                100
              ).toFixed(1),
            )
          : 0;

      res.json({
        ...job,
        progress_percentage,
      });
    } catch (error: any) {
      res.status(500).json({
        error: error.message,
      });
    }
  },
);

/**
 * 4. Retrieve certificates for an owned job.
 */
certificateRouter.get(
  '/jobs/:jobId/certificates',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const authUser = getAuthUser(res);

      const job = await getOwnedJob(
        req.params.jobId,
        authUser.id,
      );

      if (!job) {
        res.status(404).json({
          error: 'Job not found',
        });
        return;
      }

      const certificates =
        await db.getCertificatesByJobId(
          req.params.jobId,
          false,
        );

      res.json(certificates);
    } catch (error: any) {
      res.status(500).json({
        error: error.message,
      });
    }
  },
);

/**
 * 5. Retrieve a certificate's details.
 */
certificateRouter.get(
  '/:certId',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const certificate =
        await db.getCertificateById(
          req.params.certId,
        );

      if (!certificate) {
        res.status(404).json({
          error: 'Certificate not found',
        });
        return;
      }

      const authUser = getAuthUser(res);

      const owned = await certificateBelongsToUser(
        certificate.job_id,
        authUser.id,
      );

      if (!owned) {
        res.status(404).json({
          error: 'Certificate not found',
        });
        return;
      }

      res.json(certificate);
    } catch (error: any) {
      res.status(500).json({
        error: error.message,
      });
    }
  },
);

/**
 * 6. Download a PDF or SVG certificate.
 */
certificateRouter.get(
  '/:certId/download',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const certificate =
        await db.getCertificateById(
          req.params.certId,
        );

      if (!certificate) {
        res.status(404).json({
          error: 'Certificate not found',
        });
        return;
      }

      const authUser = getAuthUser(res);

      const owned = await certificateBelongsToUser(
        certificate.job_id,
        authUser.id,
      );

      if (!owned) {
        res.status(404).json({
          error: 'Certificate not found',
        });
        return;
      }

      const format =
        (req.query.format as string) || 'pdf';

      if (format === 'svg') {
        res.setHeader(
          'Content-Type',
          'image/svg+xml',
        );

        res.setHeader(
          'Content-Disposition',
          `attachment; filename="certificate-${certificate.id}.svg"`,
        );

        res.send(certificate.svg_content || '');
        return;
      }

      if (format !== 'pdf') {
        res.status(400).json({
          error: 'Unsupported format. Use pdf or svg.',
        });
        return;
      }

      const pdfBytes = await renderCertificatePdf({
        id: certificate.id,
        recipientName: certificate.recipient_name,
        recipientEmail: certificate.recipient_email,
        courseTitle:
          certificate.course_title ||
          'Certificate of Completion',
        instructorName:
          certificate.instructor_name ||
          'Course Instructor',
        organizationName:
          certificate.organization_name ||
          'Organization',
        issueDate:
          certificate.issue_date ||
          new Date().toISOString().split('T')[0],
        description: certificate.description,
        verificationHash:
          certificate.verification_hash,
      });

      res.setHeader(
        'Content-Type',
        'application/pdf',
      );

      res.setHeader(
        'Content-Disposition',
        `attachment; filename="certificate-${certificate.id}.pdf"`,
      );

      res.send(Buffer.from(pdfBytes));
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to generate download',
        message: error.message,
      });
    }
  },
);

/**
 * 7. Download all certificates for an owned job as ZIP.
 */
certificateRouter.get(
  '/jobs/:jobId/download-zip',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const authUser = getAuthUser(res);

      const job = await getOwnedJob(
        req.params.jobId,
        authUser.id,
      );

      if (!job) {
        res.status(404).json({
          error: 'Job not found',
        });
        return;
      }

      const certificates =
        await db.getCertificatesByJobId(
          req.params.jobId,
          true,
        );

      if (certificates.length === 0) {
        res.status(400).json({
          error:
            'No certificates generated yet for this job',
        });
        return;
      }

      const zip = new JSZip();

      const folder = zip.folder(
        `certificates_${job.id}`,
      );

      for (const certificate of certificates) {
        const pdfBytes = await renderCertificatePdf({
          id: certificate.id,
          recipientName: certificate.recipient_name,
          recipientEmail: certificate.recipient_email,
          courseTitle: job.title,
          instructorName: job.instructor_name,
          organizationName: job.organization_name,
          issueDate: job.issue_date,
          description: job.description,
          verificationHash:
            certificate.verification_hash,
        });

        const cleanName =
          certificate.recipient_name.replace(
            /[^a-zA-Z0-9_-]/g,
            '_',
          );

        folder?.file(
          `${cleanName}_${certificate.id}.pdf`,
          pdfBytes,
        );

        folder?.file(
          `${cleanName}_${certificate.id}.svg`,
          certificate.svg_content || '',
        );
      }

      const manifest = {
        job_id: job.id,
        course_title: job.title,
        instructor: job.instructor_name,
        organization: job.organization_name,
        issue_date: job.issue_date,
        total_issued: certificates.length,
        certificates: certificates.map(
          (certificate) => ({
            id: certificate.id,
            recipient_name:
              certificate.recipient_name,
            recipient_email:
              certificate.recipient_email,
            verification_hash:
              certificate.verification_hash,
          }),
        ),
        failures: job.failures || [],
      };

      folder?.file(
        'manifest.json',
        JSON.stringify(manifest, null, 2),
      );

      const zipBuffer = await zip.generateAsync({
        type: 'nodebuffer',
      });

      res.setHeader(
        'Content-Type',
        'application/zip',
      );

      res.setHeader(
        'Content-Disposition',
        `attachment; filename="certificates-${job.id}.zip"`,
      );

      res.send(zipBuffer);
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to create ZIP archive',
        message: error.message,
      });
    }
  },
);

/**
 * 8. Public certificate verification endpoint.
 */
certificateRouter.get(
  '/verify/:certId',
  async (req: Request, res: Response) => {
    try {
      const certificate =
        await db.getCertificateById(
          req.params.certId,
        );

      if (!certificate) {
        res.status(404).json({
          valid: false,
          message:
            'Certificate credential not found or tampered.',
        });
        return;
      }

      const expectedHash =
        generateVerificationHash({
          certId: certificate.id,
          recipientName:
            certificate.recipient_name,
          recipientEmail:
            certificate.recipient_email,
          courseTitle:
            certificate.course_title || '',
          issueDate:
            certificate.issue_date || '',
        });

      const isTamperFree =
        expectedHash ===
        certificate.verification_hash;

      res.json({
        valid: isTamperFree,
        certificate_id: certificate.id,
        recipient_name:
          certificate.recipient_name,
        course_title:
          certificate.course_title,
        instructor_name:
          certificate.instructor_name,
        organization_name:
          certificate.organization_name,
        issue_date: certificate.issue_date,
        verification_hash:
          certificate.verification_hash,
        issued_at: certificate.created_at,
        tamper_check: isTamperFree
          ? 'PASSED_CRYPTOGRAPHIC_INTEGRITY'
          : 'FAILED_CHECKSUM_MISMATCH',
        message: isTamperFree
          ? 'Verified authentic certificate issued by authorized provider.'
          : 'Integrity mismatch: certificate metadata has been altered.',
      });
    } catch (error: any) {
      res.status(500).json({
        error: error.message,
      });
    }
  },
);

/**
 * 9. Run the automated test suite.
 */
certificateRouter.post(
  '/test-run',
  requireAuth,
  async (_req: Request, res: Response) => {
    try {
      const report = await runAllAssignmentTests();
      res.json(report);
    } catch (error: any) {
      res.status(500).json({
        error: 'Failed to run test suite',
        message: error.message,
      });
    }
  },
);

/**
 * 10. Read Python backend codebase files.
 */
certificateRouter.get(
  '/python-codebase/files',
  requireAuth,
  (_req: Request, res: Response) => {
    try {
      const directory = path.resolve(
        process.cwd(),
        'python_backend',
      );

      if (!fs.existsSync(directory)) {
        res.status(404).json({
          error: 'Python backend directory not found',
        });
        return;
      }

      const fileNames = [
        'main.py',
        'database.py',
        'models.py',
        'schemas.py',
        'generator.py',
        'test_api.py',
        'requirements.txt',
        'README.md',
      ];

      const files: Record<string, string> = {};

      for (const fileName of fileNames) {
        const filePath = path.join(
          directory,
          fileName,
        );

        if (fs.existsSync(filePath)) {
          files[fileName] = fs.readFileSync(
            filePath,
            'utf-8',
          );
        }
      }

      res.json({ files });
    } catch (error: any) {
      res.status(500).json({
        error: error.message,
      });
    }
  },
);

/**
 * 11. Download the Python backend as ZIP.
 */
certificateRouter.get(
  '/python-codebase/download-zip',
  requireAuth,
  async (_req: Request, res: Response) => {
    try {
      const directory = path.resolve(
        process.cwd(),
        'python_backend',
      );

      if (!fs.existsSync(directory)) {
        res.status(404).json({
          error: 'Python backend directory not found',
        });
        return;
      }

      const zip = new JSZip();

      const folder = zip.folder(
        'bulk_certificate_generator_python',
      );

      const fileNames = [
        'main.py',
        'database.py',
        'models.py',
        'schemas.py',
        'generator.py',
        'test_api.py',
        'requirements.txt',
        'README.md',
      ];

      for (const fileName of fileNames) {
        const filePath = path.join(
          directory,
          fileName,
        );

        if (fs.existsSync(filePath)) {
          folder?.file(
            fileName,
            fs.readFileSync(filePath, 'utf-8'),
          );
        }
      }

      const zipBuffer = await zip.generateAsync({
        type: 'nodebuffer',
      });

      res.setHeader(
        'Content-Type',
        'application/zip',
      );

      res.setHeader(
        'Content-Disposition',
        'attachment; filename="bulk-certificate-generator-python.zip"',
      );

      res.send(zipBuffer);
    } catch (error: any) {
      res.status(500).json({
        error: error.message,
      });
    }
  },
);