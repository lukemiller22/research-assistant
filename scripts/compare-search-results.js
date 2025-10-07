#!/usr/bin/env node

/**
 * Comparison test script to evaluate Qdrant vs Azure Cognitive Search results
 * This script runs the same queries against both systems and compares results
 */

require('dotenv').config({ path: '../.env' });

const { QdrantClient } = require('@qdrant/js-client-rest');
const AzureSearchClient = require('./azure-search-client');
const OpenAI = require('openai');

class SearchComparison {
  constructor() {
    this.qdrant = new QdrantClient({
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
    });
    
    this.azureClient = new AzureSearchClient();
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // Test queries covering different types of searches
    this.testQueries = [
      // Conceptual queries
      "What is the nature of virtue?",
      "How does faith relate to reason?",
      "What is the meaning of life?",
      
      // Practical queries
      "How should I live a good life?",
      "What are the steps to spiritual growth?",
      "How can I develop wisdom?",
      
      // Narrative queries
      "Tell me about the story of creation",
      "What happened in the Garden of Eden?",
      "Describe the life of Jesus",
      
      // Argumentative queries
      "Why does evil exist?",
      "What evidence supports the existence of God?",
      "How can we prove the soul is immortal?",
      
      // Specific topic queries
      "What does the Bible say about love?",
      "How do the ancient philosophers view happiness?",
      "What is the relationship between church and state?",
      
      // Complex queries
      "How do different religious traditions understand salvation?",
      "What are the philosophical arguments for and against free will?",
      "How does modern science relate to traditional religious beliefs?"
    ];
  }

  async runComparison() {
    console.log('Starting search comparison between Qdrant and Azure Cognitive Search...');
    console.log(`Testing ${this.testQueries.length} queries\n`);
    
    const results = {
      qdrant: [],
      azure: [],
      comparison: []
    };
    
    for (let i = 0; i < this.testQueries.length; i++) {
      const query = this.testQueries[i];
      console.log(`\n=== Query ${i + 1}/${this.testQueries.length}: "${query}" ===`);
      
      try {
        // Run Qdrant search
        console.log('Running Qdrant search...');
        const qdrantResults = await this.runQdrantSearch(query);
        results.qdrant.push({
          query,
          results: qdrantResults,
          count: qdrantResults.length
        });
        
        // Run Azure search
        console.log('Running Azure search...');
        const azureResults = await this.runAzureSearch(query);
        results.azure.push({
          query,
          results: azureResults,
          count: azureResults.length
        });
        
        // Compare results
        const comparison = this.compareResults(query, qdrantResults, azureResults);
        results.comparison.push(comparison);
        
        // Log comparison summary
        console.log(`Qdrant: ${qdrantResults.length} results, Azure: ${azureResults.length} results`);
        console.log(`Overlap: ${comparison.overlap} documents`);
        console.log(`Jaccard similarity: ${comparison.jaccardSimilarity.toFixed(3)}`);
        console.log(`Average score difference: ${comparison.avgScoreDiff.toFixed(3)}`);
        
      } catch (error) {
        console.error(`Error processing query "${query}":`, error);
        results.qdrant.push({ query, error: error.message });
        results.azure.push({ query, error: error.message });
        results.comparison.push({ query, error: error.message });
      }
    }
    
    // Generate summary report
    this.generateSummaryReport(results);
    
    return results;
  }

