import { useState } from 'react';
import styled from 'styled-components';
import { useToast } from '../../contexts/ToastContext';
import { taskGroupService } from '../../services/taskGroupService';
import { Button, Input, TextArea, FormGroup, Label, Alert, Flex } from '../ui';
import { XCircleIcon } from 'lucide-react';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: ${({ theme }) => theme.colors.background};
  padding: 24px;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  max-height: 90vh;
  overflow-y: auto;

  @media (max-width: 768px) {
    width: 95%;
    padding: 16px;
    max-height: 95vh;
  }
`;

const ModalHeader = styled.h2`
  margin: 0 0 20px 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 20px;
  font-weight: 600;
`;

const ColourOptions = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 8px;
`;

const ColourOption = styled.button<{ $colour: string; $selected: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background-color: ${({ $colour }) => $colour};
  border: 3px solid ${({ $selected, theme }) =>
    $selected ? theme.colors.text : 'transparent'};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: scale(1.1);
  }

  @media (max-width: 768px) {
    width: 48px;
    height: 48px;
  }
`;

const COLOUR_OPTIONS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Orange
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#6B7280', // Gray
];

interface CreateTaskGroupModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateTaskGroupModal = ({
  onClose,
  onSuccess
}: CreateTaskGroupModalProps) => {
  const toast = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [colour, setColour] = useState(COLOUR_OPTIONS[0]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Group name is required');
      return;
    }

    setLoading(true);

    try {
      await taskGroupService.createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        colour,
      });
      toast.success('Task group created successfully');
      onSuccess();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const errorMessage = error.response?.data?.message || 'Failed to create task group';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>Create Task Group</ModalHeader>

        {error && (
          <Alert variant="error" style={{ marginBottom: '16px' }}>
            <XCircleIcon size={16} />
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="name">Group Name *</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., House Renovation"
              maxLength={100}
              required
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="description">Description (Optional)</Label>
            <TextArea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this group..."
              maxLength={500}
              rows={3}
            />
          </FormGroup>

          <FormGroup>
            <Label>Colour</Label>
            <ColourOptions>
              {COLOUR_OPTIONS.map((option) => (
                <ColourOption
                  key={option}
                  type="button"
                  $colour={option}
                  $selected={colour === option}
                  onClick={() => setColour(option)}
                />
              ))}
            </ColourOptions>
          </FormGroup>

          <Flex gap={12} style={{ marginTop: '24px' }}>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              style={{ flex: 1 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading || !name.trim()}
              style={{ flex: 1 }}
            >
              {loading ? 'Creating...' : 'Create Group'}
            </Button>
          </Flex>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
};
