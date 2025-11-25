'use client';

import { useState } from 'react';
import { PROMPT_CATEGORIES, getCategoriesByIds, CATEGORY_COLORS, PromptCategory } from '@/lib/categories';

interface CategorySelectorProps {
  selectedCategories: string[];
  onChange: (categories: string[]) => void;
  multiple?: boolean;
  required?: boolean;
}

export default function CategorySelector({ 
  selectedCategories, 
  onChange, 
  multiple = true,
  required = false 
}: CategorySelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggleCategory = (categoryId: string) => {
    if (multiple) {
      if (selectedCategories.includes(categoryId)) {
        const newCategories = selectedCategories.filter(id => id !== categoryId);
        if (!required || newCategories.length > 0) {
          onChange(newCategories);
        }
      } else {
        onChange([...selectedCategories, categoryId]);
      }
    } else {
      onChange([categoryId]);
      setIsExpanded(false);
    }
  };

  const selectedCategoryObjects = getCategoriesByIds(selectedCategories);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          分类标签 {required && <span className="text-red-500">*</span>}
        </label>
        {multiple && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            {isExpanded ? '收起' : '展开全部'}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50 min-h-[48px]">
        {selectedCategoryObjects.length > 0 ? (
          selectedCategoryObjects.map(category => (
            <CategoryBadge
              key={category.id}
              category={category}
              selected={true}
              onClick={() => handleToggleCategory(category.id)}
              removable={!required || selectedCategories.length > 1}
            />
          ))
        ) : (
          <span className="text-sm text-gray-400">
            {multiple ? '点击下方选择分类标签' : '选择一个分类'}
          </span>
        )}
      </div>

      <div className={`grid gap-2 transition-all ${isExpanded || !multiple ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {PROMPT_CATEGORIES.map(category => {
          const isSelected = selectedCategories.includes(category.id);
          if (isSelected && !isExpanded && multiple) return null;

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => handleToggleCategory(category.id)}
              className={`
                px-3 py-2 rounded-lg border-2 text-left transition-all text-sm
                ${isSelected
                  ? `${CATEGORY_COLORS[category.color]} border-current shadow-sm`
                  : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                }
              `}
              title={category.description}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{category.icon}</span>
                <span className="font-medium">{category.name}</span>
              </div>
            </button>
          );
        })}
      </div>

      {multiple && selectedCategories.length > 0 && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>已选择 {selectedCategories.length} 个分类</span>
          {selectedCategories.length > 1 && !required && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-red-600 hover:text-red-800"
            >
              清空所有
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface CategoryBadgeProps {
  category: PromptCategory;
  selected: boolean;
  onClick: () => void;
  removable?: boolean;
}

function CategoryBadge({ category, selected, onClick, removable = true }: CategoryBadgeProps) {
  if (removable) {
    return (
      <span
        className={`
          inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border
          transition-all
          ${selected ? CATEGORY_COLORS[category.color] : 'bg-gray-100 text-gray-700 border-gray-200'}
        `}
        title={category.description}
      >
        <button
          type="button"
          onClick={onClick}
          className="inline-flex items-center gap-1.5 hover:opacity-80"
        >
          <span>{category.icon}</span>
          <span>{category.name}</span>
        </button>
        <button
          type="button"
          className="ml-1 hover:text-red-600"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          ×
        </button>
      </span>
    );
  }
  
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border
        transition-all cursor-pointer
        ${selected ? CATEGORY_COLORS[category.color] : 'bg-gray-100 text-gray-700 border-gray-200'}
        hover:opacity-80
      `}
      onClick={onClick}
      title={category.description}
    >
      <span>{category.icon}</span>
      <span>{category.name}</span>
    </span>
  );
}
