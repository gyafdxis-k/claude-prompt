'use client';

import { memo, useMemo } from 'react';
import MarkdownRenderer from './MarkdownRenderer';

interface StreamingDisplayProps {
  prompt?: string;
  response: string;
  isStreaming: boolean;
  taskInfo?: {
    stepName: string;
    description: string;
    projectPath?: string;
  };
}

// 使用 memo 避免不必要的重新渲染
export default memo(function StreamingDisplay({ prompt, response, isStreaming, taskInfo }: StreamingDisplayProps) {
  if (!isStreaming && !response) {
    return null;
  }

  // 限制 Prompt 显示长度，避免渲染过长内容
  const truncatedPrompt = useMemo(() => {
    if (!prompt) return '';
    return prompt.length > 10000 ? prompt.substring(0, 10000) + '\n\n...(Prompt过长，已截断)' : prompt;
  }, [prompt]);

  return (
    <div className="fixed inset-4 bg-white border-2 border-blue-500 shadow-2xl z-50 flex flex-col rounded-lg">
      <div className="bg-blue-600 text-white px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-bold">
            {isStreaming ? '🧠 Claude 正在实时输出...' : '✅ 完成'}
          </span>
          {taskInfo && (
            <span className="text-blue-100 text-sm">
              {taskInfo.stepName}
            </span>
          )}
        </div>
        {isStreaming && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-200">流式响应中</span>
            <div className="flex gap-1">
              <span className="animate-bounce">●</span>
              <span className="animate-bounce delay-100">●</span>
              <span className="animate-bounce delay-200">●</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden flex">
        {(taskInfo || prompt) && (
          <div className="w-1/3 border-r overflow-y-auto p-4 bg-blue-50">
            <h3 className="font-bold text-sm text-blue-800 mb-2">📋 当前任务</h3>
            {taskInfo && (
              <div className="space-y-2 text-sm mb-4">
                <div>
                  <span className="text-gray-600">步骤：</span>
                  <span className="font-medium text-gray-900">{taskInfo.stepName}</span>
                </div>
                {taskInfo.description && (
                  <div>
                    <span className="text-gray-600">描述：</span>
                    <p className="text-gray-800 mt-1">{taskInfo.description}</p>
                  </div>
                )}
                {taskInfo.projectPath && (
                  <div>
                    <span className="text-gray-600">项目：</span>
                    <span className="font-mono text-xs text-gray-800">{taskInfo.projectPath}</span>
                  </div>
                )}
              </div>
            )}
            {truncatedPrompt && (
              <div className="mt-4">
                <h4 className="font-bold text-xs text-gray-600 mb-2">完整 Prompt：</h4>
                <pre className="whitespace-pre-wrap text-xs text-gray-700 font-mono bg-white p-2 rounded border max-h-96 overflow-y-auto">
                  {truncatedPrompt}
                </pre>
              </div>
            )}
          </div>
        )}

        <div className={`${prompt ? 'w-2/3' : 'w-full'} overflow-y-auto p-4`}>
          <h3 className="font-bold text-sm text-green-800 mb-2">📥 响应</h3>
          <MarkdownRenderer content={response} className="prose prose-sm max-w-none" />
          {isStreaming && (
            <div className="mt-2 text-gray-400 text-sm">▊</div>
          )}
        </div>
      </div>
    </div>
  );
});