  async runQdrantSearch(query) {
    // Generate embedding
    const embeddingResponse = await this.openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
    });
    
    const queryEmbedding = embeddingResponse.data[0].embedding;
    
    // Search Qdrant
    const searchResult = await this.qdrant.search('documents', {
      vector: queryEmbedding,
      limit: 20,
      with_payload: true
    });
    
    return searchResult.map(point => ({
      id: point.id,
      content: point.payload.content,
      source_title: point.payload.source_title,
      author: point.payload.author,
      score: point.score,
      source_id: point.payload.source_id,
      chunk_index: point.payload.chunk_index,
      structure_path: point.payload.structure_path
    }));
  }

  async runAzureSearch(query) {
    // Run hybrid search
    const results = await this.azureClient.hybridSearch(query, {
      limit: 20,
      semanticSearch: true,
      vectorSearch: true,
      textSearch: true
    });
    
    return results.map(result => ({
      id: result.id,
      content: result.content,
      source_title: result.source_title,
      author: result.author,
      score: result.score,
      source_id: result.source_id,
      chunk_index: result.chunk_index,
      structure_path: result.structure_path
    }));
  }

  compareResults(query, qdrantResults, azureResults) {
    // Create sets of document IDs for comparison
    const qdrantIds = new Set(qdrantResults.map(r => r.id));
    const azureIds = new Set(azureResults.map(r => r.id));
    
    // Calculate overlap
    const overlap = [...qdrantIds].filter(id => azureIds.has(id)).length;
    
    // Calculate Jaccard similarity
    const union = new Set([...qdrantIds, ...azureIds]);
    const jaccardSimilarity = overlap / union.size;
    
    // Calculate average score difference for overlapping documents
    let totalScoreDiff = 0;
    let scoreDiffCount = 0;
    
    for (const qdrantResult of qdrantResults) {
      if (azureIds.has(qdrantResult.id)) {
        const azureResult = azureResults.find(r => r.id === qdrantResult.id);
        if (azureResult) {
          totalScoreDiff += Math.abs(qdrantResult.score - azureResult.score);
          scoreDiffCount++;
        }
      }
    }
    
    const avgScoreDiff = scoreDiffCount > 0 ? totalScoreDiff / scoreDiffCount : 0;
    
    // Find unique results
    const qdrantUnique = qdrantResults.filter(r => !azureIds.has(r.id));
    const azureUnique = azureResults.filter(r => !qdrantIds.has(r.id));
    
    return {
      query,
      overlap,
      jaccardSimilarity,
      avgScoreDiff,
      qdrantUnique: qdrantUnique.length,
      azureUnique: azureUnique.length,
      qdrantCount: qdrantResults.length,
      azureCount: azureResults.length
    };
  }

  generateSummaryReport(results) {
    console.log('\n' + '='.repeat(80));
    console.log('SEARCH COMPARISON SUMMARY REPORT');
    console.log('='.repeat(80));
    
    // Calculate overall statistics
    const comparisons = results.comparison.filter(c => !c.error);
    const totalQueries = comparisons.length;
    
    if (totalQueries === 0) {
      console.log('No successful comparisons to analyze');
      return;
    }
    
    const avgOverlap = comparisons.reduce((sum, c) => sum + c.overlap, 0) / totalQueries;
    const avgJaccard = comparisons.reduce((sum, c) => sum + c.jaccardSimilarity, 0) / totalQueries;
    const avgScoreDiff = comparisons.reduce((sum, c) => sum + c.avgScoreDiff, 0) / totalQueries;
    
    console.log(`\nOverall Statistics:`);
    console.log(`- Total queries tested: ${totalQueries}`);
    console.log(`- Average overlap: ${avgOverlap.toFixed(2)} documents`);
    console.log(`- Average Jaccard similarity: ${avgJaccard.toFixed(3)}`);
    console.log(`- Average score difference: ${avgScoreDiff.toFixed(3)}`);
    
    // Find queries with highest/lowest similarity
    const sortedByJaccard = comparisons.sort((a, b) => b.jaccardSimilarity - a.jaccardSimilarity);
    
    console.log(`\nHighest Similarity Queries:`);
    sortedByJaccard.slice(0, 3).forEach((c, i) => {
      console.log(`${i + 1}. "${c.query}" - Jaccard: ${c.jaccardSimilarity.toFixed(3)}`);
    });
    
    console.log(`\nLowest Similarity Queries:`);
    sortedByJaccard.slice(-3).reverse().forEach((c, i) => {
      console.log(`${i + 1}. "${c.query}" - Jaccard: ${c.jaccardSimilarity.toFixed(3)}`);
    });
    
    // Analyze result counts
    const qdrantCounts = results.qdrant.filter(r => !r.error).map(r => r.count);
    const azureCounts = results.azure.filter(r => !r.error).map(r => r.count);
    
    const avgQdrantCount = qdrantCounts.reduce((sum, c) => sum + c, 0) / qdrantCounts.length;
    const avgAzureCount = azureCounts.reduce((sum, c) => sum + c, 0) / azureCounts.length;
    
    console.log(`\nResult Count Analysis:`);
    console.log(`- Average Qdrant results: ${avgQdrantCount.toFixed(2)}`);
    console.log(`- Average Azure results: ${avgAzureCount.toFixed(2)}`);
    console.log(`- Difference: ${(avgAzureCount - avgQdrantCount).toFixed(2)}`);
    
    // Performance analysis
    console.log(`\nPerformance Analysis:`);
    console.log(`- Queries with higher Azure result count: ${comparisons.filter(c => c.azureCount > c.qdrantCount).length}`);
    console.log(`- Queries with higher Qdrant result count: ${comparisons.filter(c => c.qdrantCount > c.azureCount).length}`);
    console.log(`- Queries with equal result count: ${comparisons.filter(c => c.qdrantCount === c.azureCount).length}`);
    
    // Recommendations
    console.log(`\nRecommendations:`);
    if (avgJaccard > 0.7) {
      console.log('✓ High similarity between systems - migration should be straightforward');
    } else if (avgJaccard > 0.5) {
      console.log('⚠ Moderate similarity - consider fine-tuning Azure search parameters');
    } else {
      console.log('⚠ Low similarity - significant differences detected, review search configuration');
    }
    
    if (avgScoreDiff < 0.1) {
      console.log('✓ Score differences are minimal - ranking should be similar');
    } else {
      console.log('⚠ Significant score differences - ranking may differ between systems');
    }
    
    console.log('\n' + '='.repeat(80));
  }

  // Save detailed results to file
  async saveResults(results, filename = 'search-comparison-results.json') {
    const fs = require('fs');
    const path = require('path');
    
    const outputPath = path.join(__dirname, filename);
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\nDetailed results saved to: ${outputPath}`);
  }
}

// Run comparison if called directly
if (require.main === module) {
  const comparison = new SearchComparison();
  
  comparison.runComparison()
    .then(async (results) => {
      await comparison.saveResults(results);
      console.log('\nComparison completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Comparison failed:', error);
      process.exit(1);
    });
}

module.exports = SearchComparison;

