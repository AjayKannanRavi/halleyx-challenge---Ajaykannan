import { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, { 
  addEdge, 
  Background, 
  Controls, 
  type Connection, 
  type Edge, 
  type Node, 
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { TaskNode, ApprovalNode, NotificationNode } from './nodes/CustomNodes';
import { Save, Play, Trash2, X, User, Bell, ChevronLeft, Activity } from 'lucide-react';
import type { Workflow, Step, Rule } from '../types';
import RuleEditor from './RuleEditor';

const nodeTypes = {
  task: TaskNode,
  approval: ApprovalNode,
  notification: NotificationNode,
};

const defaultEdgeOptions = {
  style: { strokeWidth: 2, stroke: '#6366f1' },
  markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
  animated: true,
};

interface VisualWorkflowEditorProps {
  workflow: Workflow | null;
  onSave: (data: Partial<Workflow>) => void;
  onClose: () => void;
}

const VisualWorkflowEditor = ({ workflow, onSave, onClose }: VisualWorkflowEditorProps) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [workflowName, setWorkflowName] = useState(workflow?.name || 'New Workflow');
  const [isEditingName, setIsEditingName] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // Initialize nodes and edges from workflow prop
  useEffect(() => {
    if (workflow?.steps) {
      const initialNodes: Node[] = workflow.steps.map((step: any, idx: number) => ({
        id: step.id,
        type: step.step_type,
        position: { x: 100, y: idx * 150 },
        data: { label: step.name, metadata: step.metadata },
      }));

      const initialEdges: Edge[] = [];
      workflow.steps.forEach((step: any) => {
        if (step.rules) {
          step.rules.forEach((rule: any) => {
            if (rule.next_step_id) {
              initialEdges.push({
                id: `e-${step.id}-${rule.next_step_id}`,
                source: step.id,
                target: rule.next_step_id,
                label: rule.condition !== 'DEFAULT' ? rule.condition : '',
                data: { ruleId: rule.id, condition: rule.condition },
              });
            }
          });
        }
      });

      setNodes(initialNodes);
      setEdges(initialEdges);
      setWorkflowName(workflow.name || 'New Workflow'); // Update workflow name if workflow prop changes
    }
  }, [workflow, setNodes, setEdges]);

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');

      if (!type || !reactFlowInstance) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        position,
        data: { label: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`, metadata: '{}' },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const handleSave = () => {
    const steps: Step[] = nodes.map((node, idx) => {
      const nodeEdges = edges.filter((e) => e.source === node.id);
      const rules = nodeEdges.map((edge) => ({
        condition: edge.data?.condition || 'DEFAULT',
        next_step_id: edge.target,
        priority: edge.data?.priority || 1,
      }));

      return {
        id: node.id,
        workflow_id: workflow?.id || '',
        name: node.data.label,
        step_type: node.type as any,
        order: idx,
        metadata: node.data.metadata,
        rules: rules as any,
      };
    });

    // Identify start step (node with no incoming edges, or first node)
    const startStepId = nodes.find(n => !edges.some(e => e.target === n.id))?.id || nodes[0]?.id;

    onSave({ 
      name: workflowName, 
      steps: steps,
      start_step_id: startStepId
    });
  };

  return (
    <div className="flex flex-col h-full bg-surface-lighter rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
      <div className="flex items-center justify-between px-6 py-4 bg-surface border-b border-white/5">
        <div className="flex items-center gap-6">
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
            <ChevronLeft size={24} className="text-white/40" />
          </button>
          <div>
            <div className="flex items-center gap-2 group">
              {isEditingName ? (
                <input
                  type="text"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  onBlur={() => setIsEditingName(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                  autoFocus
                  className="bg-transparent border-b border-primary text-xl font-extrabold text-white focus:outline-none"
                />
              ) : (
                <h2 
                  onClick={() => setIsEditingName(true)}
                  className="text-xl font-extrabold text-white tracking-tight cursor-pointer hover:text-primary transition-colors flex items-center gap-2"
                >
                  {workflowName}
                  <Activity size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </h2>
              )}
            </div>
            <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Visual Builder</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white/60 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-xl">
            <Play className="w-4 h-4" /> Run
          </button>
          <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-primary hover:bg-secondary rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95">
            <Save className="w-4 h-4" /> Save Workflow
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative" ref={reactFlowWrapper}>
        <div className="absolute left-4 top-4 z-10 flex flex-col gap-2 p-2 bg-surface/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
          {[
            { type: 'task', icon: Play, label: 'Task' },
            { type: 'approval', icon: User, label: 'Approval' },
            { type: 'notification', icon: Bell, label: 'Notify' },
          ].map((item) => (
            <div
              key={item.type}
              className="group flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-primary/20 cursor-grab active:cursor-grabbing transition-all border border-transparent hover:border-primary/30"
              onDragStart={(event) => {
                event.dataTransfer.setData('application/reactflow', item.type);
                event.dataTransfer.effectAllowed = 'move';
              }}
              draggable
            >
              <item.icon className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold text-white/40 group-hover:text-primary transition-colors uppercase">{item.label}</span>
            </div>
          ))}
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          onNodeClick={(_, node) => setSelectedNode(node)}
          fitView
          className="bg-[#0b1120]"
        >
          <Background color="#1e293b" gap={20} />
          <Controls className="!bg-surface !border-white/10 !rounded-xl !shadow-2xl overflow-hidden [&_button]:!border-white/5 [&_button]:!fill-white/60 hover:[&_button]:!bg-white/5" />
        </ReactFlow>

        {selectedNode && (
          <div className="absolute right-4 top-4 bottom-4 w-80 z-10 bg-surface/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h3 className="font-bold text-white/90">Step Settings</h3>
              <button onClick={() => setSelectedNode(null)} className="p-1 hover:bg-white/5 rounded transition-colors">
                <X className="w-4 h-4 text-white/40" />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-6 flex-1 overflow-y-auto">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Step Name</label>
                <input
                  type="text"
                  value={selectedNode.data.label}
                  onChange={(e) => {
                    const label = e.target.value;
                    setNodes((nds) => nds.map((node) => node.id === selectedNode.id ? { ...node, data: { ...node.data, label } } : node));
                    setSelectedNode((prev: any) => prev ? ({ ...prev, data: { ...prev.data, label } }) : null);
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Metadata (JSON)</label>
                <textarea
                  value={selectedNode.data.metadata}
                  onChange={(e) => {
                    const metadata = e.target.value;
                    setNodes((nds) => nds.map((node) => node.id === selectedNode.id ? { ...node, data: { ...node.data, metadata } } : node));
                    setSelectedNode((prev: any) => prev ? ({ ...prev, data: { ...prev.data, metadata } }) : null);
                  }}
                  className="w-full h-32 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-mono text-white/80 focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              <div className="space-y-4">
                <RuleEditor 
                  rules={edges.filter(e => e.source === selectedNode.id).map(e => ({
                    id: e.id,
                    step_id: selectedNode.id,
                    condition: e.data?.condition || 'DEFAULT',
                    next_step_id: e.target,
                    priority: e.data?.priority || 1
                  }))}
                  steps={nodes.map(n => ({ id: n.id, name: n.data.label } as any))}
                  currentStepId={selectedNode.id}
                  onChange={(newRules: Rule[]) => {
                    // Remove old edges from this source
                    const otherEdges = edges.filter(e => e.source !== selectedNode.id);
                    // Add new edges based on rules
                    const newEdges = newRules.map((r: Rule) => ({
                      id: r.id || `e-${selectedNode.id}-${r.next_step_id}-${Math.random()}`,
                      source: selectedNode.id,
                      target: r.next_step_id || '',
                      label: r.condition !== 'DEFAULT' ? r.condition : '',
                      data: { condition: r.condition, priority: r.priority },
                      ...defaultEdgeOptions
                    }));
                    setEdges([...otherEdges, ...newEdges]);
                  }}
                />
              </div>
            </div>
            <div className="p-6 border-t border-white/5">
              <button 
                onClick={() => {
                  setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
                  setSelectedNode(null);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-red-400 bg-red-400/10 hover:bg-red-400/20 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Delete Step
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function WrappedEditor(props: VisualWorkflowEditorProps) {
  return (
    <ReactFlowProvider>
      <VisualWorkflowEditor {...props} />
    </ReactFlowProvider>
  );
}
