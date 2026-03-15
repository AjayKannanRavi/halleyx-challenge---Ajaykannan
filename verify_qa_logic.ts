import { prisma } from './backend/src/index';
import { RuleEngine } from './backend/src/services/ruleEngine';
import { WorkflowService } from './backend/src/services/workflowService';

async function verify() {
  console.log('--- Starting Senior QA Logic Verification ---');

  // 1. Create the Workflow
  const workflow = await prisma.workflow.create({
    data: {
      name: 'QA Expense Approval',
      version: 3,
      input_schema: JSON.stringify({
        amount: { required: true },
        country: { required: true },
        priority: { required: true }
      })
    }
  });

  const steps = [
    { name: 'Manager Approval', type: 'approval', order: 0 },
    { name: 'Finance Notification', type: 'notification', order: 1 },
    { name: 'CEO Approval', type: 'approval', order: 2 },
    { name: 'Task Rejection', type: 'task', order: 3 }
  ];

  const stepIds: Record<string, string> = {};
  for (const s of steps) {
    const step = await prisma.step.create({
      data: {
        workflow_id: workflow.id,
        name: s.name,
        step_type: s.type,
        order: s.order,
        metadata: '{}'
      }
    });
    stepIds[s.name] = step.id;
  }

  // 2. Set up Rules for Manager Approval
  const managerRules = [
    { condition: "amount > 100 && country == 'US' && priority == 'High'", next: 'Finance Notification', prio: 1 },
    { condition: "amount <= 100 || department == 'HR'", next: 'CEO Approval', prio: 2 },
    { condition: "priority == 'Low' && country != 'US'", next: 'Task Rejection', prio: 3 },
    { condition: "DEFAULT", next: 'Task Rejection', prio: 4 }
  ];

  for (const r of managerRules) {
    await prisma.rule.create({
      data: {
        step_id: stepIds['Manager Approval'],
        condition: r.condition,
        next_step_id: stepIds[r.next],
        priority: r.prio
      }
    });
  }

  // Update start step
  await prisma.workflow.update({
    where: { id: workflow.id },
    data: { start_step_id: stepIds['Manager Approval'] }
  });

  console.log('Workflow created successfully.');

  // 3. Trigger Execution
  const testData = {
    amount: 250,
    country: 'US',
    priority: 'High',
    department: 'Finance'
  };

  const execution = await prisma.execution.create({
    data: {
      workflow_id: workflow.id,
      workflow_version: 3,
      status: 'in_progress',
      data: JSON.stringify(testData),
      current_step_id: stepIds['Manager Approval']
    }
  });

  console.log(`Execution started: ${execution.id}`);

  // 4. Process Step with Approval
  await WorkflowService.processStep(execution.id, { approved: true, approver_id: 'qa_bot_1' });

  // 5. Verify Logs
  const finalExecution = await prisma.execution.findUnique({
    where: { id: execution.id },
    include: { logs: true }
  });

  console.log('\n--- EXECUTION LOG VALIDATION ---');
  if (finalExecution?.logs && finalExecution.logs.length > 0) {
    const log = finalExecution.logs[0];
    const rules = JSON.parse(log.evaluated_rules);

    console.log(`Step: ${log.step_name}`);
    console.log(`Status: ${log.status}`);
    console.log(`Evaluated Rules: ${JSON.stringify(rules, null, 2)}`);
    console.log(`Selected Next Step: ${log.selected_next_step === stepIds['Finance Notification'] ? 'Finance Notification (CORRECT)' : 'INCORRECT'}`);
    console.log(`Approver: ${log.approver_id === 'qa_bot_1' ? 'qa_bot_1 (CORRECT)' : 'INCORRECT'}`);
    
    // Check if Rule 1 was the match
    if (rules[0].result === true && log.selected_next_step === stepIds['Finance Notification']) {
      console.log('✅ PRIORITY 1 LOGIC VERIFIED');
    } else {
      console.log('❌ LOGIC ERROR');
    }
  } else {
    console.log('❌ NO LOGS GENERATED');
  }

  // Clean up
  await prisma.workflow.delete({ where: { id: workflow.id } });
  console.log('\nCleanup complete.');
}

verify().catch(console.error);
