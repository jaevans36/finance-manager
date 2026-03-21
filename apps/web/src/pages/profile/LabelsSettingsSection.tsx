import { useState } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { useLabels, useCreateLabel, useUpdateLabel, useDeleteLabel } from '../../hooks/queries/useLabels';
import { LabelBadge } from '../../components/labels/LabelBadge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useToast } from '../../contexts/ToastContext';

const PRESET_COLOURS = [
  '#21B8A4', '#6366f1', '#f43f5e', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#0ea5e9',
  '#8b5cf6', '#ec4899', '#64748b', '#171717',
];

export function LabelsSettingsSection() {
  const { data: labels = [], isLoading } = useLabels();
  const toast = useToast();
  const createLabel = useCreateLabel();
  const updateLabel = useUpdateLabel();
  const deleteLabel = useDeleteLabel();

  const [newName, setNewName] = useState('');
  const [newColour, setNewColour] = useState(PRESET_COLOURS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColour, setEditColour] = useState('');

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createLabel.mutateAsync({ name: newName.trim(), colourHex: newColour });
      setNewName('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create label';
      toast.error(message);
    }
  };

  const startEdit = (id: string, name: string, colour: string) => {
    setEditingId(id);
    setEditName(name);
    setEditColour(colour);
  };

  const handleUpdate = async () => {
    if (!editingId || !editName.trim()) return;
    try {
      await updateLabel.mutateAsync({ id: editingId, payload: { name: editName.trim(), colourHex: editColour } });
      setEditingId(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update label';
      toast.error(message);
    }
  };

  const handleDelete = (id: string) => {
    deleteLabel.mutate(id, {
      onError: (err: unknown) => {
        const message = err instanceof Error ? err.message : 'Failed to delete label';
        toast.error(message);
      },
    });
  };

  if (isLoading) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Labels</h2>

      <div className="space-y-2">
        {labels.map(label => (
          <div key={label.id} className="flex items-center gap-2">
            {editingId === label.id ? (
              <>
                <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-7 w-40 text-sm" />
                <div className="flex gap-1">
                  {PRESET_COLOURS.map(c => (
                    <button key={c} type="button" onClick={() => setEditColour(c)}
                      className={`h-4 w-4 rounded-full border-2 ${editColour === c ? 'border-foreground' : 'border-transparent'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
                <Button size="icon" variant="ghost" onClick={handleUpdate} disabled={updateLabel.isPending}><Check className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
              </>
            ) : (
              <>
                <LabelBadge label={label} />
                <Button size="icon" variant="ghost" onClick={() => startEdit(label.id, label.name, label.colourHex)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => handleDelete(label.id)} disabled={deleteLabel.isPending}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="New label name"
          className="h-8 w-40 text-sm" onKeyDown={e => e.key === 'Enter' && handleCreate()} />
        <div className="flex gap-1">
          {PRESET_COLOURS.map(c => (
            <button key={c} type="button" onClick={() => setNewColour(c)}
              className={`h-5 w-5 rounded-full border-2 ${newColour === c ? 'border-foreground' : 'border-transparent'}`}
              style={{ backgroundColor: c }} />
          ))}
        </div>
        <Button size="sm" onClick={handleCreate} disabled={!newName.trim() || createLabel.isPending}>Add</Button>
      </div>
    </section>
  );
}
