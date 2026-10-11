
import json
import uuid
import zipfile
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import BackgroundTasks, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse

from schemas import (
    CertificateResponse,
    CreateJobRequest,
    JobCreatedResponse,
    JobStatusResponse,
    VerificationResponse,
)
from generator import compute_verification_hash, generate_certificate_pdf
from supabase_client import supabase


# --------------------------------------------------
# Configuration
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent
CERT_STORAGE_DIR = BASE_DIR / "generated_certificates"
CERT_STORAGE_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(
    title="Bulk Certificate Generator API",
    description=(
        "Bulk certificate generation with Supabase database storage, "
        "recipient validation, failure isolation, PDF downloads, "
        "ZIP downloads, and certificate verification."
    ),
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# Shared helpers
# --------------------------------------------------

def timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


def first_row(response: Any) -> Optional[Dict[str, Any]]:
    rows = getattr(response, "data", None) or []
    return rows[0] if rows else None


def get_job_or_404(job_id: str) -> Dict[str, Any]:
    response = (
        supabase.table("jobs")
        .select("*")
        .eq("id", job_id)
        .limit(1)
        .execute()
    )

    job = first_row(response)

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return job


def get_certificate_or_404(cert_id: str) -> Dict[str, Any]:
    response = (
        supabase.table("certificates")
        .select("*")
        .eq("id", cert_id)
        .limit(1)
        .execute()
    )

    certificate = first_row(response)

    if not certificate:
        raise HTTPException(
            status_code=404,
            detail="Certificate not found",
        )

    return certificate


def get_job_certificates(job_id: str) -> List[Dict[str, Any]]:
    response = (
        supabase.table("certificates")
        .select("*")
        .eq("job_id", job_id)
        .order("created_at")
        .execute()
    )

    return response.data or []


def certificate_response(
    certificate: Dict[str, Any],
) -> CertificateResponse:
    return CertificateResponse(
        id=certificate["id"],
        job_id=certificate["job_id"],
        recipient_name=certificate["recipient_name"],
        recipient_email=certificate["recipient_email"],
        verification_hash=certificate["verification_hash"],
        download_url=(
            f"/api/certificates/{certificate['id']}/download"
        ),
        created_at=certificate["created_at"],
    )


def build_certificate_pdf(
    certificate: Dict[str, Any],
    job: Dict[str, Any],
) -> bytes:
    pdf_path = certificate.get("pdf_path")

    if pdf_path:
        candidate = Path(pdf_path)

        try:
            candidate.resolve().relative_to(
                CERT_STORAGE_DIR.resolve()
            )
        except ValueError:
            candidate = CERT_STORAGE_DIR / (
                f"{certificate['id']}.pdf"
            )

        if candidate.is_file():
            return candidate.read_bytes()

    return generate_certificate_pdf(
        cert_id=certificate["id"],
        recipient_name=certificate["recipient_name"],
        course_title=job["title"],
        instructor_name=job["instructor_name"],
        organization_name=job["organization_name"],
        issue_date=job["issue_date"],
        verification_hash=certificate["verification_hash"],
        description=job.get("description"),
    )


def record_failure(
    job_id: str,
    name: str,
    email: str,
    reason: str,
    error_code: str,
) -> None:
    failure = {
        "id": f"fail_{uuid.uuid4().hex[:12]}",
        "job_id": job_id,
        "recipient_name": name or None,
        "recipient_email": email or None,
        "error_reason": reason,
        "error_code": error_code,
        "created_at": timestamp(),
    }

    supabase.table("job_failures").insert(failure).execute()


# --------------------------------------------------
# Bulk certificate processing
# --------------------------------------------------

def process_bulk_generation_task(
    job_id: str,
    recipients: list,
    job_details: dict,
) -> None:
    """Generate certificates and save results to Supabase."""

    job = first_row(
        supabase.table("jobs")
        .select("*")
        .eq("id", job_id)
        .limit(1)
        .execute()
    )

    if not job:
        return

    supabase.table("jobs").update(
        {
            "status": "processing",
            "updated_at": timestamp(),
        }
    ).eq("id", job_id).execute()

    success_count = 0
    failure_count = 0

    try:
        for recipient in recipients:
            raw_name = recipient.get("name")
            raw_email = recipient.get("email")
            metadata = recipient.get("metadata") or {}

            name = (
                str(raw_name).strip()
                if raw_name is not None
                else ""
            )
            email = (
                str(raw_email).strip()
                if raw_email is not None
                else ""
            )

            error_reason = None
            error_code = None

            # Validate recipients independently.
            if len(name) < 2:
                error_reason = (
                    "Recipient name is required and must be "
                    "at least 2 characters long."
                )
                error_code = "INVALID_NAME"

            elif len(name) > 100:
                error_reason = (
                    "Recipient name cannot exceed 100 characters."
                )
                error_code = "INVALID_NAME"

            elif (
                not email
                or "@" not in email
                or "." not in email.split("@")[-1]
            ):
                error_reason = f"Invalid email format: '{email}'."
                error_code = "INVALID_EMAIL"

            elif name == "__FAIL_RENDER_TEST__":
                error_reason = (
                    "Simulated render engine fault for testing."
                )
                error_code = "RENDER_EXCEPTION"

            if error_reason:
                record_failure(
                    job_id,
                    name,
                    email,
                    error_reason,
                    error_code,
                )
                failure_count += 1

            else:
                cert_id = (
                    f"CERT-{datetime.now(timezone.utc).year}-"
                    f"{uuid.uuid4().hex[:8].upper()}"
                )

                try:
                    verification_hash = compute_verification_hash(
                        cert_id=cert_id,
                        recipient_name=name,
                        recipient_email=email,
                        course_title=job_details["title"],
                        issue_date=job_details["issue_date"],
                    )

                    pdf_bytes = generate_certificate_pdf(
                        cert_id=cert_id,
                        recipient_name=name,
                        course_title=job_details["title"],
                        instructor_name=job_details["instructor_name"],
                        organization_name=job_details[
                            "organization_name"
                        ],
                        issue_date=job_details["issue_date"],
                        verification_hash=verification_hash,
                        description=job_details.get("description"),
                    )

                    pdf_path = CERT_STORAGE_DIR / f"{cert_id}.pdf"
                    pdf_path.write_bytes(pdf_bytes)

                    certificate = {
                        "id": cert_id,
                        "job_id": job_id,
                        "recipient_name": name,
                        "recipient_email": email,
                        "recipient_metadata": json.dumps(metadata),
                        "verification_hash": verification_hash,
                        "pdf_path": str(pdf_path),
                        "created_at": timestamp(),
                    }

                    supabase.table("certificates").insert(
                        certificate
                    ).execute()

                    success_count += 1

                except Exception as exc:
                    failure_count += 1

                    try:
                        record_failure(
                            job_id,
                            name,
                            email,
                            f"Certificate generation failed: {str(exc)}",
                            "RENDER_EXCEPTION",
                        )
                    except Exception as database_exc:
                        print(
                            "Could not save certificate failure:",
                            str(database_exc),
                        )

            # Save counts after each recipient.
            supabase.table("jobs").update(
                {
                    "processed_count": (
                        success_count + failure_count
                    ),
                    "success_count": success_count,
                    "failure_count": failure_count,
                    "updated_at": timestamp(),
                }
            ).eq("id", job_id).execute()

        if success_count > 0 and failure_count == 0:
            final_status = "completed"
        elif success_count > 0 and failure_count > 0:
            final_status = "partial"
        else:
            final_status = "failed"

        supabase.table("jobs").update(
            {
                "status": final_status,
                "completed_at": timestamp(),
                "updated_at": timestamp(),
                "processed_count": success_count + failure_count,
                "success_count": success_count,
                "failure_count": failure_count,
            }
        ).eq("id", job_id).execute()

    except Exception as exc:
        print(f"Unexpected job error for {job_id}: {exc}")

        # Try to mark the job as failed.
        try:
            supabase.table("jobs").update(
                {
                    "status": "failed",
                    "completed_at": timestamp(),
                    "updated_at": timestamp(),
                    "processed_count": (
                        success_count + failure_count
                    ),
                    "success_count": success_count,
                    "failure_count": failure_count,
                }
            ).eq("id", job_id).execute()
        except Exception as database_exc:
            print(
                "Unable to update failed job status:",
                str(database_exc),
            )


# --------------------------------------------------
# Health endpoint
# --------------------------------------------------

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "Bulk Certificate Generator API",
    }


