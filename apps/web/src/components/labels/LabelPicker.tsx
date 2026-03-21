import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useLabels, useCreateLabel } from '../../hooks/queries/useLabels';
import { LabelBadge } from './LabelBadge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';

// 12 preset colours from the design system palette
const PRESET_COLOURS = [
  '#21B8A4', '#6366f1', '#f43f5e', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#0ea5e9',
  '#8b5cf6', '#ec4899', '#64748b', '#171717',
];

interface LabelPickerProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function LabelPicker({ selectedIds, onChange }: LabelPickerProps) {
  const { data: labels = [] } = useLabels();
  const createLabel = useCreateLabel();
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColour, setNewColour] = useState(PRESET_COLOURS[0]);

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter(s => s !== id) : [...selectedIds, id]);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const label = await createLabel.mutateAsync({ name: newName.trim(), colourHex: newColour });
    onChange([...selectedIds, label.id]);
    setNewName('');
    setIsCreating(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {labels.map(label => (
          <button
            key={label.id}
            type="button"
            onClick={() => toggle(label.id)}
            className={cn('rounded-full border-2 transition-all', selectedIds.includes(label.id) ? 'border-foreground' : 'border-transparent')}
          >
            <LabelBadge label={label} />
          </button>
        ))}
        <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreating(v => !v)}>
          <Plus className="h-3 w-3 mr-1" /> New label
        </Button>
      </div>

      {isCreating && (
        <div className="flex items-center gap-2 rounded-md border p-2">
          <Input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Label name"
            className="h-7 text-sm"
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <div className="flex gap-1">
            {PRESET_COLOURS.map(c => (
              <button
                key={c}
                type="button"
                className={cn('h-5 w-5 rounded-full border-2', newColour === c ? 'border-foreground' : 'border-transparent')}
                style={{ backgroundColor: c }}
                onClick={() => setNewColour(c)}
              />
            ))}
          </div>
          <Button type="button" size="sm" onClick={handleCreate} disabled={!newName.trim()}>
            Add
          </Button>
        </div>
      )}
    </div>
  );
}
