# Services Directory

This directory contains all API service modules for the application.

## Important: Always Use `apiClient`

**All services MUST use `apiClient` from `./api-client.ts` instead of importing axios directly.**

### ✅ Correct Pattern

```typescript
import { apiClient } from './api-client';
import type { MyType } from '../types/myType';

export const myService = {
  async getData(): Promise<MyType> {
    const response = await apiClient.get<MyType>('/endpoint');
    return response.data;
  },
};
```

### ❌ Wrong Pattern - DO NOT DO THIS

```typescript
import axios from 'axios'; // ❌ Never import axios directly

export const myService = {
  async getData() {
    const response = await axios.get('http://localhost:5000/api/endpoint');
    return response.data;
  },
};
```

## Why?

The `apiClient` provides:

1. **Automatic Authentication** - Adds `Authorization: Bearer <token>` header to all requests
2. **Centralized Configuration** - Base URL, timeouts, and other settings in one place
3. **Consistent Error Handling** - Standardized error messages and logging
4. **Token Management** - Automatic token refresh and logout on 401 errors
5. **Request/Response Interceptors** - Logging, monitoring, and debugging

## Service Template

Use this template when creating new services:

```typescript
import { apiClient } from './api-client';
import type { YourType } from '../types/yourType';

export const yourService = {
  async getAll(): Promise<YourType[]> {
    const response = await apiClient.get<YourType[]>('/your-endpoint');
    return response.data;
  },

  async getById(id: string): Promise<YourType> {
    const response = await apiClient.get<YourType>(`/your-endpoint/${id}`);
    return response.data;
  },

  async create(data: Partial<YourType>): Promise<YourType> {
    const response = await apiClient.post<YourType>('/your-endpoint', data);
    return response.data;
  },

  async update(id: string, data: Partial<YourType>): Promise<YourType> {
    const response = await apiClient.put<YourType>(`/your-endpoint/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/your-endpoint/${id}`);
  },
};
```

## Query Parameters

Use axios config object for query parameters:

```typescript
async getFiltered(params: { search?: string; status?: string }): Promise<YourType[]> {
  const response = await apiClient.get<YourType[]>('/your-endpoint', { params });
  return response.data;
}
```

## Existing Services

- `api-client.ts` - Core axios instance with auth interceptors (use this!)
- `authService.ts` - Authentication (login, register, token refresh)
- `taskService.ts` - Task CRUD operations
- `taskGroupService.ts` - Task group operations
- `profileService.ts` - User profile management
- `statisticsService.ts` - Weekly progress statistics

## Code Review Checklist

When reviewing new services:
- [ ] Does it import `apiClient` instead of `axios`?
- [ ] Does it use TypeScript generics for type safety?
- [ ] Does it handle errors gracefully (apiClient does this automatically)?
- [ ] Does it follow the naming convention: `xxxService.ts`?
- [ ] Are all async functions properly typed with Promise return types?
