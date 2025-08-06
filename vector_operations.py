import numpy as np
import faiss
import pickle
import json
from typing import List, Dict, Any
import openai
from sentence_transformers import SentenceTransformer

class VectorOperations:
    """
    Advanced vector operations for document embeddings and similarity search.
    Supports both FAISS and Pinecone-style operations.
    """
    
    def __init__(self, dimension: int = 768):
        self.dimension = dimension
        self.index = faiss.IndexFlatIP(dimension)  # Inner product for cosine similarity
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.chunk_metadata = {}
        
    def generate_embeddings(self, texts: List[str]) -> np.ndarray:
        """Generate embeddings for a list of texts"""
        print(f"Generating embeddings for {len(texts)} texts...")
        embeddings = self.model.encode(texts, convert_to_tensor=False)
        
        # Normalize for cosine similarity
        embeddings = embeddings / np.linalg.norm(embeddings, axis=1, keepdims=True)
        return embeddings.astype('float32')
    
    def add_vectors(self, texts: List[str], metadata: List[Dict[str, Any]]):
        """Add vectors to the FAISS index"""
        embeddings = self.generate_embeddings(texts)
        
        # Add to FAISS index
        start_id = self.index.ntotal
        self.index.add(embeddings)
        
        # Store metadata
        for i, meta in enumerate(metadata):
            self.chunk_metadata[start_id + i] = {
                'text': texts[i],
                **meta
            }
        
        print(f"Added {len(texts)} vectors to index. Total vectors: {self.index.ntotal}")
    
    def search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Search for similar vectors"""
        query_embedding = self.generate_embeddings([query])
        
        # Search FAISS index
        scores, indices = self.index.search(query_embedding, top_k)
        
        results = []
        for i, (score, idx) in enumerate(zip(scores[0], indices[0])):
            if idx in self.chunk_metadata:
                results.append({
                    'id': int(idx),
                    'score': float(score),
                    'text': self.chunk_metadata[idx]['text'],
                    'metadata': {k: v for k, v in self.chunk_metadata[idx].items() if k != 'text'}
                })
        
        return results
    
    def save_index(self, filepath: str):
        """Save FAISS index and metadata to disk"""
        faiss.write_index(self.index, f"{filepath}.faiss")
        
        with open(f"{filepath}_metadata.pkl", 'wb') as f:
            pickle.dump(self.chunk_metadata, f)
        
        print(f"Index saved to {filepath}")
    
    def load_index(self, filepath: str):
        """Load FAISS index and metadata from disk"""
        self.index = faiss.read_index(f"{filepath}.faiss")
        
        with open(f"{filepath}_metadata.pkl", 'rb') as f:
            self.chunk_metadata = pickle.load(f)
        
        print(f"Index loaded from {filepath}")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get index statistics"""
        return {
            'total_vectors': self.index.ntotal,
            'dimension': self.dimension,
            'index_type': 'FAISS IndexFlatIP',
            'memory_usage_mb': self.index.ntotal * self.dimension * 4 / (1024 * 1024)
        }

def demo_vector_operations():
    """Demonstrate vector operations with sample insurance policy data"""
    
    # Initialize vector operations
    vector_ops = VectorOperations()
    
    # Sample insurance policy chunks
    sample_chunks = [
        "Grace period of thirty days is provided for premium payment after the due date to renew or continue the policy without losing continuity benefits.",
        "There is a waiting period of thirty-six months of continuous coverage from the first policy inception for pre-existing diseases and their direct complications to be covered.",
        "The policy covers maternity expenses, including childbirth and lawful medical termination of pregnancy. To be eligible, the female insured person must have been continuously covered for at least 24 months.",
        "The policy has a specific waiting period of two years for cataract surgery.",
        "The policy indemnifies the medical expenses for the organ donor's hospitalization for the purpose of harvesting the organ, provided the organ is for an insured person.",
        "A No Claim Discount of 5% on the base premium is offered on renewal for a one-year policy term if no claims were made in the preceding year.",
        "The policy reimburses expenses for health check-ups at the end of every block of two continuous policy years, provided the policy has been renewed without a break.",
        "A hospital is defined as an institution with at least 10 inpatient beds with qualified nursing staff and medical practitioners available 24/7.",
        "The policy covers medical expenses for inpatient treatment under Ayurveda, Yoga, Naturopathy, Unani, Siddha, and Homeopathy systems up to the Sum Insured limit.",
        "For Plan A, the daily room rent is capped at 1% of the Sum Insured, and ICU charges are capped at 2% of the Sum Insured."
    ]
    
    # Metadata for each chunk
    metadata = [
        {'section': 'payment_terms', 'type': 'grace_period', 'importance': 'high'},
        {'section': 'coverage_terms', 'type': 'pre_existing', 'importance': 'high'},
        {'section': 'coverage_benefits', 'type': 'maternity', 'importance': 'medium'},
        {'section': 'coverage_terms', 'type': 'cataract', 'importance': 'medium'},
        {'section': 'coverage_benefits', 'type': 'organ_donor', 'importance': 'low'},
        {'section': 'discounts', 'type': 'no_claim_discount', 'importance': 'medium'},
        {'section': 'benefits', 'type': 'health_checkup', 'importance': 'low'},
        {'section': 'definitions', 'type': 'hospital', 'importance': 'high'},
        {'section': 'coverage_benefits', 'type': 'ayush', 'importance': 'low'},
        {'section': 'limits', 'type': 'room_rent', 'importance': 'medium'}
    ]
    
    # Add vectors to index
    vector_ops.add_vectors(sample_chunks, metadata)
    
    # Test queries
    test_queries = [
        "What is the grace period for premium payment?",
        "Does this policy cover maternity expenses?",
        "What is the waiting period for pre-existing diseases?",
        "Are there any discounts available?",
        "What are the room rent limits?"
    ]
    
    print("\n" + "="*50)
    print("VECTOR SEARCH RESULTS")
    print("="*50)
    
    for query in test_queries:
        print(f"\nQuery: {query}")
        print("-" * 40)
        
        results = vector_ops.search(query, top_k=3)
        
        for i, result in enumerate(results, 1):
            print(f"{i}. Score: {result['score']:.3f}")
            print(f"   Text: {result['text'][:100]}...")
            print(f"   Section: {result['metadata']['section']}")
            print(f"   Type: {result['metadata']['type']}")
            print()
    
    # Print index statistics
    stats = vector_ops.get_stats()
    print("\n" + "="*50)
    print("INDEX STATISTICS")
    print("="*50)
    for key, value in stats.items():
        print(f"{key}: {value}")
    
    # Save index for later use
    vector_ops.save_index("insurance_policy_index")
    print("\nIndex saved successfully!")

if __name__ == "__main__":
    demo_vector_operations()
