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
}); // Added this missing closing brace

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

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Supabase URL:', process.env.SUPABASE_URL ? 'Connected' : 'Missing');
});