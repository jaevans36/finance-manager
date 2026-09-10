import { z } from 'zod';
import { createLabel } from '../../api/labels-api.js';
import { defineTool, textResult } from '../_register.js';

const inputSchema = {
  name: z.string().min(1).max(50).describe('Label name (must be unique).'),
  colourHex: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'colourHex must be a 6-digit hex colour, e.g. #21B8A4')
    .describe('Hex colour, e.g. #21B8A4.'),
};

export const createLabelTool = defineTool({
  name: 'create_label',
  backend: 'life',
  config: {
    title: 'Create a label',
    description: 'Create a new task label. Fails if a label with that name already exists.',
    inputSchema,
  },
  async handler(args, { http }) {
    const label = await createLabel(http, { name: args.name, colourHex: args.colourHex });
    return textResult(`Created label "${label.name}" (${label.colourHex}) — \`${label.id}\`.`, { label });
  },
});
