import styled from 'styled-components';
import { borderRadius, focusRing, shadows, mediaQueries } from '@finance-manager/ui/styles';
import { useToast } from '../../contexts/ToastContext';
import { taskGroupService } from '../../services/taskGroupService';
import { useTaskGroupForm } from '../../hooks/forms';
import type { CreateTaskGroupInput } from '@finance-manager/schema';
import { Button, Input, TextArea, FormGroup, Label, ErrorText, Alert, Flex } from '@finance-manager/ui';
import { XCircleIcon } from 'lucide-react';
import { useState } from 'react';

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
  border-radius: ${borderRadius.lg};
  max-width: 500px;
  width: 90%;
  box-shadow: ${shadows.elevated};
  max-height: 90vh;
  overflow-y: auto;

  ${mediaQueries.tablet} {
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
  border-radius: ${borderRadius.lg};
  background-color: ${({ $colour }) => $colour};
  border: 3px solid ${({ $selected, theme }) =>
    $selected ? theme.colors.text : 'transparent'};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: scale(1.1);
  }

  ${mediaQueries.tablet} {
    width: 48px;
    height: 48px;
  }

  ${focusRing}
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
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useTaskGroupForm();

  const selectedColour = watch('colour') || COLOUR_OPTIONS[0];

  const onSubmit = async (data: CreateTaskGroupInput) => {
    setApiError(null);

    try {
      await taskGroupService.createGroup({
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
        colour: data.colour || COLOUR_OPTIONS[0],
      });
      toast.success('Task group created successfully');
      onSuccess();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const errorMessage = error.response?.data?.message || 'Failed to create task group';
      setApiError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>Create Task Group</ModalHeader>

        {apiError && (
          <Alert variant="error" style={{ marginBottom: '16px' }}>
            <XCircleIcon size={16} />
            {apiError}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <FormGroup>
            <Label htmlFor="name">Group Name *</Label>
            <Input
              id="name"
              type="text"
              {...register('name')}
              placeholder="e.g., House Renovation"
              maxLength={100}
              hasError={!!errors.name}
            />
            {errors.name && <ErrorText>{errors.name.message}</ErrorText>}
          </FormGroup>

          <FormGroup>
            <Label htmlFor="description">Description (Optional)</Label>
            <TextArea
              id="description"
              {...register('description')}
              placeholder="Describe this group..."
              maxLength={500}
              rows={3}
            />
            {errors.description && <ErrorText>{errors.description.message}</ErrorText>}
          </FormGroup>

          <FormGroup>
            <Label>Colour</Label>
            <ColourOptions>
              {COLOUR_OPTIONS.map((option) => (
                <ColourOption
                  key={option}
                  type="button"
                  $colour={option}
                  $selected={selectedColour === option}
                  onClick={() => setValue('colour', option)}
                />
              ))}
            </ColourOptions>
          </FormGroup>

          <Flex gap={12} style={{ marginTop: '24px' }}>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
              style={{ flex: 1 }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              style={{ flex: 1 }}
            >
              {isSubmitting ? 'Creating...' : 'Create Group'}
            </Button>
          </Flex>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
};
