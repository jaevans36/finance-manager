/** Mirrors apps/finance-api/Features/Tags/Models/Tag.cs. */

export interface TagRef {
  id: string;
  name: string;
  colour: string | null;
}

export interface TagDto extends TagRef {
  transactionCount: number;
  createdAt: string;
}

/** POST /api/v1/finance/tags body. */
export interface CreateTagInput {
  name: string;
  colour?: string;
}
