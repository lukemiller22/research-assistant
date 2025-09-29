# RAG Data Examples for Research Assistant

This document provides concrete examples of how data flows through our RAG (Retrieval-Augmented Generation) system, showing the transformation from raw content to searchable chunks and embeddings.

## System Architecture Overview

Our RAG system processes documents through these stages:
1. **Raw Content** → **Chunking** → **Cleaned Chunks** → **Embeddings** → **Vector Storage**
2. **Search Query** → **Query Embedding** → **Vector Search** → **Retrieved Chunks**

## 1. Source Documents

Our system supports multiple document types. Here are examples from our database:

### PDF Sources
```json
{
  "id": "7309ff9f-ea5c-4a4b-b1e2-e86c914d1ad5",
  "title": "On Reading Old Books",
  "author": "C.S. Lewis",
  "source_type": "pdf",
  "created_at": "2025-09-24T21:08:03.930033+00:00"
}
```

### Roam Research Sources
```json
{
  "id": "ac8f8ed4-265a-4f5b-9daf-3d395febb9a3",
  "title": "Chrestomathy",
  "author": "Various",
  "source_type": "roam",
  "created_at": "2025-09-24T22:29:20.418741+00:00"
}
```

## 2. Chunking Process

Documents are split into manageable chunks using different strategies based on content type:

### PDF Chunking Strategy
- **Chunk Size**: 500-1000 characters
- **Method**: Sentence-based splitting
- **Ensures**: Chunks end with complete sentences (periods)

### Roam Research Chunking Strategy
- **Chunk Size**: ~1000 characters
- **Method**: Block-based grouping
- **Features**: Preserves hierarchical structure

## 3. Sample Chunks from "On Reading Old Books" by C.S. Lewis

### Chunk 1 (Chunk Index 0)
```json
{
  "id": "aec5335c-f5e5-4f19-9dc3-fa38cdf38306",
  "source_id": "7309ff9f-ea5c-4a4b-b1e2-e86c914d1ad5",
  "content": "On Reading Old Books C. Lewis There is a strange idea abroad that in every subject the ancient books should be read only by the professionals, and that the amateur should content himself with the modern books. Thus I have found as a tutor in English Literature that if the average student wants to find out something about Platonism, the very last thing he thinks of doing is to take a translation of Plato off the library shelf and read the Symposium. He would rather read some dreary modern book ten times as long, all about \"isms\" and influences and only once in twelve pages telling him what Plato actually said. The error is rather an amiable one, for it springs from humility. The student is half afraid to meet one of the great philosophers face to face. He feels himself inadequate and thinks he will not understand him. But if he only knew, the great man, just because of his greatness, is much more intelligible than his modern commentator. The simplest student will be able to understand, if not all, yet a very great deal of what Plato said; but hardly anyone can understand some modern books on Platonism.",
  "chunk_index": 0,
  "structure_path": "Section 1 > Chunk 1",
  "primary_category": null,
  "secondary_category": null,
  "primary_confidence": 0,
  "secondary_confidence": 0
}
```

### Chunk 2 (Chunk Index 1)
```json
{
  "id": "6f2ad2fe-3318-46b2-bf27-4ef880461ebc",
  "source_id": "7309ff9f-ea5c-4a4b-b1e2-e86c914d1ad5",
  "content": "It has always therefore been one of my main endeavours as a teacher to persuade the young that firsthand knowledge is not only more worth acquiring than secondhand knowledge, but is usually much easier and more delightful to acquire. This mistaken preference for the modern books and this shyness of the old ones is nowhere more rampant than in theology. Wherever you find a little study circle of Christian laity you can be almost certain that they are studying not St. Augustine or Thomas Aquinas or Hooker or Butler, but M. Niebuhr or Miss Sayers or even myself. Now this seems to me topsy-turvy. Naturally, since I myself am a writer, I do not wish the ordinary reader to read no modern books. But if he must read only the new or only the old, I would advise him to read the old. And I would give him this advice precisely because he is an amateur and therefore much less protected than the expert against the dangers of an exclusive contemporary diet. A new book is still on its trial and the amateur is not in a position to judge it.",
  "chunk_index": 1,
  "structure_path": "Section 1 > Chunk 2",
  "primary_category": null,
  "secondary_category": null,
  "primary_confidence": 0,
  "secondary_confidence": 0
}
```

## 4. Text Cleaning Process

