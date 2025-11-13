import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WorkflowEditor from '../WorkflowEditor';
import { Workflow } from '@/lib/workflows/workflow-templates';

global.fetch = vi.fn();

describe('WorkflowEditor', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  const mockPrompts = [
    {
      id: 'prompt-1',
      name: 'Test Prompt 1',
      description: 'Test description 1',
      category: 'Development',
      categories: ['development'],
      source: 'test',
      content: 'Test content {{variable}}',
      parameters: [{ name: 'variable', description: 'Test param', required: true, type: 'string' }]
    },
    {
      id: 'prompt-2',
      name: 'Test Prompt 2',
      description: 'Test description 2',
      category: 'Testing',
      categories: ['testing'],
      source: 'test',
      content: 'Another test content',
      parameters: []
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ prompts: mockPrompts })
    });
  });

  describe('visibility', () => {
    it('should not render when isOpen is false', () => {
      const { container } = render(
        <WorkflowEditor 
          isOpen={false}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render when isOpen is true', () => {
      render(
        <WorkflowEditor 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );
      expect(screen.getByText('创建新工作流')).toBeInTheDocument();
    });
  });

  describe('header', () => {
    it('should show create title when no editing workflow', () => {
      render(
        <WorkflowEditor 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );
      expect(screen.getByText('创建新工作流')).toBeInTheDocument();
    });

    it('should show edit title when editing workflow', () => {
      const editingWorkflow: Workflow = {
        id: 'test-1',
        name: 'Test Workflow',
        description: 'Test',
        icon: '📝',
        steps: [],
        config: {}
      };
      render(
        <WorkflowEditor 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          editingWorkflow={editingWorkflow}
        />
      );
      expect(screen.getByText('编辑工作流')).toBeInTheDocument();
    });

    it('should call onClose when close button clicked', async () => {
      const user = userEvent.setup();
      render(
        <WorkflowEditor 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );
      const closeButton = screen.getAllByText('×')[0];
      await user.click(closeButton);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('basic fields', () => {
    it('should render name input', () => {
      render(
        <WorkflowEditor 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );
      expect(screen.getByPlaceholderText('例如: 代码审查流程')).toBeInTheDocument();
    });

    it('should render description textarea', () => {
      render(
        <WorkflowEditor 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );
      expect(screen.getByPlaceholderText('简短描述这个工作流的用途...')).toBeInTheDocument();
    });

    it('should render icon input', () => {
      render(
        <WorkflowEditor 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );
      const iconInput = screen.getByPlaceholderText('📝');
      expect(iconInput).toBeInTheDocument();
      expect(iconInput).toHaveAttribute('maxLength', '2');
    });

    it('should update name field', async () => {
      const user = userEvent.setup();
      render(
        <WorkflowEditor 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );
      const nameInput = screen.getByPlaceholderText('例如: 代码审查流程');
      await user.type(nameInput, 'My Workflow');
      expect(nameInput).toHaveValue('My Workflow');
    });

    it('should update description field', async () => {
      const user = userEvent.setup();
      render(
        <WorkflowEditor 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );
      const descInput = screen.getByPlaceholderText('简短描述这个工作流的用途...');
      await user.type(descInput, 'Test description');
      expect(descInput).toHaveValue('Test description');
    });

    it('should update icon field', async () => {
      const user = userEvent.setup();
      render(
        <WorkflowEditor 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );
      const iconInput = screen.getByPlaceholderText('📝');
      await user.clear(iconInput);
      await user.type(iconInput, '🚀');
      expect(iconInput).toHaveValue('🚀');
    });

    it('should initialize with editing workflow data', () => {
      const editingWorkflow: Workflow = {
        id: 'test-1',
        name: 'Existing Workflow',
        description: 'Existing description',
        icon: '🎯',
        steps: [],
        config: {}
      };
      render(
        <WorkflowEditor 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          editingWorkflow={editingWorkflow}
        />
      );
      expect(screen.getByPlaceholderText('例如: 代码审查流程')).toHaveValue('Existing Workflow');
      expect(screen.getByPlaceholderText('简短描述这个工作流的用途...')).toHaveValue('Existing description');
      expect(screen.getByPlaceholderText('📝')).toHaveValue('🎯');
    });
  });

  describe('steps management', () => {
    it('should show empty state when no steps', () => {
      render(
        <WorkflowEditor 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );
      expect(screen.getByText('还没有步骤，点击上方按钮添加第一个步骤')).toBeInTheDocument();
    });

    it('should add step when add button clicked', async () => {
      const user = userEvent.setup();
      render(
        <WorkflowEditor 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );
      const addButton = screen.getByText('➕ 添加步骤');
      await user.click(addButton);
      expect(screen.getByText('步骤 1')).toBeInTheDocument();
    });

    it('should show step fields after adding', async () => {
      const user = userEvent.setup();
      render(
        <WorkflowEditor 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );
      await user.click(screen.getByText('➕ 添加步骤'));
      expect(screen.getByPlaceholderText('例如: 分析代码')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('输入 prompt 内容，可以使用变量: {{variable}}')).toBeInTheDocument();
    });

    it('should update step name', async () => {
      const user = userEvent.setup();
      render(
        <WorkflowEditor 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );
      await user.click(screen.getByText('➕ 添加步骤'));
      const nameInput = screen.getByPlaceholderText('例如: 分析代码');
      await user.clear(nameInput);
      await user.type(nameInput, 'Custom Step');
      expect(nameInput).toHaveValue('Custom Step');
    });

    it('should update step prompt', async () => {
      const user = userEvent.setup();
      render(
        <WorkflowEditor 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );
      await user.click(screen.getByText('➕ 添加步骤'));
      const promptInput = screen.getByPlaceholderText('输入 prompt 内容，可以使用变量: {{variable}}');
      await user.clear(promptInput);
      await user.type(promptInput, 'Custom prompt');
      expect(promptInput).toHaveValue('Custom prompt');
    });

    it('should remove step when delete button clicked', async () => {
      const user = userEvent.setup();
      render(
        <WorkflowEditor 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );
      await user.click(screen.getByText('➕ 添加步骤'));
      expect(screen.getByText('步骤 1')).toBeInTheDocument();
      await user.click(screen.getByText('🗑️ 删除'));
      expect(screen.queryByText('步骤 1')).not.toBeInTheDocument();
    });

    it('should handle multiple steps', async () => {
      const user = userEvent.setup();
      render(
        <WorkflowEditor 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );
      await user.click(screen.getByText('➕ 添加步骤'));
      await user.click(screen.getByText('➕ 添加步骤'));
      await user.click(screen.getByText('➕ 添加步骤'));
      expect(screen.getByText('步骤 1')).toBeInTheDocument();
      expect(screen.getByText('步骤 2')).toBeInTheDocument();
      expect(screen.getByText('步骤 3')).toBeInTheDocument();
    });

    it('should initialize with editing workflow steps', () => {
      const editingWorkflow: Workflow = {
        id: 'test-1',
        name: 'Test',
        description: 'Test',
        icon: '📝',
        steps: [
          { id: 'step-1', name: 'Step 1', prompt: 'Prompt 1' },
          { id: 'step-2', name: 'Step 2', prompt: 'Prompt 2' }
        ],
        config: {}
      };
      render(
        <WorkflowEditor 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          editingWorkflow={editingWorkflow}
        />
      );
      expect(screen.getByText('步骤 1')).toBeInTheDocument();
      expect(screen.getByText('步骤 2')).toBeInTheDocument();
    });
  });

  describe('prompt picker', () => {
    it('should open prompt picker when button clicked', async () => {
      const user = userEvent.setup();
      render(
        <WorkflowEditor 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );
      await user.click(screen.getByText('➕ 添加步骤'));
      await user.click(screen.getByText('📚 从库中选择'));
      
      await waitFor(() => {
        expect(screen.getByText('选择 Prompt 模板')).toBeInTheDocument();
      });
    });

    it('should show loading state when fetching prompts', async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockImplementation(() => new Promise(() => {}));
      
      render(
        <WorkflowEditor 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );
      
      await user.click(screen.getByText('➕ 添加步骤'));
      await user.click(screen.getByText('📚 从库中选择'));
      
      await waitFor(() => {
        expect(screen.getByText('加载模板中...')).toBeInTheDocument();
      });
    });

    it('should show prompts after loading', async () => {
      const user = userEvent.setup();
      render(
        <WorkflowEditor 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );
      
      await user.click(screen.getByText('➕ 添加步骤'));
      await user.click(screen.getByText('📚 从库中选择'));
      
      await waitFor(() => {
        expect(screen.getByText('Test Prompt 1')).toBeInTheDocument();
        expect(screen.getByText('Test Prompt 2')).toBeInTheDocument();
      });
    });

    it('should show error state on fetch failure', async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockRejectedValue(new Error('Network error'));
      
      render(
        <WorkflowEditor 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );
      
      await user.click(screen.getByText('➕ 添加步骤'));
      await user.click(screen.getByText('📚 从库中选择'));
      
      await waitFor(() => {
        expect(screen.getByText(/加载失败/)).toBeInTheDocument();
      });
    });

    it('should show empty state when no prompts', async () => {
      const user = userEvent.setup();
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ prompts: [] })
      });
      
      render(
        <WorkflowEditor 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );
      
      await user.click(screen.getByText('➕ 添加步骤'));
      await user.click(screen.getByText('📚 从库中选择'));
      
      await waitFor(() => {
        expect(screen.getByText('没有找到模板')).toBeInTheDocument();
      });
    });

    it('should show prompt preview when prompt clicked', async () => {
      const user = userEvent.setup();
      render(
        <WorkflowEditor 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );
      
      await user.click(screen.getByText('➕ 添加步骤'));
      await user.click(screen.getByText('📚 从库中选择'));
      
      await waitFor(() => {
        expect(screen.getByText('Test Prompt 1')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Test Prompt 1'));
      expect(screen.getByText('模板预览')).toBeInTheDocument();
      expect(screen.getByText('Test content {{variable}}')).toBeInTheDocument();
    });

    it('should apply selected prompt to step', async () => {
      const user = userEvent.setup();
      render(
        <WorkflowEditor 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );
      
      await user.click(screen.getByText('➕ 添加步骤'));
      await user.click(screen.getByText('📚 从库中选择'));
      
      await waitFor(() => {
        expect(screen.getByText('Test Prompt 1')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Test Prompt 1'));
      await user.click(screen.getByText('使用此模板'));
      
      await waitFor(() => {
        expect(screen.queryByText('选择 Prompt 模板')).not.toBeInTheDocument();
      });
    });

    it('should close prompt picker when close button clicked', async () => {
      const user = userEvent.setup();
      render(
        <WorkflowEditor 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );
      
      await user.click(screen.getByText('➕ 添加步骤'));
      await user.click(screen.getByText('📚 从库中选择'));
      
      await waitFor(() => {
        expect(screen.getByText('选择 Prompt 模板')).toBeInTheDocument();
      });
      
      const closeButtons = screen.getAllByText('×');
      await user.click(closeButtons[closeButtons.length - 1]);
      
      await waitFor(() => {
        expect(screen.queryByText('选择 Prompt 模板')).not.toBeInTheDocument();
      });
    });
  });

  describe('save functionality', () => {
    it('should show alert when name is empty', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      render(
        <WorkflowEditor 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );
      
      await user.click(screen.getByText('创建工作流'));
      expect(alertSpy).toHaveBeenCalledWith('请填写工作流名称并至少添加一个步骤');
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should show alert when no steps', async () => {
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      render(
        <WorkflowEditor 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );
      
      const nameInput = screen.getByPlaceholderText('例如: 代码审查流程');
      await user.type(nameInput, 'Test Workflow');
      await user.click(screen.getByText('创建工作流'));
      
      expect(alertSpy).toHaveBeenCalled();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should save workflow with valid data', async () => {
      const user = userEvent.setup();
      render(
        <WorkflowEditor 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );
      
      await user.type(screen.getByPlaceholderText('例如: 代码审查流程'), 'My Workflow');
      await user.type(screen.getByPlaceholderText('简短描述这个工作流的用途...'), 'Test desc');
      await user.click(screen.getByText('➕ 添加步骤'));
      await user.click(screen.getByText('创建工作流'));
      
      expect(mockOnSave).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when cancel button clicked', async () => {
      const user = userEvent.setup();
      render(
        <WorkflowEditor 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );
      
      await user.click(screen.getByText('取消'));
      expect(mockOnClose).toHaveBeenCalled();
      expect(mockOnSave).not.toHaveBeenCalled();
    });

    it('should show correct save button text when editing', () => {
      const editingWorkflow: Workflow = {
        id: 'test-1',
        name: 'Test',
        description: 'Test',
        icon: '📝',
        steps: [{ id: 'step-1', name: 'Step', prompt: 'Prompt' }],
        config: {}
      };
      render(
        <WorkflowEditor 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          editingWorkflow={editingWorkflow}
        />
      );
      expect(screen.getByText('保存修改')).toBeInTheDocument();
    });
  });

  describe('prompts loading', () => {
    it('should load prompts when editor opens', async () => {
      render(
        <WorkflowEditor 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/prompts/scan', expect.any(Object));
      });
    });

    it('should handle timeout error', async () => {
      (global.fetch as any).mockImplementation(() => 
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 100))
      );
      
      render(
        <WorkflowEditor 
          isOpen={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      );
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      }, { timeout: 1000 });
    });
  });
});
