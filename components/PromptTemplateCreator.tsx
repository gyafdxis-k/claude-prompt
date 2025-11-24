'use client';

import { useState } from 'react';
import { PromptTemplate, PromptParameter } from '@/lib/prompts/prompt-scanner';
import CategorySelector from './CategorySelector';

interface PromptTemplateCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: PromptTemplate) => void;
}

const templateScaffolds = {
  blank: { name: '空白模板', description: '从头开始创建', content: '' },
  requirement_analysis: {
    name: '需求分析',
    description: '分析和拆解用户需求',
    content: `# 需求分析

## 背景
项目: \${project_name}
当前上下文: \${cwd}

## 需求描述
\${requirement}

## 分析任务
请对以上需求进行详细分析:

1. **核心功能拆解**
   - 列出所有核心功能点
   - 标注优先级 (P0/P1/P2)

2. **技术方案建议**
   - 推荐技术栈
   - 架构设计建议
   - 潜在技术难点

3. **实现步骤规划**
   - 按逻辑顺序列出实现步骤
   - 估算每个步骤的工作量

4. **风险评估**
   - 技术风险
   - 时间风险
   - 依赖风险

请以清晰的 Markdown 格式输出分析结果。`
  },
  code_implementation: {
    name: '代码实现',
    description: '实现具体功能',
    content: `# 代码实现任务

## 项目上下文
项目路径: \${project_path}
相关文件: \${related_files}

## 实现需求
\${requirement}

## 实现要求
1. 遵循项目现有的代码风格和架构模式
2. 添加必要的错误处理
3. 编写清晰的代码注释
4. 考虑边界情况和异常场景
5. 确保代码的可测试性

## 输出格式
请提供:
1. 完整的代码实现
2. 关键逻辑的解释说明
3. 使用示例
4. 注意事项`
  },
  code_review: {
    name: '代码审查',
    description: '审查代码质量',
    content: `# 代码审查

## 待审查代码
文件: \${file_path}

\`\`\`
\${code}
\`\`\`

## 审查维度
请从以下角度进行代码审查:

1. **代码质量**
   - 可读性
   - 可维护性
   - 命名规范

2. **架构设计**
   - 模块划分是否合理
   - 职责是否清晰
   - 耦合度分析

3. **性能优化**
   - 潜在性能问题
   - 优化建议

4. **安全性**
   - 安全漏洞
   - 输入验证
   - 错误处理

5. **最佳实践**
   - 是否遵循语言/框架最佳实践
   - 改进建议

请给出具体的改进建议和示例代码。`
  },
  test_generation: {
    name: '测试生成',
    description: '生成单元测试和集成测试',
    content: `# 测试用例生成

## 待测试代码
文件: \${file_path}

\`\`\`
\${code}
\`\`\`

## 测试要求
请生成全面的测试用例:

1. **单元测试**
   - 正常场景测试
   - 边界条件测试
   - 异常场景测试

2. **测试覆盖**
   - 确保代码覆盖率 > 80%
   - 覆盖所有公共方法
   - 覆盖关键分支逻辑

3. **测试框架**
   - 使用项目现有的测试框架
   - 遵循测试命名规范

4. **Mock 和 Stub**
   - 对外部依赖进行合理的 mock
   - 确保测试的独立性

请提供完整的测试代码和必要的说明。`
  },
  documentation: {
    name: '文档生成',
    description: '生成 API 文档和使用说明',
    content: `# API 文档生成

## 待文档化内容
模块: \${module_name}

\`\`\`
\${code}
\`\`\`

## 文档要求
请生成完整的文档:

1. **概述**
   - 模块功能简介
   - 使用场景

2. **API 文档**
   - 函数/类的详细说明
   - 参数列表和类型
   - 返回值说明
   - 异常说明

3. **使用示例**
   - 基础使用示例
   - 高级使用场景
   - 最佳实践

4. **注意事项**
   - 重要提示
   - 常见问题
   - 性能考虑

请使用清晰的 Markdown 格式输出。`
  },
  bug_fix: {
    name: 'Bug 修复',
    description: '诊断和修复代码问题',
    content: `# Bug 修复

## Bug 描述
\${bug_description}

## 复现步骤
\${reproduction_steps}

## 相关代码
文件: \${file_path}

\`\`\`
\${code}
\`\`\`

## 分析任务
请进行以下分析:

1. **问题诊断**
   - 定位问题根源
   - 分析问题产生的原因

2. **修复方案**
   - 提供修复代码
   - 解释修复逻辑

3. **测试验证**
   - 提供测试用例验证修复
   - 确保没有引入新问题

4. **预防措施**
   - 建议如何预防类似问题
   - 代码改进建议`
  },
  refactoring: {
    name: '代码重构',
    description: '优化现有代码结构',
    content: `# 代码重构

## 待重构代码
文件: \${file_path}

\`\`\`
\${code}
\`\`\`

## 重构目标
\${refactoring_goal}

## 重构要求
请进行代码重构:

1. **重构分析**
   - 识别代码异味
   - 确定重构方向

2. **重构方案**
   - 提供重构后的代码
   - 保持功能等价
   - 改善代码结构

3. **改进点说明**
   - 列出主要改进点
   - 解释重构的好处

4. **迁移建议**
   - 如何安全地进行迁移
   - 需要注意的问题

请确保重构后代码更加清晰、可维护。`
  }
};

