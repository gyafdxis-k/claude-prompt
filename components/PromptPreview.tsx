'use client';

import { PromptTemplate } from '@/lib/prompts/prompt-scanner';

interface PromptPreviewProps {
  template: PromptTemplate | null;
  parameters: Record<string, any>;
  renderedPrompt: string;
}

export default function PromptPreview({ template, parameters, renderedPrompt }: PromptPreviewProps) {
  if (!template) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <div className="text-6xl mb-4">📄</div>
          <p>选择一个 Prompt 模板开始</p>
        </div>
      </div>
    );
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(renderedPrompt);
    alert('✅ Prompt 已复制到剪贴板');
  };

  const highlightVariables = (text: string) => {
    const patterns = [
      { regex: /\$\{(\w+)\}/g, color: 'text-blue-600', bg: 'bg-blue-50' },
      { regex: /\{\{(\w+)\}\}/g, color: 'text-purple-600', bg: 'bg-purple-50' },
      { regex: /<(\w+)>/g, color: 'text-green-600', bg: 'bg-green-50' },
      { regex: /\[(\w+)\]/g, color: 'text-orange-600', bg: 'bg-orange-50' }
    ];

    let highlighted = text;
    
    for (const { regex, color, bg } of patterns) {
      highlighted = highlighted.replace(regex, (match) => {
        return `<span class="${color} ${bg} px-1 rounded font-semibold">${match}</span>`;
      });
    }

    return highlighted;
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white border-b p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-lg text-gray-800">
            👁️ Prompt 预览
          </h3>
          <div className="flex gap-2">
            <button
              onClick={copyToClipboard}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
            >
              📋 复制
            </button>
          </div>
        </div>
        
        <div className="text-sm text-gray-600">
          <span className="font-medium">{template.name}</span>
          <span className="mx-2">•</span>
          <span>{template.category}</span>
          <span className="mx-2">•</span>
          <span>{renderedPrompt.length} 字符</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <pre 
            className="whitespace-pre-wrap font-mono text-sm text-gray-800 leading-relaxed"
            dangerouslySetInnerHTML={{ 
              __html: highlightVariables(renderedPrompt)
            }}
          />
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">📊 统计信息</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-700">总字符数:</span>
              <span className="ml-2 font-mono">{renderedPrompt.length}</span>
            </div>
            <div>
              <span className="text-blue-700">行数:</span>
              <span className="ml-2 font-mono">{renderedPrompt.split('\n').length}</span>
            </div>
            <div>
              <span className="text-blue-700">单词数:</span>
              <span className="ml-2 font-mono">{renderedPrompt.split(/\s+/).length}</span>
            </div>
            <div>
              <span className="text-blue-700">已填参数:</span>
              <span className="ml-2 font-mono">
                {Object.keys(parameters).filter(k => parameters[k]).length} / {template.parameters.length}
              </span>
            </div>
          </div>
        </div>

        {template.parameters.length > 0 && (
          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h4 className="font-semibold text-purple-900 mb-3">🔧 参数状态</h4>
            <div className="space-y-2">
              {template.parameters.map(param => {
                const isFilled = parameters[param.name] && parameters[param.name].toString().length > 0;
                return (
                  <div key={param.name} className="flex items-center gap-2 text-sm">
                    <span className={`w-3 h-3 rounded-full ${
                      isFilled ? 'bg-green-500' : param.required ? 'bg-red-500' : 'bg-gray-300'
                    }`} />
                    <span className="font-medium text-gray-700">{param.name}</span>
                    <span className="text-gray-500">
                      {isFilled ? '✓ 已填写' : param.required ? '⚠️ 必填' : '可选'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
