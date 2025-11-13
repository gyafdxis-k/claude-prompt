import WebSocket from 'ws';
import * as fs from 'fs';
import * as path from 'path';

const TEST_DIR = path.join(process.cwd(), 'test-temp-' + Date.now());

async function runTests() {
  console.log('\n🧪 Starting End-to-End Tests\n');
  
  await fs.promises.mkdir(TEST_DIR, { recursive: true });
  console.log(`✓ Created test directory: ${TEST_DIR}`);
  
  const ws = new WebSocket('ws://localhost:8765');
  
  await new Promise((resolve) => {
    ws.on('open', () => {
      console.log('✓ Connected to local server\n');
      resolve(true);
    });
  });
  
  async function sendToolRequest(tool: string, parameters: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 5000);
      
      const handler = (data: Buffer) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'tool_response' && message.payload.id === id) {
          clearTimeout(timeout);
          ws.off('message', handler);
          resolve(message.payload);
        }
      };
      
      ws.on('message', handler);
      
      ws.send(JSON.stringify({
        type: 'tool_request',
        payload: { id, tool, parameters }
      }));
    });
  }
  
  try {
    console.log('Test 1: Write File');
    const testFile = path.join(TEST_DIR, 'test.txt');
    const writeResult = await sendToolRequest('write_file', {
      path: testFile,
      content: 'Hello from test!'
    });
    
    if (writeResult.success) {
      console.log('✓ Write file successful');
    } else {
      console.log('✗ Write file failed:', writeResult.error);
    }
    
    console.log('\nTest 2: Read File');
    const readResult = await sendToolRequest('read_file', {
      path: testFile
    });
    
    if (readResult.success && readResult.data.content === 'Hello from test!') {
      console.log('✓ Read file successful');
      console.log('  Content:', readResult.data.content);
    } else {
      console.log('✗ Read file failed');
    }
    
    console.log('\nTest 3: Edit File');
    const editResult = await sendToolRequest('edit_file', {
      path: testFile,
      old_string: 'test',
      new_string: 'bridge'
    });
    
    if (editResult.success) {
      console.log('✓ Edit file successful');
      
      const verifyRead = await sendToolRequest('read_file', { path: testFile });
      console.log('  New content:', verifyRead.data.content);
    } else {
      console.log('✗ Edit file failed:', editResult.error);
    }
    
    console.log('\nTest 4: List Files');
    const listResult = await sendToolRequest('list_files', {
      pattern: '*.txt',
      cwd: TEST_DIR
    });
    
    if (listResult.success) {
      console.log('✓ List files successful');
      console.log('  Files found:', listResult.data.files);
    } else {
      console.log('✗ List files failed:', listResult.error);
    }
    
    console.log('\nTest 5: Run Command');
    const cmdResult = await sendToolRequest('run_command', {
      command: 'echo "test command"',
      cwd: TEST_DIR
    });
    
    if (cmdResult.success) {
      console.log('✓ Run command successful');
      console.log('  Output:', cmdResult.data.stdout.trim());
    } else {
      console.log('✗ Run command failed:', cmdResult.error);
    }
    
    console.log('\n✅ All tests completed!\n');
    
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    ws.close();
    await fs.promises.rm(TEST_DIR, { recursive: true, force: true });
    console.log('✓ Cleaned up test directory');
    process.exit(0);
  }
}

runTests();
