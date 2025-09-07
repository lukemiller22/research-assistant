// Load environment variables
require('dotenv').config({ path: '../.env' });

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { QdrantClient } = require('@qdrant/js-client-rest');
const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Qdrant client
const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Research Assistant Backend is running!' });
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

// Test OpenAI embeddings
app.get('/test-embeddings', async (req, res) => {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: "This is a test sentence for embedding.",
    });
    
    res.json({ 
      message: 'OpenAI embeddings working!', 
      embedding_length: response.data[0].embedding.length,
      tokens_used: response.usage.total_tokens
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'OpenAI connection failed', 
      error: error.message 
    });
  }
});

// Test database tables
app.get('/test-tables', async (req, res) => {
  try {
    // Test inserting a sample source
    const { data: source, error: sourceError } = await supabase
      .from('sources')
      .insert({
        title: 'Test Book',
        author: 'Test Author',
        source_type: 'pdf',
        user_id: null // no user for testing
      })
      .select()
      .single();

    if (sourceError) throw sourceError;

    // Test inserting a sample chunk
    const { data: chunk, error: chunkError } = await supabase
      .from('source_chunks')
      .insert({
        source_id: source.id,
        content: 'This is a test chunk of text from the book.',
        chunk_index: 1,
        structure_path: 'Chapter 1'
      })
      .select()
      .single();

    if (chunkError) throw chunkError;

    // Clean up test data
    await supabase.from('source_chunks').delete().eq('id', chunk.id);
    await supabase.from('sources').delete().eq('id', source.id);

    res.json({ 
      message: 'Database tables working correctly!',
      test_source_id: source.id,
      test_chunk_id: chunk.id
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Database tables test failed', 
      error: error.message 
    });
  }
});

// ===== NEW ENDPOINTS FOR TESTING =====

// Upload and process source
app.post('/upload-source', async (req, res) => {
  try {
    const { title, author, content, source_type } = req.body;
    
    // 1. Insert source into database
    const { data: source, error: sourceError } = await supabase
      .from('sources')
      .insert({
        title,
        author,
        source_type,
        user_id: null // for testing
      })
      .select()
      .single();

    if (sourceError) throw sourceError;

    // 2. Split content into chunks (simple chunking for now)
    const chunks = splitIntoChunks(content, 500); // 500 chars per chunk
    
    let chunksCreated = 0;
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      // 3. Generate embedding for chunk
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: chunk,
      });
      
      const embedding = embeddingResponse.data[0].embedding;
      
      // 4. Store chunk in database
      const { data: chunkData, error: chunkError } = await supabase
        .from('source_chunks')
        .insert({
          source_id: source.id,
          content: chunk,
          chunk_index: i,
          structure_path: `Chunk ${i + 1}`
        })
        .select()
        .single();

      if (chunkError) throw chunkError;
      
      // 5. Store embedding in Qdrant
      await qdrant.upsert('documents', {
        wait: true,
        points: [{
          id: chunkData.id,
          vector: embedding,
          payload: {
            source_id: source.id,
            source_title: title,
            content: chunk,
            chunk_index: i
          }
        }]
      });
      
      chunksCreated++;
    }

    res.json({
      message: 'Source uploaded and processed successfully',
      source_id: source.id,
      chunks_created: chunksCreated
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload source',
      details: error.message 
    });
  }
});

// Get all sources
app.get('/sources', async (req, res) => {
  try {
    const { data: sources, error } = await supabase
      .from('sources')
      .select(`
        *,
        source_chunks (count)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Add chunk count to each source
    const sourcesWithCounts = sources.map(source => ({
      ...source,
      chunk_count: source.source_chunks?.[0]?.count || 0
    }));

    res.json(sourcesWithCounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search endpoint
app.post('/search', async (req, res) => {
  try {
    const { query, limit = 5 } = req.body;
    
    // 1. Generate embedding for search query
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });
    
    const queryEmbedding = embeddingResponse.data[0].embedding;
    
    // 2. Search similar vectors in Qdrant
    const searchResult = await qdrant.search('documents', {
      vector: queryEmbedding,
      limit: limit,
      with_payload: true
    });
    
    // 3. Format results
    const results = searchResult.map(point => ({
      score: point.score,
      content: point.payload.content,
      source_title: point.payload.source_title,
      chunk_index: point.payload.chunk_index,
      source_id: point.payload.source_id
    }));

    res.json(results);

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      error: 'Search failed',
      details: error.message 
    });
  }
});

// Helper function to split text into chunks
function splitIntoChunks(text, maxChunkSize) {
  const chunks = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? '. ' : '') + sentence;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

// Create Qdrant collection if it doesn't exist
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
  } catch (error) {
    console.error('Failed to initialize Qdrant:', error);
  }
}

// Initialize Qdrant collection on startup
initializeQdrant();

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Supabase URL:', process.env.SUPABASE_URL ? 'Connected' : 'Missing');
});
