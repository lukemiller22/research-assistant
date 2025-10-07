// Load environment variables
require('dotenv').config({ path: '../.env' });

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { QdrantClient } = require('@qdrant/js-client-rest');
const AzureSearchClient = require('../azure-search-client');
const OpenAI = require('openai');
const pdfParse = require('pdf-parse');
const AdmZip = require('adm-zip');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Qdrant client (for fallback)
const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
  timeout: 60000,
});

// Initialize Azure Search client
const azureClient = new AzureSearchClient();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// Increase timeout for large file processing
app.use((req, res, next) => {
  req.setTimeout(6 * 60 * 60 * 1000);
  res.setTimeout(6 * 60 * 60 * 1000);
  next();
});

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Configuration
const USE_AZURE_SEARCH = process.env.USE_AZURE_SEARCH === 'true';
const SEARCH_PROVIDER = USE_AZURE_SEARCH ? 'Azure Cognitive Search' : 'Qdrant';

console.log(`Search provider: ${SEARCH_PROVIDER}`);

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Research Assistant Backend is running!',
    searchProvider: SEARCH_PROVIDER
  });
});

// Test Azure Search connection
app.get('/test-azure', async (req, res) => {
  try {
    const stats = await azureClient.getIndexStats();
    res.json({ 
      message: 'Azure Cognitive Search connected successfully!', 
      stats: stats
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Azure Cognitive Search connection failed', 
      error: error.message 
    });
  }
});

// Test Qdrant connection
app.get('/test-qdrant', async (req, res) => {
  try {
    const collections = await qdrant.getCollections();
    res.json({ 
      message: 'Qdrant connected successfully!', 
      collections: collections.collections 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Qdrant connection failed', 
      error: error.message 
    });
  }
});

// Test Supabase connection
app.get('/test-db', async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('count');
    if (error) {
      res.json({ message: 'Supabase connected! (Tables not created yet)', error: error.message });
    } else {
      res.json({ message: 'Supabase connected and working!', data });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Hybrid search endpoint with provider selection
app.post('/search', async (req, res) => {
  try {
    console.log('=== HYBRID SEARCH REQUEST RECEIVED ===');
    const { query, limit = 200 } = req.body;
    console.log(`Search query: "${query}", limit: ${limit}, provider: ${SEARCH_PROVIDER}`);
    
    let results;
    
    if (USE_AZURE_SEARCH) {
      // Use Azure Cognitive Search
      results = await azureClient.hybridSearch(query, {
        limit: limit, // Get full limit for better filtering
        semanticSearch: true,
        vectorSearch: true,
        textSearch: true
      });
      
      // Transform Azure results to match expected format
      results = results.map(result => ({
        content: result.content,
        source_title: result.source_title,
        chunk_index: result.chunk_index,
        source_id: result.source_id,
        structure_path: result.structure_path,
        score: result.score,
        // Add metadata fields for compatibility
        syntopicon_tags: result.syntopicon_tags || [],
        rhetorical_function: result.rhetorical_function || [],
        topics: result.topics || [],
        scripture_refs: result.scripture_refs || [],
        entities: {
          people: result.entities_people || [],
          works: result.entities_works || []
        },
        // Azure-specific fields
        highlights: result.highlights,
        captions: result.captions,
        answers: result.answers
      }));
      
      // Apply metadata boosting and re-ranking (same as Qdrant)
      console.log('Stage 2: Applying metadata boosting and re-ranking...');
      const queryAnalysis = analyzeQuery(query);
      console.log('Query analysis:', queryAnalysis);
      
      const boostedResults = applyMetadataBoosting(results, queryAnalysis);
      
      // Sort by final score and limit results
      results = boostedResults
        .sort((a, b) => b.finalScore - a.finalScore)
        .slice(0, limit);
      
    } else {
      // Use Qdrant (existing implementation)
      results = await performQdrantSearch(query, limit);
    }
    
    console.log(`Search returned ${results.length} results`);
    
    res.json(results);

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      error: 'Search failed',
      details: error.message 
    });
  }
});

