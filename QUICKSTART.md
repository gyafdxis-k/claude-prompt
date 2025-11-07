# 快速开始指南

## ✅ 已完成重构

我已经按照你的要求重新开发了整个系统，现在具备以下特性：

### 1. 完整工作流系统（参考Aider）
- **功能开发流程**: 需求分析 → 实现 → Review → 单元测试 → E2E测试 → Commit
- **Bug修复流程**: 诊断 → 修复 → 回归测试 → Commit
- **代码重构流程**: 分析 → 重构 → 测试 → Commit

### 2. 项目上下文自动管理（参考Cursor）
- 自动扫描项目结构
- 识别技术栈和测试框架
- 读取相关文件内容提供给AI

### 3. Prompt实时预览
- 左侧输入参数
- 右侧实时显示渲染后的完整Prompt
- 可复制用于其他工具

### 4. Git集成
- 自动获取git diff
- AI生成Conventional Commits格式的commit message
- 支持一键提交

### 5. 使用你的环境变量
- 已配置使用 ANTHROPIC_AUTH_TOKEN
- 支持 ANTHROPIC_BASE_URL
- 支持 CLAUDE_CODE_MAX_OUTPUT_TOKENS

---

## 🚀 立即开始使用

### 步骤1: 启动应用

应用已在 **http://localhost:3000** 运行

### 步骤2: 设置项目路径

1. 打开浏览器访问 http://localhost:3000
2. 点击右上角 "⚙️ 设置"
3. 输入你要开发的项目路径（例如: `/Users/gaodong/Desktop/my-project`）
4. 点击"保存并重新扫描"

### 步骤3: 选择工作流

从左侧选择一个工作流：
- 🚀 功能开发完整流程
- 🐛 Bug修复完整流程
- ♻️ 代码重构完整流程

### 步骤4: 填写需求并执行

1. 在"需求描述"中详细描述你的需求
2. 可选：填写相关文件路径（每行一个）
3. 点击"显示Prompt"查看将发送给Claude的完整Prompt
4. 点击"执行此步骤"开始

### 步骤5: 逐步完成工作流

- 每一步完成后，点击"继续下一步"
- 查看AI的输出
- 最后一步会生成commit命令，你可以直接执行

---

## 💡 示例：开发一个登录功能

1. 选择 "🚀 功能开发完整流程"

2. 填写需求：
```
实现用户登录功能：
- 支持邮箱+密码登录
- 表单验证（邮箱格式、密码长度≥6）
- 登录失败3次后锁定5分钟
- 成功后跳转到/dashboard
- 使用JWT做身份验证
```

3. 填写相关文件（可选）：
```
app/api/auth/route.ts
lib/auth.ts
components/LoginForm.tsx
```

4. 点击"显示Prompt"查看完整上下文

5. 点击"执行此步骤"

6. AI会输出：
   - 功能拆解
   - 技术方案（涉及的文件、数据结构、API设计）
   - 依赖检查
   - 风险评估
   - 工作量评估

7. 继续下一步，AI会生成完整代码

8. 继续Review、测试...最后生成commit命令

---

## 🎨 Prompt预览功能

点击"显示Prompt"按钮，右侧会显示：

```
# 需求分析阶段

你是一位资深的技术架构师。请分析以下需求并给出技术方案。

<requirement>
实现用户登录功能：
- 支持邮箱+密码登录
...
</requirement>

<project_context>
当前项目路径: /Users/gaodong/Desktop/my-project
技术栈: React, Next.js, TypeScript
</project_context>

<codebase_context>
### app/api/auth/route.ts
```
[文件内容]
```

### lib/auth.ts
```
[文件内容]
```
</codebase_context>

**请输出**:
1. **功能拆解**: ...
2. **技术方案**: ...
...
```

这就是发送给Claude的完整Prompt，你可以：
- 复制它用于其他AI工具
- 检查上下文是否正确
- 学习优秀的Prompt写法

---

## 🔧 关键改进点

相比之前的版本：

### 1. ✅ 真正的工作流系统
- 不是独立的模版，而是完整的流程
- 每一步的输出会传递给下一步
- 自动注入git diff、项目上下文等

### 2. ✅ Prompt预览
- 之前：看不到最终的Prompt
- 现在：实时显示渲染后的完整Prompt

### 3. ✅ 项目上下文
- 之前：需要手动粘贴代码
- 现在：自动扫描项目，读取相关文件

### 4. ✅ 使用你的环境变量
- 直接使用 ANTHROPIC_AUTH_TOKEN
- 无需在UI中设置API Key

### 5. ✅ Git集成
- 自动获取当前变更
- AI生成规范的commit message

### 6. ✅ 更专业的Prompt
- 参考Cursor/Aider的最佳实践
- 使用XML标签结构化
- 明确的输出格式要求

---

## 📚 下一步

1. **尝试完整流程**: 用真实需求测试工作流
2. **查看Prompt**: 学习优秀的Prompt写法
3. **自定义工作流**: 编辑 `lib/workflows/workflow-templates.ts`
4. **反馈问题**: 遇到问题随时告诉我

---

**现在就开始使用吧！** 🎉
