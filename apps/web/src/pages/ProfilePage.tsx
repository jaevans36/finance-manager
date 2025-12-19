import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Container, Card, Heading1, Text, TextSecondary, Button, Flex } from '../components/ui';
import { UserIcon, MailIcon, CalendarIcon, LogOutIcon, ArrowLeftIcon, CopyIcon, CheckIcon } from 'lucide-react';

const ProfileHeader = styled.div`
  margin-bottom: 30px;
`;

const ProfileCard = styled(Card)`
  padding: 30px;
  margin-bottom: 20px;
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
`;

const ProfileValue = styled(Text)`
  font-size: 16px;
  font-weight: 500;
  padding-left: 28px;
`;

const UserIdContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding-left: 28px;
`;

const UserIdDisplay = styled.span`
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
  font-family: 'Courier New', monospace;
`;

const CopyButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: ${({ theme }) => theme.colors.backgroundSecondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
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

const ActionButtons = styled(Flex)`
  gap: 12px;
  margin-top: 30px;

  @media (max-width: 768px) {
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

export const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleCopyUserId = async () => {
    if (!user?.id) return;
    
    try {
      await navigator.clipboard.writeText(user.id);
      setCopied(true);
      toast.success('User ID copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy User ID');
    }
  };

  const getShortUserId = (id: string) => {
    // Show first 8 characters for a friendlier display
    return id.substring(0, 8) + '...';
  };

  if (!user) {
    return null;
  }

  return (
    <Container>
      <ProfileHeader>
        <Heading1 style={{ margin: '0 0 8px 0' }}>Profile</Heading1>
        <TextSecondary>Manage your account information</TextSecondary>
      </ProfileHeader>

      <ProfileCard>
        <ProfileSection>
          <ProfileLabel>
            <UserIcon size={20} />
            User ID
          </ProfileLabel>
          <UserIdContainer>
            <UserIdDisplay>{getShortUserId(user.id)}</UserIdDisplay>
            <CopyButton onClick={handleCopyUserId} title="Copy full User ID">
              {copied ? (
                <>
                  <CheckIcon />
                  Copied
                </>
              ) : (
                <>
                  <CopyIcon />
                  Copy
                </>
              )}
            </CopyButton>
          </UserIdContainer>
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
