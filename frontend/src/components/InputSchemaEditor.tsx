import { Plus, Trash2 } from 'lucide-react';

interface SchemaField {
  name: string;
  type: 'string' | 'number' | 'boolean';
  required: boolean;
}

interface InputSchemaEditorProps {
  schema: Record<string, { type: string; required: boolean }>;
  onChange: (schema: Record<string, { type: string; required: boolean }>) => void;
}

const InputSchemaEditor = ({ schema, onChange }: InputSchemaEditorProps) => {
  // Convert object schema to editable array
  const fields: SchemaField[] = Object.entries(schema).map(([name, config]) => ({
    name,
    type: (config.type as 'string' | 'number' | 'boolean') || 'string',
    required: !!config.required
  }));

  const updateFields = (newFields: SchemaField[]) => {
    const newSchema: Record<string, { type: string; required: boolean }> = {};
    newFields.forEach(f => {
      newSchema[f.name] = { type: f.type, required: f.required };
    });
    onChange(newSchema);
  };

  const addField = () => {
    updateFields([...fields, { name: `field_${fields.length + 1}`, type: 'string', required: false }]);
  };

  const updateField = (idx: number, updates: Partial<SchemaField>) => {
    const newFields = [...fields];
    newFields[idx] = { ...newFields[idx], ...updates };
    updateFields(newFields);
  };

  const removeField = (idx: number) => {
    updateFields(fields.filter((_, i) => i !== idx));
  };

  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <div className="flex flex-col">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Input Schema</h3>
            <span className="text-[10px] text-white/30 font-medium">Define variables available for rule evaluation</span>
        </div>
        <button 
          onClick={addField} 
          className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-primary hover:text-white bg-primary/10 hover:bg-primary rounded-xl transition-all shadow-lg shadow-primary/5"
        >
          <Plus size={14} /> Add Field
        </button>
      </div>
      
      <div className="space-y-3 mt-6">
        {fields.map((field, idx) => (
          <div key={idx} className="grid grid-cols-[1fr_120px_100px_48px] gap-4 items-center bg-black/20 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
            <div className="space-y-1.5">
              <label className="text-[8px] font-bold text-white/20 uppercase tracking-widest pl-1">Field Name</label>
              <input 
                type="text" 
                value={field.name} 
                onChange={(e) => updateField(idx, { name: e.target.value })}
                placeholder="e.g. amount"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[8px] font-bold text-white/20 uppercase tracking-widest pl-1">Data Type</label>
              <select 
                value={field.type} 
                onChange={(e) => updateField(idx, { type: e.target.value as 'string' | 'number' | 'boolean' })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50 transition-colors appearance-none"
              >
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
              </select>
            </div>
            <div className="flex flex-col items-center gap-2 pt-3">
              <label className="text-[8px] font-bold text-white/20 uppercase tracking-widest">Required</label>
              <input 
                type="checkbox" 
                checked={field.required} 
                onChange={(e) => updateField(idx, { required: e.target.checked })} 
                className="w-4 h-4 rounded bg-white/5 border-white/10 text-primary focus:ring-primary/50"
              />
            </div>
            <button 
              onClick={() => removeField(idx)} 
              className="mt-3 p-2.5 text-white/20 hover:text-red-400 bg-white/5 hover:bg-red-400/10 rounded-xl transition-all"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {fields.length === 0 && (
          <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-2xl bg-black/10">
            <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">No inputs defined. The workflow will run with static data.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InputSchemaEditor;
