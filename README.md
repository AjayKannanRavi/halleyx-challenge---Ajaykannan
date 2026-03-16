HalleyX - Workflow Automation System

1. Backend Setup (Node.js + Prisma)
The backend manages the workflow database, rule evaluation, and execution logs.

bash
 Navigate to backend directory
cd backend

# Install dependencies
npm install

# Push the database schema (SQLite by default)
npx prisma db push

# (Optional) Seed the database with sample workflows
npx prisma db seed

# Start the development server
npm run dev
```
The backend will run on `http://localhost:3001`.

### 2. Frontend Setup (React + Vite)
The frontend provides the Workflow Editor and Execution Dashboard.

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```
The frontend will run on `http://localhost:5174`.
