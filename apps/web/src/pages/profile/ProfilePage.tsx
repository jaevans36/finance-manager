import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { authService } from '../../services/authService';
import { Container, Card, Heading1, Text, TextSecondary, Button, Flex, Input } from '@finance-manager/ui';
import { UserIcon, MailIcon, CalendarIcon, LogOutIcon, ArrowLeftIcon, EditIcon, CheckIcon, XIcon } from 'lucide-react';
import { borderRadius, mediaQueries } from '@finance-manager/ui/styles';

const ProfileHeader = styled.div`
  margin-bottom: 30px;
`;

const ProfileCard = styled(Card)`
  padding: 30px;
  margin-bottom: 20px;

  ${mediaQueries.tablet} {
    padding: 20px 16px;
  }
`;

const ProfileSection = styled.div`
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const ProfileLabel = styled(TextSecondary)`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 14px;

  ${mediaQueries.tablet} {
    font-size: 13px;
  }
`;

const ProfileValue = styled(Text)`
  font-size: 16px;
  font-weight: 500;
  padding-left: 28px;

  ${mediaQueries.tablet} {
    padding-left: 0;
    font-size: 15px;
  }
`;

const UsernameContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding-left: 28px;

  ${mediaQueries.tablet} {
    flex-wrap: wrap;
    padding-left: 0;
    gap: 8px;
  }
`;

const UsernameEditButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: ${({ theme }) => theme.colors.backgroundSecondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${borderRadius.sm};
  cursor: pointer;
  transition: all 0.2s;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 13px;

  &:hover {
    background-color: ${({ theme }) => theme.colors.backgroundTertiary};
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const UsernameInputContainer = styled.div`
  display: flex;
  gap: 8px;
  padding-left: 28px;
  align-items: center;

  ${mediaQueries.tablet} {
    flex-wrap: wrap;
    padding-left: 0;

    input {
      width: 100% !important;
      max-width: 100%;
    }

    button {
      flex: 1;
    }
  }
`;

const UsernameHint = styled.div<{ $available: boolean }>`
  font-size: 12px;
  margin-top: 4px;
  margin-left: 28px;
  color: ${({ $available, theme }) => $available ? theme.colors.success : theme.colors.error};

  ${mediaQueries.tablet} {
    margin-left: 0;
  }
`;

const ActionButtons = styled(Flex)`
  gap: 12px;
  margin-top: 30px;

  ${mediaQueries.tablet} {
    flex-direction: column;
  }
`;

const formatDate = (dateString?: string | null) => {
  if (!dateString) return 'Not available';
  try {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Invalid date';
  }
};

const ProfilePage = () => {
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameMessage, setUsernameMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const isTemporaryUsername = user?.username.startsWith('user_');

  useEffect(() => {
    if (!newUsername || newUsername === user?.username) {
      setUsernameAvailable(null);
      setUsernameMessage('');
      return;
    }

    const timer = setTimeout(async () => {
      if (newUsername.length < 3 || newUsername.length > 20) {
        setUsernameAvailable(false);
        setUsernameMessage('Username must be 3-20 characters');
        return;
      }

      if (!/^[a-zA-Z0-9_-]+$/.test(newUsername)) {
        setUsernameAvailable(false);
        setUsernameMessage('Only letters, numbers, _ and - allowed');
        return;
      }

      try {
        setUsernameChecking(true);
        const result = await authService.checkUsername(newUsername);
        setUsernameAvailable(result.available);
        setUsernameMessage(result.message);
      } catch (error) {
        setUsernameAvailable(false);
        setUsernameMessage('Error checking username');
      } finally {
        setUsernameChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [newUsername, user?.username]);

  const handleEditUsername = () => {
    setNewUsername(user?.username || '');
    setEditingUsername(true);
  };

  const handleCancelEdit = () => {
    setEditingUsername(false);
    setNewUsername('');
    setUsernameAvailable(null);
    setUsernameMessage('');
  };

  const handleSaveUsername = async () => {
    if (!user || !usernameAvailable) return;

    try {
      setSaving(true);
      await authService.updateUsername(newUsername);
      
      // Update local user data
      const updatedUser = { ...user, username: newUsername.toLowerCase() };
      const token = localStorage.getItem('accessToken') || '';
      login(token, updatedUser);
      
      toast.success('Username updated successfully!');
      setEditingUsername(false);
      setNewUsername('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update username';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  if (!user) {
    return null;
  }

  return (
    <Container style={{ padding: '20px', maxWidth: '1200px', width: '80%' }}>
      <ProfileHeader>
        <Heading1 style={{ margin: 0 }}>Profile</Heading1>
        <TextSecondary style={{ margin: '5px 0 0' }}>Manage your account information</TextSecondary>
      </ProfileHeader>

      <ProfileCard>
        <ProfileSection>
          <ProfileLabel>
            <UserIcon size={20} />
            Username {isTemporaryUsername && <span style={{ color: 'orange' }}>(Temporary)</span>}
          </ProfileLabel>
          {editingUsername ? (
            <>
              <UsernameInputContainer>
                <Input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Enter new username"
                  disabled={saving}
                  style={{ width: '250px' }}
                />
                <Button
                  variant="success"
                  onClick={handleSaveUsername}
                  disabled={saving || !usernameAvailable || usernameChecking}
                  $isLoading={saving}
                  size="small"
                >
                  <CheckIcon size={16} />
                  Save
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={saving}
                  size="small"
                >
                  <XIcon size={16} />
                  Cancel
                </Button>
              </UsernameInputContainer>
              {newUsername && usernameMessage && (
                <UsernameHint $available={usernameAvailable === true}>
                  {usernameMessage}
                </UsernameHint>
              )}
            </>
          ) : (
            <UsernameContainer>
              <ProfileValue style={{ padding: 0 }}>@{user.username}</ProfileValue>
              <UsernameEditButton onClick={handleEditUsername}>
                <EditIcon />
                {isTemporaryUsername ? 'Set Username' : 'Edit'}
              </UsernameEditButton>
            </UsernameContainer>
          )}
        </ProfileSection>

        <ProfileSection>
          <ProfileLabel>
            <MailIcon size={20} />
            Email Address
          </ProfileLabel>
          <ProfileValue>{user.email}</ProfileValue>
        </ProfileSection>

        {user.createdAt && (
          <ProfileSection>
            <ProfileLabel>
              <CalendarIcon size={20} />
              Account Created
            </ProfileLabel>
            <ProfileValue>{formatDate(user.createdAt)}</ProfileValue>
          </ProfileSection>
        )}

        {user.lastLoginAt && (
          <ProfileSection>
            <ProfileLabel>
              <CalendarIcon size={20} />
              Last Login
            </ProfileLabel>
            <ProfileValue>{formatDate(user.lastLoginAt)}</ProfileValue>
          </ProfileSection>
        )}

        <ActionButtons>
          <Button variant="outline" onClick={handleBackToDashboard}>
            <ArrowLeftIcon size={18} />
            Back to Dashboard
          </Button>
          <Button variant="danger" onClick={handleLogout}>
            <LogOutIcon size={18} />
            Logout
          </Button>
        </ActionButtons>
      </ProfileCard>
    </Container>
  );
};

export default ProfilePage;
