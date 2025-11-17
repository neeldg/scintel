# ResearchNavigator

An AI-powered research assistant for PhD students and researchers. Upload research artifacts, get AI-powered analysis, literature summaries, gap identification, and research direction suggestions with PI critique.

## 🎯 Overview

ResearchNavigator helps researchers:
- **Organize** research projects and documents
- **Analyze** uploaded documents with AI agents
- **Identify** research gaps by comparing work with literature
- **Generate** concrete research directions with hypotheses
- **Review** proposals with PI critique and feedback
- **Collaborate** through inline comments on gaps and directions

## 🚀 Features

### Core Features
- ✅ **Project Management**: Create and manage multiple research projects
- ✅ **Document Upload**: Upload PDFs and text files with automatic processing
- ✅ **AI-Powered Analysis**: Multi-agent pipeline for comprehensive research analysis
- ✅ **Persistent Storage**: All analyses are saved and can be reviewed later
- ✅ **Commenting System**: Add comments on specific gaps and directions
- ✅ **Role-Based UI**: Switch between Student and PI roles for different perspectives

### AI Agents Pipeline
1. **Ingestion Agent**: Analyzes documents and generates structured project profiles
2. **Literature Scout Agent**: Finds relevant literature (currently simulated)
3. **Gap Finder Agent**: Identifies research gaps by comparing project work with literature
4. **Direction Generator Agent**: Proposes concrete research directions with hypotheses
5. **PI Critic Agent**: Reviews proposals from a Principal Investigator perspective

### Role-Based Features
- **Student Role**: 
  - View analysis results
  - See hints about asking PI for review
  - Add comments on gaps and directions
  
- **PI Role**:
  - Highlighted "PI Feedback Zone" for critique sections
  - Enhanced comment forms for providing feedback
  - Review and comment on proposed directions

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Styling**: Tailwind CSS
- **Database**: Prisma ORM with SQLite (local dev)
- **AI/ML**: OpenAI API (GPT-4o-mini for analysis, text-embedding-3-small for embeddings)
- **File Processing**: pdf-parse for PDF text extraction
- **Vector Store**: In-memory vector store (can be replaced with Postgres+pgvector or Pinecone)

## 📋 Prerequisites

- Node.js 18+ and npm
- OpenAI API key
- (Optional) For production: PostgreSQL with pgvector extension

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
DATABASE_URL="file:./dev.db"
OPENAI_API_KEY="your-openai-api-key-here"
```

**Important:** You need a valid OpenAI API key for the AI features to work.

### 3. Initialize Database

```bash
npx prisma generate
npx prisma migrate dev --name init
```

This will:
- Generate the Prisma Client
- Create the SQLite database file
- Run the initial migration

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
├── app/
│   ├── api/                    # API routes
│   │   ├── projects/           # Project CRUD endpoints
│   │   │   └── [id]/
│   │   │       ├── analyze/    # AI analysis endpoint
│   │   │       └── analyses/   # List analyses endpoint
│   │   ├── analyses/           # Analysis detail endpoint
│   │   ├── documents/          # Document upload endpoint
│   │   └── users/              # User login endpoint
│   ├── projects/               # Project pages
│   │   └── [id]/               # Project detail page
│   ├── providers.tsx           # User context provider
│   ├── role-provider.tsx       # Role context provider
│   └── layout.tsx              # Root layout
├── components/                 # React components
│   ├── Sidebar.tsx             # Navigation sidebar
│   ├── AuthPlaceholder.tsx     # Login placeholder
│   └── RoleToggle.tsx          # Role selector
├── lib/
│   ├── agents/                 # AI agents
│   │   ├── types.ts            # Type definitions
│   │   ├── ingestionAgent.ts   # Project profile generation
│   │   ├── literatureScoutAgent.ts  # Literature search (simulated)
│   │   ├── gapFinderAgent.ts   # Gap identification
│   │   ├── directionGeneratorAgent.ts  # Hypothesis generation
│   │   ├── piCriticAgent.ts    # PI critique
│   │   └── orchestrator.ts     # Agent coordination
│   ├── embedding.ts            # OpenAI embedding wrapper
│   ├── vectorStore.ts          # In-memory vector store
│   ├── documentProcessor.ts    # PDF/text extraction & processing
│   └── prisma.ts               # Prisma client instance
├── prisma/
│   └── schema.prisma           # Database schema
└── uploads/                    # Uploaded files (created automatically)
```

