-- Create tables for Research Assistant
-- Run this in your Supabase SQL editor

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sources table
CREATE TABLE IF NOT EXISTS sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT,
    source_type TEXT NOT NULL CHECK (source_type IN ('pdf', 'epub', 'json', 'roam', 'text')),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    full_content TEXT
);

-- Create source_chunks table
CREATE TABLE IF NOT EXISTS source_chunks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    structure_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create saved_notes table
CREATE TABLE IF NOT EXISTS saved_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, source_id, chunk_index)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sources_user_id ON sources(user_id);
CREATE INDEX IF NOT EXISTS idx_sources_type ON sources(source_type);
CREATE INDEX IF NOT EXISTS idx_source_chunks_source_id ON source_chunks(source_id);
CREATE INDEX IF NOT EXISTS idx_source_chunks_chunk_index ON source_chunks(chunk_index);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_sources_full_content ON sources(id) WHERE full_content IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_saved_notes_project_id ON saved_notes(project_id);
CREATE INDEX IF NOT EXISTS idx_saved_notes_source_id ON saved_notes(source_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE source_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS (basic policies - adjust based on your auth needs)
CREATE POLICY "Users can view their own data" ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can view their own sources" ON sources FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view chunks of their sources" ON source_chunks FOR ALL USING (
    source_id IN (SELECT id FROM sources WHERE user_id = auth.uid())
);
CREATE POLICY "Users can view their own projects" ON projects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view saved notes for their projects" ON saved_notes FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
);
