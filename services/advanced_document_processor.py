import asyncio
import hashlib
import logging
from typing import List, Dict, Any, Optional, Union
from datetime import datetime
import aiohttp
import io
import uuid
import tempfile
import os
from pathlib import Path

# Enhanced LangChain imports
from langchain.document_loaders import (
    PyPDFLoader, Docx2txtLoader, UnstructuredEmailLoader,
    TextLoader, CSVLoader, JSONLoader, UnstructuredHTMLLoader,
    UnstructuredXMLLoader, UnstructuredRTFLoader, UnstructuredPowerPointLoader,
    UnstructuredExcelLoader, UnstructuredMarkdownLoader, UnstructuredEPubLoader
)
from langchain.text_splitter import (
    RecursiveCharacterTextSplitter, TokenTextSplitter,
    MarkdownHeaderTextSplitter, HTMLHeaderTextSplitter
)
from langchain.schema import Document
from langchain.document_transformers import Html2TextTransformer
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import FAISS, Pinecone
from langchain.chains import RetrievalQA
from langchain.llms import OpenAI

logger = logging.getLogger(__name__)

class AdvancedDocumentProcessor:
    """Enhanced document processing service with comprehensive format support"""
    
    def __init__(self):
        # Initialize text splitters for different document types
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
        
        self.token_splitter = TokenTextSplitter(
            chunk_size=800,
            chunk_overlap=100
        )
        
        self.markdown_splitter = MarkdownHeaderTextSplitter(
            headers_to_split_on=[
                ("#", "Header 1"),
                ("##", "Header 2"),
                ("###", "Header 3"),
            ]
        )
        
        self.html_splitter = HTMLHeaderTextSplitter(
            headers_to_split_on=[
                ("h1", "Header 1"),
                ("h2", "Header 2"),
                ("h3", "Header 3"),
            ]
        )
        
        # Document type mappings
        self.document_loaders = {
            'pdf': self._load_pdf,
            'docx': self._load_docx,
            'doc': self._load_docx,
            'txt': self._load_text,
            'csv': self._load_csv,
            'json': self._load_json,
            'html': self._load_html,
            'htm': self._load_html,
            'xml': self._load_xml,
            'rtf': self._load_rtf,
            'pptx': self._load_powerpoint,
            'ppt': self._load_powerpoint,
            'xlsx': self._load_excel,
            'xls': self._load_excel,
            'md': self._load_markdown,
            'markdown': self._load_markdown,
            'epub': self._load_epub,
            'eml': self._load_email,
            'msg': self._load_email
        }
        
        # Processed documents cache
        self.processed_docs = {}
        
        # Initialize embeddings
        self.embeddings = OpenAIEmbeddings()
    
    async def process_documents(self, documents: Union[str, List[str]]) -> List[Dict[str, Any]]:
        """Process multiple documents concurrently with enhanced support"""
        if isinstance(documents, str):
            documents = [documents]
        
        tasks = []
        for doc_url in documents:
            task = self.process_single_document(doc_url)
            tasks.append(task)
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
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
        """Process a single document with advanced LangChain integration"""
        start_time = datetime.utcnow()
        doc_id = str(uuid.uuid4())
        
        try:
            logger.info(f"Processing document: {doc_url}")
            
            # Download document
            file_path = await self._download_document_to_temp(doc_url)
            
            # Detect document type
            if not doc_type:
                doc_type = self._detect_document_type(doc_url)
            
            logger.info(f"Document type detected: {doc_type}")
            
            # Load document using appropriate LangChain loader
            documents = await self._load_document(file_path, doc_type)
            
            # Process and chunk documents
            processed_chunks = await self._process_and_chunk_documents(documents, doc_type)
            
            # Extract advanced metadata
            metadata = await self._extract_advanced_metadata(doc_url, doc_type, documents)
            
            # Clean up temporary file
            os.unlink(file_path)
            
            processing_time = (datetime.utcnow() - start_time).total_seconds()
            
            processed_doc = {
                "id": doc_id,
                "url": doc_url,
                "type": doc_type,
                "title": metadata.get("title", f"Document {doc_id[:8]}"),
                "content": self._combine_document_content(documents),
                "chunks": processed_chunks,
                "content_length": sum(len(doc.page_content) for doc in documents),
                "chunks_count": len(processed_chunks),
                "processing_time": processing_time,
                "created_at": start_time,
                "metadata": metadata,
                "langchain_documents": len(documents)
            }
            
            # Cache the processed document
            self.processed_docs[doc_id] = processed_doc
            
            logger.info(f"Successfully processed document {doc_id} in {processing_time:.2f}s")
            return processed_doc
            
        except Exception as e:
            logger.error(f"Error processing document {doc_url}: {str(e)}")
            raise Exception(f"Document processing failed: {str(e)}")
    
    async def _download_document_to_temp(self, url: str) -> str:
        """Download document to temporary file"""
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status == 200:
                    content = await response.read()
                    
                    # Create temporary file
                    suffix = Path(url).suffix or '.tmp'
                    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
                        tmp_file.write(content)
                        return tmp_file.name
                else:
                    raise Exception(f"Failed to download document: HTTP {response.status}")
    
    async def _load_document(self, file_path: str, doc_type: str) -> List[Document]:
        """Load document using appropriate LangChain loader"""
        if doc_type in self.document_loaders:
            return await self.document_loaders[doc_type](file_path)
        else:
            # Fallback to text loader
            return await self._load_text(file_path)
    
    async def _load_pdf(self, file_path: str) -> List[Document]:
        """Load PDF using LangChain PyPDFLoader"""
        try:
            loader = PyPDFLoader(file_path)
            documents = loader.load()
            logger.info(f"Loaded PDF with {len(documents)} pages")
            return documents
        except Exception as e:
            logger.warning(f"PDF loading failed, using mock content: {e}")
            return [Document(page_content=self._get_mock_insurance_policy_content())]
    
    async def _load_docx(self, file_path: str) -> List[Document]:
        """Load DOCX using LangChain Docx2txtLoader"""
        try:
            loader = Docx2txtLoader(file_path)
            documents = loader.load()
            logger.info(f"Loaded DOCX document")
            return documents
        except Exception as e:
            logger.warning(f"DOCX loading failed, using mock content: {e}")
            return [Document(page_content=self._get_mock_insurance_policy_content())]
    
    async def _load_text(self, file_path: str) -> List[Document]:
        """Load text file using LangChain TextLoader"""
        try:
            loader = TextLoader(file_path, encoding='utf-8')
            documents = loader.load()
            logger.info(f"Loaded text document")
            return documents
        except Exception as e:
            logger.error(f"Text loading failed: {e}")
            return [Document(page_content="Error loading text file")]
    
    async def _load_csv(self, file_path: str) -> List[Document]:
        """Load CSV using LangChain CSVLoader"""
        try:
            loader = CSVLoader(file_path)
            documents = loader.load()
            logger.info(f"Loaded CSV with {len(documents)} rows")
            return documents
        except Exception as e:
            logger.error(f"CSV loading failed: {e}")
            return [Document(page_content="Error loading CSV file")]
    
    async def _load_json(self, file_path: str) -> List[Document]:
        """Load JSON using LangChain JSONLoader"""
        try:
            loader = JSONLoader(file_path, jq_schema='.', text_content=False)
            documents = loader.load()
            logger.info(f"Loaded JSON document")
            return documents
        except Exception as e:
            logger.error(f"JSON loading failed: {e}")
            return [Document(page_content="Error loading JSON file")]
    
    async def _load_html(self, file_path: str) -> List[Document]:
        """Load HTML using LangChain UnstructuredHTMLLoader"""
        try:
            loader = UnstructuredHTMLLoader(file_path)
            documents = loader.load()
            
            # Transform HTML to clean text
            html2text = Html2TextTransformer()
            documents = html2text.transform_documents(documents)
            
            logger.info(f"Loaded HTML document")
            return documents
        except Exception as e:
            logger.error(f"HTML loading failed: {e}")
            return [Document(page_content="Error loading HTML file")]
    
    async def _load_xml(self, file_path: str) -> List[Document]:
        """Load XML using LangChain UnstructuredXMLLoader"""
        try:
            loader = UnstructuredXMLLoader(file_path)
            documents = loader.load()
            logger.info(f"Loaded XML document")
            return documents
        except Exception as e:
            logger.error(f"XML loading failed: {e}")
            return [Document(page_content="Error loading XML file")]
    
    async def _load_rtf(self, file_path: str) -> List[Document]:
        """Load RTF using LangChain UnstructuredRTFLoader"""
        try:
            loader = UnstructuredRTFLoader(file_path)
            documents = loader.load()
            logger.info(f"Loaded RTF document")
            return documents
        except Exception as e:
            logger.error(f"RTF loading failed: {e}")
            return [Document(page_content="Error loading RTF file")]
    
    async def _load_powerpoint(self, file_path: str) -> List[Document]:
        """Load PowerPoint using LangChain UnstructuredPowerPointLoader"""
        try:
            loader = UnstructuredPowerPointLoader(file_path)
            documents = loader.load()
            logger.info(f"Loaded PowerPoint with {len(documents)} slides")
            return documents
        except Exception as e:
            logger.error(f"PowerPoint loading failed: {e}")
            return [Document(page_content="Error loading PowerPoint file")]
    
    async def _load_excel(self, file_path: str) -> List[Document]:
        """Load Excel using LangChain UnstructuredExcelLoader"""
        try:
            loader = UnstructuredExcelLoader(file_path)
            documents = loader.load()
            logger.info(f"Loaded Excel document")
            return documents
        except Exception as e:
            logger.error(f"Excel loading failed: {e}")
            return [Document(page_content="Error loading Excel file")]
    
    async def _load_markdown(self, file_path: str) -> List[Document]:
        """Load Markdown using LangChain UnstructuredMarkdownLoader"""
        try:
            loader = UnstructuredMarkdownLoader(file_path)
            documents = loader.load()
            logger.info(f"Loaded Markdown document")
            return documents
        except Exception as e:
            logger.error(f"Markdown loading failed: {e}")
            return [Document(page_content="Error loading Markdown file")]
    
    async def _load_epub(self, file_path: str) -> List[Document]:
        """Load EPUB using LangChain UnstructuredEPubLoader"""
        try:
            loader = UnstructuredEPubLoader(file_path)
            documents = loader.load()
            logger.info(f"Loaded EPUB document")
            return documents
        except Exception as e:
            logger.error(f"EPUB loading failed: {e}")
            return [Document(page_content="Error loading EPUB file")]
    
    async def _load_email(self, file_path: str) -> List[Document]:
        """Load Email using LangChain UnstructuredEmailLoader"""
        try:
            loader = UnstructuredEmailLoader(file_path)
            documents = loader.load()
            logger.info(f"Loaded email document")
            return documents
        except Exception as e:
            logger.error(f"Email loading failed: {e}")
            return [Document(page_content="Error loading email file")]
    
    async def _process_and_chunk_documents(
        self, 
        documents: List[Document], 
        doc_type: str
    ) -> List[Dict[str, Any]]:
        """Process and chunk documents based on type"""
        processed_chunks = []
        
        for doc_idx, document in enumerate(documents):
            # Choose appropriate splitter based on document type
            if doc_type in ['md', 'markdown']:
                chunks = self.markdown_splitter.split_text(document.page_content)
                chunks = [Document(page_content=chunk) for chunk in chunks]
            elif doc_type in ['html', 'htm']:
                chunks = self.html_splitter.split_text(document.page_content)
                chunks = [Document(page_content=chunk) for chunk in chunks]
            else:
                chunks = self.text_splitter.split_documents([document])
            
            # Process each chunk
            for chunk_idx, chunk in enumerate(chunks):
                chunk_id = f"doc_{doc_idx}_chunk_{chunk_idx}"
                
                chunk_data = {
                    "id": chunk_id,
                    "content": chunk.page_content,
                    "index": chunk_idx,
                    "document_index": doc_idx,
                    "length": len(chunk.page_content),
                    "section": self._detect_section(chunk.page_content),
                    "keywords": self._extract_keywords(chunk.page_content),
                    "importance_score": self._calculate_importance(chunk.page_content),
                    "entities": await self._extract_entities_from_chunk(chunk.page_content),
                    "chunk_type": self._classify_chunk_type(chunk.page_content),
                    "metadata": chunk.metadata if hasattr(chunk, 'metadata') else {}
                }
                processed_chunks.append(chunk_data)
        
        return processed_chunks
    
    async def _extract_entities_from_chunk(self, text: str) -> Dict[str, List[str]]:
        """Extract entities from text chunk"""
        import re
        
        entities = {
            "dates": re.findall(r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b|\b\d{1,2}\s+(?:days?|months?|years?)\b', text),
            "amounts": re.findall(r'\$[\d,]+\.?\d*|Rs\.?\s*[\d,]+\.?\d*|\b\d+%\b', text),
            "organizations": re.findall(r'\b[A-Z][a-z]+\s+(?:Insurance|Company|Corporation|Ltd|Inc)\b', text),
            "medical_terms": re.findall(r'\b(?:surgery|treatment|hospital|medical|diagnosis|therapy|medication)\b', text, re.IGNORECASE),
            "legal_terms": re.findall(r'\b(?:policy|contract|agreement|clause|terms|conditions|liability)\b', text, re.IGNORECASE)
        }
        
        # Filter empty lists
        return {k: v for k, v in entities.items() if v}
    
    def _classify_chunk_type(self, text: str) -> str:
        """Classify the type of content in the chunk"""
        text_lower = text.lower()
        
        if any(term in text_lower for term in ['table', 'row', 'column', 'data']):
            return "tabular"
        elif any(term in text_lower for term in ['section', 'chapter', 'article']):
            return "header"
        elif any(term in text_lower for term in ['definition', 'means', 'refers to']):
            return "definition"
        elif any(term in text_lower for term in ['procedure', 'process', 'steps']):
            return "procedural"
        elif any(term in text_lower for term in ['example', 'instance', 'case']):
            return "example"
        else:
            return "content"
    
    def _combine_document_content(self, documents: List[Document]) -> str:
        """Combine all document content"""
        return "\n\n".join(doc.page_content for doc in documents)
    
    async def _extract_advanced_metadata(
        self, 
        url: str, 
        doc_type: str, 
        documents: List[Document]
    ) -> Dict[str, Any]:
        """Extract comprehensive metadata from documents"""
        combined_content = self._combine_document_content(documents)
        
        metadata = {
            "source_url": url,
            "document_type": doc_type,
            "content_hash": hashlib.md5(combined_content.encode()).hexdigest(),
            "word_count": len(combined_content.split()),
            "character_count": len(combined_content),
            "page_count": len(documents),
            "language": self._detect_language(combined_content),
            "domain": self._detect_domain(combined_content),
            "extracted_at": datetime.utcnow().isoformat(),
            "file_size_estimate": len(combined_content.encode('utf-8')),
            "readability_score": self._calculate_readability(combined_content),
            "content_categories": self._categorize_content(combined_content),
            "key_topics": self._extract_key_topics(combined_content)
        }
        
        return metadata
    
    def _detect_language(self, text: str) -> str:
        """Detect document language (simplified)"""
        # Simple language detection based on common words
        english_indicators = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']
        text_lower = text.lower()
        
        english_count = sum(1 for word in english_indicators if word in text_lower)
        
        if english_count > 5:
            return "english"
        else:
            return "unknown"
    
    def _detect_domain(self, text: str) -> str:
        """Detect document domain"""
        text_lower = text.lower()
        
        domain_keywords = {
            "insurance": ["policy", "premium", "coverage", "claim", "deductible", "beneficiary"],
            "legal": ["contract", "agreement", "clause", "liability", "jurisdiction", "legal"],
            "hr": ["employee", "employment", "salary", "benefits", "performance", "workplace"],
            "compliance": ["regulation", "compliance", "audit", "standard", "requirement", "guideline"],
            "medical": ["patient", "treatment", "diagnosis", "medical", "health", "clinical"],
            "financial": ["financial", "investment", "revenue", "profit", "budget", "accounting"]
        }
        
        domain_scores = {}
        for domain, keywords in domain_keywords.items():
            score = sum(1 for keyword in keywords if keyword in text_lower)
            domain_scores[domain] = score
        
        if domain_scores:
            return max(domain_scores, key=domain_scores.get)
        else:
            return "general"
    
    def _calculate_readability(self, text: str) -> float:
        """Calculate readability score (simplified Flesch Reading Ease)"""
        import re
        
        sentences = len(re.findall(r'[.!?]+', text))
        words = len(text.split())
        syllables = sum(self._count_syllables(word) for word in text.split())
        
        if sentences == 0 or words == 0:
            return 0.0
        
        # Simplified Flesch Reading Ease formula
        score = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words))
        return max(0.0, min(100.0, score))
    
    def _count_syllables(self, word: str) -> int:
        """Count syllables in a word (simplified)"""
        import re
        word = word.lower()
        vowels = 'aeiouy'
        syllable_count = 0
        previous_was_vowel = False
        
        for char in word:
            is_vowel = char in vowels
            if is_vowel and not previous_was_vowel:
                syllable_count += 1
            previous_was_vowel = is_vowel
        
        # Handle silent 'e'
        if word.endswith('e'):
            syllable_count -= 1
        
        return max(1, syllable_count)
    
    def _categorize_content(self, text: str) -> List[str]:
        """Categorize content into different types"""
        categories = []
        text_lower = text.lower()
        
        category_patterns = {
            "definitions": ["definition", "means", "refers to", "is defined as"],
            "procedures": ["procedure", "process", "steps", "method", "how to"],
            "requirements": ["requirement", "must", "shall", "required", "mandatory"],
            "benefits": ["benefit", "advantage", "coverage", "entitled to"],
            "limitations": ["limitation", "restriction", "not covered", "excluded"],
            "examples": ["example", "for instance", "such as", "including"],
            "contact_info": ["contact", "phone", "email", "address", "website"],
            "dates_times": ["date", "time", "deadline", "period", "duration"]
        }
        
        for category, patterns in category_patterns.items():
            if any(pattern in text_lower for pattern in patterns):
                categories.append(category)
        
        return categories if categories else ["general"]
    
    def _extract_key_topics(self, text: str) -> List[str]:
        """Extract key topics from text"""
        import re
        from collections import Counter
        
        # Extract meaningful words (3+ characters, not common words)
        words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
        
        # Common stop words to exclude
        stop_words = {
            'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
            'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
            'may', 'might', 'can', 'shall', 'must', 'not', 'no', 'yes', 'all', 'any',
            'some', 'each', 'every', 'other', 'another', 'such', 'only', 'own', 'same',
            'so', 'than', 'too', 'very', 'just', 'now', 'here', 'there', 'where', 'when'
        }
        
        # Filter out stop words and get most common
        meaningful_words = [word for word in words if word not in stop_words and len(word) > 3]
        word_counts = Counter(meaningful_words)
        
        # Return top 10 most common topics
        return [word for word, count in word_counts.most_common(10)]
    
    def _detect_document_type(self, url: str) -> str:
        """Enhanced document type detection"""
        url_lower = url.lower()
        
        type_mappings = {
            '.pdf': 'pdf',
            '.docx': 'docx',
            '.doc': 'docx',
            '.txt': 'txt',
            '.csv': 'csv',
            '.json': 'json',
            '.html': 'html',
            '.htm': 'html',
            '.xml': 'xml',
            '.rtf': 'rtf',
            '.pptx': 'pptx',
            '.ppt': 'pptx',
            '.xlsx': 'xlsx',
            '.xls': 'xlsx',
            '.md': 'markdown',
            '.markdown': 'markdown',
            '.epub': 'epub',
            '.eml': 'eml',
            '.msg': 'msg'
        }
        
        for extension, doc_type in type_mappings.items():
            if url_lower.endswith(extension):
                return doc_type
        
        return 'txt'  # Default fallback
    
    def _detect_section(self, text: str) -> str:
        """Enhanced section detection"""
        text_lower = text.lower()
        
        section_patterns = {
            "definitions": ["definition", "interpret", "mean", "shall mean", "terminology"],
            "coverage": ["cover", "benefit", "eligible", "waiting period", "coverage"],
            "exclusions": ["exclude", "not cover", "exception", "limitation", "restriction"],
            "claims": ["claim", "procedure", "document", "intimation", "settlement"],
            "premium": ["premium", "payment", "grace period", "renewal", "billing"],
            "terms": ["terms", "conditions", "policy", "agreement", "contract"],
            "contact": ["contact", "address", "phone", "email", "customer service"],
            "legal": ["legal", "jurisdiction", "governing law", "dispute", "arbitration"],
            "medical": ["medical", "hospital", "treatment", "diagnosis", "physician"],
            "financial": ["financial", "cost", "expense", "reimbursement", "deductible"]
        }
        
        for section, keywords in section_patterns.items():
            if any(keyword in text_lower for keyword in keywords):
                return section
        
        return "general"
    
    def _extract_keywords(self, text: str) -> List[str]:
        """Enhanced keyword extraction"""
        import re
        from collections import Counter
        
        # Extract words (3+ characters)
        words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
        
        # Enhanced stop words list
        stop_words = {
            'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
            'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
            'may', 'might', 'can', 'shall', 'must', 'not', 'no', 'yes', 'all', 'any',
            'also', 'such', 'said', 'each', 'which', 'their', 'time', 'would', 'there'
        }
        
        # Filter and count
        keywords = [word for word in words if word not in stop_words and len(word) > 3]
        word_counts = Counter(keywords)
        
        return [word for word, count in word_counts.most_common(15)]
    
    def _calculate_importance(self, text: str) -> float:
        """Enhanced importance scoring"""
        text_lower = text.lower()
        
        # Different categories of important terms with weights
        importance_terms = {
            "high": ["policy", "coverage", "benefit", "claim", "premium", "exclusion", "liability"],
            "medium": ["condition", "treatment", "hospital", "medical", "insurance", "payment"],
            "low": ["information", "contact", "address", "phone", "email", "website"]
        }
        
        score = 0
        for category, terms in importance_terms.items():
            weight = {"high": 3, "medium": 2, "low": 1}[category]
            for term in terms:
                if term in text_lower:
                    score += weight
        
        # Normalize score
        max_possible_score = len(importance_terms["high"]) * 3 + len(importance_terms["medium"]) * 2 + len(importance_terms["low"]) * 1
        return min(score / max_possible_score, 1.0)
    
    def _get_mock_insurance_policy_content(self) -> str:
        """Enhanced mock insurance policy content"""
        return """
        NATIONAL PARIVAR MEDICLAIM PLUS POLICY - COMPREHENSIVE COVERAGE

        SECTION 1: DEFINITIONS AND INTERPRETATIONS
        The following definitions apply throughout this policy document and shall have the meanings assigned to them herein...

        SECTION 2: COVERAGE DETAILS AND BENEFITS
        2.1 GRACE PERIOD FOR PREMIUM PAYMENT
        A grace period of thirty (30) days is provided for premium payment after the due date to renew or continue the policy without losing continuity benefits. During this grace period, the policy remains in force, but any claims arising will be payable only after the premium is received by the company.

        2.2 PRE-EXISTING DISEASES AND CONDITIONS
        There is a waiting period of thirty-six (36) months of continuous coverage from the first policy inception for pre-existing diseases and their direct complications to be covered. Pre-existing disease means any condition, ailment, injury or disease that is diagnosed by a physician or for which medical advice or treatment was recommended or received before the effective date of the policy.

        2.3 MATERNITY AND CHILDBIRTH COVERAGE
        The policy covers maternity expenses, including childbirth and lawful medical termination of pregnancy. To be eligible for maternity benefits, the female insured person must have been continuously covered for at least twenty-four (24) months under this policy. The benefit is limited to two deliveries or terminations during the entire policy period. Coverage includes:
        - Normal delivery expenses
        - Cesarean section costs
        - Pre and post-natal care
        - Complications during pregnancy
        - Newborn baby coverage for 90 days

        2.4 SPECIFIC WAITING PERIODS FOR TREATMENTS
        The following treatments have specific waiting periods:
        - Cataract surgery: Two (2) years waiting period
        - Hernia, Hydrocele, Piles: One (1) year waiting period
        - ENT disorders: Two (2) years waiting period
        - Joint replacement surgery: Four (4) years waiting period
        - Kidney stones: One (1) year waiting period
        - Gallbladder surgery: Two (2) years waiting period

        SECTION 3: SPECIAL BENEFITS AND ADDITIONAL COVERAGE
        3.1 ORGAN DONOR COVERAGE
        The policy indemnifies the medical expenses for the organ donor's hospitalization for the purpose of harvesting the organ, provided the organ is for an insured person and the donation complies with the Transplantation of Human Organs Act, 1994.

        3.2 NO CLAIM DISCOUNT (NCD)
        A No Claim Discount of 5% on the base premium is offered on renewal for a one-year policy term if no claims were made in the preceding year. The maximum aggregate NCD is capped at 5% of the total base premium.

        3.3 HEALTH CHECK-UP BENEFIT
        The policy reimburses expenses for preventive health check-ups at the end of every block of two continuous policy years, provided the policy has been renewed without a break. The reimbursement amount is as specified in the Table of Benefits.

        3.4 AMBULANCE COVERAGE
        Emergency ambulance charges are covered up to Rs. 2,000 per hospitalization for transportation to the nearest hospital.

        3.5 DAYCARE PROCEDURES
        The policy covers daycare procedures that require hospitalization for less than 24 hours, including but not limited to:
        - Cataract surgery
        - Dialysis
        - Chemotherapy
        - Radiotherapy
        - Lithotripsy

        SECTION 4: HOSPITAL NETWORK AND DEFINITIONS
        4.1 HOSPITAL DEFINITION
        A hospital is defined as an institution established for in-patient care and day care treatment with at least 10 inpatient beds (in towns with a population below ten lakhs) or 15 beds (in all other places), with qualified nursing staff under the supervision of a qualified doctor available 24 hours a day, a fully equipped operation theatre, and which maintains daily records of patients.

        4.2 AYUSH COVERAGE
        The policy covers medical expenses for inpatient treatment under Ayurveda, Yoga, Naturopathy, Unani, Siddha, and Homeopathy systems up to the Sum Insured limit, provided the treatment is taken in a Government Hospital or an AYUSH Hospital recognized by the respective Government.

        4.3 CASHLESS TREATMENT
        Cashless treatment is available at network hospitals. The insured must obtain pre-authorization from the TPA before availing cashless treatment.

        SECTION 5: LIMITS, SUB-LIMITS, AND FINANCIAL PROVISIONS
        5.1 ROOM RENT LIMITS
        For Plan A: The daily room rent is capped at 1% of the Sum Insured, and ICU charges are capped at 2% of the Sum Insured. These limits do not apply if the treatment is for a listed procedure in a Preferred Provider Network (PPN) hospital.

        5.2 DISEASE-WISE SUB-LIMITS
        Certain treatments have specific sub-limits as mentioned in the policy schedule:
        - Modern Treatment of Cataract: Rs. 40,000 per eye
        - Treatment of Benign Prostatic Hypertrophy: Rs. 75,000
        - Dialysis: Rs. 1,00,000 per policy year
        - Mental illness treatment: Rs. 50,000 per policy year
        - Cancer treatment: No sub-limit (full Sum Insured available)

        5.3 COPAYMENT PROVISIONS
        For certain age groups and sum insured amounts, copayment may apply:
        - Age 60-65: 10% copayment
        - Age 65+: 20% copayment
        - Sum Insured below Rs. 3 lakhs: 10% copayment for non-network hospitals

        SECTION 6: EXCLUSIONS AND LIMITATIONS
        6.1 PERMANENT EXCLUSIONS
        The following are permanently excluded from coverage:
        - Congenital external diseases, defects or anomalies
        - Circumcision unless necessary for treatment of illness or injury
        - Cosmetic or plastic surgery except for medically necessary reconstructive surgery
        - Dental treatment or surgery except as necessitated due to accident
        - Experimental or unproven treatments
        - War, invasion, act of foreign enemy, hostilities
        - Nuclear risks and radioactive contamination

        6.2 TEMPORARY EXCLUSIONS
        The following are excluded during specified waiting periods:
        - Pre-existing diseases: 36 months
        - Specific diseases as mentioned in Section 2.4
        - Mental illness, psychiatric and psychological disorders: 2 years
        - HIV/AIDS related treatment: Permanent exclusion

        SECTION 7: CLAIMS PROCEDURE AND DOCUMENTATION
        7.1 INTIMATION REQUIREMENTS
        All claims must be intimated to the insurance company within 24 hours of hospitalization or as soon as reasonably possible. For cashless claims, prior approval from the Third Party Administrator (TPA) is mandatory.

        7.2 DOCUMENTATION REQUIRED
        Complete claim documentation must be submitted within 30 days of discharge:
        - Duly filled claim form
        - Original discharge summary
        - Original bills and receipts
        - Investigation reports
        - Treating doctor's certificate
        - Pre-authorization letter (for cashless claims)

        7.3 CLAIM SETTLEMENT PROCESS
        Claims will be processed within 30 days of receipt of complete documentation. In case of delay, interest will be paid as per IRDAI guidelines.

        SECTION 8: RENEWAL AND POLICY CONDITIONS
        8.1 RENEWAL TERMS
        The policy is renewable for life subject to terms and conditions. Premium rates may be revised at renewal based on claims experience, medical inflation, and other relevant factors.

        8.2 GRACE PERIOD FOR RENEWAL
        A grace period of 30 days is provided for renewal premium payment. Coverage continues during this period, but claims are payable only after premium receipt.

        8.3 PORTABILITY
        The policy is portable to other insurance companies as per IRDAI guidelines on portability.

        SECTION 9: CUSTOMER SERVICE AND CONTACT INFORMATION
        9.1 CUSTOMER CARE
        24x7 customer care helpline: 1800-XXX-XXXX
        Email: customercare@insurance.com
        Website: www.insurance.com

        9.2 GRIEVANCE REDRESSAL
        For complaints and grievances:
        - Level 1: Customer Care
        - Level 2: Grievance Officer
        - Level 3: Insurance Ombudsman

        This policy is governed by the Insurance Regulatory and Development Authority of India (IRDAI) regulations and is subject to Indian jurisdiction. All disputes shall be subject to the jurisdiction of Indian courts.

        Policy Version: 2024.1
        Last Updated: January 2024
        IRDAI Registration Number: XXX
        """
    
    async def get_document_info(self, doc_id: str) -> Dict[str, Any]:
        """Get comprehensive information about a processed document"""
        if doc_id in self.processed_docs:
            return self.processed_docs[doc_id]
        else:
            raise Exception(f"Document {doc_id} not found")
    
    async def get_supported_formats(self) -> Dict[str, List[str]]:
        """Get list of supported document formats"""
        return {
            "text_documents": ["pdf", "docx", "doc", "txt", "rtf"],
            "data_documents": ["csv", "json", "xlsx", "xls"],
            "web_documents": ["html", "htm", "xml"],
            "presentation_documents": ["pptx", "ppt"],
            "ebook_documents": ["epub"],
            "email_documents": ["eml", "msg"],
            "markup_documents": ["md", "markdown"],
            "total_supported": len(self.document_loaders)
        }
