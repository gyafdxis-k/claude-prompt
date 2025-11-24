'use client';

import { useState, useEffect } from 'react';
import { Workflow, WorkflowStep } from '@/lib/workflows/workflow-templates';
import { PromptTemplate } from '@/lib/prompts/prompt-scanner';

interface WorkflowEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (workflow: Workflow) => void;
  onSaveAndUse?: (workflow: Workflow) => void;
  editingWorkflow?: Workflow;
}

export default function WorkflowEditor({ isOpen, onClose, onSave, onSaveAndUse, editingWorkflow }: WorkflowEditorProps) {
  const [name, setName] = useState(editingWorkflow?.name || '');
  const [description, setDescription] = useState(editingWorkflow?.description || '');
  const [icon, setIcon] = useState(editingWorkflow?.icon || '📝');
  const [steps, setSteps] = useState<WorkflowStep[]>(editingWorkflow?.steps || []);
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [showPromptPicker, setShowPromptPicker] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number | null>(null);
  const [selectedPromptPreview, setSelectedPromptPreview] = useState<PromptTemplate | null>(null);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [previewTab, setPreviewTab] = useState<'content' | 'preview'>('content');
  const [previewParams, setPreviewParams] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      loadPrompts();
    }
  }, [isOpen]);

  const loadPrompts = async () => {
    setIsLoadingPrompts(true);
    setLoadError(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch('/api/prompts/scan', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      if (data.prompts) {
        setPrompts(data.prompts);
      } else if (data.error) {
        setLoadError(data.error);
      }
    } catch (error: any) {
      console.error('加载 prompt 失败:', error);
      if (error.name === 'AbortError') {
        setLoadError('加载超时，请重试');
      } else {
        setLoadError('加载失败: ' + (error.message || '未知错误'));
      }
    } finally {
      setIsLoadingPrompts(false);
    }
  };

  if (!isOpen) return null;

  const addStep = () => {
    const newStep: WorkflowStep = {
      id: `step-${Date.now()}`,
      name: '新步骤',
      prompt: '请输入 prompt 内容...'
    };
    setSteps([...steps, newStep]);
  };

  const updateStep = (index: number, field: keyof WorkflowStep, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const moveStep = (fromIndex: number, toIndex: number) => {
    const newSteps = [...steps];
    const [movedStep] = newSteps.splice(fromIndex, 1);
    newSteps.splice(toIndex, 0, movedStep);
    setSteps(newSteps);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      moveStep(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  };

  const detectParameters = (content: string): string[] => {
    const patterns = [
      /\$\{([^}]+)\}/g,
      /\{\{([^}]+)\}\}/g,
      /<([^>]+)>/g,
      /\[([^\]]+)\]/g
    ];
    const params = new Set<string>();
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const param = match[1].trim();
        if (param && !param.includes(' ') && param.length < 50) {
          params.add(param);
        }
      }
    });
    return Array.from(params);
  };

  const categories = Array.from(new Set(prompts.map(p => p.category))).sort();
  
  const filteredPrompts = prompts.filter(p => {
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSave = (useImmediately: boolean = false) => {
    if (!name.trim() || steps.length === 0) {
      alert('请填写工作流名称并至少添加一个步骤');
      return;
    }

    const workflow: Workflow = {
      id: editingWorkflow?.id || `custom-${Date.now()}`,
      name,
      description,
      icon,
      steps,
      config: {}
    };

    if (useImmediately && onSaveAndUse) {
      onSaveAndUse(workflow);
    } else {
      onSave(workflow);
    }
    onClose();
  };

  return (
    <div className="fixed top-0 right-0 w-2/3 h-full bg-white shadow-2xl z-50 flex flex-col border-l-2 border-gray-300">
      <div className="bg-white rounded-lg w-full h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">
            {editingWorkflow ? '编辑工作流' : '创建新工作流'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">工作流名称 *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="例如: 代码审查流程"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">描述</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="简短描述这个工作流的用途..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">图标 Emoji</label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-20 px-3 py-2 border border-gray-300 rounded-md text-center text-2xl"
                placeholder="📝"
                maxLength={2}
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">工作流步骤</h3>
              <button
                onClick={addStep}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                ➕ 添加步骤
              </button>
            </div>

            <div className="space-y-4">
              {steps.map((step, index) => (
                <div 
                  key={step.id} 
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`border rounded-lg p-4 transition-all cursor-move ${
                    draggedIndex === index ? 'bg-blue-100 border-blue-500 opacity-50' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 cursor-move">☰</span>
                      <span className="font-medium text-sm text-gray-600">步骤 {index + 1}</span>
                    </div>
                    <button
                      onClick={() => removeStep(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      🗑️ 删除
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">步骤名称</label>
                      <input
                        type="text"
                        value={step.name}
                        onChange={(e) => updateStep(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="例如: 分析代码"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-sm font-medium">Prompt 模板</label>
                        <button
                          onClick={() => {
                            setCurrentStepIndex(index);
                            setShowPromptPicker(true);
                          }}
                          className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 shadow-sm"
                          style={{ backgroundColor: '#9333ea' }}
                        >
                          📚 从库中选择
                        </button>
                      </div>
                      <textarea
                        value={step.prompt}
                        onChange={(e) => updateStep(index, 'prompt', e.target.value)}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
                        placeholder="输入 prompt 内容，可以使用变量: {{variable}}"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        💡 支持变量: {'{{'} requirement {'}}'}, {'{{'} previous_output {'}}'}, {'{{'} project_path {'}}'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {steps.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <p>还没有步骤，点击上方按钮添加第一个步骤</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            取消
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => handleSave(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              {editingWorkflow ? '💾 保存修改' : '💾 仅保存'}
            </button>
            {onSaveAndUse && (
              <button
                onClick={() => handleSave(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 shadow-lg"
              >
                {editingWorkflow ? '🚀 保存并使用' : '🚀 保存并立即使用'}
              </button>
            )}
          </div>
        </div>
      </div>

      {showPromptPicker && currentStepIndex !== null && (
        <div className="fixed inset-0 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">选择 Prompt 模板</h3>
                <button
                  onClick={() => {
                    setShowPromptPicker(false);
                    setCurrentStepIndex(null);
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 搜索模板名称或描述..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  全部 ({prompts.length})
                </button>
                {categories.map(cat => {
                  const count = prompts.filter(p => p.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 text-xs rounded transition-colors ${
                        selectedCategory === cat
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>
              
              <div className="text-xs text-gray-500">
                找到 {filteredPrompts.length} 个模板
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden flex">
              <div className="w-1/2 overflow-y-auto p-4 border-r">
                {isLoadingPrompts ? (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center">
                      <div className="text-2xl mb-2">⏳</div>
                      <div className="text-sm">加载模板中...</div>
                    </div>
                  </div>
                ) : loadError ? (
                  <div className="flex items-center justify-center h-full text-red-500">
                    <div className="text-center">
                      <div className="text-2xl mb-2">⚠️</div>
                      <div className="text-sm">{loadError}</div>
                      <button
                        onClick={loadPrompts}
                        className="mt-3 px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                      >
                        重试
                      </button>
                    </div>
                  </div>
                ) : filteredPrompts.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center">
                      <div className="text-2xl mb-2">📭</div>
                      <div className="text-sm">没有找到匹配的模板</div>
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory('all');
                        }}
                        className="mt-3 px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs hover:bg-gray-300"
                      >
                        清除筛选
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredPrompts.map((prompt) => (
                    <div
                      key={prompt.id}
                      onClick={() => setSelectedPromptPreview(prompt)}
                      className={`p-3 border rounded-lg hover:border-purple-500 hover:bg-purple-50 cursor-pointer transition-all ${
                        selectedPromptPreview?.id === prompt.id ? 'border-purple-500 bg-purple-50' : ''
                      }`}
                    >
                      <div className="font-bold text-sm mb-1">{prompt.name}</div>
                      <div className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {prompt.description}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                          {prompt.category}
                        </span>
                        {prompt.parameters.length > 0 && (
                          <span className="text-xs text-purple-600">
                            {prompt.parameters.length} 参数
                          </span>
                        )}
                      </div>
                    </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="w-1/2 overflow-y-auto p-4 bg-gray-50">
                {selectedPromptPreview ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-sm mb-2">模板预览</h4>
                      <div className="text-xs text-gray-600 mb-3">{selectedPromptPreview.description}</div>
                      <div className="flex gap-2 flex-wrap">
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                          📁 {selectedPromptPreview.category}
                        </span>
                        {selectedPromptPreview.parameters.length > 0 && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            🔧 {selectedPromptPreview.parameters.length} 个参数
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 border-b">
                      <button
                        onClick={() => setPreviewTab('content')}
                        className={`px-3 py-2 text-xs font-medium transition-colors ${
                          previewTab === 'content'
                            ? 'text-purple-600 border-b-2 border-purple-600'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        📝 Prompt 内容
                      </button>
                      <button
                        onClick={() => setPreviewTab('preview')}
                        className={`px-3 py-2 text-xs font-medium transition-colors ${
                          previewTab === 'preview'
                            ? 'text-purple-600 border-b-2 border-purple-600'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        🔍 预览效果
                      </button>
                    </div>
                    
                    {previewTab === 'content' ? (
                      <div>
                        <h5 className="font-semibold text-xs text-gray-700 mb-2">Prompt 内容：</h5>
                        <pre className="text-xs bg-white border rounded-lg p-3 overflow-x-auto whitespace-pre-wrap font-mono max-h-64">
                          {selectedPromptPreview.content}
                        </pre>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs">
                          <div className="font-semibold text-blue-900 mb-2">💡 填写参数预览最终效果</div>
                          <div className="text-blue-800">输入测试数据查看变量替换后的实际 Prompt</div>
                        </div>
                        {(() => {
                          const autoDetected = detectParameters(selectedPromptPreview.content);
                          const allParams = [...new Set([...selectedPromptPreview.parameters.map(p => p.name), ...autoDetected])];
                          
                          // 智能参数元数据
                          const getParameterMetadata = (paramName: string) => {
                            const paramDef = selectedPromptPreview.parameters.find(p => p.name === paramName);
                            
                            // 预定义的常见参数
                            const commonParams: Record<string, { description: string; example: string; multiline?: boolean }> = {
                              requirement: { 
                                description: '需求描述或任务说明', 
                                example: '实现用户登录功能，支持邮箱和手机号登录',
                                multiline: true
                              },
                              code: { 
                                description: '待处理的代码片段', 
                                example: 'function add(a, b) { return a + b; }',
                                multiline: true
                              },
                              file_path: { 
                                description: '文件路径', 
                                example: 'app/page.tsx' 
                              },
                              project_name: { 
                                description: '项目名称', 
                                example: 'my-awesome-app' 
                              },
                              bug_description: { 
                                description: 'Bug 描述', 
                                example: '用户点击提交按钮时页面崩溃',
                                multiline: true
                              },
                              related_files: { 
                                description: '相关文件列表（每行一个）', 
                                example: 'lib/api.ts\ncomponents/Form.tsx',
                                multiline: true
                              },
                              module_name: { 
                                description: '模块名称', 
                                example: 'UserAuthService' 
                              },
                              refactoring_goal: { 
                                description: '重构目标', 
                                example: '提高代码可读性，减少重复代码',
                                multiline: true
                              }
                            };
                            
                            const metadata = commonParams[paramName] || {
                              description: paramDef?.description || `${paramName} 参数`,
                              example: `示例 ${paramName}`,
                              multiline: paramName.includes('description') || paramName.includes('content')
                            };
                            
                            return {
                              ...metadata,
                              required: paramDef?.required || false,
                              type: paramDef?.type || 'string'
                            };
                          };
                          
                          return allParams.length > 0 && (
                            <div className="space-y-3">
                              {allParams.map((paramName) => {
                                const meta = getParameterMetadata(paramName);
                                return (
                                  <div key={paramName} className="bg-white border border-gray-200 rounded-lg p-3 hover:border-purple-300 transition-colors">
                                    <div className="flex items-start justify-between mb-1.5">
                                      <label className="block text-xs font-semibold text-gray-800">
                                        {paramName}
                                        {meta.required && <span className="text-red-500 ml-1">*</span>}
                                      </label>
                                      {!selectedPromptPreview.parameters.find(p => p.name === paramName) && (
                                        <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                                          自动检测
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs text-gray-500 mb-2">{meta.description}</div>
                                    {meta.multiline ? (
                                      <textarea
                                        value={previewParams[paramName] || ''}
                                        onChange={(e) => setPreviewParams({...previewParams, [paramName]: e.target.value})}
                                        rows={3}
                                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        placeholder={meta.example}
                                      />
                                    ) : (
                                      <input
                                        type="text"
                                        value={previewParams[paramName] || ''}
                                        onChange={(e) => setPreviewParams({...previewParams, [paramName]: e.target.value})}
                                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        placeholder={meta.example}
                                      />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                        <div>
                          <h5 className="font-semibold text-xs text-gray-700 mb-2">预览结果：</h5>
                          <pre className="text-xs bg-white border rounded-lg p-3 overflow-x-auto whitespace-pre-wrap font-mono max-h-64">
                            {(() => {
                              let preview = selectedPromptPreview.content;
                              Object.entries(previewParams).forEach(([key, value]) => {
                                const patterns = [
                                  new RegExp(`\\$\\{${key}\\}`, 'g'),
                                  new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
                                  new RegExp(`<${key}>`, 'g'),
                                  new RegExp(`\\[${key}\\]`, 'g')
                                ];
                                patterns.forEach(pattern => {
                                  preview = preview.replace(pattern, value || `[${key}]`);
                                });
                              });
                              return preview;
                            })()}
                          </pre>
                        </div>
                      </div>
                    )}
                    {previewTab === 'content' && (() => {
                      const autoDetected = detectParameters(selectedPromptPreview.content);
                      const allParams = [...new Set([...selectedPromptPreview.parameters.map(p => p.name), ...autoDetected])];
                      return allParams.length > 0 && (
                        <div>
                          <h5 className="font-semibold text-xs text-gray-700 mb-2">🔧 需要的参数：</h5>
                          <div className="space-y-2">
                            {allParams.map((paramName) => {
                              const paramDef = selectedPromptPreview.parameters.find(p => p.name === paramName);
                              return (
                                <div key={paramName} className="text-xs bg-white border rounded px-3 py-2">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-mono text-purple-600 font-semibold">{paramName}</span>
                                    {!paramDef && (
                                      <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                                        自动检测
                                      </span>
                                    )}
                                  </div>
                                  {paramDef?.description && (
                                    <div className="text-gray-600">{paramDef.description}</div>
                                  )}
                                  {paramDef?.required && (
                                    <div className="text-red-600 mt-1">⚠️ 必需参数</div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-xs">
                            <div className="font-semibold text-blue-900 mb-1">💡 参数使用说明：</div>
                            <div className="text-blue-800 space-y-1">
                              <div>• 执行时会提示输入这些参数</div>
                              <div>• 可使用变量: <code className="bg-blue-100 px-1 rounded">previous_output</code>, <code className="bg-blue-100 px-1 rounded">project_path</code></div>
                              <div>• 支持引用前面步骤的输出</div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (currentStepIndex !== null) {
                            updateStep(currentStepIndex, 'prompt', selectedPromptPreview.content);
                            updateStep(currentStepIndex, 'name', selectedPromptPreview.name);
                            setShowPromptPicker(false);
                            setCurrentStepIndex(null);
                            setSelectedPromptPreview(null);
                            setPreviewParams({});
                          }
                        }}
                        className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium"
                        style={{ backgroundColor: '#9333ea' }}
                      >
                        ✓ 使用此模板
                      </button>
                      <button
                        onClick={() => {
                          const newStep: WorkflowStep = {
                            id: `step-${Date.now()}`,
                            name: selectedPromptPreview.name,
                            prompt: selectedPromptPreview.content,
                            requiresApproval: false
                          };
                          setSteps([...steps, newStep]);
                          setShowPromptPicker(false);
                          setCurrentStepIndex(null);
                          setSelectedPromptPreview(null);
                          setPreviewParams({});
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                        title="将此模板添加为工作流的新步骤"
                      >
                        ➕ 添加为新步骤
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                    ← 点击左侧模板查看详情
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
