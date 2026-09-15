import { z } from 'zod';
import { updateAsset } from '../../../api/finance-assets-api.js';
import { ASSET_TYPES } from '../../../types/finance-asset.js';
import { defineTool, textResult } from '../../_register.js';

const inputSchema = {
  assetId: z.string().uuid().describe('Asset to update (from finance_get_assets).'),
  name: z.string().min(1).optional(),
  type: z.enum(ASSET_TYPES).optional(),
  value: z.number().min(0).optional().describe('Updated value — e.g. a new property valuation.'),
  notes: z.string().optional(),
};

export const updateAssetTool = defineTool({
  name: 'finance_update_asset',
  backend: 'finance',
  config: {
    title: 'Update an asset',
    description: "Update an asset's name, type, value, or notes. Only the fields passed are changed.",
    inputSchema,
  },
  async handler(args, { http }) {
    const { assetId, ...updates } = args;
    const asset = await updateAsset(http, assetId, updates);
    return textResult(`Updated "${asset.name}" — now £${asset.value}.`, { asset });
  },
});
