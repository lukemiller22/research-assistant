const { SearchClient, SearchIndexClient, AzureKeyCredential } = require('@azure/search-documents');
const OpenAI = require('openai');
require('dotenv').config({ path: './.env' });

class AzureSearchClient {
  constructor() {
    this.searchClient = new SearchClient(
      process.env.AZURE_SEARCH_ENDPOINT,
      process.env.AZURE_SEARCH_INDEX_NAME,
      new AzureKeyCredential(process.env.AZURE_SEARCH_API_KEY)
    );
    
    this.indexClient = new SearchIndexClient(
      process.env.AZURE_SEARCH_ENDPOINT,
      new AzureKeyCredential(process.env.AZURE_SEARCH_API_KEY)
    );
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  // Create or update the search index
  async createIndex() {
    const indexDefinition = {
      name: process.env.AZURE_SEARCH_INDEX_NAME,
      fields: [
        {
          name: "id",
          type: "Edm.String",
          key: true
        },
        {
          name: "content",
          type: "Edm.String",
          searchable: true,
          analyzer: "en.microsoft"
        },
        {
          name: "source_id",
          type: "Edm.String",
          filterable: true,
          facetable: true
        },
        {
          name: "source_title",
          type: "Edm.String",
          searchable: true,
          filterable: true
        },
        {
          name: "author",
          type: "Edm.String",
          searchable: true,
          filterable: true
        },
        {
          name: "year",
          type: "Edm.String",
          filterable: true
        },
        {
          name: "genre",
          type: "Edm.String",
          filterable: true
        },
        {
          name: "chunk_index",
          type: "Edm.Int32",
          filterable: true,
          sortable: true
        },
        {
          name: "structure_path",
          type: "Edm.String",
          searchable: true
        },
        {
          name: "syntopicon_tags",
          type: "Collection(Edm.String)",
          searchable: true,
          filterable: true
        },
        {
          name: "rhetorical_function",
          type: "Collection(Edm.String)",
          searchable: true,
          filterable: true
        },
        {
          name: "topics",
          type: "Collection(Edm.String)",
          searchable: true,
          filterable: true
        },
        {
          name: "scripture_refs",
          type: "Collection(Edm.String)",
          searchable: true,
          filterable: true
        },
        {
          name: "entities_people",
          type: "Collection(Edm.String)",
          searchable: true,
          filterable: true
        },
        {
          name: "entities_works",
          type: "Collection(Edm.String)",
          searchable: true,
          filterable: true
        },
        {
          name: "is_community",
          type: "Edm.Boolean",
          filterable: true
        },
        {
          name: "community_source_id",
          type: "Edm.String",
          filterable: true
        }
      ],
    };

    try {
      await this.indexClient.createOrUpdateIndex(indexDefinition);
      console.log('Azure Search index created/updated successfully');
    } catch (error) {
      console.error('Error creating/updating index:', error);
      throw error;
    }
  }

  // Upload documents to Azure Search
  async uploadDocuments(documents) {
    try {
      const result = await this.searchClient.uploadDocuments(documents);
      console.log(`Uploaded ${result.length} documents to Azure Search`);
      return result;
    } catch (error) {
      console.error('Error uploading documents:', error);
      throw error;
    }
  }

  // Convert Qdrant payload to Azure Search document format
  convertToAzureFormat(qdrantPoint) {
    const payload = qdrantPoint.payload;
    
    return {
      id: qdrantPoint.id,
      content: payload.content,
      contentVector: qdrantPoint.vector,
      source_id: payload.source_id,
      source_title: payload.source_title,
      author: payload.author,
      year: payload.year,
      genre: payload.genre,
      chunk_index: payload.chunk_index,
      structure_path: payload.structure_path,
      syntopicon_tags: payload.syntopicon_tags || [],
      rhetorical_function: payload.rhetorical_function || [],
      topics: payload.topics || [],
      scripture_refs: payload.scripture_refs || [],
      entities_people: payload.entities?.people || [],
      entities_works: payload.entities?.works || [],
      is_community: payload.is_community || false,
      community_source_id: payload.community_source_id || ''
    };
  }

  // Simple text search (for now, since we don't have vector search set up)
  async hybridSearch(query, options = {}) {
    const {
      limit = 200,
      filters = [],
      sourceFilter = null
    } = options;

    try {
      // Build filter string
      let filterString = '';
      if (filters.length > 0) {
        filterString = filters.join(' and ');
      }
      if (sourceFilter) {
        filterString = filterString ? 
          `${filterString} and source_id eq '${sourceFilter}'` : 
          `source_id eq '${sourceFilter}'`;
      }

      // Execute search using the correct API
      const searchResults = await this.searchClient.search(query, {
        filter: filterString || undefined,
        top: limit,
        select: [
          "id",
          "content",
          "source_id",
          "source_title",
          "author",
          "year",
          "genre",
          "chunk_index",
          "structure_path",
          "syntopicon_tags",
          "rhetorical_function",
          "topics",
          "scripture_refs",
          "entities_people",
          "entities_works",
          "is_community",
          "community_source_id"
        ]
      });
      
      const results = [];

      for await (const result of searchResults.results) {
        // Use Azure's native scores as-is
        const score = result.score || 1.0;
        
        results.push({
          id: result.document.id,
          content: result.document.content,
          source_id: result.document.source_id,
          source_title: result.document.source_title,
          author: result.document.author,
          year: result.document.year,
          genre: result.document.genre,
          chunk_index: result.document.chunk_index,
          structure_path: result.document.structure_path,
          syntopicon_tags: result.document.syntopicon_tags || [],
          rhetorical_function: result.document.rhetorical_function || [],
          topics: result.document.topics || [],
          scripture_refs: result.document.scripture_refs || [],
          entities_people: result.document.entities_people || [],
          entities_works: result.document.entities_works || [],
          is_community: result.document.is_community || false,
          community_source_id: result.document.community_source_id || '',
          score: score
        });
      }

      return results;

    } catch (error) {
      console.error('Azure Search error:', error);
      throw error;
    }
  }

  // Vector-only search (for comparison)
  async vectorSearch(query, options = {}) {
    return this.hybridSearch(query, { ...options, textSearch: false, semanticSearch: false });
  }

  // Text-only search (for comparison)
  async textSearch(query, options = {}) {
    return this.hybridSearch(query, { ...options, vectorSearch: false, semanticSearch: false });
  }

  // Delete documents by source_id
  async deleteBySourceId(sourceId) {
    try {
      const deleteRequest = {
        key: sourceId,
        keyName: "source_id"
      };
      
      await this.searchClient.deleteDocuments([deleteRequest]);
      console.log(`Deleted documents for source_id: ${sourceId}`);
    } catch (error) {
      console.error('Error deleting documents:', error);
      throw error;
    }
  }

  // Get index statistics
  async getIndexStats() {
    try {
      const stats = await this.indexClient.getIndexStatistics(process.env.AZURE_SEARCH_INDEX_NAME);
      return stats;
    } catch (error) {
      console.error('Error getting index stats:', error);
      throw error;
    }
  }

  // Delete all documents from the index
  async deleteAllDocuments() {
    try {
      console.log('Deleting all documents from Azure Search index...');
      
      // Get all document IDs first
      const allDocs = await this.hybridSearch('*', { limit: 10000 });
      const docIds = allDocs.map(doc => doc.id);
      
      if (docIds.length === 0) {
        console.log('No documents to delete');
        return { deletedCount: 0 };
      }
      
      console.log(`Found ${docIds.length} documents to delete`);
      
      // Delete documents in batches
      const batchSize = 50;
      let totalDeleted = 0;
      
      for (let i = 0; i < docIds.length; i += batchSize) {
        const batch = docIds.slice(i, i + batchSize);
        const deleteResult = await this.searchClient.deleteDocuments(
          batch.map(id => ({ id }))
        );
        
        const batchDeleted = deleteResult.results.filter(r => r.succeeded).length;
        totalDeleted += batchDeleted;
        
        console.log(`Deleted batch ${Math.floor(i/batchSize) + 1}: ${batchDeleted}/${batch.length} documents`);
      }
      
      console.log(`Total documents deleted: ${totalDeleted}`);
      return { deletedCount: totalDeleted };
      
    } catch (error) {
      console.error('Error deleting documents:', error);
      throw error;
    }
  }

  // Delete documents by source
  async deleteDocumentsBySource(sourceTitle) {
    try {
      console.log(`Deleting documents from source: ${sourceTitle}`);
      
      // Get all documents from this source
      const sourceDocs = await this.hybridSearch('*', { limit: 10000 });
      const docIds = sourceDocs
        .filter(doc => doc.source_title === sourceTitle)
        .map(doc => doc.id);
      
      if (docIds.length === 0) {
        console.log(`No documents found for source: ${sourceTitle}`);
        return { deletedCount: 0 };
      }
      
      console.log(`Found ${docIds.length} documents to delete from ${sourceTitle}`);
      
      // Delete documents in batches
      const batchSize = 50;
      let totalDeleted = 0;
      
      for (let i = 0; i < docIds.length; i += batchSize) {
        const batch = docIds.slice(i, i + batchSize);
        const deleteResult = await this.searchClient.deleteDocuments(
          batch.map(id => ({ id }))
        );
        
        const batchDeleted = deleteResult.results.filter(r => r.succeeded).length;
        totalDeleted += batchDeleted;
        
        console.log(`Deleted batch ${Math.floor(i/batchSize) + 1}: ${batchDeleted}/${batch.length} documents`);
      }
      
      console.log(`Total documents deleted from ${sourceTitle}: ${totalDeleted}`);
      return { deletedCount: totalDeleted };
      
    } catch (error) {
      console.error('Error deleting documents by source:', error);
      throw error;
    }
  }

  // Delete documents without metadata
  async deleteDocumentsWithoutMetadata() {
    try {
      console.log('Deleting documents without metadata...');
      
      // Get all documents
      const allDocs = await this.hybridSearch('*', { limit: 10000 });
      
      // Find documents without metadata
      const docsWithoutMetadata = allDocs.filter(doc => 
        !doc.syntopicon_tags || 
        doc.syntopicon_tags.length === 0
      );
      
      if (docsWithoutMetadata.length === 0) {
        console.log('No documents without metadata found');
        return { deletedCount: 0 };
      }
      
      console.log(`Found ${docsWithoutMetadata.length} documents without metadata`);
      
      const docIds = docsWithoutMetadata.map(doc => doc.id);
      
      // Delete documents in batches
      const batchSize = 50;
      let totalDeleted = 0;
      
      for (let i = 0; i < docIds.length; i += batchSize) {
        const batch = docIds.slice(i, i + batchSize);
        const deleteResult = await this.searchClient.deleteDocuments(
          batch.map(id => ({ id }))
        );
        
        const batchDeleted = deleteResult.results.filter(r => r.succeeded).length;
        totalDeleted += batchDeleted;
        
        console.log(`Deleted batch ${Math.floor(i/batchSize) + 1}: ${batchDeleted}/${batch.length} documents`);
      }
      
      console.log(`Total documents without metadata deleted: ${totalDeleted}`);
      return { deletedCount: totalDeleted };
      
    } catch (error) {
      console.error('Error deleting documents without metadata:', error);
      throw error;
    }
  }
}

module.exports = AzureSearchClient;
