export interface WorkflowStep {
  id: string;
  name: string;
  prompt: string;
  autoExecute?: boolean;
  requiresApproval?: boolean;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  icon: string;
  steps: WorkflowStep[];
  config: {
    projectPath?: string;
    includeContext?: boolean;
    autoCommit?: boolean;
    runTests?: boolean;
  };
}

export const workflows: Workflow[] = [
  {
    id: 'feature-complete',
    name: '功能开发完整流程',
    icon: '🚀',
    description: '从需求到上线：开发 → Review → 单元测试 → E2E测试 → Commit',
    config: {
      includeContext: true,
      autoCommit: true,
      runTests: true
    },
    steps: [
      {
        id: 'analyze',
        name: '1. 需求分析',
        requiresApproval: false,
        prompt: `# 需求分析阶段

你是一位资深的技术架构师。请分析以下需求并给出技术方案。

<requirement>
{{requirement}}
</requirement>

<project_context>
当前项目路径: {{project_path}}
技术栈: {{tech_stack}}
</project_context>

<codebase_context>
{{codebase_files}}
</codebase_context>

**请输出**:
1. **功能拆解**: 将需求拆分为具体的子任务
2. **技术方案**: 
   - 涉及的文件和模块
   - 数据结构设计
   - API设计（如有）
   - 状态管理方案
3. **依赖检查**: 需要新增的依赖
4. **风险评估**: 潜在的技术风险
5. **工作量评估**: 预估开发时间

**输出格式**: 使用Markdown，清晰分段`
      },
      {
        id: 'implement',
        name: '2. 代码实现',
        requiresApproval: false,
        prompt: `# 代码实现阶段

基于上一步的技术方案，现在开始编写代码。

<implementation_plan>
{{previous_output}}
</implementation_plan>

<project_context>
项目路径: {{project_path}}
相关文件: {{related_files}}
</project_context>

**实现要求**:
1. ✅ 遵循项目现有的代码风格和架构模式
2. ✅ 使用项目已有的工具库和组件
3. ✅ 添加必要的错误处理
4. ✅ 添加适当的类型定义（TypeScript）
5. ✅ 代码清晰可读，关键逻辑添加注释
6. ✅ 考虑边界条件和异常情况

**输出**:
- 完整的代码文件（可直接使用）
- 如需修改现有文件，提供完整的文件内容
- 列出所有需要创建/修改的文件路径`
      },
      {
        id: 'review',
        name: '3. 代码审查',
        requiresApproval: false,
        prompt: `# 代码审查阶段

你是一位严格的代码审查专家。请review刚刚实现的代码。

<implemented_code>
{{previous_output}}
</implemented_code>

<git_diff>
{{git_diff}}
</git_diff>

**审查维度**:
- 🔒 **安全**: SQL注入、XSS、敏感信息泄露
- ⚡ **性能**: 不必要的重渲染、N+1查询、内存泄漏
- 🐛 **Bug风险**: 空值检查、边界条件、并发问题
- 📖 **可读性**: 命名、注释、复杂度
- 🏗️ **架构**: SOLID原则、设计模式是否合理
- ✅ **测试覆盖**: 是否需要补充测试

**输出格式**:
## 🚨 严重问题 (Blocker)
- [ ] 问题描述 | 文件:行号 | 修复建议

## ⚠️ 重要问题 (Major)  
- [ ] 问题描述 | 文件:行号 | 修复建议

## 💡 优化建议 (Minor)
- [ ] 建议描述

## ✨ 优秀实践
- 列出值得称赞的地方

**如果有严重或重要问题，提供修复后的完整代码**`
      },
      {
        id: 'unit-test',
        name: '4. 单元测试生成',
        requiresApproval: false,
        prompt: `# 单元测试生成阶段

为刚刚实现的代码生成全面的单元测试。

<code_to_test>
{{implemented_code}}
</code_to_test>

<project_test_setup>
测试框架: {{test_framework}}
测试文件模式: {{test_pattern}}
现有测试示例: {{existing_tests}}
</project_test_setup>

**测试要求**:
- ✅ 覆盖所有公共方法/函数
- ✅ 测试正常流程
- ✅ 测试边界条件（空值、边界值）
- ✅ 测试异常情况
- ✅ Mock 外部依赖
- ✅ 目标覆盖率: 90%+

**输出**:
1. 完整的测试文件（可直接运行）
2. Mock配置（如需要）
3. 测试覆盖率分析
4. 测试执行命令`
      },
      {
        id: 'e2e-test',
        name: '5. E2E测试生成',
        requiresApproval: false,
        prompt: `# E2E测试生成阶段

为完整的功能流程生成端到端测试。

<feature_description>
{{requirement}}
</feature_description>

<implementation>
{{implemented_code}}
</implementation>

<e2e_setup>
E2E框架: {{e2e_framework}}
测试文件模式: {{e2e_pattern}}
现有E2E示例: {{existing_e2e}}
</e2e_setup>

**测试场景**:
- ✅ 用户完整操作流程
- ✅ 成功路径测试
- ✅ 错误处理测试
- ✅ 边界条件测试
- ✅ 多用户/并发场景（如适用）

**输出**:
1. 完整的E2E测试文件
2. 测试数据准备脚本（如需要）
3. 测试执行命令`
      },
      {
        id: 'commit',
        name: '6. 提交代码',
        autoExecute: false,
        requiresApproval: true,
        prompt: `# 代码提交阶段

根据本次开发的所有变更，生成合适的 Git commit 信息。

<changes_summary>
{{all_changes}}
</changes_summary>

<git_diff>
{{git_diff}}
</git_diff>

**Commit Message格式** (遵循 Conventional Commits):
\`\`\`
<type>(<scope>): <subject>

<body>

<footer>
\`\`\`

**Type类型**:
- feat: 新功能
- fix: Bug修复
- refactor: 重构
- test: 添加测试
- docs: 文档更新
- style: 代码格式调整
- perf: 性能优化

**输出**:
1. Commit message（完整格式）
2. 需要添加到暂存区的文件列表
3. Commit命令（可直接执行）`
      }
    ]
  },
  {
    id: 'bug-fix-complete',
    name: 'Bug修复完整流程',
    icon: '🐛',
    description: '从Bug分析到修复提交：定位 → 修复 → 测试 → Commit',
    config: {
      includeContext: true,
      autoCommit: true,
      runTests: true
    },
    steps: [
      {
        id: 'diagnose',
        name: '1. Bug诊断',
        prompt: `# Bug诊断阶段

你是一位经验丰富的调试专家。请分析以下Bug。

<bug_report>
{{bug_description}}
</bug_report>

<error_logs>
{{error_logs}}
</error_logs>

<related_code>
{{related_files}}
</related_code>

**诊断内容**:
1. **根因分析** (5W1H):
   - What: 具体什么问题
   - Why: 为什么发生
   - When: 什么时候触发
   - Where: 哪个模块/文件
   - Who: 影响范围
   - How: 如何复现

2. **影响评估**:
   - 严重程度
   - 影响范围
   - 是否需要紧急修复

3. **修复方案**（至少2种）:
   - 方案A: [描述 + 优缺点]
   - 方案B: [描述 + 优缺点]
   - 推荐方案及理由`
      },
      {
        id: 'fix',
        name: '2. Bug修复',
        prompt: `# Bug修复阶段

基于上一步的诊断结果，实现Bug修复。

<diagnosis>
{{previous_output}}
</diagnosis>

<buggy_code>
{{buggy_files}}
</buggy_code>

**修复要求**:
- ✅ 修复根本原因，不是表面症状
- ✅ 不引入新的Bug
- ✅ 保持代码风格一致
- ✅ 添加必要的防御性代码
- ✅ 更新相关文档/注释

**输出**:
- 修复后的完整代码
- 关键修改点说明
- 修复验证方法`
      },
      {
        id: 'regression-test',
        name: '3. 回归测试',
        prompt: `# 回归测试阶段

为Bug修复生成回归测试，防止问题再次出现。

<bug_description>
{{bug_description}}
</bug_description>

<fix>
{{previous_output}}
</fix>

**测试用例设计**:
- ✅ 复现原Bug的测试用例
- ✅ 边界条件测试
- ✅ 相关功能的回归测试

**输出**:
1. 完整的测试代码
2. 测试执行命令
3. 预期结果说明`
      },
      {
        id: 'commit-fix',
        name: '4. 提交修复',
        requiresApproval: true,
        prompt: `# 提交Bug修复

生成Bug修复的commit message。

<fix_summary>
{{all_changes}}
</fix_summary>

<git_diff>
{{git_diff}}
</git_diff>

**Commit格式**:
\`\`\`
fix(<scope>): <简短描述Bug>

- 问题: [Bug的具体表现]
- 根因: [根本原因]
- 修复: [修复方法]
- 测试: [如何验证]

Fixes #<issue_number>
\`\`\`

**输出完整的commit命令**`
      }
    ]
  },
  {
    id: 'refactor-complete',
    name: '代码重构完整流程',
    icon: '♻️',
    description: '安全重构：分析 → 重构 → 测试 → Commit',
    config: {
      includeContext: true,
      autoCommit: true,
      runTests: true
    },
    steps: [
      {
        id: 'analyze-refactor',
        name: '1. 重构分析',
        prompt: `# 重构分析阶段

分析待重构的代码，制定重构计划。

<code_to_refactor>
{{target_code}}
</code_to_refactor>

<refactor_goal>
{{refactor_goal}}
</refactor_goal>

**分析内容**:
1. **代码问题识别**:
   - 代码异味（Code Smells）
   - 重复代码
   - 复杂度过高
   - 违反设计原则

2. **重构计划**:
   - 重构步骤（由小到大）
   - 每步的风险评估
   - 测试策略

3. **预期收益**:
   - 可读性提升
   - 可维护性提升
   - 性能影响（如有）`
      },
      {
        id: 'refactor-code',
        name: '2. 执行重构',
        prompt: `# 执行重构

基于重构计划，逐步重构代码。

<refactor_plan>
{{previous_output}}
</refactor_plan>

<original_code>
{{target_code}}
</original_code>

**重构原则**:
- ✅ 小步快跑，每步可验证
- ✅ 保持API接口不变（除非明确要改）
- ✅ 不改变业务逻辑
- ✅ 及时补充测试

**输出**:
1. 重构后的完整代码
2. 关键变更说明
3. API变更列表（如有）
4. 迁移指南（如有API变更）`
      },
      {
        id: 'refactor-test',
        name: '3. 重构测试',
        prompt: `# 重构测试验证

验证重构没有破坏原有功能。

<original_code>
{{original_code}}
</original_code>

<refactored_code>
{{previous_output}}
</refactored_code>

**测试策略**:
- ✅ 运行现有测试（应该全部通过）
- ✅ 补充缺失的测试
- ✅ 性能对比测试（如是性能重构）

**输出**:
1. 测试执行命令
2. 性能对比报告（如适用）
3. 测试覆盖率报告`
      },
      {
        id: 'commit-refactor',
        name: '4. 提交重构',
        requiresApproval: true,
        prompt: `# 提交重构代码

生成重构的commit message。

<refactor_summary>
{{all_changes}}
</refactor_summary>

**Commit格式**:
\`\`\`
refactor(<scope>): <重构目标>

- 重构内容: [具体做了什么]
- 动机: [为什么要重构]
- 影响: [对现有代码的影响]
- 测试: [如何验证]
\`\`\`

**输出完整的commit命令**`
      }
    ]
  }
];

export function getWorkflowById(id: string): Workflow | undefined {
  return workflows.find(w => w.id === id);
}
