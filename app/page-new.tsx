'use client';

import { useState, useEffect } from 'react';
import WorkflowPage from '@/components/WorkflowPage';
import { claudeService } from '@/lib/claude-api';
import { WorkflowEngine } from '@/lib/workflows/workflow-engine';
import { WorkflowExecutionContext, StepOutput } from '@/lib/workflows/workflow-engine';
import { WorkflowStep } from '@/lib/workflows/workflow-templates';
import { ProjectContext } from '@/lib/context/project-scanner';

export default function Home() {
  const [projectPath, setProjectPath] = useState('');
  const [context, setContext] = useState<WorkflowExecutionContext | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [engine, setEngine] = useState<WorkflowEngine | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [projectContext, setProjectContext] = useState<ProjectContext | null>(null);

  useEffect(() => {
    const authToken = process.env.NEXT_PUBLIC_ANTHROPIC_AUTH_TOKEN;
    if (authToken) {
      claudeService.initialize();
    }

    const savedPath = localStorage.getItem('projectPath');
    if (savedPath) {
      setProjectPath(savedPath);
      initializeEngine(savedPath);
    } else {
      const currentPath = process.cwd();
      setProjectPath(currentPath);
      initializeEngine(currentPath);
    }
  }, []);

  const initializeEngine = async (path: string) => {
    try {
      const newEngine = new WorkflowEngine(claudeService, path);
      setEngine(newEngine);

      const projectCtx = await newEngine.scanProject();
      setProjectContext(projectCtx);
    } catch (error) {
      console.error('初始化失败:', error);
    }
  };

  const handleExecuteStep = async (step: WorkflowStep, inputs: Record<string, any>) => {
    if (!engine || !context) return;

    setIsExecuting(true);
    try {
      const output = await engine.executeStep(step, context);
      
      setContext({
        ...context,
        outputs: [...context.outputs, output]
      });
    } catch (error: any) {
      alert(`执行失败: ${error.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSelectWorkflow = (workflow: any, inputs: Record<string, any>) => {
    if (!projectContext) return;

    setContext({
      workflow,
      projectPath,
      inputs,
      outputs: [],
      projectContext
    });
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="h-14 border-b border-gray-200 flex items-center justify-between px-4 bg-white">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚀</span>
          <h1 className="text-xl font-bold">Claude Dev Assistant</h1>
          {projectContext && (
            <span className="text-sm text-gray-600">
              | {projectContext.techStack.join(', ')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600">
            📁 {projectPath.split('/').slice(-2).join('/')}
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            ⚙️ 设置
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <WorkflowPage
          onExecuteStep={handleExecuteStep}
          onSelectWorkflow={() => {}}
          onCompleteStep={() => {}}
          context={context}
          isExecuting={isExecuting}
        />
      </div>

      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">设置</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">项目路径</label>
              <input
                type="text"
                value={projectPath}
                onChange={(e) => setProjectPath(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="text-sm text-gray-600 mb-4">
              <p>环境变量配置：</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>ANTHROPIC_AUTH_TOKEN: {process.env.NEXT_PUBLIC_ANTHROPIC_AUTH_TOKEN ? '✓ 已设置' : '✗ 未设置'}</li>
                <li>ANTHROPIC_BASE_URL: {process.env.NEXT_PUBLIC_ANTHROPIC_BASE_URL || '(使用默认)'}</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  localStorage.setItem('projectPath', projectPath);
                  initializeEngine(projectPath);
                  setShowSettings(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                保存
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
