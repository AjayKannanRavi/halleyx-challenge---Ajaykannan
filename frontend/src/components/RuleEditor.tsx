import { Plus, Trash2 } from 'lucide-react';
import type { Rule, Step } from '../types';

interface RuleEditorProps {
  rules: Rule[];
  steps: Step[];
  currentStepId: string;
  onChange: (rules: Rule[]) => void;
}

const RuleEditor = ({ rules, steps, currentStepId, onChange }: RuleEditorProps) => {
  const addRule = () => {
    const newRule: Rule = {
      id: Math.random().toString(36).substr(2, 9),
      step_id: currentStepId,
      condition: '',
      next_step_id: null,
      priority: rules.length + 1
    };
    onChange([...rules, newRule]);
  };

  const updateRule = (idx: number, updates: Partial<Rule>) => {
    const newRules = [...rules];
    newRules[idx] = { ...newRules[idx], ...updates };
    onChange(newRules);
  };

  const removeRule = (idx: number) => {
    onChange(rules.filter((_, i) => i !== idx));
  };

  return (
    <div className="mt-6 p-6 bg-white/5 rounded-2xl border border-white/10 space-y-4">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Decision Rules</h4>
        <button 
          onClick={addRule} 
          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-primary hover:text-white bg-primary/10 hover:bg-primary rounded-lg transition-all"
        >
          <Plus size={12} /> Add Rule
        </button>
      </div>

      <div className="space-y-3">
        {rules.map((rule, idx) => (
          <div key={rule.id} className="grid grid-cols-[60px_1fr] md:grid-cols-[60px_1fr_120px_40px] gap-3 items-end p-4 bg-black/20 rounded-xl border border-white/5 relative group">
            <div className="space-y-1.5">
              <label className="text-[8px] font-bold text-white/20 uppercase">Prio</label>
              <input 
                type="number" 
                value={rule.priority} 
                onChange={(e) => updateRule(idx, { priority: parseInt(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-primary/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[8px] font-bold text-white/20 uppercase">Condition (JS Logic)</label>
              <input 
                type="text" 
                value={rule.condition} 
                onChange={(e) => updateRule(idx, { condition: e.target.value })}
                placeholder="e.g. amount > 100"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/10 focus:outline-none focus:border-primary/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[8px] font-bold text-white/20 uppercase">Next Step</label>
              <select 
                value={rule.next_step_id || ''} 
                onChange={(e) => updateRule(idx, { next_step_id: e.target.value || null })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-primary/50 appearance-none"
              >
                <option value="">Finish</option>
                {steps.filter(s => s.id !== currentStepId).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <button 
              onClick={() => removeRule(idx)} 
              className="p-2 text-white/20 hover:text-red-400 transition-colors bg-white/5 hover:bg-red-400/10 rounded-lg"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {rules.length === 0 && (
          <div className="py-8 text-center border-2 border-dashed border-white/5 rounded-2xl">
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">No Rules defined. Direct completion.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RuleEditor;