// Qdrant search implementation (existing logic)
async function performQdrantSearch(query, limit) {
  // Stage 1: Semantic Search
  console.log('Stage 1: Performing semantic search...');
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
  });
  
  const queryEmbedding = embeddingResponse.data[0].embedding;
  
  // Get more candidates for re-ranking
  const searchResult = await qdrant.search('documents', {
    vector: queryEmbedding,
    limit: 50,
    with_payload: true
  });
  
  console.log(`Qdrant search returned ${searchResult.length} results`);
  
  // Filter results to only include chunks from existing sources
  const sourceIds = [...new Set(searchResult.map(point => point.payload.source_id))];
  const { data: existingSources, error: sourcesError } = await supabase
    .from('sources')
    .select('id')
    .in('id', sourceIds);
  
  if (sourcesError) throw sourcesError;
  
  const existingSourceIds = new Set(existingSources.map(source => source.id));
  const validResults = searchResult.filter(point => 
    existingSourceIds.has(point.payload.source_id)
  );
  
  console.log(`After filtering, ${validResults.length} valid results remain`);
  
  // Stage 2: Metadata Boosting & Re-ranking
  console.log('Stage 2: Applying metadata boosting and re-ranking...');
  const queryAnalysis = analyzeQuery(query);
  console.log('Query analysis:', queryAnalysis);
  
  const boostedResults = applyMetadataBoosting(validResults.map(point => ({
    score: point.score,
    content: point.payload.content,
    source_title: point.payload.source_title,
    chunk_index: point.payload.chunk_index,
    source_id: point.payload.source_id,
    structure_path: point.payload.structure_path,
    page_title: point.payload.page_title,
    block_type: point.payload.block_type,
    heading_level: point.payload.heading_level,
    primary_category: point.payload.primary_category,
    secondary_category: point.payload.secondary_category,
    proper_nouns: point.payload.proper_nouns || [],
    concept_tags: point.payload.concept_tags || [],
    biblical_refs: point.payload.biblical_refs || [],
    topic_tags: point.payload.topic_tags || [],
    ai_curated: point.payload.ai_curated || false,
    curation_timestamp: point.payload.curation_timestamp,
    // Rich metadata for boosting
    syntopicon_tags: point.payload.syntopicon_tags || [],
    rhetorical_function: point.payload.rhetorical_function || [],
    topics: point.payload.topics || [],
    entities: point.payload.entities || {},
    scripture_refs: point.payload.scripture_refs || []
  })), queryAnalysis);
  
  // Sort by final score and limit results
  const finalResults = boostedResults
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, limit);
  
  console.log(`Final results: ${finalResults.length}`);
  
  return finalResults;
}

