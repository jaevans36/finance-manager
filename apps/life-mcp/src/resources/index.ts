import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { BackendRegistry } from '../backends/types.js';
import { type ResourceDef } from './_register.js';
import { tasksTodayResource } from './tasks-today.js';
import { tasksOverdueResource } from './tasks-overdue.js';
import { eventsUpcomingResource } from './events-upcoming.js';

export const allResources: ResourceDef[] = [
  tasksTodayResource,
  tasksOverdueResource,
  eventsUpcomingResource,
];

export function registerResources(server: McpServer, backends: BackendRegistry): void {
  for (const def of allResources) {
    const backend = backends[def.backend];
    if (!backend) {
      throw new Error(`Resource "${def.uri}" needs backend "${def.backend}" which is not configured.`);
    }
    server.registerResource(
      def.name,
      def.uri,
      { description: def.description, mimeType: def.mimeType },
      async () => ({
        contents: [{ uri: def.uri, mimeType: def.mimeType, text: await def.loader(backend.http) }],
      }),
    );
  }
}
