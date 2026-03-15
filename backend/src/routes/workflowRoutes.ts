import { Router } from 'express';
import { prisma } from '../index';
import { WorkflowService } from '../services/workflowService';

const router = Router();

// GET /workflows - List workflows
router.get('/', async (req, res) => {
  try {
    const workflows = await prisma.workflow.findMany({
      include: {
        _count: {
          select: { steps: true }
        }
      },
      orderBy: { updated_at: 'desc' }
    });
    res.json(workflows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /workflows/:id - Get workflow details
router.get('/:id', async (req, res) => {
  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id: req.params.id },
      include: {
        steps: {
          include: { rules: true },
          orderBy: { order: 'asc' }
        }
      }
    });

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
  const { name, input_schema, steps, start_step_id } = req.body;
  try {
    const workflow = await prisma.workflow.create({
      data: {
        name,
        input_schema: JSON.stringify(input_schema || {}),
        version: 1,
        is_active: true,
      }
    });

    const idMap = new Map<string, string>();
    if (steps) {
      for (const step of steps) {
        const newStep = await prisma.step.create({
          data: {
            workflow_id: workflow.id,
            name: step.name,
            step_type: step.step_type,
            order: step.order,
            metadata: JSON.stringify(step.metadata || {})
          }
        });
        idMap.set(step.id, newStep.id);
      }

      for (const step of steps) {
        const backendStepId = idMap.get(step.id);
        if (step.rules) {
          for (const rule of step.rules) {
            await prisma.rule.create({
              data: {
                step_id: backendStepId!,
                condition: rule.condition,
                next_step_id: idMap.get(rule.next_step_id) || rule.next_step_id,
                priority: rule.priority
              }
            });
          }
        }
      }
    }

    // Update start_step_id if provided
    if (start_step_id) {
      await prisma.workflow.update({
        where: { id: workflow.id },
        data: { start_step_id: idMap.get(start_step_id) || start_step_id }
      });
    }

    res.status(201).json(workflow);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /workflows/:id - Update workflow (Creates new version)
router.put('/:id', async (req, res) => {
  const { name, input_schema, steps, start_step_id } = req.body;
  try {
    const oldVersion = await prisma.workflow.findUnique({
      where: { id: req.params.id },
      include: { steps: { include: { rules: true } } }
    });

    if (!oldVersion) return res.status(404).json({ error: 'Workflow not found' });

    // Mark old as inactive
    await prisma.workflow.update({
      where: { id: oldVersion.id },
      data: { is_active: false }
    });

    // Create new version
    const newWorkflow = await prisma.workflow.create({
      data: {
        name: name || oldVersion.name,
        input_schema: input_schema ? JSON.stringify(input_schema) : oldVersion.input_schema,
        version: oldVersion.version + 1,
        is_active: true
      }
    });

    // If steps are provided in the request, use them. Otherwise, copy from old version.
    const stepsToCreate = steps || oldVersion.steps;
    const idMap = new Map<string, string>();

    for (const step of stepsToCreate) {
      const newStep = await prisma.step.create({
        data: {
          workflow_id: newWorkflow.id,
          name: step.name,
          step_type: step.step_type,
          order: step.order,
          metadata: typeof step.metadata === 'string' ? step.metadata : JSON.stringify(step.metadata || {})
        }
      });
      idMap.set(step.id, newStep.id);
    }

    for (const step of stepsToCreate) {
      const backendId = idMap.get(step.id);
      const rulesToCreate = step.rules || [];
      for (const rule of rulesToCreate) {
        await prisma.rule.create({
          data: {
            step_id: backendId!,
            condition: rule.condition,
            next_step_id: idMap.get(rule.next_step_id) || rule.next_step_id,
            priority: rule.priority
          }
        });
      }
    }

    // Update start_step_id if provided or copy from old (mapping it)
    const finalStartStepId = start_step_id || oldVersion.start_step_id;
    if (finalStartStepId) {
      await prisma.workflow.update({
        where: { id: newWorkflow.id },
        data: { start_step_id: idMap.get(finalStartStepId) || finalStartStepId }
      });
    }

    res.json(newWorkflow);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /workflows/:id/execute - Start execution
router.post('/:id/execute', async (req, res) => {
  const { id } = req.params;
  const { data, triggered_by } = req.body;

  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id },
      include: { steps: { orderBy: { order: 'asc' } } }
    });

    if (!workflow) return res.status(404).json({ error: 'Workflow not found' });

    // Validate data against workflow.input_schema (Simple check)
    const schema = JSON.parse(workflow.input_schema);
    for (const key in schema) {
      if (schema[key].required && !data[key]) {
        return res.status(400).json({ error: `Missing required field: ${key}` });
      }
    }

    const execution = await prisma.execution.create({
      data: {
        workflow_id: id,
        workflow_version: workflow.version,
        status: 'in_progress',
        data: JSON.stringify(data || {}),
        current_step_id: workflow.start_step_id || (workflow.steps[0]?.id),
        triggered_by
      }
    });

    // Auto-process first step if it's a TASK or NOTIFICATION
    const firstStep = workflow.steps.find(s => s.id === execution.current_step_id);
    if (firstStep && (firstStep.step_type === 'task' || firstStep.step_type === 'notification')) {
      await WorkflowService.processStep(execution.id, data);
    }

    res.status(201).json(execution);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /workflows/:id - Delete workflow
router.delete('/:id', async (req, res) => {
  try {
    await prisma.workflow.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
