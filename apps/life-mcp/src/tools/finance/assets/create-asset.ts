import { z } from 'zod';
import { createAsset } from '../../../api/finance-assets-api.js';
import { ASSET_TYPES } from '../../../types/finance-asset.js';
import { defineTool, textResult } from '../../_register.js';

const inputSchema = {
  name: z.string().min(1).describe('Asset name, e.g. "3 Bed House" or "Ford Focus".'),
  type: z.enum(ASSET_TYPES),
  value: z.number().min(0).describe('Current estimated value.'),
  notes: z.string().optional(),
};

export const createAssetTool = defineTool({
  name: 'finance_create_asset',
  backend: 'finance',
  config: {
    title: 'Create an asset',
    description: 'Add a manually-tracked real asset (property, vehicle, other) so it nets into net worth alongside finance accounts.',
    inputSchema,
  },
  async handler(args, { http }) {
    const asset = await createAsset(http, args);
    return textResult(`Created asset "${asset.name}" — £${asset.value}.`, { asset });
  },
});
