'use client';

import { useState, useEffect } from 'react';
import { getSmartParameterMetadata } from '@/lib/template-binding';

interface PromptEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newPrompt: string) => void;
  initialPrompt: string;
  stepName?: string;
  contextData?: Record<string, string>;
}

export default function PromptEditorModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialPrompt,
  stepName,
  contextData = {}
}: PromptEditorModalProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [previewMode, setPreviewMode] = useState(false);
  const [parameterValues, setParameterValues] = useState<Record<string, string>>({});
  
  useEffect(() => {
    setPrompt(initialPrompt);
  }, [initialPrompt, isOpen]);

  if (!isOpen) return null;

  const detectVariables = (text: string): string[] => {
    const patterns = [
      /\{\{(\w+)\}\}/g,
      /\$\{(\w+)\}/g,
      /<(\w+)>/g,
      /\[(\w+)\]/g
    ];
    const vars = new Set<string>();
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        vars.add(match[1]);
      }
    });
    return Array.from(vars);
  };

  const variables = detectVariables(prompt);
  const hasChanges = prompt !== initialPrompt;
  
  const renderPromptWithParameters = (): string => {
    let rendered = prompt;
    const allValues = { ...contextData, ...parameterValues };
    
    for (const [key, value] of Object.entries(allValues)) {
      if (value) {
        const patterns = [
          new RegExp(`\\$\\{${key}\\}`, 'g'),
          new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
          new RegExp(`<${key}>`, 'g'),
          new RegExp(`\\[${key}\\]`, 'g')
        ];
        for (const pattern of patterns) {
          rendered = rendered.replace(pattern, String(value));
        }
      }
    }
    return rendered;
  };

  const handleSave = () => {
    onSave(prompt);
    onClose();
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (confirm('有未保存的修改，确定要取消吗？')) {
        setPrompt(initialPrompt);
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">✏️ 编辑 Prompt 模板</h2>
            {stepName && (
              <p className="text-xs text-gray-500 mt-0.5">步骤: {stepName}</p>
            )}
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center gap-1 px-4 pt-3 border-b border-gray-200">
          <button
            onClick={() => setPreviewMode(false)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              !previewMode
                ? 'bg-white text-blue-600 border-t border-x border-gray-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📝 编辑模板
          </button>
          <button
            onClick={() => setPreviewMode(true)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              previewMode
                ? 'bg-white text-blue-600 border-t border-x border-gray-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            👁️ 预览效果
          </button>
          
          {/* Stats */}
          <div className="ml-auto flex items-center gap-3 text-xs text-gray-500 mb-1">
            <span>{prompt.length} 字符</span>
            <span>{prompt.split('\n').length} 行</span>
            {variables.length > 0 && (
              <span className="text-purple-600 font-medium">{variables.length} 个变量</span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {!previewMode ? (
            <>
              <div className="flex-1 flex flex-col p-4">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="flex-1 w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="输入 Prompt 内容，使用 {{variable}} 或 ${variable} 定义变量..."
                  autoFocus
                />
                
                {/* Quick Insert Buttons */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-xs text-gray-600 font-medium">快速插入:</span>
                  {[
                    { label: '需求', value: '{{requirement}}' },
                    { label: '上一步输出', value: '{{previous_output}}' },
                    { label: '项目路径', value: '{{project_path}}' },
                    { label: '代码', value: '{{code}}' },
                    { label: '文件路径', value: '{{file_path}}' }
                  ].map(({ label, value }) => (
                    <button
                      key={value}
                      onClick={() => setPrompt(prev => prev + ' ' + value)}
                      className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* 右侧：参数填充面板 */}
              {variables.length > 0 && (
                <div className="w-80 border-l border-gray-200 overflow-y-auto bg-gray-50 p-4">
                  <h3 className="font-semibold text-sm text-gray-900 mb-3 flex items-center gap-2">
                    <span>🔧</span>
                    <span>参数填充 ({variables.length})</span>
                  </h3>
                  
                  <div className="space-y-3">
                    {variables.map((varName) => {
                      const meta = getSmartParameterMetadata(varName);
                      const isMultiline = meta.multiline;
                      const isContextProvided = contextData && contextData[varName];
                      
                      return (
                        <div key={varName} className="bg-white border border-gray-200 rounded-lg p-3 hover:border-purple-300 transition-colors">
                          <div className="flex items-start justify-between mb-1.5">
                            <label className="block text-xs font-semibold text-gray-800">
                              {varName}
                            </label>
                            {isContextProvided && (
                              <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                                ✓ 已提供
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mb-2">{meta.description}</div>
                          {isMultiline ? (
                            <textarea
                              value={parameterValues[varName] || contextData[varName] || ''}
                              onChange={(e) => setParameterValues({...parameterValues, [varName]: e.target.value})}
                              rows={3}
                              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                              placeholder={meta.example}
                              disabled={isContextProvided}
                            />
                          ) : (
                            <input
                              type="text"
                              value={parameterValues[varName] || contextData[varName] || ''}
                              onChange={(e) => setParameterValues({...parameterValues, [varName]: e.target.value})}
                              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                              placeholder={meta.example}
                              disabled={isContextProvided}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
                    <div className="font-semibold text-blue-900 mb-1">💡 提示</div>
                    <div className="text-blue-800 space-y-1">
                      <div>• 填写参数后可在预览中查看效果</div>
                      <div>• 绿色标记的参数已自动填充</div>
                      <div>• 支持 {'{{'} {'}'}, ${'{}'}, &lt;&gt;, [] 格式</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              <h3 className="font-semibold text-sm text-gray-900 mb-3">📄 渲染预览</h3>
              <p className="text-xs text-gray-600 mb-4">
                {variables.length > 0 
                  ? '已根据填充的参数渲染最终 Prompt' 
                  : '无需填充参数，直接显示模板内容'}
              </p>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <pre className="text-sm whitespace-pre-wrap font-mono text-gray-800 leading-relaxed">
                  {variables.length > 0 ? renderPromptWithParameters() : (prompt || '(空 Prompt)')}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            {hasChanges && (
              <span className="text-xs text-orange-600 font-medium">● 未保存的修改</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              💾 保存修改
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
