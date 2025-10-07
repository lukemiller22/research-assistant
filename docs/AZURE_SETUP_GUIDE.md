# Azure Cognitive Search Setup Guide

This guide will help you set up Azure Cognitive Search as an alternative to Qdrant for your research assistant application.

## Prerequisites

1. **Azure Account**: You'll need an active Azure subscription
2. **Node.js**: Version 16 or higher
3. **Existing Data**: Your Qdrant data should be ready for migration

## Step 1: Create Azure Cognitive Search Service

### 1.1 Create the Service
1. Go to the [Azure Portal](https://portal.azure.com)
2. Click "Create a resource"
3. Search for "Azure Cognitive Search"
4. Click "Create"
5. Fill in the details:
   - **Subscription**: Your Azure subscription
   - **Resource Group**: Create new or use existing
   - **Service Name**: `research-assistant-search` (must be globally unique)
   - **Location**: Choose a location close to your users
   - **Pricing Tier**: 
     - **Free** (for testing): 50MB storage, 3 indexes, 2,000 documents
     - **Basic** (for production): 2GB storage, 5 indexes, 10,000 documents
     - **Standard** (for larger scale): 25GB+ storage, 50+ indexes, 1M+ documents

### 1.2 Get API Key
1. Once created, go to your search service
2. Navigate to "Keys" in the left menu
3. Copy the **Primary admin key** (you'll need this for the API key)

## Step 2: Install Dependencies

```bash
# Install Azure-specific dependencies
npm install @azure/search-documents

# Or install all dependencies from the azure-package.json
npm install --package-lock-only
npm install
```

## Step 3: Configure Environment Variables

1. Copy the example environment file:
```bash
cp env.azure.example .env
```

2. Edit `.env` and add your Azure credentials:
```env
# Azure Cognitive Search Configuration
AZURE_SEARCH_ENDPOINT=https://research-assistant-search.search.windows.net
AZURE_SEARCH_INDEX_NAME=documents
AZURE_SEARCH_API_KEY=your-primary-admin-key-here

# Search Provider Selection
USE_AZURE_SEARCH=true

# Keep your existing OpenAI and Supabase credentials
OPENAI_API_KEY=your-openai-api-key
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_KEY=your-supabase-service-key
```

## Step 4: Create the Search Index

The index will be created automatically when you run the migration script, but you can also create it manually:

```bash
# Create the index
node -e "
const AzureSearchClient = require('./azure-search-client');
const client = new AzureSearchClient();
client.createIndex().then(() => console.log('Index created')).catch(console.error);
"
```

## Step 5: Migrate Data from Qdrant

### 5.1 Run the Migration Script
```bash
node migrate-to-azure.js
```

This script will:
- Export all data from Qdrant
- Convert it to Azure Search format
- Upload it to Azure Cognitive Search
- Verify the migration

### 5.2 Monitor the Migration
The script will show progress as it migrates your data. For large datasets, this may take some time.

## Step 6: Test the Integration

### 6.1 Start the Azure-enabled Server
```bash
# Use the Azure-enabled server
node backend/server-azure.js
```

### 6.2 Test Search Functionality
```bash
# Test Azure Search connection
curl http://localhost:3001/test-azure

# Test a search query
curl -X POST http://localhost:3001/search \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the nature of virtue?", "limit": 5}'
```

## Step 7: Compare Results (Optional)

Run the comparison script to see how Azure results compare to Qdrant:

```bash
node compare-search-results.js
```

This will:
- Run the same queries against both systems
- Compare result overlap and similarity
- Generate a detailed comparison report

## Step 8: Switch to Azure Search

Once you're satisfied with the results:

1. **Update your environment**:
   ```env
   USE_AZURE_SEARCH=true
   ```

2. **Restart your server**:
   ```bash
   node backend/server-azure.js
   ```

3. **Update your frontend** (if needed):
   - The API endpoints remain the same
   - No frontend changes required

## Azure Cognitive Search Features

### Built-in Hybrid Search
- Combines vector similarity with full-text search
- Uses Reciprocal Rank Fusion (RRF) for result merging
- No need for custom boosting algorithms

### Semantic Re-ranking
- Built-in semantic ranking using language models
- Automatically improves result relevance
- Provides captions and answers

### Advanced Filtering
- Pre-filtering and post-filtering capabilities
- More efficient than Qdrant's payload filtering
- Better performance for complex queries

### Managed Service
- No infrastructure management required
- Automatic scaling and high availability
- Built-in monitoring and logging

## Cost Considerations

### Free Tier (Testing)
- 50MB storage
- 3 indexes
- 2,000 documents
- 20,000 queries per month

### Basic Tier (Production)
- 2GB storage
- 5 indexes
- 10,000 documents
- $75/month + $0.10 per 1,000 queries

### Standard Tier (Large Scale)
- 25GB+ storage
- 50+ indexes
- 1M+ documents
- $250+/month + $0.10 per 1,000 queries

## Troubleshooting

### Common Issues

1. **Index Creation Fails**
   - Check your API key and endpoint URL
   - Ensure the service is fully provisioned
   - Verify you have the correct permissions

2. **Migration Fails**
   - Check your Qdrant connection
   - Ensure you have enough storage in Azure
   - Check the Azure Search quotas

3. **Search Results Differ**
   - This is expected - Azure uses different algorithms
   - Run the comparison script to analyze differences
   - Consider adjusting search parameters

### Getting Help

1. **Azure Documentation**: [Azure Cognitive Search Docs](https://docs.microsoft.com/en-us/azure/search/)
2. **Azure Support**: Available through the Azure Portal
3. **Community**: [Azure Cognitive Search Community](https://techcommunity.microsoft.com/t5/azure-cognitive-search/bd-p/AzureSearch)

## Rollback Plan

If you need to rollback to Qdrant:

1. **Update environment**:
   ```env
   USE_AZURE_SEARCH=false
   ```

2. **Restart server**:
   ```bash
   node backend/server.js
   ```

3. **Your Qdrant data remains unchanged** - no data loss

## Next Steps

1. **Monitor Performance**: Use Azure's built-in monitoring
2. **Optimize Queries**: Fine-tune search parameters
3. **Scale as Needed**: Upgrade pricing tier if required
4. **Consider Advanced Features**: Explore semantic search, captions, and answers

## Support

For questions or issues with this migration:
1. Check the troubleshooting section above
2. Review the Azure documentation
3. Contact Azure support if needed

