export interface PromptCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const PROMPT_CATEGORIES: PromptCategory[] = [
  {
    id: 'development',
    name: '开发',
    description: '代码开发、新功能实现',
    icon: '💻',
    color: 'blue'
  },
  {
    id: 'debug',
    name: '调试',
    description: 'Bug修复、问题排查',
    icon: '🐛',
    color: 'red'
  },
  {
    id: 'review',
    name: '审查',
    description: '代码审查、质量检查',
    icon: '👀',
    color: 'purple'
  },
  {
    id: 'refactor',
    name: '重构',
    description: '代码重构、优化改进',
    icon: '♻️',
    color: 'green'
  },
  {
    id: 'test',
    name: '测试',
    description: '单元测试、集成测试',
    icon: '🧪',
    color: 'yellow'
  },
  {
    id: 'documentation',
    name: '文档',
    description: 'API文档、注释生成',
    icon: '📚',
    color: 'indigo'
  },
  {
    id: 'architecture',
    name: '架构',
    description: '系统设计、架构规划',
    icon: '🏗️',
    color: 'gray'
  },
  {
    id: 'database',
    name: '数据库',
    description: '数据库设计、SQL优化',
    icon: '🗄️',
    color: 'teal'
  },
  {
    id: 'performance',
    name: '性能',
    description: '性能优化、性能分析',
    icon: '⚡',
    color: 'orange'
  },
  {
    id: 'security',
    name: '安全',
    description: '安全审计、漏洞修复',
    icon: '🔒',
    color: 'pink'
  },
  {
    id: 'deployment',
    name: '部署',
    description: 'CI/CD、运维部署',
    icon: '🚀',
    color: 'cyan'
  },
  {
    id: 'ai',
    name: 'AI助手',
    description: 'AI Agent、智能助手',
    icon: '🤖',
    color: 'violet'
  },
  {
    id: 'custom',
    name: '自定义',
    description: '用户自定义模板',
    icon: '✨',
    color: 'slate'
  }
];

export function getCategoryById(id: string): PromptCategory | undefined {
  return PROMPT_CATEGORIES.find(c => c.id === id);
}

export function getCategoriesByIds(ids: string[]): PromptCategory[] {
  return ids.map(id => getCategoryById(id)).filter(Boolean) as PromptCategory[];
}

export const CATEGORY_COLORS: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-800 border-blue-200',
  red: 'bg-red-100 text-red-800 border-red-200',
  purple: 'bg-purple-100 text-purple-800 border-purple-200',
  green: 'bg-green-100 text-green-800 border-green-200',
  yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  gray: 'bg-gray-100 text-gray-800 border-gray-200',
  teal: 'bg-teal-100 text-teal-800 border-teal-200',
  orange: 'bg-orange-100 text-orange-800 border-orange-200',
  pink: 'bg-pink-100 text-pink-800 border-pink-200',
  cyan: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  violet: 'bg-violet-100 text-violet-800 border-violet-200',
  slate: 'bg-slate-100 text-slate-800 border-slate-200'
};
