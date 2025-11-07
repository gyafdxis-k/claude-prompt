'use client';

import { useState, useEffect } from 'react';
import { Workflow, WorkflowStep } from '@/lib/workflows/workflow-templates';
import { PromptTemplate } from '@/lib/prompts/prompt-scanner';

interface WorkflowEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (workflow: Workflow) => void;
  editingWorkflow?: Workflow;
}

export default function WorkflowEditor({ isOpen, onClose, onSave, editingWorkflow }: WorkflowEditorProps) {
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

  const handleSave = () => {
    if (!name.trim() || steps.length === 0) {
      alert('请填写工作流名称并至少添加一个步骤');
      return;
    }

    const workflow: Workflow = {
      id: editingWorkflow?.id || `custom-${Date.now()}`,
      name,
      description,
      icon,
      steps
    };

    onSave(workflow);
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
                <div key={step.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-sm text-gray-600">步骤 {index + 1}</span>
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

        <div className="p-4 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {editingWorkflow ? '保存修改' : '创建工作流'}
          </button>
        </div>
      </div>

      {showPromptPicker && currentStepIndex !== null && (
        <div className="fixed inset-0 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold">选择 Prompt 模板</h3>
              <button
                onClick={() => {
                  setShowPromptPicker(false);
                  setCurrentStepIndex(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
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
                ) : prompts.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center">
                      <div className="text-2xl mb-2">📭</div>
                      <div className="text-sm">没有找到模板</div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {prompts.map((prompt) => (
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
                    </div>
                    <div>
                      <h5 className="font-semibold text-xs text-gray-700 mb-2">Prompt 内容：</h5>
                      <pre className="text-xs bg-white border rounded-lg p-3 overflow-x-auto whitespace-pre-wrap font-mono">
                        {selectedPromptPreview.content}
                      </pre>
                    </div>
                    {selectedPromptPreview.parameters.length > 0 && (
                      <div>
                        <h5 className="font-semibold text-xs text-gray-700 mb-2">参数：</h5>
                        <div className="space-y-1">
                          {selectedPromptPreview.parameters.map((param) => (
                            <div key={param.name} className="text-xs bg-white border rounded px-2 py-1">
                              <span className="font-mono text-purple-600">{param.name}</span>
                              {param.description && (
                                <span className="text-gray-600 ml-2">- {param.description}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        if (currentStepIndex !== null) {
                          updateStep(currentStepIndex, 'prompt', selectedPromptPreview.content);
                          updateStep(currentStepIndex, 'name', selectedPromptPreview.name);
                          setShowPromptPicker(false);
                          setCurrentStepIndex(null);
                          setSelectedPromptPreview(null);
                        }
                      }}
                      className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium"
                      style={{ backgroundColor: '#9333ea' }}
                    >
                      使用此模板
                    </button>
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
