from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from enum import Enum

class DocumentType(str, Enum):
    PDF = "pdf"
    DOCX = "docx"
    EMAIL = "email"
    TXT = "txt"

class QueryRequest(BaseModel):
    """Request model matching the hackathon API specification"""
    documents: Union[str, List[str]] = Field(
        ..., 
        description="Document URL(s) to process",
        example="https://hackrx.blob.core.windows.net/assets/policy.pdf"
    )
    questions: List[str] = Field(
        ..., 
        min_items=1,
        description="List of questions to ask about the documents",
        example=[
            "What is the grace period for premium payment under the National Parivar Mediclaim Plus Policy?",
            "Does this policy cover maternity expenses, and what are the conditions?",
            "What is the waiting period for cataract surgery?"
        ]
    )
    options: Optional[Dict[str, Any]] = Field(
        default={},
        description="Additional processing options"
    )

    @validator('documents')
    def validate_documents(cls, v):
        if isinstance(v, str):
            return [v]  # Convert single string to list
        return v

    @validator('questions')
    def validate_questions(cls, v):
        if not v:
            raise ValueError("At least one question is required")
        return v

class AnswerResponse(BaseModel):
    """Individual answer response"""
    question: str
    answer: str
    confidence: float = Field(ge=0.0, le=1.0)
    sources: List[str]
    reasoning: str
    processing_time: float
    relevant_clauses: Optional[List[str]] = []
    decision_rationale: Optional[str] = ""
    compliance_status: Optional[str] = "unknown"

class QueryResponse(BaseModel):
    """Main response model matching the hackathon API specification"""
    answers: List[AnswerResponse]
    metadata: Dict[str, Any]
    status: str = "success"
    timestamp: datetime

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    timestamp: datetime
    services: Dict[str, str]
    version: str

class DocumentInfo(BaseModel):
    """Document information model"""
    id: str
    url: str
    type: DocumentType
    title: str
    content_length: int
    chunks_count: int
    processing_time: float
    created_at: datetime
    metadata: Dict[str, Any]

class SearchResult(BaseModel):
    """Search result model"""
    chunk_id: str
    content: str
    similarity_score: float
    document_id: str
    metadata: Dict[str, Any]

class ErrorResponse(BaseModel):
    """Error response model"""
    error: str
    message: str
    timestamp: str
    details: Optional[Dict[str, Any]] = None
