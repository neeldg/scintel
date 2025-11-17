# ResearchNavigator

AI assistant for PhD students and researchers. Upload research artifacts, get AI-powered analysis, literature summaries, gap identification, and research direction suggestions.

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** for styling
- **Prisma ORM** with SQLite for local development
- **OpenAI API** for LLM calls

## Setup Instructions

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

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   │   ├── projects/     # Project CRUD endpoints
│   │   └── documents/    # Document upload endpoint
│   ├── projects/         # Project pages
│   ├── providers.tsx     # User context provider
│   └── layout.tsx        # Root layout
├── components/           # React components
│   ├── Sidebar.tsx       # Navigation sidebar
│   └── AuthPlaceholder.tsx # Login placeholder
├── lib/
│   └── prisma.ts         # Prisma client instance
├── prisma/
│   └── schema.prisma     # Database schema
└── uploads/              # Uploaded files (created automatically)
```

## Features

- ✅ Authentication placeholder (email-based, local state)
- ✅ Projects dashboard with list view
- ✅ Create new projects
- ✅ Project detail pages
- ✅ File upload (PDFs, text files)
- ✅ Document management per project
- ✅ Clean, minimal UI with Tailwind CSS

## Next Steps

- Wire up "Run AI Analysis" button
- Implement vector store for document indexing
- Add AI agents for summarization, literature review, gap analysis
- Add commenting system for research directions
- Implement proper authentication

