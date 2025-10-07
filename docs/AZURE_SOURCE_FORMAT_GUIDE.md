# Azure Search Source Format Guide

## Overview
Azure Search requires a different document format than Qdrant. This guide shows you how to convert your existing JSONL sources and create new ones.

## Format Differences

### Qdrant Format (Your Current JSONL)
```json
{
  "content": "Your text content here...",
  "chunk_index": 0,
  "structure_path": "Source > Chapter > Section",
  "source_title": "Your Source Title",
  "author": "Author Name",
  "year": "2024",
  "genre": "Essay",
  "embedding": null,
  "metadata": {
    "source_type": "essay",
    "syntopicon_tags": ["Education", "Knowledge"],
    "rhetorical_function": ["semantic", "logical"],
    "scripture_refs": ["John 3:16"],
    "topics": ["reading", "education"],
    "entities": {
      "people": ["Plato", "Aristotle"],
      "works": ["Republic", "Nicomachean Ethics"]
    }
  }
}
```

### Azure Search Format (Required)
```json
{
  "id": "doc_1",
  "content": "Your text content here...",
  "source_id": "your_source_id",
  "source_title": "Your Source Title",
  "author": "Author Name",
  "year": "2024",
  "genre": "Essay",
  "chunk_index": 0,
  "structure_path": "Source > Chapter > Section",
  "syntopicon_tags": ["Education", "Knowledge"],
  "rhetorical_function": ["semantic", "logical"],
  "topics": ["reading", "education"],
  "scripture_refs": ["John 3:16"],
  "entities_people": ["Plato", "Aristotle"],
  "entities_works": ["Republic", "Nicomachean Ethics"],
  "is_community": true,
  "community_source_id": "your_source_id"
}
```

## Key Changes Required

1. **Add `id` field**: Unique identifier for each document
2. **Flatten metadata**: Move metadata fields to top level
3. **Split entities**: `entities.people` → `entities_people`, `entities.works` → `entities_works`
4. **Add Azure fields**: `source_id`, `is_community`, `community_source_id`
5. **Remove embedding**: Azure handles embeddings internally

## Converting Existing Sources

### Method 1: Use the Conversion Tool
```bash
# Convert a single file
node convert-jsonl-to-azure.js your_source.jsonl

# Convert with custom output name
node convert-jsonl-to-azure.js your_source.jsonl your_source_azure.jsonl

# Convert and upload directly to Azure
node convert-jsonl-to-azure.js your_source.jsonl --upload
```

### Method 2: Manual Conversion
1. Take your existing JSONL file
2. Transform each line using the format differences above
3. Save as new JSONL file

## Creating New Sources

### Template for New Azure-Compatible JSONL
```json
{
  "id": "doc_1",
  "content": "Your content here...",
  "source_id": "source_name_lowercase",
  "source_title": "Your Source Title",
  "author": "Author Name",
  "year": "2024",
  "genre": "Essay",
  "chunk_index": 0,
  "structure_path": "Source > Chapter > Section",
  "syntopicon_tags": ["Tag1", "Tag2"],
  "rhetorical_function": ["semantic", "logical"],
  "topics": ["topic1", "topic2"],
  "scripture_refs": ["John 3:16", "Matthew 5:3"],
  "entities_people": ["Person1", "Person2"],
  "entities_works": ["Work1", "Work2"],
  "is_community": true,
  "community_source_id": "source_name_lowercase"
}
```

## Uploading to Azure Search

### Option 1: Use the Conversion Tool
```bash
node convert-jsonl-to-azure.js your_source.jsonl --upload
```

### Option 2: Use the Migration Script
```bash
# First convert your JSONL to Azure format
node convert-jsonl-to-azure.js your_source.jsonl

# Then use the migration script (modify it to use your converted file)
node migrate-to-azure.js
```

### Option 3: Direct Upload via API
```bash
curl -X POST "http://localhost:3001/api/upload" \
  -H "Content-Type: application/json" \
  -d @your_source_azure.jsonl
```

## Field Requirements

### Required Fields
- `id`: Unique identifier
- `content`: The main text content
- `source_title`: Display name of the source

### Recommended Fields
- `author`: Author name
- `year`: Publication year
- `genre`: Type of content
- `chunk_index`: Order within source
- `structure_path`: Hierarchical path

### Metadata Fields (for filtering/boosting)
- `syntopicon_tags`: Array of Syntopicon concepts
- `rhetorical_function`: Array of rhetorical functions
- `topics`: Array of topic tags
- `scripture_refs`: Array of scripture references
- `entities_people`: Array of people mentioned
- `entities_works`: Array of works mentioned

### Azure-Specific Fields
- `source_id`: Lowercase, underscore-separated source identifier
- `is_community`: Boolean (true for community sources)
- `community_source_id`: Same as source_id

## Testing Your Sources

1. **Convert**: Use the conversion tool
2. **Upload**: Upload to Azure Search
3. **Verify**: Check the index statistics
4. **Test**: Run a search query
5. **Filter**: Test the filtering functionality

## Example Workflow

```bash
# 1. Convert your existing JSONL
node convert-jsonl-to-azure.js my_new_source.jsonl

# 2. Upload to Azure
node convert-jsonl-to-azure.js my_new_source.jsonl --upload

# 3. Verify upload
curl -X GET "http://localhost:3001/api/filter-options?type=sources"

# 4. Test search
curl -X POST "http://localhost:3001/search" \
  -H "Content-Type: application/json" \
  -d '{"query": "your test query", "limit": 5}'
```

## Troubleshooting

### Common Issues
1. **Missing ID**: Each document needs a unique `id` field
2. **Array fields**: Ensure arrays are properly formatted (not strings)
3. **Field names**: Use exact field names (e.g., `entities_people`, not `entities.people`)
4. **Encoding**: Ensure UTF-8 encoding for special characters

### Validation
```bash
# Check if your JSONL is valid
node -e "
const fs = require('fs');
const content = fs.readFileSync('your_file.jsonl', 'utf8');
const lines = content.trim().split('\n');
lines.forEach((line, i) => {
  try { JSON.parse(line); }
  catch (e) { console.error(\`Line \${i+1}: \${e.message}\`); }
});
console.log('✅ All lines are valid JSON');
"
```

## Next Steps

1. **Create new sources** using the Azure format
2. **Test the filtering system** with your new data
3. **Compare search results** between different sources
4. **Optimize metadata** for better search relevance

This format ensures your sources work seamlessly with Azure Search's hybrid search, filtering, and metadata boosting capabilities!