// Query analysis function (existing)
function analyzeQuery(query) {
  const queryLower = query.toLowerCase();
  
  return {
    isArgumentative: /\b(argument|evidence|claim|because|why|reason|prove|support|defend|refute|contradict|disagree|agree)\b/.test(queryLower),
    isPractical: /\b(how to|advice|strategy|should|steps|guide|method|technique|process|way to)\b/.test(queryLower),
    isNarrative: /\b(story|experience|tell me about|describe|narrative|anecdote|example|case)\b/.test(queryLower),
    isConceptual: /\b(what is|define|concept|meaning|theory|principle|idea|notion)\b/.test(queryLower),
    
    keyTerms: queryLower.split(/\s+/).filter(term => 
      term.length > 2 && 
      !['the', 'and', 'or', 'but', 'for', 'with', 'about', 'from', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once'].includes(term)
    )
  };
}

// Metadata boosting function (existing)
function applyMetadataBoosting(results, queryAnalysis) {
  const queryLower = queryAnalysis.keyTerms.join(' ').toLowerCase();
  
  return results.map(result => {
    let boostScore = 1.0;
    const boostReasons = [];
    
    // Rhetorical function boosting based on intent (smaller boosts for Azure scores)
    if (queryAnalysis.isArgumentative && result.rhetorical_function?.includes('logical')) {
      boostScore *= 1.15;
      boostReasons.push('logical argument match');
    }
    
    if (queryAnalysis.isPractical && result.rhetorical_function?.includes('practical')) {
      boostScore *= 1.15;
      boostReasons.push('practical advice match');
    }
    
    if (queryAnalysis.isNarrative && result.rhetorical_function?.includes('narrative')) {
      boostScore *= 1.15;
      boostReasons.push('narrative content match');
    }
    
    if (queryAnalysis.isConceptual && result.rhetorical_function?.includes('semantic')) {
      boostScore *= 1.1;
      boostReasons.push('conceptual content match');
    }
    
    // Syntopicon tag matches (smaller boosts for Azure scores)
    if (result.syntopicon_tags && Array.isArray(result.syntopicon_tags)) {
      for (const tag of result.syntopicon_tags) {
        if (queryLower.includes(tag.toLowerCase())) {
          boostScore *= 1.1;
          boostReasons.push(`syntopicon tag: ${tag}`);
        }
      }
    }
    
    // Topic matches (smaller boosts for Azure scores)
    if (result.topics && Array.isArray(result.topics)) {
      for (const topic of result.topics) {
        if (queryLower.includes(topic.toLowerCase())) {
          boostScore *= 1.05;
          boostReasons.push(`topic: ${topic}`);
        }
      }
    }
    
    // Entity matches (people, works) - smaller boosts for Azure scores
    if (result.entities) {
      if (result.entities.people && Array.isArray(result.entities.people)) {
        for (const person of result.entities.people) {
          if (queryLower.includes(person.toLowerCase())) {
            boostScore *= 1.1;
            boostReasons.push(`person: ${person}`);
          }
        }
      }
      
      if (result.entities.works && Array.isArray(result.entities.works)) {
        for (const work of result.entities.works) {
          if (queryLower.includes(work.toLowerCase())) {
            boostScore *= 1.1;
            boostReasons.push(`work: ${work}`);
          }
        }
      }
    }
    
    // Scripture reference matches (smaller boosts for Azure scores)
    if (result.scripture_refs && Array.isArray(result.scripture_refs)) {
      for (const ref of result.scripture_refs) {
        if (queryLower.includes(ref.toLowerCase())) {
          boostScore *= 1.15;
          boostReasons.push(`scripture: ${ref}`);
        }
      }
    }
    
    return {
      ...result,
      semanticScore: result.score,
      finalScore: result.score * boostScore,
      boostScore: boostScore,
      boostReasons: boostReasons
    };
  });
}

// Upload documents to the selected search provider
app.post('/upload-documents', async (req, res) => {
  try {
    const { documents } = req.body;
    
    if (!documents || !Array.isArray(documents)) {
      return res.status(400).json({ error: 'Documents array is required' });
    }
    
    console.log(`Uploading ${documents.length} documents to ${SEARCH_PROVIDER}...`);
    
    if (USE_AZURE_SEARCH) {
      // Upload to Azure Search
      const result = await azureClient.uploadDocuments(documents);
      res.json({
        message: `Successfully uploaded ${result.length} documents to Azure Cognitive Search`,
        provider: 'Azure Cognitive Search',
        count: result.length
      });
    } else {
      // Upload to Qdrant (existing logic)
      let successCount = 0;
      
      for (const doc of documents) {
        try {
          await qdrant.upsert('documents', {
            wait: true,
            points: [{
              id: doc.id,
              vector: doc.vector,
              payload: doc.payload
            }]
          });
          successCount++;
        } catch (error) {
          console.error(`Error uploading document ${doc.id}:`, error.message);
        }
      }
      
      res.json({
        message: `Successfully uploaded ${successCount} documents to Qdrant`,
        provider: 'Qdrant',
        count: successCount
      });
    }
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload documents',
      details: error.message 
    });
  }
});

// Get search provider info
app.get('/search-provider', (req, res) => {
  res.json({
    provider: SEARCH_PROVIDER,
    features: USE_AZURE_SEARCH ? [
      'Hybrid Search (Vector + Text)',
      'Semantic Re-ranking',
      'Advanced Filtering',
      'Managed Service',
      'Built-in High Availability'
    ] : [
      'Vector Search',
      'Custom Metadata Boosting',
      'Payload Filtering',
      'Self-hosted',
      'Open Source'
    ]
  });
});

// Filter options endpoints
app.get('/api/filter-options', async (req, res) => {
  try {
    const { type } = req.query;
    
    if (!type) {
      return res.status(400).json({ error: 'Filter type is required' });
    }
    
    let options = [];
    
    if (USE_AZURE_SEARCH) {
      // Get options from Azure Search
      const results = await azureClient.hybridSearch('*', { limit: 1000 });
      
      switch (type) {
        case 'authors':
          options = [...new Set(results.map(r => r.author).filter(a => a && a !== 'Unknown Author'))];
          break;
        case 'sources':
          options = [...new Set(results.map(r => r.source_title))];
          break;
        case 'rhetorical':
          options = [...new Set(results.flatMap(r => r.rhetorical_function || []))];
          break;
        case 'syntopicon':
          options = [...new Set(results.flatMap(r => r.syntopicon_tags || []))];
          break;
        case 'topics':
          options = [...new Set(results.flatMap(r => r.topics || []))];
          break;
        case 'scriptures':
          options = [...new Set(results.flatMap(r => r.scripture_refs || []))];
          break;
        default:
          return res.status(400).json({ error: 'Invalid filter type' });
      }
    } else {
      // Get options from Qdrant (existing logic)
      // This would need to be implemented based on your current Qdrant setup
      options = [];
    }
    
    res.json({ options: options.sort() });
    
  } catch (error) {
    console.error('Error getting filter options:', error);
    res.status(500).json({ error: 'Failed to get filter options' });
  }
});

