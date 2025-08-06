import asyncio
import logging
from typing import List, Dict, Any, Optional
import numpy as np
from datetime import datetime
import uuid

# Vector search libraries
import pinecone
from sentence_transformers import SentenceTransformer
import faiss

from config.settings import get_settings

logger = logging.getLogger(__name__)

class VectorSearchService:
    """Advanced vector search service with Pinecone and FAISS support"""
    
    def __init__(self):
        self.settings = get_settings()
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.dimension = 384  # Dimension for all-MiniLM-L6-v2
        
        # Initialize Pinecone
        self._init_pinecone()
        
        # Initialize FAISS as fallback
        self._init_faiss()
        
        # Document storage
        self.document_store = {}
        self.chunk_metadata = {}
    
    def _init_pinecone(self):
        """Initialize Pinecone vector database"""
        try:
            pinecone.init(
                api_key=self.settings.PINECONE_API_KEY,
                environment=self.settings.PINECONE_ENVIRONMENT
            )
            
            # Create index if it doesn't exist
            index_name = self.settings.PINECONE_INDEX_NAME
            if index_name not in pinecone.list_indexes():
                pinecone.create_index(
                    name=index_name,
                    dimension=self.dimension,
                    metric="cosine"
                )
            
            self.pinecone_index = pinecone.Index(index_name)
            self.use_pinecone = True
            logger.info("Pinecone initialized successfully")
            
        except Exception as e:
            logger.warning(f"Pinecone initialization failed: {e}. Using FAISS fallback.")
            self.use_pinecone = False
    
    def _init_faiss(self):
        """Initialize FAISS as fallback vector database"""
        try:
            # Create FAISS index
            self.faiss_index = faiss.IndexFlatIP(self.dimension)  # Inner product for cosine similarity
            self.faiss_id_map = {}  # Map FAISS IDs to chunk IDs
            self.faiss_counter = 0
            logger.info("FAISS initialized successfully")
            
        except Exception as e:
            logger.error(f"FAISS initialization failed: {e}")
            raise Exception("Vector search initialization failed")
    
    async def store_document_embeddings(self, processed_docs: List[Dict[str, Any]]):
        """Store document embeddings in vector database"""
        try:
            all_vectors = []
            all_metadata = []
            
            for doc in processed_docs:
                doc_id = doc["id"]
                self.document_store[doc_id] = doc
                
                # Process each chunk
                for chunk in doc["chunks"]:
                    chunk_id = f"{doc_id}_{chunk['id']}"
                    
                    # Generate embedding
                    embedding = self.embedding_model.encode(chunk["content"])
                    
                    # Normalize for cosine similarity
                    embedding = embedding / np.linalg.norm(embedding)
                    
                    # Prepare metadata
                    metadata = {
                        "chunk_id": chunk_id,
                        "document_id": doc_id,
                        "content": chunk["content"],
                        "section": chunk.get("section", "general"),
                        "keywords": chunk.get("keywords", []),
                        "importance_score": chunk.get("importance_score", 0.5),
                        "document_title": doc.get("title", ""),
                        "document_type": doc.get("type", ""),
                        "created_at": datetime.utcnow().isoformat()
                    }
                    
                    self.chunk_metadata[chunk_id] = metadata
                    
                    if self.use_pinecone:
                        # Store in Pinecone
                        vector_data = {
                            "id": chunk_id,
                            "values": embedding.tolist(),
                            "metadata": metadata
                        }
                        all_vectors.append(vector_data)
                    else:
                        # Store in FAISS
                        self.faiss_index.add(np.array([embedding]))
                        self.faiss_id_map[self.faiss_counter] = chunk_id
                        self.faiss_counter += 1
            
            if self.use_pinecone and all_vectors:
                # Batch upsert to Pinecone
                self.pinecone_index.upsert(vectors=all_vectors)
                logger.info(f"Stored {len(all_vectors)} vectors in Pinecone")
            else:
                logger.info(f"Stored {len(all_vectors)} vectors in FAISS")
                
        except Exception as e:
            logger.error(f"Error storing embeddings: {e}")
            raise Exception(f"Failed to store document embeddings: {str(e)}")
    
    async def semantic_search(
        self, 
        query: str, 
        top_k: int = 5, 
        similarity_threshold: float = 0.7,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Perform semantic search for relevant chunks"""
        try:
            # Generate query embedding
            query_embedding = self.embedding_model.encode(query)
            query_embedding = query_embedding / np.linalg.norm(query_embedding)
            
            if self.use_pinecone:
                return await self._search_pinecone(
                    query_embedding, query, top_k, similarity_threshold, filters
                )
            else:
                return await self._search_faiss(
                    query_embedding, query, top_k, similarity_threshold
                )
                
        except Exception as e:
            logger.error(f"Search error: {e}")
            raise Exception(f"Semantic search failed: {str(e)}")
    
    async def _search_pinecone(
        self, 
        query_embedding: np.ndarray, 
        query: str,
        top_k: int, 
        similarity_threshold: float,
        filters: Optional[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Search using Pinecone"""
        try:
            # Prepare search request
            search_kwargs = {
                "vector": query_embedding.tolist(),
                "top_k": top_k,
                "include_metadata": True
            }
            
            if filters:
                search_kwargs["filter"] = filters
            
            # Perform search
            results = self.pinecone_index.query(**search_kwargs)
            
            # Process results
            search_results = []
            for match in results["matches"]:
                if match["score"] >= similarity_threshold:
                    result = {
                        "chunk_id": match["id"],
                        "content": match["metadata"]["content"],
                        "similarity_score": float(match["score"]),
                        "document_id": match["metadata"]["document_id"],
                        "section": match["metadata"].get("section", "general"),
                        "keywords": match["metadata"].get("keywords", []),
                        "importance_score": match["metadata"].get("importance_score", 0.5),
                        "document_title": match["metadata"].get("document_title", ""),
                        "metadata": match["metadata"]
                    }
                    search_results.append(result)
            
            logger.info(f"Pinecone search returned {len(search_results)} results for query: {query}")
            return search_results
            
        except Exception as e:
            logger.error(f"Pinecone search error: {e}")
            raise Exception(f"Pinecone search failed: {str(e)}")
    
    async def _search_faiss(
        self, 
        query_embedding: np.ndarray, 
        query: str,
        top_k: int, 
        similarity_threshold: float
    ) -> List[Dict[str, Any]]:
        """Search using FAISS"""
        try:
            # Perform search
            scores, indices = self.faiss_index.search(
                np.array([query_embedding]), top_k
            )
            
            # Process results
            search_results = []
            for score, idx in zip(scores[0], indices[0]):
                if score >= similarity_threshold and idx in self.faiss_id_map:
                    chunk_id = self.faiss_id_map[idx]
                    metadata = self.chunk_metadata.get(chunk_id, {})
                    
                    result = {
                        "chunk_id": chunk_id,
                        "content": metadata.get("content", ""),
                        "similarity_score": float(score),
                        "document_id": metadata.get("document_id", ""),
                        "section": metadata.get("section", "general"),
                        "keywords": metadata.get("keywords", []),
                        "importance_score": metadata.get("importance_score", 0.5),
                        "document_title": metadata.get("document_title", ""),
                        "metadata": metadata
                    }
                    search_results.append(result)
            
            logger.info(f"FAISS search returned {len(search_results)} results for query: {query}")
            return search_results
            
        except Exception as e:
            logger.error(f"FAISS search error: {e}")
            raise Exception(f"FAISS search failed: {str(e)}")
    
    async def hybrid_search(
        self, 
        query: str, 
        keywords: List[str],
        semantic_weight: float = 0.7,
        keyword_weight: float = 0.3,
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """Perform hybrid search combining semantic and keyword matching"""
        try:
            # Get semantic search results
            semantic_results = await self.semantic_search(query, top_k * 2)
            
            # Perform keyword filtering and boosting
            hybrid_results = []
            for result in semantic_results:
                content_lower = result["content"].lower()
                query_lower = query.lower()
                
                # Calculate keyword match score
                keyword_score = 0
                for keyword in keywords:
                    if keyword.lower() in content_lower:
                        keyword_score += 1
                
                # Check if query terms are in content
                query_terms = query_lower.split()
                query_match_score = sum(1 for term in query_terms if term in content_lower)
                
                # Combine scores
                semantic_score = result["similarity_score"] * semantic_weight
                keyword_boost = (keyword_score + query_match_score) * keyword_weight
                
                final_score = semantic_score + keyword_boost
                
                result["hybrid_score"] = final_score
                result["keyword_matches"] = keyword_score
                result["query_term_matches"] = query_match_score
                
                hybrid_results.append(result)
            
            # Sort by hybrid score and return top_k
            hybrid_results.sort(key=lambda x: x["hybrid_score"], reverse=True)
            return hybrid_results[:top_k]
            
        except Exception as e:
            logger.error(f"Hybrid search error: {e}")
            raise Exception(f"Hybrid search failed: {str(e)}")
    
    async def health_check(self) -> str:
        """Check vector search service health"""
        try:
            if self.use_pinecone:
                # Test Pinecone connection
                stats = self.pinecone_index.describe_index_stats()
                return "healthy"
            else:
                # Test FAISS
                if self.faiss_index.ntotal >= 0:
                    return "healthy"
                else:
                    return "unhealthy"
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return "unhealthy"
    
    async def get_statistics(self) -> Dict[str, Any]:
        """Get vector database statistics"""
        try:
            if self.use_pinecone:
                stats = self.pinecone_index.describe_index_stats()
                return {
                    "total_vectors": stats.get("total_vector_count", 0),
                    "dimension": self.dimension,
                    "database_type": "pinecone",
                    "namespaces": stats.get("namespaces", {}),
                    "documents_stored": len(self.document_store)
                }
            else:
                return {
                    "total_vectors": self.faiss_index.ntotal,
                    "dimension": self.dimension,
                    "database_type": "faiss",
                    "documents_stored": len(self.document_store)
                }
        except Exception as e:
            logger.error(f"Error getting statistics: {e}")
            return {"error": str(e)}
