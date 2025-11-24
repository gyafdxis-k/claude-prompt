import { PromptTemplate } from './prompts/prompt-scanner';

/**
 * 模板绑定 - 保留模板结构和参数的数据结构
 */
export interface TemplateBinding {
  id: string;
  template: PromptTemplate;
  parameters: Record<string, string>;
  createdAt: number;
}

/**
 * 渲染模板 - 将参数替换到模板内容中
 */
export function renderTemplate(binding: TemplateBinding, additionalContext?: Record<string, string>): string {
  let rendered = binding.template.content;
  
  // 合并用户参数和额外上下文
  const allParams = { ...binding.parameters, ...additionalContext };
  
  // 替换所有变量
  for (const [key, value] of Object.entries(allParams)) {
    if (value) {
      const patterns = [
        new RegExp(`\\$\\{${key}\\}`, 'g'),
        new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
        new RegExp(`<${key}>`, 'g'),
        new RegExp(`\\[${key}\\]`, 'g')
      ];
      
      for (const pattern of patterns) {
        rendered = rendered.replace(pattern, String(value));
      }
    }
  }
  
  return rendered;
}

/**
 * 从渲染后的文本尝试恢复模板绑定（用于兼容旧数据）
 */
export function tryParseTextAsBinding(text: string): TemplateBinding | null {
  // 这是一个回退方案，无法完美恢复，返回一个简单文本模板
  return {
    id: `text-${Date.now()}`,
    template: {
      id: 'raw-text',
      name: '自由文本',
      description: '直接输入的文本',
      category: 'custom',
      source: 'user',
      content: text,
      parameters: []
    },
    parameters: {},
    createdAt: Date.now()
  };
}

/**
 * 智能参数元数据 - 提供默认值和示例
 */
export function getSmartParameterMetadata(paramName: string) {
  const commonParams: Record<string, { description: string; example: string; multiline?: boolean }> = {
    requirement: { 
      description: '需求描述或任务说明', 
      example: '实现用户登录功能，支持邮箱和手机号登录',
      multiline: true
    },
    code: { 
      description: '待处理的代码片段', 
      example: 'function add(a, b) { return a + b; }',
      multiline: true
    },
    file_path: { 
      description: '文件路径', 
      example: 'app/page.tsx' 
    },
    project_name: { 
      description: '项目名称', 
      example: 'my-awesome-app' 
    },
    bug_description: { 
      description: 'Bug 描述', 
      example: '用户点击提交按钮时页面崩溃',
      multiline: true
    },
    related_files: { 
      description: '相关文件列表（每行一个）', 
      example: 'lib/api.ts\ncomponents/Form.tsx',
      multiline: true
    },
    module_name: { 
      description: '模块名称', 
      example: 'UserAuthService' 
    },
    refactoring_goal: { 
      description: '重构目标', 
      example: '提高代码可读性，减少重复代码',
      multiline: true
    },
    task: {
      description: '任务描述',
      example: '分析代码质量问题',
      multiline: true
    },
    query: {
      description: '查询内容',
      example: '如何优化性能',
      multiline: true
    }
  };
  
  return commonParams[paramName] || {
    description: `${paramName} 参数`,
    example: `示例 ${paramName} 值`,
    multiline: paramName.toLowerCase().includes('description') || 
               paramName.toLowerCase().includes('content') ||
               paramName.toLowerCase().includes('text')
  };
}
