import { AxiosError } from 'axios';
import { z } from 'zod';
import type { AxiosInstance } from 'axios';

jest.mock('../../../api/labels-api.js');
import * as labelsApi from '../../../api/labels-api.js';

import { listLabelsTool } from '../list-labels.js';
import { createLabelTool } from '../create-label.js';
import type { AnyToolDef } from '../../_register.js';

const mockApi = labelsApi as jest.Mocked<typeof labelsApi>;
const http = {} as AxiosInstance;
const ctx = { http };

function parse(def: AnyToolDef, input: unknown) {
  return z.object(def.config.inputSchema).safeParse(input);
}

describe('list_labels', () => {
  it('takes no input', () => {
    expect(parse(listLabelsTool, {}).success).toBe(true);
  });

  it('renders name / colour / id and handles empty', async () => {
    mockApi.listLabels.mockResolvedValueOnce([{ id: 'l1', name: 'Home', colourHex: '#21B8A4' }]);
    let res = await listLabelsTool.handler({}, ctx);
    expect(res.content[0].text).toContain('Home');
    expect(res.content[0].text).toContain('#21B8A4');

    mockApi.listLabels.mockResolvedValueOnce([]);
    res = await listLabelsTool.handler({}, ctx);
    expect(res.content[0].text).toContain('No labels defined');
  });
});

describe('create_label', () => {
  it('requires a 1-50 char name and a #rrggbb colour', () => {
    expect(parse(createLabelTool, { name: 'Work', colourHex: '#3B82F6' }).success).toBe(true);
    expect(parse(createLabelTool, { name: '', colourHex: '#3B82F6' }).success).toBe(false);
    expect(parse(createLabelTool, { name: 'Work', colourHex: 'blue' }).success).toBe(false);
    expect(parse(createLabelTool, { name: 'Work', colourHex: '#FFF' }).success).toBe(false);
  });

  it('creates and reports the label', async () => {
    mockApi.createLabel.mockResolvedValue({ id: 'l9', name: 'Work', colourHex: '#3B82F6' });
    const res = await createLabelTool.handler({ name: 'Work', colourHex: '#3B82F6' }, ctx);
    expect(mockApi.createLabel).toHaveBeenCalledWith(http, { name: 'Work', colourHex: '#3B82F6' });
    expect(res.content[0].text).toContain('Created label "Work"');
  });

  it('maps a 409 to a clean isError message', async () => {
    mockApi.createLabel.mockRejectedValue(
      new AxiosError('conflict', '409', undefined, undefined, {
        status: 409,
        data: 'A label with that name already exists.',
      } as never),
    );
    const res = await createLabelTool.handler({ name: 'Work', colourHex: '#3B82F6' }, ctx);
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain('already exists');
  });
});
