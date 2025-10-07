# Community Library JSONL Specification

## Overview

This document specifies the JSONL format for community library sources. Each line in a `.jsonl` file represents one text chunk with pre-computed embeddings and metadata.

## Design Philosophy

**Fixed Core Structure + Flexible Source Metadata**

- **Core fields** (required for all sources) provide consistency for the application
- **`source_metadata`** (flexible JSONB) accommodates different source types (books, Bible, essays, etc.)
- **`metadata`** (flexible JSONB) contains AI-enriched tags and classifications

This approach allows each source type to include only relevant structural information without forcing a one-size-fits-all schema.

---

## Complete JSONL Format

### Required Core Fields

```jsonl
{
  "id": "string",
  "content": "string",
  "chunk_index": integer,
  "structure_path": "string",
  "source": "string",
  "author": "string",
  "year": "string",
  "genre": "string",
  "language": "string",
  "embedding": [array of 1536 floats],
  "source_metadata": {object},
  "metadata": {object}
}
```

### Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier for this chunk (e.g., `"ortho_ch01_p001"`) - becomes chunk UUID in database |
| `content` | string | Yes | The actual text content of the chunk |
| `chunk_index` | integer | Yes | Sequential position (0-based) for ordering chunks |
| `structure_path` | string | Yes | Human-readable hierarchical location (e.g., `"Chapter 1 > Introduction"`) |
| `source` | string | Yes | Title of the book/document |
| `author` | string | Yes | Author name |
| `year` | string | Yes | Publication year |
| `genre` | string | Yes | High-level categorization (e.g., `"Christian Apologetics"`) |
| `language` | string | Yes | ISO language code (e.g., `"en"`) |
| `embedding` | array | Yes | Pre-computed 1536-dimensional vector (OpenAI text-embedding-3-small) |
| `source_metadata` | object | Yes | Flexible structure-specific metadata (varies by source type) |
| `metadata` | object | Yes | AI-enriched metadata (syntopicon tags, rhetorical function, etc.) |

**Note:** The JSONL `id` field is used as the chunk's UUID in the database. When uploading, a separate `source_id` (UUID foreign key) links each chunk to its parent source in the `sources` table.

---

## Source Metadata Templates

The `source_metadata` field is a flexible JSONB object that varies based on source type. Below are the standard templates:

### 1. Book (Standard Chapters)

**Use for:** Books organized by chapters (e.g., Orthodoxy, Mere Christianity)

```json
{
  "source_metadata": {
    "source_type": "book",
    "chapter": "1",
    "chapter_title": "Introduction: In Defence of Everything Else",
    "section": "The Modern Paradox",
    "page_number": 15
  }
}
```

**Fields:**
- `source_type`: Always `"book"`
- `chapter`: Chapter number (as string)
- `chapter_title`: Full chapter title
- `section`: Sub-chapter section (null if not applicable)
- `page_number`: Page number in original text (null if not available)

---

### 2. Bible

**Use for:** Biblical texts (any translation)

```json
{
  "source_metadata": {
    "source_type": "bible",
    "book": "John",
    "chapter": "3",
    "verse": "16",
    "verse_range": null,
    "translation": "ESV"
  }
}
```

**Fields:**
- `source_type`: Always `"bible"`
- `book`: Book name (e.g., `"John"`, `"Genesis"`)
- `chapter`: Chapter number (as string)
- `verse`: Starting verse number (as string)
- `verse_range`: Optional end verse for ranges (e.g., `"18"` for John 3:16-18)
- `translation`: Bible translation (e.g., `"ESV"`, `"KJV"`, `"NIV"`)

**Structure Path Example:** `"John 3:16 (ESV)"`

---

### 3. Summa Theologica

**Use for:** Aquinas's Summa and similar scholastic texts

```json
{
  "source_metadata": {
    "source_type": "summa",
    "part": "I",
    "question": "2",
    "article": "3",
    "objection": "1",
    "reply": null
  }
}
```

**Fields:**
- `source_type`: Always `"summa"`
- `part`: Part number (e.g., `"I"`, `"I-II"`, `"II-II"`, `"III"`)
- `question`: Question number (as string)
- `article`: Article number (as string)
- `objection`: Objection number (null if main article text)
- `reply`: Reply number (null if not a reply)

