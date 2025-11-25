'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { workflows, Workflow, WorkflowStep, workflowCategories, getWorkflowsByCategory, duplicateWorkflow } from '@/lib/workflows/workflow-templates';
import { WorkflowExecutionContext, StepOutput } from '@/lib/workflows/workflow-engine';
import { PromptTemplate } from '@/lib/prompts/prompt-scanner';
import PromptTemplateModal from './PromptTemplateModal';
import MarkdownRenderer from './MarkdownRenderer';
import WorkflowEditor from './WorkflowEditor';
import PromptTemplateCreator from './PromptTemplateCreator';
import ToolCallDisplay from './ToolCallDisplay';
import CopyButton from './CopyButton';
import WorkflowProgress from './WorkflowProgress';
import PromptEditorModal from './PromptEditorModal';
import TemplateBindingCard from './TemplateBindingCard';
import { TemplateBinding, renderTemplate } from '@/lib/template-binding';
import { UI_LIMITS } from '@/lib/config/ui';

interface WorkflowPageProps {
  onExecuteStep: (step: WorkflowStep, inputs: Record<string, any>) => Promise<void>;
  onSelectWorkflow: (workflow: Workflow) => void;
  onCompleteStep: (stepId: string) => void;
  context: WorkflowExecutionContext | null;
  isExecuting: boolean;
}

