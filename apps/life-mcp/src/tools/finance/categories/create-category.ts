import { z } from 'zod';
import { createCategory } from '../../../api/finance-categories-api.js';
import { defineTool, textResult } from '../../_register.js';

const inputSchema = {
  name: z.string().min(1),
  colour: z.string().optional().describe('Hex colour, e.g. "#22C55E".'),
  icon: z.string().optional().describe('Icon name, e.g. "shopping-cart".'),
  parentId: z.string().uuid().optional().describe('Parent category, for a sub-category (from finance_get_categories).'),
};

export const createCategoryTool = defineTool({
  name: 'finance_create_category',
  backend: 'finance',
  config: {
    title: 'Create a spending category',
    description: 'Create a custom spending category (or sub-category) — use finance_get_categories first to check a suitable one doesn\'t already exist.',
    inputSchema,
  },
  async handler(args, { http }) {
    const category = await createCategory(http, args);
    return textResult(`Created category "${category.name}".`, { category });
  },
});
