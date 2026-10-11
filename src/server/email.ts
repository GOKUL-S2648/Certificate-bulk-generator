
import 'dotenv/config';
import { Resend } from 'resend';

export type CertificateEmailStatus =
  | 'not_configured'
  | 'test_submitted'
  | 'submitted'
  | 'failed';

export interface CertificateEmailOutcome {
  email_status: CertificateEmailStatus;
  email_id: string | null;
  email_error: string | null;
  email_submitted_at: string | null;
}

interface CertificateEmailInput {
  recipientEmail: string;
  recipientName: string;
  courseTitle: string;
  certificateId: string;
  pdfBytes: Uint8Array;
}

export function isCertificateEmailEnabled(): boolean {
  const mode = (
    process.env.CERTIFICATE_EMAIL_MODE || 'off'
  ).trim().toLowerCase();

  return mode === 'test' || mode === 'live';
}

function escapeHtml(value: string): string {
  const replacements: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return value.replace(
    /[&<>"']/g,
    (character) => replacements[character],
  );
}

function safeFilePart(value: string): string {
  return (
    value.trim()
      .replace(/[^a-zA-Z0-9_-]+/g, '_')
      .slice(0, 60) || 'certificate'
  );
}

function failedResult(message: string): CertificateEmailOutcome {
  return {
    email_status: 'failed',
    email_id: null,
    email_error: message,
    email_submitted_at: null,
  };
}

export async function sendCertificateEmail(
  input: CertificateEmailInput,
): Promise<CertificateEmailOutcome> {
  const mode = (
    process.env.CERTIFICATE_EMAIL_MODE || 'off'
  ).trim().toLowerCase();

  if (mode !== 'test' && mode !== 'live') {
    return {
      email_status: 'not_configured',
      email_id: null,
      email_error: null,
      email_submitted_at: null,
    };
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    return failedResult(
      'RESEND_API_KEY is missing from the server .env file.',
    );
  }

  const testRecipient =
    process.env.GMAIL_TEST_RECIPIENT?.trim();

  const recipient =
    mode === 'test'
      ? testRecipient
      : input.recipientEmail.trim();

  if (!recipient) {
    return failedResult(
      mode === 'test'
        ? 'GMAIL_TEST_RECIPIENT is missing from .env.'
        : 'Recipient email is missing.',
    );
  }

  // Use a verified domain for live sending.
  // Resend's onboarding address is for limited testing.
  const fromEmail =
    process.env.RESEND_FROM_EMAIL?.trim() ||
    'CertifyBulk <onboarding@resend.dev>';

  const resend = new Resend(apiKey);

  const filename =
    `${safeFilePart(input.recipientName)}_` +
    `${safeFilePart(input.certificateId)}.pdf`;

  try {
    const result = await resend.emails.send({
      from: fromEmail,
      to: [recipient],
      subject:
        `${mode === 'test' ? '[TEST] ' : ''}` +
        `Your certificate: ${input.courseTitle}`,
      text:
        `Hello ${input.recipientName},\n\n` +
        `Your certificate for "${input.courseTitle}" is attached.\n` +
        `Certificate ID: ${input.certificateId}\n\n` +
        (mode === 'test'
          ? 'TEST MODE: Sent to your configured test inbox.\n\n'
          : '') +
        'Regards,\nCertifyBulk',
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6">
          <h2>Your Certificate of Achievement</h2>
          <p>Hello ${escapeHtml(input.recipientName)},</p>
          <p>Your certificate for
          <strong>${escapeHtml(input.courseTitle)}</strong>
          is attached as a PDF.</p>
          <p>Certificate ID:
          <strong>${escapeHtml(input.certificateId)}</strong></p>
          ${
            mode === 'test'
              ? '<p><strong>TEST MODE:</strong> Sent to your test inbox.</p>'
              : ''
          }
          <p>Regards,<br/>CertifyBulk</p>
        </div>
      `,
      attachments: [
        {
          filename,
          content: Buffer.from(input.pdfBytes).toString('base64'),
          contentType: 'application/pdf',
        },
      ],
    });

    if (result.error || !result.data?.id) {
      const message =
        result.error?.message ||
        'Resend did not return an email ID.';

      console.error('Resend email submission failed:', message);
      return failedResult(message);
    }

    console.log(
      `Resend accepted certificate email for ${recipient}. ` +
      `Email ID: ${result.data.id}`,
    );

    return {
      email_status: mode === 'test' ? 'test_submitted' : 'submitted',
      email_id: result.data.id,
      email_error: null,
      email_submitted_at: new Date().toISOString(),
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unknown Resend email error.';

    console.error('Resend email sending failed:', message);
    return failedResult(message);
  }
}
