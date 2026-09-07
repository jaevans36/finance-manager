#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { buildBackends } from './backends/registry.js';
import { ConfigError, loadConfig } from './config.js';
import { registerTools } from './tools/index.js';
import { log } from './utils/logger.js';

async function main(): Promise<void> {
  let config;
  try {
    config = loadConfig();
  } catch (err) {
    if (err instanceof ConfigError) {
      log.error(err.message);
      process.exit(1);
    }
    throw err;
  }

  const backends = buildBackends(config);

  // Fail fast: prove every backend's credentials before connecting the transport.
  for (const backend of Object.values(backends)) {
    try {
      await backend.auth.getToken();
    } catch (err) {
      log.error(`Backend "${backend.name}" authentication failed`, err);
      process.exit(1);
    }
  }

  const server = new McpServer({ name: 'life-manager-mcp', version: '1.0.0' });
  registerTools(server, backends);

  await server.connect(new StdioServerTransport());
  log.info(`life-mcp ready — backends: ${Object.keys(backends).join(', ')}`);

  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.on(signal, () => {
      log.info(`${signal} received — shutting down`);
      void server.close().finally(() => process.exit(0));
    });
  }
}

main().catch((err) => {
  log.error('Fatal error', err);
  process.exit(1);
});
