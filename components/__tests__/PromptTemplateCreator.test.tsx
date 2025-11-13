import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PromptTemplateCreator from '../PromptTemplateCreator';

global.fetch = vi.fn();
global.alert = vi.fn();

describe('PromptTemplateCreator', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({})
    });
  });

  describe('rendering', () => {
    it('should not render when isOpen is false', () => {
      const { container } = render(
        <PromptTemplateCreator
          isOpen={false}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render when isOpen is true', () => {
      render(
        <PromptTemplateCreator
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('创建新 Prompt 模板')).toBeInTheDocument();
    });

    it('should render all form fields', () => {
      render(
        <PromptTemplateCreator
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText(/模板名称/)).toBeInTheDocument();
      expect(screen.getByText(/描述/)).toBeInTheDocument();
      expect(screen.getByText(/分类标签/)).toBeInTheDocument();
      expect(screen.getByText(/Prompt 内容/)).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      render(
        <PromptTemplateCreator
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('取消')).toBeInTheDocument();
      expect(screen.getByText('保存模板')).toBeInTheDocument();
    });
  });

  describe('form interactions', () => {
    it('should update name field', async () => {
      const user = userEvent.setup();
      render(
        <PromptTemplateCreator
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = screen.getByPlaceholderText(/例如: Python 代码审查/);
      await user.type(nameInput, 'Test Template');

      expect(nameInput).toHaveValue('Test Template');
    });

    it('should update description field', async () => {
      const user = userEvent.setup();
      render(
        <PromptTemplateCreator
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const descInput = screen.getByPlaceholderText(/简短描述这个模板的用途/);
      await user.type(descInput, 'Test description');

      expect(descInput).toHaveValue('Test description');
    });

    it('should update content field', async () => {
      render(
        <PromptTemplateCreator
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const contentInput = screen.getByPlaceholderText(/输入 prompt 内容/) as HTMLTextAreaElement;
      fireEvent.change(contentInput, { target: { value: 'Test content with ${variable}' } });

      expect(contentInput.value).toBe('Test content with ${variable}');
    });
  });

  describe('parameter extraction', () => {
    it('should detect ${} parameters', async () => {
      render(
        <PromptTemplateCreator
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const contentInput = screen.getByPlaceholderText(/输入 prompt 内容/) as HTMLTextAreaElement;
      fireEvent.change(contentInput, { target: { value: 'Use ${param1} here' } });

      await waitFor(() => {
        expect(screen.getByText('param1')).toBeInTheDocument();
        expect(screen.getByText('🔍 检测到的参数 (1 个)')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should detect {{}} parameters', async () => {
      render(
        <PromptTemplateCreator
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const contentInput = screen.getByPlaceholderText(/输入 prompt 内容/) as HTMLTextAreaElement;
      fireEvent.change(contentInput, { target: { value: 'Use {{param2}} here' } });

      await waitFor(() => {
        expect(screen.getByText('param2')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should detect <> parameters', async () => {
      render(
        <PromptTemplateCreator
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const contentInput = screen.getByPlaceholderText(/输入 prompt 内容/) as HTMLTextAreaElement;
      fireEvent.change(contentInput, { target: { value: 'Use <param3> here' } });

      await waitFor(() => {
        expect(screen.getByText('param3')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should detect [] parameters', async () => {
      render(
        <PromptTemplateCreator
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const contentInput = screen.getByPlaceholderText(/输入 prompt 内容/) as HTMLTextAreaElement;
      fireEvent.change(contentInput, { target: { value: 'Use [param4] here' } });

      await waitFor(() => {
        expect(screen.getByText('param4')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should not duplicate parameters', async () => {
      render(
        <PromptTemplateCreator
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const contentInput = screen.getByPlaceholderText(/输入 prompt 内容/) as HTMLTextAreaElement;
      fireEvent.change(contentInput, { target: { value: '${duplicate} and ${duplicate}' } });

      await waitFor(() => {
        const paramElements = screen.queryAllByText(/duplicate/);
        expect(paramElements.length).toBeGreaterThan(0);
      });
    });

    it('should detect multiple different parameters', async () => {
      render(
        <PromptTemplateCreator
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const contentInput = screen.getByPlaceholderText(/输入 prompt 内容/) as HTMLTextAreaElement;
      fireEvent.change(contentInput, { target: { value: '${var1} {{var2}} <var3> [var4]' } });

      await waitFor(() => {
        expect(screen.getByText('var1')).toBeInTheDocument();
        expect(screen.getByText('var2')).toBeInTheDocument();
        expect(screen.getByText('var3')).toBeInTheDocument();
        expect(screen.getByText('var4')).toBeInTheDocument();
        expect(screen.getByText('🔍 检测到的参数 (4 个)')).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('form validation', () => {
    it('should show alert when name is empty', async () => {
      render(
        <PromptTemplateCreator
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const saveButton = screen.getByText('保存模板');
      fireEvent.click(saveButton);

      expect(global.alert).toHaveBeenCalledWith('请填写模板名称和内容');
    });

    it('should show alert when content is empty', async () => {
      const user = userEvent.setup();
      render(
        <PromptTemplateCreator
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = screen.getByPlaceholderText(/例如: Python 代码审查/);
      await user.type(nameInput, 'Test');

      const saveButton = screen.getByText('保存模板');
      fireEvent.click(saveButton);

      expect(global.alert).toHaveBeenCalledWith('请填写模板名称和内容');
    });

    it('should prevent saving when trying to remove required category', async () => {
      render(
        <PromptTemplateCreator
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = screen.getByPlaceholderText(/例如: Python 代码审查/);
      fireEvent.change(nameInput, { target: { value: 'Test Template' } });

      const contentInput = screen.getByPlaceholderText(/输入 prompt 内容/);
      fireEvent.change(contentInput, { target: { value: 'Test content' } });

      const customBadge = screen.getByText('自定义');
      expect(customBadge).toBeInTheDocument();

      fireEvent.click(customBadge.closest('span')!);

      await waitFor(() => {
        expect(screen.getByText('自定义')).toBeInTheDocument();
      });
    });
  });

  describe('save functionality', () => {
    it('should save template with valid data', async () => {
      const user = userEvent.setup();
      render(
        <PromptTemplateCreator
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = screen.getByPlaceholderText(/例如: Python 代码审查/);
      await user.type(nameInput, 'Test Template');

      const descInput = screen.getByPlaceholderText(/简短描述这个模板的用途/);
      await user.type(descInput, 'Test description');

      const contentInput = screen.getByPlaceholderText(/输入 prompt 内容/);
      await user.type(contentInput, 'Test content with ${param}');

      const saveButton = screen.getByText('保存模板');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/prompts/custom',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          })
        );
      });
    });

    it('should generate correct template structure', async () => {
      const user = userEvent.setup();
      render(
        <PromptTemplateCreator
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = screen.getByPlaceholderText(/例如: Python 代码审查/);
      await user.type(nameInput, 'Test Template');

      const contentInput = screen.getByPlaceholderText(/输入 prompt 内容/);
      fireEvent.change(contentInput, { target: { value: 'Content with ${param1}' } });

      const saveButton = screen.getByText('保存模板');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
        const fetchCall = (global.fetch as any).mock.calls[0];
        const body = JSON.parse(fetchCall[1].body);

        expect(body.name).toBe('Test Template');
        expect(body.content).toContain('param1');
        expect(body.categories).toEqual(['custom']);
        expect(body.parameters.length).toBeGreaterThan(0);
      });
    });

    it('should call onSave and onClose after successful save', async () => {
      const user = userEvent.setup();
      render(
        <PromptTemplateCreator
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = screen.getByPlaceholderText(/例如: Python 代码审查/);
      await user.type(nameInput, 'Test Template');

      const contentInput = screen.getByPlaceholderText(/输入 prompt 内容/);
      await user.type(contentInput, 'Test content');

      const saveButton = screen.getByText('保存模板');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should show alert on save failure', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false
      });

      const user = userEvent.setup();
      render(
        <PromptTemplateCreator
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = screen.getByPlaceholderText(/例如: Python 代码审查/);
      await user.type(nameInput, 'Test Template');

      const contentInput = screen.getByPlaceholderText(/输入 prompt 内容/);
      await user.type(contentInput, 'Test content');

      const saveButton = screen.getByText('保存模板');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('保存失败');
      });
    });

    it('should reset form after successful save', async () => {
      const user = userEvent.setup();
      render(
        <PromptTemplateCreator
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const nameInput = screen.getByPlaceholderText(/例如: Python 代码审查/) as HTMLInputElement;
      await user.type(nameInput, 'Test Template');

      const contentInput = screen.getByPlaceholderText(/输入 prompt 内容/) as HTMLTextAreaElement;
      await user.type(contentInput, 'Test content');

      const saveButton = screen.getByText('保存模板');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('close functionality', () => {
    it('should call onClose when close button clicked', () => {
      render(
        <PromptTemplateCreator
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when cancel button clicked', () => {
      render(
        <PromptTemplateCreator
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      const cancelButton = screen.getByText('取消');
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('category integration', () => {
    it('should initialize with custom category selected', () => {
      render(
        <PromptTemplateCreator
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );

      expect(screen.getByText('自定义')).toBeInTheDocument();
    });
  });
});
