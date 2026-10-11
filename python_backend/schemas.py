from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr, field_validator

class RecipientInput(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Recipient full name")
    email: EmailStr = Field(..., description="Recipient valid email address")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional custom metadata")

    @field_validator("name")
    def name_must_not_be_blank(cls, v):
        if not v or not v.strip():
            raise ValueError("Recipient name cannot be blank or empty")
        return v.strip()

class CreateJobRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=200, description="Course or event title")
    instructor_name: str = Field(..., min_length=2, max_length=100, description="Lead instructor or issuer name")
    organization_name: str = Field(..., min_length=2, max_length=150, description="Issuing organization")
    issue_date: Optional[str] = Field(default=None, description="Date of issuance (e.g. YYYY-MM-DD)")
    description: Optional[str] = Field(default=None, description="Optional achievement description")
    recipients: List[Dict[str, Any]] = Field(..., min_length=1, max_length=500, description="List of recipient items")

    @field_validator("title", "instructor_name", "organization_name")
    def string_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Field cannot be empty")
        return v.strip()

class RecipientFailureResponse(BaseModel):
    id: str
    recipient_name: Optional[str] = None
    recipient_email: Optional[str] = None
    error_reason: str
    error_code: str
    created_at: datetime

    class Config:
        from_attributes = True

class CertificateResponse(BaseModel):
    id: str
    job_id: str
    recipient_name: str
    recipient_email: str
    verification_hash: str
    download_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class JobStatusResponse(BaseModel):
    id: str
    title: str
    instructor_name: str
    organization_name: str
    issue_date: str
    description: Optional[str] = None
    status: str
    total_count: int
    processed_count: int
    success_count: int
    failure_count: int
    progress_percentage: float
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    failures: List[RecipientFailureResponse] = []
    certificates: List[CertificateResponse] = []

    class Config:
        from_attributes = True

class JobCreatedResponse(BaseModel):
    job_id: str
    status: str
    message: str
    total_recipients: int
    check_status_url: str
    created_at: datetime

class VerificationResponse(BaseModel):
    valid: bool
    certificate_id: Optional[str] = None
    recipient_name: Optional[str] = None
    course_title: Optional[str] = None
    instructor_name: Optional[str] = None
    organization_name: Optional[str] = None
    issue_date: Optional[str] = None
    verification_hash: Optional[str] = None
    message: Optional[str] = None
