# Bulk Certificate Generator API — Backend Service

A high-performance backend API designed for issuing certificates in bulk for educational cohorts, webinars, and enterprise training programs. Built with **Python (FastAPI)**, **SQLAlchemy**, and a relational database (**SQLite / PostgreSQL**).

---

## 1. Project Setup

### Prerequisites
- Python 3.10+
- pip

### Installation
1. Clone or extract the repository:
   ```bash
   cd python_backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

---

## 2. Running the Application

Start the FastAPI application with Uvicorn:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
The server will be available at:
- Interactive OpenAPI / Swagger UI: `http://localhost:8000/docs`
- ReDoc Documentation: `http://localhost:8000/redoc`

---

## 3. Running Automated Tests

Run the test suite covering the 6 mandatory assignment requirements:
```bash
pytest -v test_api.py
```
This executes tests covering:
1. `test_1_create_generation_job`: Verifies job creation and initial relational state.
2. `test_2_input_validation`: Verifies rejection of missing title, empty recipient array, and bad email strings.
3. `test_3_certificate_generation`: Verifies certificate PDF generation with embedded security hashes.
4. `test_4_job_status_and_progress`: Verifies progress counters and state transitions.
5. `test_5_handling_individual_certificate_failure`: Verifies that invalid rows do not abort valid ones.
6. `test_6_retrieving_generated_certificates`: Verifies certificate retrieval, downloads, and verification.

---

## 4. How to Submit a Certificate Generation Request

Send a `POST` request to `/api/certificates/generate`.

### Example Request (`curl`)
```bash
curl -X POST "http://localhost:8000/api/certificates/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Advanced Distributed Systems",
    "instructor_name": "Dr. Sarah Lin",
    "organization_name": "Stanford Online",
    "issue_date": "2026-10-10",
    "description": "Excellence in distributed consensus and scalable backend architectures.",
    "recipients": [
      {
        "name": "Alex Mercer",
        "email": "alex.mercer@example.com",
        "metadata": { "grade": "Distinction", "cohort": "Fall 2026" }
      },
      {
        "name": "Jordan Hayes",
        "email": "jordan.hayes@example.com"
      },
      {
        "name": "",
        "email": "bad-recipient-no-name@example.com"
      }
    ]
  }'
```

### Response (`HTTP 202 Accepted`)
```json
{
  "job_id": "job_1742081234_ab12cd",
  "status": "pending",
  "message": "Bulk certificate generation request accepted for processing.",
  "total_recipients": 3,
  "check_status_url": "/api/certificates/jobs/job_1742081234_ab12cd",
  "created_at": "2026-10-10T14:30:00Z"
}
```

---

## 5. How to Track Job Progress and Retrieve Certificates

### 1. Poll Job Status
```bash
curl "http://localhost:8000/api/certificates/jobs/job_1742081234_ab12cd"
```
**Response:**
```json
{
  "id": "job_1742081234_ab12cd",
  "title": "Advanced Distributed Systems",
  "status": "partial",
  "total_count": 3,
  "processed_count": 3,
  "success_count": 2,
  "failure_count": 1,
  "progress_percentage": 100.0,
  "failures": [
    {
      "recipient_name": "",
      "recipient_email": "bad-recipient-no-name@example.com",
      "error_code": "INVALID_NAME",
      "error_reason": "Recipient name is required and must be at least 2 characters long."
    }
  ],
  "certificates": [
    {
      "id": "CERT-2026-B817E29A",
      "recipient_name": "Alex Mercer",
      "download_url": "/api/certificates/CERT-2026-B817E29A/download"
    }
  ]
}
```

### 2. Retrieve Generated Certificates
```bash
curl "http://localhost:8000/api/certificates/jobs/job_1742081234_ab12cd/certificates"
```

### 3. Download Single Certificate PDF
```bash
curl -O -J "http://localhost:8000/api/certificates/CERT-2026-B817E29A/download"
```

### 4. Bulk Download All Certificates as ZIP
```bash
curl -O -J "http://localhost:8000/api/certificates/jobs/job_1742081234_ab12cd/download-zip"
```

### 5. Verify Certificate Authenticity
```bash
curl "http://localhost:8000/api/certificates/verify/CERT-2026-B817E29A"
```

---

## 6. Architecture & Implementation Decisions

### A. Asynchronous Background Queue vs Synchronous Processing
- **Decision:** Asynchronous background processing by default, with an optional synchronous fallback (`?sync=true`).
- **Rationale:** Bulk requests can contain hundreds of recipients. Generating high-resolution vector PDF certificates can take 50ms–200ms per certificate. Holding an HTTP connection open for 500 recipients would cause gateway timeouts (HTTP 504) and poor client UX.
- **Design:** The API immediately responds with `HTTP 202 Accepted` and a unique `job_id`. Background tasks process rows concurrently or sequentially, committing incremental progress counters directly to the relational database.

### B. Relational Database & State Isolation
- **Tables:**
  - `jobs`: Stores overall batch metadata, execution state (`pending`, `processing`, `completed`, `partial`, `failed`), and metrics (`total_count`, `success_count`, `failure_count`).
  - `certificates`: Normalized table of successfully generated credentials with unique IDs, verification hashes, and timestamps.
  - `job_failures`: Independent log of failed recipient rows detailing specific error codes and reasons.
- **Foreign Keys:** Cascade deletion on job records ensures referential integrity without orphan records.
- **Indexing:** Indexes on `job_id`, `recipient_email`, and `verification_hash` guarantee sub-millisecond status polling and instant verification lookups.

### C. Failure Handling & Resilience
- **Per-Recipient Isolation:** If recipient 42 in a batch of 100 has an invalid email or missing name, the worker catches the validation/render exception, persists the error into `job_failures`, and continues processing recipient 43 without interruption.
- **Job Status Granularity:** If all succeed, the job is marked `completed`. If some fail, it is marked `partial`. If all fail, it is marked `failed`.
