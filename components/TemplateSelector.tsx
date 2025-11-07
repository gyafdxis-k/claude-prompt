'use client';

import { templates, PromptTemplate } from '@/lib/templates/templates';

interface TemplateSelectorProps {
  selectedId: string | null;
  onSelect: (template: PromptTemplate) => void;
}

export default function TemplateSelector({ selectedId, onSelect }: TemplateSelectorProps) {
  const categories = [
    { id: 'development', name: '开发', icon: '🔨' },
    { id: 'review', name: 'Review', icon: '👀' },
    { id: 'refactor', name: '重构', icon: '♻️' },
    { id: 'docs', name: '文档', icon: '📚' },
    { id: 'test', name: '测试', icon: '🧪' }
  ] as const;

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-800">模版库</h2>
      </div>
      
      <div className="p-2">
        {categories.map((category) => {
          const categoryTemplates = templates.filter(t => t.category === category.id);
          
          return (
            <div key={category.id} className="mb-4">
              <div className="px-2 py-1 text-sm font-semibold text-gray-600 flex items-center gap-2">
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </div>
              
              <div className="space-y-1 mt-1">
                {categoryTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => onSelect(template)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedId === template.id
                        ? 'bg-blue-100 text-blue-800 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{template.icon}</span>
                      <span>{template.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
