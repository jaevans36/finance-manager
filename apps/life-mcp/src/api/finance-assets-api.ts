import type { AxiosInstance } from 'axios';
import type { AssetDto, CreateAssetInput, UpdateAssetInput } from '../types/finance-asset.js';

const BASE = '/api/v1/finance/assets';

export async function listAssets(http: AxiosInstance): Promise<AssetDto[]> {
  const res = await http.get<AssetDto[]>(BASE);
  return res.data;
}

export async function createAsset(http: AxiosInstance, input: CreateAssetInput): Promise<AssetDto> {
  const res = await http.post<AssetDto>(BASE, input);
  return res.data;
}

export async function updateAsset(http: AxiosInstance, assetId: string, input: UpdateAssetInput): Promise<AssetDto> {
  const res = await http.patch<AssetDto>(`${BASE}/${assetId}`, input);
  return res.data;
}
