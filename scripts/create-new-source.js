#!/usr/bin/env node

/**
 * Create a new Azure-compatible source from text content
 * Usage: node create-new-source.js <source-title> <author> <year> <genre>
 */

const fs = require('fs');
const readline = require('readline');

function createSourceId(title) {
  return title.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .trim();
}

function chunkText(text, chunkSize = 500, overlap = 50) {
  const chunks = [];
  let start = 0;
  let chunkIndex = 0;
  
  while (start < text.length) {
    let end = start + chunkSize;
    
    // Try to break at sentence boundary
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('.', end);
      const lastExclamation = text.lastIndexOf('!', end);
      const lastQuestion = text.lastIndexOf('?', end);
      const lastBreak = Math.max(lastPeriod, lastExclamation, lastQuestion);
      
      if (lastBreak > start + chunkSize * 0.5) {
        end = lastBreak + 1;
      }
    }
    
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 0) {
      chunks.push({
        content: chunk,
        chunkIndex: chunkIndex++
      });
    }
    
    start = end - overlap;
  }
  
  return chunks;
}

async function getTextInput(prompt) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function createNewSource() {
  try {
    console.log('📝 Creating a new Azure-compatible source...\n');
    
    // Get source metadata
    const sourceTitle = await getTextInput('Source Title: ');
    const author = await getTextInput('Author: ');
    const year = await getTextInput('Year: ');
    const genre = await getTextInput('Genre (e.g., Essay, Book, Article): ');
    
    console.log('\n📄 Enter your content (press Enter twice when done):');
    const content = await getTextInput('Content: ');
    
    if (!sourceTitle || !author || !content) {
      console.error('❌ Source title, author, and content are required');
      process.exit(1);
    }
    
    const sourceId = createSourceId(sourceTitle);
    console.log(`\n🔧 Generated source ID: ${sourceId}`);
    
    // Chunk the content
    const chunks = chunkText(content);
    console.log(`📦 Created ${chunks.length} chunks from your content`);
    
    // Create Azure-compatible documents
    const documents = chunks.map((chunk, index) => ({
      id: `${sourceId}_${index + 1}`,
      content: chunk.content,
      source_id: sourceId,
      source_title: sourceTitle,
      author: author,
      year: year,
      genre: genre,
      chunk_index: chunk.chunkIndex,
      structure_path: `${sourceTitle} > Chunk ${chunk.chunkIndex + 1}`,
      syntopicon_tags: [], // You can add these manually later
      rhetorical_function: [], // You can add these manually later
      topics: [], // You can add these manually later
      scripture_refs: [], // You can add these manually later
      entities_people: [], // You can add these manually later
      entities_works: [], // You can add these manually later
      is_community: true,
      community_source_id: sourceId
    }));
    
    // Save to JSONL file
    const filename = `${sourceId}.jsonl`;
    const jsonlContent = documents.map(doc => JSON.stringify(doc)).join('\n');
    fs.writeFileSync(filename, jsonlContent);
    
    console.log(`\n✅ Created source file: ${filename}`);
    console.log(`📊 Documents created: ${documents.length}`);
    
    // Show sample
    console.log('\n📋 Sample document:');
    console.log(JSON.stringify(documents[0], null, 2));
    
    // Ask if user wants to upload
    const shouldUpload = await getTextInput('\n🚀 Upload to Azure Search? (y/n): ');
    if (shouldUpload.toLowerCase() === 'y' || shouldUpload.toLowerCase() === 'yes') {
      console.log('\n🔄 Uploading to Azure Search...');
      
      const AzureSearchClient = require('./azure-search-client');
      const azureClient = new AzureSearchClient();
      
      const result = await azureClient.uploadDocuments(documents);
      console.log(`✅ Uploaded ${result.length} documents to Azure Search`);
      
      // Test the upload
      console.log('\n🧪 Testing search...');
      const testResults = await azureClient.hybridSearch(sourceTitle, { limit: 3 });
      console.log(`Found ${testResults.length} results for "${sourceTitle}"`);
    }
    
    console.log('\n🎉 Source creation completed!');
    console.log(`\nNext steps:`);
    console.log(`1. Edit ${filename} to add metadata (syntopicon_tags, topics, etc.)`);
    console.log(`2. Upload to Azure: node convert-jsonl-to-azure.js ${filename} --upload`);
    console.log(`3. Test in the UI: http://localhost:3001`);
    
  } catch (error) {
    console.error('❌ Error creating source:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  createNewSource();
}

module.exports = { createNewSource, createSourceId, chunkText };

