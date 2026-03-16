import { prisma } from '../index';
import { RuleEngine } from './ruleEngine';
import { ExecutionLogger } from './executionLogger';

export class ExecutionEngine {
  /**
   * Main entry point for processing a workflow execution.
   * Handles automatic transitions and pauses for manual steps (approvals).
   */
  static async processExecution(executionId: string, metadata: any = {}) {
    let execution = await prisma.execution.findUnique({
      where: { id: executionId },
      include: { workflow: { include: { steps: { include: { rules: true } } } } }
    });

    if (!execution || (execution.status !== 'in_progress' && execution.status !== 'pending')) return;

    // Ensure status is in_progress if we are jumping in
    if (execution.status === 'pending') {
        execution = await prisma.execution.update({
            where: { id: executionId },
            data: { status: 'in_progress' },
            include: { workflow: { include: { steps: { include: { rules: true } } } } }
        });
    }

    let currentMetadata = metadata;

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
      
      // Execute the step logic
      const nextStepId = await this.executeStep(
        executionId, 
        currentStep, 
        inputData, 
        currentMetadata.approver_id || (currentMetadata.approved !== undefined ? 'system' : undefined)
      );

      if (nextStepId) {
        // Update execution in database and in-memory object for next iteration
        execution = await prisma.execution.update({
          where: { id: executionId },
          data: { current_step_id: nextStepId },
          include: { workflow: { include: { steps: { include: { rules: true } } } } }
        });
        
        // Reset metadata after processing the step that might have needed it
        currentMetadata = {}; 
      } else {
        // Finish flow
        await prisma.execution.update({
          where: { id: executionId },
          data: { status: 'completed', ended_at: new Date() }
        });
        break;
      }
    }
  }

  static async executeStep(executionId: string, step: any, inputData: any, approverId?: string) {
    const startedAt = new Date();
    
    // Evaluate all rules for logging
    const evaluatedRules = RuleEngine.evaluateAll(step.rules, inputData);
    
    // Find the first matching rule by priority
    const matchingRule = RuleEngine.findMatchingRule(step.rules, inputData);
    const nextStepId = matchingRule ? matchingRule.next_step_id : null;

    // Log the execution
    const endedAt = new Date();
    await ExecutionLogger.logStep(executionId, {
      stepName: step.name,
      stepType: step.step_type,
      evaluatedRules,
      selectedNextStep: nextStepId,
      status: 'completed',
      approverId,
      startedAt,
      endedAt
    });

    return nextStepId;
  }
}
