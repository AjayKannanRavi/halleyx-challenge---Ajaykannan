import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle2, XCircle, Clock, Activity, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState, useEffect } from 'react';
import axios from 'axios';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenter = ({ isOpen, onClose }: NotificationCenterProps) => {
  const [executions, setExecutions] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      axios.get('http://localhost:3001/executions').then(res => {
        setExecutions(res.data.slice(0, 5));
      });
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-16 right-32 w-80 bg-surface border border-white/10 rounded-3xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Bell size={14} className="text-primary" />
                Recent Activity
              </h3>
              <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Live</span>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {executions.length === 0 ? (
                <div className="p-8 text-center">
                  <Activity size={32} className="text-white/10 mx-auto mb-4" />
                  <p className="text-xs text-white/30 font-bold uppercase tracking-widest">No recent events</p>
                </div>
              ) : (
                executions.map((ex, i) => (
                  <div key={ex.id} className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors group cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {ex.status === 'completed' ? (
                          <CheckCircle2 size={16} className="text-emerald-500" />
                        ) : ex.status === 'failed' ? (
                          <XCircle size={16} className="text-rose-500" />
                        ) : (
                          <Activity size={16} className="text-primary animate-pulse" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white group-hover:text-primary transition-colors truncate">
                          {ex.workflow?.name || 'Workflow'}: {ex.status}
                        </div>
                        <div className="text-[10px] text-white/30 font-medium flex items-center gap-2 mt-1">
                          <Clock size={10} />
                          {formatDistanceToNow(new Date(ex.started_at))} ago
                        </div>
                      </div>
                      <ExternalLink size={12} className="text-white/10 group-hover:text-white/40 transition-colors" />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-white/5 text-center">
              <button 
                onClick={onClose}
                className="text-[10px] font-black text-white/40 hover:text-white uppercase tracking-widest transition-colors"
              >
                Clear all notifications
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationCenter;
