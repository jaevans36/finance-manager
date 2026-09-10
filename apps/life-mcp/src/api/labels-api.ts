import type { AxiosInstance } from 'axios';
import type { CreateLabelInput, LabelDto } from '../types/label.js';

const BASE = '/api/v1/labels';

export async function listLabels(http: AxiosInstance): Promise<LabelDto[]> {
  const res = await http.get<LabelDto[]>(BASE);
  return res.data;
}

export async function createLabel(http: AxiosInstance, input: CreateLabelInput): Promise<LabelDto> {
  const res = await http.post<LabelDto>(BASE, { name: input.name, colourHex: input.colourHex });
  return res.data;
}
