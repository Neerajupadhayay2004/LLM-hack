import asyncio
import asyncpg
import json
from datetime import datetime

async def setup_database():
    """
    Set up PostgreSQL database with tables for document metadata,
    query logs, and system analytics.
    """
    
    # Database connection (in production, use environment variables)
    DATABASE_URL = "postgresql://user:password@localhost:5432/llm_retrieval"
    
    try:
        # Connect to database
        conn = await asyncpg.connect(DATABASE_URL)
        print("Connected to PostgreSQL database")
        
        # Create documents table
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS documents (
                id SERIAL PRIMARY KEY,
                url VARCHAR(500) NOT NULL,
                document_type VARCHAR(50),
                title VARCHAR(200),
                content_hash VARCHAR(64),
                chunk_count INTEGER,
                processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                metadata JSONB
            )
        ''')
        print("Created documents table")
        
        # Create query_logs table
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS query_logs (
                id SERIAL PRIMARY KEY,
                document_id INTEGER REFERENCES documents(id),
                query_text TEXT NOT NULL,
                answer TEXT,
                confidence_score FLOAT,
                processing_time FLOAT,
                tokens_used INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                metadata JSONB
            )
        ''')
        print("Created query_logs table")
        
        # Create vector_chunks table
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS vector_chunks (
                id SERIAL PRIMARY KEY,
                document_id INTEGER REFERENCES documents(id),
                chunk_text TEXT NOT NULL,
                chunk_index INTEGER,
                embedding_vector FLOAT[],
                metadata JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        print("Created vector_chunks table")
        
        # Create system_metrics table
        await conn.execute('''
            CREATE TABLE IF NOT EXISTS system_metrics (
                id SERIAL PRIMARY KEY,
                metric_name VARCHAR(100),
                metric_value FLOAT,
                metric_unit VARCHAR(50),
                recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                metadata JSONB
            )
        ''')
        print("Created system_metrics table")
        
        # Create indexes for better performance
        await conn.execute('CREATE INDEX IF NOT EXISTS idx_documents_url ON documents(url)')
        await conn.execute('CREATE INDEX IF NOT EXISTS idx_query_logs_document_id ON query_logs(document_id)')
        await conn.execute('CREATE INDEX IF NOT EXISTS idx_vector_chunks_document_id ON vector_chunks(document_id)')
        await conn.execute('CREATE INDEX IF NOT EXISTS idx_system_metrics_name ON system_metrics(metric_name)')
        print("Created database indexes")
        
        # Insert sample data
        await insert_sample_data(conn)
        
        await conn.close()
        print("Database setup completed successfully!")
        
    except Exception as e:
        print(f"Error setting up database: {e}")

async def insert_sample_data(conn):
    """Insert sample data for testing"""
    
    # Insert sample document
    doc_id = await conn.fetchval('''
        INSERT INTO documents (url, document_type, title, chunk_count, metadata)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
    ''', 
    'https://example.com/policy.pdf',
    'pdf',
    'National Parivar Mediclaim Plus Policy',
    10,
    json.dumps({
        'domain': 'insurance',
        'language': 'english',
        'pages': 25,
        'file_size': '2.5MB'
    }))
    
    # Insert sample vector chunks
    sample_chunks = [
        "Grace period of thirty days is provided for premium payment after the due date",
        "Waiting period of thirty-six months for pre-existing diseases and their direct complications",
        "Maternity expenses covered including childbirth and lawful medical termination of pregnancy",
        "Specific waiting period of two years for cataract surgery",
        "Medical expenses for organ donor hospitalization covered for harvesting organ"
    ]
    
    for i, chunk in enumerate(sample_chunks):
        await conn.execute('''
            INSERT INTO vector_chunks (document_id, chunk_text, chunk_index, metadata)
            VALUES ($1, $2, $3, $4)
        ''', doc_id, chunk, i, json.dumps({'section': f'section_{i+1}'}))
    
    # Insert sample metrics
    metrics = [
        ('avg_response_time', 2.5, 'seconds'),
        ('query_success_rate', 96.5, 'percentage'),
        ('token_efficiency', 88.2, 'percentage'),
        ('system_uptime', 99.9, 'percentage')
    ]
    
    for name, value, unit in metrics:
        await conn.execute('''
            INSERT INTO system_metrics (metric_name, metric_value, metric_unit)
            VALUES ($1, $2, $3)
        ''', name, value, unit)
    
    print("Sample data inserted successfully")

if __name__ == "__main__":
    asyncio.run(setup_database())
