'use client';

import { useState } from 'react';
import { PromptTemplate, PromptParameter } from '@/lib/prompts/prompt-scanner';

interface PromptTemplateCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: PromptTemplate) => void;
}

export default function PromptTemplateCreator({ isOpen, onClose, onSave }: PromptTemplateCreatorProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Custom');
  const [content, setContent] = useState('');

  if (!isOpen) return null;

  const extractParameters = (text: string): PromptParameter[] => {
    const parameters: PromptParameter[] = [];
    const seen = new Set<string>();

    const patterns = [
      /\$\{(\w+)\}/g,
      /\{\{(\w+)\}\}/g,
      /<(\w+)>/g,
      /\[(\w+)\]/g
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const paramName = match[1];
        if (!seen.has(paramName)) {
          seen.add(paramName);
          parameters.push({
            name: paramName,
            description: `${paramName} 参数`,
            required: true,
            type: 'string'
          });
        }
      }
    }

    return parameters;
  };

  const handleSave = async () => {
    if (!name.trim() || !content.trim()) {
      alert('请填写模板名称和内容');
      return;
    }

    const template: PromptTemplate = {
      id: `custom-${Date.now()}`,
      name,
      description: description || `自定义 ${name} 模板`,
      category,
      source: 'custom',
      content,
      parameters: extractParameters(content)
    };

    try {
      const response = await fetch('/api/prompts/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      });

      if (response.ok) {
        onSave(template);
        onClose();
        setName('');
        setDescription('');
        setContent('');
      } else {
        alert('保存失败');
      }
    } catch (error) {
      console.error('保存模板失败:', error);
      alert('保存失败');
    }
  };

  const detectedParams = extractParameters(content);

  return (
    <div className="fixed top-0 right-0 w-2/3 h-full bg-white shadow-2xl z-50 flex flex-col border-l-2 border-gray-300">
      <div className="bg-white rounded-lg w-full h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">创建新 Prompt 模板</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">模板名称 *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="例如: Python 代码审查"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">分类</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Custom"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="简短描述这个模板的用途..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Prompt 内容 *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
              placeholder="输入 prompt 内容，使用 ${variable}, {{variable}}, <variable> 或 [variable] 定义参数"
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 支持的变量格式: ${'{'}variable{'}'}, {'{{'} variable {'}}'}, &lt;variable&gt;, [variable]
            </p>
          </div>

          {detectedParams.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-bold text-sm text-blue-800 mb-2">
                🔍 检测到的参数 ({detectedParams.length} 个)
              </h3>
              <div className="flex flex-wrap gap-2">
                {detectedParams.map(param => (
                  <span
                    key={param.name}
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-mono"
                  >
                    {param.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            保存模板
          </button>
        </div>
      </div>
    </div>
  );
}
