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
    <div className="glass-card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0 }}>Input Schema</h3>
        <button onClick={addField} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <Plus size={18} /> Add Field
        </button>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {fields.map((field, idx) => (
          <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 80px 40px', gap: '1rem', alignItems: 'center' }}>
            <input 
              type="text" 
              value={field.name} 
              onChange={(e) => updateField(idx, { name: e.target.value })}
              placeholder="Field Name"
              style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '4px' }}
            />
            <select 
              value={field.type} 
              onChange={(e) => updateField(idx, { type: e.target.value as 'string' | 'number' | 'boolean' })}
              style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '4px' }}
            >
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <input 
                type="checkbox" 
                checked={field.required} 
                onChange={(e) => updateField(idx, { required: e.target.checked })} 
              />
              Req.
            </label>
            <button onClick={() => removeField(idx)} style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer' }}>
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        {fields.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No input fields defined. The workflow will run without dynamic data.</p>}
      </div>
    </div>
  );
};

export default InputSchemaEditor;
