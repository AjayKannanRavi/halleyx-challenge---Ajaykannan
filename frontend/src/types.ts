export interface Step {
  id: string;
  workflow_id: string;
  name: string;
  step_type: 'task' | 'approval' | 'notification';
  order: number;
  metadata: string; // JSON string from backend
  rules?: Rule[];
}

export interface Rule {
  id: string;
  step_id: string;
  condition: string;
  next_step_id: string | null;
  priority: number;
}

export interface Workflow {
  id: string;
  name: string;
  version: number;
  is_active: boolean;
  input_schema: string; // JSON string
  start_step_id: string | null;
  steps?: Step[];
  _count?: {
    steps: number;
  };
}

export interface ExecutionLog {
  id: string;
  execution_id: string;
  step_name: string;
  step_type: string;
  evaluated_rules: any; // Parsed or raw JSON
  selected_next_step: string | null;
  status: string;
  approver_id?: string;
  duration?: string;
  error_message?: string;
  started_at: string;
  ended_at: string | null;
}

export interface Execution {
  id: string;
  workflow_id: string;
  workflow_version: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'canceled';
  data: string | Record<string, unknown>; // JSON string or parsed object
  current_step_id: string | null;
  triggered_by: string | null;
  started_at: string;
  ended_at: string | null;
  logs: ExecutionLog[];
  workflow?: Workflow;
}
