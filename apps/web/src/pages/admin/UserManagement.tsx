import { useEffect, useState } from 'react';
import { Container } from '@finance-manager/ui';
import { Users, Search, Shield, ShieldOff, BarChart3, Trash2, RefreshCcw } from 'lucide-react';
import styled from 'styled-components';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { authService } from '../../services/authService';

const PageTitle = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const PageSubtitle = styled.p`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 0 32px 0;
`;

const ControlsContainer = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const SearchBar = styled.div`
  flex: 1;
  min-width: 300px;
  position: relative;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 12px 12px 44px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  font-size: 14px;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}20;
  }
`;

const SearchIcon = styled(Search)`
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.colors.textSecondary};
  pointer-events: none;
`;

const FilterButton = styled.button<{ $active?: boolean }>`
  padding: 10px 20px;
  border: 1px solid ${({ theme, $active }) => 
    $active ? theme.colors.primary : theme.colors.border};
  border-radius: 8px;
  background: ${({ theme, $active }) => 
    $active ? theme.colors.primary : theme.colors.background};
  color: ${({ theme, $active }) => 
    $active ? 'white' : theme.colors.text};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme, $active }) => 
      $active ? theme.colors.primaryDark : theme.colors.primary}10;
  }
`;

const UsersTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  overflow: hidden;
`;

const TableHeader = styled.thead`
  background: ${({ theme }) => theme.colors.background};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const TableRow = styled.tr`
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.background};
  }
`;

const TableCell = styled.td`
  padding: 16px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};
`;

const TableHeaderCell = styled.th`
  padding: 16px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const UserEmail = styled.div`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`;

const Username = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 2px;
`;

const Badge = styled.span<{ $variant: 'admin' | 'verified' | 'unverified' }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  background: ${({ theme, $variant }) => {
    if ($variant === 'admin') return theme.colors.warning + '20';
    if ($variant === 'verified') return theme.colors.success + '20';
    return theme.colors.error + '20';
  }};
  color: ${({ theme, $variant }) => {
    if ($variant === 'admin') return theme.colors.warning;
    if ($variant === 'verified') return theme.colors.success;
    return theme.colors.error;
  }};
`;

const ActionButton = styled.button`
  padding: 6px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  font-size: 12px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.primary}10;
  }

  &.danger:hover {
    border-color: ${({ theme }) => theme.colors.error};
    background: ${({ theme }) => theme.colors.error}10;
    color: ${({ theme }) => theme.colors.error};
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const StatCard = styled.div`
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  padding: 20px;
`;

const StatValue = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 4px;
`;

const StatLabel = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

interface User {
  id: string;
  email: string;
  username: string;
  isAdmin: boolean;
  emailVerified: boolean;
  createdAt: string;
}

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'admin' | 'verified' | 'unverified'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    // Apply filters
    let filtered = users;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(u => 
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Type filter
    if (filter === 'admin') {
      filtered = filtered.filter(u => u.isAdmin);
    } else if (filter === 'verified') {
      filtered = filtered.filter(u => u.emailVerified);
    } else if (filter === 'unverified') {
      filtered = filtered.filter(u => !u.emailVerified);
    }

    setFilteredUsers(filtered);
  }, [users, searchQuery, filter]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement actual API call
      // const response = await apiClient.get('/api/admin/users');
      
      // Mock data for now
      await new Promise(resolve => setTimeout(resolve, 500));
      const mockUsers: User[] = [
        {
          id: '1',
          email: 'jaevans36@gmail.com',
          username: 'jaymond',
          isAdmin: true,
          emailVerified: true,
          createdAt: '2025-12-01T00:00:00Z'
        },
        {
          id: '2',
          email: 'user@example.com',
          username: 'johndoe',
          isAdmin: false,
          emailVerified: true,
          createdAt: '2025-12-15T00:00:00Z'
        },
        {
          id: '3',
          email: 'newuser@example.com',
          username: 'jane_smith',
          isAdmin: false,
          emailVerified: false,
          createdAt: '2026-01-20T00:00:00Z'
        }
      ];
      setUsers(mockUsers);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAdmin = async (userId: string, currentIsAdmin: boolean) => {
    if (!confirm(`Are you sure you want to ${currentIsAdmin ? 'remove' : 'grant'} admin privileges?`)) {
      return;
    }

    try {
      // TODO: Implement actual API call
      // await apiClient.put(`/api/admin/users/${userId}/admin`, { isAdmin: !currentIsAdmin });
      
      setUsers(users.map(u => 
        u.id === userId ? { ...u, isAdmin: !currentIsAdmin } : u
      ));
    } catch (error) {
      console.error('Failed to update admin status:', error);
    }
  };

  if (!currentUser?.isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const totalUsers = users.length;
  const adminUsers = users.filter(u => u.isAdmin).length;
  const verifiedUsers = users.filter(u => u.emailVerified).length;
  const unverifiedUsers = users.filter(u => !u.emailVerified).length;

  return (
    <Container style={{ padding: '20px', maxWidth: '1400px', width: '95%' }}>
      <PageTitle>
        <Users size={36} />
        User Management
      </PageTitle>
      <PageSubtitle>Manage users, permissions, and account settings</PageSubtitle>

      <StatsGrid>
        <StatCard>
          <StatValue>{totalUsers}</StatValue>
          <StatLabel>Total Users</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{adminUsers}</StatValue>
          <StatLabel>Administrators</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{verifiedUsers}</StatValue>
          <StatLabel>Verified</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{unverifiedUsers}</StatValue>
          <StatLabel>Unverified</StatLabel>
        </StatCard>
      </StatsGrid>

      <ControlsContainer>
        <SearchBar>
          <SearchIcon size={18} />
          <SearchInput
            type="text"
            placeholder="Search users by email or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </SearchBar>
        <FilterButton 
          $active={filter === 'all'} 
          onClick={() => setFilter('all')}
        >
          All Users
        </FilterButton>
        <FilterButton 
          $active={filter === 'admin'} 
          onClick={() => setFilter('admin')}
        >
          Admins Only
        </FilterButton>
        <FilterButton 
          $active={filter === 'verified'} 
          onClick={() => setFilter('verified')}
        >
          Verified
        </FilterButton>
        <FilterButton 
          $active={filter === 'unverified'} 
          onClick={() => setFilter('unverified')}
        >
          Unverified
        </FilterButton>
      </ControlsContainer>

      <UsersTable>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>User</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Joined</TableHeaderCell>
            <TableHeaderCell>Actions</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <tbody>
          {filteredUsers.map(user => (
            <TableRow key={user.id}>
              <TableCell>
                <UserEmail>{user.email}</UserEmail>
                <Username>@{user.username}</Username>
              </TableCell>
              <TableCell>
                {user.isAdmin && (
                  <Badge $variant="admin">
                    <Shield size={12} />
                    Admin
                  </Badge>
                )}{' '}
                <Badge $variant={user.emailVerified ? 'verified' : 'unverified'}>
                  {user.emailVerified ? 'Verified' : 'Unverified'}
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(user.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </TableCell>
              <TableCell>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <ActionButton
                    onClick={() => handleToggleAdmin(user.id, user.isAdmin)}
                    disabled={user.id === currentUser.id}
                  >
                    {user.isAdmin ? (
                      <>
                        <ShieldOff size={14} />
                        Remove Admin
                      </>
                    ) : (
                      <>
                        <Shield size={14} />
                        Make Admin
                      </>
                    )}
                  </ActionButton>
                  <ActionButton>
                    <BarChart3 size={14} />
                    View Stats
                  </ActionButton>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </tbody>
      </UsersTable>
    </Container>
  );
};

export default UserManagement;
