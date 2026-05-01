import { Command } from 'commander';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const startCommand = new Command('start')
  .description('Start the MCP server in stdio mode')
  .option('--mcp', 'Start MCP server via stdio (default when called this way)', true)
  .action(() => {
    // Resolve the mcp-server entry point. In dev it is src/index.ts, in production dist/index.js
    const mcpServerPath = join(__dirname, '../../../mcp-server/dist/index.js');
    const child = spawn('node', [mcpServerPath], {
      stdio: 'inherit',
      env: process.env,
    });

    child.on('error', (err) => {
      console.error('Failed to start MCP server:', err.message);
      process.exit(1);
    });

    child.on('exit', (code) => {
      process.exit(code ?? 0);
    });
  });
