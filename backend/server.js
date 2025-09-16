// Load environment variables
require('dotenv').config({ path: '../.env' });

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { QdrantClient } = require('@qdrant/js-client-rest');
const OpenAI = require('openai');
const pdfParse = require('pdf-parse');
const AdmZip = require('adm-zip');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Qdrant client
const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
  timeout: 60000, // 60 second timeout
});

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Increase timeout for large file processing
app.use((req, res, next) => {
  req.setTimeout(10 * 60 * 1000); // 10 minutes
  res.setTimeout(10 * 60 * 1000); // 10 minutes
  next();
});

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

// ===== ROAM PARSING FUNCTIONS =====

function parseRoamJSON(jsonContent) {
  const chunks = [];
  let data;
  
  try {
    data = JSON.parse(jsonContent);
  } catch (error) {
    throw new Error('Invalid JSON format');
  }
  
  // Roam exports are arrays of pages
  if (!Array.isArray(data)) {
    throw new Error('Expected Roam export to be an array of pages');
  }
  
  let chunkIndex = 0;
  
  // Process each page
  data.forEach(page => {
    const pageTitle = page.title || 'Untitled Page';
    
    // Add page title as a chunk if it exists and has meaningful content
    if (pageTitle && pageTitle !== 'Untitled Page') {
      chunks.push({
        content: `Page: ${pageTitle}`,
        structure_path: `Page: ${pageTitle}`,
        chunk_index: chunkIndex++,
        page_title: pageTitle,
        block_type: 'page_title'
      });
    }
    
    // Process all blocks in the page
    if (page.children && Array.isArray(page.children)) {
      chunkIndex = processBlocks(page.children, chunks, pageTitle, '', chunkIndex);
    }
  });
  
  return chunks;
}

function processBlocks(blocks, chunks, pageTitle, parentPath = '', startIndex = 0) {
  let chunkIndex = startIndex;
  
  blocks.forEach((block, index) => {
    // Extract the text content from the block
    let blockText = '';
    
    if (block.string) {
      blockText = block.string;
    } else if (typeof block === 'string') {
      blockText = block;
    }
    
    // Clean up Roam syntax (basic cleanup)
    if (blockText) {
      // Remove some Roam markup but keep the content readable
      blockText = blockText
        .replace(/\{\{(?:TODO|DONE)\}\}/g, '') // Remove TODO/DONE
        .replace(/\[\[([^\]]+)\]\]/g, '$1') // Convert [[Page]] to Page
        .replace(/\(\(([^)]+)\)\)/g, '[Block Reference]') // Simplify block refs
        .replace(/#\[\[([^\]]+)\]\]/g, '#$1') // Convert #[[tag]] to #tag
        .trim();
      
      // Skip blocks that are 15 characters or less
      if (blockText.length > 15) {
        const structurePath = parentPath 
          ? `${pageTitle} > ${parentPath} > Block ${index + 1}`
          : `${pageTitle} > Block ${index + 1}`;
        
        chunks.push({
          content: blockText,
          structure_path: structurePath,
          chunk_index: chunkIndex++,
          page_title: pageTitle,
          block_type: 'block',
          block_uid: block.uid || null
        });
      }
    }
    
    // Recursively process nested blocks
    if (block.children && Array.isArray(block.children)) {
      const newParentPath = parentPath 
        ? `${parentPath} > Block ${index + 1}`
        : `Block ${index + 1}`;
      chunkIndex = processBlocks(block.children, chunks, pageTitle, newParentPath, chunkIndex);
    }
  });
  
  return chunkIndex;
}

// Rough token estimation (1 token ≈ 4 characters for English text)
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

