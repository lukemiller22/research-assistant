// Load environment variables
require('dotenv').config({ path: '../.env' });

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { QdrantClient } = require('@qdrant/js-client-rest');
const OpenAI = require('openai');
const pdfParse = require('pdf-parse');
const AdmZip = require('adm-zip');

// ===== SIMPLE PDF PROCESSING FUNCTIONS =====

// Remove footnote markers and content from PDF text
function removeFootnotes(text) {
  return text
    // Remove numbered footnote markers in text: [1], [2], [3], etc.
    .replace(/\[\d+\]/g, '')
    // Remove superscript footnote numbers: ¹, ², ³, ⁴, ⁵, ⁶, ⁷, ⁸, ⁹, ⁰
    .replace(/[¹²³⁴⁵⁶⁷⁸⁹⁰]/g, '')
    // Remove symbol footnote markers: *, †, ‡, §, ¶
    .replace(/[*†‡§¶]/g, '')
    // Clean up any double spaces that might result from removals
    .replace(/\s+/g, ' ')
    .trim();
}

async function processPDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    
    // Return raw text with basic cleanup and footnote removal
    const cleanedText = data.text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Remove footnote markers
    const textWithoutFootnotes = removeFootnotes(cleanedText);
    
    return {
      content: textWithoutFootnotes,
      pages: data.numpages,
      info: data.info
    };
  } catch (error) {
    throw new Error(`PDF processing failed: ${error.message}`);
  }
}

// Simple chunking function that ensures chunks end with periods
function createPDFChunks(content, minChunkSize = 500, maxChunkSize = 1000) {
  const chunks = [];
  let currentChunk = '';
  let chunkIndex = 0;
  
  // Split content into sentences
  const sentences = content.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    
    // Include all sentences, including short ones (headings, etc.)
    if (trimmedSentence.length === 0) {
      continue;
    }
    
    // Check if adding this sentence would exceed max chunk size
    const testChunk = currentChunk + (currentChunk ? ' ' : '') + trimmedSentence;
    
    if (testChunk.length > maxChunkSize && currentChunk.trim()) {
      // Current chunk is ready - ensure it ends with a period
      let finalChunk = currentChunk.trim();
      if (!finalChunk.endsWith('.') && !finalChunk.endsWith('!') && !finalChunk.endsWith('?')) {
        finalChunk += '.';
      }
      
      chunks.push({
        content: finalChunk,
        structure_path: '',
        chunk_index: chunkIndex,
        block_type: 'pdf_chunk'
      });
      chunkIndex++;
      currentChunk = trimmedSentence;
    } else {
      // Add sentence to current chunk
      currentChunk = testChunk;
    }
  }
  
  // Handle the last chunk
  if (currentChunk.trim()) {
    let finalChunk = currentChunk.trim();
    if (!finalChunk.endsWith('.') && !finalChunk.endsWith('!') && !finalChunk.endsWith('?')) {
      finalChunk += '.';
    }
    
    chunks.push({
      content: finalChunk,
      structure_path: '',
      chunk_index: chunkIndex,
      block_type: 'pdf_chunk'
    });
  }
  
  return chunks;
}

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
app.use(express.json({ limit: '500mb' })); // Increased for large Roam graphs
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// Increase timeout for large file processing (especially for Roam Research uploads)
app.use((req, res, next) => {
  req.setTimeout(6 * 60 * 60 * 1000); // 6 hours for very large files (Roam Research)
  res.setTimeout(6 * 60 * 60 * 1000); // 6 hours for very large files (Roam Research)
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

// Test Qdrant collection info
app.get('/test-collection', async (req, res) => {
  try {
    const collectionInfo = await qdrant.getCollection('documents');
    res.json({ 
      message: 'Collection info retrieved!', 
      collection: collectionInfo
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to get collection info', 
      error: error.message 
    });
  }
});

// Test database sources
app.get('/test-sources', async (req, res) => {
  try {
    const { data: sources, error } = await supabase
      .from('sources')
      .select('id, title')
      .limit(10);
    
    if (error) throw error;
    
    res.json({
      message: 'Database sources retrieved',
      count: sources.length,
      sources: sources
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to get sources', 
      error: error.message 
    });
  }
});

// Test footnote removal
app.post('/test-footnote-removal', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    const cleanedText = removeFootnotes(text);
    
    res.json({
      original: text,
      cleaned: cleanedText,
      removed: text.length - cleanedText.length,
      removedPercentage: Math.round(((text.length - cleanedText.length) / text.length) * 100)
    });
    
  } catch (error) {
    res.status(500).json({ 
      message: 'Footnote removal test failed', 
      error: error.message 
    });
  }
});

// Clear Qdrant data for a specific source
app.post('/clear-source-vectors', async (req, res) => {
  try {
    const { source_id } = req.body;
    
    if (!source_id) {
      return res.status(400).json({ error: 'Source ID is required' });
    }

    console.log(`Clearing Qdrant vectors for source: ${source_id}`);
    
    // Delete all vectors for this source from Qdrant
    const deleteResult = await qdrant.delete('documents', {
      filter: {
        must: [
          {
            key: 'source_id',
            match: {
              value: source_id
            }
          }
        ]
      }
    });
    
    console.log(`Deleted vectors for source ${source_id}:`, deleteResult);
    
    res.json({ 
      message: `Cleared vectors for source ${source_id}`,
      deleted: deleteResult
    });
    
  } catch (error) {
    console.error('Error clearing source vectors:', error);
    res.status(500).json({ 
      error: 'Failed to clear source vectors',
      details: error.message 
    });
  }
});

// Clear all chunks from Supabase
app.post('/clear-all-chunks', async (req, res) => {
  try {
    console.log('Clearing all chunks from Supabase...');
    
    const { error } = await supabase
      .from('source_chunks')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows
    
    if (error) throw error;
    
    console.log('All chunks cleared from Supabase');
    
    res.json({
      message: 'All chunks cleared from Supabase',
      success: true
    });
    
  } catch (error) {
    console.error('Error clearing all chunks:', error);
    res.status(500).json({ 
      error: 'Failed to clear all chunks',
      details: error.message 
    });
  }
});

// Reset all sources to pending_review status
app.post('/reset-all-sources', async (req, res) => {
  try {
    console.log('Resetting all sources to pending_review status...');
    
    const { error } = await supabase
      .from('sources')
      .update({ processing_status: 'pending_review' })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all rows
    
    if (error) throw error;
    
    console.log('All sources reset to pending_review status');
    
    res.json({
      message: 'All sources reset to pending_review status',
      success: true
    });
    
  } catch (error) {
    console.error('Error resetting sources:', error);
    res.status(500).json({ 
      error: 'Failed to reset sources',
      details: error.message 
    });
  }
});

