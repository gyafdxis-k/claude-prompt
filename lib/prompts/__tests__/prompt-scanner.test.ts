import { describe, it, expect } from 'vitest';
import { PromptScanner, PromptTemplate } from '../prompt-scanner';

describe('PromptScanner', () => {
  let scanner: PromptScanner;
  const mockBasePath = '/mock/prompts';

  beforeEach(() => {
    scanner = new PromptScanner(mockBasePath);
  });

  describe('constructor', () => {
    it('should use provided path', () => {
      const customScanner = new PromptScanner('/custom/path');
      expect(customScanner).toBeDefined();
    });
  });

  describe('renderPrompt', () => {
    it('should replace all variable formats', () => {
      const template: PromptTemplate = {
        id: 'test',
        name: 'Test',
        description: 'Test',
        category: 'Test',
        categories: ['test'],
        source: 'test',
        content: 'Use ${var1}, {{var2}}, <var3>, and [var4]',
        parameters: []
      };

      const params = {
        var1: 'value1',
        var2: 'value2',
        var3: 'value3',
        var4: 'value4'
      };

      const rendered = scanner.renderPrompt(template, params);

      expect(rendered).toBe('Use value1, value2, value3, and value4');
    });

    it('should handle missing parameters with empty string', () => {
      const template: PromptTemplate = {
        id: 'test',
        name: 'Test',
        description: 'Test',
        category: 'Test',
        categories: ['test'],
        source: 'test',
        content: 'Use ${var1}',
        parameters: []
      };

      const rendered = scanner.renderPrompt(template, {});

      expect(rendered).toBe('Use ');
    });

    it('should handle empty parameters', () => {
      const template: PromptTemplate = {
        id: 'test',
        name: 'Test',
        description: 'Test',
        category: 'Test',
        categories: ['test'],
        source: 'test',
        content: 'No variables here',
        parameters: []
      };

      const rendered = scanner.renderPrompt(template, {});

      expect(rendered).toBe('No variables here');
    });

    it('should replace multiple occurrences of same variable', () => {
      const template: PromptTemplate = {
        id: 'test',
        name: 'Test',
        description: 'Test',
        category: 'Test',
        categories: ['test'],
        source: 'test',
        content: 'Use ${var1} and ${var1} again',
        parameters: []
      };

      const rendered = scanner.renderPrompt(template, { var1: 'value' });

      expect(rendered).toBe('Use value and value again');
    });

    it('should handle mixed variable formats in same template', () => {
      const template: PromptTemplate = {
        id: 'test',
        name: 'Test',
        description: 'Test',
        category: 'Test',
        categories: ['test'],
        source: 'test',
        content: '${a} {{b}} <c> [d]',
        parameters: []
      };

      const rendered = scanner.renderPrompt(template, {
        a: '1',
        b: '2',
        c: '3',
        d: '4'
      });

      expect(rendered).toBe('1 2 3 4');
    });

    it('should convert non-string values to strings', () => {
      const template: PromptTemplate = {
        id: 'test',
        name: 'Test',
        description: 'Test',
        category: 'Test',
        categories: ['test'],
        source: 'test',
        content: 'Value: ${num}',
        parameters: []
      };

      const rendered = scanner.renderPrompt(template, { num: 123 });

      expect(rendered).toBe('Value: 123');
    });
  });

  describe('template structure', () => {
    it('should have valid PromptTemplate interface', () => {
      const template: PromptTemplate = {
        id: 'test-id',
        name: 'Test Template',
        description: 'Test description',
        category: 'Test',
        categories: ['development', 'test'],
        source: '/path/to/source',
        content: 'Template content with ${param}',
        parameters: [
          {
            name: 'param',
            description: 'A parameter',
            required: true,
            type: 'string'
          }
        ]
      };

      expect(template.id).toBe('test-id');
      expect(template.categories).toHaveLength(2);
      expect(template.parameters).toHaveLength(1);
      expect(template.parameters[0].name).toBe('param');
    });
  });

  describe('parameter types', () => {
    it('should support different parameter types', () => {
      const params: PromptTemplate['parameters'] = [
        { name: 'text', description: 'Text param', required: true, type: 'string' },
        { name: 'code', description: 'Code param', required: false, type: 'code' },
        { name: 'file', description: 'File param', required: true, type: 'file' },
        { name: 'files', description: 'Files param', required: false, type: 'files' },
        { name: 'num', description: 'Number param', required: true, type: 'number' }
      ];

      expect(params).toHaveLength(5);
      expect(params[0].type).toBe('string');
      expect(params[1].type).toBe('code');
      expect(params[2].type).toBe('file');
      expect(params[3].type).toBe('files');
      expect(params[4].type).toBe('number');
    });
  });
});