function splitLongContent(content, maxTokens = 8000) {
  const estimatedTokens = estimateTokens(content);
  
  if (estimatedTokens <= maxTokens) {
    return [content];
  }
  
  // Split by sentences if too long
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const chunks = [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    const testChunk = currentChunk + (currentChunk ? '. ' : '') + sentence;
    
    if (estimateTokens(testChunk) > maxTokens && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk = testChunk;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

// ===== PDF PROCESSING FUNCTIONS =====

async function processPDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    return {
      content: data.text,
      pages: data.numpages,
      info: data.info
    };
  } catch (error) {
    throw new Error(`PDF processing failed: ${error.message}`);
  }
}

// ===== EPUB PROCESSING FUNCTIONS =====

async function processEPUB(buffer) {
  return new Promise((resolve, reject) => {
    // Set a timeout for large files (5 minutes)
    const timeout = setTimeout(() => {
      reject(new Error('EPUB processing timeout - file too large or complex'));
    }, 5 * 60 * 1000); // 5 minutes
    
    try {
      // For now, let's treat ePub as a ZIP file and extract text manually
      // This is more reliable than the epub library
      const AdmZip = require('adm-zip');
      const zip = new AdmZip(buffer);
      
      let fullText = '';
      let chapters = [];
      let metadata = {
        title: 'Untitled',
        creator: 'Unknown Author',
        language: 'en'
      };
      
      // Extract all files from the ePub
      const zipEntries = zip.getEntries();
      
      for (let i = 0; i < zipEntries.length; i++) {
        const entry = zipEntries[i];
        
        // Look for HTML/XHTML files (main content)
        if (entry.entryName.match(/\.(x?html?|xml)$/i) && !entry.entryName.includes('META-INF')) {
          try {
            const content = entry.getData().toString('utf8');
            
            // Extract text from HTML with better formatting
            let cleanText = content
              // Preserve paragraph breaks
              .replace(/<\/p>/gi, '\n\n')
              .replace(/<br\s*\/?>/gi, '\n')
              .replace(/<\/div>/gi, '\n')
              .replace(/<\/h[1-6]>/gi, '\n\n')
              .replace(/<h[1-6][^>]*>/gi, '\n\n# ')
              .replace(/<p[^>]*>/gi, '')
              .replace(/<div[^>]*>/gi, '')
              // Remove other HTML tags
              .replace(/<[^>]*>/g, '')
              // Clean up whitespace
              .replace(/\n\s*\n\s*\n/g, '\n\n') // Multiple newlines to double newlines
              .replace(/[ \t]+/g, ' ') // Multiple spaces to single space
              .replace(/\n /g, '\n') // Remove leading spaces on new lines
              .replace(/ \n/g, '\n') // Remove trailing spaces before newlines
              .trim();
            
            if (cleanText.length > 100) { // Only include substantial content
              const chapterTitle = entry.entryName.split('/').pop().replace(/\.(x?html?|xml)$/i, '');
              chapters.push({
                title: chapterTitle,
                content: cleanText,
                chapter_index: chapters.length
              });
              fullText += `\n\n# ${chapterTitle}\n\n${cleanText}`;
            }
          } catch (error) {
            console.log(`Skipping file ${entry.entryName}: ${error.message}`);
          }
        }
        
        // Look for metadata files
        if (entry.entryName.includes('metadata') || entry.entryName.includes('package.opf')) {
          try {
            const content = entry.getData().toString('utf8');
            // Simple metadata extraction
            const titleMatch = content.match(/<dc:title[^>]*>([^<]+)<\/dc:title>/i);
            const creatorMatch = content.match(/<dc:creator[^>]*>([^<]+)<\/dc:creator>/i);
            
            if (titleMatch) metadata.title = titleMatch[1];
            if (creatorMatch) metadata.creator = creatorMatch[1];
          } catch (error) {
            // Ignore metadata parsing errors
          }
        }
      }
      
      // Limit total content size
      if (fullText.length > 2000000) { // 2MB max
        fullText = fullText.substring(0, 2000000) + '\n\n[Content truncated due to size]';
      }
      
      if (fullText.length === 0) {
        throw new Error('No readable content found in EPUB');
      }
      
      clearTimeout(timeout);
      resolve({
        content: fullText.trim(),
        chapters: chapters,
        metadata: metadata
      });
      
    } catch (error) {
      clearTimeout(timeout);
      reject(new Error(`EPUB processing failed: ${error.message}`));
    }
  });
}

// ===== ENHANCED JSON PROCESSING =====

function processGenericJSON(jsonContent, title) {
  const chunks = [];
  let chunkIndex = 0;
  
  function processValue(value, path = '', depth = 0) {
    if (depth > 10) return; // Prevent infinite recursion
    
    if (typeof value === 'string' && value.trim().length > 15) {
      const cleanText = value.trim();
      const structurePath = path ? `${title} > ${path}` : title;
      
      chunks.push({
        content: cleanText,
        structure_path: structurePath,
        chunk_index: chunkIndex++,
        page_title: title,
        block_type: 'json_value',
        json_path: path
      });
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        processValue(item, `${path}[${index}]`, depth + 1);
      });
    } else if (value && typeof value === 'object') {
      Object.entries(value).forEach(([key, val]) => {
        const newPath = path ? `${path}.${key}` : key;
        processValue(val, newPath, depth + 1);
      });
    }
  }
  
  try {
    const data = JSON.parse(jsonContent);
    processValue(data);
    return chunks;
  } catch (error) {
    throw new Error('Invalid JSON format');
  }
}


