import * as fs from 'fs';
import * as path from 'path';

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  categories: string[];
  source: string;
  content: string;
  parameters: PromptParameter[];
}

export interface PromptParameter {
  name: string;
  description: string;
  required: boolean;
  defaultValue?: string;
  type: 'string' | 'file' | 'files' | 'code' | 'number';
}

export class PromptScanner {
  private promptsBasePath: string;
  private maxFileSize = 1024 * 1024;
  private maxDepth = 3;

  constructor(promptsBasePath?: string) {
    this.promptsBasePath = promptsBasePath || path.join(process.cwd(), 'prompts');
  }

  scanAllPrompts(): PromptTemplate[] {
    const prompts: PromptTemplate[] = [];

    try {
      if (!fs.existsSync(this.promptsBasePath)) {
        console.warn(`[Prompt Scanner] 目录不存在: ${this.promptsBasePath}`);
        return prompts;
      }

      const items = fs.readdirSync(this.promptsBasePath);

      for (const item of items) {
        if (item.startsWith('.') || item === 'LICENSE.md' || item === 'README.md' || item === 'LICENSE') {
          continue;
        }

        const itemPath = path.join(this.promptsBasePath, item);
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory()) {
          const categoryPrompts = this.scanCategory(item, itemPath);
          prompts.push(...categoryPrompts);
        } else if (item.endsWith('.md') || item.endsWith('.txt')) {
          const content = fs.readFileSync(itemPath, 'utf-8');
          const template: PromptTemplate = {
            id: item.replace(/\.(txt|md)$/, '').toLowerCase().replace(/\s+/g, '-'),
            name: this.generateName(item, 'Agents'),
            description: this.extractDescription(content, 'Agents'),
            category: 'Agents',
            categories: ['ai'],
            source: itemPath,
            content,
            parameters: this.extractParameters(content)
          };
          prompts.push(template);
        }
      }
    } catch (error) {
      console.error('[Prompt Scanner] 扫描失败:', error);
    }

