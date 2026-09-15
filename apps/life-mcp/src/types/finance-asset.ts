/** Mirrors apps/finance-api/Features/Assets/Models/AssetModels.cs. */

export const ASSET_TYPES = ['Property', 'Vehicle', 'Other'] as const;
export type AssetType = (typeof ASSET_TYPES)[number];

export interface AssetDto {
  id: string;
  name: string;
  type: AssetType;
  value: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/** POST /api/v1/finance/assets body. */
export interface CreateAssetInput {
  name: string;
  type: AssetType;
  value: number;
  notes?: string;
}

/** PATCH /api/v1/finance/assets/{id} body — every field optional, omitted = unchanged. */
export interface UpdateAssetInput {
  name?: string;
  type?: AssetType;
  value?: number;
  notes?: string;
}
