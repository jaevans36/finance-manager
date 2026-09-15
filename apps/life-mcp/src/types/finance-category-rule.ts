/** Mirrors apps/finance-api/Features/CategoryRules/Models/CategoryRule.cs. */

export const RULE_MATCH_TYPES = ['Contains', 'StartsWith', 'Exact'] as const;
export type RuleMatchType = (typeof RULE_MATCH_TYPES)[number];

export interface CategoryRuleDto {
  id: string;
  pattern: string;
  matchType: RuleMatchType;
  categoryId: string;
  categoryName: string | null;
  categoryColour: string | null;
  priority: number;
  isActive: boolean;
  appliedCount: number;
  createdAt: string;
}

/** POST /api/v1/finance/category-rules body. */
export interface CreateCategoryRuleInput {
  pattern: string;
  matchType: RuleMatchType;
  categoryId: string;
  priority?: number;
}

/** PATCH /api/v1/finance/category-rules/{id} body — every field optional, omitted = unchanged. */
export interface UpdateCategoryRuleInput {
  isActive?: boolean;
  priority?: number;
  categoryId?: string;
}

export interface ApplyRulesResult {
  updated: number;
}
