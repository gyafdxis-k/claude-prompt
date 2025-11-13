'use client';

import { useState, useEffect } from 'react';
import { PromptTemplate } from '@/lib/prompts/prompt-scanner';
import { PROMPT_CATEGORIES, getCategoriesByIds, CATEGORY_COLORS } from '@/lib/categories';

interface PromptTemplateSelectorProps {
  onSelectTemplate: (template: PromptTemplate) => void;
  selectedTemplate: PromptTemplate | null;
}

export default function PromptTemplateSelector({ onSelectTemplate, selectedTemplate }: PromptTemplateSelectorProps) {
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/prompts/scan');
      const data = await response.json();
      
      if (data.prompts) {
        setPrompts(data.prompts);
      }
    } catch (error) {
      console.error('加载 prompt 模板失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const filteredPrompts = prompts.filter(p => {
    const matchesCategory = selectedCategories.length === 0 || 
      (p.categories && p.categories.some(cat => selectedCategories.includes(cat)));
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载 Prompt 模板中...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b space-y-3">
        <div>
          <input
            type="text"
            placeholder="🔍 搜索 prompt 模板..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-700">分类筛选</span>
            {selectedCategories.length > 0 && (
              <button
                onClick={() => setSelectedCategories([])}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                清除筛选
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PROMPT_CATEGORIES.map(cat => {
              const isSelected = selectedCategories.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  data-testid={`category-filter-${cat.id}`}
                  className={`px-2 py-1 rounded-md text-xs font-medium border transition-all ${
                    isSelected
                      ? `${CATEGORY_COLORS[cat.color]} border-current`
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                  title={cat.description}
                >
                  <span className="mr-1">{cat.icon}</span>
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="text-sm text-gray-600">
          找到 {filteredPrompts.length} 个模板
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredPrompts.map(prompt => (
          <div
            key={prompt.id}
            onClick={() => onSelectTemplate(prompt)}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              selectedTemplate?.id === prompt.id
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-blue-300 hover:shadow'
            }`}
          >
            <div className="mb-2">
              <h3 className="font-bold text-gray-800 mb-1">{prompt.name}</h3>
              {prompt.categories && prompt.categories.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {getCategoriesByIds(prompt.categories).map(cat => (
                    <span
                      key={cat.id}
                      className={`text-xs px-2 py-0.5 rounded border ${CATEGORY_COLORS[cat.color]}`}
                    >
                      {cat.icon} {cat.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
              {prompt.description}
            </p>

            {prompt.parameters.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {prompt.parameters.slice(0, 5).map(param => (
                  <span
                    key={param.name}
                    className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded"
                  >
                    {param.name}
                  </span>
                ))}
                {prompt.parameters.length > 5 && (
                  <span className="text-xs text-gray-500">
                    +{prompt.parameters.length - 5} 更多
                  </span>
                )}
              </div>
            )}
          </div>
        ))}

        {filteredPrompts.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            没有找到匹配的 Prompt 模板
          </div>
        )}
      </div>
    </div>
  );
}
