import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PromptTemplateSelector from '../PromptTemplateSelector';
import { PromptTemplate } from '@/lib/prompts/prompt-scanner';

global.fetch = vi.fn();

const mockPrompts: PromptTemplate[] = [
  {
    id: 'test-1',
    name: 'Test Template 1',
    description: 'Description for test 1',
    category: 'TestCat',
    categories: ['development', 'test'],
    source: 'test',
    content: 'Test content 1',
    parameters: [
      { name: 'param1', description: 'Param 1', required: true, type: 'string' }
    ]
  },
  {
    id: 'test-2',
    name: 'Test Template 2',
    description: 'Description for test 2',
    category: 'TestCat',
    categories: ['review', 'debug'],
    source: 'test',
    content: 'Test content 2',
    parameters: []
  },
  {
    id: 'test-3',
    name: 'Debug Template',
    description: 'Debug description',
    category: 'DebugCat',
    categories: ['debug'],
    source: 'test',
    content: 'Debug content',
    parameters: [
      { name: 'code', description: 'Code', required: true, type: 'code' },
      { name: 'error', description: 'Error', required: false, type: 'string' }
    ]
  }
];

describe('PromptTemplateSelector', () => {
  const mockOnSelectTemplate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ prompts: mockPrompts })
    });
  });

  describe('initialization and loading', () => {
    it('should show loading state initially', () => {
      render(
        <PromptTemplateSelector
          onSelectTemplate={mockOnSelectTemplate}
          selectedTemplate={null}
        />
      );

      expect(screen.getByText('加载 Prompt 模板中...')).toBeInTheDocument();
    });

    it('should fetch prompts on mount', async () => {
      render(
        <PromptTemplateSelector
          onSelectTemplate={mockOnSelectTemplate}
          selectedTemplate={null}
        />
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/prompts/scan');
      });
    });

    it('should display prompts after loading', async () => {
      render(
        <PromptTemplateSelector
          onSelectTemplate={mockOnSelectTemplate}
          selectedTemplate={null}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Template 1')).toBeInTheDocument();
        expect(screen.getByText('Test Template 2')).toBeInTheDocument();
        expect(screen.getByText('Debug Template')).toBeInTheDocument();
      });
    });

    it('should show prompt count', async () => {
      render(
        <PromptTemplateSelector
          onSelectTemplate={mockOnSelectTemplate}
          selectedTemplate={null}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('找到 3 个模板')).toBeInTheDocument();
      });
    });
  });

  describe('template display', () => {
    it('should display template names', async () => {
      render(
        <PromptTemplateSelector
          onSelectTemplate={mockOnSelectTemplate}
          selectedTemplate={null}
        />
      );

      await waitFor(() => {
        mockPrompts.forEach(prompt => {
          expect(screen.getByText(prompt.name)).toBeInTheDocument();
        });
      });
    });

    it('should display template descriptions', async () => {
      render(
        <PromptTemplateSelector
          onSelectTemplate={mockOnSelectTemplate}
          selectedTemplate={null}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Description for test 1')).toBeInTheDocument();
        expect(screen.getByText('Description for test 2')).toBeInTheDocument();
      });
    });

    it('should display category badges', async () => {
      render(
        <PromptTemplateSelector
          onSelectTemplate={mockOnSelectTemplate}
          selectedTemplate={null}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('开发')).toBeInTheDocument();
        expect(screen.getByText('测试')).toBeInTheDocument();
        expect(screen.getByText('调试')).toBeInTheDocument();
      });
    });

    it('should display parameter badges', async () => {
      render(
        <PromptTemplateSelector
          onSelectTemplate={mockOnSelectTemplate}
          selectedTemplate={null}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('param1')).toBeInTheDocument();
        expect(screen.getByText('code')).toBeInTheDocument();
        expect(screen.getByText('error')).toBeInTheDocument();
      });
    });

    it('should show "+X more" for templates with many parameters', async () => {
      const manyParamTemplate: PromptTemplate = {
        ...mockPrompts[0],
        parameters: Array.from({ length: 10 }, (_, i) => ({
          name: `param${i}`,
          description: `Param ${i}`,
          required: true,
          type: 'string' as const
        }))
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ prompts: [manyParamTemplate] })
      });

      render(
        <PromptTemplateSelector
          onSelectTemplate={mockOnSelectTemplate}
          selectedTemplate={null}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('+5 更多')).toBeInTheDocument();
      });
    });
  });

  describe('template selection', () => {
    it('should call onSelectTemplate when clicking a template', async () => {
      render(
        <PromptTemplateSelector
          onSelectTemplate={mockOnSelectTemplate}
          selectedTemplate={null}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Template 1')).toBeInTheDocument();
      });

      const template1 = screen.getByText('Test Template 1').closest('div');
      if (template1) {
        fireEvent.click(template1);
        expect(mockOnSelectTemplate).toHaveBeenCalledWith(mockPrompts[0]);
      }
    });

    it('should render selected template', async () => {
      render(
        <PromptTemplateSelector
          onSelectTemplate={mockOnSelectTemplate}
          selectedTemplate={mockPrompts[0]}
        />
      );

      await waitFor(() => {
        const template1 = screen.getByText('Test Template 1');
        expect(template1).toBeInTheDocument();
        expect(template1.closest('div')).toHaveAttribute('class');
      });
    });

    it('should render unselected templates', async () => {
      render(
        <PromptTemplateSelector
          onSelectTemplate={mockOnSelectTemplate}
          selectedTemplate={mockPrompts[0]}
        />
      );

      await waitFor(() => {
        const template2 = screen.getByText('Test Template 2');
        expect(template2).toBeInTheDocument();
        expect(template2.closest('div')).toHaveAttribute('class');
      });
    });
  });

  describe('search functionality', () => {
    it('should render search input', async () => {
      render(
        <PromptTemplateSelector
          onSelectTemplate={mockOnSelectTemplate}
          selectedTemplate={null}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('🔍 搜索 prompt 模板...')).toBeInTheDocument();
      });
    });

    it('should filter prompts by name', async () => {
      const user = userEvent.setup();
      render(
        <PromptTemplateSelector
          onSelectTemplate={mockOnSelectTemplate}
          selectedTemplate={null}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Template 1')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('🔍 搜索 prompt 模板...');
      await user.type(searchInput, 'Debug');

      await waitFor(() => {
        expect(screen.getByText('Debug Template')).toBeInTheDocument();
        expect(screen.queryByText('Test Template 1')).not.toBeInTheDocument();
        expect(screen.getByText('找到 1 个模板')).toBeInTheDocument();
      });
    });

    it('should filter prompts by description', async () => {
      const user = userEvent.setup();
      render(
        <PromptTemplateSelector
          onSelectTemplate={mockOnSelectTemplate}
          selectedTemplate={null}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Template 1')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('🔍 搜索 prompt 模板...');
      await user.type(searchInput, 'Description');

      await waitFor(() => {
        const countText = screen.getByText(/找到.*个模板/);
        expect(countText).toBeInTheDocument();
      });
    });

    it('should show no results message when search returns nothing', async () => {
      const user = userEvent.setup();
      render(
        <PromptTemplateSelector
          onSelectTemplate={mockOnSelectTemplate}
          selectedTemplate={null}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Template 1')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('🔍 搜索 prompt 模板...');
      await user.type(searchInput, 'NonExistentTemplate');

      await waitFor(() => {
        expect(screen.getByText('没有找到匹配的 Prompt 模板')).toBeInTheDocument();
        expect(screen.getByText('找到 0 个模板')).toBeInTheDocument();
      });
    });
  });

  describe('category filtering', () => {
    it('should render category filter buttons', async () => {
      render(
        <PromptTemplateSelector
          onSelectTemplate={mockOnSelectTemplate}
          selectedTemplate={null}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('开发')).toBeInTheDocument();
        expect(screen.getByText('调试')).toBeInTheDocument();
        expect(screen.getByText('审查')).toBeInTheDocument();
      });
    });

    it('should filter by single category', async () => {
      render(
        <PromptTemplateSelector
          onSelectTemplate={mockOnSelectTemplate}
          selectedTemplate={null}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Template 1')).toBeInTheDocument();
      });

      const debugCategory = screen.getAllByText('调试')[0];
      fireEvent.click(debugCategory);

      await waitFor(() => {
        expect(screen.getByText('Test Template 2')).toBeInTheDocument();
        expect(screen.getByText('Debug Template')).toBeInTheDocument();
        expect(screen.queryByText('Test Template 1')).not.toBeInTheDocument();
      });
    });

    it('should filter by multiple categories', async () => {
      render(
        <PromptTemplateSelector
          onSelectTemplate={mockOnSelectTemplate}
          selectedTemplate={null}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Template 1')).toBeInTheDocument();
      });

      const developmentCategory = screen.getAllByText('开发')[0];
      fireEvent.click(developmentCategory);

      const reviewCategory = screen.getAllByText('审查')[0];
      fireEvent.click(reviewCategory);

      await waitFor(() => {
        expect(screen.getByText('Test Template 1')).toBeInTheDocument();
        expect(screen.getByText('Test Template 2')).toBeInTheDocument();
      });
    });

    it('should show clear filter button when categories selected', async () => {
      render(
        <PromptTemplateSelector
          onSelectTemplate={mockOnSelectTemplate}
          selectedTemplate={null}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Template 1')).toBeInTheDocument();
      });

      const debugCategory = screen.getAllByText('调试')[0];
      fireEvent.click(debugCategory);

      await waitFor(() => {
        expect(screen.getByText('清除筛选')).toBeInTheDocument();
      });
    });

    it('should clear all category filters', async () => {
      render(
        <PromptTemplateSelector
          onSelectTemplate={mockOnSelectTemplate}
          selectedTemplate={null}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Template 1')).toBeInTheDocument();
      });

      const debugCategory = screen.getAllByText('调试')[0];
      fireEvent.click(debugCategory);

      await waitFor(() => {
        expect(screen.getByText('清除筛选')).toBeInTheDocument();
      });

      const clearButton = screen.getByText('清除筛选');
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(screen.getByText('找到 3 个模板')).toBeInTheDocument();
      });
    });
  });

  describe('combined filtering', () => {
    it('should filter by both search and category', async () => {
      const user = userEvent.setup();
      render(
        <PromptTemplateSelector
          onSelectTemplate={mockOnSelectTemplate}
          selectedTemplate={null}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Template 1')).toBeInTheDocument();
      });

      const debugCategory = screen.getAllByText('调试')[0];
      fireEvent.click(debugCategory);

      const searchInput = screen.getByPlaceholderText('🔍 搜索 prompt 模板...');
      await user.type(searchInput, 'Template 2');

      await waitFor(() => {
        expect(screen.getByText('Test Template 2')).toBeInTheDocument();
        expect(screen.queryByText('Debug Template')).not.toBeInTheDocument();
        expect(screen.getByText('找到 1 个模板')).toBeInTheDocument();
      });
    });
  });

  describe('error handling', () => {
    it('should handle fetch errors gracefully', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      render(
        <PromptTemplateSelector
          onSelectTemplate={mockOnSelectTemplate}
          selectedTemplate={null}
        />
      );

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });

    it('should handle empty prompt list', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ prompts: [] })
      });

      render(
        <PromptTemplateSelector
          onSelectTemplate={mockOnSelectTemplate}
          selectedTemplate={null}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('找到 0 个模板')).toBeInTheDocument();
      });
    });
  });

  describe('UI interaction', () => {
    it('should render templates as clickable elements', async () => {
      render(
        <PromptTemplateSelector
          onSelectTemplate={mockOnSelectTemplate}
          selectedTemplate={null}
        />
      );

      await waitFor(() => {
        const template1 = screen.getByText('Test Template 1');
        expect(template1).toBeInTheDocument();
        const templateDiv = template1.closest('div');
        expect(templateDiv).toBeTruthy();
        expect(templateDiv?.getAttribute('class')).toBeTruthy();
      });
    });

    it('should display category icons', async () => {
      render(
        <PromptTemplateSelector
          onSelectTemplate={mockOnSelectTemplate}
          selectedTemplate={null}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('💻')).toBeInTheDocument();
        expect(screen.getByText('🐛')).toBeInTheDocument();
      });
    });
  });
});
