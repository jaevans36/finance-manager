import financeApiClient from './finance-api-client';
import type { Asset, CreateAssetRequest, UpdateAssetRequest } from '../types/finance';

export const assetsService = {
  getAssets(): Promise<Asset[]> {
    return financeApiClient.get<Asset[]>('/api/v1/finance/assets').then((r) => r.data);
  },

  createAsset(data: CreateAssetRequest): Promise<Asset> {
    return financeApiClient.post<Asset>('/api/v1/finance/assets', data).then((r) => r.data);
  },

  updateAsset(id: string, data: UpdateAssetRequest): Promise<Asset> {
    return financeApiClient.patch<Asset>(`/api/v1/finance/assets/${id}`, data).then((r) => r.data);
  },

  deleteAsset(id: string): Promise<void> {
    return financeApiClient.delete(`/api/v1/finance/assets/${id}`).then(() => undefined);
  },
};
