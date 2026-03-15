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
    <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h4 style={{ margin: 0, fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Decision Rules</h4>
        <button onClick={addRule} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <Plus size={14} /> Add Rule
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {rules.map((rule, idx) => (
          <div key={rule.id} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 150px 40px', gap: '0.5rem', alignItems: 'center' }}>
            <input 
              type="number" 
              value={rule.priority} 
              onChange={(e) => updateRule(idx, { priority: parseInt(e.target.value) })}
              placeholder="Prio"
              style={{ width: '100%', padding: '0.25rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '4px' }}
            />
            <input 
              type="text" 
              value={rule.condition} 
              onChange={(e) => updateRule(idx, { condition: e.target.value })}
              placeholder="Condition (e.g. amount > 100)"
              style={{ width: '100%', padding: '0.25rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '4px' }}
            />
            <select 
              value={rule.next_step_id || ''} 
              onChange={(e) => updateRule(idx, { next_step_id: e.target.value || null })}
              style={{ width: '100%', padding: '0.25rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '4px' }}
            >
              <option value="">Finish</option>
              {steps.filter(s => s.id !== currentStepId).map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <button onClick={() => removeRule(idx)} style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer' }}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {rules.length === 0 && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>Direct completion if no rules match.</p>}
      </div>
    </div>
  );
};

export default RuleEditor;
