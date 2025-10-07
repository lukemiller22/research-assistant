#!/usr/bin/env node

/**
 * Migration script to move data from Qdrant to Azure Cognitive Search
 * This script exports data from Qdrant and uploads it to Azure Search
 */

require('dotenv').config({ path: '../.env' });

const { QdrantClient } = require('@qdrant/js-client-rest');
const AzureSearchClient = require('./azure-search-client');
const fs = require('fs');
const path = require('path');

class QdrantToAzureMigrator {
  constructor() {
    this.qdrant = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
    });
    
    this.azureClient = new AzureSearchClient();
    this.batchSize = 100; // Process documents in batches
  }

  async migrate() {
    try {
      console.log('Starting migration from Qdrant to Azure Cognitive Search...');
      
      // Step 1: Create Azure Search index
      console.log('1. Creating Azure Search index...');
      await this.azureClient.createIndex();
      
      // Step 2: Export data from Qdrant
      console.log('2. Exporting data from Qdrant...');
      const qdrantData = await this.exportFromQdrant();
      
      // Step 3: Convert data format
      console.log('3. Converting data format...');
      const azureDocuments = this.convertDataFormat(qdrantData);
      
      // Step 4: Upload to Azure Search in batches
      console.log('4. Uploading to Azure Search...');
      await this.uploadToAzure(azureDocuments);
      
      // Step 5: Verify migration
      console.log('5. Verifying migration...');
      await this.verifyMigration();
      
      console.log('Migration completed successfully!');
      
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  async exportFromQdrant() {
    try {
      // Get collection info
      const collectionInfo = await this.qdrant.getCollection('documents');
      console.log(`Found collection with ${collectionInfo.points_count} points`);
      
      // Scroll through all points
      const allPoints = [];
      let offset = null;
      const limit = 1000;
      
      do {
        const scrollResult = await this.qdrant.scroll('documents', {
          limit,
          offset,
          with_payload: true,
          with_vector: true
        });
        
        allPoints.push(...scrollResult.points);
        offset = scrollResult.next_page_offset;
        
        console.log(`Exported ${allPoints.length} points so far...`);
        
      } while (offset !== null);
      
      console.log(`Total points exported: ${allPoints.length}`);
      return allPoints;
      
    } catch (error) {
      console.error('Error exporting from Qdrant:', error);
      throw error;
    }
  }

  convertDataFormat(qdrantPoints) {
    console.log('Converting Qdrant points to Azure Search format...');
    
    const azureDocuments = qdrantPoints.map(point => {
      const payload = point.payload;
      
      return {
        id: point.id,
        content: payload.content || '',
        // Note: contentVector removed since we're using text-only search for now
        source_id: payload.source_id || '',
        source_title: payload.source_title || '',
        author: payload.author || '',
        year: payload.year || '',
        genre: payload.genre || '',
        chunk_index: payload.chunk_index || 0,
        structure_path: payload.structure_path || '',
        syntopicon_tags: Array.isArray(payload.syntopicon_tags) ? payload.syntopicon_tags : [],
        rhetorical_function: Array.isArray(payload.rhetorical_function) ? payload.rhetorical_function : [],
        topics: Array.isArray(payload.topics) ? payload.topics : [],
        scripture_refs: Array.isArray(payload.scripture_refs) ? payload.scripture_refs : [],
        entities_people: Array.isArray(payload.entities?.people) ? payload.entities.people : [],
        entities_works: Array.isArray(payload.entities?.works) ? payload.entities.works : [],
        is_community: payload.is_community || false,
        community_source_id: payload.community_source_id || ''
      };
    });
    
    console.log(`Converted ${azureDocuments.length} documents`);
    return azureDocuments;
  }

  async uploadToAzure(documents) {
    console.log(`Uploading ${documents.length} documents to Azure Search...`);
    
    // Process in batches
    for (let i = 0; i < documents.length; i += this.batchSize) {
      const batch = documents.slice(i, i + this.batchSize);
      
      try {
        await this.azureClient.uploadDocuments(batch);
        console.log(`Uploaded batch ${Math.floor(i / this.batchSize) + 1}/${Math.ceil(documents.length / this.batchSize)}`);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error uploading batch ${Math.floor(i / this.batchSize) + 1}:`, error);
        throw error;
      }
    }
    
    console.log('All documents uploaded successfully');
  }

  async verifyMigration() {
    try {
      // Get index statistics
      const stats = await this.azureClient.getIndexStats();
      console.log('Azure Search index statistics:', {
        documentCount: stats.documentCount,
        storageSize: stats.storageSize
      });
      
      // Test a simple search
      const testResults = await this.azureClient.hybridSearch('test query', { limit: 5 });
      console.log(`Test search returned ${testResults.length} results`);
      
      // Test vector search
      const vectorResults = await this.azureClient.vectorSearch('test query', { limit: 5 });
      console.log(`Test vector search returned ${vectorResults.length} results`);
      
      // Test text search
      const textResults = await this.azureClient.textSearch('test query', { limit: 5 });
      console.log(`Test text search returned ${textResults.length} results`);
      
      console.log('Migration verification completed successfully');
      
    } catch (error) {
      console.error('Error verifying migration:', error);
      throw error;
    }
  }

  // Save exported data to file for backup
  async saveBackup(qdrantData, azureDocuments) {
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Save Qdrant data
    const qdrantFile = path.join(backupDir, `qdrant-export-${timestamp}.json`);
    fs.writeFileSync(qdrantFile, JSON.stringify(qdrantData, null, 2));
    console.log(`Qdrant data saved to: ${qdrantFile}`);
    
    // Save Azure documents
    const azureFile = path.join(backupDir, `azure-documents-${timestamp}.json`);
    fs.writeFileSync(azureFile, JSON.stringify(azureDocuments, null, 2));
    console.log(`Azure documents saved to: ${azureFile}`);
  }
}

// Run migration if called directly
if (require.main === module) {
  const migrator = new QdrantToAzureMigrator();
  
  migrator.migrate()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = QdrantToAzureMigrator;