## 🗄️ Database Schema

### Models

- **User**: id, name, email, timestamps
- **Project**: id, userId, title, description, timestamps
- **Document**: id, projectId, title, filePath, originalFileName, summary, timestamps
- **Analysis**: id, projectId, createdAt, projectProfile (JSON), scoutedPapers (JSON), gaps (JSON), directions (JSON), criticizedDirections (JSON)
- **Comment**: id, projectId, analysisId, userId, targetType, targetId, content, createdAt

## 🎮 Usage Guide

### 1. Getting Started

1. **Login**: Enter your email address (creates/fetches user automatically)
2. **Create Project**: Click "Create New Project" and fill in title and description
3. **Upload Documents**: Upload PDFs or text files to your project
4. **Run Analysis**: Click "Run AI Analysis" to start the analysis pipeline

### 2. Understanding the Analysis Pipeline

The analysis follows a step-by-step process:

1. **Upload Documents** → Documents are processed (text extraction, summarization, embedding)
2. **Project Profile** → AI analyzes all documents and creates a structured profile
3. **Literature Scout** → Relevant literature is identified (currently simulated)
4. **Research Gaps** → Gaps are identified by comparing project work with literature
5. **Research Directions** → Concrete directions with hypotheses are proposed
6. **PI Critic** → Proposals are reviewed from a PI perspective

### 3. Adding Comments

- **On Gaps**: Scroll to any identified gap and add a comment
- **On Directions**: Scroll to any research direction and add feedback
- **As PI**: Switch to PI role to see highlighted feedback zones

### 4. Role Switching

- Use the role dropdown in the sidebar to switch between Student and PI roles
- The UI adapts based on your selected role
- Role is stored in local state only (no backend persistence)

## 🔌 API Endpoints

### Projects
- `GET /api/projects` - Get all projects for current user
- `POST /api/projects` - Create new project
- `GET /api/projects/[id]` - Get project with documents
- `GET /api/projects/[id]/analyses` - Get all analyses for a project
- `POST /api/projects/[id]/analyze` - Run AI analysis on a project

### Analyses
- `GET /api/analyses/[analysisId]` - Get full analysis with comments

### Documents
- `POST /api/documents/upload` - Upload a document file

### Comments
- `POST /api/comments` - Create a new comment

### Users
- `POST /api/users/login` - Create or get user by email

## 🧪 Development

### Running Tests

```bash
npm run lint
npm run build
```

### Database Migrations

```bash
# Create a new migration
npx prisma migrate dev --name migration_name

# Generate Prisma Client after schema changes
npx prisma generate
```

### Viewing Database

```bash
npx prisma studio
```

## 🚧 Future Enhancements

- [ ] Replace simulated literature search with real PubMed/Semantic Scholar API
- [ ] Implement persistent vector store (Postgres+pgvector or Pinecone)
- [ ] Add proper authentication (replace email placeholder)
- [ ] Add ability to export analysis results
- [ ] Improve chunking strategy for better RAG performance
- [ ] Add document preview functionality
- [ ] Implement real-time collaboration features
- [ ] Add analysis comparison tools
- [ ] Support for more file types (Word docs, LaTeX, etc.)

## 📝 Notes

### Vector Store
The current implementation uses an in-memory vector store. For production, consider:
- **Postgres + pgvector**: Good for self-hosted solutions
- **Pinecone**: Managed vector database service
- **Weaviate**: Open-source vector database

### Literature Search
Currently, the Literature Scout Agent generates simulated papers. To integrate real literature search:
- Replace `literatureScoutAgent.ts` with API calls to PubMed, Semantic Scholar, or arXiv
- Update the agent to parse and structure real paper data

### Authentication
The current authentication is a placeholder using email. For production:
- Implement proper OAuth (Google, GitHub, etc.)
- Add session management
- Implement role-based access control (RBAC)

## 🤝 Contributing

This is a research project. Contributions and suggestions are welcome!

## 📄 License

This project is for research and educational purposes.

## 🙏 Acknowledgments

Built with Next.js, Prisma, OpenAI, and Tailwind CSS.

