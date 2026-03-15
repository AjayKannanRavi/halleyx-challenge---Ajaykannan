import { prisma } from '../index';
import { ExecutionEngine } from './executionEngine';

export class WorkflowService {
  static async processStep(executionId: string, metadata: any = {}) {
    let execution = await prisma.execution.findUnique({
      where: { id: executionId },
      include: { workflow: { include: { steps: true } } }
    });

    if (!execution || execution.status !== 'in_progress') return;

    let currentMetadata = metadata;

    // Use a loop to process automatic steps (task, notification)
    while (execution && execution.status === 'in_progress') {
      const { workflow, current_step_id } = execution;
      if (!workflow || !current_step_id) break;
      const currentStep = workflow.steps.find((s: any) => s.id === current_step_id);
      if (!currentStep) break;

      // If it's an approval step and we don't have approval metadata, we pause and wait for user input
      if (currentStep.step_type === 'approval' && (currentMetadata.approved === undefined)) {
        console.log(`Execution ${executionId} paused at approval step: ${currentStep.name}`);
        break;
      }

      const inputData = { ...JSON.parse(execution.data), ...currentMetadata };
      
      // Execute the step using the new engine
      const nextStepId = await ExecutionEngine.executeStep(
        executionId, 
        current_step_id, 
        inputData, 
        currentMetadata.approver_id || (currentMetadata.approved !== undefined ? 'system' : undefined)
      );

      if (nextStepId) {
        // Update execution in database and in-memory object for next iteration
        execution = await prisma.execution.update({
          where: { id: executionId },
          data: { current_step_id: nextStepId },
          include: { workflow: { include: { steps: true } } }
        });
        
        // Reset metadata after processing the step that might have needed it
        currentMetadata = {}; 
      } else {
        await prisma.execution.update({
          where: { id: executionId },
          data: { status: 'completed', ended_at: new Date() }
        });
        break;
      }
    }
  }
}
