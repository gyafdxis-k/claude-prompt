'use client';

import { useState, useEffect } from 'react';
import { workflows, Workflow, WorkflowStep } from '@/lib/workflows/workflow-templates';
import { WorkflowExecutionContext, StepOutput } from '@/lib/workflows/workflow-engine';
import { PromptTemplate } from '@/lib/prompts/prompt-scanner';
import PromptTemplateModal from './PromptTemplateModal';
import MarkdownRenderer from './MarkdownRenderer';
import WorkflowEditor from './WorkflowEditor';
import PromptTemplateCreator from './PromptTemplateCreator';

interface WorkflowPageProps {
  onExecuteStep: (step: WorkflowStep, inputs: Record<string, any>) => Promise<void>;
  onSelectWorkflow: (workflow: Workflow) => void;
  context: WorkflowExecutionContext | null;
  isExecuting: boolean;
}

export default function WorkflowPage({ onExecuteStep, onSelectWorkflow, context, isExecuting }: WorkflowPageProps) {
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [inputs, setInputs] = useState<Record<string, any>>({});
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  const [isOutputCollapsed, setIsOutputCollapsed] = useState(false);
  const [showContextModal, setShowContextModal] = useState(false);
  const [selectedOutputIndex, setSelectedOutputIndex] = useState<number | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [customStep, setCustomStep] = useState<WorkflowStep | null>(null);
  const [allWorkflows, setAllWorkflows] = useState<Workflow[]>(workflows);
  const [showWorkflowEditor, setShowWorkflowEditor] = useState(false);
  const [showPromptCreator, setShowPromptCreator] = useState(false);

  useEffect(() => {
    if (context && context.outputs.length > 0) {
      setCurrentStepIndex(context.outputs.length);
    }
  }, [context?.outputs.length]);

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

  const renderPromptPreview = (step: WorkflowStep | null): string => {
    if (!step || !context) return '';
    if (!step) return '';

    let rendered = step.prompt;
    
    for (const [key, value] of Object.entries(inputs)) {
      rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), String(value || `[${key}]`));
    }

    if (context.outputs.length > 0 && rendered.includes('{{previous_output}}')) {
      const previousOutput = context.outputs[context.outputs.length - 1].response;
      const preview = previousOutput.length > 200 
        ? previousOutput.substring(0, 200) + '...' 
        : previousOutput;
      rendered = rendered.replace(/{{previous_output}}/g, preview);
    }

    rendered = rendered.replace(/{{project_path}}/g, context.projectPath || '[项目路径]');
    rendered = rendered.replace(/{{tech_stack}}/g, context.projectContext?.techStack.join(', ') || '[技术栈]');
    rendered = rendered.replace(/{{test_framework}}/g, context.projectContext?.testFramework || '[测试框架]');
    rendered = rendered.replace(/{{git_diff}}/g, '[Git变更]');
    rendered = rendered.replace(/{{codebase_files}}/g, '[代码库文件]');
    rendered = rendered.replace(/{{all_changes}}/g, '[所有变更]');

    return rendered;
  };

  const handleExecuteStep = async (customStep?: WorkflowStep) => {
    if (!selectedWorkflow || !context) return;
    
    const step = customStep || selectedWorkflow.steps[currentStepIndex];
    await onExecuteStep(step, inputs);
  };

  const currentStep = customStep || selectedWorkflow?.steps[currentStepIndex];
  const currentOutput = context?.outputs[currentStepIndex];

  return (
    <div className="flex h-full">
      <div className="w-64 border-r border-gray-200 bg-gray-50 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-lg">工作流</h2>
            <button
              onClick={() => setShowWorkflowEditor(true)}
              className="text-blue-600 hover:text-blue-800 text-xl"
              title="创建工作流"
            >
              ➕
            </button>
          </div>
        </div>
        <div className="p-2">
          {allWorkflows.map((workflow) => (
            <button
              key={workflow.id}
              onClick={() => {
                setSelectedWorkflow(workflow);
                setCurrentStepIndex(0);
                setInputs({});
                onSelectWorkflow(workflow);
              }}
              className={`w-full text-left p-3 rounded-md mb-2 transition-colors ${
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
          ))}
        </div>
      </div>

      {selectedWorkflow ? (
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <span>{selectedWorkflow.icon}</span>
                  <span>{selectedWorkflow.name}</span>
                </h1>
                <p className="text-sm text-gray-600 mt-1">{selectedWorkflow.description}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              {selectedWorkflow.steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`px-3 py-1 rounded-full text-sm ${
                      index < currentStepIndex
                        ? 'bg-green-100 text-green-800'
                        : index === currentStepIndex
                        ? 'bg-blue-100 text-blue-800 font-medium'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {index + 1}. {step.name}
                  </div>
                  {index < selectedWorkflow.steps.length - 1 && (
                    <div className="w-8 h-0.5 bg-gray-300 mx-1" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6">
                {currentStep && (
                  <div>
                    <h2 className="text-lg font-bold mb-4">{currentStep.name}</h2>

                    {currentStepIndex === 0 && (
                      <div className="space-y-4 mb-6">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            需求描述 <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            value={inputs.requirement || ''}
                            onChange={(e) => setInputs({ ...inputs, requirement: e.target.value })}
                            rows={6}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="详细描述要实现的功能..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">
                            相关文件（可选）
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
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                            placeholder="每行一个文件路径，例如:&#10;app/page.tsx&#10;lib/utils.ts"
                          />
                        </div>
                      </div>
                    )}

                    {currentOutput && (
                      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setIsOutputCollapsed(!isOutputCollapsed)}
                              className="text-green-800 hover:text-green-900"
                            >
                              {isOutputCollapsed ? '▶' : '▼'}
                            </button>
                            <span className="text-sm font-medium text-green-800">
                              ✓ 步骤已完成
                            </span>
                          </div>
                          <button
                            onClick={() => navigator.clipboard.writeText(currentOutput.response)}
                            className="text-sm text-gray-600 hover:text-gray-800"
                          >
                            📋 复制
                          </button>
                        </div>
                        {!isOutputCollapsed && (
                          <MarkdownRenderer content={currentOutput.response} className="prose prose-sm max-w-none" />
                        )}
                      </div>
                    )}

                    <div className="flex gap-3">
                      {!currentOutput && (
                        <button
                          onClick={() => handleExecuteStep()}
                          disabled={isExecuting || (currentStepIndex === 0 && !inputs.requirement)}
                          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          {isExecuting ? '执行中...' : '执行此步骤'}
                        </button>
                      )}

                      {currentOutput && currentStepIndex < selectedWorkflow.steps.length - 1 && (
                        <button
                          onClick={() => setCurrentStepIndex(currentStepIndex + 1)}
                          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          继续下一步 →
                        </button>
                      )}

                      {currentStepIndex > 0 && (
                        <button
                          onClick={() => setCurrentStepIndex(currentStepIndex - 1)}
                          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                        >
                          ← 返回上一步
                        </button>
                      )}

                      <button
                        onClick={() => setShowPromptPreview(!showPromptPreview)}
                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                      >
                        {showPromptPreview ? '隐藏' : '显示'} Prompt
                      </button>

                      {currentOutput && (
                        <button
                          onClick={() => {
                            setSelectedOutputIndex(currentStepIndex);
                            setShowContextModal(true);
                          }}
                          className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                        >
                          🧠 查看完整上下文
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {showPromptPreview && currentStep && (
              <div className="w-1/2 border-l border-gray-200 overflow-y-auto p-6 bg-gray-50">
                <h3 className="font-bold mb-2 flex items-center justify-between">
                  <span>Prompt 预览</span>
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
                    <button
                      onClick={() => {
                        const preview = renderPromptPreview(currentStep);
                        navigator.clipboard.writeText(preview);
                      }}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      📋 复制
                    </button>
                  </div>
                </h3>
                <pre className="text-sm whitespace-pre-wrap font-mono bg-white p-4 rounded border border-gray-300">
                  {renderPromptPreview(currentStep)}
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
          let rendered = template.content;

          for (const [key, value] of Object.entries(parameters)) {
            const patterns = [
              new RegExp(`\\$\\{${key}\\}`, 'g'),
              new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
              new RegExp(`<${key}>`, 'g'),
              new RegExp(`\\[${key}\\]`, 'g')
            ];

            for (const pattern of patterns) {
              rendered = rendered.replace(pattern, String(value || ''));
            }
          }

          rendered = rendered.replace(/\$\{cwd\}/g, context?.projectPath || '');
          rendered = rendered.replace(/\{\{cwd\}\}/g, context?.projectPath || '');

          if (additionalText) {
            rendered += '\n\n---\n\n' + additionalText;
          }

          setCustomPrompt(rendered);

          if (selectedWorkflow) {
            const originalStep = selectedWorkflow.steps[currentStepIndex];
            const modifiedStep: WorkflowStep = {
              ...originalStep,
              prompt: rendered
            };
            setCustomStep(modifiedStep);
            setShowPromptPreview(true);
          }
        }}
        currentPrompt={currentStep?.prompt}
      />

      {showContextModal && selectedOutputIndex !== null && context && context.outputs[selectedOutputIndex] && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold">🧠 Claude 思考上下文</h2>
              <button
                onClick={() => setShowContextModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-blue-600">📤 发送给 Claude 的 Prompt</h3>
                  <button
                    onClick={() => navigator.clipboard.writeText(context.outputs[selectedOutputIndex].prompt)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    📋 复制 Prompt
                  </button>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 overflow-x-auto">
                    {context.outputs[selectedOutputIndex].prompt}
                  </pre>
                </div>
              </div>

              <div className="border-t-2 border-gray-300 my-6"></div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-green-600">📥 Claude 的回复</h3>
                  <button
                    onClick={() => navigator.clipboard.writeText(context.outputs[selectedOutputIndex].response)}
                    className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    📋 复制回复
                  </button>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <MarkdownRenderer content={context.outputs[selectedOutputIndex].response} className="prose prose-sm max-w-none" />
                </div>
              </div>

              <div className="border-t-2 border-gray-300 my-6"></div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-600">📊 元信息</h3>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2 text-sm">
                  <div><span className="font-medium">步骤ID:</span> {context.outputs[selectedOutputIndex].stepId}</div>
                  <div><span className="font-medium">步骤名称:</span> {context.outputs[selectedOutputIndex].stepName}</div>
                  <div><span className="font-medium">执行时间:</span> {new Date(context.outputs[selectedOutputIndex].timestamp).toLocaleString('zh-CN')}</div>
                  <div><span className="font-medium">Prompt 长度:</span> {context.outputs[selectedOutputIndex].prompt.length} 字符</div>
                  <div><span className="font-medium">响应长度:</span> {context.outputs[selectedOutputIndex].response.length} 字符</div>
                </div>
              </div>
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
      />

      <PromptTemplateCreator
        isOpen={showPromptCreator}
        onClose={() => setShowPromptCreator(false)}
        onSave={() => {
          alert('模板已保存到 prompts/Custom 文件夹');
          setShowPromptCreator(false);
        }}
      />
    </div>
  );
}
