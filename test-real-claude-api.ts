import Anthropic from '@anthropic-ai/sdk';
import WebSocket from 'ws';

console.log('\n🤖 使用真实的 Claude API 测试本地文件工具\n');

const client = new Anthropic({
  apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_AUTH_TOKEN,
  baseURL: process.env.NEXT_PUBLIC_ANTHROPIC_BASE_URL
});

const ws = new WebSocket('ws://localhost:8765');

ws.on('open', async () => {
  console.log('✓ 连接到本地文件服务器\n');
  
  try {
    const systemPrompt = `You have access to local file system tools. When the user asks you to read or write files, use these tools:

Available tools:
- read_file: Read a file. Format: <tool_use><tool_name>read_file</tool_name><parameters>{"path": "/path/to/file"}</parameters></tool_use>
- write_file: Write a file. Format: <tool_use><tool_name>write_file</tool_name><parameters>{"path": "/path/to/file", "content": "content"}</parameters></tool_use>
- list_files: List files. Format: <tool_use><tool_name>list_files</tool_name><parameters>{"pattern": "*.txt", "cwd": "/path"}</parameters></tool_use>

When you use a tool, the result will be provided back to you automatically.`;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('第一轮对话：要求读取文件');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const userMessage = '请使用 read_file 工具读取 /Users/gaodong/Desktop/claude-prompt/package.json 文件，告诉我项目名称是什么。记住要使用工具格式：<tool_use><tool_name>read_file</tool_name><parameters>{"path": "..."}</parameters></tool_use>';

    console.log('📤 用户消息:', userMessage, '\n');

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage
        }
      ]
    });

    console.log('📥 Claude 响应:\n');
    const assistantMessage = response.content[0].type === 'text' ? response.content[0].text : '';
    console.log(assistantMessage);
    console.log('\n');

    // 检查是否包含 tool_use
    const toolUseMatch = assistantMessage.match(/<tool_use>[\s\S]*?<\/tool_use>/);
    
    if (toolUseMatch) {
      console.log('✅ Claude 使用了工具格式！\n');
      console.log('🔍 提取的工具调用:\n', toolUseMatch[0], '\n');

      // 解析工具调用
      const toolNameMatch = assistantMessage.match(/<tool_name>(.*?)<\/tool_name>/);
      const paramsMatch = assistantMessage.match(/<parameters>([\s\S]*?)<\/parameters>/);

      if (toolNameMatch && paramsMatch) {
        const toolName = toolNameMatch[1];
        const parameters = JSON.parse(paramsMatch[1]);

        console.log('📋 解析结果:');
        console.log('   工具名称:', toolName);
        console.log('   参数:', JSON.stringify(parameters, null, 2), '\n');

        // 执行工具
        console.log('🔧 执行本地文件操作...\n');
        const toolResult = await executeToolViaWebSocket(toolName, parameters);

        if (toolResult.success) {
          console.log('✅ 工具执行成功！');
          console.log('📄 文件内容片段:');
          const content = JSON.parse(toolResult.data.content);
          console.log('   项目名称:', content.name);
          console.log('   版本:', content.version);
          console.log('   文件大小:', toolResult.data.size, '字节\n');

          // 第二轮对话
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('第二轮对话：提供工具结果并继续');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

          const toolResultText = `<tool_result>
{
  "path": "${toolResult.data.path}",
  "size": ${toolResult.data.size},
  "name": "${content.name}",
  "version": "${content.version}"
}
</tool_result>`;

          console.log('📤 提供工具结果给 Claude:\n', toolResultText, '\n');

          const response2 = await client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1000,
            system: systemPrompt,
            messages: [
              { role: 'user', content: userMessage },
              { role: 'assistant', content: assistantMessage },
              { role: 'user', content: toolResultText + '\n\n现在请根据工具返回的结果回答：项目名称是什么？' }
            ]
          });

          console.log('📥 Claude 最终回答:\n');
          const finalAnswer = response2.content[0].type === 'text' ? response2.content[0].text : '';
          console.log(finalAnswer, '\n');

          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('🎉 测试完成！');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('✅ Claude 可以使用工具格式');
          console.log('✅ 本地服务成功执行文件操作');
          console.log('✅ 工具结果成功返回给 Claude');
          console.log('✅ Claude 基于结果给出了答案\n');

        } else {
          console.log('❌ 工具执行失败:', toolResult.error);
        }
      }
    } else {
      console.log('⚠️  Claude 没有使用工具格式');
      console.log('这可能需要在网页版中通过扩展来引导 Claude 使用工具\n');
    }

  } catch (error: any) {
    console.error('❌ 错误:', error.message);
  } finally {
    ws.close();
    process.exit(0);
  }
});

async function executeToolViaWebSocket(tool: string, parameters: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const id = crypto.randomUUID();
    
    const timeout = setTimeout(() => {
      reject(new Error('工具调用超时'));
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

ws.on('error', (error) => {
  console.error('❌ WebSocket 连接失败:', error.message);
  process.exit(1);
});
