import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { importTransactionsCsv } from '../finance-transactions-api.js';
import type { CsvImportResult } from '../../types/finance-transaction.js';

const UUID = '11111111-1111-1111-1111-111111111111';

/**
 * Unlike the other finance api/*.ts files, this one gets a direct test rather than only
 * being exercised (mocked) via its tool's test — it's the only function in this package
 * building a multipart request from Node's native FormData/Blob, an untested pattern
 * elsewhere in this codebase, worth proving actually works end to end.
 */
describe('importTransactionsCsv', () => {
  it('posts a multipart request with accountId/bankFormat as query params and returns the parsed result', async () => {
    const http = axios.create({ baseURL: 'http://finance.test' });
    const mock = new MockAdapter(http);
    const result: CsvImportResult = {
      imported: 2,
      duplicates: 1,
      errors: 0,
      errorMessages: [],
      batchId: 'batch-1',
      skipped: 0,
      skipMessages: null,
    };

    mock.onPost('/api/v1/finance/transactions/import').reply((config) => {
      expect(config.params).toEqual({ accountId: UUID, bankFormat: 'generic' });
      expect(config.data).toBeInstanceOf(FormData);
      return [200, result];
    });

    const csv = 'Date,Description,Amount\n01/01/2025,TESCO,-25.50';
    const res = await importTransactionsCsv(http, UUID, csv, 'generic');

    expect(res).toEqual(result);
  });

  it('propagates an error response (e.g. no visibility into the account)', async () => {
    const http = axios.create({ baseURL: 'http://finance.test' });
    const mock = new MockAdapter(http);
    mock.onPost('/api/v1/finance/transactions/import').reply(404, { error: { message: 'not found' } });

    await expect(importTransactionsCsv(http, UUID, 'Date,Description,Amount', 'generic')).rejects.toMatchObject({
      response: { status: 404 },
    });
  });
});
