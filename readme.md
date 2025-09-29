# Research Assistant

A full-stack AI research assistant with semantic search capabilities for academic documents, books, and research materials.

## Features

### 🔍 **Search Capabilities**
- **Smart Search**: Vector-based semantic search using OpenAI embeddings
- **Text Search**: Literal text search with boolean operators (AND, OR, NOT, quotes)
- **Real-time Search**: Auto-search as you type with configurable delay

### 📚 **Document Processing**
- **Multi-format Support**: PDF, EPUB, and plain text documents
- **Automatic Chunking**: Intelligent text segmentation for optimal search results
- **Embedding Generation**: Automatic vector embedding creation using OpenAI's text-embedding-3-small
- **Real-time Processing**: Live status updates during document processing

### 📝 **Note Management**
- **Individual Note Deletion**: Remove irrelevant chunks with two-step confirmation
- **Note Saving**: Save relevant notes to projects for organization
- **Copy Functionality**: Easy copying of note content with proper attribution
- **Context Viewing**: View notes in their original document context

### 🗂️ **Project Organization**
- **Project Creation**: Organize research into separate projects
- **Source Management**: Track and manage multiple document sources
- **Status Tracking**: Monitor processing status of uploaded documents

## Tech Stack

- **Backend**: Express.js with Node.js
- **Frontend**: Vanilla HTML, CSS, and JavaScript
- **Database**: Supabase PostgreSQL
- **Vector Database**: Qdrant Cloud
- **AI/ML**: OpenAI API (text-embedding-3-small, GPT models)
- **File Processing**: PDF parsing, EPUB extraction

## Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/lukemiller22/research-assistant.git
   cd research-assistant
   ```

2. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Environment Configuration**
   - Copy `.env.example` to `.env` in the root directory
   - Add your API keys:
     ```
     SUPABASE_URL=your_supabase_url
     SUPABASE_SERVICE_KEY=your_supabase_service_key
     QDRANT_URL=your_qdrant_url
     QDRANT_API_KEY=your_qdrant_api_key
     OPENAI_API_KEY=your_openai_api_key
     ```

4. **Database Setup**
   - Run the SQL scripts in `backend/` to set up your Supabase database
   - Start with `create-tables.sql` for the initial schema

5. **Start the application**
   ```bash
   # Start backend server
   cd backend
   npm start
   
   # Open frontend
   # Open index.html in your browser
   ```

## Usage

1. **Upload Documents**: Drag and drop or select PDF/EPUB files
2. **Search**: Use Smart Search for semantic queries or Text Search for exact matches
3. **Manage Notes**: Save relevant notes to projects, delete irrelevant ones
4. **Organize Research**: Create projects to organize your research materials

## API Endpoints

- `POST /upload-source` - Upload and process documents
- `POST /complete-source-processing` - Complete embedding generation
- `GET /search` - Semantic vector search
- `GET /sources` - List all sources
- `DELETE /delete-note` - Delete individual notes
- `POST /projects` - Create projects
- `GET /projects` - List projects

## License

ISC