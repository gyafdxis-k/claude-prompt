import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PromptEditorModal from '../PromptEditorModal';

describe('PromptEditorModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('isOpen 为 false 时不应该渲染', () => {
    render(
      <PromptEditorModal
        isOpen={false}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialPrompt="测试内容"
      />
    );

    expect(screen.queryByText('编辑 Prompt 模板')).not.toBeInTheDocument();
  });

  it('isOpen 为 true 时应该渲染', () => {
    render(
      <PromptEditorModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialPrompt="测试内容"
      />
    );

    expect(screen.getByText('✏️ 编辑 Prompt 模板')).toBeInTheDocument();
  });

  it('应该显示步骤名称', () => {
    render(
      <PromptEditorModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialPrompt="测试内容"
        stepName="第一步"
      />
    );

    expect(screen.getByText('步骤: 第一步')).toBeInTheDocument();
  });

  it('应该显示初始 Prompt 内容', () => {
    const initialPrompt = '这是测试 Prompt';
    
    render(
      <PromptEditorModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialPrompt={initialPrompt}
      />
    );

    const textarea = screen.getByPlaceholderText(/输入 Prompt 内容/);
    expect(textarea).toHaveValue(initialPrompt);
  });

  it('应该显示编辑模板和预览效果两个标签', () => {
    render(
      <PromptEditorModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialPrompt="测试内容"
      />
    );

    expect(screen.getByText('📝 编辑模板')).toBeInTheDocument();
    expect(screen.getByText('👁️ 预览效果')).toBeInTheDocument();
  });

  it('应该显示字符统计', () => {
    const prompt = 'Hello World';
    
    render(
      <PromptEditorModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialPrompt={prompt}
      />
    );

    expect(screen.getByText(`${prompt.length} 字符`)).toBeInTheDocument();
  });

  it('应该显示行数统计', () => {
    const prompt = 'Line 1\nLine 2\nLine 3';
    
    render(
      <PromptEditorModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialPrompt={prompt}
      />
    );

    expect(screen.getByText('3 行')).toBeInTheDocument();
  });

  it('应该检测并显示变量', () => {
    const prompt = '需求: {{requirement}}, 文件: ${file_path}';
    
    render(
      <PromptEditorModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialPrompt={prompt}
      />
    );

    expect(screen.getByText('2 个变量')).toBeInTheDocument();
  });

  it('检测到变量时应该显示参数填充面板', () => {
    const prompt = '需求: {{requirement}}';
    
    render(
      <PromptEditorModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialPrompt={prompt}
      />
    );

    expect(screen.getByText('参数填充 (1)')).toBeInTheDocument();
  });

  it('应该显示快速插入按钮', () => {
    render(
      <PromptEditorModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialPrompt=""
      />
    );

    expect(screen.getByText('快速插入:')).toBeInTheDocument();
    expect(screen.getByText('需求')).toBeInTheDocument();
    expect(screen.getByText('上一步输出')).toBeInTheDocument();
    expect(screen.getByText('项目路径')).toBeInTheDocument();
  });

  it('点击快速插入按钮应该添加变量', () => {
    render(
      <PromptEditorModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialPrompt=""
      />
    );

    const requirementButton = screen.getByText('需求');
    fireEvent.click(requirementButton);

    const textarea = screen.getByPlaceholderText(/输入 Prompt 内容/);
    expect(textarea).toHaveValue(' {{requirement}}');
  });

  it('编辑 Prompt 应该更新内容', () => {
    render(
      <PromptEditorModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialPrompt="原始内容"
      />
    );

    const textarea = screen.getByPlaceholderText(/输入 Prompt 内容/);
    fireEvent.change(textarea, { target: { value: '新内容' } });

    expect(textarea).toHaveValue('新内容');
  });

  it('切换到预览模式应该显示预览内容', () => {
    const prompt = '测试 Prompt 内容';
    
    render(
      <PromptEditorModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialPrompt={prompt}
      />
    );

    const previewTab = screen.getByText('👁️ 预览效果');
    fireEvent.click(previewTab);

    expect(screen.getByText('📄 渲染预览')).toBeInTheDocument();
  });

  it('有变量时预览应该渲染参数', () => {
    const prompt = '需求: {{requirement}}';
    
    render(
      <PromptEditorModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialPrompt={prompt}
      />
    );

    // 填充参数
    const input = screen.getByPlaceholderText(/实现用户登录功能/);
    fireEvent.change(input, { target: { value: '添加新功能' } });

    // 切换到预览
    const previewTab = screen.getByText('👁️ 预览效果');
    fireEvent.click(previewTab);

    expect(screen.getByText(/需求: 添加新功能/)).toBeInTheDocument();
  });

  it('contextData 应该自动填充并标记参数', () => {
    const prompt = '项目: {{project_path}}, 需求: {{requirement}}';
    
    render(
      <PromptEditorModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialPrompt={prompt}
        contextData={{ project_path: '/home/user/project' }}
      />
    );

    expect(screen.getByText('✓ 已提供')).toBeInTheDocument();
    expect(screen.getByDisplayValue('/home/user/project')).toBeInTheDocument();
  });

  it('已提供的参数应该被禁用编辑', () => {
    const prompt = '项目: {{project_path}}';
    
    render(
      <PromptEditorModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialPrompt={prompt}
        contextData={{ project_path: '/home/user/project' }}
      />
    );

    const input = screen.getByDisplayValue('/home/user/project') as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });

  it('点击关闭按钮应该调用 onClose', () => {
    render(
      <PromptEditorModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialPrompt="测试内容"
      />
    );

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('点击取消按钮应该调用 onClose', () => {
    render(
      <PromptEditorModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialPrompt="测试内容"
      />
    );

    const cancelButton = screen.getByText('取消');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('没有修改时保存按钮应该被禁用', () => {
    render(
      <PromptEditorModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialPrompt="测试内容"
      />
    );

    const saveButton = screen.getByText('💾 保存修改');
    expect(saveButton).toBeDisabled();
  });

  it('有修改时保存按钮应该启用', () => {
    render(
      <PromptEditorModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialPrompt="原始内容"
      />
    );

    const textarea = screen.getByPlaceholderText(/输入 Prompt 内容/);
    fireEvent.change(textarea, { target: { value: '新内容' } });

    const saveButton = screen.getByText('💾 保存修改');
    expect(saveButton).not.toBeDisabled();
  });

  it('有修改时应该显示未保存提示', () => {
    render(
      <PromptEditorModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialPrompt="原始内容"
      />
    );

    const textarea = screen.getByPlaceholderText(/输入 Prompt 内容/);
    fireEvent.change(textarea, { target: { value: '新内容' } });

    expect(screen.getByText('● 未保存的修改')).toBeInTheDocument();
  });

  it('点击保存应该调用 onSave 并关闭', () => {
    render(
      <PromptEditorModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialPrompt="原始内容"
      />
    );

    const textarea = screen.getByPlaceholderText(/输入 Prompt 内容/);
    const newContent = '新内容';
    fireEvent.change(textarea, { target: { value: newContent } });

    const saveButton = screen.getByText('💾 保存修改');
    fireEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith(newContent);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('应该支持多种变量格式检测', () => {
    const prompt = '{{var1}} ${var2} <var3> [var4]';
    
    render(
      <PromptEditorModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialPrompt={prompt}
      />
    );

    expect(screen.getByText('4 个变量')).toBeInTheDocument();
  });

  it('应该为多行参数显示 textarea', () => {
    const prompt = '需求: {{requirement}}';
    
    render(
      <PromptEditorModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialPrompt={prompt}
      />
    );

    const textarea = screen.getAllByRole('textbox')[1]; // 第二个是参数输入
    expect(textarea.tagName).toBe('TEXTAREA');
  });

  it('应该为单行参数显示 input', () => {
    const prompt = '文件: {{file_path}}';
    
    render(
      <PromptEditorModal
        isOpen={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        initialPrompt={prompt}
      />
    );

    const input = screen.getByPlaceholderText('app/page.tsx');
    expect(input.tagName).toBe('INPUT');
  });
});
