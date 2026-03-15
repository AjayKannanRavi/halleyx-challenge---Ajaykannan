import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X, Command, Move, Play, Save, Plus } from 'lucide-react';

interface ShortcutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ShortcutModal = ({ isOpen, onClose }: ShortcutModalProps) => {
  const shortcuts = [
    { key: '⌘ + K', label: 'Global Search', icon: Command },
    { key: 'N', label: 'Create New Workflow', icon: Plus },
    { key: 'S', label: 'Save Workflow (Editor)', icon: Save },
    { key: 'R', label: 'Run Workflow', icon: Play },
    { key: 'Space', label: 'Pan Canvas', icon: Move },
    { key: 'Esc', label: 'Close Modal / Cancel', icon: X },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-surface/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-surface border border-white/10 rounded-[40px] shadow-2xl overflow-hidden p-8"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                  <Keyboard size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight">Keyboard Shortcuts</h2>
                  <p className="text-xs text-white/30 font-bold uppercase tracking-widest">Master the builder</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-xl text-white/20 hover:text-white transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {shortcuts.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-primary/30 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-white/5 text-white/40 group-hover:text-primary transition-colors">
                      <s.icon size={16} />
                    </div>
                    <span className="text-sm font-bold text-white/80">{s.label}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {s.key.split(' ').map((part, idx) => (
                      <kbd key={idx} className="px-2 py-1 rounded bg-white/10 border border-white/10 text-[10px] font-mono text-white/40 group-hover:text-white transition-colors">
                        {part}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-white/5 text-center">
              <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">
                More shortcuts coming soon • HalleyX Pro
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ShortcutModal;