    return prompts;
  }

  private scanCategory(category: string, categoryPath: string, depth: number = 0): PromptTemplate[] {
    const prompts: PromptTemplate[] = [];

    if (depth > this.maxDepth) {
      return prompts;
    }

    try {
      const files = fs.readdirSync(categoryPath);

      for (const file of files) {
        if (file.endsWith('.txt') || file.endsWith('.md')) {
          const filePath = path.join(categoryPath, file);
          
          const stats = fs.statSync(filePath);
          if (stats.size > this.maxFileSize) {
            console.warn(`[Prompt Scanner] 文件太大，跳过: ${filePath}`);
            continue;
          }
          
          const content = fs.readFileSync(filePath, 'utf-8');

          const template: PromptTemplate = {
            id: `${category.toLowerCase().replace(/\s+/g, '-')}-${file.replace(/\.(txt|md)$/, '').toLowerCase().replace(/\s+/g, '-')}`,
            name: this.generateName(file, category),
            description: this.extractDescription(content, category),
            category,
            categories: this.inferCategories(category, content),
            source: filePath,
            content,
            parameters: this.extractParameters(content)
          };

          prompts.push(template);
        }
      }

      const subdirs = files.filter(f => {
        const subPath = path.join(categoryPath, f);
        return fs.statSync(subPath).isDirectory();
      });

      for (const subdir of subdirs) {
        const subPath = path.join(categoryPath, subdir);
        const subPrompts = this.scanCategory(`${category}/${subdir}`, subPath, depth + 1);
        prompts.push(...subPrompts);
      }
    } catch (error) {
      console.error(`[Prompt Scanner] 扫描分类 ${category} 失败:`, error);
    }

    return prompts;
  }

  private generateName(filename: string, category: string): string {
    const baseName = filename.replace(/\.(txt|md)$/, '');
    
    const nameMap: Record<string, string> = {
      'claude-code-system-prompt': 'Claude Code 系统提示',
      'Agent Prompt': 'Cursor Agent 提示',
      'Chat Prompt': 'Cursor Chat 提示',
      'Prompt': `${category} 提示`,
      'gpt-5-agent-prompts': 'GPT-5 Agent 提示',
      'claude-4-sonnet-agent-prompts': 'Claude 4 Sonnet Agent 提示'
    };

    return nameMap[baseName] || baseName;
  }

  private extractDescription(content: string, category: string): string {
    const lines = content.split('\n');
    
    for (let i = 0; i < Math.min(20, lines.length); i++) {
      const line = lines[i].trim();
      
      if (line.match(/^You are/i)) {
        return line.substring(0, 200);
      }
      
      if (line.match(/^(Description|Summary|Overview):/i)) {
        return line.replace(/^(Description|Summary|Overview):\s*/i, '').substring(0, 200);
      }
    }

    const firstParagraph = lines.slice(0, 5).join(' ').trim();
    return firstParagraph.substring(0, 200) || `${category} 提示模板`;
  }

  private extractParameters(content: string): PromptParameter[] {
    const parameters: PromptParameter[] = [];
    const seen = new Set<string>();

    const variablePatterns = [
      /\$\{(\w+)\}/g,
      /\{\{(\w+)\}\}/g,
      /<(\w+)>/g,
      /\[(\w+)\]/g
    ];

    for (const pattern of variablePatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const paramName = match[1];
        
        if (!seen.has(paramName) && paramName.length > 1) {
          seen.add(paramName);
          
          parameters.push({
            name: paramName,
            description: this.guessParameterDescription(paramName),
            required: this.isLikelyRequired(paramName, content),
            type: this.guessParameterType(paramName)
          });
        }
      }
    }

    const commonParams = [
      { name: 'task', description: '要完成的任务描述', required: true, type: 'string' as const },
      { name: 'code', description: '相关代码内容', required: false, type: 'code' as const },
      { name: 'file', description: '相关文件路径', required: false, type: 'file' as const },
      { name: 'context', description: '上下文信息', required: false, type: 'string' as const }
    ];

    for (const param of commonParams) {
      if (!seen.has(param.name) && content.toLowerCase().includes(param.name)) {
        parameters.push(param);
        seen.add(param.name);
      }
    }

    return parameters;
  }

  private guessParameterDescription(paramName: string): string {
    const descriptionMap: Record<string, string> = {
      'cwd': '当前工作目录',
      'path': '文件路径',
      'file': '文件名或路径',
      'files': '文件列表',
      'code': '代码内容',
      'query': '查询内容',
      'search': '搜索关键词',
      'command': '命令内容',
      'task': '任务描述',
      'target': '目标',
      'content': '内容',
      'message': '消息',
      'user_query': '用户查询',
      'requirement': '需求',
      'context': '上下文',
      'explanation': '说明'
    };

    return descriptionMap[paramName.toLowerCase()] || `${paramName} 参数`;
  }

  private isLikelyRequired(paramName: string, content: string): boolean {
    const requiredKeywords = ['required', 'must', 'necessary'];
    const paramContext = content.substring(
      Math.max(0, content.indexOf(paramName) - 100),
      content.indexOf(paramName) + 100
    ).toLowerCase();

    return requiredKeywords.some(keyword => paramContext.includes(keyword));
  }

  private guessParameterType(paramName: string): 'string' | 'file' | 'files' | 'code' | 'number' {
    const name = paramName.toLowerCase();
    
    if (name.includes('file') && name.includes('s')) return 'files';
    if (name.includes('file') || name.includes('path')) return 'file';
    if (name.includes('code') || name === 'content') return 'code';
    if (name.includes('count') || name.includes('number') || name.includes('line')) return 'number';
    
    return 'string';
  }

  getPromptById(id: string): PromptTemplate | undefined {
    const allPrompts = this.scanAllPrompts();
    return allPrompts.find(p => p.id === id);
  }

  getPromptsByCategory(category: string): PromptTemplate[] {
    const allPrompts = this.scanAllPrompts();
    return allPrompts.filter(p => p.category.includes(category));
  }

  private inferCategories(category: string, content: string): string[] {
    const categories: string[] = [];
    const lowerContent = content.toLowerCase();
    
    if (category.toLowerCase().includes('agent')) categories.push('ai');
    if (category.toLowerCase().includes('coding') || category.toLowerCase().includes('code')) categories.push('development');
    if (category.toLowerCase().includes('debug') || lowerContent.includes('bug') || lowerContent.includes('fix')) categories.push('debug');
    if (category.toLowerCase().includes('review') || lowerContent.includes('review')) categories.push('review');
    if (category.toLowerCase().includes('test') || lowerContent.includes('test')) categories.push('test');
    if (category.toLowerCase().includes('refactor') || lowerContent.includes('refactor')) categories.push('refactor');
    if (category.toLowerCase().includes('doc') || lowerContent.includes('documentation')) categories.push('documentation');
    if (lowerContent.includes('architect') || lowerContent.includes('design')) categories.push('architecture');
    if (lowerContent.includes('database') || lowerContent.includes('sql')) categories.push('database');
    if (lowerContent.includes('performance') || lowerContent.includes('optimize')) categories.push('performance');
    if (lowerContent.includes('security') || lowerContent.includes('vulnerability')) categories.push('security');
    if (lowerContent.includes('deploy') || lowerContent.includes('ci/cd')) categories.push('deployment');
    
    if (categories.length === 0) {
      categories.push('custom');
    }
    
    return categories;
  }

  renderPrompt(template: PromptTemplate, params: Record<string, any>): string {
    let rendered = template.content;

    const allParamNames = new Set<string>();
    const variablePatterns = [
      /\$\{(\w+)\}/g,
      /\{\{(\w+)\}\}/g,
      /<(\w+)>/g,
      /\[(\w+)\]/g
    ];

    for (const pattern of variablePatterns) {
      let match;
      while ((match = pattern.exec(template.content)) !== null) {
        allParamNames.add(match[1]);
      }
    }

    for (const paramName of allParamNames) {
      const value = params[paramName] !== undefined ? params[paramName] : '';
      const patterns = [
        new RegExp(`\\$\\{${paramName}\\}`, 'g'),
        new RegExp(`\\{\\{${paramName}\\}\\}`, 'g'),
        new RegExp(`<${paramName}>`, 'g'),
        new RegExp(`\\[${paramName}\\]`, 'g')
      ];

      for (const pattern of patterns) {
        rendered = rendered.replace(pattern, String(value));
      }
    }

    return rendered;
  }
}
