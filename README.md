# LLM-Hack: Intelligent Query-Retrieval System

<img width="1920" height="1080" alt="Screenshot at 2025-08-07 01-35-32" src="https://github.com/user-attachments/assets/ac3a9b67-7c49-43fd-af72-78f69b3e9253" />

<img width="1920" height="1080" alt="Screenshot at 2025-08-07 01-35-40" src="https://github.com/user-attachments/assets/4cbe71a7-52a7-4e36-a675-6d60fbf582a6" />


<img width="1920" height="1080" alt="Screenshot at 2025-08-07 01-35-48" src="https://github.com/user-attachments/assets/e8b58e20-514e-4fdb-9252-aa84ef2324b9" />

![Screenshot at 2025-08-07 01-35-52](https://github.com/user-attachments/assets/7e7ee4e0-0113-4639-908b-826cab4e078a)


[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?logo=vercel)](https://v0-llm0mmain.vercel.app)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0-FF6154)](https://v0.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.68+-00a393)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14+-000000?logo=nextdotjs)](https://nextjs.org)

An LLM-powered intelligent query-retrieval system that processes large documents and makes contextual decisions for insurance, legal, HR, and compliance domains.

## 🌐 Live Demo

- **Frontend:** (https://v0-llm0mmain.vercel.app)

## 🎯 Problem Statement

Design an intelligent system that can:
- Process PDFs, DOCX, and email documents
- Handle policy/contract data efficiently
- Parse natural language queries
- Provide explainable decision rationale with structured JSON responses

### Sample Query
> "Does this policy cover knee surgery, and what are the conditions?"

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Input Docs     │───▶│  LLM Parser     │───▶│ Embedding Search│
│  PDF/DOCX/Email │    │ Extract Query   │    │ FAISS/Pinecone  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                ▼                        ▲
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  JSON Output    │◀───│ Logic Evaluation│◀───│ Clause Matching │
│ Structured Resp │    │ Decision Process│    │ Semantic Search │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Tech Stack

### Frontend
- **Next.js 14+** - React framework
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Component library

### Backend
- **FastAPI** - High-performance Python web framework
- **PostgreSQL** - Primary database
- **Docker** - Containerization

### AI/ML Components
- **GPT-4** - Large Language Model
- **Pinecone** - Vector database for semantic search
- **LangChain** - LLM application framework
- **OpenAI Embeddings** - Text vectorization

## 📁 Project Structure

```
LLM-hack/
├── analytics/          # Analytics and monitoring
├── api/               # FastAPI backend
├── app/               # Next.js application
├── components/        # React components
├── config/           # Configuration files
├── lib/              # Utility libraries
├── models/           # Data models
├── public/           # Static assets
├── services/         # Service layer
├── styles/           # CSS styles
├── ui/               # UI components
├── main.py           # FastAPI entry point
├── requirements.txt  # Python dependencies
├── package.json      # Node.js dependencies
├── docker-compose.yml # Docker configuration
└── README.md         # This file
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+
- Python 3.9+
- Docker & Docker Compose
- Pinecone Account
- OpenAI API Key

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/Neerajupadhayay2004/LLM-hack.git
   cd LLM-hack
   ```

2. **Environment Setup**
   ```bash
   # Copy environment file
   cp .env.example .env
   
   # Add your API keys
   PINECONE_API_KEY=your_pinecone_key
   OPENAI_API_KEY=your_openai_key
   DATABASE_URL=postgresql://user:pass@localhost:5432/llmhack
   ```

3. **Docker Deployment (Recommended)**
   ```bash
   docker-compose up -d
   ```

4. **Manual Setup**
   
   **Backend:**
   ```bash
   cd api
   pip install -r requirements.txt
   python main.py
   ```
   
   **Frontend:**
   ```bash
   npm install
   npm run dev
   ```

5. **Database Setup**
   ```bash
   python setup_database.py
   ```

## 📡 API Documentation

### Base URL
- **Local:** `http://localhost:8000/api/v1`
- **Production:** `https://your-api-domain.com/api/v1`

### Authentication
```
Authorization: Bearer a4f025be07025e89076181fecc043bf8b5222b260bff689775053561aa3175e6
```

### Endpoints

#### Process Document Query
```http
POST /hackrx/run
```

**Request:**
```json
{
    "documents": "https://hackrx.blob.core.windows.net/assets/policy.pdf",
    "questions": [
        "What is the grace period for premium payment?",
        "Does this policy cover maternity expenses?"
    ]
}
```

**Response:**
```json
{
    "answers": [
        "A grace period of thirty days is provided for premium payment...",
        "Yes, the policy covers maternity expenses with 24-month waiting period..."
    ]
}
```

#### Upload Document
```http
POST /upload
```

#### Health Check
```http
GET /health
```

## 🧪 Testing

### Run API Tests
```bash
python test_api.py
```

### Sample cURL Request
```bash
curl -X POST "http://localhost:8000/api/v1/hackrx/run" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer a4f025be07025e89076181fecc043bf8b5222b260bff689775053561aa3175e6" \
  -d '{
    "documents": "policy.pdf",
    "questions": ["What is covered under this policy?"]
  }'
```

## 📊 Evaluation Parameters

Our solution is optimized for:

- **🎯 Accuracy** - Precision in query understanding and clause matching
- **⚡ Token Efficiency** - Optimized LLM usage and cost-effectiveness
- **🚀 Latency** - Real-time response performance
- **🔄 Reusability** - Modular and extensible codebase
- **📝 Explainability** - Clear decision reasoning with clause traceability

## 🤝 Team Structure

This project is designed for a 4-member team:

1. **Backend & API Developer** - FastAPI, PostgreSQL, Docker
2. **Document Processing Engineer** - PDF/DOCX parsing, text chunking
3. **Vector Search & AI Specialist** - Pinecone, embeddings, semantic search
4. **LLM & Response Generator** - GPT-4 integration, prompt engineering

## 🚀 Deployment

### Vercel (Frontend)
The frontend is automatically deployed to Vercel and synced with v0.dev changes.

### Docker (Full Stack)
```bash
docker-compose up --build -d
```

### Manual Production Setup
1. Set up PostgreSQL database
2. Configure Pinecone index
3. Deploy FastAPI backend
4. Build and deploy Next.js frontend

## 🔧 Development

### Start Development Server
```bash
# Backend
python main.py

# Frontend
npm run dev
```

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/llmhack

# AI Services
OPENAI_API_KEY=your_openai_key
PINECONE_API_KEY=your_pinecone_key
PINECONE_ENV=us-west1-gcp

# App Configuration
BEARER_TOKEN=a4f025be07025e89076181fecc043bf8b5222b260bff689775053561aa3175e6
```

## 📈 Performance Optimization

- **Caching:** Redis for frequent queries
- **Chunking:** Optimized text splitting (1000 chars)
- **Embeddings:** Batch processing for efficiency
- **Response:** Streaming for large documents

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [v0.dev](https://v0.dev) for the rapid UI development
- [LangChain](https://langchain.com) for LLM orchestration
- [Pinecone](https://pinecone.io) for vector database
- [OpenAI](https://openai.com) for GPT-4 and embeddings

## 📞 Contact

- **GitHub:** [Neerajupadhayay2004](https://github.com/Neerajupadhayay2004)
- **Project Link:** [https://github.com/Neerajupadhayay2004/LLM-hack](https://github.com/Neerajupadhayay2004/LLM-hack)

---

**Built with ❤️ for intelligent document processing**
