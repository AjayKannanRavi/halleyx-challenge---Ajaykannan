import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing
  await prisma.rule.deleteMany();
  await prisma.step.deleteMany();
  await prisma.workflow.deleteMany();

  // Create Purchase Approval Workflow
  const wf = await prisma.workflow.create({
    data: {
      name: 'Purchase Approval',
      input_schema: JSON.stringify({
        amount: { type: 'number', required: true },
        department: { type: 'string', required: true }
      }),
      version: 1,
      is_active: true
    }
  });

  const step1 = await prisma.step.create({
    data: {
      workflow_id: wf.id,
      name: 'Initial Review',
      step_type: 'task',
      order: 1,
      metadata: JSON.stringify({ instructions: 'Review the purchase request details.' })
    }
  });

  const step2 = await prisma.step.create({
    data: {
      workflow_id: wf.id,
      name: 'Manager Approval',
      step_type: 'approval',
      order: 2,
      metadata: JSON.stringify({ assignee_email: 'manager@example.com' })
    }
  });

  const step3 = await prisma.step.create({
    data: {
      workflow_id: wf.id,
      name: 'VP Approval',
      step_type: 'approval',
      order: 3,
      metadata: JSON.stringify({ assignee_email: 'vp@example.com' })
    }
  });

  const step4 = await prisma.step.create({
    data: {
      workflow_id: wf.id,
      name: 'Notify Finance',
      step_type: 'notification',
      order: 4,
      metadata: JSON.stringify({ channel: 'Slack' })
    }
  });

  // Rules for Step 1
  await prisma.rule.create({
    data: {
      step_id: step1.id,
      condition: 'amount > 0',
      next_step_id: step2.id,
      priority: 1
    }
  });

  // Rules for Step 2
  await prisma.rule.create({
    data: {
      step_id: step2.id,
      condition: 'amount > 5000',
      next_step_id: step3.id,
      priority: 1
    }
  });
  await prisma.rule.create({
    data: {
      step_id: step2.id,
      condition: 'DEFAULT',
      next_step_id: step4.id,
      priority: 2
    }
  });

  // Rules for Step 3
  await prisma.rule.create({
    data: {
      step_id: step3.id,
      condition: 'DEFAULT',
      next_step_id: step4.id,
      priority: 1
    }
  });

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
