import { useEffect, useState } from 'react';
import axios from 'axios';
import { Play, Plus, Edit, Layers, Trash2 } from 'lucide-react';
import type { Workflow } from '../types';

const API_BASE = 'http://localhost:3001';

interface WorkflowListProps {
  onExecute: (wf: Workflow) => void;
  onEdit: (wf: Workflow) => void;
  onCreate: () => void;
}

const WorkflowList = ({ onExecute, onEdit, onCreate }: WorkflowListProps) => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const res = await axios.get(`${API_BASE}/workflows`);
      setWorkflows(res.data);
    } catch (err) {
      console.error('Failed to fetch workflows', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this workflow?')) return;
    try {
      await axios.delete(`${API_BASE}/workflows/${id}`);
      fetchWorkflows();
    } catch (err) {
      console.error('Failed to delete workflow', err);
    }
  };

  return (
    <div className="flex flex-col gap-8 h-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Workflows</h2>
          <p className="text-white/40 text-sm mt-1 font-medium">Manage and automate your business processes.</p>
        </div>
        <button 
          onClick={onCreate}
          className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-secondary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95 translate-y-0 hover:-translate-y-1"
        >
          <Plus size={20} /> New Workflow
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-white/40 font-bold uppercase tracking-widest text-[10px]">Loading Workflows</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {workflows.map((wf) => (
            <div key={wf.id} className="group relative bg-surface-lighter border border-white/5 p-6 rounded-3xl hover:border-primary/50 transition-all hover:shadow-2xl hover:shadow-primary/5">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary group-hover:scale-110 transition-transform">
                  <Layers size={24} />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Version</span>
                  <span className="text-sm font-mono text-primary font-bold">1.{wf.version}</span>
                </div>
              </div>

              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors line-clamp-1">{wf.name}</h3>
              <p className="text-white/40 text-sm mb-8 line-clamp-2 leading-relaxed">
                Contains {wf._count?.steps || 0} logic steps. Ready for automated execution.
              </p>

              <div className="flex items-center justify-between border-t border-white/5 pt-6">
                <div className="flex gap-2">
                  <button 
                    onClick={() => onExecute(wf)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary text-primary hover:text-white text-xs font-bold rounded-xl transition-all"
                  >
                    <Play size={14} /> Run
                  </button>
                  <button 
                    onClick={() => onEdit(wf)}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-bold rounded-xl transition-all"
                  >
                    <Edit size={14} /> Editor
                  </button>
                </div>
                <button 
                  onClick={() => handleDelete(wf.id)}
                  className="p-2 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}

          {workflows.length === 0 && (
            <div className="col-span-full py-20 bg-white/5 border-2 border-dashed border-white/5 rounded-[40px] flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
                <Layers className="text-white/20 w-8 h-8" />
              </div>
              <h3 className="text-white font-bold text-lg">No Workflows Yet</h3>
              <p className="text-white/30 text-sm max-w-[280px] mt-2">Create your first automated process to see it here.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkflowList;
