import type { AxiosInstance } from 'axios';
import type { CategoryDto, CreateCategoryInput } from '../types/finance-category.js';

const BASE = '/api/v1/finance/categories';

export async function listCategories(http: AxiosInstance): Promise<CategoryDto[]> {
  const res = await http.get<CategoryDto[]>(BASE);
  return res.data;
}

export async function createCategory(http: AxiosInstance, input: CreateCategoryInput): Promise<CategoryDto> {
  const res = await http.post<CategoryDto>(BASE, input);
  return res.data;
}
