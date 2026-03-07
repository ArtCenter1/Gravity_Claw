-- Execute this in the Supabase SQL Editor to initialize the database
CREATE EXTENSION IF NOT EXISTS vector;

-- Table for semantic message history
CREATE TABLE IF NOT EXISTS semantic_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536), -- Assuming OpenAI text-embedding-3-small
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Function to search for similar messages
CREATE OR REPLACE FUNCTION match_semantic_memory (
    query_embedding vector(1536),
    match_threshold float,
    match_count int
)
RETURNS TABLE (
    id UUID,
    role TEXT,
    content TEXT,
    similarity float
)
LANGUAGE sql STABLE
AS $$
    SELECT
        semantic_memory.id,
        semantic_memory.role,
        semantic_memory.content,
        1 - (semantic_memory.embedding <=> query_embedding) AS similarity
    FROM semantic_memory
    WHERE 1 - (semantic_memory.embedding <=> query_embedding) > match_threshold
    ORDER BY semantic_memory.embedding <=> query_embedding
    LIMIT match_count;
$$;
