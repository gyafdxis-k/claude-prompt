'use client';

import { useState, useEffect } from 'react';
import { PromptTemplate, Variable } from '@/lib/templates/templates';
import { templateEngine } from '@/lib/template-engine';
import Editor from '@monaco-editor/react';

interface TemplateFormProps {
  template: PromptTemplate;
  onSubmit: (prompt: string, values: Record<string, any>) => void;
  isLoading?: boolean;
}

export default function TemplateForm({ template, onSubmit, isLoading }: TemplateFormProps) {
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const defaults = templateEngine.getVariableDefaults(template);
    setValues(defaults);
    setErrors([]);
  }, [template]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = templateEngine.validate(template, values);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    
    const prompt = templateEngine.render(template, values);
    onSubmit(prompt, values);
    setErrors([]);
  };

  const renderInput = (variable: Variable) => {
    const value = values[variable.name] || '';
    
    switch (variable.type) {
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => setValues({ ...values, [variable.name]: e.target.value })}
            placeholder={variable.placeholder}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        );
      
      case 'code':
        return (
          <div className="border border-gray-300 rounded-md overflow-hidden">
            <Editor
              height="200px"
              defaultLanguage="typescript"
              value={value}
              onChange={(val) => setValues({ ...values, [variable.name]: val || '' })}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true
              }}
              theme="vs-light"
            />
          </div>
        );
      
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => setValues({ ...values, [variable.name]: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {variable.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => setValues({ ...values, [variable.name]: e.target.value })}
            placeholder={variable.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <span>{template.icon}</span>
            <span>{template.name}</span>
          </h1>
          <p className="text-gray-600 mt-1">{template.description}</p>
        </div>

        {errors.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 font-medium mb-1">请修正以下错误：</p>
            <ul className="list-disc list-inside text-red-700 text-sm">
              {errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {template.variables.map((variable) => (
            <div key={variable.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {variable.label}
                {variable.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {renderInput(variable)}
            </div>
          ))}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isLoading ? '处理中...' : '发送给 Claude'}
            </button>
            
            <button
              type="button"
              onClick={() => setValues(templateEngine.getVariableDefaults(template))}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              重置
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
