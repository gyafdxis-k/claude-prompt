#!/usr/bin/env node

import { LocalFileServer } from './websocket-server';
import * as path from 'path';

const args = process.argv.slice(2);
const port = parseInt(args[0]) || 8765;
const allowedPaths = args.slice(1);

if (allowedPaths.length === 0) {
  console.warn('[WARNING] No allowed paths specified. All paths will be accessible.');
  console.warn('[WARNING] Usage: node server/index.js <port> <allowed_path1> <allowed_path2> ...');
  console.warn('[WARNING] Example: node server/index.js 8765 /Users/gaodong/Desktop/my-project');
}

const resolvedPaths = allowedPaths.map(p => path.resolve(p));

console.log('[Server] Starting Local File Service...');
console.log('[Server] Port:', port);
console.log('[Server] Allowed paths:', resolvedPaths.length ? resolvedPaths.join(', ') : 'ALL (⚠️  Unsafe)');

const server = new LocalFileServer(port, resolvedPaths);

process.on('SIGINT', () => {
  console.log('\n[Server] Shutting down...');
  server.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[Server] Shutting down...');
  server.close();
  process.exit(0);
});
