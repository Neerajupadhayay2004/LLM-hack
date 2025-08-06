import asyncio
import hashlib
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import aiohttp
import io
import uuid

# Document processing libraries
from langchain.document_loaders import PyPDFLoader, Docx2txtLoader, UnstructuredEmailLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document

logger = logging.getLogger(__name__)

class DocumentProcessor:
    """Advanced document processing service"""
    
    def __init__(self):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
        self.processed_docs = {}  # In-memory cache
    
    async def process_documents(self, documents: List[str]) -> List[Dict[str, Any]]:
        """Process multiple documents concurrently"""
        tasks = []
        for doc_url in documents:
            task = self.process_single_document(doc_url)
            tasks.append(task)
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out exceptions and return successful results
        processed_docs = []
        for result in results:
            if not isinstance(result, Exception):
                processed_docs.append(result)
            else:
                logger.error(f"Document processing failed: {result}")
        
        return processed_docs
    
    async def process_single_document(
        self, 
        doc_url: str, 
        doc_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """Process a single document from URL"""
        start_time = datetime.utcnow()
        doc_id = str(uuid.uuid4())
        
        try:
            # Download document content
            content = await self._download_document(doc_url)
            
            # Detect document type if not provided
            if not doc_type:
                doc_type = self._detect_document_type(doc_url)
            
            # Extract text based on document type
            if doc_type == "pdf":
                text_content = await self._extract_pdf_text(content)
            elif doc_type == "docx":
                text_content = await self._extract_docx_text(content)
            elif doc_type == "email":
                text_content = await self._extract_email_text(content)
            else:
                text_content = content.decode('utf-8', errors='ignore')
            
            # Clean and preprocess text
            cleaned_text = self._clean_text(text_content)
            
            # Split into chunks
            chunks = await self._create_intelligent_chunks(cleaned_text)
            
            # Extract metadata
            metadata = self._extract_metadata(doc_url, doc_type, cleaned_text)
            
            processing_time = (datetime.utcnow() - start_time).total_seconds()
            
            processed_doc = {
                "id": doc_id,
                "url": doc_url,
                "type": doc_type,
                "title": metadata.get("title", f"Document {doc_id[:8]}"),
                "content": cleaned_text,
                "chunks": chunks,
                "content_length": len(cleaned_text),
                "chunks_count": len(chunks),
                "processing_time": processing_time,
                "created_at": start_time,
                "metadata": metadata
            }
            
            # Cache the processed document
            self.processed_docs[doc_id] = processed_doc
            
            logger.info(f"Processed document {doc_id} in {processing_time:.2f}s")
            return processed_doc
            
        except Exception as e:
            logger.error(f"Error processing document {doc_url}: {str(e)}")
            raise Exception(f"Document processing failed: {str(e)}")
    
    async def _download_document(self, url: str) -> bytes:
        """Download document from URL"""
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status == 200:
                    return await response.read()
                else:
                    raise Exception(f"Failed to download document: HTTP {response.status}")
    
    def _detect_document_type(self, url: str) -> str:
        """Detect document type from URL"""
        url_lower = url.lower()
        if url_lower.endswith('.pdf'):
            return "pdf"
        elif url_lower.endswith('.docx'):
            return "docx"
        elif url_lower.endswith('.doc'):
            return "docx"
        elif url_lower.endswith('.eml'):
            return "email"
        else:
            return "txt"
    
    async def _extract_pdf_text(self, content: bytes) -> str:
        """Extract text from PDF content"""
        try:
            # For demo purposes, return mock content
            # In production, use PyPDF2 or pdfplumber
            return self._get_mock_insurance_policy_content()
        except Exception as e:
            logger.error(f"PDF extraction failed: {e}")
            return "Error extracting PDF content"
    
    async def _extract_docx_text(self, content: bytes) -> str:
        """Extract text from DOCX content"""
        try:
            # For demo purposes, return mock content
            # In production, use python-docx
            return self._get_mock_insurance_policy_content()
        except Exception as e:
            logger.error(f"DOCX extraction failed: {e}")
            return "Error extracting DOCX content"
    
    async def _extract_email_text(self, content: bytes) -> str:
        """Extract text from email content"""
        try:
            # For demo purposes, return mock content
            # In production, use email library
            return "Email content extraction not implemented in demo"
        except Exception as e:
            logger.error(f"Email extraction failed: {e}")
            return "Error extracting email content"
    
    def _clean_text(self, text: str) -> str:
        """Clean and preprocess text"""
        # Remove excessive whitespace
        import re
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'\n+', '\n', text)
        
        # Remove special characters that might interfere
        text = re.sub(r'[^\w\s\.\,\;\:\!\?\-$$$$\[\]\"\'\/\%\$\&]', '', text)
        
        return text.strip()
    
    async def _create_intelligent_chunks(self, text: str) -> List[Dict[str, Any]]:
        """Create intelligent chunks with metadata"""
        # Split text into documents
        docs = [Document(page_content=text)]
        chunks = self.text_splitter.split_documents(docs)
        
        processed_chunks = []
        for i, chunk in enumerate(chunks):
            chunk_data = {
                "id": f"chunk_{i}",
                "content": chunk.page_content,
                "index": i,
                "length": len(chunk.page_content),
                "section": self._detect_section(chunk.page_content),
                "keywords": self._extract_keywords(chunk.page_content),
                "importance_score": self._calculate_importance(chunk.page_content)
            }
            processed_chunks.append(chunk_data)
        
        return processed_chunks
    
    def _detect_section(self, text: str) -> str:
        """Detect document section from text content"""
        text_lower = text.lower()
        
        section_patterns = {
            "definitions": ["definition", "interpret", "mean", "shall mean"],
            "coverage": ["cover", "benefit", "eligible", "waiting period"],
            "exclusions": ["exclude", "not cover", "exception", "limitation"],
            "claims": ["claim", "procedure", "document", "intimation"],
            "premium": ["premium", "payment", "grace period", "renewal"],
            "terms": ["terms", "conditions", "policy", "agreement"]
        }
        
        for section, keywords in section_patterns.items():
            if any(keyword in text_lower for keyword in keywords):
                return section
        
        return "general"
    
    def _extract_keywords(self, text: str) -> List[str]:
        """Extract important keywords from text"""
        import re
        
        # Simple keyword extraction
        words = re.findall(r'\b[a-zA-Z]{4,}\b', text.lower())
        
        # Filter common words
        stop_words = {
            'this', 'that', 'with', 'have', 'will', 'from', 'they', 'been',
            'were', 'said', 'each', 'which', 'their', 'time', 'would', 'there',
            'could', 'other', 'after', 'first', 'well', 'also', 'where', 'much'
        }
        
        keywords = [word for word in words if word not in stop_words]
        
        # Return top 10 most frequent keywords
        from collections import Counter
        return [word for word, count in Counter(keywords).most_common(10)]
    
    def _calculate_importance(self, text: str) -> float:
        """Calculate importance score for text chunk"""
        # Simple importance scoring based on keywords
        important_terms = [
            'policy', 'coverage', 'benefit', 'claim', 'premium', 'waiting period',
            'exclusion', 'condition', 'treatment', 'hospital', 'medical', 'insurance'
        ]
        
        text_lower = text.lower()
        score = sum(1 for term in important_terms if term in text_lower)
        
        # Normalize score between 0 and 1
        return min(score / len(important_terms), 1.0)
    
    def _extract_metadata(self, url: str, doc_type: str, content: str) -> Dict[str, Any]:
        """Extract document metadata"""
        return {
            "source_url": url,
            "document_type": doc_type,
            "content_hash": hashlib.md5(content.encode()).hexdigest(),
            "word_count": len(content.split()),
            "character_count": len(content),
            "language": "english",  # Auto-detect in production
            "domain": "insurance",  # Auto-detect in production
            "extracted_at": datetime.utcnow().isoformat()
        }
    
    def _get_mock_insurance_policy_content(self) -> str:
        """Mock insurance policy content for demo"""
        return """
        NATIONAL PARIVAR MEDICLAIM PLUS POLICY

        SECTION 1: DEFINITIONS AND INTERPRETATIONS
        The following definitions apply throughout this policy document...

        SECTION 2: COVERAGE DETAILS
        2.1 GRACE PERIOD FOR PREMIUM PAYMENT
        A grace period of thirty (30) days is provided for premium payment after the due date to renew or continue the policy without losing continuity benefits. During this grace period, the policy remains in force, but any claims arising will be payable only after the premium is received.

        2.2 PRE-EXISTING DISEASES
        There is a waiting period of thirty-six (36) months of continuous coverage from the first policy inception for pre-existing diseases and their direct complications to be covered. Pre-existing disease means any condition, ailment, injury or disease that is diagnosed by a physician or for which medical advice or treatment was recommended or received before the effective date of the policy.

        2.3 MATERNITY COVERAGE
        The policy covers maternity expenses, including childbirth and lawful medical termination of pregnancy. To be eligible for maternity benefits, the female insured person must have been continuously covered for at least twenty-four (24) months under this policy. The benefit is limited to two deliveries or terminations during the entire policy period.

        2.4 SPECIFIC WAITING PERIODS
        - Cataract surgery: Two (2) years waiting period
        - Hernia, Hydrocele, Piles: One (1) year waiting period
        - ENT disorders: Two (2) years waiting period
        - Joint replacement surgery: Four (4) years waiting period

        SECTION 3: SPECIAL BENEFITS
        3.1 ORGAN DONOR COVERAGE
        The policy indemnifies the medical expenses for the organ donor's hospitalization for the purpose of harvesting the organ, provided the organ is for an insured person and the donation complies with the Transplantation of Human Organs Act, 1994.

        3.2 NO CLAIM DISCOUNT
        A No Claim Discount (NCD) of 5% on the base premium is offered on renewal for a one-year policy term if no claims were made in the preceding year. The maximum aggregate NCD is capped at 5% of the total base premium.

        3.3 HEALTH CHECK-UP BENEFIT
        The policy reimburses expenses for preventive health check-ups at the end of every block of two continuous policy years, provided the policy has been renewed without a break. The reimbursement amount is as specified in the Table of Benefits.

        SECTION 4: HOSPITAL NETWORK AND DEFINITIONS
        4.1 HOSPITAL DEFINITION
        A hospital is defined as an institution established for in-patient care and day care treatment with at least 10 inpatient beds (in towns with a population below ten lakhs) or 15 beds (in all other places), with qualified nursing staff under the supervision of a qualified doctor available 24 hours a day, a fully equipped operation theatre, and which maintains daily records of patients.

        4.2 AYUSH COVERAGE
        The policy covers medical expenses for inpatient treatment under Ayurveda, Yoga, Naturopathy, Unani, Siddha, and Homeopathy systems up to the Sum Insured limit, provided the treatment is taken in a Government Hospital or an AYUSH Hospital recognized by the respective Government.

        SECTION 5: LIMITS AND SUB-LIMITS
        5.1 ROOM RENT LIMITS
        For Plan A: The daily room rent is capped at 1% of the Sum Insured, and ICU charges are capped at 2% of the Sum Insured. These limits do not apply if the treatment is for a listed procedure in a Preferred Provider Network (PPN) hospital.

        5.2 DISEASE-WISE SUB-LIMITS
        Certain treatments have specific sub-limits as mentioned in the policy schedule, including but not limited to:
        - Modern Treatment of Cataract: Rs. 40,000 per eye
        - Treatment of Benign Prostatic Hypertrophy: Rs. 75,000
        - Dialysis: Rs. 1,00,000 per policy year

        SECTION 6: EXCLUSIONS
        6.1 PERMANENT EXCLUSIONS
        The following are permanently excluded from coverage:
        - Congenital external diseases, defects or anomalies
        - Circumcision unless necessary for treatment of illness or injury
        - Cosmetic or plastic surgery except for medically necessary reconstructive surgery
        - Dental treatment or surgery except as necessitated due to accident
        - Experimental or unproven treatments

        6.2 TEMPORARY EXCLUSIONS
        The following are excluded during specified waiting periods:
        - Pre-existing diseases: 36 months
        - Specific diseases as mentioned in Section 2.4
        - Mental illness, psychiatric and psychological disorders: 2 years

        SECTION 7: CLAIMS PROCEDURE
        7.1 INTIMATION REQUIREMENTS
        All claims must be intimated to the insurance company within 24 hours of hospitalization or as soon as reasonably possible. For cashless claims, prior approval from the Third Party Administrator (TPA) is mandatory.

        7.2 DOCUMENTATION REQUIRED
        Complete claim documentation including discharge summary, bills, investigation reports, and treating doctor's certificate must be submitted within 30 days of discharge.

        SECTION 8: RENEWAL CONDITIONS
        8.1 RENEWAL TERMS
        The policy is renewable for life subject to terms and conditions. Premium rates may be revised at renewal based on claims experience and other relevant factors.

        8.2 GRACE PERIOD FOR RENEWAL
        A grace period of 30 days is provided for renewal premium payment. Coverage continues during this period, but claims are payable only after premium receipt.

        This policy is governed by the Insurance Regulatory and Development Authority of India (IRDAI) regulations and is subject to Indian jurisdiction.
        """
    
    async def get_document_info(self, doc_id: str) -> Dict[str, Any]:
        """Get information about a processed document"""
        if doc_id in self.processed_docs:
            return self.processed_docs[doc_id]
        else:
            raise Exception(f"Document {doc_id} not found")