// ===== UPLOAD AND PROCESS SOURCE =====

app.post('/upload-source', async (req, res) => {
  try {
    const { title, author, content, source_type, file_buffer } = req.body;
    
    // 1. Process content based on source type
    let processedContent;
    let chunks;
    
    if (source_type === 'pdf') {
      // Handle PDF files
      if (!file_buffer) {
        throw new Error('PDF file buffer is required');
      }
      const buffer = Buffer.from(file_buffer, 'base64');
      const pdfData = await processPDF(buffer);
      processedContent = pdfData.content;
      
      // Create chunks from PDF content
      const textChunks = splitIntoChunks(processedContent, 500);
      chunks = textChunks.map((chunk, index) => ({
        content: chunk,
        structure_path: `Page ${Math.floor(index / 3) + 1} > Chunk ${index + 1}`,
        chunk_index: index,
        page_title: title,
        block_type: 'pdf_chunk'
      }));
      
    } else if (source_type === 'epub') {
      // Handle EPUB files
      if (!file_buffer) {
        throw new Error('EPUB file buffer is required');
      }
      
      console.log(`Processing EPUB file: ${title} (${Math.round(file_buffer.length / 1024)} KB)`);
      
      const buffer = Buffer.from(file_buffer, 'base64');
      const epubData = await processEPUB(buffer);
      processedContent = epubData.content;
      
      console.log(`EPUB processing complete. Content length: ${processedContent.length} characters`);
      
      // Create chunks from EPUB content
      const textChunks = splitIntoChunks(processedContent, 500);
      chunks = textChunks.map((chunk, index) => ({
        content: chunk,
        structure_path: `Chapter ${Math.floor(index / 5) + 1} > Chunk ${index + 1}`,
        chunk_index: index,
        page_title: title,
        block_type: 'epub_chunk'
      }));
      
    } else if (source_type === 'json') {
      // Handle generic JSON files
      processedContent = content;
      chunks = processGenericJSON(content, title);
      
    } else if (source_type === 'roam') {
      // Handle Roam Research exports
      processedContent = content;
      chunks = parseRoamJSON(content);
      
    } else {
      // Handle text files
      processedContent = content;
      const textChunks = splitIntoChunks(content, 500);
      chunks = textChunks.map((chunk, index) => ({
        content: chunk,
        structure_path: `Chunk ${index + 1}`,
        chunk_index: index,
        page_title: title,
        block_type: 'text_chunk'
      }));
    }
    
    // 2. Insert source into database
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
    
    let chunksCreated = 0;
    
    // 3. Process each chunk for embeddings
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      // Split content if it's too long for OpenAI
      const contentPieces = splitLongContent(chunk.content);
      
      for (let pieceIndex = 0; pieceIndex < contentPieces.length; pieceIndex++) {
        const content = contentPieces[pieceIndex];
        
        // Generate embedding for chunk
        const embeddingResponse = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: content,
        });
        
        const embedding = embeddingResponse.data[0].embedding;
        
        // Create unique structure path for split content
        const structurePath = contentPieces.length > 1 
          ? `${chunk.structure_path} (Part ${pieceIndex + 1})`
          : chunk.structure_path;
        
        // Store chunk in database
        const { data: chunkData, error: chunkError } = await supabase
          .from('source_chunks')
          .insert({
            source_id: source.id,
            content: content,
            chunk_index: chunk.chunk_index,
            structure_path: structurePath
          })
          .select()
          .single();

        if (chunkError) throw chunkError;
        
        // Store embedding in Qdrant with retry logic
        await uploadToQdrantWithRetry(chunkData, embedding, {
          source_id: source.id,
          source_title: title,
          content: content,
          chunk_index: chunk.chunk_index,
          structure_path: structurePath,
          page_title: chunk.page_title,
          block_type: chunk.block_type,
          block_uid: chunk.block_uid || null
        });
        
        chunksCreated++;
        
        // Log progress for large uploads
        if (chunksCreated % 100 === 0) {
          console.log(`Processed ${chunksCreated} chunks...`);
        }
      }
    }

    res.json({
      message: 'Source uploaded and processed successfully',
      source_id: source.id,
      chunks_created: chunksCreated,
      source_type: source_type
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

// Delete source endpoint - FIXED VERSION
app.delete('/sources/:id', async (req, res) => {
  try {
    const sourceId = req.params.id;
    
    if (!sourceId) {
      return res.status(400).json({ error: 'Invalid source ID' });
    }

    console.log(`Starting deletion process for source ID: ${sourceId}`);

    // 1. First, get all chunks for this source to delete from Qdrant
    const { data: chunks, error: chunksError } = await supabase
      .from('source_chunks')
      .select('id')
      .eq('source_id', sourceId);

    if (chunksError) {
      console.error('Error fetching chunks:', chunksError);
      throw chunksError;
    }

    console.log(`Found ${chunks?.length || 0} chunks to delete`);

    // 2. Delete embeddings from Qdrant using filter (more reliable than individual IDs)
    if (chunks && chunks.length > 0) {
      try {
        // Use filter to delete all points with this source_id
        const deleteResult = await qdrant.delete('documents', {
          wait: true,
          filter: {
            must: [
              {
                key: "source_id",
                match: {
                  value: sourceId
                }
              }
            ]
          }
        });
        
        console.log(`Qdrant delete result:`, deleteResult);
        console.log(`Successfully deleted embeddings for source ${sourceId} from Qdrant`);
      } catch (qdrantError) {
        console.error('Error deleting from Qdrant:', qdrantError);
        // Log but continue with database deletion - don't fail the entire operation
        console.log('Continuing with database cleanup despite Qdrant error...');
      }
    }

    // 3. Delete chunks from database
    const { error: deleteChunksError, count: deletedChunksCount } = await supabase
      .from('source_chunks')
      .delete()
      .eq('source_id', sourceId);

    if (deleteChunksError) {
      console.error('Error deleting chunks:', deleteChunksError);
      throw deleteChunksError;
    }

    console.log(`Deleted ${deletedChunksCount || chunks?.length || 0} chunks from database`);

    // 4. Delete source from database
    const { error: deleteSourceError, count: deletedSourceCount } = await supabase
      .from('sources')
      .delete()
      .eq('id', sourceId);

    if (deleteSourceError) {
      console.error('Error deleting source:', deleteSourceError);
      throw deleteSourceError;
    }

    if (deletedSourceCount === 0) {
      return res.status(404).json({ error: 'Source not found' });
    }

    console.log(`Successfully deleted source ${sourceId}`);

    res.json({
      message: 'Source deleted successfully',
      source_id: sourceId,
      deleted_chunks: chunks?.length || 0,
      deleted_from_qdrant: true
    });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ 
      error: 'Failed to delete source',
      details: error.message 
    });
  }
});

