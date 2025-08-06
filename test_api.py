#!/usr/bin/env python3
"""
Test script for the LLM-Powered Intelligent Query-Retrieval System API
"""

import asyncio
import aiohttp
import json
import time
from typing import Dict, Any

# Test configuration
BASE_URL = "http://localhost:8000"
AUTH_TOKEN = "a4f025be0702e89076181feccb43bf8b5222b260bf6897750535c1aa37f5eA"

# Test data
TEST_DOCUMENT_URL = "https://hackrx.blob.core.windows.net/assets/policy.pdf"
TEST_QUESTIONS = [
    "What is the grace period for premium payment under the National Parivar Mediclaim Plus Policy?",
    "Does this policy cover maternity expenses, and what are the conditions?",
    "What is the waiting period for cataract surgery?",
    "Are there any sub-limits on room rent and ICU charges for Plan A?",
    "What is the No Claim Discount (NCD) offered in this policy?"
]

async def test_health_check():
    """Test the health check endpoint"""
    print("🏥 Testing health check endpoint...")
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(f"{BASE_URL}/api/v1/health") as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ Health check passed: {data['status']}")
                    return True
                else:
                    print(f"❌ Health check failed: HTTP {response.status}")
                    return False
        except Exception as e:
            print(f"❌ Health check error: {e}")
            return False

async def test_main_endpoint():
    """Test the main query processing endpoint"""
    print("🧠 Testing main query processing endpoint...")
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {AUTH_TOKEN}"
    }
    
    payload = {
        "documents": TEST_DOCUMENT_URL,
        "questions": TEST_QUESTIONS,
        "options": {}
    }
    
    async with aiohttp.ClientSession() as session:
        try:
            start_time = time.time()
            
            async with session.post(
                f"{BASE_URL}/api/v1/hackrx/run",
                headers=headers,
                json=payload
            ) as response:
                
                processing_time = time.time() - start_time
                
                if response.status == 200:
                    data = await response.json()
                    
                    print(f"✅ Query processing successful!")
                    print(f"⏱️  Total processing time: {processing_time:.2f}s")
                    print(f"📊 Questions processed: {len(data['answers'])}")
                    print(f"📈 Average confidence: {sum(a['confidence'] for a in data['answers']) / len(data['answers']):.2f}")
                    
                    # Display first answer as example
                    if data['answers']:
                        first_answer = data['answers'][0]
                        print(f"\n📝 Sample Answer:")
                        print(f"Q: {first_answer['question']}")
                        print(f"A: {first_answer['answer'][:200]}...")
                        print(f"Confidence: {first_answer['confidence']:.2f}")
                        print(f"Sources: {len(first_answer['sources'])}")
                    
                    return True
                    
                else:
                    error_text = await response.text()
                    print(f"❌ Query processing failed: HTTP {response.status}")
                    print(f"Error: {error_text}")
                    return False
                    
        except Exception as e:
            print(f"❌ Query processing error: {e}")
            return False

async def test_search_endpoint():
    """Test the direct search endpoint"""
    print("🔍 Testing direct search endpoint...")
    
    headers = {
        "Authorization": f"Bearer {AUTH_TOKEN}"
    }
    
    params = {
        "query": "grace period premium payment",
        "top_k": 3
    }
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(
                f"{BASE_URL}/api/v1/search",
                headers=headers,
                params=params
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ Search successful!")
                    print(f"📊 Results found: {data['total_results']}")
                    
                    if data['results']:
                        print(f"🎯 Top result similarity: {data['results'][0].get('similarity_score', 'N/A')}")
                    
                    return True
                    
                else:
                    error_text = await response.text()
                    print(f"❌ Search failed: HTTP {response.status}")
                    print(f"Error: {error_text}")
                    return False
                    
        except Exception as e:
            print(f"❌ Search error: {e}")
            return False

async def test_authentication():
    """Test authentication with invalid token"""
    print("🔐 Testing authentication...")
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer invalid-token"
    }
    
    payload = {
        "documents": TEST_DOCUMENT_URL,
        "questions": ["Test question"],
        "options": {}
    }
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(
                f"{BASE_URL}/api/v1/hackrx/run",
                headers=headers,
                json=payload
            ) as response:
                
                if response.status == 401:
                    print("✅ Authentication properly rejected invalid token")
                    return True
                else:
                    print(f"❌ Authentication test failed: Expected 401, got {response.status}")
                    return False
                    
        except Exception as e:
            print(f"❌ Authentication test error: {e}")
            return False

async def run_all_tests():
    """Run all API tests"""
    print("🧪 Starting API Tests for LLM-Powered Intelligent Query-Retrieval System")
    print("=" * 70)
    
    tests = [
        ("Health Check", test_health_check),
        ("Authentication", test_authentication),
        ("Main Query Processing", test_main_endpoint),
        ("Direct Search", test_search_endpoint),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n🔬 Running {test_name} test...")
        try:
            result = await test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} test crashed: {e}")
            results.append((test_name, False))
        
        print("-" * 50)
    
    # Summary
    print(f"\n📊 Test Results Summary:")
    print("=" * 70)
    
    passed = 0
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\n🎯 Overall: {passed}/{len(results)} tests passed")
    
    if passed == len(results):
        print("🎉 All tests passed! The API is working correctly.")
    else:
        print("⚠️  Some tests failed. Please check the backend logs.")

if __name__ == "__main__":
    print("🚀 LLM-Powered Intelligent Query-Retrieval System - API Test Suite")
    print("Make sure the backend is running on http://localhost:8000")
    print()
    
    try:
        asyncio.run(run_all_tests())
    except KeyboardInterrupt:
        print("\n🛑 Tests interrupted by user")
    except Exception as e:
        print(f"\n💥 Test suite crashed: {e}")
