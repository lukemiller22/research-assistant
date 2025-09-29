#!/usr/bin/env node

// Test script for AI curation system
// Run with: node test-ai-curation.js

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testAICuration() {
  console.log('🧪 Testing AI Curation System...\n');
  
  try {
    // Test 1: Test AI curation endpoint
    console.log('1. Testing AI curation endpoint...');
    const testText = `The concept of justice has been central to philosophical discourse since ancient times. Aristotle argued that justice is the virtue that gives each person their due, while Rawls proposed a theory of justice as fairness based on the original position behind a veil of ignorance. These different approaches to understanding justice reflect the complexity of moral philosophy and its practical applications in society.`;
    
    const curationResponse = await axios.post(`${BASE_URL}/test-ai-curation`, {
      text: testText,
      sourceTitle: 'Philosophy of Justice'
    });
    
    console.log('✅ AI Curation Test Results:');
    console.log(`   - Original text length: ${testText.length} characters`);
    console.log(`   - AI curated: ${curationResponse.data.curated_chunk.ai_curated}`);
    console.log(`   - Primary category: ${curationResponse.data.curated_chunk.primary_category}`);
    console.log(`   - Secondary category: ${curationResponse.data.curated_chunk.secondary_category}`);
    console.log(`   - Proper nouns: ${JSON.stringify(curationResponse.data.curated_chunk.proper_nouns)}`);
    console.log(`   - Concept tags: ${JSON.stringify(curationResponse.data.curated_chunk.concept_tags)}`);
    console.log(`   - Topic tags: ${JSON.stringify(curationResponse.data.curated_chunk.topic_tags)}`);
    console.log(`   - Biblical refs: ${JSON.stringify(curationResponse.data.curated_chunk.biblical_refs)}`);
    console.log('');
    
    // Test 2: Test server health
    console.log('2. Testing server health...');
    const healthResponse = await axios.get(`${BASE_URL}/`);
    console.log('✅ Server is running:', healthResponse.data.message);
    console.log('');
    
    // Test 3: Test database connection
    console.log('3. Testing database connection...');
    const dbResponse = await axios.get(`${BASE_URL}/test-db`);
    console.log('✅ Database connection:', dbResponse.data.message);
    console.log('');
    
    // Test 4: Test OpenAI connection
    console.log('4. Testing OpenAI connection...');
    const openaiResponse = await axios.get(`${BASE_URL}/test-embeddings`);
    console.log('✅ OpenAI connection:', openaiResponse.data.message);
    console.log(`   - Embedding length: ${openaiResponse.data.embedding_length}`);
    console.log(`   - Tokens used: ${openaiResponse.data.tokens_used}`);
    console.log('');
    
    // Test 5: Test Qdrant connection
    console.log('5. Testing Qdrant connection...');
    const qdrantResponse = await axios.get(`${BASE_URL}/test-qdrant`);
    console.log('✅ Qdrant connection:', qdrantResponse.data.message);
    console.log('');
    
    console.log('🎉 All tests passed! AI curation system is ready.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the test
testAICuration();

