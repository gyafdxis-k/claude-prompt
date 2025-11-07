'use client';

import MarkdownRenderer from './MarkdownRenderer';

interface StreamingDisplayProps {
  prompt: string;
  response: string;
  isStreaming: boolean;
}

export default function StreamingDisplay({ prompt, response, isStreaming }: StreamingDisplayProps) {
  if (!isStreaming && !response) {
    return null;
  }

  return (
    <div className="fixed bottom-0 right-0 w-2/3 h-2/3 bg-white border-l-2 border-t-2 border-blue-500 shadow-2xl z-50 flex flex-col">
      <div className="bg-blue-600 text-white px-4 py-2 flex items-center justify-between">
        <span className="font-bold">🧠 Claude 思考中...</span>
        {isStreaming && (
          <div className="flex gap-1">
            <span className="animate-bounce">●</span>
            <span className="animate-bounce delay-100">●</span>
            <span className="animate-bounce delay-200">●</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden flex">
        {prompt && (
          <div className="w-1/3 border-r overflow-y-auto p-4 bg-blue-50">
            <h3 className="font-bold text-sm text-blue-800 mb-2">📤 Prompt</h3>
            <pre className="whitespace-pre-wrap text-xs text-gray-700 font-mono">
              {prompt}
            </pre>
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
}
