-- Add content column to projects table
-- Run this in your Supabase SQL editor

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS content TEXT;

-- Update existing projects to have empty content
UPDATE projects 
SET content = '' 
WHERE content IS NULL;

