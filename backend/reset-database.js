// Database reset script
require('dotenv').config({ path: '../.env' });
const { createClient } = require('@supabase/supabase-js');
const { QdrantClient } = require('@qdrant/js-client-rest');

// Initialize clients
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
  timeout: 60000,
});

async function resetDatabase() {
  console.log('🔄 Starting database reset...');
  
  try {
    // 1. Clear Qdrant vector database
    console.log('🗑️  Clearing Qdrant vector database...');
    try {
      await qdrant.delete('documents', {
        wait: true,
        filter: {} // Delete all points
      });
      console.log('✅ Qdrant cleared successfully');
    } catch (error) {
      console.log('⚠️  Qdrant clear failed (may be empty):', error.message);
    }
    
    // 2. Clear Supabase database
    console.log('🗑️  Clearing Supabase database...');
    
    // Delete source_chunks first (foreign key constraint)
    const { error: chunksError } = await supabase
      .from('source_chunks')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (chunksError) {
      console.log('⚠️  Error clearing source_chunks:', chunksError.message);
    } else {
      console.log('✅ Source chunks cleared');
    }
    
    // Delete sources
    const { error: sourcesError } = await supabase
      .from('sources')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (sourcesError) {
      console.log('⚠️  Error clearing sources:', sourcesError.message);
    } else {
      console.log('✅ Sources cleared');
    }
    
    // Delete projects
    const { error: projectsError } = await supabase
      .from('projects')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (projectsError) {
      console.log('⚠️  Error clearing projects:', projectsError.message);
    } else {
      console.log('✅ Projects cleared');
    }
    
    console.log('🎉 Database reset completed successfully!');
    console.log('📝 You can now start fresh with new uploads.');
    
  } catch (error) {
    console.error('❌ Database reset failed:', error);
  }
}

// Run the reset
resetDatabase().then(() => {
  console.log('✅ Reset script completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Reset script failed:', error);
  process.exit(1);
});

