#!/usr/bin/env node

/**
 * Convert JSONL files from Qdrant format to Azure Search format
 * Usage: node convert-jsonl-to-azure.js <input.jsonl> [output.jsonl]
 */

const fs = require('fs');
const path = require('path');

function convertQdrantToAzure(inputFile, outputFile = null) {
  try {
    console.log(`Converting ${inputFile} from Qdrant to Azure Search format...`);
    
    // Read the input JSONL file
    const inputContent = fs.readFileSync(inputFile, 'utf8');
    const lines = inputContent.trim().split('\n');
    
    console.log(`Found ${lines.length} lines to convert`);
    
    const azureDocuments = [];
    
    lines.forEach((line, index) => {
      try {
        const qdrantDoc = JSON.parse(line);
        
        // Convert Qdrant format to Azure Search format
        const azureDoc = {
          id: `doc_${index + 1}`, // Generate unique ID
          content: qdrantDoc.content || '',
          source_id: qdrantDoc.source_title?.toLowerCase().replace(/\s+/g, '_') || '',
          source_title: qdrantDoc.source_title || '',
          author: qdrantDoc.author || '',
          year: qdrantDoc.year || '',
          genre: qdrantDoc.genre || '',
          chunk_index: qdrantDoc.chunk_index || 0,
          structure_path: qdrantDoc.structure_path || '',
          syntopicon_tags: qdrantDoc.metadata?.syntopicon_tags || [],
          rhetorical_function: qdrantDoc.metadata?.rhetorical_function || [],
          topics: qdrantDoc.metadata?.topics || [],
          scripture_refs: qdrantDoc.metadata?.scripture_refs || [],
          entities_people: qdrantDoc.metadata?.entities?.people || [],
          entities_works: qdrantDoc.metadata?.entities?.works || [],
          is_community: true, // Mark as community source
          community_source_id: qdrantDoc.source_title?.toLowerCase().replace(/\s+/g, '_') || ''
        };
        
        azureDocuments.push(azureDoc);
        
      } catch (parseError) {
        console.error(`Error parsing line ${index + 1}:`, parseError.message);
        console.error(`Line content: ${line.substring(0, 100)}...`);
      }
    });
    
    console.log(`Successfully converted ${azureDocuments.length} documents`);
    
    // Generate output filename if not provided
    if (!outputFile) {
      const inputBasename = path.basename(inputFile, '.jsonl');
      outputFile = `${inputBasename}_azure.jsonl`;
    }
    
    // Write the converted documents to output file
    const outputContent = azureDocuments.map(doc => JSON.stringify(doc)).join('\n');
    fs.writeFileSync(outputFile, outputContent);
    
    console.log(`✅ Converted documents written to: ${outputFile}`);
    
    // Show sample of converted data
    console.log('\n📋 Sample of converted data:');
    console.log(JSON.stringify(azureDocuments[0], null, 2));
    
    return {
      inputFile,
      outputFile,
      documentCount: azureDocuments.length,
      documents: azureDocuments
    };
    
  } catch (error) {
    console.error('Error converting file:', error.message);
    throw error;
  }
}

// Upload converted documents to Azure Search
async function uploadToAzure(azureDocuments) {
  try {
    console.log('\n🚀 Uploading to Azure Search...');
    
    const AzureSearchClient = require('./azure-search-client');
    const azureClient = new AzureSearchClient();
    
    // Upload documents in batches
    const batchSize = 50;
    let totalUploaded = 0;
    
    for (let i = 0; i < azureDocuments.length; i += batchSize) {
      const batch = azureDocuments.slice(i, i + batchSize);
      const result = await azureClient.uploadDocuments(batch);
      
      totalUploaded += result.uploadedCount;
      console.log(`Uploaded batch ${Math.floor(i/batchSize) + 1}: ${result.uploadedCount}/${batch.length} documents`);
    }
    
    console.log(`✅ Total documents uploaded: ${totalUploaded}`);
    return { uploadedCount: totalUploaded };
    
  } catch (error) {
    console.error('Error uploading to Azure:', error.message);
    throw error;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
Usage: node convert-jsonl-to-azure.js <input.jsonl> [output.jsonl] [--upload]

Examples:
  node convert-jsonl-to-azure.js my_source.jsonl
  node convert-jsonl-to-azure.js my_source.jsonl my_source_azure.jsonl
  node convert-jsonl-to-azure.js my_source.jsonl --upload
  node convert-jsonl-to-azure.js my_source.jsonl my_source_azure.jsonl --upload

Options:
  --upload    Upload the converted documents directly to Azure Search
    `);
    process.exit(1);
  }
  
  const inputFile = args[0];
  const outputFile = args[1] && !args[1].startsWith('--') ? args[1] : null;
  const shouldUpload = args.includes('--upload');
  
  if (!fs.existsSync(inputFile)) {
    console.error(`❌ Input file not found: ${inputFile}`);
    process.exit(1);
  }
  
  try {
    // Convert the file
    const result = convertQdrantToAzure(inputFile, outputFile);
    
    // Upload if requested
    if (shouldUpload) {
      await uploadToAzure(result.documents);
    }
    
    console.log('\n🎉 Conversion completed successfully!');
    
  } catch (error) {
    console.error('❌ Conversion failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { convertQdrantToAzure, uploadToAzure };

