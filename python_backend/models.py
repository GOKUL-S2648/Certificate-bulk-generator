import enum
from datetime import datetime
from sqlalchemy import Column, String, Integer, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base

class JobStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    PARTIAL = "partial"
    FAILED = "failed"

class JobModel(Base):
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    instructor_name = Column(String, nullable=False)
    organization_name = Column(String, nullable=False)
    issue_date = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default=JobStatus.PENDING.value, nullable=False)
    total_count = Column(Integer, default=0, nullable=False)
    processed_count = Column(Integer, default=0, nullable=False)
    success_count = Column(Integer, default=0, nullable=False)
    failure_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    certificates = relationship("CertificateModel", back_populates="job", cascade="all, delete-orphan")
    failures = relationship("JobFailureModel", back_populates="job", cascade="all, delete-orphan")

class CertificateModel(Base):
    __tablename__ = "certificates"

    id = Column(String, primary_key=True, index=True)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False, index=True)
    recipient_name = Column(String, nullable=False)
    recipient_email = Column(String, nullable=False, index=True)
    recipient_metadata = Column(Text, nullable=True)
    verification_hash = Column(String, nullable=False, index=True)
    pdf_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    job = relationship("JobModel", back_populates="certificates")

class JobFailureModel(Base):
    __tablename__ = "job_failures"

    id = Column(String, primary_key=True, index=True)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False, index=True)
    recipient_name = Column(String, nullable=True)
    recipient_email = Column(String, nullable=True)
    error_reason = Column(Text, nullable=False)
    error_code = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    job = relationship("JobModel", back_populates="failures")
