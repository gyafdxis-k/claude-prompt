'use client';

import { useState, useEffect } from 'react';
import { PromptTemplate, PromptParameter } from '@/lib/prompts/prompt-scanner';
import { getPresets, savePreset, deletePreset, ParameterPreset } from '@/lib/parameter-presets';

interface PromptParameterFormProps {
  template: PromptTemplate;
  onParametersChange: (params: Record<string, any>) => void;
  parameters: Record<string, any>;
}

export default function PromptParameterForm({ template, onParametersChange, parameters }: PromptParameterFormProps) {
  const [presets, setPresets] = useState<ParameterPreset[]>([]);
  const [showPresets, setShowPresets] = useState(false);
  const [presetName, setPresetName] = useState('');

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = () => {
    setPresets(getPresets());
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      alert('请输入预设名称');
      return;
    }
    savePreset({
      name: presetName,
      parameters
    });
    setPresetName('');
    loadPresets();
    alert('✅ 预设已保存');
  };

  const handleLoadPreset = (preset: ParameterPreset) => {
    onParametersChange(preset.parameters);
    setShowPresets(false);
  };

  const handleDeletePreset = (id: string) => {
    if (confirm('确定要删除这个预设吗？')) {
      deletePreset(id);
      loadPresets();
    }
  };

  const handleChange = (paramName: string, value: any) => {
    onParametersChange({
      ...parameters,
      [paramName]: value
    });
  };

  const renderInput = (param: PromptParameter) => {
    const value = parameters[param.name] || '';

    switch (param.type) {
      case 'file':
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={value}
              onChange={(e) => handleChange(param.name, e.target.value)}
              placeholder={`输入文件路径，例如: app/page.tsx`}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-500">💡 提示: 输入项目中的文件路径</p>
          </div>
        );

      case 'files':
        return (
          <div className="space-y-2">
            <textarea
              value={value}
              onChange={(e) => handleChange(param.name, e.target.value)}
              placeholder="每行一个文件路径，例如:&#10;app/page.tsx&#10;lib/utils.ts"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-500">💡 提示: 每行输入一个文件路径</p>
          </div>
        );

      case 'code':
        return (
          <div className="space-y-2">
            <textarea
              value={value}
              onChange={(e) => handleChange(param.name, e.target.value)}
              placeholder="输入或粘贴代码..."
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-500">💡 提示: 粘贴相关代码片段</p>
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleChange(param.name, e.target.value)}
            placeholder={`输入数字`}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );

      default: // string
        const isLongText = param.name.includes('task') || 
                          param.name.includes('query') || 
                          param.name.includes('requirement') ||
                          param.name.includes('message') ||
                          param.name.includes('content');

        if (isLongText) {
          return (
            <textarea
              value={value}
              onChange={(e) => handleChange(param.name, e.target.value)}
              placeholder={`输入 ${param.description}...`}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          );
        }

        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(param.name, e.target.value)}
            placeholder={`输入 ${param.description}`}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
    }
  };

  if (!template.parameters || template.parameters.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-sm text-yellow-800">
          ℹ️ 此模板不需要额外参数，可以直接使用
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800">
          📝 填写参数
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
          >
            📋 预设 ({presets.length})
          </button>
          <span className="text-sm text-gray-600">
            {template.parameters.filter(p => p.required).length} 个必填项
          </span>
        </div>
      </div>

      {showPresets && (
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="预设名称..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <button
              onClick={handleSavePreset}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm whitespace-nowrap"
            >
              💾 保存当前参数
            </button>
          </div>

          {presets.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">已保存的预设：</p>
              {presets.map(preset => (
                <div key={preset.id} className="flex items-center justify-between bg-white p-2 rounded border">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{preset.name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(preset.createdAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLoadPreset(preset)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      加载
                    </button>
                    <button
                      onClick={() => handleDeletePreset(preset.id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-2">
              暂无预设，填写参数后点击上方按钮保存
            </p>
          )}
        </div>
      )}

      {template.parameters.map(param => (
        <div key={param.name} className="space-y-2">
          <label className="block">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-gray-700">
                {param.name}
              </span>
              {param.required && (
                <span className="text-red-500 text-sm">*</span>
              )}
              <span className={`text-xs px-2 py-0.5 rounded ${
                param.type === 'code' ? 'bg-green-100 text-green-700' :
                param.type === 'file' || param.type === 'files' ? 'bg-blue-100 text-blue-700' :
                param.type === 'number' ? 'bg-orange-100 text-orange-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {param.type}
              </span>
            </div>
            <p className="text-xs text-gray-600 mb-2">
              {param.description}
            </p>
          </label>
          
          {renderInput(param)}
        </div>
      ))}

      <div className="pt-4 border-t">
        <button
          onClick={() => {
            const defaults: Record<string, any> = {};
            template.parameters.forEach(param => {
              if (param.defaultValue) {
                defaults[param.name] = param.defaultValue;
              }
            });
            onParametersChange(defaults);
          }}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          🔄 重置为默认值
        </button>
      </div>
    </div>
  );
}
