import { useState } from 'react';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import WorkflowList from './components/WorkflowList';
import VisualWorkflowEditor from './components/VisualWorkflowEditor';
import ExecutionDashboard from './components/ExecutionDashboard';
import ExecutionList from './components/ExecutionList';
import Analytics from './components/Analytics';
import API_BASE_URL from './config';
import type { Workflow } from './types';

function App() {
  const [screen, setScreen] = useState('list');
  const [isCollapsed, setCollapsed] = useState(false);
  const [activeWorkflow, setActiveWorkflow] = useState<Workflow | null>(null);
  const [activeExecutionId, setActiveExecutionId] = useState<string | null>(null);

  const handleExecute = async (wf: Workflow) => {
    try {
      const inputData: Record<string, any> = {};
      
      if (wf.input_schema) {
        const schema = JSON.parse(wf.input_schema);
        const fields = Object.keys(schema);
        if (fields.length > 0) {
          for (const field of fields) {
            const val = window.prompt(`Enter value for ${field} (${schema[field].type}):`);
            if (val === null) return;
            inputData[field] = schema[field].type === 'number' ? Number(val) : 
                               schema[field].type === 'boolean' ? val === 'true' : val;
          }
        }
      }

      const res = await axios.post(`${API_BASE_URL}/workflows/${wf.id}/execute`, {
        data: inputData,
        triggered_by: 'Dashboard User'
      });
      setActiveExecutionId(res.data.id);
      setScreen('execution');
    } catch (err: unknown) {
      console.error('Failed to start execution', err);
      alert('Failed to start execution. Check console for details.');
    }
  };

  const handleEdit = async (wf: Workflow) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/workflows/${wf.id}`);
      setActiveWorkflow(res.data);
      setScreen('editor');
    } catch (err) {
      console.error('Failed to load workflow details', err);
    }
  };

  const handleSave = async (data: Partial<Workflow>) => {
    try {
      if (activeWorkflow) {
        await axios.put(`${API_BASE_URL}/workflows/${activeWorkflow.id}`, data);
      } else {
        await axios.post(`${API_BASE_URL}/workflows`, data);
      }
      setScreen('list');
    } catch (err) {
      console.error('Failed to save workflow', err);
      alert('Failed to save workflow');
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface">
      <Sidebar 
        activeScreen={screen} 
        setScreen={setScreen} 
        isCollapsed={isCollapsed} 
        setCollapsed={setCollapsed} 
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />

        <main className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-7xl mx-auto h-full flex flex-col">
            {screen === 'list' && (
              <WorkflowList 
                onExecute={handleExecute} 
                onEdit={handleEdit}
                onCreate={() => { setActiveWorkflow(null); setScreen('editor'); }}
              />
            )}
            {screen === 'editor' && (
              <VisualWorkflowEditor 
                workflow={activeWorkflow} 
                onSave={handleSave}
                onClose={() => setScreen('list')}
              />
            )}
            {screen === 'history' && (
              <ExecutionList onSelect={(id) => { setActiveExecutionId(id); setScreen('execution'); }} />
            )}
            {screen === 'execution' && activeExecutionId && (
              <ExecutionDashboard 
                executionId={activeExecutionId} 
                onBack={() => setScreen('history')} 
              />
            )}
            {screen === 'analytics' && (
              <Analytics />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
