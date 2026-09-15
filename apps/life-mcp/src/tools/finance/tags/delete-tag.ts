import { z } from 'zod';
import { deleteTag } from '../../../api/finance-tags-api.js';
import { defineTool, textResult } from '../../_register.js';

const inputSchema = {
  tagId: z.string().uuid().describe('Tag to delete (from finance_get_tags).'),
};

export const deleteTagTool = defineTool({
  name: 'finance_delete_tag',
  backend: 'finance',
  config: {
    title: 'Delete a tag',
    description: 'Permanently delete a tag — removes it from every transaction it was on.',
    inputSchema,
  },
  async handler(args, { http }) {
    await deleteTag(http, args.tagId);
    return textResult(`Deleted tag ${args.tagId}.`);
  },
});
