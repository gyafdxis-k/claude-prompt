'use client';

import { useState, useEffect } from 'react';
import { PromptTemplate } from '@/lib/prompts/prompt-scanner';

interface PromptTemplateSelectorProps {
  onSelectTemplate: (template: PromptTemplate) => void;
  selectedTemplate: PromptTemplate | null;
}

export default function PromptTemplateSelector({ onSelectTemplate, selectedTemplate }: PromptTemplateSelectorProps) {
  const [prompts, setPrompts] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
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
        
        const uniqueCategories = Array.from(new Set(data.prompts.map((p: PromptTemplate) => p.category)));
        setCategories(['all', ...uniqueCategories]);
      }
    } catch (error) {
      console.error('加载 prompt 模板失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPrompts = prompts.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
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

        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {cat === 'all' ? '全部' : cat}
            </button>
          ))}
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
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-bold text-gray-800">{prompt.name}</h3>
              <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                {prompt.category}
              </span>
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
