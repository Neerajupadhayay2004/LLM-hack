#!/bin/bash

# Start script for the LLM-Powered Intelligent Query-Retrieval System

echo "🚀 Starting LLM-Powered Intelligent Query-Retrieval System Backend"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📚 Installing dependencies..."
pip install -r requirements.txt

# Check environment variables
if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  Warning: OPENAI_API_KEY not set"
fi

if [ -z "$PINECONE_API_KEY" ]; then
    echo "⚠️  Warning: PINECONE_API_KEY not set"
fi

# Start the server
echo "🌟 Starting FastAPI server on http://localhost:8000"
echo "📖 API Documentation available at http://localhost:8000/docs"
echo "🔍 Health check at http://localhost:8000/api/v1/health"

uvicorn main:app --host 0.0.0.0 --port 8000 --reload --log-level info
