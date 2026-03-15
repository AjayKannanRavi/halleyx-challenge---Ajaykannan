# HalleyX - Workflow Automation System

HalleyX is a powerful tool for designing, executing, and monitoring complex business processes with a dynamic rule engine and interactive dashboard.

## 🚀 Quick Start (Manual Run)

To run the project manually, follow these steps for the backend and frontend.

### 1. Backend Setup (Node.js + Prisma)
The backend manages the workflow database, rule evaluation, and execution logs.

```bash
# Navigate to backend directory
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

---

## 🛠️ Main Features
- **Workflow Editor**: Create steps and define decision rules.
- **Rule Engine**: Evaluate logic like `amount > 5000` to determine the next step.
- **Execution History**: Track all runs and view detailed step-by-step logs.
- **Interactive Dashboard**: Process approval steps and monitor real-time progress.
