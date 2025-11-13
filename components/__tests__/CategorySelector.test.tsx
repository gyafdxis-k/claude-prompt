import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CategorySelector from '../CategorySelector';
import { PROMPT_CATEGORIES } from '@/lib/categories';

describe('CategorySelector', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('rendering', () => {
    it('should render with no categories selected', () => {
      render(
        <CategorySelector
          selectedCategories={[]}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('分类标签')).toBeInTheDocument();
      expect(screen.getByText('点击下方选择分类标签')).toBeInTheDocument();
    });

    it('should render with selected categories', () => {
      render(
        <CategorySelector
          selectedCategories={['development', 'test']}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('开发')).toBeInTheDocument();
      expect(screen.getByText('测试')).toBeInTheDocument();
    });

    it('should render all category buttons', () => {
      render(
        <CategorySelector
          selectedCategories={[]}
          onChange={mockOnChange}
        />
      );

      PROMPT_CATEGORIES.forEach(category => {
        expect(screen.getByText(category.name)).toBeInTheDocument();
      });
    });

    it('should show required indicator when required', () => {
      render(
        <CategorySelector
          selectedCategories={[]}
          onChange={mockOnChange}
          required={true}
        />
      );

      const requiredIndicator = screen.getByText('*');
      expect(requiredIndicator).toBeInTheDocument();
      expect(requiredIndicator).toHaveClass('text-red-500');
    });

    it('should show expand/collapse button in multiple mode', () => {
      render(
        <CategorySelector
          selectedCategories={[]}
          onChange={mockOnChange}
          multiple={true}
        />
      );

      expect(screen.getByText('展开全部')).toBeInTheDocument();
    });

    it('should not show expand button in single mode', () => {
      render(
        <CategorySelector
          selectedCategories={[]}
          onChange={mockOnChange}
          multiple={false}
        />
      );

      expect(screen.queryByText('展开全部')).not.toBeInTheDocument();
    });
  });

  describe('multiple selection mode', () => {
    it('should allow selecting multiple categories', () => {
      render(
        <CategorySelector
          selectedCategories={['development']}
          onChange={mockOnChange}
          multiple={true}
        />
      );

      const testButton = screen.getByTitle(
        PROMPT_CATEGORIES.find(c => c.id === 'test')?.description || ''
      );
      fireEvent.click(testButton);

      expect(mockOnChange).toHaveBeenCalledWith(['development', 'test']);
    });

    it('should allow deselecting categories', () => {
      render(
        <CategorySelector
          selectedCategories={['development', 'test']}
          onChange={mockOnChange}
          multiple={true}
        />
      );

      const developmentBadge = screen.getByText('开发').closest('span');
      expect(developmentBadge).toBeInTheDocument();
      
      if (developmentBadge) {
        fireEvent.click(developmentBadge);
        expect(mockOnChange).toHaveBeenCalledWith(['test']);
      }
    });

    it('should prevent deselecting last category when required', () => {
      render(
        <CategorySelector
          selectedCategories={['development']}
          onChange={mockOnChange}
          multiple={true}
          required={true}
        />
      );

      const developmentBadge = screen.getByText('开发').closest('span');
      
      if (developmentBadge) {
        fireEvent.click(developmentBadge);
        expect(mockOnChange).not.toHaveBeenCalled();
      }
    });

    it('should show count of selected categories', () => {
      render(
        <CategorySelector
          selectedCategories={['development', 'test', 'review']}
          onChange={mockOnChange}
          multiple={true}
        />
      );

      expect(screen.getByText('已选择 3 个分类')).toBeInTheDocument();
    });

    it('should show clear all button when multiple selected', () => {
      render(
        <CategorySelector
          selectedCategories={['development', 'test']}
          onChange={mockOnChange}
          multiple={true}
        />
      );

      const clearButton = screen.getByText('清空所有');
      expect(clearButton).toBeInTheDocument();
      
      fireEvent.click(clearButton);
      expect(mockOnChange).toHaveBeenCalledWith([]);
    });

    it('should not show clear all button when required and multiple selected', () => {
      render(
        <CategorySelector
          selectedCategories={['development', 'test']}
          onChange={mockOnChange}
          multiple={true}
          required={true}
        />
      );

      expect(screen.queryByText('清空所有')).not.toBeInTheDocument();
    });
  });

  describe('single selection mode', () => {
    it('should replace selection in single mode', () => {
      render(
        <CategorySelector
          selectedCategories={['development']}
          onChange={mockOnChange}
          multiple={false}
        />
      );

      const testButton = screen.getByTitle(
        PROMPT_CATEGORIES.find(c => c.id === 'test')?.description || ''
      );
      fireEvent.click(testButton);

      expect(mockOnChange).toHaveBeenCalledWith(['test']);
    });

    it('should show single selection prompt when empty', () => {
      render(
        <CategorySelector
          selectedCategories={[]}
          onChange={mockOnChange}
          multiple={false}
        />
      );

      expect(screen.getByText('选择一个分类')).toBeInTheDocument();
    });
  });

  describe('expand/collapse functionality', () => {
    it('should toggle expanded state', () => {
      render(
        <CategorySelector
          selectedCategories={['development']}
          onChange={mockOnChange}
          multiple={true}
        />
      );

      const expandButton = screen.getByText('展开全部');
      fireEvent.click(expandButton);

      expect(screen.getByText('收起')).toBeInTheDocument();
    });
  });

  describe('category badges', () => {
    it('should display category icons', () => {
      render(
        <CategorySelector
          selectedCategories={['development']}
          onChange={mockOnChange}
        />
      );

      const devCategory = PROMPT_CATEGORIES.find(c => c.id === 'development');
      expect(screen.getByText(devCategory?.icon || '')).toBeInTheDocument();
    });

    it('should show remove button on badges when removable', () => {
      render(
        <CategorySelector
          selectedCategories={['development', 'test']}
          onChange={mockOnChange}
          multiple={true}
        />
      );

      const badges = screen.getAllByText('×');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('should remove category when clicking badge remove button', () => {
      render(
        <CategorySelector
          selectedCategories={['development', 'test']}
          onChange={mockOnChange}
          multiple={true}
        />
      );

      const removeButtons = screen.getAllByText('×');
      fireEvent.click(removeButtons[0]);

      expect(mockOnChange).toHaveBeenCalledWith(['test']);
    });
  });

  describe('styling and CSS classes', () => {
    it('should apply selected styling to selected categories', () => {
      render(
        <CategorySelector
          selectedCategories={['development']}
          onChange={mockOnChange}
        />
      );

      const devButton = screen.getByTitle(
        PROMPT_CATEGORIES.find(c => c.id === 'development')?.description || ''
      );
      
      const classes = devButton.getAttribute('class') || '';
      expect(classes.length).toBeGreaterThan(0);
    });

    it('should apply hover styling to unselected categories', () => {
      render(
        <CategorySelector
          selectedCategories={[]}
          onChange={mockOnChange}
        />
      );

      const devButton = screen.getByTitle(
        PROMPT_CATEGORIES.find(c => c.id === 'development')?.description || ''
      );
      
      const classes = devButton.getAttribute('class') || '';
      expect(classes).toContain('border');
    });
  });

  describe('accessibility', () => {
    it('should have descriptive titles on category buttons', () => {
      render(
        <CategorySelector
          selectedCategories={[]}
          onChange={mockOnChange}
        />
      );

      PROMPT_CATEGORIES.forEach(category => {
        const button = screen.getByTitle(category.description);
        expect(button).toBeInTheDocument();
      });
    });

    it('should be keyboard accessible', () => {
      render(
        <CategorySelector
          selectedCategories={[]}
          onChange={mockOnChange}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty categories array', () => {
      render(
        <CategorySelector
          selectedCategories={[]}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('点击下方选择分类标签')).toBeInTheDocument();
    });

    it('should handle invalid category ids gracefully', () => {
      render(
        <CategorySelector
          selectedCategories={['invalid-id', 'development']}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('开发')).toBeInTheDocument();
    });

    it('should handle rapid clicks', () => {
      render(
        <CategorySelector
          selectedCategories={[]}
          onChange={mockOnChange}
          multiple={true}
        />
      );

      const testButton = screen.getByTitle(
        PROMPT_CATEGORIES.find(c => c.id === 'test')?.description || ''
      );
      
      fireEvent.click(testButton);
      fireEvent.click(testButton);
      fireEvent.click(testButton);

      expect(mockOnChange).toHaveBeenCalledTimes(3);
    });
  });
});
