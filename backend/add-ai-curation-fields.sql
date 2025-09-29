-- Add AI curation fields to source_chunks table
-- Run this in your Supabase SQL editor

-- First, remove confidence fields and update categories to new 8-category system
-- Drop constraints first
ALTER TABLE source_chunks DROP CONSTRAINT IF EXISTS check_primary_category;
ALTER TABLE source_chunks DROP CONSTRAINT IF EXISTS check_secondary_category;
ALTER TABLE source_chunks DROP CONSTRAINT IF EXISTS check_primary_confidence;
ALTER TABLE source_chunks DROP CONSTRAINT IF EXISTS check_secondary_confidence;

-- Drop indexes
DROP INDEX IF EXISTS idx_source_chunks_primary_category;
DROP INDEX IF EXISTS idx_source_chunks_secondary_category;
DROP INDEX IF EXISTS idx_source_chunks_primary_confidence;
DROP INDEX IF EXISTS idx_source_chunks_secondary_confidence;

-- Drop confidence columns
ALTER TABLE source_chunks 
DROP COLUMN IF EXISTS primary_confidence,
DROP COLUMN IF EXISTS secondary_confidence;

-- Add new AI curation fields
ALTER TABLE source_chunks 
ADD COLUMN IF NOT EXISTS heading_level TEXT DEFAULT 'paragraph',
ADD COLUMN IF NOT EXISTS proper_nouns JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS concept_tags JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS biblical_refs JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS topic_tags JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS footnotes_removed TEXT,
ADD COLUMN IF NOT EXISTS formatting_fixes TEXT,
ADD COLUMN IF NOT EXISTS ai_curated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS curation_timestamp TIMESTAMP WITH TIME ZONE;

-- Update existing primary_category and secondary_category constraints to new 8 categories
-- Drop existing constraints first
ALTER TABLE source_chunks DROP CONSTRAINT IF EXISTS check_primary_category_new;
ALTER TABLE source_chunks DROP CONSTRAINT IF EXISTS check_secondary_category_new;

ALTER TABLE source_chunks 
ADD CONSTRAINT check_primary_category_new 
CHECK (primary_category IS NULL OR primary_category IN (
    'Semantic', 'Logical', 'Personal', 'Narrative', 
    'Practical', 'Symbolic', 'Reference', 'Structural'
));

ALTER TABLE source_chunks 
ADD CONSTRAINT check_secondary_category_new 
CHECK (secondary_category IS NULL OR secondary_category IN (
    'Semantic', 'Logical', 'Personal', 'Narrative', 
    'Practical', 'Symbolic', 'Reference', 'Structural'
));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_source_chunks_primary_category ON source_chunks(primary_category);
CREATE INDEX IF NOT EXISTS idx_source_chunks_secondary_category ON source_chunks(secondary_category);
CREATE INDEX IF NOT EXISTS idx_source_chunks_ai_curated ON source_chunks(ai_curated);
CREATE INDEX IF NOT EXISTS idx_source_chunks_curation_timestamp ON source_chunks(curation_timestamp);

-- Add GIN indexes for JSONB fields for efficient searching
CREATE INDEX IF NOT EXISTS idx_source_chunks_proper_nouns ON source_chunks USING GIN (proper_nouns);
CREATE INDEX IF NOT EXISTS idx_source_chunks_concept_tags ON source_chunks USING GIN (concept_tags);
CREATE INDEX IF NOT EXISTS idx_source_chunks_biblical_refs ON source_chunks USING GIN (biblical_refs);
CREATE INDEX IF NOT EXISTS idx_source_chunks_topic_tags ON source_chunks USING GIN (topic_tags);

