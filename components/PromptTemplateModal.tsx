'use client';

import { useState, useEffect } from 'react';
import { PromptTemplate } from '@/lib/prompts/prompt-scanner';

interface PromptTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: PromptTemplate, parameters: Record<string, any>, additionalText: string) => void;
  currentPrompt?: string;
}

export default function PromptTemplateModal({ isOpen, onClose, onSelectTemplate, currentPrompt }: PromptTemplateModalProps) {
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [additionalText, setAdditionalText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'raw' | 'rendered'>('raw');

  useEffect(() => {
    if (isOpen) {
      loadPrompts();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleStorageChange = () => {
      if (isOpen) {
        loadPrompts();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('promptsUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('promptsUpdated', handleStorageChange);
    };
  }, [isOpen]);

  const loadPrompts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/prompts/scan');
      const data = await response.json();
      if (data.prompts) {
        setPrompts(data.prompts);
      }
    } catch (error) {
      console.error('加载 prompt 失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPrompts = prompts.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectTemplate = (template: PromptTemplate) => {
    setSelectedTemplate(template);
    const initParams: Record<string, any> = {};
    template.parameters.forEach(param => {
      initParams[param.name] = '';
    });
    setParameters(initParams);
  };

  const renderPrompt = (): string => {
    if (!selectedTemplate) return '';

    let rendered = selectedTemplate.content;

    for (const [key, value] of Object.entries(parameters)) {
      if (value) {
        const patterns = [
          new RegExp(`\\$\\{${key}\\}`, 'g'),
          new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
          new RegExp(`<${key}>`, 'g'),
          new RegExp(`\\[${key}\\]`, 'g')
        ];

        for (const pattern of patterns) {
          rendered = rendered.replace(pattern, String(value));
        }
      }
    }

    rendered = rendered.replace(/\$\{cwd\}/g, '/Users/gaodong/Desktop/claude_prompt/claude-dev-assistant');
    rendered = rendered.replace(/\{\{cwd\}\}/g, '/Users/gaodong/Desktop/claude_prompt/claude-dev-assistant');

    if (additionalText) {
      rendered += '\n\n---\n\n' + additionalText;
    }

    return rendered;
  };

  const handleConfirm = () => {
    if (!selectedTemplate) {
      alert('请先选择一个 Prompt 模板');
      return;
    }

    const requiredParams = selectedTemplate.parameters.filter(p => p.required);
    const missingParams = requiredParams.filter(p => !parameters[p.name] || parameters[p.name].toString().trim() === '');
    
    if (missingParams.length > 0) {
      alert(`请填写必填参数: ${missingParams.map(p => p.name).join(', ')}`);
      return;
    }

    onSelectTemplate(selectedTemplate, parameters, additionalText);
    onClose();
  };

  const handleDelete = async (template: PromptTemplate) => {
    if (template.source !== 'custom') {
      alert('只能删除自定义模板');
      return;
    }

    if (!confirm(`确定要删除模板 "${template.name}" 吗？`)) {
      return;
    }

    try {
      const response = await fetch('/api/prompts/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: template.id, name: template.name, source: template.source })
      });

      if (response.ok) {
        alert('删除成功');
        window.dispatchEvent(new Event('promptsUpdated'));
        loadPrompts();
        if (selectedTemplate?.id === template.id) {
          setSelectedTemplate(null);
        }
      } else {
        alert('删除失败');
      }
    } catch (error) {
      console.error('删除模板失败:', error);
      alert('删除失败');
    }
  };

  if (!isOpen) return null;

  const renderedPrompt = renderPrompt();

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-7xl h-5/6 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">📚 选择真实 Prompt 模板</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* 左侧：模板列表 1/4 */}
          <div className="w-1/4 border-r flex flex-col">
            <div className="p-4 border-b bg-gray-50">
              <input
                type="text"
                placeholder="🔍 搜索模板..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <div className="flex items-center justify-between mt-2">
                <div className="text-xs text-gray-600">
                  {filteredPrompts.length} 个模板
                </div>
                <button
                  onClick={loadPrompts}
                  disabled={loading}
                  className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                >
                  🔄 刷新
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {loading ? (
                <div className="text-center py-8 text-gray-500 text-sm">加载中...</div>
              ) : (
                filteredPrompts.map(prompt => (
                  <div
                    key={prompt.id}
                    className={`p-2 border rounded transition-all text-sm ${
                      selectedTemplate?.id === prompt.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div 
                      onClick={() => handleSelectTemplate(prompt)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-bold text-xs">{prompt.name}</div>
                        {prompt.source === 'custom' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(prompt);
                            }}
                            className="text-red-500 hover:text-red-700 text-xs px-1"
                            title="删除模板"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 line-clamp-1 mb-1">
                        {prompt.description}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded">
                          {prompt.category}
                        </span>
                        {prompt.source === 'custom' && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                            自定义
                          </span>
                        )}
                        {prompt.parameters.length > 0 && (
                          <span className="text-xs text-purple-600">
                            {prompt.parameters.length}参数
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 中间：参数填写 1/4 */}
          <div className="w-1/4 border-r flex flex-col overflow-hidden bg-gray-50">
            {selectedTemplate ? (
              <>
                <div className="p-3 border-b bg-white">
                  <h3 className="font-bold text-sm">{selectedTemplate.name}</h3>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{selectedTemplate.description}</p>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {selectedTemplate.parameters.length > 0 && (
                    <>
                      <div className="font-bold text-xs text-gray-800">
                        📝 参数 ({selectedTemplate.parameters.filter(p => p.required).length} 必填)
                      </div>

                      {selectedTemplate.parameters.map(param => (
                        <div key={param.name} className="space-y-1">
                          <label className="block">
                            <div className="flex items-center gap-1 mb-1">
                              <span className="font-medium text-xs text-gray-700">{param.name}</span>
                              {param.required && <span className="text-red-500 text-xs">*</span>}
                              <span className="text-xs bg-purple-100 text-purple-700 px-1 py-0.5 rounded">
                                {param.type}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mb-1">{param.description}</p>
                          </label>

                          {param.type === 'code' ? (
                            <textarea
                              value={parameters[param.name] || ''}
                              onChange={(e) => setParameters({ ...parameters, [param.name]: e.target.value })}
                              rows={4}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder={`输入${param.description}`}
                            />
                          ) : param.type === 'files' ? (
                            <textarea
                              value={parameters[param.name] || ''}
                              onChange={(e) => setParameters({ ...parameters, [param.name]: e.target.value })}
                              rows={3}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="每行一个文件"
                            />
                          ) : param.name.toLowerCase().includes('task') || param.name.toLowerCase().includes('query') ? (
                            <textarea
                              value={parameters[param.name] || ''}
                              onChange={(e) => setParameters({ ...parameters, [param.name]: e.target.value })}
                              rows={3}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder={`输入${param.description}`}
                            />
                          ) : (
                            <input
                              type={param.type === 'number' ? 'number' : 'text'}
                              value={parameters[param.name] || ''}
                              onChange={(e) => setParameters({ ...parameters, [param.name]: e.target.value })}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder={param.description}
                            />
                          )}
                        </div>
                      ))}
                    </>
                  )}

                  <div className="pt-2 border-t">
                    <div className="font-bold text-xs text-gray-800 mb-1">
                      ➕ 追加内容
                    </div>
                    <textarea
                      value={additionalText}
                      onChange={(e) => setAdditionalText(e.target.value)}
                      rows={3}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="追加自定义指令..."
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="text-4xl mb-2">👈</div>
                  <p className="text-sm">选择模板</p>
                </div>
              </div>
            )}
          </div>

          {/* 右侧：Prompt 预览 1/2 */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedTemplate ? (
              <>
                <div className="p-3 border-b bg-white flex items-center justify-between">
                  <h3 className="font-bold text-sm">👁️ Prompt 预览</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewMode('raw')}
                      className={`px-3 py-1 text-xs rounded ${
                        viewMode === 'raw'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      📄 原始
                    </button>
                    <button
                      onClick={() => setViewMode('rendered')}
                      className={`px-3 py-1 text-xs rounded ${
                        viewMode === 'rendered'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      ✨ 渲染后
                    </button>
                    <button
                      onClick={() => {
                        const content = viewMode === 'raw' ? selectedTemplate.content : renderedPrompt;
                        navigator.clipboard.writeText(content);
                        alert('✅ 已复制到剪贴板');
                      }}
                      className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                      📋 复制
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                  <div className="bg-white rounded border border-gray-200 p-4">
                    <pre className="whitespace-pre-wrap font-mono text-xs text-gray-800 leading-relaxed">
                      {viewMode === 'raw' ? selectedTemplate.content : renderedPrompt}
                    </pre>
                  </div>

                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-xs">
                    <div className="font-semibold text-blue-900 mb-2">📊 统计</div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className="text-blue-700">字符:</span>
                        <span className="ml-1 font-mono">
                          {viewMode === 'raw' ? selectedTemplate.content.length : renderedPrompt.length}
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-700">行:</span>
                        <span className="ml-1 font-mono">
                          {(viewMode === 'raw' ? selectedTemplate.content : renderedPrompt).split('\n').length}
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-700">参数:</span>
                        <span className="ml-1 font-mono">
                          {Object.keys(parameters).filter(k => parameters[k]).length} / {selectedTemplate.parameters.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="text-6xl mb-4">📄</div>
                  <p>选择模板后查看 Prompt 预览</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-3 border-t flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedTemplate}
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-400"
          >
            确定使用此 Prompt
          </button>
        </div>
      </div>
    </div>
  );
}
