import { useEffect, useState } from 'react';
import { Button } from '@finance-manager/ui';
import { Modal } from '../../components/ui/Modal';
import { Search, Shield, ShieldOff, Trash2, RefreshCcw, Plus, Edit, Key } from 'lucide-react';
import styled from 'styled-components';
import { borderRadius } from '@finance-manager/ui/styles';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { 
  userManagementService, 
  type UserListItem,
  type UserStats,
  type CreateUserRequest,
  type UpdateUserRequest 
} from '../../services/userManagementService';
import { PageLayout } from '../../components/layout/PageLayout';

const ControlsContainer = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  align-items: center;
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
  border-radius: ${borderRadius.lg};
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
  border-radius: ${borderRadius.lg};
  background: ${({ theme, $active }) => 
    $active ? theme.colors.primary : theme.colors.background};
  color: ${({ theme, $active }) => 
    $active ? 'white' : theme.colors.text};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;

  &:hover {
    border-color: ${({ theme, $active }) => 
      $active ? theme.colors.primary : theme.colors.textSecondary};
  }
`;

const UsersTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${borderRadius.xl};
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
  justify-content: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: ${borderRadius.xl};
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
  height: 24px;
  min-width: 90px;
  min-height: 20px;
  max-height: 20px;
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
  border-radius: ${borderRadius.md};
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

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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
  border-radius: ${borderRadius.xl};
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

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 14px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${borderRadius.lg};
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

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
  cursor: pointer;
`;

