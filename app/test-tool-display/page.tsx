'use client';

import { useState } from 'react';
import ToolCallDisplay from '@/components/ToolCallDisplay';

export default function TestToolDisplayPage() {
  const [activeTab, setActiveTab] = useState<'diff' | 'command' | 'file'>('diff');

  const diffExample = [
    {
      tool: 'Edit',
      params: {
        file_path: '/Users/gaodong/Desktop/claude-prompt/example.ts',
        old_string: 'const hello = "world";\nconsole.log(hello);',
        new_string: 'const greeting = "Hello, World!";\nconsole.log(greeting);\nconsole.log("测试");'
      },
      result: 'success'
    }
  ];

  const commandExample = [
    {
      tool: 'Bash',
      params: {
        command: 'npm run build'
      },
      result: {
        stdout: '> claude-dev-assistant@0.1.0 build\n> next build\n\n   ▲ Next.js 16.0.1\n\n   Creating an optimized production build ...\n ✓ Compiled successfully\n ✓ Linting and checking validity of types\n ✓ Collecting page data\n ✓ Generating static pages (10/10)\n ✓ Collecting build traces\n ✓ Finalizing page optimization\n\nRoute (app)                              Size     First Load JS\n┌ ○ /                                    137 B          87.2 kB\n└ ○ /about                               142 B          87.2 kB\n\n○  (Static)  prerendered as static content',
        stderr: '',
        exitCode: 0
      }
    }
  ];

  const fileExample = [
    {
      tool: 'list_files',
      params: {
        directory: '/Users/gaodong/Desktop/claude-prompt/src'
      },
      result: {
        files: [
          '/Users/gaodong/Desktop/claude-prompt/src/ui',
          '/Users/gaodong/Desktop/claude-prompt/src/tests',
          '/Users/gaodong/Desktop/claude-prompt/src/components',
          '/Users/gaodong/Desktop/claude-prompt/src/app.py',
          '/Users/gaodong/Desktop/claude-prompt/src/main.ts',
          '/Users/gaodong/Desktop/claude-prompt/src/utils.ts',
          '/Users/gaodong/Desktop/claude-prompt/src/config.json',
          '/Users/gaodong/Desktop/claude-prompt/src/README.md'
        ]
      }
    },
    {
      tool: 'Read',
      params: {
        file_path: '/Users/gaodong/Desktop/claude-prompt/package.json'
      },
      result: {
        content: '{\n  "name": "claude-dev-assistant",\n  "version": "0.1.0",\n  "private": true,\n  "scripts": {\n    "dev": "next dev",\n    "build": "next build",\n    "start": "next start",\n    "lint": "eslint ."\n  },\n  "dependencies": {\n    "react": "^18.2.0",\n    "next": "^14.0.0"\n  }\n}'
      }
    },
    {
      tool: 'Write',
      params: {
        file_path: '/Users/gaodong/Desktop/claude-prompt/test.txt',
        content: 'Hello World!\nThis is a test file.\n你好，世界！\n这是一个测试文件。'
      },
      result: 'success'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">工具调用展示组件测试</h1>
        <p className="text-gray-600 mb-8">测试类似 Claude CLI 的 diff 和工具输出展示</p>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('diff')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'diff'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            文件 Diff
          </button>
          <button
            onClick={() => setActiveTab('command')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'command'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            命令执行
          </button>
          <button
            onClick={() => setActiveTab('file')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'file'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            文件操作
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          {activeTab === 'diff' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">文件修改 Diff 展示</h2>
              <ToolCallDisplay toolCalls={diffExample} />
            </div>
          )}

          {activeTab === 'command' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">命令执行输出</h2>
              <ToolCallDisplay toolCalls={commandExample} />
            </div>
          )}

          {activeTab === 'file' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">文件读写操作</h2>
              <ToolCallDisplay toolCalls={fileExample} />
            </div>
          )}
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">功能说明</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ 点击标题栏可折叠/展开内容</li>
            <li>✓ Diff 视图显示绿色（新增）和红色（删除）</li>
            <li>✓ 命令输出使用终端风格展示</li>
            <li>✓ 文件操作显示成功/失败状态</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
