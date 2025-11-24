'use client';

import { useState, useEffect } from 'react';
import { ExecutionHistory, getExecutionHistory, deleteExecutionHistory, searchExecutionHistory, exportHistoryToMarkdown } from '@/lib/execution-history';
import MarkdownRenderer from './MarkdownRenderer';

interface ExecutionHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadHistory: (history: ExecutionHistory) => void;
  onSaveAsWorkflow?: (history: ExecutionHistory) => void;
}

export default function ExecutionHistoryPanel({ isOpen, onClose, onLoadHistory, onSaveAsWorkflow }: ExecutionHistoryPanelProps) {
  const [histories, setHistories] = useState<ExecutionHistory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHistory, setSelectedHistory] = useState<ExecutionHistory | null>(null);
  const [filter, setFilter] = useState<'all' | 'completed' | 'failed'>('all');

  useEffect(() => {
    if (isOpen) {
      loadHistories();
    }
  }, [isOpen]);

  const loadHistories = () => {
    const all = getExecutionHistory();
    setHistories(all);
  };

  const filteredHistories = histories.filter(h => {
    if (filter !== 'all' && h.status !== filter) return false;
    if (searchQuery) {
      return searchExecutionHistory(searchQuery).some(sh => sh.id === h.id);
    }
    return true;
  });

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这条执行历史吗？')) {
      deleteExecutionHistory(id);
      loadHistories();
      if (selectedHistory?.id === id) {
        setSelectedHistory(null);
      }
    }
  };

  const handleExport = (history: ExecutionHistory, e: React.MouseEvent) => {
    e.stopPropagation();
    const markdown = exportHistoryToMarkdown(history);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${history.workflowName}-${new Date(history.startTime).toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      default:
        return '⏳';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg w-full max-w-7xl h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">📜 执行历史</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-4 border-b space-y-3">
          <div className="flex gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索历史记录..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={loadHistories}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              🔄 刷新
            </button>
          </div>

          <div className="flex gap-2">
            {['all', 'completed', 'failed'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {f === 'all' ? '全部' : f === 'completed' ? '已完成' : '失败'}
              </button>
            ))}
            <span className="text-sm text-gray-600 ml-auto self-center">
              共 {filteredHistories.length} 条记录
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex">
          <div className="w-1/3 overflow-y-auto border-r">
            {filteredHistories.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <div className="text-4xl mb-2">📭</div>
                  <div className="text-sm">暂无执行历史</div>
                </div>
              </div>
            ) : (
              <div className="divide-y">
                {filteredHistories.map((history) => (
                  <div
                    key={history.id}
                    onClick={() => setSelectedHistory(history)}
                    className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                      selectedHistory?.id === history.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm px-2 py-0.5 rounded ${getStatusColor(history.status)}`}>
                            {getStatusIcon(history.status)}
                          </span>
                          <span className="font-semibold text-sm truncate">
                            {history.workflowName}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 truncate">
                          📁 {history.projectPath.split('/').slice(-2).join('/')}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => handleExport(history, e)}
                          className="p-1 text-xs text-gray-400 hover:text-blue-600 transition-colors"
                          title="导出为 Markdown"
                        >
                          📤
                        </button>
                        <button
                          onClick={(e) => handleDelete(history.id, e)}
                          className="p-1 text-xs text-gray-400 hover:text-red-600 transition-colors"
                          title="删除"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 space-y-0.5">
                      <div>🕐 {new Date(history.startTime).toLocaleString('zh-CN')}</div>
                      {history.endTime && (
                        <div>
                          ⏱️ 耗时 {Math.round((history.endTime - history.startTime) / 1000)}秒
                        </div>
                      )}
                      <div>
                        📝 {history.outputs.length} 步骤 · {history.outputs.reduce((sum, o) => sum + o.conversations.length, 0)} 轮对话
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            {selectedHistory ? (
              <div className="space-y-6">
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="text-2xl font-bold mb-4">{selectedHistory.workflowName}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600 mb-1">项目路径</div>
                      <div className="font-mono text-xs">{selectedHistory.projectPath}</div>
                    </div>
                    <div>
                      <div className="text-gray-600 mb-1">状态</div>
                      <div className={`inline-block px-3 py-1 rounded ${getStatusColor(selectedHistory.status)}`}>
                        {getStatusIcon(selectedHistory.status)} {selectedHistory.status}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600 mb-1">开始时间</div>
                      <div>{new Date(selectedHistory.startTime).toLocaleString('zh-CN')}</div>
                    </div>
                    {selectedHistory.endTime && (
                      <div>
                        <div className="text-gray-600 mb-1">结束时间</div>
                        <div>{new Date(selectedHistory.endTime).toLocaleString('zh-CN')}</div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => onLoadHistory(selectedHistory)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      🔄 恢复此执行
                    </button>
                    {onSaveAsWorkflow && (
                      <button
                        onClick={() => onSaveAsWorkflow(selectedHistory)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                        title="基于此历史创建新工作流"
                      >
                        📦 另存为工作流
                      </button>
                    )}
                    <button
                      onClick={(e) => handleExport(selectedHistory, e)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                    >
                      📤 导出 Markdown
                    </button>
                  </div>
                </div>

                {selectedHistory.outputs.map((output, stepIndex) => (
                  <div key={output.stepId} className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                        {stepIndex + 1}
                      </div>
                      <h4 className="text-lg font-bold">{output.stepName}</h4>
                      {output.completed && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          ✓ 已完成
                        </span>
                      )}
                    </div>

                    {output.conversations.length === 0 ? (
                      <div className="text-gray-400 text-sm">未执行</div>
                    ) : (
                      <div className="space-y-4">
                        {output.conversations.map((conv, convIndex) => (
                          <div key={convIndex} className="border-l-4 border-blue-200 pl-4">
                            <div className="text-xs text-gray-500 mb-2">
                              对话 {convIndex + 1} · {new Date(conv.timestamp).toLocaleTimeString('zh-CN')}
                            </div>

                            {conv.userInput && conv.userInput.trim() && (
                              <div className="mb-3">
                                <div className="text-xs font-semibold text-gray-600 mb-1">用户输入</div>
                                <div className="bg-blue-50 rounded p-3 text-sm whitespace-pre-wrap">
                                  {conv.userInput}
                                </div>
                              </div>
                            )}

                            <div>
                              <div className="text-xs font-semibold text-gray-600 mb-1">AI 回复</div>
                              <div className="bg-gray-50 rounded p-3">
                                <MarkdownRenderer content={conv.response} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <div className="text-4xl mb-2">👈</div>
                  <div className="text-sm">选择一条历史记录查看详情</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