**Structure Path Example:** `"Part I > Question 2 > Article 3 > Objection 1"`

---

### 4. Essay/Article

**Use for:** Standalone essays, articles, short works

```json
{
  "source_metadata": {
    "source_type": "essay",
    "essay_title": "On Reading Old Books",
    "section": "The Value of Antiquity",
    "paragraph": 3
  }
}
```

**Fields:**
- `source_type`: Always `"essay"`
- `essay_title`: Full title of the essay
- `section`: Section heading (null if no sections)
- `paragraph`: Paragraph number within section (null if not tracked)

**Structure Path Example:** `"On Reading Old Books > The Value of Antiquity"`

---

### 5. Sermon/Lecture

**Use for:** Sermons, lectures, speeches

```json
{
  "source_metadata": {
    "source_type": "sermon",
    "sermon_title": "The Weight of Glory",
    "date": "1941-06-08",
    "location": "Oxford University",
    "section": null
  }
}
```

**Fields:**
- `source_type`: Always `"sermon"`
- `sermon_title`: Full title
- `date`: Date delivered (ISO format YYYY-MM-DD, null if unknown)
- `location`: Where delivered
- `section`: Section within sermon (null if not divided)

---

## AI-Enriched Metadata

The `metadata` field contains all AI-enriched information from Claude enrichment:

```json
{
  "metadata": {
    "syntopicon_tags": [
      {
        "concept": "Truth",
        "subconcept": "Absolute vs Relative Truth",
        "confidence": 0.88
      }
    ],
    "rhetorical_function": {
      "primary": {
        "category": "logical",
        "elements": ["Claim", "Paradox"]
      },
      "secondary": {
        "category": "symbolic",
        "elements": ["Metaphor"]
      }
    },
    "scripture_refs": [
      {
        "reference": "John 3:16",
        "type": "explicit",
        "context": "God's love for the world"
      }
    ],
    "entities": {
      "people": ["Plato", "Augustine"],
      "places": ["Athens"],
      "groups": ["Stoics"],
      "works": ["The Republic"]
    },
    "topics": ["orthodoxy", "apologetics", "truth", "relativism"]
  }
}
```

**See `community_library_taxonomies.json` for complete metadata structure specification.**

---

## Complete Examples

### Example 1: Orthodoxy (Book)

```json
{
  "id": "ortho_ch01_p001",
  "content": "THE only possible excuse for this book is that it is an answer to a challenge. Even a bad shot is dignified when he accepts a duel.",
  "chunk_index": 0,
  "structure_path": "Chapter 1 > Introduction: In Defence of Everything Else",
  "source": "Orthodoxy",
  "author": "G.K. Chesterton",
  "year": "1908",
  "genre": "Christian Apologetics",
  "language": "en",
  "embedding": [0.0234, -0.0156, 0.0891, ...],
  "source_metadata": {
    "source_type": "book",
    "chapter": "1",
    "chapter_title": "Introduction: In Defence of Everything Else",
    "section": null,
    "page_number": 1
  },
  "metadata": {
    "syntopicon_tags": [
      {
        "concept": "Philosophy",
        "subconcept": "Philosophical Method",
        "confidence": 0.85
      }
    ],
    "rhetorical_function": {
      "primary": {
        "category": "personal",
        "elements": ["Confession", "Identity"]
      }
    },
    "scripture_refs": [],
    "entities": {
      "people": [],
      "places": [],
      "groups": [],
      "works": ["Heretics"]
    },
    "topics": ["apologetics", "philosophy", "personal_defense"]
  }
}
```

### Example 2: Bible (ESV)

