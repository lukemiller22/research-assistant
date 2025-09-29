-- Revert AI curation fields from source_chunks table
-- Run this in your Supabase SQL editor

-- Drop AI curation columns
ALTER TABLE source_chunks 
DROP COLUMN IF EXISTS heading_level,
DROP COLUMN IF EXISTS proper_nouns,
DROP COLUMN IF EXISTS concept_tags,
DROP COLUMN IF EXISTS biblical_refs,
DROP COLUMN IF EXISTS topic_tags,
DROP COLUMN IF EXISTS footnotes_removed,
DROP COLUMN IF EXISTS formatting_fixes,
DROP COLUMN IF EXISTS ai_curated,
DROP COLUMN IF EXISTS curation_timestamp;

-- Drop AI curation constraints
ALTER TABLE source_chunks DROP CONSTRAINT IF EXISTS check_primary_category_new;
ALTER TABLE source_chunks DROP CONSTRAINT IF EXISTS check_secondary_category_new;

-- Drop AI curation indexes
DROP INDEX IF EXISTS idx_source_chunks_ai_curated;
DROP INDEX IF EXISTS idx_source_chunks_curation_timestamp;
DROP INDEX IF EXISTS idx_source_chunks_proper_nouns;
DROP INDEX IF EXISTS idx_source_chunks_concept_tags;
DROP INDEX IF EXISTS idx_source_chunks_biblical_refs;
DROP INDEX IF EXISTS idx_source_chunks_topic_tags;

-- Restore original constraints (if they existed)
-- Drop existing constraints first to avoid conflicts
ALTER TABLE source_chunks DROP CONSTRAINT IF EXISTS check_primary_category;
ALTER TABLE source_chunks DROP CONSTRAINT IF EXISTS check_secondary_category;

ALTER TABLE source_chunks 
ADD CONSTRAINT check_primary_category 
CHECK (primary_category IS NULL OR primary_category IN (
    'Semantic', 'Logical', 'Personal', 'Narrative', 
    'Practical', 'Symbolic', 'Reference'
));

ALTER TABLE source_chunks 
ADD CONSTRAINT check_secondary_category 
CHECK (secondary_category IS NULL OR secondary_category IN (
    'Semantic', 'Logical', 'Personal', 'Narrative', 
    'Practical', 'Symbolic', 'Reference'
));

-- Add back confidence columns if needed
ALTER TABLE source_chunks 
ADD COLUMN IF NOT EXISTS primary_confidence DECIMAL(3,2) CHECK (primary_confidence >= 0 AND primary_confidence <= 1),
ADD COLUMN IF NOT EXISTS secondary_confidence DECIMAL(3,2) CHECK (secondary_confidence >= 0 AND secondary_confidence <= 1);

-- Add back confidence indexes
CREATE INDEX IF NOT EXISTS idx_source_chunks_primary_confidence ON source_chunks(primary_confidence);
CREATE INDEX IF NOT EXISTS idx_source_chunks_secondary_confidence ON source_chunks(secondary_confidence);
