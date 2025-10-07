# Research Assistant

A full-stack AI research assistant with semantic search capabilities, supporting both Qdrant and Azure Cognitive Search backends.

## 🏗️ Project Structure

```
research-assistant/
├── backend/                    # Backend server and database
│   ├── clients/               # Search client implementations
│   │   └── azure-search-client.js
│   ├── database/              # Database schemas and migrations
│   │   ├── create-tables.sql
│   │   └── migration.sql
│   ├── server.js              # Qdrant-based server
│   ├── server-azure.js        # Azure Cognitive Search server
│   └── package.json           # Backend dependencies
├── frontend/                   # Frontend application
│   ├── index.html             # Main application UI
│   └── test-notes.html        # Testing page
├── scripts/                    # Utility scripts
│   ├── migrate-to-azure.js    # Migration from Qdrant to Azure
│   ├── create-new-source.js   # Source creation utility
│   ├── csv-to-azure.js        # CSV to Azure format converter
│   └── ...                    # Other utility scripts
├── docs/                       # Documentation
│   ├── AZURE_SETUP_GUIDE.md   # Azure setup instructions
│   ├── azure-migration-plan.md # Migration strategy
│   └── ...                    # Other documentation
├── data/                       # Data files and templates
│   ├── templates/             # File templates
│   ├── sources/               # Source data files
│   └── taxonomies/            # Knowledge taxonomies
└── requirements.txt           # Python dependencies
```

## 🚀 Features

- **Dual Backend Support**: Switch between Qdrant and Azure Cognitive Search
- **Semantic Search**: AI-powered search with metadata boosting
- **Advanced Filtering**: Filter by source, author, concepts, and more
- **Hybrid Search**: Combines semantic and text-based search
- **Source Management**: Upload and manage research sources
- **Project Organization**: Organize research into projects

## 🛠️ Setup

### Prerequisites
- Node.js 18+
- Python 3.8+
- Azure Cognitive Search account (optional)
- Qdrant account (optional)
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd research-assistant
   ```

2. **Install dependencies**
   ```bash
   # Backend dependencies
   cd backend
   npm install
   
   # Python dependencies
   pip install -r requirements.txt
   ```

3. **Environment setup**
   ```bash
   # Copy environment template
   cp env.azure.example .env
   
   # Edit .env with your API keys
   nano .env
   ```

4. **Start the application**
   ```bash
   # Start backend server
   cd backend
   node server-azure.js  # or server.js for Qdrant
   
   # Start frontend (in another terminal)
   cd frontend
   python3 -m http.server 3000
   ```

## 📖 Documentation

- [Azure Setup Guide](docs/AZURE_SETUP_GUIDE.md) - Complete Azure Cognitive Search setup
- [Migration Plan](docs/azure-migration-plan.md) - Strategy for migrating from Qdrant to Azure
- [Source Format Guide](docs/AZURE_SOURCE_FORMAT_GUIDE.md) - Data format specifications

## 🔧 Configuration

### Environment Variables

```bash
# Search Provider (qdrant or azure)
SEARCH_PROVIDER=azure

# Azure Cognitive Search
AZURE_SEARCH_ENDPOINT=https://your-search-service.search.windows.net
AZURE_SEARCH_INDEX_NAME=documents
AZURE_SEARCH_API_KEY=your-api-key

# OpenAI
OPENAI_API_KEY=your-openai-key

# Supabase (optional)
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-key
```

## 📊 Usage

1. **Upload Sources**: Use the scripts in `scripts/` to convert and upload your research sources
2. **Search**: Use the web interface to search through your research
3. **Filter**: Apply advanced filters to narrow down results
4. **Organize**: Create projects to organize your research

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.