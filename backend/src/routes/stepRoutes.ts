import { Router } from 'express';
import { prisma } from '../index';

const router = Router();

// POST /workflows/:workflow_id/steps - Add step
router.post('/workflows/:workflow_id/steps', async (req, res) => {
  const { workflow_id } = req.params;
  const { name, step_type, order, metadata } = req.body;
  try {
    const step = await prisma.step.create({
      data: {
        workflow_id,
        name,
        step_type,
        order: order || 0,
        metadata: JSON.stringify(metadata || {})
      }
    });
    res.status(201).json(step);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /workflows/:workflow_id/steps
router.get('/workflows/:workflow_id/steps', async (req, res) => {
  try {
    const steps = await prisma.step.findMany({
      where: { workflow_id: req.params.workflow_id },
      orderBy: { order: 'asc' }
    });
    res.json(steps.map((s: any) => ({ ...s, metadata: JSON.parse(s.metadata) })));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /steps/:id
router.put('/:id', async (req, res) => {
  const { name, step_type, order, metadata } = req.body;
  try {
    const step = await prisma.step.update({
      where: { id: req.params.id },
      data: {
        name,
        step_type,
        order,
        metadata: metadata ? JSON.stringify(metadata) : undefined
      }
    });
    res.json(step);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /steps/:id
router.delete('/:id', async (req, res) => {
  try {
    await prisma.step.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Rule Routes (Nested under steps usually, but we can do /steps/:step_id/rules)
router.post('/:step_id/rules', async (req, res) => {
  const { step_id } = req.params;
  const { condition, next_step_id, priority } = req.body;
  try {
    const rule = await prisma.rule.create({
      data: {
        step_id,
        condition,
        next_step_id,
        priority: priority || 0
      }
    });
    res.status(201).json(rule);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:step_id/rules', async (req, res) => {
  try {
    const rules = await prisma.rule.findMany({
      where: { step_id: req.params.step_id },
      orderBy: { priority: 'asc' }
    });
    res.json(rules);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
