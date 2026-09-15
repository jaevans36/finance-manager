import { z } from 'zod';
import { createTag } from '../../../api/finance-tags-api.js';
import { defineTool, textResult } from '../../_register.js';

const inputSchema = {
  name: z.string().min(1).describe('Tag name, e.g. "Wales holiday 2026".'),
  colour: z.string().optional().describe('Hex colour, e.g. "#22C55E".'),
};

export const createTagTool = defineTool({
  name: 'finance_create_tag',
  backend: 'finance',
  config: {
    title: 'Create a tag',
    description: 'Create a new free-form tag, ready to attach to transactions with finance_tag_transaction.',
    inputSchema,
  },
  async handler(args, { http }) {
    const tag = await createTag(http, args);
    return textResult(`Created tag "${tag.name}".`, { tag });
  },
});