// Autocomplete endpoint
app.get('/api/autocomplete', async (req, res) => {
  try {
    const { type, query } = req.query;
    
    if (!type || !query) {
      return res.status(400).json({ error: 'Type and query are required' });
    }
    
    if (query.length < 2) {
      return res.json({ suggestions: [] });
    }
    
    let suggestions = [];
    
    if (USE_AZURE_SEARCH) {
      // Get suggestions from Azure Search
      const results = await azureClient.hybridSearch('*', { limit: 1000 });
      
      switch (type) {
        case 'scriptures':
          const allScriptures = [...new Set(results.flatMap(r => r.scripture_refs || []))];
          suggestions = allScriptures.filter(s => 
            s.toLowerCase().includes(query.toLowerCase())
          ).slice(0, 10);
          break;
        case 'syntopicon':
          const allSyntopicon = [...new Set(results.flatMap(r => r.syntopicon_tags || []))];
          suggestions = allSyntopicon.filter(s => 
            s.toLowerCase().includes(query.toLowerCase())
          ).slice(0, 10);
          break;
        case 'topics':
          const allTopics = [...new Set(results.flatMap(r => r.topics || []))];
          suggestions = allTopics.filter(s => 
            s.toLowerCase().includes(query.toLowerCase())
          ).slice(0, 10);
          break;
        default:
          return res.status(400).json({ error: 'Invalid autocomplete type' });
      }
    } else {
      // Get suggestions from Qdrant
      suggestions = [];
    }
    
    res.json({ suggestions });
    
  } catch (error) {
    console.error('Error getting autocomplete suggestions:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
});

// Sources endpoints for compatibility with frontend
app.get('/sources', async (req, res) => {
  try {
    if (!USE_AZURE_SEARCH) {
      return res.status(400).json({ error: 'Sources endpoint only available for Azure Search' });
    }
    
    // Get all unique sources from Azure Search
    const results = await azureClient.hybridSearch('*', { limit: 1000 });
    const sources = [];
    const sourceMap = new Map();
    
    results.forEach(doc => {
      if (!sourceMap.has(doc.source_id)) {
        sourceMap.set(doc.source_id, {
          id: doc.source_id,
          title: doc.source_title,
          author: doc.author,
          year: doc.year,
          genre: doc.genre,
          chunk_count: 0
        });
      }
      sourceMap.get(doc.source_id).chunk_count++;
    });
    
    sources.push(...sourceMap.values());
    res.json(sources);
    
  } catch (error) {
    console.error('Error getting sources:', error);
    res.status(500).json({ error: 'Failed to get sources' });
  }
});

app.get('/sources/:sourceId/full', async (req, res) => {
  try {
    const { sourceId } = req.params;
    const { chunk } = req.query;
    
    if (!USE_AZURE_SEARCH) {
      return res.status(400).json({ error: 'Source endpoint only available for Azure Search' });
    }
    
    // Get all chunks for this source
    const results = await azureClient.hybridSearch('*', { limit: 1000 });
    const sourceChunks = results.filter(doc => doc.source_id === sourceId);
    
    if (sourceChunks.length === 0) {
      return res.status(404).json({ error: 'Source not found' });
    }
    
    // Sort by chunk_index
    sourceChunks.sort((a, b) => a.chunk_index - b.chunk_index);
    
    const source = {
      id: sourceId,
      title: sourceChunks[0].source_title,
      author: sourceChunks[0].author,
      year: sourceChunks[0].year,
      genre: sourceChunks[0].genre,
      chunks: sourceChunks.map(chunk => ({
        index: chunk.chunk_index,
        content: chunk.content,
        structure_path: chunk.structure_path
      }))
    };
    
    if (chunk !== undefined) {
      const chunkIndex = parseInt(chunk);
      const targetChunk = sourceChunks.find(c => c.chunk_index === chunkIndex);
      if (targetChunk) {
        source.highlighted_chunk = chunkIndex;
      }
    }
    
    res.json(source);
    
  } catch (error) {
    console.error('Error getting source:', error);
    res.status(500).json({ error: 'Failed to get source' });
  }
});

app.get('/sources/:sourceId/notes', async (req, res) => {
  try {
    const { sourceId } = req.params;
    
    if (!USE_AZURE_SEARCH) {
      return res.status(400).json({ error: 'Source notes endpoint only available for Azure Search' });
    }
    
    // Get all chunks for this source as "notes"
    const results = await azureClient.hybridSearch('*', { limit: 1000 });
    const sourceChunks = results.filter(doc => doc.source_id === sourceId);
    
    if (sourceChunks.length === 0) {
      return res.status(404).json({ error: 'Source not found' });
    }
    
    // Sort by chunk_index
    sourceChunks.sort((a, b) => a.chunk_index - b.chunk_index);
    
    const notes = sourceChunks.map(chunk => ({
      id: chunk.id,
      content: chunk.content,
      chunk_index: chunk.chunk_index,
      structure_path: chunk.structure_path,
      source_title: chunk.source_title,
      source_id: chunk.source_id
    }));
    
    res.json(notes);
    
  } catch (error) {
    console.error('Error getting source notes:', error);
    res.status(500).json({ error: 'Failed to get source notes' });
  }
});

// Delete endpoints for Azure Search
app.delete('/api/documents/all', async (req, res) => {
  try {
    if (!USE_AZURE_SEARCH) {
      return res.status(400).json({ error: 'Delete operations only available for Azure Search' });
    }
    
    const result = await azureClient.deleteAllDocuments();
    res.json({
      message: 'All documents deleted successfully',
      deletedCount: result.deletedCount
    });
    
  } catch (error) {
    console.error('Error deleting all documents:', error);
    res.status(500).json({ error: 'Failed to delete documents' });
  }
});

app.delete('/api/documents/source/:sourceTitle', async (req, res) => {
  try {
    if (!USE_AZURE_SEARCH) {
      return res.status(400).json({ error: 'Delete operations only available for Azure Search' });
    }
    
    const { sourceTitle } = req.params;
    const result = await azureClient.deleteDocumentsBySource(sourceTitle);
    res.json({
      message: `Documents from ${sourceTitle} deleted successfully`,
      deletedCount: result.deletedCount
    });
    
  } catch (error) {
    console.error('Error deleting documents by source:', error);
    res.status(500).json({ error: 'Failed to delete documents' });
  }
});

app.delete('/api/documents/without-metadata', async (req, res) => {
  try {
    if (!USE_AZURE_SEARCH) {
      return res.status(400).json({ error: 'Delete operations only available for Azure Search' });
    }
    
    const result = await azureClient.deleteDocumentsWithoutMetadata();
    res.json({
      message: 'Documents without metadata deleted successfully',
      deletedCount: result.deletedCount
    });
    
  } catch (error) {
    console.error('Error deleting documents without metadata:', error);
    res.status(500).json({ error: 'Failed to delete documents' });
  }
});

// Initialize services on startup
async function initializeServices() {
  try {
    if (USE_AZURE_SEARCH) {
      console.log('Initializing Azure Cognitive Search...');
      // Azure Search doesn't need initialization like Qdrant
      console.log('Azure Cognitive Search ready');
    } else {
      console.log('Initializing Qdrant...');
      await initializeQdrant();
      console.log('Qdrant initialized');
    }
    console.log('All services initialized successfully');
  } catch (error) {
    console.error('Error initializing services:', error);
  }
}

// Qdrant initialization (existing)
async function initializeQdrant() {
  try {
    const collections = await qdrant.getCollections();
    const hasDocumentsCollection = collections.collections.some(c => c.name === 'documents');
    
    if (!hasDocumentsCollection) {
      await qdrant.createCollection('documents', {
        vectors: { size: 1536, distance: 'Cosine' }
      });
      console.log('Created Qdrant collection: documents');
    }
    
    // Ensure source_id index exists for filtering
    try {
      const collectionInfo = await qdrant.getCollection('documents');
      const hasSourceIdIndex = collectionInfo.payload_schema && 
        collectionInfo.payload_schema.source_id;
      
      if (!hasSourceIdIndex) {
        console.log('Creating source_id index for filtering...');
        await qdrant.createPayloadIndex('documents', {
          field_name: 'source_id',
          field_schema: 'keyword'
        });
        console.log('Created source_id index successfully');
      } else {
        console.log('source_id index already exists');
      }
    } catch (indexError) {
      console.warn('Could not create source_id index:', indexError.message);
    }
  } catch (error) {
    console.error('Failed to initialize Qdrant:', error);
  }
}

// Initialize services and start server
initializeServices();

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Search provider: ${SEARCH_PROVIDER}`);
  console.log('Supabase URL:', process.env.SUPABASE_URL ? 'Connected' : 'Missing');
});
