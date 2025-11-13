/**
 * 测试 Claude 是否能自动使用文件工具写入代码
 */

async function testClaudeAutoWrite() {
  console.log('🧪 测试 Claude 自动文件写入功能\n');

  const testData = {
    step: {
      id: 'test-step',
      name: '测试步骤',
      prompt: '用户需求：{{requirement}}',
      requiresInput: ['requirement']
    },
    inputs: {
      requirement: `请创建一个简单的 TypeScript 函数文件：
      
文件路径: /Users/gaodong/Desktop/claude-prompt/test-auto-generated.ts

要求：
1. 创建一个函数 add(a: number, b: number): number
2. 创建一个函数 multiply(a: number, b: number): number  
3. 导出这两个函数

请直接使用 write_file 工具创建这个文件，不要只在回复中显示代码。`
    },
    projectPath: '/Users/gaodong/Desktop/claude-prompt',
    previousOutputs: []
  };

  console.log('📝 发送请求到 API...\n');
  console.log('需求:', testData.inputs.requirement);
  console.log('\n等待 Claude 响应...\n');

  const response = await fetch('http://localhost:3000/api/workflow/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testData)
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('❌ API 错误:', error);
    return;
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    console.error('❌ 无法读取响应流');
    return;
  }

  let buffer = '';
  let hasToolExecution = false;

  while (true) {
    const { done, value } = await reader.read();
    
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          
          if (data.type === 'chunk') {
            process.stdout.write(data.data);
            
            if (data.data.includes('[工具执行]') || data.data.includes('write_file')) {
              hasToolExecution = true;
            }
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
    }
  }

  console.log('\n\n' + '='.repeat(60));
  
  // 检查文件是否被创建
  console.log('\n🔍 检查文件是否被创建...\n');
  
  try {
    const fs = await import('fs/promises');
    const filePath = '/Users/gaodong/Desktop/claude-prompt/test-auto-generated.ts';
    const content = await fs.readFile(filePath, 'utf-8');
    
    console.log('✅ 文件已成功创建！');
    console.log(`📄 文件路径: ${filePath}`);
    console.log(`📊 文件大小: ${content.length} 字节`);
    console.log('\n文件内容预览:');
    console.log('-'.repeat(60));
    console.log(content);
    console.log('-'.repeat(60));
    
    if (hasToolExecution) {
      console.log('\n✅ Claude 成功使用了文件工具！');
    } else {
      console.log('\n⚠️  未检测到工具执行日志，但文件已创建');
    }
    
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log('❌ 文件未被创建');
      console.log('💡 Claude 可能只是在回复中显示了代码，而没有使用 write_file 工具');
      
      if (!hasToolExecution) {
        console.log('\n🔧 原因分析:');
        console.log('- Claude 没有使用 write_file 工具');
        console.log('- 可能需要在 system prompt 中更明确地指示使用工具');
      }
    } else {
      console.log('❌ 读取文件失败:', error.message);
    }
  }
}

testClaudeAutoWrite().catch(console.error);
