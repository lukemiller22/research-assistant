# Azure Cognitive Search Migration Plan

## Overview
This document outlines the migration from Qdrant to Azure Cognitive Search for the research assistant application, focusing on leveraging Azure's built-in hybrid search, filtering, and re-ranking capabilities.

## Current Architecture Analysis

### Qdrant Implementation
- **Vector Storage**: 1536-dimensional embeddings (OpenAI text-embedding-3-small)
- **Collection**: 'documents' with cosine similarity
- **Metadata**: Rich payload with syntopicon tags, rhetorical functions, topics, entities, scripture references
- **Search**: Custom hybrid search with manual metadata boosting and re-ranking
- **Filtering**: Basic payload filtering by source_id and other fields

### Current Search Flow
1. Generate query embedding using OpenAI
2. Search Qdrant with vector similarity
3. Filter results by existing sources
4. Apply custom metadata boosting
5. Re-rank results manually
6. Return top N results

## Azure Cognitive Search Architecture

### Index Schema
```json
{
  "name": "documents",
  "fields": [
    {
      "name": "id",
      "type": "Edm.String",
      "key": true
    },
    {
      "name": "content",
      "type": "Edm.String",
      "searchable": true,
      "analyzer": "en.microsoft"
    },
    {
      "name": "contentVector",
      "type": "Collection(Edm.Single)",
      "dimensions": 1536,
      "vectorSearchProfile": "default"
    },
    {
      "name": "source_id",
      "type": "Edm.String",
      "filterable": true,
      "facetable": true
    },
    {
      "name": "source_title",
      "type": "Edm.String",
      "searchable": true,
      "filterable": true
    },
    {
      "name": "author",
      "type": "Edm.String",
      "searchable": true,
      "filterable": true
    },
    {
      "name": "year",
      "type": "Edm.String",
      "filterable": true
    },
    {
      "name": "genre",
      "type": "Edm.String",
      "filterable": true
    },
    {
      "name": "chunk_index",
      "type": "Edm.Int32",
      "filterable": true,
      "sortable": true
    },
    {
      "name": "structure_path",
      "type": "Edm.String",
      "searchable": true
    },
    {
      "name": "syntopicon_tags",
      "type": "Collection(Edm.String)",
      "searchable": true,
      "filterable": true
    },
    {
      "name": "rhetorical_function",
      "type": "Collection(Edm.String)",
      "searchable": true,
      "filterable": true
    },
    {
      "name": "topics",
      "type": "Collection(Edm.String)",
      "searchable": true,
      "filterable": true
    },
    {
      "name": "scripture_refs",
      "type": "Collection(Edm.String)",
      "searchable": true,
      "filterable": true
    },
    {
      "name": "entities_people",
      "type": "Collection(Edm.String)",
      "searchable": true,
      "filterable": true
    },
    {
      "name": "entities_works",
      "type": "Collection(Edm.String)",
      "searchable": true,
      "filterable": true
    },
    {
      "name": "is_community",
      "type": "Edm.Boolean",
      "filterable": true
    },
    {
      "name": "community_source_id",
      "type": "Edm.String",
      "filterable": true
    }
  ],
  "vectorSearch": {
    "profiles": [
      {
        "name": "default",
        "algorithm": "hnsw"
      }
    ],
    "algorithms": [
      {
        "name": "hnsw",
        "kind": "hnsw",
        "parameters": {
          "m": 4,
          "efConstruction": 400,
          "efSearch": 500
        }
      }
    ]
  },
  "semantic": {
    "configurations": [
      {
        "name": "default",
        "prioritizedFields": {
          "titleField": {
            "fieldName": "source_title"
          },
          "prioritizedContentFields": [
            {
              "fieldName": "content"
            }
          ],
          "prioritizedKeywordsFields": [
            {
              "fieldName": "syntopicon_tags"
            },
            {
              "fieldName": "topics"
            }
          ]
        }
      }
    ]
  }
}
```

### Vector Search Profile
```json
{
  "name": "default",
  "algorithm": "hnsw",
  "parameters": {
    "m": 4,
    "efConstruction": 400,
    "efSearch": 500
  }
}
```

## Migration Steps

### Phase 1: Azure Setup
1. Create Azure Cognitive Search service
2. Configure index schema
3. Set up vector search profile
4. Configure semantic search

### Phase 2: Data Migration
1. Export data from Qdrant
2. Transform data to Azure format
3. Upload to Azure Cognitive Search
4. Verify data integrity

### Phase 3: Code Migration
1. Replace Qdrant client with Azure Search client
2. Update search logic to use hybrid queries
3. Remove custom boosting logic
4. Implement Azure-specific filtering

### Phase 4: Testing & Optimization
1. A/B test search results
2. Compare performance metrics
3. Optimize query parameters
4. Fine-tune semantic ranking

## Expected Benefits

### Performance Improvements
- **Native hybrid search**: Combines text and vector search automatically
- **Better filtering**: More efficient pre-filtering capabilities
- **Semantic re-ranking**: Built-in language understanding for better relevance

### Development Benefits
- **Reduced complexity**: No need for custom boosting algorithms
- **Managed service**: No infrastructure management
- **Built-in features**: Semantic search, captions, answers

### Cost Considerations
- **Pay-per-use**: Only pay for what you use
- **No infrastructure costs**: Managed service eliminates server costs
- **Free tier**: Available for testing and small workloads

## Implementation Timeline

- **Week 1**: Azure setup and index configuration
- **Week 2**: Data migration and basic search implementation
- **Week 3**: Advanced features and testing
- **Week 4**: Performance optimization and deployment

## Risk Mitigation

- **Parallel deployment**: Run both systems during transition
- **Gradual migration**: Migrate one source at a time
- **Rollback plan**: Keep Qdrant as backup during testing
- **Performance monitoring**: Track key metrics during migration

