import type { AxiosInstance } from 'axios';
import type { CreateTagInput, TagDto } from '../types/finance-tag.js';

const BASE = '/api/v1/finance/tags';

export async function listTags(http: AxiosInstance): Promise<TagDto[]> {
  const res = await http.get<TagDto[]>(BASE);
  return res.data;
}

export async function createTag(http: AxiosInstance, input: CreateTagInput): Promise<TagDto> {
  const res = await http.post<TagDto>(BASE, input);
  return res.data;
}

export async function deleteTag(http: AxiosInstance, tagId: string): Promise<void> {
  await http.delete(`${BASE}/${tagId}`);
}
