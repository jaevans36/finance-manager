import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Container, Card, Heading1, Text, TextSecondary, Button, Flex } from '../components/ui';
import { UserIcon, MailIcon, CalendarIcon, LogOutIcon, ArrowLeftIcon } from 'lucide-react';

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
    <Container>
      <ProfileHeader>
        <Heading1 style={{ margin: '0 0 8px 0' }}>Profile</Heading1>
        <TextSecondary>Manage your account information</TextSecondary>
      </ProfileHeader>

      <ProfileCard>
        <ProfileSection>
          <ProfileLabel>
            <UserIcon size={20} />
            Username
          </ProfileLabel>
          <ProfileValue>@{user.username}</ProfileValue>
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
