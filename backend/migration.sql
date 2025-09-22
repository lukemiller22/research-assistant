-- Migration to add full_content field to sources table
-- Run this in your Supabase SQL editor

ALTER TABLE sources 
ADD COLUMN full_content TEXT;

-- Add index for better performance when retrieving full content
CREATE INDEX IF NOT EXISTS idx_sources_full_content ON sources(id) WHERE full_content IS NOT NULL;

-- Update existing sources to have empty full_content (they will be regenerated on next upload)
UPDATE sources 
SET full_content = '' 
WHERE full_content IS NULL;