For Roam Research exports, we clean the text to remove markup:

### Before Cleaning (Raw Roam Text)
```
[[Internal Link]] with **bold** and ^^highlighted^^ text
((block-reference-uid)) and #[[tags]]
```

### After Cleaning
```
Internal Link with bold and highlighted text
[referenced content] and #tags
```

## 5. Embedding Generation

Each chunk is converted to a 1536-dimensional vector using OpenAI's `text-embedding-3-small` model:

### Sample Embedding Data
```json
{
  "id": "0000b6ab-0e70-407a-b186-15a30ea1f37e",
  "content": "Elymas was a sorcerer. In fact, he was kind of like a court wizard – an on-call sorcerer for the local governor....",
  "source_title": "Acts Sermons",
  "vector_length": 1536,
  "first_10_vector_values": [
    -0.0026275532, -0.014445007, -0.0027827881, 0.01266716,
    0.0015245691, 0.03006653, -0.03785768, 0.021961639,
    -0.027452048, -0.0014665603
  ]
}
```

## 6. Vector Storage in Qdrant

Embeddings are stored in Qdrant with metadata:

### Qdrant Point Structure
```json
{
  "id": "chunk-uuid",
  "vector": [1536 float values],
  "payload": {
    "source_id": "source-uuid",
    "source_title": "Document Title",
    "content": "chunk content...",
    "chunk_index": 0,
    "structure_path": "Section 1 > Chunk 1",
    "page_title": "Page Title",
    "block_type": "chunk",
    "primary_category": null,
    "secondary_category": null,
    "primary_confidence": 0.0,
    "secondary_confidence": 0.0
  }
}
```

## 7. Search Process

### Query Processing
1. **User Query**: "What does C.S. Lewis say about reading old books?"
2. **Query Embedding**: Converted to 1536-dimensional vector
3. **Vector Search**: Find most similar chunks using cosine similarity
4. **Results**: Return top-k most relevant chunks with similarity scores

### Sample Search Results
```json
[
  {
    "score": 0.89,
    "content": "On Reading Old Books C. Lewis There is a strange idea abroad...",
    "source_title": "On Reading Old Books",
    "chunk_index": 0,
    "source_id": "7309ff9f-ea5c-4a4b-b1e2-e86c914d1ad5",
    "structure_path": "Section 1 > Chunk 1"
  }
]
```

## 9. Database Schema

### Sources Table
```sql
CREATE TABLE sources (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT,
    source_type TEXT CHECK (source_type IN ('pdf', 'epub', 'json', 'roam', 'text')),
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    full_content TEXT
);
```

### Source Chunks Table
```sql
CREATE TABLE source_chunks (
    id UUID PRIMARY KEY,
    source_id UUID REFERENCES sources(id),
    content TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    structure_path TEXT,
    primary_category TEXT,
    secondary_category TEXT,
    primary_confidence DECIMAL(3,2),
    secondary_confidence DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 10. Performance Metrics

### Current System Stats
- **Total Sources**: 3 documents
- **Total Chunks**: 15+ chunks
- **Embedding Model**: text-embedding-3-small (1536 dimensions)
- **Vector Database**: Qdrant
- **Search Latency**: < 200ms average
- **Chunk Size**: 500-1000 characters (optimized for context)

## 11. API Endpoints

### Search Endpoints
- `POST /search` - Semantic search using embeddings
- `POST /text-search` - Literal text search with operators
- `POST /search-filtered` - Search with category filtering

### Data Management
- `GET /sources` - List all sources
- `POST /upload-source` - Upload and process new documents
- `DELETE /sources/:id` - Delete source and all chunks
- `GET /sources/:id/notes` - Get all chunks from a source

## 12. Key Benefits of This RAG Implementation

1. **Semantic Understanding**: Vector embeddings capture meaning, not just keywords
2. **Multi-format Support**: Handles PDFs, Roam Research, EPUB, JSON, and text files
3. **Intelligent Chunking**: Preserves context while staying within token limits
4. **Metadata Preservation**: Maintains document structure and relationships
5. **Scalable Search**: Vector database enables fast similarity search
6. **Knowledge Classification**: Framework for categorizing content types
7. **Flexible Querying**: Both semantic and literal text search capabilities

This RAG system transforms unstructured documents into a searchable knowledge base that can power intelligent research assistance and question-answering capabilities.

