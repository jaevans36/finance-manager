import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Checkbox } from '../../components/ui/checkbox';
import { Modal } from '../../components/ui/Modal';
import { Search, Shield, ShieldOff, Trash2, RefreshCcw, Plus, Edit, Key } from 'lucide-react';
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
import { cn } from '../../lib/utils';

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
    } catch (err: unknown) {
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
    } catch (err: unknown) {
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
    } catch (err: unknown) {
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
    } catch (err: unknown) {
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
    } catch (err: unknown) {
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
    } catch (err: unknown) {
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
          <Button size="sm" variant="secondary" onClick={fetchData}>
            <RefreshCcw size={16} />
          </Button>
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            Create User
          </Button>
        </>
      }
    >
      {stats && (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-6">
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="font-display text-display font-bold text-foreground mb-1">{stats.totalUsers}</div>
            <div className="text-body-sm text-muted-foreground">Total Users</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="font-display text-display font-bold text-foreground mb-1">{stats.adminUsers}</div>
            <div className="text-body-sm text-muted-foreground">Administrators</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="font-display text-display font-bold text-foreground mb-1">{stats.verifiedUsers}</div>
            <div className="text-body-sm text-muted-foreground">Verified</div>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="font-display text-display font-bold text-foreground mb-1">{stats.unverifiedUsers}</div>
            <div className="text-body-sm text-muted-foreground">Unverified</div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative flex-1 min-w-[300px]">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search users by email or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-background py-3 pl-11 pr-3 text-sm text-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium transition-all cursor-pointer',
            filter === 'all'
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-background text-foreground hover:border-muted-foreground'
          )}
        >
          All Users
        </button>
        <button
          onClick={() => setFilter('admin')}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium transition-all cursor-pointer',
            filter === 'admin'
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-background text-foreground hover:border-muted-foreground'
          )}
        >
          Admins Only
        </button>
        <button
          onClick={() => setFilter('verified')}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium transition-all cursor-pointer',
            filter === 'verified'
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-background text-foreground hover:border-muted-foreground'
          )}
        >
          Verified
        </button>
        <button
          onClick={() => setFilter('unverified')}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-medium transition-all cursor-pointer',
            filter === 'unverified'
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-background text-foreground hover:border-muted-foreground'
          )}
        >
          Unverified
        </button>
      </div>

      {error && <div className="mt-2 text-body-sm text-destructive">{error}</div>}

      {isLoading ? (
        <div>Loading users...</div>
      ) : (
        <table className="w-full border-collapse overflow-hidden rounded-lg border border-border bg-card">
          <thead className="border-b border-border bg-background">
            <tr className="border-b border-border">
              <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">User</th>
              <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
              <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Activity</th>
              <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Joined</th>
              <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b border-border last:border-b-0 hover:bg-background">
                <td className="p-4 text-sm text-foreground">
                  <div className="font-medium text-foreground">{user.email}</div>
                  <div className="mt-0.5 text-body-sm text-muted-foreground">@{user.username}</div>
                </td>
                <td className="p-4 text-sm text-foreground">
                  <div className="flex items-center gap-2">
                    {user.isAdmin && (
                      <Badge variant="warning">
                        <Shield size={12} />
                        Admin
                      </Badge>
                    )}
                    <Badge variant={user.emailVerified ? 'success' : 'destructive'}>
                      {user.emailVerified ? 'Verified' : 'Unverified'}
                    </Badge>
                  </div>
                </td>
                <td className="p-4 text-sm text-foreground">
                  {user.taskCount} tasks, {user.eventCount} events
                </td>
                <td className="p-4 text-sm text-foreground">
                  {new Date(user.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </td>
                <td className="p-4 text-sm text-foreground">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleToggleAdmin(user)}
                      disabled={user.id === currentUser.id}
                      className="inline-flex items-center gap-1.5 rounded border border-border bg-background px-3 py-1.5 text-xs text-foreground transition-all hover:border-primary hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    </button>
                    <button
                      onClick={() => openEditModal(user)}
                      className="inline-flex items-center gap-1.5 rounded border border-border bg-background px-3 py-1.5 text-xs text-foreground transition-all hover:border-primary hover:bg-primary/10"
                    >
                      <Edit size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => openResetPasswordModal(user)}
                      className="inline-flex items-center gap-1.5 rounded border border-border bg-background px-3 py-1.5 text-xs text-foreground transition-all hover:border-primary hover:bg-primary/10"
                    >
                      <Key size={14} />
                      Reset Password
                    </button>
                    <button
                      onClick={() => openDeleteModal(user)}
                      disabled={user.id === currentUser.id}
                      className="inline-flex items-center gap-1.5 rounded border border-border bg-background px-3 py-1.5 text-xs text-foreground transition-all hover:border-destructive hover:bg-destructive/10 hover:text-destructive disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
        <div className="mb-5">
          <Label className="mb-2 block text-sm font-semibold">Email</Label>
          <Input
            type="email"
            value={createForm.email}
            onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
            placeholder="user@example.com"
          />
        </div>
        <div className="mb-5">
          <Label className="mb-2 block text-sm font-semibold">Username</Label>
          <Input
            type="text"
            value={createForm.username}
            onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
            placeholder="username"
          />
        </div>
        <div className="mb-5">
          <Label className="mb-2 block text-sm font-semibold">Password</Label>
          <Input
            type="password"
            value={createForm.password}
            onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
            placeholder="Min. 8 characters"
          />
        </div>
        <div className="mb-5">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <Checkbox
              checked={createForm.isAdmin}
              onCheckedChange={(checked) => setCreateForm({ ...createForm, isAdmin: checked === true })}
            />
            Grant admin privileges
          </label>
        </div>
        <div className="mb-5">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <Checkbox
              checked={createForm.emailVerified}
              onCheckedChange={(checked) => setCreateForm({ ...createForm, emailVerified: checked === true })}
            />
            Mark email as verified
          </label>
        </div>
        {formError && <div className="mt-2 text-body-sm text-destructive">{formError}</div>}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateUser}>
            Create User
          </Button>
        </div>
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
        <div className="mb-5">
          <Label className="mb-2 block text-sm font-semibold">Email</Label>
          <Input
            type="email"
            value={editForm.email || ''}
            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
          />
        </div>
        <div className="mb-5">
          <Label className="mb-2 block text-sm font-semibold">Username</Label>
          <Input
            type="text"
            value={editForm.username || ''}
            onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
          />
        </div>
        <div className="mb-5">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <Checkbox
              checked={editForm.isAdmin || false}
              onCheckedChange={(checked) => setEditForm({ ...editForm, isAdmin: checked === true })}
              disabled={selectedUser?.id === currentUser.id}
            />
            Admin privileges
          </label>
        </div>
        <div className="mb-5">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
            <Checkbox
              checked={editForm.emailVerified || false}
              onCheckedChange={(checked) => setEditForm({ ...editForm, emailVerified: checked === true })}
            />
            Email verified
          </label>
        </div>
        {formError && <div className="mt-2 text-body-sm text-destructive">{formError}</div>}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleEditUser}>
            Save Changes
          </Button>
        </div>
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
        {formError && <div className="mt-2 text-body-sm text-destructive">{formError}</div>}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDeleteUser}>
            Delete User
          </Button>
        </div>
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
        <div className="mb-5">
          <Label className="mb-2 block text-sm font-semibold">New Password</Label>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min. 8 characters"
          />
        </div>
        {formError && <div className="mt-2 text-body-sm text-destructive">{formError}</div>}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowResetPasswordModal(false)}>
            Cancel
          </Button>
          <Button onClick={handleResetPassword}>
            Reset Password
          </Button>
        </div>
      </Modal>
    </PageLayout>
  );
};

export default UserManagement;