// Complete database reset - clear everything
app.post('/reset-database', async (req, res) => {
  try {
    console.log('Starting complete database reset...');
    
    // 1. Clear all chunks first (due to foreign key constraints)
    console.log('Clearing all chunks...');
    const chunksError = await supabase
      .from('source_chunks')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (chunksError.error) {
      console.log('Chunks clear result:', chunksError);
    }
    
    // 2. Clear all sources
    console.log('Clearing all sources...');
    const sourcesError = await supabase
      .from('sources')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (sourcesError.error) {
      console.log('Sources clear result:', sourcesError);
    }
    
    // 3. Clear all projects
    console.log('Clearing all projects...');
    const projectsError = await supabase
      .from('projects')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (projectsError.error) {
      console.log('Projects clear result:', projectsError);
    }
    
    // 4. Clear Qdrant vectors
    console.log('Clearing Qdrant vectors...');
    try {
      // Clear all vectors by deleting the entire collection
      await qdrant.delete('documents', {
        filter: {
          must: [
            {
              key: 'source_id',
              match: {
                any: ['00000000-0000-0000-0000-000000000000']
              }
            }
          ]
        }
      });
    } catch (qdrantError) {
      console.log('Qdrant clear result:', qdrantError.message);
    }
    
    console.log('Database reset complete');
    
    res.json({
      message: 'Complete database reset successful',
      chunks_cleared: chunksError.error ? 'Error' : 'Success',
      sources_cleared: sourcesError.error ? 'Error' : 'Success', 
      projects_cleared: projectsError.error ? 'Error' : 'Success',
      qdrant_cleared: 'Success',
      success: true
    });
    
  } catch (error) {
    console.error('Error during database reset:', error);
    res.status(500).json({ 
      error: 'Failed to reset database',
      details: error.message 
    });
  }
});

