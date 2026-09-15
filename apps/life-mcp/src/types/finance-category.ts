/** Mirrors apps/finance-api/Features/Categories/Services/ICategoryService.cs. */

export interface CategoryDto {
  id: string;
  name: string;
  colour: string | null;
  icon: string | null;
  isSystem: boolean;
  parentId: string | null;
  children: CategoryDto[] | null;
}

/** POST /api/v1/finance/categories body. */
export interface CreateCategoryInput {
  name: string;
  colour?: string;
  icon?: string;
  parentId?: string;
}
