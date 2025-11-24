'use client';

import { useState, useEffect } from 'react';
import WorkflowPage from '@/components/WorkflowPage';
import PromptStudio from '@/components/PromptStudio';
import StreamingDisplay from '@/components/StreamingDisplay';
import ProjectSwitcher from '@/components/ProjectSwitcher';
import OnboardingModal from '@/components/OnboardingModal';
import ExecutionHistoryPanel from '@/components/ExecutionHistoryPanel';
import { workflows, Workflow } from '@/lib/workflows/workflow-templates';
import { WorkflowExecutionContext, StepOutput } from '@/lib/workflows/workflow-engine';
import { WorkflowStep } from '@/lib/workflows/workflow-templates';
import { ProjectContext } from '@/lib/context/project-scanner';
import { saveExecutionHistory, updateExecutionHistory, ExecutionHistory } from '@/lib/execution-history';

type AppMode = 'workflow' | 'prompt';

export default function Home() {
  const [mode, setMode] = useState<AppMode>('workflow');
  const [projectPath, setProjectPath] = useState('');
  const [context, setContext] = useState<WorkflowExecutionContext | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [projectContext, setProjectContext] = useState<ProjectContext | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [initialInputs, setInitialInputs] = useState<Record<string, any>>({});
  const [streamingPrompt, setStreamingPrompt] = useState('');
  const [streamingResponse, setStreamingResponse] = useState('');
  const [taskInfo, setTaskInfo] = useState<any>(null);
  const [isSelectingFolder, setIsSelectingFolder] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null);

  useEffect(() => {
    const savedPath = localStorage.getItem('projectPath') || '';
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    
    setProjectPath(savedPath);
    loadProjectContext(savedPath);
    
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const loadProjectContext = async (path: string) => {
    if (!path) return;
    
    try {
      const response = await fetch('/api/project/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectPath: path })
      });

      if (response.ok) {
        const { context: ctx } = await response.json();
        setProjectContext(ctx);
      }
    } catch (error) {
      console.error('加载项目上下文失败:', error);
    }
  };

  const handleSelectWorkflow = (workflow: Workflow, isTestMode?: boolean) => {
    setSelectedWorkflow(workflow);
    const newContext = {
      workflow,
      projectPath,
      inputs: initialInputs,
      outputs: [],
      projectContext: projectContext || undefined
    };
    setContext(newContext);
    
    if (!isTestMode) {
      const savedHistory = saveExecutionHistory({
        workflowId: workflow.id,
        workflowName: workflow.name,
        projectPath: projectPath || 'Unknown',
        startTime: Date.now(),
        status: 'running',
        outputs: []
      });
      setCurrentExecutionId(savedHistory.id);
    } else {
      setCurrentExecutionId(null);
    }
  };

  const handleExecuteStep = async (step: WorkflowStep, inputs: Record<string, any>, isNewStep: boolean = false) => {
    if (!context) return;

    setIsExecuting(true);
    setInitialInputs(inputs);
    setStreamingPrompt('');
    setStreamingResponse('');

    try {
      const updatedContext = {
        ...context,
        inputs: { ...context.inputs, ...inputs }
      };

      console.log('[前端] 发送流式请求到API...');
      const response = await fetch('/api/workflow/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step,
          inputs: updatedContext.inputs,
          projectPath,
          previousOutputs: context.outputs
        })
      });

      console.log('[前端] 收到响应, 状态:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[前端] API错误:', errorText);
        throw new Error(errorText || '执行失败');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('无法创建流读取器');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('[前端] 流读取完成');
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'task_info') {
                console.log('[前端] 收到任务信息');
                setTaskInfo(data.data);
              } else if (data.type === 'prompt') {
                console.log('[前端] 收到 Prompt');
                setStreamingPrompt(data.data);
              } else if (data.type === 'summarizing') {
                console.log('[前端] 正在总结对话...');
                setStreamingResponse('⏳ ' + data.data);
              } else if (data.type === 'chunk') {
                setStreamingResponse(prev => prev + data.data);
              } else if (data.type === 'done') {
                console.log('[前端] 执行完成');
                const conversationTurn = data.data;
                
                setContext(prevContext => {
                  if (!prevContext) return prevContext;
                  
                  const currentStepIndex = prevContext.outputs.findIndex(o => o.stepId === step.id);
                  let newOutputs;
                  
                  if (currentStepIndex >= 0) {
                    const updatedOutputs = [...prevContext.outputs];
                    updatedOutputs[currentStepIndex] = {
                      ...updatedOutputs[currentStepIndex],
                      conversations: [...updatedOutputs[currentStepIndex].conversations, conversationTurn]
                    };
                    newOutputs = updatedOutputs;
                  } else {
                    const newStepOutput = {
                      stepId: step.id,
                      stepName: step.name,
                      conversations: [conversationTurn],
                      completed: false
                    };
                    newOutputs = [...prevContext.outputs, newStepOutput];
                  }
                  
                  if (currentExecutionId) {
                    updateExecutionHistory(currentExecutionId, {
                      outputs: newOutputs,
                      endTime: Date.now()
                    });
                  }
                  
                  return { ...prevContext, outputs: newOutputs, inputs: updatedContext.inputs };
                });
              } else if (data.type === 'error') {
                throw new Error(data.data);
              }
            } catch (e) {
              console.error('[前端] 解析SSE数据错误:', e);
            }
          }
        }
      }

    } catch (error: any) {
      alert(`执行失败: ${error.message}`);
      if (currentExecutionId) {
        updateExecutionHistory(currentExecutionId, {
          status: 'failed',
          endTime: Date.now()
        });
      }
    } finally {
      setIsExecuting(false);
      setStreamingPrompt('');
      setStreamingResponse('');
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="h-14 border-b border-gray-200 flex items-center justify-between px-4 bg-white shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚀</span>
            <h1 className="text-xl font-bold">Claude Dev Assistant</h1>
          </div>
          
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setMode('workflow')}
              className={`px-4 py-1.5 text-sm rounded-md transition-all ${
                mode === 'workflow'
                  ? 'bg-white text-blue-600 font-medium shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🔄 工作流模式
            </button>
            <button
              onClick={() => setMode('prompt')}
              className={`px-4 py-1.5 text-sm rounded-md transition-all ${
                mode === 'prompt'
                  ? 'bg-white text-blue-600 font-medium shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ⚡ Prompt 模式
            </button>
          </div>

          {projectContext && projectContext.techStack.length > 0 && (
            <span className="text-sm text-gray-600">
              | {projectContext.techStack.join(', ')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <ProjectSwitcher
            currentPath={projectPath}
            onSwitch={(path) => {
              setProjectPath(path);
              localStorage.setItem('projectPath', path);
              loadProjectContext(path);
            }}
          />
          
          <button
            onClick={() => setShowHistory(true)}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            title="执行历史"
          >
            📜 历史
          </button>
          
          <button
            onClick={() => setShowOnboarding(true)}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            title="查看引导"
          >
            ❓
          </button>
          
          <button
            onClick={() => setShowSettings(true)}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            ⚙️ 设置
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        {mode === 'workflow' ? (
          <WorkflowPage
            onExecuteStep={handleExecuteStep}
            onSelectWorkflow={handleSelectWorkflow}
            onCompleteStep={(stepId) => {
              if (!context) return;
              const stepIndex = context.outputs.findIndex(o => o.stepId === stepId);
              if (stepIndex >= 0) {
                const updatedOutputs = [...context.outputs];
                updatedOutputs[stepIndex] = {
                  ...updatedOutputs[stepIndex],
                  completed: true
                };
                setContext({ ...context, outputs: updatedOutputs });
                
                if (currentExecutionId) {
                  const allCompleted = updatedOutputs.every(o => o.completed);
                  updateExecutionHistory(currentExecutionId, {
                    outputs: updatedOutputs,
                    status: allCompleted ? 'completed' : 'running',
                    endTime: allCompleted ? Date.now() : undefined
                  });
                }
              }
            }}
            context={context}
            isExecuting={isExecuting}
          />
        ) : (
          <PromptStudio />
        )}
      </div>

      <StreamingDisplay
        prompt={streamingPrompt}
        response={streamingResponse}
        isStreaming={isExecuting && (streamingPrompt || streamingResponse) ? true : false}
        taskInfo={taskInfo}
      />

      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => {
          setShowOnboarding(false);
          localStorage.setItem('hasSeenOnboarding', 'true');
        }}
        onComplete={(selectedMode, projectPath) => {
          setMode(selectedMode);
          if (projectPath) {
            setProjectPath(projectPath);
            localStorage.setItem('projectPath', projectPath);
            loadProjectContext(projectPath);
          }
          setShowOnboarding(false);
          localStorage.setItem('hasSeenOnboarding', 'true');
        }}
      />

      <ExecutionHistoryPanel
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onLoadHistory={(history: ExecutionHistory) => {
          const workflow = workflows.find(w => w.id === history.workflowId);
          if (workflow) {
            setSelectedWorkflow(workflow);
            setMode('workflow');
            setContext({
              workflow,
              projectPath: history.projectPath,
              inputs: {},
              outputs: history.outputs,
              projectContext: projectContext || undefined
            });
            setCurrentExecutionId(history.id);
            setShowHistory(false);
          }
        }}
        onSaveAsWorkflow={async (history: ExecutionHistory) => {
          const newWorkflow: Workflow = {
            id: `from-history-${Date.now()}`,
            name: `${history.workflowName} (副本)`,
            description: `基于执行历史创建: ${new Date(history.startTime).toLocaleString('zh-CN')}`,
            icon: '📦',
            category: 'custom',
            steps: history.outputs.map((output, index) => ({
              id: `step-${index + 1}`,
              name: output.stepName,
              prompt: output.conversations.length > 0 
                ? output.conversations[0].prompt 
                : '请输入 prompt 内容',
              requiresApproval: false
            })),
            config: {}
          };
          
          try {
            await fetch('/api/workflows/custom', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newWorkflow)
            });
            alert(`工作流 "${newWorkflow.name}" 已保存！您可以在工作流列表中找到它。`);
            setShowHistory(false);
          } catch (error) {
            console.error('保存工作流失败:', error);
            alert('保存失败，请重试');
          }
        }}
      />

      {showSettings && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4">设置</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                项目路径
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={projectPath}
                  onChange={(e) => setProjectPath(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="/path/to/your/project"
                />
                <button
                  onClick={async () => {
                    setIsSelectingFolder(true);
                    try {
                      const response = await fetch('/api/folder/select');
                      const data = await response.json();
                      if (data.path) {
                        setProjectPath(data.path);
                      } else if (data.cancelled) {
                        console.log('用户取消选择文件夹');
                      } else if (data.error) {
                        alert(`选择文件夹失败: ${data.error}`);
                      }
                    } catch (error) {
                      console.error('选择文件夹失败:', error);
                      alert('选择文件夹失败，请重试');
                    } finally {
                      setIsSelectingFolder(false);
                    }
                  }}
                  disabled={isSelectingFolder}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 whitespace-nowrap disabled:bg-gray-400 disabled:cursor-wait transition-colors"
                >
                  {isSelectingFolder ? '⏳ 打开中...' : '📁 选择'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                设置你要开发的项目的绝对路径
              </p>
            </div>

            <div className="text-sm text-gray-600 mb-4 p-3 bg-gray-50 rounded">
              <p className="font-medium mb-2">环境变量状态：</p>
              <ul className="space-y-1">
                <li className="flex items-center gap-2">
                  <span className={process.env.NEXT_PUBLIC_ANTHROPIC_AUTH_TOKEN ? 'text-green-600' : 'text-red-600'}>
                    {process.env.NEXT_PUBLIC_ANTHROPIC_AUTH_TOKEN ? '✓' : '✗'}
                  </span>
                  <span>ANTHROPIC_AUTH_TOKEN</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gray-400">ℹ</span>
                  <span>BASE_URL: {process.env.NEXT_PUBLIC_ANTHROPIC_BASE_URL || '(默认)'}</span>
                </li>
              </ul>
              {!process.env.NEXT_PUBLIC_ANTHROPIC_AUTH_TOKEN && (
                <p className="text-xs text-red-600 mt-2">
                  请在 .env.local 文件中设置 NEXT_PUBLIC_ANTHROPIC_AUTH_TOKEN
                </p>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                取消
              </button>
              <button
                onClick={async () => {
                  localStorage.setItem('projectPath', projectPath);
                  setShowSettings(false);
                  loadProjectContext(projectPath);
                }}
                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                💾 保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
