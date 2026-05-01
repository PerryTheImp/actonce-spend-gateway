import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { DecisionRouter, type GatewayConfig } from '@actonce/core';

// We will test the handlers directly to avoid stdio complexity.
// Replicate the server setup from src/index.ts but with a temp config.

function buildTestServer(tmpDir: string) {
  const routerConfig: GatewayConfig = {
    policyPath: './policies/starter-policy.yaml',
    dbPath: ':memory:',
    logDestination: 'stdout',
    queuePath: join(tmpDir, 'approval-queue.json'),
  };

  const router = new DecisionRouter(routerConfig);
  const server = new Server(
    { name: 'actonce-spend-test', version: '0.1.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'check_spend',
          description: 'Evaluate a spend request',
          inputSchema: {
            type: 'object',
            properties: {
              amount: { type: 'number' },
              currency: { type: 'string' },
              merchant: { type: 'string' },
              category: { type: 'string' },
              reason: { type: 'string' },
              agent_id: { type: 'string' },
              task_id: { type: 'string' },
              request_id: { type: 'string' },
              simulate: { type: 'boolean' },
            },
            required: ['amount', 'currency', 'merchant'],
          },
        },
        {
          name: 'log_spend_result',
          description: 'Record outcome',
          inputSchema: {
            type: 'object',
            properties: {
              transaction_reference: { type: 'string' },
              status: { type: 'string' },
              payment_method: { type: 'string' },
              receipt_url: { type: 'string' },
              notes: { type: 'string' },
            },
            required: ['transaction_reference', 'status'],
          },
        },
        {
          name: 'preview_policy',
          description: 'Preview policy',
          inputSchema: { type: 'object', properties: {} },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: rawArgs } = request.params;
    const args = (rawArgs ?? {}) as Record<string, unknown>;
    const toolArgs = args ?? {};

    if (name === 'check_spend') {
      const result = router.evaluate(
        {
          amount: Number(toolArgs.amount),
          currency: String(toolArgs.currency),
          merchant: String(toolArgs.merchant),
          category: toolArgs.category ? String(toolArgs.category) : undefined,
          reason: toolArgs.reason ? String(toolArgs.reason) : undefined,
          agentId: toolArgs.agent_id ? String(toolArgs.agent_id) : undefined,
          taskId: toolArgs.task_id ? String(toolArgs.task_id) : undefined,
          requestId: toolArgs.request_id ? String(toolArgs.request_id) : undefined,
        },
        Boolean(toolArgs.simulate)
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              decision: result.decision.toLowerCase(),
              transaction_reference: result.transactionReference,
              policy_matched: result.policyMatched,
              policy_reason: result.policyReason,
              approval_required: result.approvalRequired,
              dedupe_status: result.dedupeStatus,
              expires_at: result.expiresAt,
              time_to_decision_ms: result.timeToDecisionMs,
            }),
          },
        ],
      };
    }

    if (name === 'log_spend_result') {
      router.logSpendResult(
        String(toolArgs.transaction_reference),
        String(toolArgs.status) as 'completed' | 'failed',
        toolArgs.payment_method ? String(toolArgs.payment_method) : undefined,
        toolArgs.receipt_url ? String(toolArgs.receipt_url) : undefined,
        toolArgs.notes ? String(toolArgs.notes) : undefined
      );
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ logged: true, transaction_reference: String(toolArgs.transaction_reference), status: String(toolArgs.status) }),
          },
        ],
      };
    }

    if (name === 'preview_policy') {
      const policy = router.getPolicy();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              version: policy.version,
              default_mode: policy.default_mode,
              currency: policy.currency,
              max_single_purchase: policy.max_single_purchase,
            }),
          },
        ],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  });

  return { server, router };
}

describe('MCP Server Tools', () => {
  let tmpDir: string;
  let server: Server;
  let router: DecisionRouter;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'actonce-mcp-test-'));
    const built = buildTestServer(tmpDir);
    server = built.server;
    router = built.router;
  });

  afterEach(() => {
    router.close();
    rmSync(tmpDir, { recursive: true, force: true });
  });

  async function callTool(name: string, args: Record<string, unknown>) {
    const response = await server.request({
      method: 'tools/call',
      params: { name, arguments: args },
    } as unknown as Parameters<typeof server.request>[0], CallToolRequestSchema);
    return response;
  }

  it('should list tools', async () => {
    const response = await server.request({
      method: 'tools/list',
      params: {},
    } as unknown as Parameters<typeof server.request>[0], ListToolsRequestSchema);
    expect(response.tools.length).toBe(3);
    const names = response.tools.map((t: { name: string }) => t.name);
    expect(names).toContain('check_spend');
    expect(names).toContain('log_spend_result');
    expect(names).toContain('preview_policy');
  });

  it('check_spend approves small purchase', async () => {
    const response = await callTool('check_spend', {
      amount: 14.99,
      currency: 'GBP',
      merchant: 'namecheap.com',
      category: 'domains',
      reason: 'Register domain',
    });
    const text = (response.content[0] as { text: string }).text;
    const parsed = JSON.parse(text);
    expect(parsed.decision).toBe('approved');
    expect(parsed.transaction_reference).toMatch(/^actonce_txn_/);
    expect(parsed.approval_required).toBe(false);
  });

  it('check_spend rejects blocked category', async () => {
    const response = await callTool('check_spend', {
      amount: 14.99,
      currency: 'GBP',
      merchant: 'namecheap.com',
      category: 'weapons',
      reason: 'Bad idea',
    });
    const text = (response.content[0] as { text: string }).text;
    const parsed = JSON.parse(text);
    expect(parsed.decision).toBe('rejected');
    expect(parsed.policy_matched).toBe('blocked_category');
  });

  it('check_spend requires approval above threshold', async () => {
    const response = await callTool('check_spend', {
      amount: 30,
      currency: 'GBP',
      merchant: 'namecheap.com',
      category: 'domains',
    });
    const text = (response.content[0] as { text: string }).text;
    const parsed = JSON.parse(text);
    expect(parsed.decision).toBe('requires_approval');
    expect(parsed.approval_required).toBe(true);
  });

  it('check_spend simulate mode does not queue or log dedupe', async () => {
    const response = await callTool('check_spend', {
      amount: 14.99,
      currency: 'GBP',
      merchant: 'namecheap.com',
      simulate: true,
    });
    const text = (response.content[0] as { text: string }).text;
    const parsed = JSON.parse(text);
    expect(parsed.decision).toBe('approved');

    // Second identical request should also be approved because simulate does not record dedupe
    const response2 = await callTool('check_spend', {
      amount: 14.99,
      currency: 'GBP',
      merchant: 'namecheap.com',
      simulate: true,
    });
    const text2 = (response2.content[0] as { text: string }).text;
    const parsed2 = JSON.parse(text2);
    expect(parsed2.decision).toBe('approved');
  });

  it('preview_policy returns policy summary', async () => {
    const response = await callTool('preview_policy', {});
    const text = (response.content[0] as { text: string }).text;
    const parsed = JSON.parse(text);
    expect(parsed.version).toBe('1.0');
    expect(parsed.currency).toBe('GBP');
    expect(parsed.max_single_purchase).toBe(50);
  });

  it('log_spend_result returns logged confirmation', async () => {
    const response = await callTool('log_spend_result', {
      transaction_reference: 'actonce_txn_test123',
      status: 'completed',
      payment_method: 'stripe_link_cli',
      notes: 'Test payment',
    });
    const text = (response.content[0] as { text: string }).text;
    const parsed = JSON.parse(text);
    expect(parsed.logged).toBe(true);
    expect(parsed.status).toBe('completed');
  });
});
