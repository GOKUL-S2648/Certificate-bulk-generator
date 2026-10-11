import pytest
from fastapi.testclient import TestClient
from main import app
from database import Base, engine

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield

def test_1_create_generation_job():
    """Test 1: Submitting a valid generation job request."""
    payload = {
        "title": "Machine Learning Specialization",
        "instructor_name": "Andrew Ng",
        "organization_name": "DeepLearning AI",
        "issue_date": "2026-10-10",
        "description": "Mastery of modern deep learning and neural network architectures",
        "recipients": [
            {"name": "Alice Walker", "email": "alice@example.com"},
            {"name": "Bob Stone", "email": "bob@example.com"}
        ]
    }
    response = client.post("/api/certificates/generate", json=payload)
    assert response.status_code == 202
    data = response.json()
    assert "job_id" in data
    assert data["status"] == "pending"
    assert data["total_recipients"] == 2

def test_2_input_validation():
    """Test 2: Validation of required fields and recipient email/name formats."""
    # Empty title and empty recipients array
    invalid_payload = {
        "title": "",
        "instructor_name": "John Doe",
        "organization_name": "Org",
        "recipients": []
    }
    response = client.post("/api/certificates/generate", json=invalid_payload)
    assert response.status_code == 422 # Pydantic validation error

def test_3_certificate_generation():
    """Test 3: Synchronous generation and certificate artifact verification."""
    payload = {
        "title": "Database Internals",
        "instructor_name": "Martin Kleppmann",
        "organization_name": "Cambridge Systems",
        "recipients": [
            {"name": "Charlie Day", "email": "charlie@example.com"}
        ]
    }
    response = client.post("/api/certificates/generate?sync=true", json=payload)
    assert response.status_code == 202
    job_id = response.json()["job_id"]

    # Retrieve job status
    status_resp = client.get(f"/api/certificates/jobs/{job_id}")
    assert status_resp.status_code == 200
    job_data = status_resp.json()
    assert job_data["status"] == "completed"
    assert job_data["success_count"] == 1
    assert len(job_data["certificates"]) == 1

def test_4_job_status_and_progress():
    """Test 4: Polling job status returns accurate progress counters."""
    payload = {
        "title": "Distributed Consensus",
        "instructor_name": "Leslie Lamport",
        "organization_name": "ACM",
        "recipients": [
            {"name": "Dana Scully", "email": "dana@example.com"},
            {"name": "Fox Mulder", "email": "fox@example.com"}
        ]
    }
    create_resp = client.post("/api/certificates/generate?sync=true", json=payload)
    job_id = create_resp.json()["job_id"]

    status_resp = client.get(f"/api/certificates/jobs/{job_id}")
    assert status_resp.status_code == 200
    data = status_resp.json()
    assert data["total_count"] == 2
    assert data["processed_count"] == 2
    assert data["progress_percentage"] == 100.0

def test_5_handling_individual_certificate_failure():
    """Test 5: Partial failure isolation when some recipients are invalid."""
    payload = {
        "title": "Security Engineering",
        "instructor_name": "Bruce Schneier",
        "organization_name": "Crypto Lab",
        "recipients": [
            {"name": "Valid Recipient", "email": "valid@example.com"},
            {"name": "", "email": "invalid-no-name@example.com"}, # Invalid name
            {"name": "Bad Email Recipient", "email": "not-an-email"}, # Invalid email
        ]
    }
    create_resp = client.post("/api/certificates/generate?sync=true", json=payload)
    job_id = create_resp.json()["job_id"]

    status_resp = client.get(f"/api/certificates/jobs/{job_id}")
    assert status_resp.status_code == 200
    data = status_resp.json()
    
    # Must be partial status with 1 success and 2 failures
    assert data["status"] == "partial"
    assert data["success_count"] == 1
    assert data["failure_count"] == 2
    assert len(data["failures"]) == 2
    assert len(data["certificates"]) == 1
    # Check failure error codes
    codes = [f["error_code"] for f in data["failures"]]
    assert "INVALID_NAME" in codes
    assert "INVALID_EMAIL" in codes

def test_6_retrieving_generated_certificates():
    """Test 6: Retrieving generated certificates and public verification."""
    payload = {
        "title": "Modern API Architecture",
        "instructor_name": "Roy Fielding",
        "organization_name": "REST Foundation",
        "recipients": [
            {"name": "Grace Hopper", "email": "grace@example.com"}
        ]
    }
    create_resp = client.post("/api/certificates/generate?sync=true", json=payload)
    job_id = create_resp.json()["job_id"]

    # 1. Retrieve job certificates list
    certs_resp = client.get(f"/api/certificates/jobs/{job_id}/certificates")
    assert certs_resp.status_code == 200
    certs = certs_resp.json()
    assert len(certs) == 1
    cert_id = certs[0]["id"]
    assert certs[0]["recipient_name"] == "Grace Hopper"

    # 2. Public verification endpoint
    verify_resp = client.get(f"/api/certificates/verify/{cert_id}")
    assert verify_resp.status_code == 200
    verify_data = verify_resp.json()
    assert verify_data["valid"] is True
    assert verify_data["recipient_name"] == "Grace Hopper"

    # 3. Download certificate PDF
    dl_resp = client.get(f"/api/certificates/{cert_id}/download")
    assert dl_resp.status_code == 200
    assert dl_resp.headers["content-type"] == "application/pdf"
    assert dl_resp.content.startswith(b"%PDF")
