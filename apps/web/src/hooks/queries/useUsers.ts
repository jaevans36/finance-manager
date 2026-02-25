import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userManagementService } from '@/services/userManagementService';
import type { CreateUserRequest, UpdateUserRequest } from '@/services/userManagementService';
import { queryKeys } from '../query-keys';

interface UserSearchQuery {
  searchTerm?: string;
  isAdmin?: boolean;
  emailVerified?: boolean;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

/** Fetch paginated user list (admin) */
export function useUsers(params?: UserSearchQuery) {
  return useQuery({
    queryKey: queryKeys.users.list(params as Record<string, unknown>),
    queryFn: () => userManagementService.getUsers(params),
  });
}

/** Fetch user statistics (admin) */
export function useUserStats() {
  return useQuery({
    queryKey: queryKeys.users.stats(),
    queryFn: () => userManagementService.getUserStats(),
  });
}

/** Create a user (admin) */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateUserRequest) => userManagementService.createUser(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

/** Update a user (admin) */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, request }: { userId: string; request: UpdateUserRequest }) =>
      userManagementService.updateUser(userId, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

/** Delete a user (admin) */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => userManagementService.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}
