import { Router } from 'express';
import { prisma } from '../index';
import { RuleEngine } from '../services/ruleEngine';
import { ExecutionEngine } from '../services/executionEngine';

import { WorkflowService } from '../services/workflowService';

const router = Router();

// GET /executions - List all executions
router.get('/', async (req, res) => {
  try {
    const executions = await prisma.execution.findMany({
      include: { workflow: { select: { name: true } } },
      orderBy: { started_at: 'desc' }
    });
    res.json(executions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /stats - Activity statistics
router.get('/stats', async (req, res) => {
  try {
    const totalExecutions = await prisma.execution.count();
    const statusCounts = await prisma.execution.groupBy({
      by: ['status'],
      _count: true
    });
    
    const workflowCounts = await prisma.workflow.count({ where: { is_active: true } });
    
    // Get daily stats for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const executionsByDay = await prisma.execution.findMany({
      where: {
        started_at: { gte: sevenDaysAgo }
      },
      select: { started_at: true, status: true }
    });

    const stats = {
      totalExecutions,
      activeWorkflows: workflowCounts,
      statusDistribution: statusCounts.reduce((acc: any, curr: any) => {
        acc[curr.status] = curr._count;
        return acc;
      }, {}),
      recentActivity: executionsByDay
    };

    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /executions/:id
router.get('/:id', async (req, res) => {
  try {
    const execution = await prisma.execution.findUnique({
      where: { id: req.params.id },
      include: { 
        logs: true,
        workflow: {
          include: {
            steps: {
              include: { rules: true },
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    });
    if (!execution) return res.status(404).json({ error: 'Execution not found' });
    res.json({
      ...execution,
      data: JSON.parse(execution.data),
      logs: execution.logs.map((l: any) => ({ ...l, evaluated_rules: JSON.parse(l.evaluated_rules) }))
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /executions/:id/process
router.post('/:id/process', async (req, res) => {
  try {
    await ExecutionEngine.processExecution(req.params.id, req.body.metadata);
    res.json({ message: 'Step processed' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /executions/:id/cancel
router.post('/:id/cancel', async (req, res) => {
  try {
    const execution = await prisma.execution.update({
      where: { id: req.params.id },
      data: { status: 'canceled', ended_at: new Date() }
    });
    res.json(execution);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /executions/:id/retry
router.post('/:id/retry', async (req, res) => {
  try {
    const execution = await prisma.execution.update({
      where: { id: req.params.id },
      data: { status: 'in_progress', ended_at: null }
    });
    // Re-process the current step
    await ExecutionEngine.processExecution(execution.id);
    res.json({ message: 'Execution retried' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


export default router;
