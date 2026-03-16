import { Router } from 'express';
import { WorkflowService } from '../services/workflowService';

const router = Router();

// GET /workflows - List workflows
router.get('/', async (req, res) => {
  try {
    const workflows = await WorkflowService.listWorkflows();
    res.json(workflows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /workflows/:id - Get workflow details
router.get('/:id', async (req, res) => {
  try {
    const workflow = await WorkflowService.getWorkflow(req.params.id);
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }
    res.json(workflow);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /workflows - Create workflow
router.post('/', async (req, res) => {
  try {
    const workflow = await WorkflowService.createWorkflow(req.body);
    res.status(201).json(workflow);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /workflows/:id - Update workflow (Creates new version)
router.put('/:id', async (req, res) => {
  try {
    const newWorkflow = await WorkflowService.updateWorkflow(req.params.id, req.body);
    res.json(newWorkflow);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /workflows/:id/execute - Start execution
router.post('/:id/execute', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, triggered_by } = req.body;
    const execution = await WorkflowService.startExecution(id, data, triggered_by);
    res.status(201).json(execution);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /workflows/:id - Delete workflow
router.delete('/:id', async (req, res) => {
  try {
    const { prisma } = await import('../index'); // Lazy import if needed or just use WorkflowService if it had delete
    await prisma.workflow.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
