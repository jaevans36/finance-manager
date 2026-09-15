import type { AxiosInstance } from 'axios';
import type {
  ApplyRulesResult,
  CategoryRuleDto,
  CreateCategoryRuleInput,
  UpdateCategoryRuleInput,
} from '../types/finance-category-rule.js';

const BASE = '/api/v1/finance/category-rules';

export async function listCategoryRules(http: AxiosInstance): Promise<CategoryRuleDto[]> {
  const res = await http.get<CategoryRuleDto[]>(BASE);
  return res.data;
}

export async function createCategoryRule(http: AxiosInstance, input: CreateCategoryRuleInput): Promise<CategoryRuleDto> {
  const res = await http.post<CategoryRuleDto>(BASE, input);
  return res.data;
}

export async function updateCategoryRule(
  http: AxiosInstance,
  ruleId: string,
  input: UpdateCategoryRuleInput,
): Promise<CategoryRuleDto> {
  const res = await http.patch<CategoryRuleDto>(`${BASE}/${ruleId}`, input);
  return res.data;
}

export async function deleteCategoryRule(http: AxiosInstance, ruleId: string): Promise<void> {
  await http.delete(`${BASE}/${ruleId}`);
}

export async function applyCategoryRules(http: AxiosInstance): Promise<ApplyRulesResult> {
  const res = await http.post<ApplyRulesResult>(`${BASE}/apply-all`);
  return res.data;
}
