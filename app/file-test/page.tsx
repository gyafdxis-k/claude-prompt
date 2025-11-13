'use client';

import { useState } from 'react';
import { useFileService } from '@/lib/file-bridge/useFileService';

export default function FileTestPage() {
  const { status, readFile, writeFile, listFiles } = useFileService();
  const [filePath, setFilePath] = useState('/Users/gaodong/Desktop/claude-prompt/README.md');
  const [fileContent, setFileContent] = useState('');
  const [files, setFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleReadFile = async () => {
    setLoading(true);
    setError('');
    try {
      const content = await readFile(filePath);
      setFileContent(content);
    } catch (err) {
      setError(err instanceof Error ? err.message : '读取失败');
    } finally {
      setLoading(false);
    }
  };

  const handleListFiles = async () => {
    setLoading(true);
    setError('');
    try {
      const fileList = await listFiles('/Users/gaodong/Desktop/claude-prompt', '*.md');
      setFiles(fileList);
    } catch (err) {
      setError(err instanceof Error ? err.message : '列出文件失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">文件服务测试</h1>
        
        {/* 连接状态 */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">连接状态</h2>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${status.connected ? 'bg-green-500' : status.connecting ? 'bg-yellow-500' : 'bg-red-500'}`} />
            <span>
              {status.connected ? '已连接' : status.connecting ? '连接中...' : '未连接'}
            </span>
            {status.error && (
              <span className="text-red-600 text-sm">错误: {status.error}</span>
            )}
          </div>
        </div>

        {/* 读取文件 */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">读取文件</h2>
          <div className="space-y-3">
            <input
              type="text"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              placeholder="文件路径"
            />
            <button
              onClick={handleReadFile}
              disabled={!status.connected || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? '读取中...' : '读取文件'}
            </button>
            
            {fileContent && (
              <div className="mt-3">
                <h3 className="font-medium mb-2">文件内容:</h3>
                <pre className="p-3 bg-gray-100 rounded text-sm overflow-auto max-h-96">
                  {fileContent}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* 列出文件 */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-3">列出文件</h2>
          <button
            onClick={handleListFiles}
            disabled={!status.connected || loading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
          >
            {loading ? '加载中...' : '列出 Markdown 文件'}
          </button>
          
          {files.length > 0 && (
            <div className="mt-3">
              <h3 className="font-medium mb-2">找到 {files.length} 个文件:</h3>
              <ul className="space-y-1">
                {files.map((file, i) => (
                  <li key={i} className="text-sm text-gray-700">📄 {file}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* 错误信息 */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            ❌ {error}
          </div>
        )}

        {/* 使用说明 */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">📝 使用说明</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>确保本地文件服务器正在运行: <code className="bg-white px-1 rounded">npm run server 8765</code></li>
            <li>页面加载时会自动连接到 ws://localhost:8765</li>
            <li>连接成功后即可进行文件操作</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
