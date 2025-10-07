#!/usr/bin/env node

/**
 * Convert CSV files to Azure Search format
 * Usage: node csv-to-azure.js <input.csv> [output.jsonl] [--upload]
 */

const fs = require('fs');
const csv = require('csv-parser');

function createSourceId(title) {
  return title.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .trim();
}

function chunkText(text, chunkSize = 500, overlap = 50) {
  if (!text || text.trim().length === 0) return [];
  
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

function parseArrayField(value) {
  if (!value || value.trim() === '') return [];
  
  // Handle different separators
  const separators = ['|', ';', ',', '\n'];
  let array = [];
  
  for (const sep of separators) {
    if (value.includes(sep)) {
      array = value.split(sep).map(item => item.trim()).filter(item => item);
      break;
    }
  }
  
  // If no separator found, treat as single item
  if (array.length === 0) {
    array = [value.trim()];
  }
  
  return array;
}

async function convertCsvToAzure(inputFile, outputFile = null) {
  return new Promise((resolve, reject) => {
    try {
      console.log(`Converting ${inputFile} from CSV to Azure Search format...`);
      
      const documents = [];
      let rowCount = 0;
      
      fs.createReadStream(inputFile)
        .pipe(csv())
        .on('data', (row) => {
          rowCount++;
          
          // Extract basic info from first row to generate source metadata
          const sourceTitle = row.source_title || row.title || row.source || 'Unknown Source';
          const author = row.author || 'Unknown Author';
          const year = row.year || row.date || '2024';
          const genre = row.genre || row.type || 'Document';
          
          const sourceId = createSourceId(sourceTitle);
          
          // Get content - could be in different columns
          const content = row.content || row.text || row.body || row.description || '';
          
          if (!content || content.trim() === '') {
            console.warn(`Row ${rowCount}: No content found, skipping`);
            return;
          }
          
          // Chunk the content if it's long
          const chunks = chunkText(content);
          
          chunks.forEach((chunk, chunkIndex) => {
            const document = {
              id: `${sourceId}_${rowCount}_${chunkIndex + 1}`,
              content: chunk.content,
              source_id: sourceId,
              source_title: sourceTitle,
              author: author,
              year: year,
              genre: genre,
              chunk_index: chunk.chunkIndex,
              structure_path: row.structure_path || row.path || `${sourceTitle} > Chunk ${chunk.chunkIndex + 1}`,
              syntopicon_tags: parseArrayField(row.syntopicon_tags || row.tags || row.syntopicon),
              rhetorical_function: parseArrayField(row.rhetorical_function || row.rhetorical || row.function),
              topics: parseArrayField(row.topics || row.topic),
              scripture_refs: parseArrayField(row.scripture_refs || row.scriptures || row.scripture),
              entities_people: parseArrayField(row.entities_people || row.people || row.persons),
              entities_works: parseArrayField(row.entities_works || row.works || row.books),
              is_community: true,
              community_source_id: sourceId
            };
            
            documents.push(document);
          });
        })
        .on('end', () => {
          console.log(`Successfully converted ${documents.length} documents from ${rowCount} CSV rows`);
          
          // Generate output filename if not provided
          if (!outputFile) {
            const inputBasename = inputFile.replace('.csv', '');
            outputFile = `${inputBasename}_azure.jsonl`;
          }
          
          // Write the converted documents to output file
          const outputContent = documents.map(doc => JSON.stringify(doc)).join('\n');
          fs.writeFileSync(outputFile, outputContent);
          
          console.log(`✅ Converted documents written to: ${outputFile}`);
          
          // Show sample of converted data
          if (documents.length > 0) {
            console.log('\n📋 Sample of converted data:');
            console.log(JSON.stringify(documents[0], null, 2));
          }
          
          resolve({
            inputFile,
            outputFile,
            documentCount: documents.length,
            rowCount: rowCount,
            documents: documents
          });
        })
        .on('error', (error) => {
          console.error('Error reading CSV file:', error.message);
          reject(error);
        });
        
    } catch (error) {
      console.error('Error converting file:', error.message);
      reject(error);
    }
  });
}

// Upload converted documents to Azure Search
async function uploadToAzure(azureDocuments) {
  try {
    console.log('\n🚀 Uploading to Azure Search...');
    
    const AzureSearchClient = require('./azure-search-client');
    const azureClient = new AzureSearchClient();
    
    const result = await azureClient.uploadDocuments(azureDocuments);
    console.log(`✅ Total documents uploaded: ${result.length}`);
    return { uploadedCount: result.length };
    
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
Usage: node csv-to-azure.js <input.csv> [output.jsonl] [--upload]

Examples:
  node csv-to-azure.js my_source.csv
  node csv-to-azure.js my_source.csv my_source_azure.jsonl
  node csv-to-azure.js my_source.csv --upload
  node csv-to-azure.js my_source.csv my_source_azure.jsonl --upload

CSV Format:
  The CSV should have these columns (case-insensitive):
  - content/text/body/description: The main text content
  - source_title/title/source: The source title
  - author: Author name
  - year/date: Publication year
  - genre/type: Document type
  - structure_path/path: Hierarchical path (optional)
  - syntopicon_tags/tags/syntopicon: Comma, pipe, or semicolon separated tags
  - rhetorical_function/rhetorical/function: Rhetorical functions
  - topics/topic: Topic tags
  - scripture_refs/scriptures/scripture: Scripture references
  - entities_people/people/persons: People mentioned
  - entities_works/works/books: Works mentioned

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
    const result = await convertCsvToAzure(inputFile, outputFile);
    
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

module.exports = { convertCsvToAzure, uploadToAzure };

