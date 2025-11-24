'use client';

import { useState } from 'react';
import { TemplateBinding, renderTemplate, getSmartParameterMetadata } from '@/lib/template-binding';

interface TemplateBindingCardProps {
  binding: TemplateBinding;
  onParameterChange: (paramName: string, value: string) => void;
  onRemove: () => void;
  onChangeTemplate: () => void;
  additionalContext?: Record<string, string>;
  showPreview?: boolean;
}

export default function TemplateBindingCard({
  binding,
  onParameterChange,
  onRemove,
  onChangeTemplate,
  additionalContext = {},
  showPreview = false
}: TemplateBindingCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);

  const renderedText = renderTemplate(binding, additionalContext);
  const hasParameters = binding.template.parameters.length > 0;

  return (
    <div className="border-2 border-purple-300 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-purple-200 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-purple-600 hover:text-purple-800 transition-colors"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-purple-900">📋 {binding.template.name}</span>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                  {binding.template.category}
                </span>
                {hasParameters && (
                  <span className="text-xs text-purple-600">
                    {binding.template.parameters.length} 个参数
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 line-clamp-1">{binding.template.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {showPreview && hasParameters && (
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                title={previewMode ? '显示参数' : '预览效果'}
              >
                {previewMode ? '📝 参数' : '👁️ 预览'}
              </button>
            )}
            <button
              onClick={onChangeTemplate}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              title="更换模板"
            >
              🔄 更换
            </button>
            <button
              onClick={onRemove}
              className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
              title="移除模板"
            >
              ✕ 移除
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      {isExpanded && (
        <div className="p-3">
          {!previewMode && hasParameters ? (
            // 参数编辑模式
            <div className="space-y-3">
              {binding.template.parameters.map(param => {
                const meta = getSmartParameterMetadata(param.name);
                const isMultiline = meta.multiline || param.type === 'code' || param.type === 'files';
                
                return (
                  <div key={param.name} className="bg-white border border-gray-200 rounded-lg p-3 hover:border-purple-300 transition-colors">
                    <div className="flex items-start justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-gray-800">
                        {param.name}
                        {param.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                        {param.type}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">{meta.description}</div>
                    {isMultiline ? (
                      <textarea
                        value={binding.parameters[param.name] || ''}
                        onChange={(e) => onParameterChange(param.name, e.target.value)}
                        rows={3}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder={meta.example}
                        style={{ fontFamily: param.type === 'code' ? 'monospace' : 'inherit' }}
                      />
                    ) : (
                      <input
                        type={param.type === 'number' ? 'number' : 'text'}
                        value={binding.parameters[param.name] || ''}
                        onChange={(e) => onParameterChange(param.name, e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder={meta.example}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ) : previewMode ? (
            // 预览模式
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-xs text-gray-500 mb-2">📄 渲染后的 Prompt 预览：</div>
              <pre className="text-xs whitespace-pre-wrap font-mono text-gray-800 max-h-60 overflow-y-auto">
                {renderedText}
              </pre>
            </div>
          ) : (
            // 无参数模板
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-xs text-gray-500 mb-2">📄 Prompt 内容：</div>
              <pre className="text-xs whitespace-pre-wrap font-mono text-gray-800 max-h-40 overflow-y-auto">
                {binding.template.content}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
