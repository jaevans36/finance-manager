import type { AxiosInstance } from 'axios';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { BackendRegistry } from '../backends/types.js';
import { toToolError } from '../utils/api-error.js';

/**
 * Structural match for the SDK's CallToolResult — declared locally so tool/handler
 * modules never import the ESM-only SDK and stay unit-testable under CJS Jest.
 */
export interface ToolResult {
  content: { type: 'text'; text: string }[];
  isError?: boolean;
  structuredContent?: Record<string, unknown>;
}

export interface ToolContext {
  /** Authenticated axios client for the tool's backend. */
  http: AxiosInstance;
}

export interface ToolDef<Shape extends z.ZodRawShape = z.ZodRawShape> {
  name: string;
  /** Backend key this tool talks to ("life"; later "finance"). */
  backend: string;
  config: {
    title: string;
    description: string;
    inputSchema: Shape;
  };
  handler: (args: z.objectOutputType<Shape, z.ZodTypeAny>, ctx: ToolContext) => Promise<ToolResult>;
}

/**
 * Wrap a tool definition. Keeps full input typing in the tool module (no need to
 * restate the shape) and wraps the handler so any thrown error becomes an MCP tool
 * error result — so handlers can be unit-tested for error mapping without the SDK.
 */
export function defineTool<Shape extends z.ZodRawShape>(def: ToolDef<Shape>): ToolDef<Shape> {
  const inner = def.handler;
  return {
    ...def,
    handler: async (args, ctx) => {
      try {
        return await inner(args, ctx);
      } catch (err) {
        return toToolError(err);
      }
    },
  };
}

/**
 * Shape-erased ToolDef for collections/registration. A specifically-typed
 * ToolDef<Shape> is assignable to this (the `any` in the handler args sidesteps
 * the contravariance that blocks ToolDef<Shape> -> ToolDef<ZodRawShape>).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyToolDef = ToolDef<any>;

/** A plain text tool result, optionally carrying the raw object as structuredContent. */
export function textResult(text: string, structured?: Record<string, unknown>): ToolResult {
  const result: ToolResult = { content: [{ type: 'text', text }] };
  if (structured !== undefined) result.structuredContent = structured;
  return result;
}

/**
 * Register one ToolDef against the server, binding it to its backend's http client
 * and funnelling any thrown error into an MCP tool error result.
 */
export function registerTool(server: McpServer, backends: BackendRegistry, def: AnyToolDef): void {
  const backend = backends[def.backend];
  if (!backend) {
    throw new Error(`Tool "${def.name}" needs backend "${def.backend}" which is not configured.`);
  }

  // def.handler is already error-wrapped by defineTool.
  const callback = (args: unknown): Promise<ToolResult> =>
    def.handler(args as z.objectOutputType<z.ZodRawShape, z.ZodTypeAny>, { http: backend.http });

  // The SDK's ToolCallback type is derived from the raw shape; our handler is
  // shape-generic, so bridge with a single cast at the boundary.
  server.registerTool(def.name, def.config, callback as never);
}
