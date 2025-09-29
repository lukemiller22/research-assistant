-- Remove knowledge classification fields from source_chunks table
-- Run this in your Supabase SQL editor

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

-- Drop columns
ALTER TABLE source_chunks 
DROP COLUMN IF EXISTS primary_category,
DROP COLUMN IF EXISTS secondary_category,
DROP COLUMN IF EXISTS primary_confidence,
DROP COLUMN IF EXISTS secondary_confidence;
