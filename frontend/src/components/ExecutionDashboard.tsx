import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import ReactFlow, { 
  Background, 
  type Node, 
  type Edge, 
  ReactFlowProvider,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { TaskNode, ApprovalNode, NotificationNode } from './nodes/CustomNodes';
import { Activity, RotateCcw, ChevronLeft, Clock, ShieldCheck, User } from 'lucide-react';
import type { Execution, ExecutionLog, Step } from '../types';
import { clsx } from 'clsx';

const nodeTypes = {
  task: TaskNode,
  approval: ApprovalNode,
  notification: NotificationNode,
};

interface ExecutionDashboardProps {
  executionId: string | null;
  onBack: () => void;
}

const ExecutionDashboardContent = ({ executionId, onBack }: ExecutionDashboardProps) => {
  const [execution, setExecution] = useState<Execution | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchExecution = useCallback(async () => {
    try {
      const res = await axios.get(`http://localhost:3001/executions/${executionId}`);
      const exe = res.data;
      setExecution(exe);

      if (exe.workflow?.steps) {
        const activeStepId = exe.status === 'in_progress' ? exe.current_step_id : null;
        const completedStepIds = exe.logs.filter((l: ExecutionLog) => l.status === 'completed').map((l: ExecutionLog) => {
          return exe.workflow?.steps.find((s: Step) => s.name === l.step_name)?.id;
        });

        const newNodes: Node[] = (exe.workflow?.steps || []).map((step: Step, idx: number) => {
          let status = 'pending';
          if (step.id === activeStepId) status = 'in_progress';
          else if (completedStepIds.includes(step.id)) status = 'completed';

          return {
            id: step.id,
            type: step.step_type,
            position: { x: 100, y: idx * 150 },
            data: { 
              label: step.name, 
              metadata: step.metadata,
              status: status
            },
          };
        });

        const newEdges: Edge[] = [];
        (exe.workflow?.steps || []).forEach((step: Step) => {
          if (step.rules) {
            step.rules.forEach((rule: any) => {
              if (rule.next_step_id) {
                const isSelected = exe.logs.some((l: ExecutionLog) => l.selected_next_step === rule.next_step_id && exe.workflow?.steps.find((s: Step) => s.name === l.step_name)?.id === step.id);
                
                newEdges.push({
                  id: `e-${step.id}-${rule.next_step_id}`,
                  source: step.id,
                  target: rule.next_step_id,
                  label: rule.condition !== 'DEFAULT' ? rule.condition : '',
                  animated: status === 'in_progress',
                  style: { 
                    stroke: isSelected ? '#10b981' : '#6366f1', 
                    strokeWidth: isSelected ? 3 : 2,
                    opacity: isSelected ? 1 : 0.4
                  },
                  markerEnd: { 
                    type: MarkerType.ArrowClosed, 
                    color: isSelected ? '#10b981' : '#6366f1' 
                  },
                });
              }
            });
          }
        });

        setNodes(newNodes);
        setEdges(newEdges);
      }
    } catch (err) {
      console.error('Failed to fetch execution', err);
    } finally {
      setLoading(false);
    }
  }, [executionId]);

  useEffect(() => {
    if (!executionId) return;
    fetchExecution();
    const interval = setInterval(fetchExecution, 3000);
    return () => clearInterval(interval);
  }, [executionId, fetchExecution]);

  const handleApprove = async (approved: boolean) => {
    if (!executionId) return;
    setProcessing(true);
    try {
      await axios.post(`http://localhost:3001/executions/${executionId}/process`, {
        metadata: { approved }
      });
      fetchExecution();
    } catch (err) {
      console.error('Failed to process approval', err);
      alert('Failed to process approval');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!execution) return <div className="p-8 text-white/40">Execution not found.</div>;

  return (
    <div className="flex flex-col h-full bg-surface-lighter rounded-[32px] overflow-hidden border border-white/5 shadow-2xl relative">
      <div className="px-8 py-6 bg-surface border-b border-white/5 flex items-center justify-between z-10 transition-all">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
            <ChevronLeft size={24} className="text-white/40" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-extrabold text-white tracking-tight">Run: <span className="text-primary">{execution.id.slice(0, 8)}</span></h2>
              <div className={clsx(
                "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-xl",
                execution.status === 'completed' ? "bg-green-400/10 text-green-400 border-green-400/20 shadow-green-400/5" :
                execution.status === 'failed' ? "bg-red-400/10 text-red-400 border-red-400/20 shadow-red-400/5" :
                "bg-primary/10 text-primary border-primary/20 shadow-primary/5"
              )}>
                {execution.status}
              </div>
            </div>
            <p className="text-white/30 text-xs mt-1 font-medium">{execution.workflow?.name || 'Workflow'} • Started by {execution.triggered_by || 'System'}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Duration</div>
            <div className="text-sm font-mono text-white/80 font-bold">2.4s</div>
          </div>
          <button className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all shadow-xl">
            <RotateCcw size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 relative flex overflow-hidden">
        <div className="flex-1 bg-[#0b1120]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            nodesDraggable={false}
            nodesConnectable={false}
          >
            <Background color="#1e293b" gap={20} />
          </ReactFlow>
        </div>

        <div className="w-96 bg-surface/50 backdrop-blur-3xl border-l border-white/5 flex flex-col z-20 overflow-hidden">
          <div className="p-8 border-b border-white/5">
             <div className="flex items-center gap-2 mb-4">
               <ShieldCheck className="text-primary w-5 h-5" />
               <h3 className="font-bold text-white uppercase tracking-widest text-xs">Node Controls</h3>
             </div>
             
             {execution.status === 'in_progress' ? (
               <div className="p-6 bg-primary/10 border border-primary/20 rounded-3xl backdrop-blur-xl animate-in zoom-in-95 duration-500">
                 <div className="flex flex-col items-center text-center gap-4">
                   <div className="p-4 bg-primary/20 rounded-[40px] shadow-2xl shadow-primary/20">
                     <User size={32} className="text-primary animate-pulse" />
                   </div>
                   <div>
                     <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1 block">Decision Peak</span>
                     <h4 className="text-white font-bold leading-tight">Waiting for Manual Approval</h4>
                   </div>
                   <div className="flex gap-2 w-full mt-2">
                     <button 
                       onClick={() => handleApprove(true)}
                       disabled={processing}
                       className="flex-1 py-3 bg-primary hover:bg-secondary text-white font-bold rounded-2xl transition-all shadow-xl shadow-primary/20 active:scale-95 disabled:opacity-50"
                     >
                       Approve
                     </button>
                     <button 
                       onClick={() => handleApprove(false)}
                       disabled={processing}
                       className="flex-1 py-3 bg-red-400/20 hover:bg-red-400 text-red-400 hover:text-white font-bold rounded-2xl border border-red-400/20 transition-all active:scale-95 disabled:opacity-50"
                     >
                       Reject
                     </button>
                    </div>
                 </div>
               </div>
             ) : (
               <div className="py-10 text-center">
                 <div className="w-12 h-12 bg-white/5 rounded-[20px] flex items-center justify-center mx-auto mb-4">
                    <Activity size={24} className="text-white/20" />
                 </div>
                 <p className="text-white/30 text-xs font-medium">No actions pending for this state.</p>
               </div>
             )}
          </div>

          <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 custom-scrollbar">
            <div className="flex items-center gap-2">
              <Clock className="text-white/20 w-4 h-4" />
              <h3 className="font-bold text-white/40 uppercase tracking-widest text-xs">Execution Logs</h3>
            </div>
            
            {execution.logs.map((log: ExecutionLog, idx: number) => (
              <div key={idx} className="relative pl-6 before:absolute before:left-0 before:top-1.5 before:bottom-0 before:w-[2px] before:bg-white/5 border-b border-white/5 pb-4 last:border-0">
                <div className="absolute left-[-4px] top-1.5 w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                <div className="mb-1 flex justify-between items-center">
                  <span className="text-sm font-bold text-white/80">{log.step_name}</span>
                  <span className={clsx(
                    "text-[10px] font-bold uppercase",
                    log.status === 'completed' ? "text-green-400" : "text-amber-400"
                  )}>{log.status}</span>
                </div>
                
                {log.evaluated_rules && Array.isArray(log.evaluated_rules) && (
                  <div className="mt-2 space-y-1">
                    {log.evaluated_rules.map((r: any, rIdx: number) => (
                      <div key={rIdx} className="flex items-center gap-2 text-[10px]">
                        <div className={clsx(
                          "w-1 h-1 rounded-full",
                          r.result ? "bg-green-400" : "bg-white/10"
                        )} />
                        <span className={clsx(
                          "font-mono",
                          r.result ? "text-white/80" : "text-white/20"
                        )}>{r.rule}</span>
                        {r.result && <span className="text-[8px] font-bold text-green-400/50 ml-auto">MATCH</span>}
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-[10px] text-white/30 mt-3 font-medium flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span>Target: <span className="text-white/60">{log.selected_next_step || 'End of Flow'}</span></span>
                    {log.duration && <span>Duration: <span className="text-primary/60">{log.duration}</span></span>}
                  </div>
                  {log.approver_id && <span>By: <span className="text-primary/60">{log.approver_id}</span></span>}
                </div>
              </div>
            ))}
            
            {execution.logs.length === 0 && (
              <p className="text-white/20 text-xs italic">Execution started. Waiting for logs...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ExecutionDashboard = (props: ExecutionDashboardProps) => (
  <ReactFlowProvider>
    <ExecutionDashboardContent {...props} />
  </ReactFlowProvider>
);

export default ExecutionDashboard;