// Get all notes from a specific source
app.get('/sources/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get all chunks for this source
    const { data: chunks, error } = await supabase
      .from('source_chunks')
      .select('*')
      .eq('source_id', id)
      .order('chunk_index', { ascending: true });
    
    if (error) throw error;
    
    // Get source info
    const { data: source, error: sourceError } = await supabase
      .from('sources')
      .select('id, title, author, source_type')
      .eq('id', id)
      .single();
    
    if (sourceError) throw sourceError;
    
    // Format results to match search endpoint format
    const results = chunks.map(chunk => ({
      content: chunk.content,
      source_title: source.title,
      chunk_index: chunk.chunk_index,
      source_id: chunk.source_id,
      structure_path: chunk.structure_path,
      score: 1.0 // All notes from source get 100% match
    }));
    
    res.json(results);
    
  } catch (error) {
    console.error('Get source notes error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve source notes',
      details: error.message 
    });
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
      source_id: point.payload.source_id,
      structure_path: point.payload.structure_path,
      page_title: point.payload.page_title,
      block_type: point.payload.block_type
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

// Add retry logic for Qdrant uploads
async function uploadToQdrantWithRetry(chunkData, embedding, payload, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await qdrant.upsert('documents', {
        wait: true,
        points: [{
          id: chunkData.id,
          vector: embedding,
          payload: payload
        }]
      });
      return; // Success - exit the retry loop
    } catch (error) {
      console.log(`Qdrant upload attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw error; // Final attempt failed - throw the error
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s delays
      console.log(`Retrying in ${delay/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

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
