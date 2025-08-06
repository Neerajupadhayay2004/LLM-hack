import asyncio
import logging
from typing import List, Dict, Any, Optional
import openai
from datetime import datetime
import json
import re

from config.settings import get_settings

logger = logging.getLogger(__name__)

class LLMService:
    """Advanced LLM service for contextual answer generation"""
    
    def __init__(self):
        self.settings = get_settings()
        openai.api_key = self.settings.OPENAI_API_KEY
        self.model = "gpt-4"
        self.max_tokens = 2000
        self.temperature = 0.1  # Low temperature for consistent responses
    
    async def generate_contextual_answer(
        self,
        question: str,
        context_chunks: List[Dict[str, Any]],
        domain: str = "insurance"
    ) -> Dict[str, Any]:
        """Generate contextual answer with reasoning and sources"""
        try:
            # Prepare context from chunks
            context = self._prepare_context(context_chunks)
            
            # Get domain-specific system prompt
            system_prompt = self._get_domain_system_prompt(domain)
            
            # Create the main prompt
            user_prompt = self._create_answer_prompt(question, context, context_chunks)
            
            # Generate response
            response = await self._call_openai(system_prompt, user_prompt)
            
            # Parse and structure the response
            structured_response = self._parse_llm_response(response, context_chunks)
            
            # Add confidence scoring
            confidence = self._calculate_confidence(question, context_chunks, structured_response)
            
            # Extract sources
            sources = self._extract_sources(context_chunks)
            
            return {
                "answer": structured_response.get("answer", "Unable to generate answer"),
                "confidence": confidence,
                "reasoning": structured_response.get("reasoning", "No reasoning provided"),
                "sources": sources,
                "relevant_clauses": structured_response.get("relevant_clauses", []),
                "decision_rationale": structured_response.get("decision_rationale", ""),
                "compliance_status": structured_response.get("compliance_status", "unknown"),
                "recommendations": structured_response.get("recommendations", []),
                "risk_assessment": structured_response.get("risk_assessment", ""),
                "metadata": {
                    "model_used": self.model,
                    "context_chunks_used": len(context_chunks),
                    "domain": domain,
                    "generated_at": datetime.utcnow().isoformat()
                }
            }
            
        except Exception as e:
            logger.error(f"Error generating answer: {e}")
            return {
                "answer": "I apologize, but I encountered an error while processing your question.",
                "confidence": 0.0,
                "reasoning": f"Error occurred: {str(e)}",
                "sources": [],
                "relevant_clauses": [],
                "decision_rationale": "",
                "compliance_status": "error"
            }
    
    def _prepare_context(self, context_chunks: List[Dict[str, Any]]) -> str:
        """Prepare context string from chunks"""
        context_parts = []
        for i, chunk in enumerate(context_chunks, 1):
            section = chunk.get("section", "general")
            content = chunk.get("content", "")
            
            context_part = f"[Context {i} - Section: {section}]\n{content}\n"
            context_parts.append(context_part)
        
        return "\n".join(context_parts)
    
    def _get_domain_system_prompt(self, domain: str) -> str:
        """Get domain-specific system prompt"""
        domain_prompts = {
            "insurance": """You are an expert insurance policy analyst with deep knowledge of:
- Policy terms, conditions, and coverage details
- Waiting periods, exclusions, and limitations
- Claims procedures and requirements
- Regulatory compliance (IRDAI guidelines)
- Premium calculations and discounts
- Medical insurance terminology

Your task is to analyze insurance documents and provide accurate, detailed answers to questions about policy coverage, terms, and conditions. Always cite specific clauses and provide clear reasoning for your answers.""",

            "legal": """You are a senior legal analyst specializing in:
- Contract analysis and interpretation
- Legal precedents and case law
- Regulatory compliance requirements
- Risk assessment and liability analysis
- Legal procedures and documentation

Analyze legal documents with precision and provide comprehensive answers with proper legal reasoning and citations.""",

            "hr": """You are an HR policy expert with expertise in:
- Employment law and regulations
- HR policies and procedures
- Employee rights and benefits
- Performance management systems
- Workplace compliance and safety

Provide clear, actionable answers about HR policies and procedures with proper justification.""",

            "compliance": """You are a compliance officer specializing in:
- Regulatory frameworks and requirements
- Risk assessment and management
- Audit procedures and controls
- Policy implementation and monitoring

Analyze compliance documents and provide detailed assessments with regulatory context."""
        }
        
        return domain_prompts.get(domain, domain_prompts["insurance"])
    
    def _create_answer_prompt(
        self, 
        question: str, 
        context: str, 
        context_chunks: List[Dict[str, Any]]
    ) -> str:
        """Create the main prompt for answer generation"""
        return f"""Based on the provided document context, please answer the following question with detailed analysis:

QUESTION: {question}

DOCUMENT CONTEXT:
{context}

Please provide your response in the following JSON format:
{{
    "answer": "Direct, comprehensive answer to the question",
    "reasoning": "Detailed step-by-step reasoning for your answer",
    "relevant_clauses": ["List of specific clauses or sections that support your answer"],
    "decision_rationale": "Explanation of how you arrived at this decision",
    "compliance_status": "compliant/non-compliant/unclear/not-applicable",
    "recommendations": ["List of actionable recommendations if applicable"],
    "risk_assessment": "Assessment of any risks or important considerations"
}}

Requirements:
1. Be precise and factual - only use information from the provided context
2. If information is not available in the context, clearly state this
3. Cite specific sections or clauses when making statements
4. Provide clear reasoning for your conclusions
5. Include relevant policy numbers, amounts, or time periods when mentioned
6. Assess compliance status when applicable
7. Highlight any important limitations or conditions

Answer:"""
    
    async def _call_openai(self, system_prompt: str, user_prompt: str) -> str:
        """Call OpenAI API with error handling and retries"""
        max_retries = 3
        retry_count = 0
        
        while retry_count < max_retries:
            try:
                response = openai.ChatCompletion.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    max_tokens=self.max_tokens,
                    temperature=self.temperature,
                    timeout=30
                )
                
                return response.choices[0].message.content.strip()
                
            except openai.error.RateLimitError:
                retry_count += 1
                wait_time = 2 ** retry_count
                logger.warning(f"Rate limit hit, waiting {wait_time}s before retry {retry_count}")
                await asyncio.sleep(wait_time)
                
            except openai.error.APIError as e:
                logger.error(f"OpenAI API error: {e}")
                if retry_count < max_retries - 1:
                    retry_count += 1
                    await asyncio.sleep(1)
                else:
                    raise Exception(f"OpenAI API failed after {max_retries} retries: {str(e)}")
                    
            except Exception as e:
                logger.error(f"Unexpected error calling OpenAI: {e}")
                raise Exception(f"LLM service error: {str(e)}")
        
        raise Exception("Max retries exceeded for OpenAI API")
    
    def _parse_llm_response(self, response: str, context_chunks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Parse and validate LLM response"""
        try:
            # Try to extract JSON from response
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                parsed_response = json.loads(json_str)
                
                # Validate required fields
                required_fields = ["answer", "reasoning"]
                for field in required_fields:
                    if field not in parsed_response:
                        parsed_response[field] = f"Missing {field} in response"
                
                return parsed_response
            else:
                # Fallback: treat entire response as answer
                return {
                    "answer": response,
                    "reasoning": "Response could not be parsed as structured JSON",
                    "relevant_clauses": [],
                    "decision_rationale": "",
                    "compliance_status": "unknown",
                    "recommendations": [],
                    "risk_assessment": ""
                }
                
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse JSON response: {e}")
            return {
                "answer": response,
                "reasoning": "Response parsing failed, returning raw answer",
                "relevant_clauses": [],
                "decision_rationale": "",
                "compliance_status": "unknown",
                "recommendations": [],
                "risk_assessment": ""
            }
    
    def _calculate_confidence(
        self, 
        question: str, 
        context_chunks: List[Dict[str, Any]], 
        response: Dict[str, Any]
    ) -> float:
        """Calculate confidence score for the answer"""
        try:
            confidence_factors = []
            
            # Factor 1: Number of relevant chunks (more context = higher confidence)
            chunk_factor = min(len(context_chunks) / 5.0, 1.0)
            confidence_factors.append(chunk_factor * 0.3)
            
            # Factor 2: Average similarity score of chunks
            if context_chunks:
                avg_similarity = sum(chunk.get("similarity_score", 0.5) for chunk in context_chunks) / len(context_chunks)
                confidence_factors.append(avg_similarity * 0.3)
            else:
                confidence_factors.append(0.1)
            
            # Factor 3: Answer length and detail (longer, detailed answers = higher confidence)
            answer_length = len(response.get("answer", ""))
            length_factor = min(answer_length / 500.0, 1.0)  # Normalize to 500 chars
            confidence_factors.append(length_factor * 0.2)
            
            # Factor 4: Presence of specific clauses/citations
            relevant_clauses = response.get("relevant_clauses", [])
            citation_factor = min(len(relevant_clauses) / 3.0, 1.0)
            confidence_factors.append(citation_factor * 0.2)
            
            # Calculate final confidence
            final_confidence = sum(confidence_factors)
            
            # Ensure confidence is between 0.1 and 1.0
            return max(0.1, min(final_confidence, 1.0))
            
        except Exception as e:
            logger.warning(f"Error calculating confidence: {e}")
            return 0.5  # Default confidence
    
    def _extract_sources(self, context_chunks: List[Dict[str, Any]]) -> List[str]:
        """Extract source information from context chunks"""
        sources = []
        for chunk in context_chunks:
            section = chunk.get("section", "general")
            doc_title = chunk.get("document_title", "Document")
            similarity = chunk.get("similarity_score", 0.0)
            
            source = f"{doc_title} - {section.title()} Section (Relevance: {similarity:.2f})"
            sources.append(source)
        
        return sources
    
    async def health_check(self) -> str:
        """Check LLM service health"""
        try:
            # Test with a simple query
            test_response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",  # Use cheaper model for health check
                messages=[{"role": "user", "content": "Hello"}],
                max_tokens=10,
                timeout=10
            )
            
            if test_response.choices[0].message.content:
                return "healthy"
            else:
                return "unhealthy"
                
        except Exception as e:
            logger.error(f"LLM health check failed: {e}")
            return "unhealthy"
    
    async def generate_summary(self, text: str, max_length: int = 200) -> str:
        """Generate a summary of the given text"""
        try:
            prompt = f"""Please provide a concise summary of the following text in no more than {max_length} characters:

{text}

Summary:"""
            
            response = await self._call_openai(
                "You are a professional summarizer. Provide clear, concise summaries.",
                prompt
            )
            
            return response[:max_length] if len(response) > max_length else response
            
        except Exception as e:
            logger.error(f"Error generating summary: {e}")
            return "Summary generation failed"
    
    async def extract_key_entities(self, text: str) -> Dict[str, List[str]]:
        """Extract key entities from text"""
        try:
            prompt = f"""Extract key entities from the following text and categorize them:

{text}

Please return the entities in JSON format with categories like:
- persons: [list of person names]
- organizations: [list of organization names]
- locations: [list of locations]
- dates: [list of important dates]
- amounts: [list of monetary amounts or percentages]
- medical_terms: [list of medical/insurance terms]

Entities:"""
            
            response = await self._call_openai(
                "You are an expert in named entity recognition and information extraction.",
                prompt
            )
            
            # Try to parse JSON response
            try:
                return json.loads(response)
            except:
                return {"entities": [response]}
                
        except Exception as e:
            logger.error(f"Error extracting entities: {e}")
            return {"error": str(e)}
