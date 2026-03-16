import { prisma } from '../index';
import { ExecutionEngine } from './executionEngine';

export class WorkflowService {
  /**
   * Fetches all active workflows with a summary of their steps.
   */
  static async listWorkflows() {
    return await prisma.workflow.findMany({
      include: {
        _count: {
          select: { steps: true }
        }
      },
      orderBy: { updated_at: 'desc' }
    });
  }

  /**
   * Fetches a single workflow with full details of steps and rules.
   */
  static async getWorkflow(id: string) {
    return await prisma.workflow.findUnique({
      where: { id },
      include: {
        steps: {
          include: { rules: true },
          orderBy: { order: 'asc' }
        }
      }
    });
  }

  /**
   * Creates a new workflow along with its initial steps and rules.
   */
  static async createWorkflow(data: any) {
    const { name, input_schema, steps, start_step_id } = data;
    
    const workflow = await prisma.workflow.create({
      data: {
        name,
        input_schema: JSON.stringify(input_schema || {}),
        version: 1,
        is_active: true,
      }
    });

    const idMap = new Map<string, string>();
    if (steps && steps.length > 0) {
      // First pass: Create steps and map frontend IDs to backend IDs
      for (const step of steps) {
        const newStep = await prisma.step.create({
          data: {
            workflow_id: workflow.id,
            name: step.name,
            step_type: step.step_type,
            order: step.order,
            metadata: typeof step.metadata === 'string' ? step.metadata : JSON.stringify(step.metadata || {})
          }
        });
        idMap.set(step.id, newStep.id);
      }

      // Second pass: Create rules using the mapped IDs
      for (const step of steps) {
        const backendStepId = idMap.get(step.id);
        if (step.rules) {
          for (const rule of step.rules) {
            await prisma.rule.create({
              data: {
                step_id: backendStepId!,
                condition: rule.condition,
                next_step_id: idMap.get(rule.next_step_id) || rule.next_step_id || null,
                priority: rule.priority
              }
            });
          }
        }
      }
    }

    // Update start_step_id using the mapping
    const finalStartStepId = idMap.get(start_step_id) || start_step_id || (steps && steps[0] ? idMap.get(steps[0].id) : null);
    
    return await prisma.workflow.update({
      where: { id: workflow.id },
      data: { start_step_id: finalStartStepId }
    });
  }

  /**
   * Updates a workflow by creating a new version of it.
   */
  static async updateWorkflow(id: string, data: any) {
    const { name, input_schema, steps, start_step_id } = data;
    
    const oldVersion = await prisma.workflow.findUnique({
      where: { id },
      include: { steps: { include: { rules: true } } }
    });

    if (!oldVersion) throw new Error('Workflow not found');

    // Mark old as inactive
    await prisma.workflow.update({
      where: { id: oldVersion.id },
      data: { is_active: false }
    });

    // Create new version
    return await this.createWorkflow({
        name: name || oldVersion.name,
        input_schema: input_schema ? (typeof input_schema === 'string' ? JSON.parse(input_schema) : input_schema) : JSON.parse(oldVersion.input_schema),
        steps: steps || oldVersion.steps,
        start_step_id: start_step_id || oldVersion.start_step_id
    });
  }

  /**
   * Triggers a new execution of a workflow.
   */
  static async startExecution(workflowId: string, inputData: any, triggeredBy?: string) {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: { steps: { orderBy: { order: 'asc' } } }
    });

    if (!workflow) throw new Error('Workflow not found');

    // Simple schema validation
    const schema = JSON.parse(workflow.input_schema);
    for (const key in schema) {
      if (schema[key].required && !inputData[key]) {
        throw new Error(`Missing required field: ${key}`);
      }
    }

    const execution = await prisma.execution.create({
      data: {
        workflow_id: workflowId,
        workflow_version: workflow.version,
        status: 'in_progress',
        data: JSON.stringify(inputData || {}),
        current_step_id: workflow.start_step_id || (workflow.steps[0]?.id),
        triggered_by: triggeredBy
      }
    });

    // Delegate to ExecutionEngine for processing
    // We run this asynchronously to return the execution ID quickly
    ExecutionEngine.processExecution(execution.id, inputData).catch(err => {
        console.error(`Error processing execution ${execution.id}:`, err);
    });

    return execution;
  }
}
