import type { AxiosInstance } from 'axios';
import { describeApiError } from '../utils/api-error.js';

export interface ResourceDef {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  /** Backend key this resource reads from. */
  backend: string;
  loader: (http: AxiosInstance) => Promise<string>;
}

export function defineResource(def: ResourceDef): ResourceDef {
  return {
    ...def,
    loader: async (http) => {
      try {
        return await def.loader(http);
      } catch (err) {
        return `_Could not load ${def.uri}: ${describeApiError(err)}_`;
      }
    },
  };
}