const ErrorMessage = styled.div`
  color: ${({ theme }) => theme.colors.error};
  font-size: 13px;
  margin-top: 8px;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
`;

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'admin' | 'verified' | 'unverified'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState<CreateUserRequest>({
    email: '',
    username: '',
    password: '',
    isAdmin: false,
    emailVerified: false
  });

  const [editForm, setEditForm] = useState<UpdateUserRequest>({});
  const [newPassword, setNewPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [searchQuery, filter]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [usersResponse, statsResponse] = await Promise.all([
        userManagementService.getUsers({
          searchTerm: searchQuery || undefined,
          isAdmin: filter === 'admin' ? true : filter === 'all' ? undefined : undefined,
          emailVerified: filter === 'verified' ? true : filter === 'unverified' ? false : undefined
        }),
        userManagementService.getUserStats()
      ]);
      
      setUsers(usersResponse.users);
      setStats(statsResponse);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load users';
      setError(message);
      console.error('Failed to fetch users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async () => {
    setFormError(null);
    try {
      await userManagementService.createUser(createForm);
      setShowCreateModal(false);
      setCreateForm({ email: '', username: '', password: '', isAdmin: false, emailVerified: false });
      await fetchData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create user';
      setFormError(message);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;
    setFormError(null);
    try {
      await userManagementService.updateUser(selectedUser.id, editForm);
      setShowEditModal(false);
      setSelectedUser(null);
      setEditForm({});
      await fetchData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update user';
      setFormError(message);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setFormError(null);
    try {
      await userManagementService.deleteUser(selectedUser.id);
      setShowDeleteModal(false);
      setSelectedUser(null);
      await fetchData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete user';
      setFormError(message);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) return;
    setFormError(null);
    try {
      await userManagementService.resetPassword(selectedUser.id, { newPassword });
      setShowResetPasswordModal(false);
      setSelectedUser(null);
      setNewPassword('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reset password';
      setFormError(message);
    }
  };

  const handleToggleAdmin = async (user: UserListItem) => {
    const newIsAdmin = !user.isAdmin;
    const action = newIsAdmin ? 'grant' : 'remove';
    if (!confirm(`Are you sure you want to ${action} admin privileges for ${user.username}?`)) {
      return;
    }

    try {
      await userManagementService.updateUser(user.id, { isAdmin: newIsAdmin });
      await fetchData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update user';
      alert(message);
    }
  };

  const openEditModal = (user: UserListItem) => {
    setSelectedUser(user);
    setEditForm({
      email: user.email,
      username: user.username,
      isAdmin: user.isAdmin,
      emailVerified: user.emailVerified
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (user: UserListItem) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const openResetPasswordModal = (user: UserListItem) => {
    setSelectedUser(user);
    setShowResetPasswordModal(true);
  };

  if (!currentUser?.isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <PageLayout 
      title="User Management"
      subtitle="Manage user accounts, permissions, and access controls"
      loading={isLoading}
      headerActions={
        <>
          <Button size="small" variant="outline" onClick={fetchData}>
            <RefreshCcw size={16} />
          </Button>
          <Button size="small" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            Create User
          </Button>
        </>
      }
    >
      {stats && (
        <StatsGrid>
          <StatCard>
            <StatValue>{stats.totalUsers}</StatValue>
            <StatLabel>Total Users</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{stats.adminUsers}</StatValue>
            <StatLabel>Administrators</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{stats.verifiedUsers}</StatValue>
            <StatLabel>Verified</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{stats.unverifiedUsers}</StatValue>
            <StatLabel>Unverified</StatLabel>
          </StatCard>
        </StatsGrid>
      )}

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

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {isLoading ? (
        <div>Loading users...</div>
      ) : (
        <UsersTable>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>User</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Activity</TableHeaderCell>
              <TableHeaderCell>Joined</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <tbody>
            {users.map(user => (
              <TableRow key={user.id}>
                <TableCell>
                  <UserEmail>{user.email}</UserEmail>
                  <Username>@{user.username}</Username>
                </TableCell>
                <TableCell>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {user.isAdmin && (
                      <Badge $variant="admin">
                        <Shield size={12} />
                        Admin
                      </Badge>
                    )}
                    <Badge $variant={user.emailVerified ? 'verified' : 'unverified'}>
                      {user.emailVerified ? 'Verified' : 'Unverified'}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  {user.taskCount} tasks, {user.eventCount} events
                </TableCell>
                <TableCell>
                  {new Date(user.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </TableCell>
                <TableCell>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <ActionButton
                      onClick={() => handleToggleAdmin(user)}
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
                    <ActionButton onClick={() => openEditModal(user)}>
                      <Edit size={14} />
                      Edit
                    </ActionButton>
                    <ActionButton onClick={() => openResetPasswordModal(user)}>
                      <Key size={14} />
                      Reset Password
                    </ActionButton>
                    <ActionButton
                      className="danger"
                      onClick={() => openDeleteModal(user)}
                      disabled={user.id === currentUser.id}
                    >
                      <Trash2 size={14} />
                      Delete
                    </ActionButton>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </UsersTable>
      )}

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setFormError(null);
          setCreateForm({ email: '', username: '', password: '', isAdmin: false, emailVerified: false });
        }}
        title="Create New User"
      >
        <FormGroup>
          <Label>Email</Label>
          <Input
            type="email"
            value={createForm.email}
            onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
            placeholder="user@example.com"
          />
        </FormGroup>
        <FormGroup>
          <Label>Username</Label>
          <Input
            type="text"
            value={createForm.username}
            onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
            placeholder="username"
          />
        </FormGroup>
        <FormGroup>
          <Label>Password</Label>
          <Input
            type="password"
            value={createForm.password}
            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
            placeholder="Min. 8 characters"
          />
        </FormGroup>
        <FormGroup>
          <CheckboxLabel>
            <Checkbox
              type="checkbox"
              checked={createForm.isAdmin}
              onChange={(e) => setCreateForm({ ...createForm, isAdmin: e.target.checked })}
            />
            Grant admin privileges
          </CheckboxLabel>
        </FormGroup>
        <FormGroup>
          <CheckboxLabel>
            <Checkbox
              type="checkbox"
              checked={createForm.emailVerified}
              onChange={(e) => setCreateForm({ ...createForm, emailVerified: e.target.checked })}
            />
            Mark email as verified
          </CheckboxLabel>
        </FormGroup>
        {formError && <ErrorMessage>{formError}</ErrorMessage>}
        <ModalActions>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateUser}>
            Create User
          </Button>
        </ModalActions>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setFormError(null);
          setSelectedUser(null);
          setEditForm({});
        }}
        title={`Edit User: ${selectedUser?.username}`}
      >
        <FormGroup>
          <Label>Email</Label>
          <Input
            type="email"
            value={editForm.email || ''}
            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
          />
        </FormGroup>
        <FormGroup>
          <Label>Username</Label>
          <Input
            type="text"
            value={editForm.username || ''}
            onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
          />
        </FormGroup>
        <FormGroup>
          <CheckboxLabel>
            <Checkbox
              type="checkbox"
              checked={editForm.isAdmin || false}
              onChange={(e) => setEditForm({ ...editForm, isAdmin: e.target.checked })}
              disabled={selectedUser?.id === currentUser.id}
            />
            Admin privileges
          </CheckboxLabel>
        </FormGroup>
        <FormGroup>
          <CheckboxLabel>
            <Checkbox
              type="checkbox"
              checked={editForm.emailVerified || false}
              onChange={(e) => setEditForm({ ...editForm, emailVerified: e.target.checked })}
            />
            Email verified
          </CheckboxLabel>
        </FormGroup>
        {formError && <ErrorMessage>{formError}</ErrorMessage>}
        <ModalActions>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleEditUser}>
            Save Changes
          </Button>
        </ModalActions>
      </Modal>

      {/* Delete User Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setFormError(null);
          setSelectedUser(null);
        }}
        title="Delete User"
      >
        <p>
          Are you sure you want to delete <strong>{selectedUser?.username}</strong>?
          This action cannot be undone and will remove all their data.
        </p>
        {formError && <ErrorMessage>{formError}</ErrorMessage>}
        <ModalActions>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleDeleteUser} style={{ background: 'var(--color-error)' }}>
            Delete User
          </Button>
        </ModalActions>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={showResetPasswordModal}
        onClose={() => {
          setShowResetPasswordModal(false);
          setFormError(null);
          setSelectedUser(null);
          setNewPassword('');
        }}
        title={`Reset Password for ${selectedUser?.username}`}
      >
        <FormGroup>
          <Label>New Password</Label>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min. 8 characters"
          />
        </FormGroup>
        {formError && <ErrorMessage>{formError}</ErrorMessage>}
        <ModalActions>
          <Button variant="secondary" onClick={() => setShowResetPasswordModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleResetPassword}>
            Reset Password
          </Button>
        </ModalActions>
      </Modal>
    </PageLayout>
  );
};

export default UserManagement;