# --------------------------------------------------
# Create a generation job
# --------------------------------------------------

@app.post(
    "/api/certificates/generate",
    response_model=JobCreatedResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
def create_certificate_job(
    request: CreateJobRequest,
    background_tasks: BackgroundTasks,
    sync: bool = Query(
        False,
        description="Process synchronously before returning if true",
    ),
):
    job_id = (
        f"job_{int(datetime.now(timezone.utc).timestamp())}_"
        f"{uuid.uuid4().hex[:6]}"
    )

    issue_date = (
        request.issue_date
        or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    )
    created_at = timestamp()

    new_job = {
        "id": job_id,
        "title": request.title,
        "instructor_name": request.instructor_name,
        "organization_name": request.organization_name,
        "issue_date": issue_date,
        "description": request.description,
        "status": "pending",
        "total_count": len(request.recipients),
        "processed_count": 0,
        "success_count": 0,
        "failure_count": 0,
        "created_at": created_at,
        "updated_at": created_at,
        "completed_at": None,
    }

    supabase.table("jobs").insert(new_job).execute()

    job_details = {
        "title": request.title,
        "instructor_name": request.instructor_name,
        "organization_name": request.organization_name,
        "issue_date": issue_date,
        "description": request.description,
    }

    if sync:
        process_bulk_generation_task(
            job_id,
            request.recipients,
            job_details,
        )

        final_job = get_job_or_404(job_id)
        response_status = final_job["status"]

        if response_status in {"completed", "partial"}:
            message = "Bulk certificate generation completed."
        else:
            message = "Bulk certificate generation failed."

    else:
        background_tasks.add_task(
            process_bulk_generation_task,
            job_id,
            request.recipients,
            job_details,
        )
        response_status = "pending"
        message = (
            "Bulk certificate generation request accepted "
            "for processing."
        )

    return JobCreatedResponse(
        job_id=job_id,
        status=response_status,
        message=message,
        total_recipients=len(request.recipients),
        check_status_url=f"/api/certificates/jobs/{job_id}",
        created_at=created_at,
    )


# --------------------------------------------------
# Retrieve job status and results
# --------------------------------------------------

@app.get(
    "/api/certificates/jobs/{job_id}",
    response_model=JobStatusResponse,
)
def get_job_status(job_id: str):
    job = get_job_or_404(job_id)
    certificates = get_job_certificates(job_id)

    failure_result = (
        supabase.table("job_failures")
        .select("*")
        .eq("job_id", job_id)
        .order("created_at")
        .execute()
    )
    failures = failure_result.data or []

    total_count = int(job.get("total_count") or 0)
    processed_count = int(job.get("processed_count") or 0)

    progress = (
        round(processed_count / total_count * 100.0, 1)
        if total_count
        else 0.0
    )

    return JobStatusResponse(
        id=job["id"],
        title=job["title"],
        instructor_name=job["instructor_name"],
        organization_name=job["organization_name"],
        issue_date=job["issue_date"],
        description=job.get("description"),
        status=job["status"],
        total_count=total_count,
        processed_count=processed_count,
        success_count=int(job.get("success_count") or 0),
        failure_count=int(job.get("failure_count") or 0),
        progress_percentage=progress,
        created_at=job["created_at"],
        updated_at=job["updated_at"],
        completed_at=job.get("completed_at"),
        failures=failures,
        certificates=[
            certificate_response(cert)
            for cert in certificates
        ],
    )


# --------------------------------------------------
# List certificates for a job
# --------------------------------------------------

@app.get(
    "/api/certificates/jobs/{job_id}/certificates",
    response_model=List[CertificateResponse],
)
def get_job_certificates_endpoint(job_id: str):
    get_job_or_404(job_id)

    return [
        certificate_response(cert)
        for cert in get_job_certificates(job_id)
    ]


# --------------------------------------------------
# Download an individual certificate PDF
# --------------------------------------------------

@app.get("/api/certificates/{cert_id}/download")
def download_certificate(cert_id: str):
    certificate = get_certificate_or_404(cert_id)
    job = get_job_or_404(certificate["job_id"])

    pdf_bytes = build_certificate_pdf(certificate, job)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f'attachment; filename="certificate-{cert_id}.pdf"'
            )
        },
    )


