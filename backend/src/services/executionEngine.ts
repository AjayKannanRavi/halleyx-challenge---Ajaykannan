import { prisma } from '../index';
import { RuleEngine } from './ruleEngine';
import { ExecutionLogger } from './executionLogger';

export class ExecutionEngine {
  static async executeStep(executionId: string, stepId: string, inputData: any, approverId?: string) {
    const startedAt = new Date();
    
    const step = await prisma.step.findUnique({
      where: { id: stepId },
      include: { rules: true }
    });

    if (!step) throw new Error(`Step ${stepId} not found`);

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
