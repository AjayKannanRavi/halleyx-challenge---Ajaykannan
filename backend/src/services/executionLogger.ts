import { prisma } from '../index';

export class ExecutionLogger {
  static async logStep(executionId: string, details: {
    stepName: string;
    stepType: string;
    evaluatedRules: any[];
    selectedNextStep: string | null;
    status: string;
    approverId?: string;
    errorMessage?: string;
    startedAt: Date;
    endedAt?: Date;
  }) {
    const duration = details.endedAt 
      ? `${((details.endedAt.getTime() - details.startedAt.getTime()) / 1000).toFixed(1)}s` 
      : null;

    return await prisma.executionLog.create({
      data: {
        execution_id: executionId,
        step_name: details.stepName,
        step_type: details.stepType,
        evaluated_rules: JSON.stringify(details.evaluatedRules),
        selected_next_step: details.selectedNextStep,
        status: details.status,
        approver_id: details.approverId,
        error_message: details.errorMessage,
        started_at: details.startedAt,
        ended_at: details.endedAt,
      }
    });
  }
}
