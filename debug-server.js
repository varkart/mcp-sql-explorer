#!/usr/bin/env node

// Debug script to test the MCP server
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('=== MCP Server Debug Tool ===\n');

// Start the server
const serverPath = join(__dirname, 'dist/index.js');
console.log(`Starting server: node ${serverPath} --stdio --debug\n`);

const server = spawn('node', [serverPath, '--stdio', '--debug'], {
  stdio: ['pipe', 'pipe', 'inherit'],
  env: { ...process.env, NODE_ENV: 'development' }
});

let initTimeout = setTimeout(() => {
  console.error('\n❌ Server did not initialize within 5 seconds');
  server.kill();
  process.exit(1);
}, 5000);

// Send an initialize request
const initRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {
      experimental: {},
      sampling: {}
    },
    clientInfo: {
      name: 'debug-client',
      version: '1.0.0'
    }
  }
};

server.stdout.on('data', (data) => {
  const lines = data.toString().split('\n').filter(l => l.trim());

  for (const line of lines) {
    try {
      const msg = JSON.parse(line);
      console.log('📩 Server response:', JSON.stringify(msg, null, 2));

      if (msg.id === 1) {
        clearTimeout(initTimeout);
        console.log('\n✅ Server initialized successfully!');
        console.log('\nServer capabilities:', JSON.stringify(msg.result?.capabilities, null, 2));

        // Test listing tools
        setTimeout(() => {
          const toolsRequest = {
            jsonrpc: '2.0',
            id: 2,
            method: 'tools/list',
            params: {}
          };
          console.log('\n📤 Requesting tools list...');
          server.stdin.write(JSON.stringify(toolsRequest) + '\n');
        }, 500);
      }

      if (msg.id === 2) {
        console.log('\n✅ Tools retrieved successfully!');
        console.log(`\nAvailable tools (${msg.result?.tools?.length || 0}):`);
        msg.result?.tools?.forEach(tool => {
          console.log(`  - ${tool.name}: ${tool.description}`);
        });

        setTimeout(() => {
          console.log('\n✅ All tests passed! Server is working correctly.');
          console.log('\n💡 To use with an MCP client, configure it with:');
          console.log(`   Command: node`);
          console.log(`   Args: ["${serverPath}", "--stdio"]`);
          server.kill();
          process.exit(0);
        }, 500);
      }
    } catch (e) {
      // Not JSON, might be a log message
      console.log('📝 Server log:', line);
    }
  }
});

server.on('error', (error) => {
  console.error('\n❌ Server error:', error.message);
  process.exit(1);
});

server.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`\n❌ Server exited with code ${code}`);
    process.exit(code || 1);
  }
});

// Send initialize request after a short delay
setTimeout(() => {
  console.log('📤 Sending initialize request...\n');
  server.stdin.write(JSON.stringify(initRequest) + '\n');
}, 1000);

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n\nShutting down...');
  server.kill();
  process.exit(0);
});
