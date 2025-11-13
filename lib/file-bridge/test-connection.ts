/**
 * 测试文件服务连接
 */

import { getFileServiceClient } from './ws-client';

async function testConnection() {
  const client = getFileServiceClient();
  
  try {
    console.log('正在连接到本地文件服务...');
    await client.connect();
    console.log('✅ 连接成功！');
    
    // 测试读取文件
    console.log('\n测试读取文件...');
    const content = await client.readFile('/Users/gaodong/Desktop/claude-prompt/README.md');
    console.log('✅ 读取成功！文件大小:', content.length, '字节');
    console.log('前100字符:', content.substring(0, 100));
    
    // 测试列出文件
    console.log('\n测试列出文件...');
    const files = await client.listFiles('/Users/gaodong/Desktop/claude-prompt', '*.md');
    console.log('✅ 找到', files.length, '个 .md 文件');
    files.forEach(file => console.log('  -', file));
    
    console.log('\n✅ 所有测试通过！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    client.disconnect();
  }
}

testConnection();