```json
{
  "id": "john_03_016",
  "content": "For God so loved the world, that he gave his only Son, that whoever believes in him should not perish but have eternal life.",
  "chunk_index": 0,
  "structure_path": "John 3:16 (ESV)",
  "source": "The Holy Bible, English Standard Version",
  "author": "Multiple Authors",
  "year": "2001",
  "genre": "Scripture",
  "language": "en",
  "embedding": [0.0156, -0.0234, 0.0567, ...],
  "source_metadata": {
    "source_type": "bible",
    "book": "John",
    "chapter": "3",
    "verse": "16",
    "verse_range": null,
    "translation": "ESV"
  },
  "metadata": {
    "syntopicon_tags": [
      {
        "concept": "God",
        "subconcept": "Divine Love",
        "confidence": 0.95
      },
      {
        "concept": "Immortality",
        "subconcept": "Eternal Life",
        "confidence": 0.90
      }
    ],
    "rhetorical_function": {
      "primary": {
        "category": "logical",
        "elements": ["Claim"]
      }
    },
    "scripture_refs": [],
    "entities": {
      "people": ["God", "Son"],
      "places": ["world"],
      "groups": [],
      "works": []
    },
    "topics": ["salvation", "eternal_life", "divine_love", "belief"]
  }
}
```

---

## Implementation Notes for Backend

### Database Schema (Supabase)

The `source_chunks` table should have:

```sql
CREATE TABLE source_chunks (
    id UUID PRIMARY KEY,
    source_id UUID REFERENCES sources(id),  -- Foreign key to sources table
    content TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    structure_path TEXT,
    source_metadata JSONB,  -- Flexible structure (chapter, verse, etc.)
    metadata JSONB,         -- AI enrichment (syntopicon, rhetorical, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for source_metadata queries
CREATE INDEX idx_source_metadata ON source_chunks USING GIN (source_metadata);

-- Index for metadata queries  
CREATE INDEX idx_metadata ON source_chunks USING GIN (metadata);
```

**Important:** `source_id` is the UUID foreign key that links to the `sources` table. This is distinct from the `id` field in the JSONL (which becomes the chunk's UUID).

### JSONL Upload Endpoint

The `/upload-jsonl` endpoint should:

1. Parse JSONL file line by line
2. Validate required core fields
3. **Create source record in `sources` table** (get `source_id` UUID)
4. Insert chunks into `source_chunks` table with the `source_id` foreign key
5. Upload embeddings + payloads to Qdrant

**Note:** The `id` field from the JSONL becomes the chunk's UUID in `source_chunks.id`. The `source_id` field is generated when creating the source record.

**Qdrant Payload Structure:**

```javascript
{
  id: chunk.id,  // From JSONL - becomes the chunk UUID
  vector: chunk.embedding,
  payload: {
    source_id: source.id,  // UUID from sources table
    user_id: user_id,
    is_community: true,
    community_source_id: "orthodoxy-chesterton",
    content: chunk.content,
    chunk_index: chunk.chunk_index,
    structure_path: chunk.structure_path,
    source_metadata: chunk.source_metadata,  // Include for filtering
    metadata: chunk.metadata                 // Include for filtering
  }
}
```

### Querying Examples

**Filter by Bible book:**
```javascript
filter: {
  must: [
    { key: "source_metadata.source_type", match: { value: "bible" } },
    { key: "source_metadata.book", match: { value: "John" } }
  ]
}
```

**Filter by chapter in a book:**
```javascript
filter: {
  must: [
    { key: "source_metadata.source_type", match: { value: "book" } },
    { key: "source_metadata.chapter", match: { value: "3" } }
  ]
}
```

**Filter by Summa part:**
```javascript
filter: {
  must: [
    { key: "source_metadata.source_type", match: { value: "summa" } },
    { key: "source_metadata.part", match: { value: "I" } }
  ]
}
```

---

## Validation Checklist

Before uploading JSONL files, verify:

- [ ] Every line is valid JSON
- [ ] All required core fields present
- [ ] `embedding` arrays have exactly 1536 dimensions
- [ ] `chunk_index` values are sequential (0, 1, 2, ...)
- [ ] `source_metadata.source_type` is specified
- [ ] `structure_path` is human-readable and informative
- [ ] `id` values are unique across the file
- [ ] `metadata` follows the enrichment schema

---

## Adding New Source Types

To add a new source type:

1. Define the `source_metadata` template
2. Document required and optional fields
3. Specify how `structure_path` should be generated
4. Add example to this document
5. Update validation logic if needed

**No changes to core schema required** - that's the beauty of the flexible metadata approach!

---

## Version

**Current:** v1.0 (Flexible source_metadata design)
**Last Updated:** 2025-10-03