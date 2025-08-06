from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uvicorn
import logging
import time
from datetime import datetime
import asyncio

from services.advanced_document_processor import AdvancedDocumentProcessor
from services.vector_search import VectorSearchService
from services.llm_service import LLMService
from services.auth_service import AuthService
from models.schemas import QueryRequest, QueryResponse, HealthResponse
from config.settings import get_settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="LLM-Powered Intelligent Query-Retrieval System",
    description="Advanced document processing and contextual decision-making API",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://your-frontend-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()
settings = get_settings()

# Initialize services
document_processor = AdvancedDocumentProcessor()
vector_service = VectorSearchService()
llm_service = LLMService()
auth_service = AuthService()

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify Bearer token authentication"""
    token = credentials.credentials
    if not auth_service.verify_token(token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return token

@app.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint"""
    return {
        "message": "LLM-Powered Intelligent Query-Retrieval System API",
        "version": "2.0.0",
        "status": "operational",
        "docs": "/docs"
    }

@app.get("/api/v1/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    try:
        # Check all services
        vector_status = await vector_service.health_check()
        llm_status = await llm_service.health_check()
        
        return HealthResponse(
            status="healthy",
            timestamp=datetime.utcnow(),
            services={
                "vector_db": vector_status,
                "llm_service": llm_status,
                "document_processor": "healthy"
            },
            version="2.0.0"
        )
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=503, detail="Service unavailable")

@app.get("/api/v1/documents/formats")
async def get_supported_formats(token: str = Depends(verify_token)):
    """Get supported document formats"""
    try:
        formats = await document_processor.get_supported_formats()
        return formats
    except Exception as e:
        logger.error(f"Error getting supported formats: {e}")
        raise HTTPException(status_code=500, detail="Failed to get supported formats")

@app.post("/api/v1/hackrx/run", response_model=QueryResponse)
async def run_query_retrieval(
    request: QueryRequest,
    token: str = Depends(verify_token)
):
    """
    Main endpoint for document query processing
    Matches the exact API structure from the hackathon documentation
    """
    start_time = time.time()
    
    try:
        logger.info(f"Processing request with {len(request.questions)} questions")
        
        # Step 1: Process documents
        logger.info("Step 1: Processing documents...")
        processed_docs = await document_processor.process_documents(request.documents)
        
        # Step 2: Create embeddings and store in vector DB
        logger.info("Step 2: Creating embeddings...")
        await vector_service.store_document_embeddings(processed_docs)
        
        # Step 3: Process each question
        answers = []
        for question in request.questions:
            question_start = time.time()
            
            # Step 4: Semantic search for relevant chunks
            logger.info(f"Step 3: Searching for: {question}")
            relevant_chunks = await vector_service.semantic_search(
                query=question,
                top_k=5,
                similarity_threshold=0.7
            )
            
            # Step 5: Generate answer using LLM
            logger.info("Step 4: Generating answer...")
            domain = request.options.get("domain", "insurance")
            answer_data = await llm_service.generate_contextual_answer(
                question=question,
                context_chunks=relevant_chunks,
                domain=domain
            )
            
            processing_time = time.time() - question_start
            
            # Step 6: Format response
            answer = {
                "question": question,
                "answer": answer_data["answer"],
                "confidence": answer_data["confidence"],
                "sources": answer_data["sources"],
                "reasoning": answer_data["reasoning"],
                "processing_time": round(processing_time, 2),
                "relevant_clauses": answer_data.get("relevant_clauses", []),
                "decision_rationale": answer_data.get("decision_rationale", ""),
                "compliance_status": answer_data.get("compliance_status", "unknown")
            }
            answers.append(answer)
        
        total_processing_time = time.time() - start_time
        
        # Prepare final response matching the expected format
        response = QueryResponse(
            answers=answers,
            metadata={
                "total_questions": len(request.questions),
                "total_processing_time": round(total_processing_time, 2),
                "avg_processing_time": round(total_processing_time / len(request.questions), 2),
                "documents_processed": len(request.documents) if isinstance(request.documents, list) else 1,
                "vector_search_enabled": True,
                "llm_model": "gpt-4",
                "api_version": "v1"
            },
            status="success",
            timestamp=datetime.utcnow()
        )
        
        logger.info(f"Request completed in {total_processing_time:.2f}s")
        return response
        
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Internal server error",
                "message": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
        )

@app.post("/api/v1/documents/upload")
async def upload_document(
    file_url: str,
    document_type: Optional[str] = None,
    token: str = Depends(verify_token)
):
    """Upload and process a single document"""
    try:
        processed_doc = await document_processor.process_single_document(
            file_url, document_type
        )
        await vector_service.store_document_embeddings([processed_doc])
        
        return {
            "status": "success",
            "document_id": processed_doc["id"],
            "chunks_created": len(processed_doc["chunks"]),
            "processing_time": processed_doc["processing_time"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/documents/{document_id}")
async def get_document(
    document_id: str,
    token: str = Depends(verify_token)
):
    """Get document information"""
    try:
        doc_info = await document_processor.get_document_info(document_id)
        return doc_info
    except Exception as e:
        raise HTTPException(status_code=404, detail="Document not found")

@app.post("/api/v1/search")
async def semantic_search(
    query: str,
    top_k: int = 5,
    token: str = Depends(verify_token)
):
    """Direct semantic search endpoint"""
    try:
        results = await vector_service.semantic_search(query, top_k)
        return {
            "query": query,
            "results": results,
            "total_results": len(results)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
