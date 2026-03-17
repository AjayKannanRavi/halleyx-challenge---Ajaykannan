import { useState } from 'react';
import axios from 'axios';
import API_BASE from '../config';
import { Save, X, PlusCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { Workflow, Step } from '../types';
import InputSchemaEditor from './InputSchemaEditor';
import RuleEditor from './RuleEditor';

interface WorkflowEditorProps {
  workflow: Workflow | null;
  onSave: () => void;
  onCancel: () => void;
}


const WorkflowEditor = ({ workflow, onSave, onCancel }: WorkflowEditorProps) => {
  const [name, setName] = useState(workflow?.name || '');
  const [inputSchema, setInputSchema] = useState<Record<string, { type: string; required: boolean }>>(
    workflow?.input_schema ? JSON.parse(workflow.input_schema) : {}
  );
  const [steps, setSteps] = useState<Step[]>(workflow?.steps || []);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a workflow name');
      return;
    }

    setLoading(true);
    try {
      const payload = { 
        name, 
        input_schema: JSON.stringify(inputSchema), 
        steps: steps.map((s, i) => ({ ...s, order: i })) 
      };
      
      if (workflow) {
        await axios.put(`${API_BASE}/workflows/${workflow.id}`, payload);
      } else {
        await axios.post(`${API_BASE}/workflows`, payload);
      }
      onSave();
    } catch (err) {
      console.error('Failed to save workflow', err);
      alert('Failed to save workflow');
    } finally {
      setLoading(false);
    }
  };

  const addStep = () => {
    const newStep: Step = {
      id: Math.random().toString(36).substr(2, 9),
      workflow_id: workflow?.id || '',
      name: `Step ${steps.length + 1}`,
      step_type: 'task',
      order: steps.length,
      metadata: '{}',
      rules: []
    };
    setSteps([...steps, newStep]);
    setExpandedStep(steps.length);
  };

  const updateStep = (idx: number, updates: Partial<Step>) => {
    const newSteps = [...steps];
    newSteps[idx] = { ...newSteps[idx], ...updates };
    setSteps(newSteps);
  };

  return (
    <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h2>{workflow ? 'Edit Workflow' : 'Create Workflow'}</h2>
        <button onClick={onCancel} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={24} />
        </button>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Workflow Name</label>
        <input 
          type="text" 
          value={name} 
          onChange={(e) => setName(e.target.value)}
          style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
          placeholder="e.g., Purchase Approval"
        />
      </div>

      <InputSchemaEditor schema={inputSchema} onChange={setInputSchema} />

      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0 }}>Steps & Rules</h3>
          <button 
            onClick={addStep}
            style={{ color: 'var(--primary)', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
          >
            <PlusCircle size={20} /> Add Step
          </button>
        </div>

        {steps.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem', border: '1px dashed var(--glass-border)', borderRadius: '8px' }}>
            No steps defined yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[...steps].sort((a, b) => a.order - b.order).map((step, idx) => (
              <div key={idx} className="glass-card" style={{ padding: '1rem', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <input 
                      type="text" 
                      value={step.name} 
                      onChange={(e) => updateStep(idx, { name: e.target.value })}
                      style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--glass-border)', color: 'white', padding: '0.25rem', fontWeight: 'bold' }}
                    />
                  </div>
                  <select 
                    value={step.step_type} 
                    onChange={(e) => updateStep(idx, { step_type: e.target.value as 'task' | 'approval' | 'notification' })}
                    style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '0.25rem', borderRadius: '4px' }}
                  >
                    <option value="task">Task</option>
                    <option value="approval">Approval</option>
                    <option value="notification">Notification</option>
                  </select>
                  <button 
                    onClick={() => setExpandedStep(expandedStep === idx ? null : idx)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    {expandedStep === idx ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>
                
                {expandedStep === idx && (
                  <RuleEditor 
                    rules={step.rules || []} 
                    steps={steps} 
                    currentStepId={step.id} 
                    onChange={(newRules) => updateStep(idx, { rules: newRules })} 
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
        <button 
          className="btn-primary" 
          onClick={handleSave} 
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: loading ? 0.7 : 1 }}
        >
          <Save size={20} /> {loading ? 'Saving...' : 'Save Workflow'}
        </button>
      </div>
    </div>
  );
};

export default WorkflowEditor;
