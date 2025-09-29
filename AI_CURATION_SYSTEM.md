# AI Curation System Documentation

## Overview

The AI Curation System is an advanced text processing pipeline that automatically enhances document chunks using OpenAI's GPT models. It replaces the manual review step in the RAG pipeline with intelligent AI-powered curation, dramatically improving chunk quality and searchability at minimal cost (~13-15 cents per book).

## System Architecture

```
Raw Content → Chunking → AI Curation → Embeddings → Vector Storage
```

The AI curation step processes each chunk through 10 specialized tasks using a combination of GPT-4o-mini (for cost efficiency) and GPT-4o (for high-quality analysis).

## AI Curation Tasks

### Tasks 1-7 (GPT-4o-mini - Cost Efficient)
1. **Irrelevance Detection** - Remove page numbers, headers, footers, TOC entries
2. **Heading Identification** - Detect and classify heading hierarchy levels
3. **Formatting Fixes** - Fix OCR errors, broken words, spacing issues
4. **Footnote Removal** - Clean up footnote markers and footnote text
5. **Quality Evaluation** - Assess chunk coherence and suggest splitting/merging
6. **Knowledge Classification** - Categorize into 8 knowledge types
7. **Proper Noun Extraction** - Identify people, places, organizations, events

### Tasks 8-10 (GPT-4o - High Quality)
8. **Syntopicon Concepts** - Tag with Mortimer Adler's concept list
9. **Biblical References** - Extract biblical citations and references
10. **Topic Tags** - Add domain-specific topic tags

## Knowledge Classification System

The system uses 8 categories (without confidence scoring):

- **Semantic** - Concepts, definitions, explanations
- **Logical** - Arguments, evidence, reasoning, claims
- **Personal** - First-person reflections, emotions, experiences
- **Narrative** - Historical events, stories, chronological accounts
- **Practical** - Methods, procedures, actionable advice
- **Symbolic** - Metaphors, imagery, figurative language
- **Reference** - Citations, sources, external authorities
- **Structural** - Lists, outlines, organizational elements

## Database Schema

### New Fields Added to `source_chunks`:

```sql
-- AI Curation Fields
proper_nouns JSONB DEFAULT '[]'::jsonb,
concept_tags JSONB DEFAULT '[]'::jsonb,
biblical_refs JSONB DEFAULT '[]'::jsonb,
topic_tags JSONB DEFAULT '[]'::jsonb,
footnotes_removed TEXT,
formatting_fixes TEXT,
ai_curated BOOLEAN DEFAULT FALSE,
curation_timestamp TIMESTAMP WITH TIME ZONE

-- Updated Categories (removed confidence fields)
primary_category TEXT,
secondary_category TEXT
```

### Removed Fields:
- `primary_confidence` (DECIMAL)
- `secondary_confidence` (DECIMAL)

## API Endpoints

### New Endpoints

#### `POST /test-ai-curation`
Test the AI curation system with sample text.

**Request:**
```json
{
  "text": "Sample text to curate",
  "sourceTitle": "Optional source title"
}
```

**Response:**
```json
{
  "message": "AI curation test completed",
  "original_text": "...",
  "curated_chunk": {
    "content": "curated content",
    "primary_category": "Semantic",
    "secondary_category": "Logical",
    "proper_nouns": ["Aristotle", "Rawls"],
    "concept_tags": ["Justice", "Philosophy"],
    "biblical_refs": [],
    "topic_tags": ["moral philosophy", "ethics"],
    "ai_curated": true,
    "curation_timestamp": "2024-01-01T00:00:00Z"
  }
}
```

### Updated Endpoints

All search endpoints now return AI curation metadata:
- `/search` - Vector search with AI metadata
- `/hybrid-search` - Hybrid search with AI metadata
- `/text-search` - Text search with AI metadata

## Cost Analysis

### Estimated Costs per Book:
- **GPT-4o-mini (Tasks 1-7)**: ~$0.10-0.12 per book
- **GPT-4o (Tasks 8-10)**: ~$0.03-0.05 per book
- **Total**: ~$0.13-0.17 per book

### Cost Optimization:
- Uses GPT-4o-mini for 70% of tasks (cost-efficient)
- Uses GPT-4o only for high-value analysis tasks
- Implements rate limiting and error handling
- Processes chunks in batches with delays

## Implementation Details

### Core Functions

#### `curateChunkWithAI(chunk, sourceTitle)`
Processes a single chunk through all 10 AI curation tasks.

#### `processChunkTask(content, task, sourceTitle, model)`
Executes a specific curation task using the specified OpenAI model.

#### `curateChunksWithAI(chunks, sourceTitle)`
Processes multiple chunks with progress tracking and error handling.

### Integration Points

1. **Upload Pipeline**: AI curation runs after chunking, before database storage
2. **Search Results**: All search endpoints include AI curation metadata
3. **Database Storage**: New fields stored in both Supabase and Qdrant
4. **Error Handling**: Graceful fallback if AI curation fails

## Usage Examples

### Testing the System

```bash
# Start the server
cd backend
npm start

# Run the test script
node test-ai-curation.js
```

### Uploading a Document with AI Curation

```javascript
const response = await fetch('/upload-source', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Sample Book',
    author: 'Test Author',
    source_type: 'pdf',
    file_buffer: base64FileData
  })
});

const result = await response.json();
console.log('AI Curation completed:', result.ai_curation);
console.log('Curated chunks:', result.curated_chunks);
```

### Searching with AI Metadata

```javascript
const searchResponse = await fetch('/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'justice and fairness',
    limit: 10
  })
});

const results = await searchResponse.json();
results.forEach(result => {
  console.log('Category:', result.primary_category);
  console.log('Concepts:', result.concept_tags);
  console.log('Topics:', result.topic_tags);
});
```

## Benefits

1. **Improved Search Quality**: AI-curated chunks provide better semantic understanding
2. **Rich Metadata**: Extensive tagging enables advanced filtering and categorization
3. **Cost Effective**: ~13-15 cents per book vs. hours of manual review
4. **Scalable**: Processes any number of documents automatically
5. **Consistent**: Standardized curation across all document types
6. **Searchable**: All metadata is indexed and searchable

## Future Enhancements

1. **Custom Concept Lists**: Allow domain-specific concept tagging
2. **Quality Metrics**: Track curation quality and accuracy
3. **Batch Processing**: Optimize for large document collections
4. **Custom Models**: Fine-tune models for specific document types
5. **User Feedback**: Learn from user corrections and preferences

## Troubleshooting

### Common Issues

1. **OpenAI API Errors**: Check API key and rate limits
2. **Database Schema**: Ensure all new fields are added
3. **Memory Usage**: Large documents may require chunking optimization
4. **Rate Limiting**: Built-in delays prevent API throttling

### Debug Endpoints

- `GET /test-embeddings` - Test OpenAI connection
- `GET /test-qdrant` - Test vector database
- `GET /test-db` - Test database connection
- `POST /test-ai-curation` - Test AI curation system

## Migration Guide

### Database Migration

Run the SQL migration script:
```sql
-- Run add-ai-curation-fields.sql in Supabase
```

### Code Updates

The system is backward compatible. Existing chunks will have default values for new fields.

### Testing

1. Run the test script: `node test-ai-curation.js`
2. Upload a test document
3. Verify AI curation metadata in search results
4. Check database for new fields

## Support

For issues or questions about the AI Curation System, check:
1. Server logs for error messages
2. Database schema for missing fields
3. OpenAI API status and limits
4. Test endpoints for system health

