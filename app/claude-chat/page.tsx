'use client';

import { useState } from 'react';
import { useFileService } from '@/lib/file-bridge/useFileService';

export default function ClaudeChatPage() {
  const { status, readFile, writeFile, listFiles } = useFileService();
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await processClaudeCommand(userMessage);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `错误: ${error instanceof Error ? error.message : '处理失败'}` 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const processClaudeCommand = async (message: string): Promise<string> => {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('读取文件') || lowerMessage.includes('read file')) {
      const pathMatch = message.match(/[/\\][\w/\\.-]+\.\w+/);
      if (!pathMatch) {
        return '请指定要读取的文件路径，例如："读取文件 /Users/gaodong/Desktop/claude-prompt/README.md"';
      }
      const filePath = pathMatch[0];
      const content = await readFile(filePath);
      return `成功读取文件 ${filePath}:\n\n\`\`\`\n${content.substring(0, 500)}${content.length > 500 ? '...\n\n(内容已截断，共 ' + content.length + ' 字符)' : ''}\n\`\`\``;
    }

    if (lowerMessage.includes('写入文件') || lowerMessage.includes('write file')) {
      const pathMatch = message.match(/[/\\][\w/\\.-]+\.\w+/);
      if (!pathMatch) {
        return '请指定要写入的文件路径';
      }
      const filePath = pathMatch[0];
      const contentMatch = message.match(/内容[:：]\s*(.+)/s);
      if (!contentMatch) {
        return '请指定要写入的内容，格式：写入文件 /path/to/file.txt 内容: Hello World';
      }
      const content = contentMatch[1].trim();
      await writeFile(filePath, content);
      return `成功写入文件 ${filePath}`;
    }

    if (lowerMessage.includes('列出文件') || lowerMessage.includes('list files')) {
      const dirMatch = message.match(/[/\\][\w/\\.-]+/);
      const dir = dirMatch ? dirMatch[0] : '/Users/gaodong/Desktop/claude-prompt';
      const files = await listFiles(dir, '*.md');
      return `目录 ${dir} 中的 Markdown 文件:\n\n${files.map(f => `- ${f}`).join('\n')}`;
    }

    return '我支持以下命令:\n' +
           '- "读取文件 <路径>" - 读取指定文件\n' +
           '- "写入文件 <路径> 内容: <内容>" - 写入文件\n' +
           '- "列出文件 <目录>" - 列出目录中的文件';
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="h-14 border-b border-gray-200 flex items-center justify-between px-4 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🤖</span>
          <h1 className="text-xl font-bold">Claude 文件操作测试</h1>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${status.connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600">
              {status.connected ? '已连接文件服务' : '未连接'}
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 py-12">
              <p className="text-lg mb-4">👋 你好！我可以帮你操作本地文件</p>
              <div className="text-sm space-y-2">
                <p>试试这些命令：</p>
                <ul className="list-disc list-inside">
                  <li>读取文件 /Users/gaodong/Desktop/claude-prompt/README.md</li>
                  <li>列出文件 /Users/gaodong/Desktop/claude-prompt</li>
                  <li>写入文件 /Users/gaodong/Desktop/claude-prompt/test.txt 内容: Hello Claude!</li>
                </ul>
              </div>
            </div>
          )}

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-gray-200 bg-white p-4 shrink-0">
        <div className="max-w-4xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="输入命令... 例如: 读取文件 /path/to/file.txt"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading || !status.connected}
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || !status.connected || !input.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? '处理中...' : '发送'}
          </button>
        </div>
      </div>
    </div>
  );
}