export default function PromptTemplateCreator({ isOpen, onClose, onSave }: PromptTemplateCreatorProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Custom');
  const [categories, setCategories] = useState<string[]>(['custom']);
  const [content, setContent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('blank');

  if (!isOpen) return null;

  const extractParameters = (text: string): PromptParameter[] => {
    const parameters: PromptParameter[] = [];
    const seen = new Set<string>();

    const patterns = [
      /\$\{(\w+)\}/g,
      /\{\{(\w+)\}\}/g,
      /<(\w+)>/g,
      /\[(\w+)\]/g
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const paramName = match[1];
        if (!seen.has(paramName)) {
          seen.add(paramName);
          parameters.push({
            name: paramName,
            description: `${paramName} 参数`,
            required: true,
            type: 'string'
          });
        }
      }
    }

    return parameters;
  };

  const handleSave = async () => {
    if (!name.trim() || !content.trim()) {
      alert('请填写模板名称和内容');
      return;
    }

    if (categories.length === 0) {
      alert('请至少选择一个分类');
      return;
    }

    const template: PromptTemplate = {
      id: `custom-${Date.now()}`,
      name,
      description: description || `自定义 ${name} 模板`,
      category,
      categories,
      source: 'custom',
      content,
      parameters: extractParameters(content)
    };

    try {
      const response = await fetch('/api/prompts/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template)
      });

      if (response.ok) {
        window.dispatchEvent(new Event('promptsUpdated'));
        onSave(template);
        onClose();
        setName('');
        setDescription('');
        setCategories(['custom']);
        setContent('');
      } else {
        alert('保存失败');
      }
    } catch (error) {
      console.error('保存模板失败:', error);
      alert('保存失败');
    }
  };

  const detectedParams = extractParameters(content);

  return (
    <div className="fixed top-0 right-0 w-2/3 h-full bg-white shadow-2xl z-50 flex flex-col border-l-2 border-gray-300">
      <div className="bg-white rounded-lg w-full h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">创建新 Prompt 模板</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">选择模板类型</label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {Object.entries(templateScaffolds).map(([key, scaffold]) => (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedTemplate(key);
                    setContent(scaffold.content);
                    if (key !== 'blank') {
                      setName(scaffold.name);
                      setDescription(scaffold.description);
                    }
                  }}
                  className={`p-3 border-2 rounded-lg text-left transition-all ${
                    selectedTemplate === key
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-sm">{scaffold.name}</div>
                  <div className="text-xs text-gray-600 mt-1">{scaffold.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">模板名称 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="例如: Python 代码审查"
            />
          </div>

          <CategorySelector
            selectedCategories={categories}
            onChange={setCategories}
            multiple={true}
            required={true}
          />

          <div>
            <label className="block text-sm font-medium mb-1">描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="简短描述这个模板的用途..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Prompt 内容 *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
              placeholder="输入 prompt 内容，使用 ${variable}, {{variable}}, <variable> 或 [variable] 定义参数"
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 支持的变量格式: ${'{'}variable{'}'}, {'{{'} variable {'}}'}, &lt;variable&gt;, [variable]
            </p>
          </div>

          {detectedParams.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-bold text-sm text-blue-800 mb-2">
                🔍 检测到的参数 ({detectedParams.length} 个)
              </h3>
              <div className="flex flex-wrap gap-2">
                {detectedParams.map(param => (
                  <span
                    key={param.name}
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-mono"
                  >
                    {param.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            保存模板
          </button>
        </div>
      </div>
    </div>
  );
}
