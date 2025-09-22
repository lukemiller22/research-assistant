-- Add knowledge classification fields to source_chunks table
-- Run this in your Supabase SQL editor

ALTER TABLE source_chunks 
ADD COLUMN IF NOT EXISTS primary_category TEXT,
ADD COLUMN IF NOT EXISTS secondary_category TEXT,
ADD COLUMN IF NOT EXISTS primary_confidence DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS secondary_confidence DECIMAL(3,2);

-- Add indexes for better performance when filtering by category
CREATE INDEX IF NOT EXISTS idx_source_chunks_primary_category ON source_chunks(primary_category);
CREATE INDEX IF NOT EXISTS idx_source_chunks_secondary_category ON source_chunks(secondary_category);
CREATE INDEX IF NOT EXISTS idx_source_chunks_primary_confidence ON source_chunks(primary_confidence);
CREATE INDEX IF NOT EXISTS idx_source_chunks_secondary_confidence ON source_chunks(secondary_confidence);

-- Add check constraints to ensure valid categories
ALTER TABLE source_chunks 
ADD CONSTRAINT check_primary_category 
CHECK (primary_category IS NULL OR primary_category IN ('Semantic', 'Logical', 'Personal', 'Narrative', 'Practical', 'Symbolic', 'Reference'));

ALTER TABLE source_chunks 
ADD CONSTRAINT check_secondary_category 
CHECK (secondary_category IS NULL OR secondary_category IN ('Semantic', 'Logical', 'Personal', 'Narrative', 'Practical', 'Symbolic', 'Reference'));

-- Add check constraints for confidence scores (0.00 to 1.00)
ALTER TABLE source_chunks 
ADD CONSTRAINT check_primary_confidence 
CHECK (primary_confidence IS NULL OR (primary_confidence >= 0.00 AND primary_confidence <= 1.00));

ALTER TABLE source_chunks 
ADD CONSTRAINT check_secondary_confidence 
CHECK (secondary_confidence IS NULL OR (secondary_confidence >= 0.00 AND secondary_confidence <= 1.00));

