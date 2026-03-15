import { useEffect, useState } from 'react';
import axios from 'axios';
import { Activity, Clock, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

const API_BASE = 'http://localhost:3001';

interface Execution {
  id: string;
  workflow_id: string;
  status: string;
  started_at: string;
  workflow?: { name: string };
}

interface ExecutionListProps {
  onSelect: (id: string) => void;
}

const ExecutionList = ({ onSelect }: ExecutionListProps) => {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExecutions = async () => {
      try {
        const res = await axios.get(`${API_BASE}/executions`);
        setExecutions(res.data);
      } catch (err) {
        console.error('Failed to fetch executions', err);
      } finally {
        setLoading(false);
      }
    };
    fetchExecutions();
  }, []);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed': return { color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20' };
      case 'failed': return { color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' };
      case 'in_progress': return { color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' };
      case 'canceled': return { color: 'text-white/40', bg: 'bg-white/5', border: 'border-white/10' };
      default: return { color: 'text-white', bg: 'bg-white/5', border: 'border-white/10' };
    }
  };

  return (
    <div className="flex flex-col gap-8 h-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Execution History</h2>
          <p className="text-white/40 text-sm mt-1 font-medium">Audit logs and performance of your workflows.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {executions.map((exe) => {
            const config = getStatusConfig(exe.status);
            return (
              <button 
                key={exe.id} 
                onClick={() => onSelect(exe.id)}
                className="group flex items-center justify-between p-6 bg-surface-lighter border border-white/5 rounded-3xl hover:bg-white/5 hover:border-white/10 transition-all text-left"
              >
                <div className="flex items-center gap-6">
                  <div className={clsx('p-4 rounded-2xl bg-white/5 transition-transform group-hover:scale-110', config.color)}>
                    <Activity size={24} />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white group-hover:text-primary transition-colors">{exe.workflow?.name || 'Deleted Workflow'}</div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-white/30">
                        <Clock size={12} /> {new Date(exe.started_at).toLocaleString()}
                      </div>
                      <div className="h-1 w-1 rounded-full bg-white/10" />
                      <div className="text-[10px] font-mono text-white/20 uppercase tracking-widest">{exe.id.slice(0, 8)}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <span className={clsx(
                    'px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all',
                    config.bg, config.color, config.border
                  )}>
                    {exe.status}
                  </span>
                  <ChevronRight size={20} className="text-white/10 group-hover:text-white transition-colors" />
                </div>
              </button>
            );
          })}
          
          {executions.length === 0 && (
             <div className="py-20 bg-white/5 border-2 border-dashed border-white/5 rounded-[40px] flex flex-col items-center justify-center text-center">
               <Activity className="text-white/20 w-8 h-8 mb-6" />
               <h3 className="text-white font-bold">No History</h3>
               <p className="text-white/30 text-sm mt-2">Run a workflow to see logs here.</p>
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExecutionList;