export default function WorkflowPage({ onExecuteStep, onSelectWorkflow, onCompleteStep, context, isExecuting }: WorkflowPageProps) {
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [inputs, setInputs] = useState<Record<string, any>>({});
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  const [isOutputCollapsed, setIsOutputCollapsed] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [templateBinding, setTemplateBinding] = useState<TemplateBinding | null>(null);
  const [selectedConversationIndex, setSelectedConversationIndex] = useState<number>(0);
  const [showOldConversations, setShowOldConversations] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  
  const toggleMessageExpanded = useCallback((messageId: string) => {
    setExpandedMessages(prev => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  }, []);
  
  const shouldShowExpandButton = useCallback((content: string) => {
    return content.length > UI_LIMITS.MESSAGE_EXPAND_THRESHOLD;
  }, []);
  const [showContextModal, setShowContextModal] = useState(false);
  const [selectedOutputIndex, setSelectedOutputIndex] = useState<number | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [customStep, setCustomStep] = useState<WorkflowStep | null>(null);
  const [allWorkflows, setAllWorkflows] = useState<Workflow[]>(workflows);
  const [showWorkflowEditor, setShowWorkflowEditor] = useState(false);
  const [showPromptCreator, setShowPromptCreator] = useState(false);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);
  const [editingStepName, setEditingStepName] = useState('');
  const [fullPromptPreview, setFullPromptPreview] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showWorkflowPreview, setShowWorkflowPreview] = useState(false);
  const [previewWorkflow, setPreviewWorkflow] = useState<Workflow | null>(null);
  const [isTestMode, setIsTestMode] = useState(false);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState('');

  useEffect(() => {
    if (context && context.outputs.length > 0) {
      const completedSteps = context.outputs.filter(o => o.completed).length;
      setCurrentStepIndex(completedSteps);
    }
  }, [context?.outputs]);

  useEffect(() => {
    loadCustomWorkflows();
  }, []);

  const loadCustomWorkflows = async () => {
    try {
      const response = await fetch('/api/workflows/custom');
      const data = await response.json();
      if (data.workflows && data.workflows.length > 0) {
        setAllWorkflows([...workflows, ...data.workflows]);
      }
    } catch (error) {
      console.error('加载自定义工作流失败:', error);
    }
  };

  const currentStep = useMemo(() => {
    return customStep || workflowSteps[currentStepIndex];
  }, [customStep, workflowSteps, currentStepIndex]);

  const currentOutput = useMemo(() => {
    return context?.outputs[currentStepIndex];
  }, [context?.outputs, currentStepIndex]);

  const loadFullPromptPreview = useCallback(async (step: WorkflowStep) => {
    if (!context) return;
    
    try {
      const response = await fetch('/api/workflow/render-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step,
          context: {
            ...context,
            inputs: { ...context.inputs, ...inputs }
          }
        })
      });
      
      const data = await response.json();
      if (data.prompt) {
        setFullPromptPreview(data.prompt);
      }
    } catch (error) {
      console.error('加载 Prompt 预览失败:', error);
    }
  }, [context, inputs]);

  useEffect(() => {
    if (showPromptPreview && currentStep) {
      loadFullPromptPreview(currentStep);
    }
  }, [showPromptPreview, currentStep, loadFullPromptPreview]);

  const handleExecuteStep = async (stepToExecute?: WorkflowStep) => {
    if (!selectedWorkflow || !context) return;
    
    const step = stepToExecute || customStep || workflowSteps[currentStepIndex];
    
    let finalUserInput = userInput;
    if (templateBinding) {
      const renderedTemplate = renderTemplate(templateBinding, {
        project_path: context?.projectPath || '',
        cwd: context?.projectPath || ''
      });
      finalUserInput = renderedTemplate + (userInput ? '\n\n' + userInput : '');
    }
    
    const allInputs = { 
      ...inputs, 
      requirement: finalUserInput,
      continuationInput: finalUserInput 
    };
    await onExecuteStep(step, allInputs);
    setUserInput('');
    setTemplateBinding(null);
    setCustomStep(null);
    setCustomPrompt('');
  };

  const handleCompleteStep = () => {
    if (!context || !selectedWorkflow) return;
    
    const stepToComplete = workflowSteps[currentStepIndex];
    onCompleteStep(stepToComplete.id);
    
    setUserInput('');
    setCustomStep(null);
    setCustomPrompt('');
  };

  useEffect(() => {
    if (context?.outputs) {
      console.log('[WorkflowPage] Context outputs 更新:', context.outputs.map(o => ({
        stepId: o.stepId,
        stepName: o.stepName,
        conversationCount: o.conversations.length,
        completed: o.completed
      })));
      console.log('[WorkflowPage] 当前步骤索引:', currentStepIndex);
      console.log('[WorkflowPage] 当前步骤输出:', currentOutput ? {
        stepId: currentOutput.stepId,
        conversationCount: currentOutput.conversations.length
      } : 'null');
    }
  }, [context?.outputs, currentStepIndex, currentOutput]);

  const displayedWorkflows = useMemo(() => {
    return selectedCategory === 'all' ? allWorkflows : allWorkflows.filter(w => w.category === selectedCategory);
  }, [allWorkflows, selectedCategory]);

  const handleDuplicateWorkflow = async (workflow: Workflow) => {
    const duplicated = duplicateWorkflow(workflow);
    try {
      await fetch('/api/workflows/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicated)
      });
      await loadCustomWorkflows();
    } catch (error) {
      console.error('复制工作流失败:', error);
    }
  };

  return (
    <div className="flex h-full">
      <div className="w-64 border-r border-gray-200 bg-gray-50 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg">工作流</h2>
            <button
              onClick={() => setShowWorkflowEditor(true)}
              className="text-blue-600 hover:text-blue-800 text-xl"
              title="创建工作流"
            >
              ➕
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {workflowCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                title={cat.description}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>
        <div className="p-2">
          {displayedWorkflows.map((workflow) => (
            <div key={workflow.id} className="relative group mb-2">
              <button
                onClick={() => {
                  setSelectedWorkflow(workflow);
                  setWorkflowSteps([...workflow.steps]);
                  setCurrentStepIndex(0);
                  setInputs({});
                  onSelectWorkflow(workflow, isTestMode);
                }}
                className={`w-full text-left p-3 rounded-md transition-colors ${
                  selectedWorkflow?.id === workflow.id
                    ? 'bg-blue-100 text-blue-800'
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{workflow.icon}</span>
                  <span className="font-medium text-sm">{workflow.name}</span>
                </div>
                <p className="text-xs text-gray-600">{workflow.description}</p>
              </button>
              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewWorkflow(workflow);
                    setShowWorkflowPreview(true);
                  }}
                  className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                  title="预览工作流"
                >
                  👁️
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDuplicateWorkflow(workflow);
                  }}
                  className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                  title="复制工作流"
                >
                  📋
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedWorkflow ? (
        <div className="flex-1 flex flex-col">
          <div className="p-3 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedWorkflow.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-bold">{selectedWorkflow.name}</h1>
                    {isTestMode && (
                      <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full border border-orange-300">
                        🧪 测试
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1" title={selectedWorkflow.description}>
                    {selectedWorkflow.description}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTestMode(!isTestMode)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                  isTestMode
                    ? 'bg-orange-100 text-orange-700 border border-orange-300 hover:bg-orange-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                }`}
                title={isTestMode ? '退出测试模式（执行将保存到历史）' : '进入测试模式（执行不保存历史）'}
              >
                {isTestMode ? '🧪 测试中' : '🧪 测试'}
              </button>
            </div>


            <div className="mt-2 flex items-center gap-2 flex-wrap">
              {workflowSteps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className="relative group">
                    {editingStepIndex === index ? (
                      <input
                        type="text"
                        value={editingStepName}
                        onChange={(e) => setEditingStepName(e.target.value)}
                        onBlur={() => {
                          if (editingStepName.trim()) {
                            const newSteps = [...workflowSteps];
                            newSteps[index] = { ...newSteps[index], name: editingStepName };
                            setWorkflowSteps(newSteps);
                          }
                          setEditingStepIndex(null);
                          setEditingStepName('');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (editingStepName.trim()) {
                              const newSteps = [...workflowSteps];
                              newSteps[index] = { ...newSteps[index], name: editingStepName };
                              setWorkflowSteps(newSteps);
                            }
                            setEditingStepIndex(null);
                            setEditingStepName('');
                          } else if (e.key === 'Escape') {
                            setEditingStepIndex(null);
                            setEditingStepName('');
                          }
                        }}
                        autoFocus
                        className="px-3 py-1 rounded-full text-sm border-2 border-blue-500 bg-white focus:outline-none"
                      />
                    ) : (
                      <div
                        onDoubleClick={() => {
                          setEditingStepIndex(index);
                          setEditingStepName(step.name.replace(/^\d+\.\s*/, ''));
                        }}
                        onClick={() => {
                          if (index <= currentStepIndex) {
                            setCurrentStepIndex(index);
                            setUserInput('');
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-all flex items-center gap-1.5 ${
                          index < currentStepIndex
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : index === currentStepIndex
                            ? 'bg-blue-500 text-white font-medium hover:bg-blue-600 shadow-sm'
                            : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                        }`}
                        title="双击编辑名称"
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                          index < currentStepIndex
                            ? 'bg-green-600 text-white'
                            : index === currentStepIndex
                            ? 'bg-white text-blue-500'
                            : 'bg-gray-300 text-gray-600'
                        }`}>
                          {index < currentStepIndex ? '✓' : index + 1}
                        </span>
                        <span>{step.name.replace(/^\d+\.\s*/, '')}</span>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        if (confirm(`确定要删除步骤 "${step.name}" 吗？`)) {
                          const newSteps = workflowSteps.filter((_, i) => i !== index);
                          setWorkflowSteps(newSteps);
                          if (currentStepIndex >= newSteps.length) {
                            setCurrentStepIndex(Math.max(0, newSteps.length - 1));
                          }
                        }
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
                      title="删除步骤"
                    >
                      ×
                    </button>
                    <button
                      onClick={() => {
                        setEditingStepIndex(index);
                        setEditingStepName(step.name.replace(/^\d+\.\s*/, ''));
                      }}
                      className="absolute -top-2 -right-8 bg-blue-500 text-white rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-blue-600"
                      title="编辑名称"
                    >
                      ✎
                    </button>
                  </div>
                  {index < workflowSteps.length - 1 && (
                    <div className="relative group mx-2">
                      <div className="w-12 h-0.5 bg-gray-300" />
                      <button
                        onClick={() => {
                          const newStep: WorkflowStep = {
                            id: `custom-step-${Date.now()}`,
                            name: `步骤 ${index + 2}`,
                            prompt: '请输入此步骤的任务...',
                            requiresApproval: false
                          };
                          const newSteps = [
                            ...workflowSteps.slice(0, index + 1),
                            newStep,
                            ...workflowSteps.slice(index + 1)
                          ];
                          setWorkflowSteps(newSteps);
                        }}
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-purple-500 text-white rounded-full w-4 h-4 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-purple-600"
                        title={`在步骤 ${index + 1} 和 ${index + 2} 之间插入`}
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              ))}
              <button
                onClick={() => {
                  const newStep: WorkflowStep = {
                    id: `custom-step-${Date.now()}`,
                    name: `步骤 ${workflowSteps.length + 1}`,
                    prompt: '请输入此步骤的任务...',
                    requiresApproval: false
                  };
                  setWorkflowSteps([...workflowSteps, newStep]);
                }}
                className="px-3 py-1.5 rounded-lg text-xs bg-purple-100 text-purple-700 hover:bg-purple-200 cursor-pointer transition-colors"
                title="添加新步骤"
              >
                + 步骤
              </button>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            <div className={`flex flex-col overflow-hidden transition-all ${showPromptPreview ? 'w-1/2' : 'flex-1'}`}>
              <div className="flex-1 overflow-y-auto p-6">
                {currentStep && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold">{currentStep.name}</h2>
                      <button
                        onClick={() => {
                          setEditingPrompt(workflowSteps[currentStepIndex]?.prompt || '');
                          setShowPromptEditor(true);
                        }}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        title="编辑此步骤的 Prompt 模板"
                      >
                        ✏️ 编辑 Prompt
                      </button>
                    </div>

                    {!currentOutput && (
                      <div className="space-y-3 mb-4">
                        {/* 模板绑定卡片或自由文本输入 */}
                        {templateBinding ? (
                          <div>
                            <label className="block text-xs font-medium mb-2 text-gray-700">
                              💬 基于模板的输入
                            </label>
                            <TemplateBindingCard
                              binding={templateBinding}
                              onParameterChange={(paramName, value) => {
                                setTemplateBinding({
                                  ...templateBinding,
                                  parameters: {
                                    ...templateBinding.parameters,
                                    [paramName]: value
                                  }
                                });
                              }}
                              onRemove={() => {
                                setTemplateBinding(null);
                                setUserInput('');
                              }}
                              onChangeTemplate={() => {
                                setShowTemplateModal(true);
                              }}
                              additionalContext={{
                                project_path: context?.projectPath || '',
                                cwd: context?.projectPath || ''
                              }}
                              showPreview={true}
                            />
                          </div>
                        ) : (
                          <div>
                            <label className="block text-xs font-medium mb-1 text-gray-700">
                              💬 对话输入
                            </label>
                            <textarea
                              value={userInput}
                              onChange={(e) => setUserInput(e.target.value)}
                              rows={5}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="输入你的要求、问题或描述...（可点击右侧'选择 Prompt'使用模板）"
                            />
                            <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                              <span>💡 提示：点击右侧"选择 Prompt"按钮使用结构化模板，参数可随时编辑</span>
                            </div>
                          </div>
                        )}

                        {currentStepIndex === 0 && (
                          <div>
                            <label className="block text-xs font-medium mb-1 text-gray-700">
                              📁 相关文件（可选）
                            </label>
                            <textarea
                              value={inputs.relatedFilesInput || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                const files = value.split('\n').filter(f => f.trim());
                                setInputs({ 
                                  ...inputs, 
                                  relatedFilesInput: value,
                                  relatedFiles: files 
                                });
                              }}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="每行一个文件路径，例如: app/page.tsx"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {currentOutput && currentOutput.conversations.length > 0 && (
                      <div className="mb-4 space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-sm font-medium text-gray-700">对话历史 ({currentOutput.conversations.length} 轮)</h3>
                          {currentOutput.completed && (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">✓ 已完成</span>
                          )}
                          {currentOutput.conversations.length > UI_LIMITS.CONVERSATION_HISTORY_DISPLAY && (
                            <button
                              onClick={() => setShowOldConversations(!showOldConversations)}
                              className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                            >
                              {showOldConversations ? '隐藏旧对话' : `显示全部 ${currentOutput.conversations.length} 轮`}
                            </button>
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          {currentOutput.conversations
                            .slice(showOldConversations ? 0 : Math.max(0, currentOutput.conversations.length - UI_LIMITS.CONVERSATION_HISTORY_DISPLAY))
                            .map((conv, index) => {
                              const actualIndex = showOldConversations ? index : Math.max(0, currentOutput.conversations.length - UI_LIMITS.CONVERSATION_HISTORY_DISPLAY) + index;
                              return (
                            <div key={actualIndex} className="space-y-3">
                              {conv.userInput && conv.userInput.trim() && (
                                <div className="flex gap-3">
                                  <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-sm shadow-sm">
                                    👤
                                  </div>
                                  <div className="flex-1 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-3 max-w-full overflow-hidden border border-blue-100">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="text-xs text-gray-400 font-medium">
                                        第 {actualIndex + 1} 轮 · {new Date(conv.timestamp).toLocaleTimeString('zh-CN')}
                                      </div>
                                      <div className="flex gap-2">
                                        <CopyButton text={conv.userInput} label="复制" size="sm" />
                                        {shouldShowExpandButton(conv.userInput) && (
                                          <button
                                            onClick={() => toggleMessageExpanded(`user-${actualIndex}`)}
                                            className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 hover:bg-white/50 rounded transition-colors"
                                          >
                                            {expandedMessages.has(`user-${actualIndex}`) ? '收起' : '展开'}
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    <div className={`text-sm text-gray-700 whitespace-pre-wrap ${
                                      expandedMessages.has(`user-${actualIndex}`) ? '' : 'line-clamp-3'
                                    }`}>
                                      {conv.userInput}
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex gap-3">
                                <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-sm shadow-sm">
                                  🤖
                                </div>
                                <div className="flex-1 bg-white rounded-lg p-3 shadow-sm border border-gray-100 max-w-full overflow-hidden">
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="text-xs text-gray-400 font-medium">
                                      第 {actualIndex + 1} 轮 · {new Date(conv.timestamp).toLocaleTimeString('zh-CN')}
                                    </div>
                                    <div className="flex gap-2">
                                      <CopyButton 
                                        text={conv.response} 
                                        label="回复" 
                                        size="sm" 
                                      />
                                      <CopyButton 
                                        text={`**用户**: ${conv.userInput || '(继续对话)'}\n\n**Claude**: ${conv.response}`} 
                                        label="完整对话" 
                                        size="sm" 
                                      />
                                      {shouldShowExpandButton(conv.response) && (
                                        <button
                                          onClick={() => toggleMessageExpanded(`claude-${actualIndex}`)}
                                          className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 hover:bg-gray-50 rounded transition-colors"
                                        >
                                          {expandedMessages.has(`claude-${actualIndex}`) ? '收起' : '展开'}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  {expandedMessages.has(`claude-${actualIndex}`) && (conv as any).toolCalls && (conv as any).toolCalls.length > 0 && (
                                    <div className="mb-4">
                                      <ToolCallDisplay toolCalls={(conv as any).toolCalls} />
                                    </div>
                                  )}
                                  <div className={expandedMessages.has(`claude-${actualIndex}`) ? '' : 'line-clamp-3'}>
                                    <MarkdownRenderer content={conv.response} />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );})}
                        </div>
                        
                        {!currentOutput.completed && (
                          <div className="space-y-3 mt-3">
                            {templateBinding ? (
                              <div>
                                <label className="block text-xs font-medium mb-2 text-gray-700">
                                  💬 基于模板的输入
                                </label>
                                <TemplateBindingCard
                                  binding={templateBinding}
                                  onParameterChange={(paramName, value) => {
                                    setTemplateBinding({
                                      ...templateBinding,
                                      parameters: {
                                        ...templateBinding.parameters,
                                        [paramName]: value
                                      }
                                    });
                                  }}
                                  onRemove={() => {
                                    setTemplateBinding(null);
                                    setUserInput('');
                                  }}
                                  onChangeTemplate={() => {
                                    setShowTemplateModal(true);
                                  }}
                                  additionalContext={{
                                    project_path: context?.projectPath || '',
                                    cwd: context?.projectPath || ''
                                  }}
                                  showPreview={true}
                                />
                              </div>
                            ) : (
                              <div className="flex gap-3">
                                <div className="flex-shrink-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-sm">
                                  👤
                                </div>
                                <div className="flex-1 bg-yellow-50 border border-yellow-300 rounded-lg p-3 max-w-full overflow-hidden">
                                  <label className="block text-xs font-medium mb-1 text-gray-700">
                                    💬 继续对话
                                  </label>
                                  <textarea
                                    value={userInput}
                                    onChange={(e) => setUserInput(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    placeholder="输入补充要求或修改建议，Claude 会基于之前的对话继续回答...\n\n你也可以点击右侧'选择 Prompt'按钮使用模板"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 flex-wrap">
                      {!currentOutput && (
                        <button
                          onClick={() => handleExecuteStep()}
                          disabled={isExecuting}
                          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-wait transition-all"
                        >
                          {isExecuting ? '⏳ 执行中...' : '🚀 开始此步骤'}
                        </button>
                      )}

                      {currentOutput && !currentOutput.completed && (
                        <>
                          <button
                            onClick={() => handleExecuteStep()}
                            disabled={isExecuting}
                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-wait transition-all"
                          >
                            {isExecuting ? '⏳ 执行中...' : '💬 继续对话'}
                          </button>
                          <button
                            onClick={handleCompleteStep}
                            disabled={isExecuting || currentOutput.conversations.length === 0}
                            className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
                          >
                            ✅ 完成此步骤
                          </button>
                        </>
                      )}

                      {currentOutput && currentOutput.completed && currentStepIndex < workflowSteps.length - 1 && (
                        <button
                          onClick={() => {
                            setCurrentStepIndex(currentStepIndex + 1);
                            setCustomStep(null);
                            setCustomPrompt('');
                            setUserInput('');
                            setSelectedConversationIndex(0);
                          }}
                          className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          下一步 →
                        </button>
                      )}

                      {currentStepIndex > 0 && (
                        <button
                          onClick={() => {
                            setCurrentStepIndex(currentStepIndex - 1);
                            setSelectedConversationIndex(0);
                          }}
                          className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                        >
                          ← 上一步
                        </button>
                      )}

                      <button
                        onClick={() => setShowPromptPreview(!showPromptPreview)}
                        className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                      >
                        {showPromptPreview ? '隐藏' : '显示'} Prompt
                      </button>

                      {currentOutput && currentOutput.conversations.length > 0 && (
                        <button
                          onClick={() => {
                            setSelectedOutputIndex(currentStepIndex);
                            setShowContextModal(true);
                          }}
                          className="px-4 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700"
                        >
                          🧠 查看上下文
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {showPromptPreview && currentStep && (
              <div className="w-1/2 border-l border-gray-200 overflow-y-auto p-6 bg-gray-50">
                <h3 className="font-bold mb-4 flex items-center justify-between">
                  <span>Prompt 预览 {customStep && <span className="text-xs text-purple-600 ml-2">(使用自定义模板)</span>}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowTemplateModal(true)}
                      className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                    >
                      📚 选择 Prompt
                    </button>
                    <button
                      onClick={() => setShowPromptCreator(true)}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      ➕ 创建模板
                    </button>
                    {customStep && (
                      <button
                        onClick={() => {
                          setCustomStep(null);
                          setCustomPrompt('');
                        }}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        🔄 重置
                      </button>
                    )}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(fullPromptPreview);
                      }}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      📋 复制
                    </button>
                  </div>
                </h3>
                {(() => {
                  const promptContent = currentStep.prompt;
                  const variables = [
                    ...promptContent.matchAll(/\{\{(\w+)\}\}/g),
                    ...promptContent.matchAll(/\$\{(\w+)\}/g),
                    ...promptContent.matchAll(/<(\w+)>/g),
                    ...promptContent.matchAll(/\[(\w+)\]/g)
                  ].map(match => match[1]);
                  const uniqueVars = [...new Set(variables)];
                  
                  return uniqueVars.length > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-semibold text-xs text-blue-900 mb-2">📊 变量依赖关系</h4>
                      <div className="space-y-1">
                        {uniqueVars.map((varName) => {
                          let source = '未知来源';
                          let icon = '❓';
                          let color = 'text-gray-600';
                          
                          if (varName === 'previous_output' || varName === 'previousOutput') {
                            if (currentStepIndex > 0) {
                              source = `来自「${workflowSteps[currentStepIndex - 1]?.name || '上一步'}」`;
                              icon = '⬅️';
                              color = 'text-green-700';
                            } else {
                              source = '(当前是第一步，无前序输出)';
                              icon = '⚠️';
                              color = 'text-orange-600';
                            }
                          } else if (varName === 'project_path' || varName === 'cwd' || varName === 'projectPath') {
                            source = '来自项目设置';
                            icon = '📁';
                            color = 'text-blue-700';
                          } else if (varName === 'requirement') {
                            source = '来自用户输入';
                            icon = '✏️';
                            color = 'text-purple-700';
                          } else {
                            source = '执行时输入';
                            icon = '💬';
                            color = 'text-gray-700';
                          }
                          
                          return (
                            <div key={varName} className={`text-xs ${color} flex items-start gap-2`}>
                              <span>{icon}</span>
                              <span className="font-mono bg-white px-1 rounded">{varName}</span>
                              <span>← {source}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
                <pre className="text-sm whitespace-pre-wrap font-mono bg-white p-4 rounded border border-gray-300 max-h-[600px] overflow-y-auto">
                  {fullPromptPreview || '加载中...'}
                </pre>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <div className="text-6xl mb-4">👈</div>
            <p className="text-lg">选择一个工作流开始</p>
          </div>
        </div>
      )}

      <PromptTemplateModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        onSelectTemplate={(template: PromptTemplate, parameters: Record<string, any>, additionalText: string) => {
          // 创建模板绑定对象
          const binding: TemplateBinding = {
            id: `binding-${Date.now()}`,
            template,
            parameters,
            createdAt: Date.now()
          };
          
          setTemplateBinding(binding);
          
          // 如果有额外文本，附加到用户输入
          if (additionalText) {
            setUserInput(additionalText);
          } else {
            setUserInput('');
          }
        }}
        currentPrompt={currentStep?.prompt}
      />

      {showContextModal && selectedOutputIndex !== null && context && context.outputs[selectedOutputIndex] && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold">🧠 完整对话上下文 - {context.outputs[selectedOutputIndex].stepName}</h2>
              <button
                onClick={() => setShowContextModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="text-sm text-gray-600 mb-4">
                共 {context.outputs[selectedOutputIndex].conversations.length} 轮对话
              </div>
              
              {context.outputs[selectedOutputIndex].conversations.map((conv, convIndex) => (
                <div key={convIndex} className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-md font-bold text-purple-600">第 {convIndex + 1} 轮对话</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-blue-600">📤 发送给 Claude 的 Prompt</h4>
                      <button
                        onClick={() => navigator.clipboard.writeText(conv.prompt)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        📋 复制 Prompt
                      </button>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <pre className="whitespace-pre-wrap font-mono text-xs text-gray-800 overflow-x-auto max-h-60 overflow-y-auto">
                        {conv.prompt}
                      </pre>
                    </div>
                  </div>

                  <div className="border-t border-gray-300 my-4"></div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-green-600">📥 Claude 的回复</h4>
                      <button
                        onClick={() => navigator.clipboard.writeText(conv.response)}
                        className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                      >
                        📋 复制回复
                      </button>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <MarkdownRenderer content={conv.response} className="prose prose-sm max-w-none" />
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 mt-2">
                    执行时间: {new Date(conv.timestamp).toLocaleString('zh-CN')}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t flex justify-between">
              <div className="flex gap-2">
                {selectedOutputIndex > 0 && (
                  <button
                    onClick={() => setSelectedOutputIndex(selectedOutputIndex - 1)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    ← 上一步
                  </button>
                )}
                {selectedOutputIndex < context.outputs.length - 1 && (
                  <button
                    onClick={() => setSelectedOutputIndex(selectedOutputIndex + 1)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    下一步 →
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowContextModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      <WorkflowEditor
        isOpen={showWorkflowEditor}
        onClose={() => setShowWorkflowEditor(false)}
        onSave={async (workflow) => {
          try {
            await fetch('/api/workflows/custom', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(workflow)
            });
            await loadCustomWorkflows();
            alert('工作流已保存');
          } catch (error) {
            alert('保存失败');
          }
        }}
        onSaveAndUse={async (workflow) => {
          try {
            await fetch('/api/workflows/custom', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(workflow)
            });
            await loadCustomWorkflows();
            setSelectedWorkflow(workflow);
            setWorkflowSteps([...workflow.steps]);
            setCurrentStepIndex(0);
            setInputs({});
            onSelectWorkflow(workflow, isTestMode);
            setShowWorkflowEditor(false);
          } catch (error) {
            alert('保存失败');
          }
        }}
      />

      <PromptTemplateCreator
        isOpen={showPromptCreator}
        onClose={() => setShowPromptCreator(false)}
        onSave={() => {
          alert('模板已保存到 prompts/Custom 文件夹');
          setShowPromptCreator(false);
        }}
      />

      {showWorkflowPreview && previewWorkflow && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{previewWorkflow.icon}</span>
                <div>
                  <h2 className="text-xl font-bold">{previewWorkflow.name}</h2>
                  <p className="text-sm text-gray-600">{previewWorkflow.description}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowWorkflowPreview(false);
                  setPreviewWorkflow(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-4">
                <h3 className="font-bold text-lg mb-2">工作流步骤 ({previewWorkflow.steps.length} 步)</h3>
                <div className="space-y-4">
                  {previewWorkflow.steps.map((step, index) => (
                    <div key={step.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </span>
                        <h4 className="font-bold text-md">{step.name}</h4>
                        {step.requiresApproval && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">需确认</span>
                        )}
                      </div>
                      <div className="bg-white border rounded p-3">
                        <h5 className="text-xs font-semibold text-gray-600 mb-2">Prompt 模板：</h5>
                        <pre className="text-xs whitespace-pre-wrap font-mono text-gray-700 max-h-48 overflow-y-auto">
                          {step.prompt}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {previewWorkflow.config && Object.keys(previewWorkflow.config).length > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <h3 className="font-bold text-lg mb-2">配置选项</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {previewWorkflow.config.includeContext && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-green-600">✓</span>
                        <span>包含上下文</span>
                      </div>
                    )}
                    {previewWorkflow.config.autoCommit && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-green-600">✓</span>
                        <span>自动提交</span>
                      </div>
                    )}
                    {previewWorkflow.config.runTests && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-green-600">✓</span>
                        <span>运行测试</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t flex justify-between">
              <button
                onClick={() => handleDuplicateWorkflow(previewWorkflow)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                📋 复制此工作流
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedWorkflow(previewWorkflow);
                    setWorkflowSteps([...previewWorkflow.steps]);
                    setCurrentStepIndex(0);
                    setInputs({});
                    onSelectWorkflow(previewWorkflow, isTestMode);
                    setShowWorkflowPreview(false);
                    setPreviewWorkflow(null);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  ▶ 使用此工作流
                </button>
                <button
                  onClick={() => {
                    setShowWorkflowPreview(false);
                    setPreviewWorkflow(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <PromptEditorModal
        isOpen={showPromptEditor}
        onClose={() => setShowPromptEditor(false)}
        onSave={(newPrompt) => {
          const updatedSteps = [...workflowSteps];
          updatedSteps[currentStepIndex] = {
            ...updatedSteps[currentStepIndex],
            prompt: newPrompt
          };
          setWorkflowSteps(updatedSteps);
          if (customStep) {
            setCustomStep({
              ...customStep,
              prompt: newPrompt
            });
          }
        }}
        initialPrompt={editingPrompt}
        stepName={currentStep?.name}
        contextData={{
          project_path: context?.projectPath || '',
          cwd: context?.projectPath || '',
          previous_output: currentStepIndex > 0 && context?.outputs[currentStepIndex - 1]
            ? context.outputs[currentStepIndex - 1].conversations[context.outputs[currentStepIndex - 1].conversations.length - 1]?.response || ''
            : ''
        }}
      />
    </div>
  );
}
