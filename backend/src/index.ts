import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import workflowRoutes from './routes/workflowRoutes';
import stepRoutes from './routes/stepRoutes';
import executionRoutes from './routes/executionRoutes';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/workflows', workflowRoutes);
app.use('/steps', stepRoutes);
app.use('/executions', executionRoutes);

app.get('/', (req, res) => {
  res.send(`
    <div style="font-family: sans-serif; padding: 2rem; max-width: 600px; margin: auto; line-height: 1.5;">
      <h1 style="color: #6366f1;">HalleyX API</h1>
      <p>The backend server is running correctly.</p>
      <h3>Available Endpoints:</h3>
      <ul>
        <li><code>GET /workflows</code> - List all workflows</li>
        <li><code>GET /health</code> - System status check</li>
        <li><code>GET /executions/:id</code> - Get execution details</li>
      </ul>
      <p>Use the <a href="http://localhost:5174">Frontend Dashboard</a> to interact with the system.</p>
    </div>
  `);
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export { prisma };