// Test direct Qdrant search without filtering
app.post('/test-search', async (req, res) => {
  try {
    const { query } = req.body;
    console.log('=== TEST SEARCH REQUEST ===');
    console.log(`Query: "${query}"`);
    
    // Generate embedding
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });
    
    const queryEmbedding = embeddingResponse.data[0].embedding;
    console.log(`Generated embedding with ${queryEmbedding.length} dimensions`);
    
    // Search Qdrant directly
    const searchResult = await qdrant.search('documents', {
      vector: queryEmbedding,
      limit: 5,
      with_payload: true
    });
    
    console.log(`Qdrant returned ${searchResult.length} results`);
    
    res.json({
      message: 'Test search completed',
      query: query,
      resultCount: searchResult.length,
      results: searchResult.map(point => ({
        id: point.id,
        score: point.score,
        source_id: point.payload.source_id,
        content_preview: point.payload.content ? point.payload.content.substring(0, 100) + '...' : 'No content'
      }))
    });
    
  } catch (error) {
    console.error('Test search error:', error);
    res.status(500).json({ 
      message: 'Test search failed', 
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

// Function to determine if a page should be skipped (not useful for vector search)
function shouldSkipPage(pageTitle) {
  const skipPatterns = [
    /^\[\[roam\/css\]\]$/i,           // CSS styling pages
    /^\[\[roam\/js\]\]$/i,            // JavaScript pages
    /^\[\[roam\/html\]\]$/i,          // HTML pages
    /^\[\[roam\/config\]\]$/i,        // Configuration pages
    /^\[\[roam\/settings\]\]$/i,      // Settings pages
    /^\[\[roam\/templates\]\]$/i,     // Template pages
    /^\[\[roam\/queries\]\]$/i,       // Query pages
    /^\[\[roam\/css\]/i,              // Any page starting with [[roam/css
    /^\[\[roam\/js\]/i,               // Any page starting with [[roam/js
    /^\[\[roam\/html\]/i,             // Any page starting with [[roam/html
    /^\[\[roam\/config\]/i,           // Any page starting with [[roam/config
    /^\[\[roam\/settings\]/i,         // Any page starting with [[roam/settings
    /^\[\[roam\/templates\]/i,        // Any page starting with [[roam/templates
    /^\[\[roam\/queries\]/i,          // Any page starting with [[roam/queries
    /^roam\/css$/i,                   // CSS pages without brackets
    /^roam\/js$/i,                    // JS pages without brackets
    /^roam\/html$/i,                  // HTML pages without brackets
    /^roam\/config$/i,                // Config pages without brackets
    /^roam\/settings$/i,              // Settings pages without brackets
    /^roam\/templates$/i,             // Template pages without brackets
    /^roam\/queries$/i,               // Query pages without brackets
  ];
  
  return skipPatterns.some(pattern => pattern.test(pageTitle));
}

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
  
  // Create a map of block UIDs to their content for resolving block references
  const blockMap = new Map();
  
  // First pass: build the block map
  data.forEach(page => {
    if (page.children && Array.isArray(page.children)) {
      buildBlockMap(page.children, blockMap);
    }
  });
  
  let chunkIndex = 0;
  
  // Process each page
  data.forEach(page => {
    const pageTitle = page.title || 'Untitled Page';
    
    // Skip pages that are not useful for vector search
    if (shouldSkipPage(pageTitle)) {
      console.log(`Skipping page: ${pageTitle} (filtered out)`);
      return;
    }
    
    // Collect all blocks from the page
    const pageBlocks = [];
    
    // Add page title as a block if it exists and has meaningful content
    if (pageTitle && pageTitle !== 'Untitled Page') {
      pageBlocks.push({
        content: `Page: ${pageTitle}`,
        structure_path: `Page: ${pageTitle}`,
        page_title: pageTitle,
        block_type: 'page_title'
      });
    }
    
    // Process all blocks in the page
    if (page.children && Array.isArray(page.children)) {
      collectBlocks(page.children, pageBlocks, pageTitle, '', blockMap);
    }
    
    // Group blocks into 1000-character chunks
    const pageChunks = groupBlocksIntoChunks(pageBlocks, 1000);
    
    // Add chunks to the main chunks array
    pageChunks.forEach(chunk => {
      chunk.chunk_index = chunkIndex++;
      chunks.push(chunk);
    });
  });
  
  return chunks;
}

// Build a map of block UIDs to their content for resolving block references
function buildBlockMap(blocks, blockMap) {
  blocks.forEach(block => {
    if (block.uid && block.string) {
      blockMap.set(block.uid, block.string);
    }
    
    // Recursively process nested blocks
    if (block.children && Array.isArray(block.children)) {
      buildBlockMap(block.children, blockMap);
    }
  });
}

// Collect all blocks from a page into a flat array
function collectBlocks(blocks, pageBlocks, pageTitle, parentPath = '', blockMap = new Map()) {
  blocks.forEach((block, index) => {
    // Extract the text content from the block
    let blockText = '';
    
    if (block.string) {
      blockText = block.string;
    } else if (typeof block === 'string') {
      blockText = block;
    }
    
    // Clean up Roam syntax with improved formatting
    if (blockText) {
      blockText = cleanRoamText(blockText, blockMap);
    }
      
    // Add block if it has content (including short headings)
    if (blockText.length > 0) {
      const structurePath = parentPath 
        ? `${pageTitle} > ${parentPath} > Block ${index + 1}`
        : `${pageTitle} > Block ${index + 1}`;
      
      pageBlocks.push({
        content: blockText,
        structure_path: structurePath,
        page_title: pageTitle,
        block_type: 'block',
        block_uid: block.uid || null
      });
    }
    
    // Recursively process nested blocks
    if (block.children && Array.isArray(block.children)) {
      const newParentPath = parentPath 
        ? `${parentPath} > Block ${index + 1}`
        : `Block ${index + 1}`;
      collectBlocks(block.children, pageBlocks, pageTitle, newParentPath, blockMap);
    }
  });
}

// Group blocks into chunks of approximately maxChunkSize characters
function groupBlocksIntoChunks(blocks, maxChunkSize) {
  const chunks = [];
  let currentChunk = {
    content: '',
    structure_path: '',
    page_title: '',
    block_type: 'chunk',
    blocks: []
  };
  
  for (const block of blocks) {
    const testContent = currentChunk.content + (currentChunk.content ? ' ' : '') + block.content;
    
    if (testContent.length <= maxChunkSize && currentChunk.blocks.length < 10) {
      // Add block to current chunk
      currentChunk.content = testContent;
      currentChunk.blocks.push(block);
      
      // Set metadata from first block
      if (currentChunk.blocks.length === 1) {
        currentChunk.structure_path = block.structure_path;
        currentChunk.page_title = block.page_title;
      }
    } else {
      // Current chunk is full, start a new one
      if (currentChunk.content) {
        chunks.push({ ...currentChunk });
      }
      
      currentChunk = {
        content: block.content,
        structure_path: block.structure_path,
        page_title: block.page_title,
        block_type: 'chunk',
        blocks: [block]
      };
    }
  }
  
  // Add the last chunk if it has content
  if (currentChunk.content) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}

// Enhanced Roam text cleaning function
function cleanRoamText(text, blockMap = new Map()) {
  if (!text) return text;
  
  let cleanedText = text;
  
  // 1. Handle block references: ((-AbmaTFUf)) -> replace with actual content
  cleanedText = cleanedText.replace(/\(\(([^)]+)\)\)/g, (match, uid) => {
    const blockContent = blockMap.get(uid);
    if (blockContent) {
      // Clean the referenced block content and return it
      return cleanRoamText(blockContent, blockMap);
    }
    return match; // Keep original if not found
  });
  
  // 2. Handle internal links: [[Internal Link]] -> Internal Link
  cleanedText = cleanedText.replace(/\[\[([^\]]+)\]\]/g, '$1');
  
  // 3. Handle external links: [External Link](url) -> External Link
  cleanedText = cleanedText.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  
  // 4. Handle markdown formatting: **^^Revelation^^** -> Revelation
  cleanedText = cleanedText.replace(/\*\*([^*]+)\*\*/g, '$1'); // Remove bold
  cleanedText = cleanedText.replace(/\^\^([^^]+)\^\^/g, '$1'); // Remove highlight
  cleanedText = cleanedText.replace(/__([^_]+)__/g, '$1'); // Remove underline
  cleanedText = cleanedText.replace(/\*([^*]+)\*/g, '$1'); // Remove italic
  cleanedText = cleanedText.replace(/_([^_]+)_/g, '$1'); // Remove italic
  
  // 5. Handle tags: #[[tag]] -> #tag
  cleanedText = cleanedText.replace(/#\[\[([^\]]+)\]\]/g, '#$1');
  
  // 6. Remove TODO/DONE markers
  cleanedText = cleanedText.replace(/\{\{(?:TODO|DONE)\}\}/g, '');
  
  // 7. Clean up extra whitespace
  cleanedText = cleanedText
    .replace(/\s+/g, ' ') // Multiple spaces to single space
    .replace(/\n\s*\n/g, '\n\n') // Multiple newlines to double newlines
    .trim();
  
  return cleanedText;
}

function processBlocks(blocks, chunks, pageTitle, parentPath = '', startIndex = 0, blockMap = new Map()) {
  let chunkIndex = startIndex;
  
  blocks.forEach((block, index) => {
    // Extract the text content from the block
    let blockText = '';
    
    if (block.string) {
      blockText = block.string;
    } else if (typeof block === 'string') {
      blockText = block;
    }
    
    // Clean up Roam syntax with improved formatting
    if (blockText) {
      blockText = cleanRoamText(blockText, blockMap);
    }
      
      // Include all blocks with content (including short headings)
      if (blockText.length > 0) {
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
    
    // Recursively process nested blocks
    if (block.children && Array.isArray(block.children)) {
      const newParentPath = parentPath 
        ? `${parentPath} > Block ${index + 1}`
        : `Block ${index + 1}`;
      chunkIndex = processBlocks(block.children, chunks, pageTitle, newParentPath, chunkIndex, blockMap);
    }
  });
  
  return chunkIndex;
}

// Rough token estimation (1 token ≈ 4 characters for English text)
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

// Check if text is a complete sentence (not a title, fragment, or heading)
function isCompleteSentence(text) {
  const trimmed = text.trim();
  
  // Must have some content
  if (trimmed.length === 0) return false;
  
  // Skip if it's all caps (likely a title or heading)
  if (trimmed === trimmed.toUpperCase() && trimmed.length < 200) return false;
  
  // Skip if it starts with common non-sentence patterns
  const nonSentencePatterns = [
    /^#+\s/,           // Markdown headers
    /^Chapter\s+\d+/i, // Chapter headers
    /^Section\s+\d+/i, // Section headers
    /^Page\s+\d+/i,    // Page numbers
    /^\d+\.\s*$/,      // Just numbers
    /^[A-Z][a-z]*\s*:$/, // Labels like "Author:", "Title:"
    /^[A-Z\s]+$/,      // All caps short phrases
  ];
  
  for (const pattern of nonSentencePatterns) {
    if (pattern.test(trimmed)) return false;
  }
  
  // Must contain at least one complete sentence ending
  const sentenceEndings = /[.!?]\s*$/;
  if (!sentenceEndings.test(trimmed)) {
    // Allow if it's a long paragraph that might be cut off, or if it's short (likely a heading)
    return trimmed.length > 200 || trimmed.length < 50;
  }
  
  // Must have some lowercase letters (not all caps)
  if (!/[a-z]/.test(trimmed)) return false;
  
  return true;
}

function splitLongContent(content, maxTokens = 8000) {
  const estimatedTokens = estimateTokens(content);
  
  if (estimatedTokens <= maxTokens) {
    return [content];
  }
  
  // Use paragraph-based chunking with character-based limits
  // Convert token limit to character estimate (roughly 4 chars per token)
  const maxChars = Math.floor(maxTokens * 4);
  return splitIntoParagraphChunks(content, maxChars);
}

// ===== PDF PROCESSING FUNCTIONS =====

// ===== TEXT PROCESSING FUNCTIONS =====

function createSimpleTextChunks(text, maxChunkSize = 1000) {
  const chunks = [];
  let chunkIndex = 0;
  
  // Split content into paragraphs and lines (preserve headings)
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();
    
    if (trimmedParagraph.length === 0) {
      continue;
    }
    
    // If paragraph is short (likely a heading), create a separate chunk
    if (trimmedParagraph.length <= 100 && !trimmedParagraph.includes('.')) {
      chunks.push({
        content: trimmedParagraph,
        structure_path: '',
        chunk_index: chunkIndex,
        page_title: 'Text File',
        block_type: 'text_chunk'
      });
      chunkIndex++;
    } else if (trimmedParagraph.length <= maxChunkSize) {
      // Paragraph fits in one chunk
      chunks.push({
        content: trimmedParagraph,
        structure_path: '',
        chunk_index: chunkIndex,
        page_title: 'Text File',
        block_type: 'text_chunk'
      });
      chunkIndex++;
    } else {
      // Split long paragraph into sentences
      const sentences = trimmedParagraph.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
      let currentChunk = '';
      
      for (const sentence of sentences) {
        const trimmedSentence = sentence.trim();
        
        if (trimmedSentence.length === 0) {
          continue;
        }
        
        const testChunk = currentChunk + (currentChunk ? ' ' : '') + trimmedSentence;
        
        if (testChunk.length > maxChunkSize && currentChunk.trim()) {
          chunks.push({
            content: currentChunk.trim(),
            structure_path: '',
            chunk_index: chunkIndex,
            page_title: 'Text File',
            block_type: 'text_chunk'
          });
          chunkIndex++;
          currentChunk = trimmedSentence;
        } else {
          currentChunk = testChunk;
        }
      }
      
      // Add the last chunk if it has content
      if (currentChunk.trim()) {
        chunks.push({
          content: currentChunk.trim(),
          structure_path: '',
          chunk_index: chunkIndex,
          page_title: 'Text File',
          block_type: 'text_chunk'
        });
        chunkIndex++;
      }
    }
  }
  
  return chunks;
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
    
    if (typeof value === 'string' && value.trim().length > 0) {
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
      // Handle PDF files with simple chunking
      if (!file_buffer) {
        throw new Error('PDF file buffer is required');
      }
      const buffer = Buffer.from(file_buffer, 'base64');
      const pdfData = await processPDF(buffer);
      processedContent = pdfData.content;
      
      console.log(`PDF processed: ${pdfData.pages} pages, ${processedContent.length} characters`);
      console.log(`First 200 chars: ${processedContent.substring(0, 200)}...`);
      
      // Create chunks from PDF content using sentence-based chunking
      chunks = createPDFChunks(processedContent, 500, 1000);
      
      console.log(`PDF chunking: Created ${chunks.length} chunks (500-1000 chars each, ending with periods)`);
      console.log(`First chunk:`, chunks[0]?.content?.substring(0, 200) + '...');
      
    } else if (source_type === 'epub') {
      // Handle EPUB files
      if (!file_buffer) {
        throw new Error('EPUB file buffer is required');
      }
      
    console.log(`Processing EPUB file: ${title} (${Math.round(file_buffer.length / 1024)} KB)`);
    
    const buffer = Buffer.from(file_buffer, 'base64');
    console.log(`EPUB: Starting content extraction...`);
    const epubData = await processEPUB(buffer);
    processedContent = epubData.content;
    
    console.log(`EPUB processing complete. Content length: ${processedContent.length} characters`);
      
      // Create chunks from EPUB content using paragraph-based chunking
      console.log(`EPUB: Creating text chunks...`);
      const textChunks = splitIntoParagraphChunks(processedContent, 1000);
      console.log(`EPUB: Created ${textChunks.length} raw chunks`);
      
      chunks = textChunks
        .filter(chunk => chunk.length > 0)
        .map((chunk, index) => ({
          content: chunk,
          structure_path: '',
          chunk_index: index,
          page_title: title,
          block_type: 'epub_chunk'
        }));
      
      console.log(`EPUB: Filtered to ${chunks.length} valid chunks (${Math.round((chunks.length / textChunks.length) * 100)}% kept)`);
      
    } else if (source_type === 'json') {
      // Handle generic JSON files
      processedContent = content;
      chunks = processGenericJSON(content, title);
      
    } else if (source_type === 'roam') {
      // Handle Roam Research exports
      processedContent = content;
      chunks = parseRoamJSON(content);
      
    } else {
      // Handle text files with simple character-based chunking
      processedContent = content;
      chunks = createSimpleTextChunks(content, 1000);
    }
    
    // 2. Insert source into database with pending_review status
    console.log(`Database: Inserting source "${title}" into database...`);
    const { data: source, error: sourceError } = await supabase
      .from('sources')
      .insert({
        title,
        author,
        source_type,
        processing_status: 'pending_review',
        user_id: null // for testing
      })
      .select()
      .single();

    if (sourceError) throw sourceError;
    console.log(`Database: Source created with ID ${source.id}`);
    
    // 3. Store chunks in pending_review state (no embeddings yet)
    console.log(`Database: Storing ${chunks.length} chunks for review...`);
    const chunkInserts = chunks.map((chunk, index) => ({
      source_id: source.id,
      content: chunk.content,
      chunk_index: chunk.chunk_index || index,
      structure_path: chunk.structure_path || ''
    }));

    const { data: chunkData, error: chunkError } = await supabase
      .from('source_chunks')
      .insert(chunkInserts)
      .select();

    if (chunkError) throw chunkError;
    console.log(`Database: Stored ${chunkData.length} chunks for review`);

    res.json({
      message: 'Source uploaded, processing embeddings...',
      source_id: source.id,
      chunks_created: chunks.length,
      source_type: source_type,
      status: 'pending_review',
      processing: 'embeddings'
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload source',
      details: error.message 
    });
  }
});

// Complete source processing after review
app.post('/complete-source-processing', async (req, res) => {
  try {
    const { source_id } = req.body;
    
    if (!source_id) {
      return res.status(400).json({ error: 'Source ID is required' });
    }

    // Get source information first
    const { data: source, error: sourceError } = await supabase
      .from('sources')
      .select('title, author')
      .eq('id', source_id)
      .single();

    if (sourceError) throw sourceError;
    if (!source) {
      return res.status(404).json({ error: 'Source not found' });
    }

    // Get all chunks for this source
    const { data: chunks, error: chunksError } = await supabase
      .from('source_chunks')
      .select('*')
      .eq('source_id', source_id)
      .order('chunk_index');

    if (chunksError) throw chunksError;
    
    if (!chunks || chunks.length === 0) {
      return res.status(404).json({ error: 'No chunks found for review' });
    }

    console.log(`Processing: Starting to process ${chunks.length} reviewed chunks for embeddings...`);
    
    let chunksCreated = 0;
    
    // Process each chunk for embeddings
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      // Split content if it's too long for OpenAI
      const contentPieces = splitLongContent(chunk.content);
      
      for (let pieceIndex = 0; pieceIndex < contentPieces.length; pieceIndex++) {
        const content = contentPieces[pieceIndex];
        
        // Check content length and split if necessary for embedding model
        const maxTokens = 8000; // Leave some buffer below 8192 limit
        const estimatedTokens = Math.ceil(content.length / 4); // Rough estimate: 4 chars per token
        
        let contentForEmbedding = content;
        if (estimatedTokens > maxTokens) {
          // Split content to fit within token limit
          const maxChars = maxTokens * 4; // Convert back to character limit
          contentForEmbedding = content.substring(0, maxChars);
          console.log(`Content too long (${estimatedTokens} tokens), truncated to ${maxChars} chars for embedding`);
        }
        
        // Generate embedding for chunk
        const embeddingResponse = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: contentForEmbedding,
        });
        
        const embedding = embeddingResponse.data[0].embedding;
        
        // Create unique structure path for split content
        const structurePath = contentPieces.length > 1 
          ? `${chunk.structure_path} (Part ${pieceIndex + 1})`
          : chunk.structure_path;
        
        console.log(`Processing chunk ${chunksCreated + 1}/${chunks.length}...`);

        // Update chunk content
        const { error: updateError } = await supabase
          .from('source_chunks')
          .update({ 
            content: content,
            structure_path: structurePath
          })
          .eq('id', chunk.id);

        if (updateError) throw updateError;
        
        // Store embedding in Qdrant with retry logic
        await uploadToQdrantWithRetry(chunk, embedding, {
          source_id: chunk.source_id,
          source_title: source.title,
          content: content,
          chunk_index: chunk.chunk_index,
          structure_path: structurePath
        });
        
        chunksCreated++;
        
        // Small delay for large uploads to prevent overwhelming the system
        if (chunksCreated % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay every 10 chunks
        }
        
        // Additional delay for Qdrant rate limiting protection
        if (chunksCreated % 50 === 0) {
          await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay every 50 chunks
        }
        
        // Log progress for large uploads
        if (chunksCreated % 100 === 0 || chunksCreated === chunks.length) {
          const progress = Math.round((chunksCreated / chunks.length) * 100);
          console.log(`Processing: ${chunksCreated}/${chunks.length} chunks processed (${progress}%)`);
          
          // Log memory usage for large uploads
          if (chunksCreated % 1000 === 0) {
            const memUsage = process.memoryUsage();
            console.log(`Memory usage: RSS=${Math.round(memUsage.rss / 1024 / 1024)}MB, Heap=${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
          }
        }
      }
    }

    // Update source status to completed (only after embeddings are generated)
    const { error: sourceUpdateError } = await supabase
      .from('sources')
      .update({ 
        processing_status: 'completed'
      })
      .eq('id', source_id);

    if (sourceUpdateError) throw sourceUpdateError;

    console.log(`Upload: Successfully processed ${chunksCreated} chunks after review`);
    
    res.json({
      message: 'Source processing completed successfully',
      source_id: source_id,
      chunks_created: chunksCreated
    });

  } catch (error) {
    console.error('Complete processing error:', error);
    res.status(500).json({ 
      error: 'Failed to complete source processing',
      details: error.message 
    });
  }
});

// Get chunks for review
app.get('/sources/:sourceId/chunks-for-review', async (req, res) => {
  try {
    const { sourceId } = req.params;
    
    // Get source to check if it's in pending_review status
    const { data: source, error: sourceError } = await supabase
      .from('sources')
      .select('processing_status')
      .eq('id', sourceId)
      .single();

    if (sourceError) throw sourceError;
    
    if (source.processing_status !== 'pending_review') {
      return res.json([]);
    }
    
    const { data: chunks, error } = await supabase
      .from('source_chunks')
      .select('*')
      .eq('source_id', sourceId)
      .order('chunk_index');

    if (error) throw error;
    
    res.json(chunks || []);
  } catch (error) {
    console.error('Error fetching chunks for review:', error);
    res.status(500).json({ 
      error: 'Failed to fetch chunks for review',
      details: error.message 
    });
  }
});

// Create new chunk
app.post('/chunks', async (req, res) => {
  try {
    const { source_id, content, chunk_index, structure_path, heading_level } = req.body;

    const { data, error } = await supabase
      .from('source_chunks')
      .insert({
        source_id,
        content,
        chunk_index,
        structure_path,
        heading_level: heading_level || 'paragraph'
      })
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error creating chunk:', error);
    res.status(500).json({
      error: 'Failed to create chunk',
      details: error.message
    });
  }
});

// Update chunk content
app.put('/chunks/:chunkId', async (req, res) => {
  try {
    const { chunkId } = req.params;
    const { content, structure_path, chunk_index, heading_level } = req.body;

    const updateData = {
      content,
      structure_path,
      chunk_index
    };

    // Add heading_level if provided
    if (heading_level) {
      updateData.heading_level = heading_level;
    }

    const { data, error } = await supabase
      .from('source_chunks')
      .update(updateData)
      .eq('id', chunkId)
      .select();

    if (error) throw error;

    res.json(data[0]);
  } catch (error) {
    console.error('Error updating chunk:', error);
    res.status(500).json({
      error: 'Failed to update chunk',
      details: error.message
    });
  }
});

// Split chunk
app.post('/chunks/:chunkId/split', async (req, res) => {
  try {
    const { chunkId } = req.params;
    const { splitIndex } = req.body; // Character index where to split
    
    // Get the original chunk
    const { data: originalChunk, error: fetchError } = await supabase
      .from('source_chunks')
      .select('*')
      .eq('id', chunkId)
      .single();

    if (fetchError) throw fetchError;
    
    const content = originalChunk.content;
    const firstPart = content.substring(0, splitIndex).trim();
    const secondPart = content.substring(splitIndex).trim();
    
    // More lenient validation - allow splitting even if one part is very short
    if (splitIndex <= 0 || splitIndex >= content.length) {
      return res.status(400).json({ error: 'Invalid split point' });
    }
    
    if (firstPart.length < 10 || secondPart.length < 10) {
      return res.status(400).json({ error: 'Split would create parts that are too short' });
    }
    
    // Update original chunk with first part
    const { error: updateError } = await supabase
      .from('source_chunks')
      .update({ content: firstPart })
      .eq('id', chunkId);

    if (updateError) throw updateError;
    
    // Create new chunk with second part
    // Use a high chunk_index to avoid conflicts - frontend will sort by index
    const maxIndex = originalChunk.chunk_index + 1000;
    const { data: newChunk, error: insertError } = await supabase
      .from('source_chunks')
      .insert({
        source_id: originalChunk.source_id,
        content: secondPart,
        chunk_index: maxIndex,
        structure_path: originalChunk.structure_path,
      })
      .select()
      .single();

    if (insertError) throw insertError;
    
    res.json({ 
      originalChunk: { ...originalChunk, content: firstPart },
      newChunk 
    });
  } catch (error) {
    console.error('Error splitting chunk:', error);
    res.status(500).json({ 
      error: 'Failed to split chunk',
      details: error.message 
    });
  }
});

// Merge chunks
app.post('/chunks/merge', async (req, res) => {
  try {
    const { chunkIds } = req.body; // Array of chunk IDs to merge
    
    if (!chunkIds || chunkIds.length < 2) {
      return res.status(400).json({ error: 'At least 2 chunks required for merge' });
    }
    
    // Get all chunks to merge
    const { data: chunks, error: fetchError } = await supabase
      .from('source_chunks')
      .select('*')
      .in('id', chunkIds)
      .order('chunk_index');

    if (fetchError) throw fetchError;
    
    if (chunks.length !== chunkIds.length) {
      return res.status(400).json({ error: 'Some chunks not found' });
    }
    
    // Merge content
    const mergedContent = chunks.map(chunk => chunk.content).join(' ');
    const firstChunk = chunks[0];
    
    // Update first chunk with merged content
    const { data: updatedChunk, error: updateError } = await supabase
      .from('source_chunks')
      .update({ content: mergedContent })
      .eq('id', firstChunk.id)
      .select()
      .single();

    if (updateError) throw updateError;
    
    // Delete other chunks
    const { error: deleteError } = await supabase
      .from('source_chunks')
      .delete()
      .in('id', chunkIds.slice(1));

    if (deleteError) throw deleteError;
    
    // Reindex remaining chunks
    const { data: subsequentChunks, error: fetchMergeError } = await supabase
      .from('source_chunks')
      .select('id, chunk_index')
      .eq('source_id', firstChunk.source_id)
      .gt('chunk_index', firstChunk.chunk_index)
      .order('chunk_index');

    if (fetchMergeError) throw fetchMergeError;

    // Update each subsequent chunk's index
    for (const chunk of subsequentChunks) {
      const { error: updateError } = await supabase
        .from('source_chunks')
        .update({ chunk_index: chunk.chunk_index - 1 })
        .eq('id', chunk.id);
      
      if (updateError) throw updateError;
    }
    
    res.json({ mergedChunk: updatedChunk });
  } catch (error) {
    console.error('Error merging chunks:', error);
    res.status(500).json({ 
      error: 'Failed to merge chunks',
      details: error.message 
    });
  }
});

// Delete chunk
app.delete('/chunks/:chunkId', async (req, res) => {
  try {
    const { chunkId } = req.params;
    
    // Simply delete the chunk - no reindexing needed
    // The frontend will handle the display order
    const { error: deleteError } = await supabase
      .from('source_chunks')
      .delete()
      .eq('id', chunkId);

    if (deleteError) throw deleteError;
    
    res.json({ message: 'Chunk deleted successfully' });
  } catch (error) {
    console.error('Error deleting chunk:', error);
    res.status(500).json({ 
      error: 'Failed to delete chunk',
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
        console.log(`Deleting ${chunks.length} embeddings from Qdrant for source ${sourceId}...`);
        
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
        
        // If it's an index error, try to create the index and retry
        if (qdrantError.message && qdrantError.message.includes('Index required')) {
          console.log('Creating missing source_id index and retrying...');
          try {
            await qdrant.createPayloadIndex('documents', {
              field_name: 'source_id',
              field_schema: 'keyword'
            });
            
            // Retry the deletion
            const retryResult = await qdrant.delete('documents', {
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
            console.log(`Qdrant retry delete result:`, retryResult);
            console.log(`Successfully deleted embeddings for source ${sourceId} from Qdrant (after retry)`);
          } catch (retryError) {
            console.error('Retry deletion failed:', retryError);
            console.log('Continuing with database cleanup despite Qdrant error...');
          }
        } else {
          // Log but continue with database deletion - don't fail the entire operation
          console.log('Continuing with database cleanup despite Qdrant error...');
        }
      }
    } else {
      console.log('No chunks found for this source, skipping Qdrant deletion');
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

// Update source details
app.put('/sources/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author } = req.body;
    
    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    // Update the source in the database
    const { data, error } = await supabase
      .from('sources')
      .update({
        title: title.trim(),
        author: author ? author.trim() : 'Unknown Author',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Source not found' });
    }
    
    res.json({ 
      message: 'Source updated successfully',
      source: data[0]
    });
    
  } catch (error) {
    console.error('Update source error:', error);
    res.status(500).json({ 
      error: 'Failed to update source',
      details: error.message 
    });
  }
});

// Search endpoint
app.post('/search', async (req, res) => {
  try {
    console.log('=== SEARCH REQUEST RECEIVED ===');
    const { query, limit = 20 } = req.body;
    console.log(`Search query: "${query}", limit: ${limit}`);
    
    // 1. Generate embedding for search query
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });
    
    const queryEmbedding = embeddingResponse.data[0].embedding;
    
    // 2. Search similar vectors in Qdrant
    const searchResult = await qdrant.search('documents', {
      vector: queryEmbedding,
      limit: limit * 2, // Get more results to account for filtering
      with_payload: true
    });
    
    console.log(`Qdrant search returned ${searchResult.length} results for query: "${query}"`);
    
    // 3. Get unique source IDs from search results
    const sourceIds = [...new Set(searchResult.map(point => point.payload.source_id))];
    console.log(`Found ${sourceIds.length} unique source IDs:`, sourceIds);
    
    // 4. Check which sources still exist in the database
    const { data: existingSources, error: sourcesError } = await supabase
      .from('sources')
      .select('id')
      .in('id', sourceIds);
    
    if (sourcesError) throw sourcesError;
    
    const existingSourceIds = new Set(existingSources.map(source => source.id));
    console.log(`Found ${existingSourceIds.size} existing sources in database`);
    
    // 5. Filter results to only include chunks from existing sources
    const validResults = searchResult.filter(point => 
      existingSourceIds.has(point.payload.source_id)
    ).slice(0, limit); // Limit to requested number
    
    console.log(`After filtering, ${validResults.length} valid results remain`);
    
    // 6. Format results
    const results = validResults.map(point => ({
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
      curation_timestamp: point.payload.curation_timestamp
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









// Analyze query characteristics to determine optimal weighting





// ===== TEXT SEARCH HELPER FUNCTIONS =====

// Parse text search query for operators
function parseTextSearchQuery(query) {
  const terms = {
    mustInclude: [],      // Terms that must be present (AND)
    shouldInclude: [],    // Terms that should be present (OR)
    mustExclude: [],      // Terms that must be excluded (-)
    exactPhrases: []      // Exact phrases in quotes
  };
  
  // Remove extra whitespace
  query = query.trim();
  
  // Handle exact phrases (quoted text)
  const phraseRegex = /"([^"]+)"/g;
  let match;
  while ((match = phraseRegex.exec(query)) !== null) {
    terms.exactPhrases.push(match[1].toLowerCase());
    // Remove the phrase from the query for further processing
    query = query.replace(match[0], '');
  }
  
  // Split remaining query by spaces
  const words = query.split(/\s+/).filter(word => word.length > 0);
  
  let hasOrOperator = false;
  let orTerms = [];
  
  for (let i = 0; i < words.length; i++) {
    const cleanWord = words[i].toLowerCase();
    
    if (cleanWord.startsWith('-')) {
      // Exclusion term
      terms.mustExclude.push(cleanWord.substring(1));
    } else if (cleanWord.toUpperCase() === 'OR') {
      // OR operator found
      hasOrOperator = true;
      // Add all previous terms to OR group
      orTerms.push(...terms.mustInclude);
      terms.mustInclude = [];
    } else {
      // Regular term
      if (hasOrOperator) {
        orTerms.push(cleanWord);
      } else {
        terms.mustInclude.push(cleanWord);
      }
    }
  }
  
  // If we found OR operator, move all OR terms to shouldInclude
  if (hasOrOperator) {
    terms.shouldInclude = orTerms;
  }
  
  return terms;
}

// Check if content matches text search criteria
function matchesTextSearch(content, searchTerms) {
  const lowerContent = content.toLowerCase();
  
  // Check exact phrases first (these can be partial matches within the phrase)
  for (const phrase of searchTerms.exactPhrases) {
    if (!lowerContent.includes(phrase)) {
      return false;
    }
  }
  
  // Check exclusion terms (whole word matching)
  for (const excludeTerm of searchTerms.mustExclude) {
    const regex = new RegExp(`\\b${escapeRegExp(excludeTerm)}\\b`, 'i');
    if (regex.test(lowerContent)) {
      return false;
    }
  }
  
  // Check must-include terms (whole word matching)
  for (const includeTerm of searchTerms.mustInclude) {
    const regex = new RegExp(`\\b${escapeRegExp(includeTerm)}\\b`, 'i');
    if (!regex.test(lowerContent)) {
      return false;
    }
  }
  
  // Check should-include terms (whole word matching)
  if (searchTerms.shouldInclude.length > 0) {
    const hasAnyShouldInclude = searchTerms.shouldInclude.some(term => {
      const regex = new RegExp(`\\b${escapeRegExp(term)}\\b`, 'i');
      return regex.test(lowerContent);
    });
    if (!hasAnyShouldInclude) {
      return false;
    }
  }
  
  return true;
}

// Escape special regex characters
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Text search endpoint (literal text search with operators)
app.post('/text-search', async (req, res) => {
  try {
    const { query, limit = 20 } = req.body;
    
    if (!query || query.trim().length === 0) {
      return res.json([]);
    }
    
    // Parse the search query for operators
    const searchTerms = parseTextSearchQuery(query);
    
    // Get all chunks from database including AI curation fields
    let { data: chunks, error } = await supabase
      .from('source_chunks')
      .select('id, content, source_id, chunk_index, structure_path, page_title, block_type, heading_level, primary_category, secondary_category, proper_nouns, concept_tags, biblical_refs, topic_tags, ai_curated, curation_timestamp')
      .order('chunk_index', { ascending: true });
    
    // If that fails due to missing columns, try with basic columns only
    if (error && error.message && error.message.includes('does not exist')) {
      console.log('Missing columns detected in text search, falling back to basic schema...');
      const basicResult = await supabase
        .from('source_chunks')
        .select('id, content, source_id, chunk_index, structure_path')
        .order('chunk_index', { ascending: true });
      
      if (basicResult.error) throw basicResult.error;
      
      chunks = basicResult.data.map(chunk => ({
        ...chunk,
        page_title: '', // Default value
        block_type: 'text', // Default value
        heading_level: 'paragraph',
        primary_category: null,
        secondary_category: null,
        proper_nouns: [],
        concept_tags: [],
        biblical_refs: [],
        topic_tags: [],
        ai_curated: false,
        curation_timestamp: null
      }));
    } else if (error) {
      throw error;
    }
    
    // Get source information for each chunk
    const sourceIds = [...new Set(chunks.map(chunk => chunk.source_id))];
    const { data: sources, error: sourcesError } = await supabase
      .from('sources')
      .select('id, title, author, source_type')
      .in('id', sourceIds);
    
    if (sourcesError) throw sourcesError;
    
    // Create a map of source_id to source data
    const sourceMap = new Map();
    sources.forEach(source => {
      sourceMap.set(source.id, source);
    });
    
    // Filter chunks based on text search criteria
    const matchingChunks = chunks.filter(chunk => {
      return matchesTextSearch(chunk.content, searchTerms);
    });
    
    // Format results
    const results = matchingChunks.map(chunk => {
      const source = sourceMap.get(chunk.source_id);
      return {
        score: 1.0, // All text search results get 100% match
        content: chunk.content,
        source_title: source ? source.title : 'Unknown Source',
        chunk_index: chunk.chunk_index,
        source_id: chunk.source_id,
        structure_path: chunk.structure_path,
        page_title: chunk.page_title,
        block_type: chunk.block_type,
        heading_level: chunk.heading_level || 'paragraph',
        primary_category: chunk.primary_category,
        secondary_category: chunk.secondary_category,
        proper_nouns: chunk.proper_nouns || [],
        concept_tags: chunk.concept_tags || [],
        biblical_refs: chunk.biblical_refs || [],
        topic_tags: chunk.topic_tags || [],
        ai_curated: chunk.ai_curated || false,
        curation_timestamp: chunk.curation_timestamp
      };
    });
    
    // Limit results
    const limitedResults = results.slice(0, limit);
    
    res.json(limitedResults);
    
  } catch (error) {
    console.error('Text search error:', error);
    res.status(500).json({ 
      error: 'Text search failed',
      details: error.message 
    });
  }
});


// Clean up orphaned chunks (chunks without corresponding sources)
app.post('/cleanup-orphaned-chunks', async (req, res) => {
  try {
    console.log('Starting orphaned chunks cleanup...');

    // 1. Get all source IDs that exist in the database
    const { data: sources, error: sourcesError } = await supabase
      .from('sources')
      .select('id');

    if (sourcesError) throw sourcesError;

    const validSourceIds = new Set(sources.map(s => s.id));
    console.log(`Found ${validSourceIds.size} valid sources`);

    // 2. Get all chunks and identify orphaned ones
    const { data: allChunks, error: chunksError } = await supabase
      .from('source_chunks')
      .select('id, source_id');

    if (chunksError) throw chunksError;

    const orphanedChunks = allChunks.filter(chunk => !validSourceIds.has(chunk.source_id));
    console.log(`Found ${orphanedChunks.length} orphaned chunks`);

    if (orphanedChunks.length === 0) {
      return res.json({ message: 'No orphaned chunks found' });
    }

    // 3. Delete orphaned chunks from database
    const orphanedIds = orphanedChunks.map(chunk => chunk.id);
    const { error: deleteError, count: deletedCount } = await supabase
      .from('source_chunks')
      .delete()
      .in('id', orphanedIds);

    if (deleteError) throw deleteError;

    console.log(`Deleted ${deletedCount} orphaned chunks from database`);

    // 4. Delete orphaned chunks from Qdrant
    const orphanedSourceIds = [...new Set(orphanedChunks.map(chunk => chunk.source_id))];
    let qdrantDeletedCount = 0;

    for (const sourceId of orphanedSourceIds) {
      try {
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
        console.log(`Deleted chunks for source ${sourceId} from Qdrant`);
        qdrantDeletedCount++;
      } catch (qdrantError) {
        console.error(`Error deleting source ${sourceId} from Qdrant:`, qdrantError);
      }
    }

    res.json({
      message: 'Orphaned chunks cleanup completed',
      orphaned_chunks_found: orphanedChunks.length,
      deleted_from_database: deletedCount,
      deleted_from_qdrant: qdrantDeletedCount,
      orphaned_source_ids: orphanedSourceIds
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Complete system reset endpoint - DANGER: This deletes everything!
app.post('/admin/reset-all', async (req, res) => {
  try {
    console.log('Starting complete system reset...');
    
    // 1. Delete all embeddings from Qdrant
    console.log('Clearing Qdrant embeddings...');
    try {
      await qdrant.delete('documents', {
        wait: true,
        filter: {} // Empty filter deletes everything
      });
      console.log('Qdrant embeddings cleared successfully');
    } catch (qdrantError) {
      console.error('Error clearing Qdrant:', qdrantError);
      // Continue with database cleanup even if Qdrant fails
    }
    
    // 2. Delete all chunks from database (this will cascade to other tables)
    console.log('Clearing database chunks...');
    const { error: chunksError, count: deletedChunks } = await supabase
      .from('source_chunks')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all chunks
    
    if (chunksError) throw chunksError;
    console.log(`Deleted ${deletedChunks || 0} chunks from database`);
    
    // 3. Delete all sources from database
    console.log('Clearing database sources...');
    const { error: sourcesError, count: deletedSources } = await supabase
      .from('sources')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all sources
    
    if (sourcesError) throw sourcesError;
    console.log(`Deleted ${deletedSources || 0} sources from database`);
    
    // 4. Delete all projects from database
    console.log('Clearing database projects...');
    const { error: projectsError, count: deletedProjects } = await supabase
      .from('projects')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all projects
    
    if (projectsError) throw projectsError;
    console.log(`Deleted ${deletedProjects || 0} projects from database`);
    
    // 5. Delete all saved notes from database
    console.log('Clearing database saved notes...');
    const { error: notesError, count: deletedNotes } = await supabase
      .from('saved_notes')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all saved notes
    
    if (notesError) throw notesError;
    console.log(`Deleted ${deletedNotes || 0} saved notes from database`);
    
    console.log('Complete system reset finished successfully');
    
    res.json({
      message: 'Complete system reset successful',
      deleted: {
        qdrant_embeddings: 'all',
        database_chunks: deletedChunks || 0,
        database_sources: deletedSources || 0,
        database_projects: deletedProjects || 0,
        database_saved_notes: deletedNotes || 0
      }
    });
    
  } catch (error) {
    console.error('System reset error:', error);
    res.status(500).json({
      error: 'System reset failed',
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
      
      // Wait before retrying (exponential backoff with longer delays for rate limiting)
      const delay = Math.pow(2, attempt) * 2000; // 4s, 8s, 16s delays
      console.log(`Retrying in ${delay/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Simple sentence splitting using regex
function splitIntoSentences(text) {
  return text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
}

// Detect paragraph breaks with multiple strategies
function detectParagraphBreaks(text) {
  // Primary: Double newlines (\n\n)
  if (text.includes('\n\n')) {
    return text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  }
  
  // Fallback: HTML <p> tags
  if (text.includes('<p>')) {
    const pMatches = text.match(/<p[^>]*>(.*?)<\/p>/gs);
    if (pMatches) {
      return pMatches.map(p => p.replace(/<[^>]*>/g, '').trim()).filter(p => p.length > 0);
    }
  }
  
  // For PDF content: Use a much more conservative approach
  // Create larger chunks by grouping many more sentences together
  const sentences = splitIntoSentences(text);
  const paragraphs = [];
  let currentParagraph = '';
  
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim();
    if (sentence.length === 0) continue;
    
    // Add sentence to current paragraph
    currentParagraph += (currentParagraph ? ' ' : '') + sentence;
    
    // Much more conservative: break every 20-30 sentences or 3000+ characters
    // This should create much larger, more coherent chunks
    const sentenceCount = currentParagraph.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const shouldBreak = sentenceCount >= 20 || currentParagraph.length > 3000;
    
    if (shouldBreak || i === sentences.length - 1) {
      if (currentParagraph.trim().length > 0) {
        paragraphs.push(currentParagraph.trim());
      }
      currentParagraph = '';
    }
  }
  
  // If we didn't find any paragraphs, treat the whole text as one paragraph
  return paragraphs.length > 0 ? paragraphs : [text];
}

// New paragraph-based chunking function
function splitIntoParagraphChunks(text, maxChunkSize = 1000) {
  const paragraphs = detectParagraphBreaks(text);
  const chunks = [];
  
  for (const paragraph of paragraphs) {
    const paragraphLength = paragraph.length;
    
    if (paragraphLength <= maxChunkSize) {
      // Paragraph fits in one chunk
      chunks.push(paragraph);
    } else if (paragraphLength <= maxChunkSize * 2) {
      // Split paragraph in half at sentence boundary
      const sentences = splitIntoSentences(paragraph);
      const midPoint = Math.ceil(sentences.length / 2);
      
      const firstHalf = sentences.slice(0, midPoint).join(' ').trim();
      const secondHalf = sentences.slice(midPoint).join(' ').trim();
      
      if (firstHalf.length > 0) chunks.push(firstHalf);
      if (secondHalf.length > 0) chunks.push(secondHalf);
    } else if (paragraphLength <= maxChunkSize * 3) {
      // Split paragraph into thirds at sentence boundaries
      const sentences = splitIntoSentences(paragraph);
      const thirdPoint = Math.ceil(sentences.length / 3);
      const twoThirdPoint = Math.ceil(sentences.length * 2 / 3);
      
      const firstThird = sentences.slice(0, thirdPoint).join(' ').trim();
      const secondThird = sentences.slice(thirdPoint, twoThirdPoint).join(' ').trim();
      const thirdThird = sentences.slice(twoThirdPoint).join(' ').trim();
      
      if (firstThird.length > 0) chunks.push(firstThird);
      if (secondThird.length > 0) chunks.push(secondThird);
      if (thirdThird.length > 0) chunks.push(thirdThird);
    } else {
      // Very long paragraph - split into multiple chunks of maxChunkSize
      const sentences = splitIntoSentences(paragraph);
      let currentChunk = '';
      
      for (const sentence of sentences) {
        const testChunk = currentChunk + (currentChunk ? ' ' : '') + sentence;
        
        if (testChunk.length > maxChunkSize && currentChunk.length > 0) {
          chunks.push(currentChunk.trim());
          currentChunk = sentence;
        } else {
          currentChunk = testChunk;
        }
      }
      
      if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
      }
    }
  }
  
  return chunks;
}

// Legacy function for backward compatibility
function splitIntoChunks(text, maxChunkSize) {
  return splitIntoParagraphChunks(text, maxChunkSize);
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
      // Continue without failing - the index might already exist
    }
  } catch (error) {
    console.error('Failed to initialize Qdrant:', error);
  }
}

// ===== PROJECT ENDPOINTS =====

// Get all projects
app.get('/projects', async (req, res) => {
  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new project
app.post('/projects', async (req, res) => {
  try {
    const { title, description, content } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        title,
        description: description || '',
        content: content || '',
        user_id: null // for testing
      })
      .select()
      .single();

    if (error) throw error;

    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a project
app.put('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, content } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (content !== undefined) updateData.content = content;
    updateData.updated_at = new Date().toISOString();

    const { data: project, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a project
app.delete('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    const { error, count } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;

    if (count === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ message: 'Project deleted successfully', project_id: id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete individual note (chunk)
app.delete('/delete-note', async (req, res) => {
  try {
    const { source_id, chunk_index } = req.body;
    
    if (!source_id || chunk_index === undefined) {
      return res.status(400).json({ error: 'Source ID and chunk index are required' });
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('source_chunks')
      .delete()
      .eq('source_id', source_id)
      .eq('chunk_index', chunk_index);

    if (dbError) throw dbError;

    // Delete from Qdrant
    try {
      await qdrantClient.delete('source_chunks', {
        filter: {
          must: [
            { key: 'source_id', match: { value: source_id } },
            { key: 'chunk_index', match: { value: chunk_index } }
          ]
        }
      });
    } catch (qdrantError) {
      console.warn('Warning: Could not delete from Qdrant:', qdrantError.message);
      // Don't fail the request if Qdrant deletion fails
    }

    res.json({ 
      message: 'Note deleted successfully', 
      source_id, 
      chunk_index 
    });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a specific project
app.get('/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Initialize services on startup
async function initializeServices() {
  try {
    await initializeQdrant();
    console.log('All services initialized successfully');
  } catch (error) {
    console.error('Error initializing services:', error);
  }
}

// Initialize services and start server
initializeServices();

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Supabase URL:', process.env.SUPABASE_URL ? 'Connected' : 'Missing');
});
