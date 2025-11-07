'use client';

import { useState, useEffect } from 'react';
import PromptTemplateSelector from './PromptTemplateSelector';
import PromptParameterForm from './PromptParameterForm';
import PromptPreview from './PromptPreview';
import StreamingDisplay from './StreamingDisplay';
import { PromptTemplate } from '@/lib/prompts/prompt-scanner';

export default function PromptStudio() {
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [renderedPrompt, setRenderedPrompt] = useState('');
  
  const [isExecuting, setIsExecuting] = useState(false);
  const [streamingPrompt, setStreamingPrompt] = useState('');
  const [streamingResponse, setStreamingResponse] = useState('');
  const [executionHistory, setExecutionHistory] = useState<any[]>([]);

  useEffect(() => {
    if (selectedTemplate) {
      renderPrompt();
    }
  }, [selectedTemplate, parameters]);

  const renderPrompt = () => {
    if (!selectedTemplate) return;

    let rendered = selectedTemplate.content;

    for (const [key, value] of Object.entries(parameters)) {
      const patterns = [
        new RegExp(`\\$\\{${key}\\}`, 'g'),
        new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
        new RegExp(`<${key}>`, 'g'),
        new RegExp(`\\[${key}\\]`, 'g')
      ];

      for (const pattern of patterns) {
        rendered = rendered.replace(pattern, String(value || `[${key}]`));
      }
    }

    rendered = rendered.replace(/\$\{cwd\}/g, '/Users/gaodong/Desktop/claude_prompt/claude-dev-assistant');
    rendered = rendered.replace(/{{cwd}}/g, '/Users/gaodong/Desktop/claude_prompt/claude-dev-assistant');

    setRenderedPrompt(rendered);
  };

  const handleExecute = async () => {
    if (!selectedTemplate || !renderedPrompt) {
      alert('请先选择模板并填写参数');
      return;
    }

    const requiredParams = selectedTemplate.parameters.filter(p => p.required);
    const missingParams = requiredParams.filter(p => !parameters[p.name] || parameters[p.name].toString().trim() === '');
    
    if (missingParams.length > 0) {
      alert(`请填写必填参数: ${missingParams.map(p => p.name).join(', ')}`);
      return;
    }

    setIsExecuting(true);
    setStreamingPrompt('');
    setStreamingResponse('');

    try {
      const response = await fetch('/api/workflow/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: {
            id: 'custom-prompt',
            name: selectedTemplate.name,
            prompt: renderedPrompt
          },
          inputs: parameters,
          projectPath: '/Users/gaodong/Desktop/claude_prompt/claude-dev-assistant',
          previousOutputs: []
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || '执行失败');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('无法创建流读取器');
      }

      let buffer = '';
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('[Prompt Studio] 流读取完成');
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'prompt') {
                setStreamingPrompt(data.data);
              } else if (data.type === 'chunk') {
                fullResponse += data.data;
                setStreamingResponse(fullResponse);
              } else if (data.type === 'done') {
                setExecutionHistory(prev => [...prev, {
                  template: selectedTemplate.name,
                  parameters,
                  prompt: data.data.prompt,
                  response: data.data.response,
                  timestamp: data.data.timestamp
                }]);
              } else if (data.type === 'error') {
                throw new Error(data.data);
              }
            } catch (e) {
              console.error('[Prompt Studio] 解析SSE数据错误:', e);
            }
          }
        }
      }

    } catch (error: any) {
      alert(`执行失败: ${error.message}`);
    } finally {
      setIsExecuting(false);
      setTimeout(() => {
        setStreamingPrompt('');
        setStreamingResponse('');
      }, 2000);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 shrink-0">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <span>🎨</span>
          <span>Prompt Studio</span>
        </h1>
        <p className="text-sm text-purple-100 mt-1">
          选择模板 → 填写参数 → 预览 Prompt → 执行
        </p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/4 border-r bg-white overflow-hidden flex flex-col">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-bold text-gray-800">📚 Prompt 模板库</h2>
            <p className="text-xs text-gray-600 mt-1">从 50+ 真实 AI 工具中提取</p>
          </div>
          <div className="flex-1 overflow-hidden">
            <PromptTemplateSelector
              onSelectTemplate={setSelectedTemplate}
              selectedTemplate={selectedTemplate}
            />
          </div>
        </div>

        <div className="w-1/4 border-r bg-white overflow-hidden flex flex-col">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-bold text-gray-800">⚙️ 参数配置</h2>
            {selectedTemplate && (
              <p className="text-xs text-gray-600 mt-1">
                {selectedTemplate.parameters.length} 个参数
              </p>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {selectedTemplate ? (
              <PromptParameterForm
                template={selectedTemplate}
                onParametersChange={setParameters}
                parameters={parameters}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-center">
                <div>
                  <div className="text-4xl mb-2">⚙️</div>
                  <p className="text-sm">选择模板后填写参数</p>
                </div>
              </div>
            )}
          </div>
          
          {selectedTemplate && (
            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={handleExecute}
                disabled={isExecuting}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 font-medium transition-all shadow-lg disabled:shadow-none flex items-center justify-center gap-2"
              >
                {isExecuting ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>执行中...</span>
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    <span>执行 Prompt</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-hidden">
          <PromptPreview
            template={selectedTemplate}
            parameters={parameters}
            renderedPrompt={renderedPrompt}
          />
        </div>
      </div>

      <StreamingDisplay
        prompt={streamingPrompt}
        response={streamingResponse}
        isStreaming={isExecuting && (streamingPrompt || streamingResponse) ? true : false}
      />

      {executionHistory.length > 0 && (
        <div className="fixed bottom-4 left-4 bg-white border shadow-lg rounded-lg p-3 max-w-xs">
          <div className="text-sm font-medium text-gray-700 mb-1">
            📊 执行历史
          </div>
          <div className="text-xs text-gray-600">
            已执行 {executionHistory.length} 次
          </div>
        </div>
      )}
    </div>
  );
}