# --------------------------------------------------
# Download all certificates in a ZIP
# --------------------------------------------------

@app.get("/api/certificates/jobs/{job_id}/download-zip")
def download_job_zip(job_id: str):
    job = get_job_or_404(job_id)
    certificates = get_job_certificates(job_id)

    zip_buffer = BytesIO()

    with zipfile.ZipFile(
        zip_buffer,
        "w",
        zipfile.ZIP_DEFLATED,
    ) as zip_file:
        for certificate in certificates:
            pdf_bytes = build_certificate_pdf(certificate, job)

            safe_name = "".join(
                char
                for char in certificate["recipient_name"]
                if char.isalnum() or char in (" ", "_", "-")
            ).strip() or "recipient"

            zip_file.writestr(
                f"{safe_name}_{certificate['id']}.pdf",
                pdf_bytes,
            )

    zip_buffer.seek(0)

    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={
            "Content-Disposition": (
                f'attachment; filename="certificates-{job_id}.zip"'
            )
        },
    )


# --------------------------------------------------
# Verify certificate authenticity
# --------------------------------------------------

@app.get(
    "/api/certificates/verify/{cert_id}",
    response_model=VerificationResponse,
)
def verify_certificate(cert_id: str):
    certificate = first_row(
        supabase.table("certificates")
        .select("*")
        .eq("id", cert_id)
        .limit(1)
        .execute()
    )

    if not certificate:
        return VerificationResponse(
            valid=False,
            message="Certificate record not found or forged.",
        )

    job = get_job_or_404(certificate["job_id"])

    expected_hash = compute_verification_hash(
        cert_id=certificate["id"],
        recipient_name=certificate["recipient_name"],
        recipient_email=certificate["recipient_email"],
        course_title=job["title"],
        issue_date=job["issue_date"],
    )

    is_valid = expected_hash == certificate["verification_hash"]

    return VerificationResponse(
        valid=is_valid,
        certificate_id=certificate["id"],
        recipient_name=certificate["recipient_name"],
        course_title=job["title"],
        instructor_name=job["instructor_name"],
        organization_name=job["organization_name"],
        issue_date=job["issue_date"],
        verification_hash=certificate["verification_hash"],
        message=(
            "Authentic verified credential."
            if is_valid
            else "Certificate verification failed."
        ),
    )
