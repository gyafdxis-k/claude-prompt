import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TemplateBindingCard from '../TemplateBindingCard';
import { TemplateBinding } from '@/lib/template-binding';
import { PromptTemplate } from '@/lib/prompts/prompt-scanner';

describe('TemplateBindingCard', () => {
  const mockTemplate: PromptTemplate = {
    id: 'test-template',
    name: '测试模板',
    description: '这是一个测试模板',
    category: 'test',
    source: 'builtin',
    content: '需求: {{requirement}}, 文件: {{file_path}}',
    parameters: [
      {
        name: 'requirement',
        type: 'string',
        required: true,
        description: '需求描述'
      },
      {
        name: 'file_path',
        type: 'string',
        required: false,
        description: '文件路径'
      }
    ]
  };

  const mockBinding: TemplateBinding = {
    id: 'test-binding',
    template: mockTemplate,
    parameters: {
      requirement: '添加新功能',
      file_path: 'app/page.tsx'
    },
    createdAt: Date.now()
  };

  it('应该渲染模板名称和描述', () => {
    const mockOnParameterChange = vi.fn();
    const mockOnRemove = vi.fn();
    const mockOnChangeTemplate = vi.fn();

    render(
      <TemplateBindingCard
        binding={mockBinding}
        onParameterChange={mockOnParameterChange}
        onRemove={mockOnRemove}
        onChangeTemplate={mockOnChangeTemplate}
      />
    );

    expect(screen.getByText('📋 测试模板')).toBeInTheDocument();
    expect(screen.getByText('这是一个测试模板')).toBeInTheDocument();
  });

  it('应该显示模板类别', () => {
    const mockOnParameterChange = vi.fn();
    const mockOnRemove = vi.fn();
    const mockOnChangeTemplate = vi.fn();

    render(
      <TemplateBindingCard
        binding={mockBinding}
        onParameterChange={mockOnParameterChange}
        onRemove={mockOnRemove}
        onChangeTemplate={mockOnChangeTemplate}
      />
    );

    expect(screen.getByText('test')).toBeInTheDocument();
  });

  it('应该显示参数数量', () => {
    const mockOnParameterChange = vi.fn();
    const mockOnRemove = vi.fn();
    const mockOnChangeTemplate = vi.fn();

    render(
      <TemplateBindingCard
        binding={mockBinding}
        onParameterChange={mockOnParameterChange}
        onRemove={mockOnRemove}
        onChangeTemplate={mockOnChangeTemplate}
      />
    );

    expect(screen.getByText('2 个参数')).toBeInTheDocument();
  });

  it('应该默认展开', () => {
    const mockOnParameterChange = vi.fn();
    const mockOnRemove = vi.fn();
    const mockOnChangeTemplate = vi.fn();

    render(
      <TemplateBindingCard
        binding={mockBinding}
        onParameterChange={mockOnParameterChange}
        onRemove={mockOnRemove}
        onChangeTemplate={mockOnChangeTemplate}
      />
    );

    // 参数输入框应该可见
    expect(screen.getByDisplayValue('添加新功能')).toBeInTheDocument();
    expect(screen.getByDisplayValue('app/page.tsx')).toBeInTheDocument();
  });

  it('点击折叠按钮应该收起/展开', () => {
    const mockOnParameterChange = vi.fn();
    const mockOnRemove = vi.fn();
    const mockOnChangeTemplate = vi.fn();

    render(
      <TemplateBindingCard
        binding={mockBinding}
        onParameterChange={mockOnParameterChange}
        onRemove={mockOnRemove}
        onChangeTemplate={mockOnChangeTemplate}
      />
    );

    const collapseButton = screen.getByText('▼');
    
    // 点击收起
    fireEvent.click(collapseButton);
    expect(screen.queryByDisplayValue('添加新功能')).not.toBeInTheDocument();

    // 再次点击展开
    const expandButton = screen.getByText('▶');
    fireEvent.click(expandButton);
    expect(screen.getByDisplayValue('添加新功能')).toBeInTheDocument();
  });

  it('修改参数值应该调用 onParameterChange', () => {
    const mockOnParameterChange = vi.fn();
    const mockOnRemove = vi.fn();
    const mockOnChangeTemplate = vi.fn();

    render(
      <TemplateBindingCard
        binding={mockBinding}
        onParameterChange={mockOnParameterChange}
        onRemove={mockOnRemove}
        onChangeTemplate={mockOnChangeTemplate}
      />
    );

    const input = screen.getByDisplayValue('添加新功能');
    fireEvent.change(input, { target: { value: '修复Bug' } });

    expect(mockOnParameterChange).toHaveBeenCalledWith('requirement', '修复Bug');
  });

  it('点击移除按钮应该调用 onRemove', () => {
    const mockOnParameterChange = vi.fn();
    const mockOnRemove = vi.fn();
    const mockOnChangeTemplate = vi.fn();

    render(
      <TemplateBindingCard
        binding={mockBinding}
        onParameterChange={mockOnParameterChange}
        onRemove={mockOnRemove}
        onChangeTemplate={mockOnChangeTemplate}
      />
    );

    const removeButton = screen.getByTitle('移除模板');
    fireEvent.click(removeButton);

    expect(mockOnRemove).toHaveBeenCalled();
  });

  it('点击更换按钮应该调用 onChangeTemplate', () => {
    const mockOnParameterChange = vi.fn();
    const mockOnRemove = vi.fn();
    const mockOnChangeTemplate = vi.fn();

    render(
      <TemplateBindingCard
        binding={mockBinding}
        onParameterChange={mockOnParameterChange}
        onRemove={mockOnRemove}
        onChangeTemplate={mockOnChangeTemplate}
      />
    );

    const changeButton = screen.getByTitle('更换模板');
    fireEvent.click(changeButton);

    expect(mockOnChangeTemplate).toHaveBeenCalled();
  });

  it('应该使用智能元数据显示参数描述', () => {
    const mockOnParameterChange = vi.fn();
    const mockOnRemove = vi.fn();
    const mockOnChangeTemplate = vi.fn();

    render(
      <TemplateBindingCard
        binding={mockBinding}
        onParameterChange={mockOnParameterChange}
        onRemove={mockOnRemove}
        onChangeTemplate={mockOnChangeTemplate}
      />
    );

    expect(screen.getByText(/需求描述/)).toBeInTheDocument();
  });

  it('showPreview 为 true 时应该显示预览按钮', () => {
    const mockOnParameterChange = vi.fn();
    const mockOnRemove = vi.fn();
    const mockOnChangeTemplate = vi.fn();

    render(
      <TemplateBindingCard
        binding={mockBinding}
        onParameterChange={mockOnParameterChange}
        onRemove={mockOnRemove}
        onChangeTemplate={mockOnChangeTemplate}
        showPreview={true}
      />
    );

    expect(screen.getByTitle('预览效果')).toBeInTheDocument();
  });

  it('additionalContext 应该用于渲染模板预览', () => {
    const mockOnParameterChange = vi.fn();
    const mockOnRemove = vi.fn();
    const mockOnChangeTemplate = vi.fn();

    const templateWithContext: PromptTemplate = {
      ...mockTemplate,
      content: '项目: {{project_path}}, 需求: {{requirement}}',
      parameters: [
        {
          name: 'requirement',
          type: 'string',
          required: true,
          description: '需求描述'
        },
        {
          name: 'project_path',
          type: 'string',
          required: false,
          description: '项目路径'
        }
      ]
    };

    const bindingWithContext: TemplateBinding = {
      id: 'test-binding',
      template: templateWithContext,
      parameters: {
        requirement: '添加新功能',
        project_path: ''
      },
      createdAt: Date.now()
    };

    render(
      <TemplateBindingCard
        binding={bindingWithContext}
        onParameterChange={mockOnParameterChange}
        onRemove={mockOnRemove}
        onChangeTemplate={mockOnChangeTemplate}
        additionalContext={{ project_path: '/home/user/project' }}
        showPreview={true}
      />
    );

    const previewButton = screen.getByTitle('预览效果');
    fireEvent.click(previewButton);

    expect(screen.getByText(/项目: \/home\/user\/project/)).toBeInTheDocument();
  });

  it('参数输入框应该允许编辑', () => {
    const mockOnParameterChange = vi.fn();
    const mockOnRemove = vi.fn();
    const mockOnChangeTemplate = vi.fn();

    const templateWithSingleParam: PromptTemplate = {
      id: 'test-single',
      name: '单参数测试',
      description: '测试单个参数',
      category: 'test',
      source: 'builtin',
      content: '文件: {{file_path}}',
      parameters: [
        {
          name: 'file_path',
          type: 'string',
          required: true,
          description: '文件路径'
        }
      ]
    };

    const bindingWithSingleParam: TemplateBinding = {
      id: 'test-binding-single',
      template: templateWithSingleParam,
      parameters: {
        file_path: 'app/page.tsx'
      },
      createdAt: Date.now()
    };

    render(
      <TemplateBindingCard
        binding={bindingWithSingleParam}
        onParameterChange={mockOnParameterChange}
        onRemove={mockOnRemove}
        onChangeTemplate={mockOnChangeTemplate}
      />
    );

    const input = screen.getByDisplayValue('app/page.tsx') as HTMLInputElement;
    expect(input.disabled).toBe(false);
    
    fireEvent.change(input, { target: { value: 'lib/utils.ts' } });
    expect(mockOnParameterChange).toHaveBeenCalledWith('file_path', 'lib/utils.ts');
  });
});
