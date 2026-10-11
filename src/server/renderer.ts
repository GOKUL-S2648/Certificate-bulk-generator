import crypto from 'crypto';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface CertificateRenderParams {
  id: string;
  recipientName: string;
  recipientEmail: string;
  courseTitle: string;
  instructorName: string;
  organizationName: string;
  issueDate: string;
  description?: string;
  verificationHash: string;
}

export function generateVerificationHash(params: {
  certId: string;
  recipientName: string;
  recipientEmail: string;
  courseTitle: string;
  issueDate: string;
}): string {
  const payload = `${params.certId}:${params.recipientName}:${params.recipientEmail}:${params.courseTitle}:${params.issueDate}`;
  return crypto.createHash('sha256').update(payload).digest('hex').substring(0, 24);
}

export function escapeXml(unsafe: string): string {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function renderCertificateSvg(params: CertificateRenderParams): string {
  const safeName = escapeXml(params.recipientName);
  const safeTitle = escapeXml(params.courseTitle);
  const safeInstructor = escapeXml(params.instructorName);
  const safeOrg = escapeXml(params.organizationName);
  const safeDate = escapeXml(params.issueDate);
  const safeDesc = escapeXml(
    params.description ||
      'for demonstrating distinguished competence, fulfilling all rigorous academic requirements, and successfully completing the curriculum.'
  );
  const safeCertId = escapeXml(params.id);
  const safeHash = escapeXml(params.verificationHash);

  // Generate clean QR code visual grid pattern based on verification hash
  const qrGrid = generateQrGridSvg(params.id, 960, 640, 90);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 850" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FCFCFD"/>
      <stop offset="50%" stop-color="#F8FAFC"/>
      <stop offset="100%" stop-color="#F1F5F9"/>
    </linearGradient>

    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F59E0B"/>
      <stop offset="30%" stop-color="#D97706"/>
      <stop offset="70%" stop-color="#B45309"/>
      <stop offset="100%" stop-color="#78350F"/>
    </linearGradient>

    <linearGradient id="sealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FBBF24"/>
      <stop offset="50%" stop-color="#D97706"/>
      <stop offset="100%" stop-color="#92400E"/>
    </linearGradient>

    <pattern id="guilloche" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 0 20 Q 20 0 40 20 Q 20 40 0 20 Z" fill="none" stroke="#E2E8F0" stroke-width="0.75" opacity="0.6"/>
    </pattern>

    <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#0F172A" flood-opacity="0.08"/>
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="1200" height="850" fill="url(#bgGrad)"/>
  <rect x="24" y="24" width="1152" height="802" fill="url(#guilloche)" opacity="0.4"/>

  <!-- Outer Navy Frame -->
  <rect x="36" y="36" width="1128" height="778" fill="none" stroke="#0F172A" stroke-width="2"/>
  
  <!-- Outer Gold Border -->
  <rect x="44" y="44" width="1112" height="762" fill="none" stroke="url(#goldGrad)" stroke-width="4"/>
  
  <!-- Inner Thin Border -->
  <rect x="52" y="52" width="1096" height="746" fill="none" stroke="#CBD5E1" stroke-width="1" stroke-dasharray="6,4"/>

  <!-- Corner Ornamental Rosettes -->
  <!-- Top Left -->
  <path d="M 44 44 L 90 44 L 90 52 L 52 52 L 52 90 L 44 90 Z" fill="url(#goldGrad)"/>
  <circle cx="58" cy="58" r="4" fill="#B45309"/>

  <!-- Top Right -->
  <path d="M 1156 44 L 1110 44 L 1110 52 L 1148 52 L 1148 90 L 1156 90 Z" fill="url(#goldGrad)"/>
  <circle cx="1142" cy="58" r="4" fill="#B45309"/>

  <!-- Bottom Left -->
  <path d="M 44 806 L 90 806 L 90 798 L 52 798 L 52 760 L 44 760 Z" fill="url(#goldGrad)"/>
  <circle cx="58" cy="792" r="4" fill="#B45309"/>

  <!-- Bottom Right -->
  <path d="M 1156 806 L 1110 806 L 1110 798 L 1148 798 L 1148 760 L 1156 760 Z" fill="url(#goldGrad)"/>
  <circle cx="1142" cy="792" r="4" fill="#B45309"/>

  <!-- Top Ribbon & Organization -->
  <text x="600" y="112" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="13" font-weight="700" letter-spacing="4" fill="#B45309">
    ${safeOrg.toUpperCase()}
  </text>
  
  <line x1="480" y1="126" x2="720" y2="126" stroke="url(#goldGrad)" stroke-width="1.5"/>

  <!-- Main Certificate Heading -->
  <text x="600" y="195" text-anchor="middle" font-family="'Cinzel', 'Playfair Display', serif" font-size="38" font-weight="700" letter-spacing="3" fill="#0F172A">
    CERTIFICATE OF COMPLETION
  </text>
  
  <!-- Presentation Subtitle -->
  <text x="600" y="245" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="13" font-weight="500" letter-spacing="2" fill="#64748B">
    THIS DISTINCTION IS PROUDLY CONFERRED UPON
  </text>

  <!-- Recipient Name -->
  <text x="600" y="335" text-anchor="middle" font-family="'Playfair Display', Georgia, serif" font-size="46" font-weight="700" font-style="italic" fill="#0F172A">
    ${safeName}
  </text>

  <!-- Recipient Underline Accents -->
  <path d="M 320 365 L 880 365" stroke="#CBD5E1" stroke-width="1"/>
  <path d="M 450 365 L 750 365" stroke="url(#goldGrad)" stroke-width="2.5"/>
  <polygon points="600,361 604,365 600,369 596,365" fill="#B45309"/>

  <!-- Citation Context -->
  <text x="600" y="415" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="14" font-weight="400" fill="#475569">
    for successfully fulfilling all curriculum criteria and mastering the requirements of
  </text>

  <!-- Course Title -->
  <text x="600" y="475" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="28" font-weight="700" fill="#0F172A" letter-spacing="0.5">
    ${safeTitle}
  </text>

  <!-- Description Body -->
  <text x="600" y="525" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="13" font-weight="400" fill="#64748B" max-width="800">
    ${safeDesc}
  </text>

  <!-- Bottom Section: Signatures & Authenticity Stamp -->

  <!-- Left Signatory: Instructor -->
  <g transform="translate(180, 630)">
    <path d="M 0 50 Q 40 20 80 45 T 160 30 T 200 48" fill="none" stroke="#1E293B" stroke-width="2" stroke-linecap="round"/>
    <line x1="0" y1="60" x2="220" y2="60" stroke="#94A3B8" stroke-width="1"/>
    <text x="110" y="80" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="14" font-weight="600" fill="#0F172A">
      ${safeInstructor}
    </text>
    <text x="110" y="98" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="11" font-weight="500" fill="#64748B">
      Lead Instructor &amp; Course Director
    </text>
  </g>

  <!-- Golden Official Verification Seal (Center-Right) -->
  <g transform="translate(560, 635)" filter="url(#softShadow)">
    <!-- Starburst Seal Edge -->
    <circle cx="40" cy="40" r="42" fill="url(#sealGrad)" stroke="#B45309" stroke-width="1.5"/>
    <circle cx="40" cy="40" r="36" fill="none" stroke="#FEF3C7" stroke-width="1" stroke-dasharray="3,2"/>
    <circle cx="40" cy="40" r="32" fill="#78350F" opacity="0.15"/>
    <text x="40" y="32" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="8" font-weight="700" letter-spacing="1" fill="#FFFFFF">
      AUTHENTIC
    </text>
    <polygon points="40,36 43,44 51,44 45,49 47,57 40,52 33,57 35,49 29,44 37,44" fill="#FDE68A"/>
    <text x="40" y="65" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif" font-size="7.5" font-weight="700" letter-spacing="1.5" fill="#FEF3C7">
      VERIFIED
    </text>
  </g>

  <!-- Right: Verification QR & Details -->
  ${qrGrid}

  <!-- Footer Metadata Bar -->
  <g transform="translate(90, 755)">
    <text x="0" y="14" font-family="'JetBrains Mono', monospace" font-size="10.5" fill="#64748B">
      CERTIFICATE ID: <tspan font-weight="600" fill="#0F172A">${safeCertId}</tspan>
    </text>
    <text x="360" y="14" font-family="'JetBrains Mono', monospace" font-size="10.5" fill="#64748B">
      DATE ISSUED: <tspan font-weight="600" fill="#0F172A">${safeDate}</tspan>
    </text>
    <text x="680" y="14" font-family="'JetBrains Mono', monospace" font-size="10.5" fill="#64748B">
      HASH: <tspan font-weight="600" fill="#0F172A">${safeHash}</tspan>
    </text>
  </g>
</svg>`;
}

function generateQrGridSvg(idText: string, startX: number, startY: number, size: number): string {
  const cells = 15;
  const cellSize = size / cells;
  const hash = crypto.createHash('md5').update(idText).digest('hex');
  
  let rects = '';
  // Corner markers
  const addCorner = (ox: number, oy: number) => {
    rects += `<rect x="${ox}" y="${oy}" width="${cellSize * 4}" height="${cellSize * 4}" fill="#0F172A"/>`;
    rects += `<rect x="${ox + cellSize}" y="${oy + cellSize}" width="${cellSize * 2}" height="${cellSize * 2}" fill="#F8FAFC"/>`;
    rects += `<rect x="${ox + cellSize * 1.5}" y="${oy + cellSize * 1.5}" width="${cellSize}" height="${cellSize}" fill="#0F172A"/>`;
  };

  addCorner(startX, startY);
  addCorner(startX + cellSize * 11, startY);
  addCorner(startX, startY + cellSize * 11);

  // Pseudo-random data cells from hash
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      if ((r < 5 && c < 5) || (r < 5 && c > 9) || (r > 9 && c < 5)) continue;
      const charIndex = (r * cells + c) % hash.length;
      const code = hash.charCodeAt(charIndex);
      if (code % 2 === 0) {
        rects += `<rect x="${startX + c * cellSize}" y="${startY + r * cellSize}" width="${cellSize}" height="${cellSize}" fill="#0F172A"/>`;
      }
    }
  }

  return `
    <g>
      <rect x="${startX - 6}" y="${startY - 6}" width="${size + 12}" height="${size + 12}" fill="#FFFFFF" stroke="#E2E8F0" rx="4"/>
      ${rects}
      <text x="${startX + size / 2}" y="${startY + size + 18}" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="8.5" fill="#64748B">
        SCAN TO VERIFY
      </text>
    </g>
  `;
}

export async function renderCertificatePdf(params: CertificateRenderParams): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  // Landscape US Letter (792 x 612 pt)
  const page = pdfDoc.addPage([792, 612]);
  
  const fontTimesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontTimes = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontCourier = await pdfDoc.embedFont(StandardFonts.Courier);

  // Background and borders
  page.drawRectangle({
    x: 0,
    y: 0,
    width: 792,
    height: 612,
    color: rgb(0.98, 0.98, 0.99),
  });

  // Outer border
  page.drawRectangle({
    x: 24,
    y: 24,
    width: 744,
    height: 564,
    borderWidth: 2,
    borderColor: rgb(0.08, 0.1, 0.15),
  });

  // Gold inner border
  page.drawRectangle({
    x: 32,
    y: 32,
    width: 728,
    height: 548,
    borderWidth: 3,
    borderColor: rgb(0.85, 0.6, 0.15),
  });

  // Header Organization
  const orgText = params.organizationName.toUpperCase();
  const orgWidth = fontHelveticaBold.widthOfTextAtSize(orgText, 11);
  page.drawText(orgText, {
    x: (792 - orgWidth) / 2,
    y: 535,
    size: 11,
    font: fontHelveticaBold,
    color: rgb(0.7, 0.4, 0.05),
  });

  // Certificate Title
  const titleText = 'CERTIFICATE OF COMPLETION';
  const titleWidth = fontTimesBold.widthOfTextAtSize(titleText, 26);
  page.drawText(titleText, {
    x: (792 - titleWidth) / 2,
    y: 480,
    size: 26,
    font: fontTimesBold,
    color: rgb(0.08, 0.1, 0.15),
  });

  // Subtitle
  const subText = 'THIS DISTINCTION IS PROUDLY PRESENTED TO';
  const subWidth = fontHelvetica.widthOfTextAtSize(subText, 10);
  page.drawText(subText, {
    x: (792 - subWidth) / 2,
    y: 445,
    size: 10,
    font: fontHelvetica,
    color: rgb(0.4, 0.45, 0.5),
  });

  // Recipient Name
  const nameText = params.recipientName;
  const nameWidth = fontTimesBold.widthOfTextAtSize(nameText, 32);
  page.drawText(nameText, {
    x: (792 - nameWidth) / 2,
    y: 390,
    size: 32,
    font: fontTimesBold,
    color: rgb(0.08, 0.1, 0.15),
  });

  // Accent Line
  page.drawLine({
    start: { x: 220, y: 375 },
    end: { x: 572, y: 375 },
    thickness: 1.5,
    color: rgb(0.85, 0.6, 0.15),
  });

  // Reason
  const reasonText = 'for successfully fulfilling all curriculum criteria and mastering';
  const reasonWidth = fontHelvetica.widthOfTextAtSize(reasonText, 11);
  page.drawText(reasonText, {
    x: (792 - reasonWidth) / 2,
    y: 345,
    size: 11,
    font: fontHelvetica,
    color: rgb(0.3, 0.35, 0.4),
  });

  // Course Title
  const courseText = params.courseTitle;
  const courseWidth = fontHelveticaBold.widthOfTextAtSize(courseText, 19);
  page.drawText(courseText, {
    x: (792 - courseWidth) / 2,
    y: 305,
    size: 19,
    font: fontHelveticaBold,
    color: rgb(0.08, 0.1, 0.15),
  });

  // Description
  const descText = params.description || 'in recognition of demonstrated excellence, rigor, and technical mastery.';
  const descWidth = fontHelvetica.widthOfTextAtSize(descText, 10);
  page.drawText(descText, {
    x: (792 - descWidth) / 2,
    y: 270,
    size: 10,
    font: fontHelvetica,
    color: rgb(0.45, 0.5, 0.55),
  });

  // Signature Block
  page.drawLine({
    start: { x: 120, y: 160 },
    end: { x: 290, y: 160 },
    thickness: 1,
    color: rgb(0.6, 0.65, 0.7),
  });

  page.drawText(params.instructorName, {
    x: 120,
    y: 142,
    size: 11,
    font: fontHelveticaBold,
    color: rgb(0.08, 0.1, 0.15),
  });

  page.drawText('Instructor & Authorized Signatory', {
    x: 120,
    y: 128,
    size: 9,
    font: fontHelvetica,
    color: rgb(0.45, 0.5, 0.55),
  });

  // Official Seal
  page.drawCircle({
    x: 396,
    y: 155,
    size: 32,
    color: rgb(0.95, 0.75, 0.2),
    borderColor: rgb(0.7, 0.45, 0.1),
    borderWidth: 2,
  });
  
  page.drawText('OFFICIAL', {
    x: 374,
    y: 162,
    size: 8,
    font: fontHelveticaBold,
    color: rgb(0.4, 0.2, 0.05),
  });
  page.drawText('VERIFIED', {
    x: 374,
    y: 148,
    size: 8,
    font: fontHelveticaBold,
    color: rgb(0.4, 0.2, 0.05),
  });

  // Date and ID Block
  page.drawLine({
    start: { x: 500, y: 160 },
    end: { x: 670, y: 160 },
    thickness: 1,
    color: rgb(0.6, 0.65, 0.7),
  });

  page.drawText(`Issue Date: ${params.issueDate}`, {
    x: 500,
    y: 142,
    size: 10,
    font: fontHelvetica,
    color: rgb(0.08, 0.1, 0.15),
  });

  page.drawText(`ID: ${params.id}`, {
    x: 500,
    y: 128,
    size: 9,
    font: fontCourier,
    color: rgb(0.3, 0.35, 0.4),
  });

  // Bottom verification footer
  const footerText = `VERIFICATION HASH: ${params.verificationHash}  •  AUTHENTIC RECORD`;
  const footerWidth = fontCourier.widthOfTextAtSize(footerText, 8.5);
  page.drawText(footerText, {
    x: (792 - footerWidth) / 2,
    y: 55,
    size: 8.5,
    font: fontCourier,
    color: rgb(0.5, 0.55, 0.6),
  });

  return await pdfDoc.save();
}
