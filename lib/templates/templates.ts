export interface PromptTemplate {
  id: string;
  name: string;
  category: 'development' | 'review' | 'refactor' | 'docs' | 'test';
  description: string;
  template: string;
  variables: Variable[];
  icon: string;
}

export interface Variable {
  name: string;
  label: string;
  type: 'text' | 'code' | 'textarea' | 'select';
  required: boolean;
  default?: string;
  placeholder?: string;
  options?: string[];
}

export const templates: PromptTemplate[] = [
  {
    id: 'new-feature',
    name: '新功能开发',
    category: 'development',
    icon: '🔨',
    description: '基于需求描述生成完整的功能实现方案',
    template: `你是一位拥有20年经验的资深软件架构师。

**任务**: 设计并实现以下新功能

<feature_description>
{{feature_description}}
</feature_description>

<tech_stack>
技术栈: {{tech_stack}}
</tech_stack>

<code_context>
{{code_context}}
</code_context>

**请按以下结构输出**:

1. **技术方案设计**
   - 整体架构说明
   - 核心模块划分
   - 数据流设计

2. **核心代码实现**
   - 提供完整的、可运行的代码
   - 包含详细的类型定义
   - 考虑边界条件和错误处理

3. **单元测试**
   - 覆盖主要业务逻辑
   - 包含边界条件测试

4. **性能与安全建议**
   - 潜在的性能瓶颈
   - 安全注意事项

**约束条件**:
- 遵循SOLID原则
- 使用项目现有的库和工具
- 代码需要清晰、可维护
- 提供TypeScript类型定义`,
    variables: [
      {
        name: 'feature_description',
        label: '功能描述',
        type: 'textarea',
        required: true,
        placeholder: '详细描述要实现的功能需求...'
      },
      {
        name: 'tech_stack',
        label: '技术栈',
        type: 'text',
        required: true,
        default: 'React, TypeScript, Next.js',
        placeholder: 'React, TypeScript, Next.js'
      },
      {
        name: 'code_context',
        label: '相关代码上下文（可选）',
        type: 'code',
        required: false,
        placeholder: '粘贴相关的现有代码...'
      }
    ]
  },
  {
    id: 'bug-fix',
    name: 'Bug修复助手',
    category: 'development',
    icon: '🐛',
    description: '分析问题根因并提供修复方案',
    template: `你是一位经验丰富的调试专家。

**问题代码**:
\`\`\`{{language}}
{{buggy_code}}
\`\`\`

<issue_description>
**问题描述**: {{issue_description}}
</issue_description>

<error_logs>
**错误日志**:
\`\`\`
{{error_logs}}
\`\`\`
</error_logs>

**请按以下结构分析**:

1. **根因分析** (使用5W1H方法)
   - What: 具体是什么问题
   - Why: 为什么会发生
   - When: 在什么情况下触发
   - Where: 问题发生在代码的哪个位置
   - Who: 哪些模块受影响
   - How: 如何复现

2. **修复方案** (提供至少2种方案)
   - 方案A: [描述 + 优缺点]
   - 方案B: [描述 + 优缺点]
   - 推荐方案及理由

3. **修复后的完整代码**
   - 提供可直接使用的代码
   - 标注修改的关键部分

4. **预防措施**
   - 如何避免类似问题
   - 建议添加的测试用例`,
    variables: [
      {
        name: 'buggy_code',
        label: '问题代码',
        type: 'code',
        required: true,
        placeholder: '粘贴有问题的代码...'
      },
      {
        name: 'language',
        label: '编程语言',
        type: 'select',
        required: true,
        default: 'typescript',
        options: ['typescript', 'javascript', 'python', 'java', 'go', 'rust']
      },
      {
        name: 'issue_description',
        label: '问题描述',
        type: 'textarea',
        required: true,
        placeholder: '描述具体的问题表现...'
      },
      {
        name: 'error_logs',
        label: '错误日志',
        type: 'textarea',
        required: false,
        placeholder: '粘贴相关的错误日志...'
      }
    ]
  },
  {
    id: 'code-review',
    name: '全面代码审查',
    category: 'review',
    icon: '👀',
    description: '深度审查代码质量、安全性和性能',
    template: `你是一位拥有20年经验的代码审查专家。

**审查级别**: {{review_level}}

<code_changes>
**代码变更**:
\`\`\`diff
{{code_diff}}
\`\`\`
</code_changes>

**审查清单**:
- 🔒 **安全漏洞**: SQL注入、XSS、CSRF、敏感信息泄露
- ⚡ **性能问题**: N+1查询、不必要的重渲染、内存泄漏
- 🐛 **潜在Bug**: 空值检查、边界条件、并发问题
- 📖 **代码可读性**: 命名、注释、复杂度
- 🏗️ **架构合理性**: SOLID原则、设计模式
- ✅ **测试覆盖**: 单元测试、边界测试

**输出格式**:

### 🚨 严重问题 (Blocker)
- [ ] 问题1: [具体描述]
  - 位置: \`文件名:行号\`
  - 影响: [影响范围]
  - 建议: [修复建议]

### ⚠️ 重要问题 (Major)
- [ ] 问题2: ...

### 💡 建议优化 (Minor)
- [ ] 建议1: ...

### ✨ 优秀实践
- 亮点1: ...`,
    variables: [
      {
        name: 'code_diff',
        label: '代码变更 (支持git diff格式)',
        type: 'code',
        required: true,
        placeholder: '粘贴git diff或完整代码...'
      },
      {
        name: 'review_level',
        label: '审查级别',
        type: 'select',
        required: true,
        default: 'standard',
        options: ['quick', 'standard', 'thorough']
      }
    ]
  },
  {
    id: 'quick-review',
    name: 'PR快速审查',
    category: 'review',
    icon: '⚡',
    description: '快速识别关键问题，适合PR审查',
    template: `你是一位高效的代码审查者。请快速扫描以下代码变更，**仅关注关键问题**。

<focus_areas>
**重点关注**: {{focus_areas}}
</focus_areas>

<pr_diff>
\`\`\`diff
{{pr_diff}}
\`\`\`
</pr_diff>

**输出要求**: 
- 仅列出关键问题（Blocker和Major级别）
- 每项格式: \`文件:行号\` + 问题 + 简短建议
- 如果没有严重问题，简要说明并给予认可

**示例格式**:
- \`src/api/user.ts:45\` - SQL注入风险 → 使用参数化查询
- \`components/Form.tsx:23\` - 缺少input验证 → 添加zod schema验证`,
    variables: [
      {
        name: 'pr_diff',
        label: 'PR代码变更',
        type: 'code',
        required: true,
        placeholder: '粘贴git diff...'
      },
      {
        name: 'focus_areas',
        label: '重点关注领域',
        type: 'select',
        required: true,
        default: 'security,performance',
        options: ['security', 'performance', 'logic', 'all']
      }
    ]
  },
  {
    id: 'refactor',
    name: '代码重构',
    category: 'refactor',
    icon: '♻️',
    description: '改进代码结构，提高可维护性',
    template: `你是一位重构大师，擅长改进代码质量。

<refactor_goal>
**重构目标**: {{refactor_goal}}
</refactor_goal>

<original_code>
**原始代码**:
\`\`\`{{language}}
{{original_code}}
\`\`\`
</original_code>

**约束条件**:
- ✅ 保持API接口不变（除非明确要求修改）
- ✅ 不改变业务逻辑
- ✅ 增加必要的类型定义
- ✅ 提供单元测试

**输出内容**:

### 1. 重构计划
- [ ] 步骤1: ...
- [ ] 步骤2: ...
- [ ] 步骤3: ...

### 2. 重构后代码
\`\`\`{{language}}
// 完整的重构后代码
\`\`\`

### 3. 关键变更说明
| 变更点 | 重构前 | 重构后 | 原因 |
|--------|--------|--------|------|
| ... | ... | ... | ... |

### 4. 单元测试
\`\`\`{{language}}
// 针对重构代码的测试
\`\`\`

### 5. 风险评估
- 低风险: ...
- 中风险: ...
- 建议的发布策略: ...`,
    variables: [
      {
        name: 'original_code',
        label: '原始代码',
        type: 'code',
        required: true,
        placeholder: '粘贴需要重构的代码...'
      },
      {
        name: 'language',
        label: '编程语言',
        type: 'select',
        required: true,
        default: 'typescript',
        options: ['typescript', 'javascript', 'python', 'java', 'go']
      },
      {
        name: 'refactor_goal',
        label: '重构目标',
        type: 'select',
        required: true,
        default: '提高可读性',
        options: ['提高可读性', '性能优化', '架构调整', '消除重复代码', '提升类型安全']
      }
    ]
  },
  {
    id: 'api-docs',
    name: 'API文档生成',
    category: 'docs',
    icon: '📚',
    description: '自动生成标准化的API文档',
    template: `你是一位技术文档专家。请为以下代码生成清晰、专业的API文档。

<code>
\`\`\`{{language}}
{{code}}
\`\`\`
</code>

**文档格式**: {{doc_format}}

**生成内容**:

### 函数/类概述
简要说明功能和用途（2-3句话）

### 参数说明
| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| ... | ... | ... | ... | ... |

### 返回值
- **类型**: \`Type\`
- **说明**: 返回值的详细说明

### 使用示例
\`\`\`{{language}}
// 基础用法
const result = await someFunction(params);

// 高级用法
const advanced = await someFunction({
  ...params,
  options: { ... }
});
\`\`\`

### 异常处理
- \`ErrorType1\`: 什么情况下抛出
- \`ErrorType2\`: 什么情况下抛出

### 注意事项
- ⚠️ 注意事项1
- ⚠️ 注意事项2

### 相关API
- \`relatedFunction1\`: 说明
- \`relatedFunction2\`: 说明`,
    variables: [
      {
        name: 'code',
        label: '代码',
        type: 'code',
        required: true,
        placeholder: '粘贴需要生成文档的代码...'
      },
      {
        name: 'language',
        label: '编程语言',
        type: 'select',
        required: true,
        default: 'typescript',
        options: ['typescript', 'javascript', 'python', 'java']
      },
      {
        name: 'doc_format',
        label: '文档格式',
        type: 'select',
        required: true,
        default: 'JSDoc',
        options: ['JSDoc', 'Google Style', 'NumPy Style', 'Markdown']
      }
    ]
  },
  {
    id: 'unit-test',
    name: '单元测试生成',
    category: 'test',
    icon: '🧪',
    description: '生成全面的单元测试用例',
    template: `你是一位测试工程专家，擅长编写高质量的单元测试。

**测试框架**: {{test_framework}}

<code_to_test>
**被测代码**:
\`\`\`{{language}}
{{code_to_test}}
\`\`\`
</code_to_test>

**测试要求**:
- ✅ 覆盖所有公共方法/函数
- ✅ 测试边界条件和边缘情况
- ✅ 测试异常处理
- ✅ Mock外部依赖
- ✅ 目标覆盖率: 90%+

**生成测试**:

### 测试计划
| 测试场景 | 测试用例 | 预期结果 |
|----------|----------|----------|
| 正常流程 | ... | ... |
| 边界条件 | ... | ... |
| 异常情况 | ... | ... |

### 完整测试代码
\`\`\`{{language}}
import { describe, it, expect, vi } from '{{test_framework}}';

describe('被测功能', () => {
  // Setup
  beforeEach(() => {
    // 初始化代码
  });

  describe('正常流程测试', () => {
    it('should ...', () => {
      // 测试代码
    });
  });

  describe('边界条件测试', () => {
    it('should handle empty input', () => {
      // 测试空输入
    });

    it('should handle null/undefined', () => {
      // 测试空值
    });
  });

  describe('异常处理测试', () => {
    it('should throw error when ...', () => {
      // 测试异常
    });
  });
});
\`\`\`

### Mock配置
\`\`\`{{language}}
// Mock外部依赖的代码
\`\`\`

### 测试覆盖率报告
- 语句覆盖率: XX%
- 分支覆盖率: XX%
- 函数覆盖率: XX%`,
    variables: [
      {
        name: 'code_to_test',
        label: '被测代码',
        type: 'code',
        required: true,
        placeholder: '粘贴需要测试的代码...'
      },
      {
        name: 'language',
        label: '编程语言',
        type: 'select',
        required: true,
        default: 'typescript',
        options: ['typescript', 'javascript', 'python', 'java']
      },
      {
        name: 'test_framework',
        label: '测试框架',
        type: 'select',
        required: true,
        default: 'vitest',
        options: ['vitest', 'jest', 'pytest', 'junit', 'go test']
      }
    ]
  }
];

export function getTemplateById(id: string): PromptTemplate | undefined {
  return templates.find(t => t.id === id);
}

export function getTemplatesByCategory(category: PromptTemplate['category']): PromptTemplate[] {
  return templates.filter(t => t.category === category);
}
