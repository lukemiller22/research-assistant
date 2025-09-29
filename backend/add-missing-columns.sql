-- Add missing columns to source_chunks table
-- Run this in your Supabase SQL editor

ALTER TABLE source_chunks 
ADD COLUMN IF NOT EXISTS page_title TEXT;

ALTER TABLE source_chunks 
ADD COLUMN IF NOT EXISTS block_type TEXT;

-- Update existing chunks to have default values
UPDATE source_chunks 
SET page_title = '' 
WHERE page_title IS NULL;

UPDATE source_chunks 
SET block_type = 'text' 
WHERE block_type IS NULL;
