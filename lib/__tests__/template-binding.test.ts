import { describe, it, expect } from 'vitest';
import { 
  TemplateBinding, 
  renderTemplate, 
  tryParseTextAsBinding,
  getSmartParameterMetadata 
} from '../template-binding';
import { PromptTemplate } from '../prompts/prompt-scanner';

describe('template-binding', () => {
  describe('renderTemplate', () => {
    it('应该正确替换 {{}} 格式的变量', () => {
      const template: PromptTemplate = {
        id: 'test-1',
        name: 'Test Template',
        description: 'Test',
        category: 'test',
        source: 'builtin',
        content: '你好，{{name}}！你的项目是 {{project}}。',
        parameters: []
      };

      const binding: TemplateBinding = {
        id: 'binding-1',
        template,
        parameters: {
          name: '张三',
          project: 'Claude Prompt'
        },
        createdAt: Date.now()
      };

      const result = renderTemplate(binding);
      expect(result).toBe('你好，张三！你的项目是 Claude Prompt。');
    });

    it('应该正确替换 ${} 格式的变量', () => {
      const template: PromptTemplate = {
        id: 'test-2',
        name: 'Test Template',
        description: 'Test',
        category: 'test',
        source: 'builtin',
        content: 'Path: ${project_path}, User: ${username}',
        parameters: []
      };

      const binding: TemplateBinding = {
        id: 'binding-2',
        template,
        parameters: {
          project_path: '/home/user/project',
          username: 'admin'
        },
        createdAt: Date.now()
      };

      const result = renderTemplate(binding);
      expect(result).toBe('Path: /home/user/project, User: admin');
    });

    it('应该正确替换 <> 格式的变量', () => {
      const template: PromptTemplate = {
        id: 'test-3',
        name: 'Test Template',
        description: 'Test',
        category: 'test',
        source: 'builtin',
        content: 'File: <file_path>, Code: <code>',
        parameters: []
      };

      const binding: TemplateBinding = {
        id: 'binding-3',
        template,
        parameters: {
          file_path: 'app.ts',
          code: 'const x = 1;'
        },
        createdAt: Date.now()
      };

      const result = renderTemplate(binding);
      expect(result).toBe('File: app.ts, Code: const x = 1;');
    });

    it('应该正确替换 [] 格式的变量', () => {
      const template: PromptTemplate = {
        id: 'test-4',
        name: 'Test Template',
        description: 'Test',
        category: 'test',
        source: 'builtin',
        content: 'Task: [task], Goal: [goal]',
        parameters: []
      };

      const binding: TemplateBinding = {
        id: 'binding-4',
        template,
        parameters: {
          task: 'Fix bug',
          goal: 'Improve performance'
        },
        createdAt: Date.now()
      };

      const result = renderTemplate(binding);
      expect(result).toBe('Task: Fix bug, Goal: Improve performance');
    });

    it('应该合并额外的上下文数据', () => {
      const template: PromptTemplate = {
        id: 'test-5',
        name: 'Test Template',
        description: 'Test',
        category: 'test',
        source: 'builtin',
        content: '项目: {{project_path}}, 需求: {{requirement}}',
        parameters: []
      };

      const binding: TemplateBinding = {
        id: 'binding-5',
        template,
        parameters: {
          requirement: '添加新功能'
        },
        createdAt: Date.now()
      };

      const result = renderTemplate(binding, {
        project_path: '/home/user/app'
      });

      expect(result).toBe('项目: /home/user/app, 需求: 添加新功能');
    });

    it('额外上下文应该覆盖绑定参数', () => {
      const template: PromptTemplate = {
        id: 'test-6',
        name: 'Test Template',
        description: 'Test',
        category: 'test',
        source: 'builtin',
        content: 'Value: {{key}}',
        parameters: []
      };

      const binding: TemplateBinding = {
        id: 'binding-6',
        template,
        parameters: {
          key: 'original'
        },
        createdAt: Date.now()
      };

      const result = renderTemplate(binding, {
        key: 'overridden'
      });

      expect(result).toBe('Value: overridden');
    });

    it('应该忽略空值参数', () => {
      const template: PromptTemplate = {
        id: 'test-7',
        name: 'Test Template',
        description: 'Test',
        category: 'test',
        source: 'builtin',
        content: 'A: {{a}}, B: {{b}}',
        parameters: []
      };

      const binding: TemplateBinding = {
        id: 'binding-7',
        template,
        parameters: {
          a: 'value-a',
          b: ''
        },
        createdAt: Date.now()
      };

      const result = renderTemplate(binding);
      expect(result).toBe('A: value-a, B: {{b}}');
    });
  });

  describe('tryParseTextAsBinding', () => {
    it('应该为纯文本创建简单绑定', () => {
      const text = '这是一段纯文本';
      const binding = tryParseTextAsBinding(text);

      expect(binding).toBeDefined();
      expect(binding?.template.name).toBe('自由文本');
      expect(binding?.template.content).toBe(text);
      expect(binding?.template.parameters).toHaveLength(0);
      expect(binding?.parameters).toEqual({});
    });

    it('创建的绑定应该有唯一ID', async () => {
      const text1 = 'text1';
      const text2 = 'text2';
      
      const binding1 = tryParseTextAsBinding(text1);
      
      // 等待1毫秒确保时间戳不同
      await new Promise(resolve => setTimeout(resolve, 1));
      
      const binding2 = tryParseTextAsBinding(text2);

      expect(binding1?.id).not.toBe(binding2?.id);
    });
  });

  describe('getSmartParameterMetadata', () => {
    it('应该返回 requirement 的元数据', () => {
      const meta = getSmartParameterMetadata('requirement');
      
      expect(meta.description).toContain('需求');
      expect(meta.example).toBeDefined();
      expect(meta.multiline).toBe(true);
    });

    it('应该返回 code 的元数据', () => {
      const meta = getSmartParameterMetadata('code');
      
      expect(meta.description).toContain('代码');
      expect(meta.example).toBeDefined();
      expect(meta.multiline).toBe(true);
    });

    it('应该返回 file_path 的元数据', () => {
      const meta = getSmartParameterMetadata('file_path');
      
      expect(meta.description).toContain('文件');
      expect(meta.example).toBe('app/page.tsx');
      expect(meta.multiline).toBeFalsy();
    });

    it('应该返回 project_name 的元数据', () => {
      const meta = getSmartParameterMetadata('project_name');
      
      expect(meta.description).toContain('项目');
      expect(meta.example).toBeDefined();
    });

    it('应该为未知参数返回默认元数据', () => {
      const meta = getSmartParameterMetadata('unknown_param');
      
      expect(meta.description).toContain('unknown_param');
      expect(meta.example).toContain('unknown_param');
      expect(meta.multiline).toBe(false);
    });

    it('应该自动检测 description 参数为多行', () => {
      const meta = getSmartParameterMetadata('custom_description');
      
      expect(meta.multiline).toBe(true);
    });

    it('应该自动检测 content 参数为多行', () => {
      const meta = getSmartParameterMetadata('page_content');
      
      expect(meta.multiline).toBe(true);
    });

    it('应该自动检测 text 参数为多行', () => {
      const meta = getSmartParameterMetadata('input_text');
      
      expect(meta.multiline).toBe(true);
    });
  });
});
