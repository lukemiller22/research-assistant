-- Add status field to sources table
ALTER TABLE sources ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'completed';

-- Add status field to source_chunks table  
ALTER TABLE source_chunks ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'completed';

-- Update existing records to have completed status
UPDATE sources SET status = 'completed' WHERE status IS NULL;
UPDATE source_chunks SET status = 'completed' WHERE status IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sources_status ON sources(status);
CREATE INDEX IF NOT EXISTS idx_source_chunks_status ON source_chunks(status);
CREATE INDEX IF NOT EXISTS idx_source_chunks_source_status ON source_chunks(source_id, status);
