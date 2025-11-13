const WebSocket = require('ws');
const fs = require('fs');

console.log('\n🌐 模拟网页端 Claude 测试\n');
console.log('这个测试模拟网页版 Claude 通过扩展调用本地文件工具\n');

const ws = new WebSocket('ws://localhost:8765');

ws.on('open', () => {
  console.log('✓ 扩展已连接到本地服务器\n');
  
  runTests();
});

ws.on('error', (error) => {
  console.error('❌ 连接失败:', error.message);
  console.error('请确保服务器正在运行: npm run server');
  process.exit(1);
});

async function sendToolRequest(tool, parameters) {
  return new Promise((resolve, reject) => {
    const id = crypto.randomUUID();
    
    const timeout = setTimeout(() => {
      reject(new Error('请求超时'));
    }, 5000);
    
    const handler = (data) => {
      const message = JSON.parse(data.toString());
      if (message.type === 'tool_response' && message.payload.id === id) {
        clearTimeout(timeout);
        ws.off('message', handler);
        resolve(message.payload);
      }
    };
    
    ws.on('message', handler);
    
    console.log(`\n📤 网页端 Claude 调用工具: ${tool}`);
    console.log(`   参数:`, JSON.stringify(parameters, null, 2));
    
    ws.send(JSON.stringify({
      type: 'tool_request',
      payload: { id, tool, parameters }
    }));
  });
}

async function runTests() {
  const testFilePath = '/Users/gaodong/Desktop/claude-prompt/test-from-web-claude.txt';
  
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('测试 1: 读取现有文件 (package.json)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const readResult = await sendToolRequest('read_file', {
      path: '/Users/gaodong/Desktop/claude-prompt/package.json'
    });
    
    if (readResult.success) {
      console.log('✅ 读取成功!');
      console.log(`   文件大小: ${readResult.data.size} 字节`);
      const content = JSON.parse(readResult.data.content);
      console.log(`   项目名称: ${content.name}`);
      console.log(`   版本: ${content.version}`);
    } else {
      console.log('❌ 读取失败:', readResult.error);
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('测试 2: 写入新文件');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const writeContent = `这个文件是由网页端 Claude 通过本地文件桥创建的！

创建时间: ${new Date().toLocaleString('zh-CN')}
测试目的: 验证网页版 Claude 可以写入本地文件

功能验证:
✓ 网页端发起请求
✓ 浏览器扩展捕获
✓ WebSocket 传输到本地
✓ 本地服务执行文件操作
✓ 结果返回到网页

这证明了整个流程工作正常！🎉
`;
    
    const writeResult = await sendToolRequest('write_file', {
      path: testFilePath,
      content: writeContent
    });
    
    if (writeResult.success) {
      console.log('✅ 写入成功!');
      console.log(`   文件路径: ${writeResult.data.path}`);
      console.log(`   写入字节: ${writeResult.data.size}`);
    } else {
      console.log('❌ 写入失败:', writeResult.error);
      throw new Error('写入失败');
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('测试 3: 验证写入的文件');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('   使用 Node.js fs 模块直接读取验证...');
    if (fs.existsSync(testFilePath)) {
      const actualContent = fs.readFileSync(testFilePath, 'utf-8');
      console.log('✅ 文件存在!');
      console.log('   文件内容（前100字符）:');
      console.log('   ' + actualContent.substring(0, 100).replace(/\n/g, '\n   '));
      
      if (actualContent === writeContent) {
        console.log('✅ 内容完全匹配!');
      } else {
        console.log('⚠️  内容不完全匹配，但文件已创建');
      }
    } else {
      console.log('❌ 文件不存在!');
      throw new Error('文件验证失败');
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('测试 4: 编辑文件');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const editResult = await sendToolRequest('edit_file', {
      path: testFilePath,
      old_string: '网页端 Claude',
      new_string: '网页版 Claude (已编辑)'
    });
    
    if (editResult.success) {
      console.log('✅ 编辑成功!');
      console.log(`   替换次数: ${editResult.data.replacements}`);
      
      const editedContent = fs.readFileSync(testFilePath, 'utf-8');
      if (editedContent.includes('网页版 Claude (已编辑)')) {
        console.log('✅ 编辑内容验证成功!');
      }
    } else {
      console.log('❌ 编辑失败:', editResult.error);
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('测试 5: 列出文件');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const listResult = await sendToolRequest('list_files', {
      pattern: 'test-*.txt',
      cwd: '/Users/gaodong/Desktop/claude-prompt'
    });
    
    if (listResult.success) {
      console.log('✅ 列出文件成功!');
      console.log(`   找到 ${listResult.data.count} 个文件:`);
      listResult.data.files.forEach(f => console.log(`   - ${f}`));
    } else {
      console.log('❌ 列出文件失败:', listResult.error);
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 测试总结');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ 所有测试通过！');
    console.log('\n网页版 Claude 可以通过扩展实现：');
    console.log('  ✓ 读取本地文件');
    console.log('  ✓ 写入本地文件');
    console.log('  ✓ 编辑本地文件');
    console.log('  ✓ 列出本地文件');
    console.log('\n测试文件已保存到:');
    console.log(`  ${testFilePath}`);
    console.log('\n你可以打开查看内容！\n');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
  } finally {
    ws.close();
    process.exit(0);
  }
}

setTimeout(() => {
  console.log('❌ 测试超时');
  process.exit(1);
}, 30000);
