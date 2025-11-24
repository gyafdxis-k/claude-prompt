'use client';

import { WorkflowStep } from '@/lib/workflows/workflow-templates';
import { StepOutput } from '@/lib/workflows/workflow-engine';

interface WorkflowProgressProps {
  steps: WorkflowStep[];
  currentStepIndex: number;
  outputs: StepOutput[];
}

export default function WorkflowProgress({ steps, currentStepIndex, outputs }: WorkflowProgressProps) {
  const getStepStatus = (index: number) => {
    const output = outputs.find(o => o.stepId === steps[index].id);
    
    if (output?.completed) return 'completed';
    if (index === currentStepIndex) return 'active';
    if (index < currentStepIndex) return 'processing';
    return 'pending';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'active':
        return 'bg-blue-500 animate-pulse';
      case 'processing':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'active':
        return '⏳';
      case 'processing':
        return '•••';
      default:
        return '';
    }
  };

  const completedCount = outputs.filter(o => o.completed).length;
  const progressPercentage = steps.length > 0 ? (completedCount / steps.length) * 100 : 0;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">执行进度</h3>
        <div className="text-xs text-gray-600">
          {completedCount} / {steps.length} 步完成
        </div>
      </div>

      <div className="relative">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          const output = outputs.find(o => o.stepId === step.id);
          
          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                status === 'active'
                  ? 'bg-blue-50 border border-blue-200'
                  : status === 'completed'
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${getStatusColor(
                  status
                )}`}
              >
                {status === 'completed' || status === 'active' ? (
                  <span>{getStatusIcon(status)}</span>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-medium text-sm ${
                      status === 'active'
                        ? 'text-blue-900'
                        : status === 'completed'
                        ? 'text-green-900'
                        : 'text-gray-600'
                    }`}
                  >
                    {step.name}
                  </span>
                  {status === 'completed' && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                      已完成
                    </span>
                  )}
                  {status === 'active' && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded animate-pulse">
                      执行中
                    </span>
                  )}
                </div>

                {output && output.conversations.length > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    {output.conversations.length} 轮对话
                    {output.conversations[output.conversations.length - 1] && (
                      <span className="ml-2">
                        · {new Date(output.conversations[output.conversations.length - 1].timestamp).toLocaleTimeString('zh-CN')}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {status === 'active' && (
                <div className="flex-shrink-0">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {steps.length > 0 && completedCount === steps.length && (
        <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🎉</div>
            <div>
              <div className="font-bold text-green-900">工作流执行完成！</div>
              <div className="text-sm text-green-700">所有步骤已成功完成</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
