import { describe, it, expect } from 'vitest';
import { 
  PROMPT_CATEGORIES, 
  getCategoryById, 
  getCategoriesByIds,
  CATEGORY_COLORS,
  PromptCategory 
} from '../categories';

describe('categories', () => {
  describe('PROMPT_CATEGORIES', () => {
    it('should have 13 categories', () => {
      expect(PROMPT_CATEGORIES).toHaveLength(13);
    });

    it('should have unique category ids', () => {
      const ids = PROMPT_CATEGORIES.map(c => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have all required fields for each category', () => {
      PROMPT_CATEGORIES.forEach(category => {
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('description');
        expect(category).toHaveProperty('icon');
        expect(category).toHaveProperty('color');
        
        expect(typeof category.id).toBe('string');
        expect(typeof category.name).toBe('string');
        expect(typeof category.description).toBe('string');
        expect(typeof category.icon).toBe('string');
        expect(typeof category.color).toBe('string');
        
        expect(category.id.length).toBeGreaterThan(0);
        expect(category.name.length).toBeGreaterThan(0);
        expect(category.description.length).toBeGreaterThan(0);
        expect(category.icon.length).toBeGreaterThan(0);
        expect(category.color.length).toBeGreaterThan(0);
      });
    });

    it('should include expected core categories', () => {
      const categoryIds = PROMPT_CATEGORIES.map(c => c.id);
      
      expect(categoryIds).toContain('development');
      expect(categoryIds).toContain('debug');
      expect(categoryIds).toContain('review');
      expect(categoryIds).toContain('refactor');
      expect(categoryIds).toContain('test');
      expect(categoryIds).toContain('documentation');
      expect(categoryIds).toContain('ai');
      expect(categoryIds).toContain('custom');
    });

    it('should have valid colors in CATEGORY_COLORS', () => {
      PROMPT_CATEGORIES.forEach(category => {
        expect(CATEGORY_COLORS).toHaveProperty(category.color);
        expect(typeof CATEGORY_COLORS[category.color]).toBe('string');
      });
    });
  });

  describe('getCategoryById', () => {
    it('should return category when id exists', () => {
      const category = getCategoryById('development');
      
      expect(category).toBeDefined();
      expect(category?.id).toBe('development');
      expect(category?.name).toBe('开发');
      expect(category?.icon).toBe('💻');
    });

    it('should return undefined when id does not exist', () => {
      const category = getCategoryById('non-existent-id');
      expect(category).toBeUndefined();
    });

    it('should handle empty string', () => {
      const category = getCategoryById('');
      expect(category).toBeUndefined();
    });

    it('should return correct category for all valid ids', () => {
      PROMPT_CATEGORIES.forEach(expectedCategory => {
        const foundCategory = getCategoryById(expectedCategory.id);
        expect(foundCategory).toEqual(expectedCategory);
      });
    });
  });

  describe('getCategoriesByIds', () => {
    it('should return empty array for empty input', () => {
      const categories = getCategoriesByIds([]);
      expect(categories).toEqual([]);
    });

    it('should return single category for single id', () => {
      const categories = getCategoriesByIds(['debug']);
      
      expect(categories).toHaveLength(1);
      expect(categories[0].id).toBe('debug');
      expect(categories[0].name).toBe('调试');
    });

    it('should return multiple categories for multiple ids', () => {
      const categories = getCategoriesByIds(['development', 'test', 'review']);
      
      expect(categories).toHaveLength(3);
      expect(categories.map(c => c.id)).toEqual(['development', 'test', 'review']);
    });

    it('should filter out invalid ids', () => {
      const categories = getCategoriesByIds([
        'development',
        'invalid-id',
        'test',
        'another-invalid'
      ]);
      
      expect(categories).toHaveLength(2);
      expect(categories.map(c => c.id)).toEqual(['development', 'test']);
    });

    it('should handle all invalid ids', () => {
      const categories = getCategoriesByIds(['invalid1', 'invalid2']);
      expect(categories).toEqual([]);
    });

    it('should preserve order of input ids', () => {
      const ids = ['test', 'development', 'debug'];
      const categories = getCategoriesByIds(ids);
      
      expect(categories.map(c => c.id)).toEqual(ids);
    });

    it('should handle duplicate ids', () => {
      const categories = getCategoriesByIds(['development', 'development', 'test']);
      
      expect(categories).toHaveLength(3);
      expect(categories[0].id).toBe('development');
      expect(categories[1].id).toBe('development');
      expect(categories[2].id).toBe('test');
    });
  });

  describe('CATEGORY_COLORS', () => {
    it('should have color classes for all category colors', () => {
      const uniqueColors = new Set(PROMPT_CATEGORIES.map(c => c.color));
      
      uniqueColors.forEach(color => {
        expect(CATEGORY_COLORS).toHaveProperty(color);
      });
    });

    it('should have valid Tailwind CSS classes', () => {
      Object.values(CATEGORY_COLORS).forEach(colorClass => {
        expect(colorClass).toContain('bg-');
        expect(colorClass).toContain('text-');
        expect(colorClass).toContain('border-');
      });
    });

    it('should have all expected color keys', () => {
      const expectedColors = [
        'blue', 'red', 'purple', 'green', 'yellow',
        'indigo', 'gray', 'teal', 'orange', 'pink',
        'cyan', 'violet', 'slate'
      ];

      expectedColors.forEach(color => {
        expect(CATEGORY_COLORS).toHaveProperty(color);
      });
    });
  });

  describe('Category structure validation', () => {
    it('should have consistent emoji usage in icons', () => {
      PROMPT_CATEGORIES.forEach(category => {
        const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
        expect(emojiRegex.test(category.icon)).toBe(true);
      });
    });

    it('should have non-empty descriptions', () => {
      PROMPT_CATEGORIES.forEach(category => {
        expect(category.description.length).toBeGreaterThan(5);
      });
    });

    it('should have valid id format (lowercase, no spaces)', () => {
      PROMPT_CATEGORIES.forEach(category => {
        expect(category.id).toMatch(/^[a-z_]+$/);
        expect(category.id).not.toContain(' ');
      });
    });
  });
});
