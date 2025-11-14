# Claude Dev Assistant - AI驱动的开发工作流工具

一个专业的AI代码助手，提供从开发到提交的完整工作流，参考了Cursor和Aider的最佳实践。

## ✨ 核心特性

### 🔄 完整工作流系统
- **功能开发完整流程**: 需求分析 → 代码实现 → Code Review → 单元测试 → E2E测试 → Git Commit
- **Bug修复完整流程**: Bug诊断 → 修复实现 → 回归测试 → Git Commit  
- **代码重构完整流程**: 重构分析 → 执行重构 → 测试验证 → Git Commit

### 📁 智能项目上下文
- 自动扫描项目结构并识别技术栈
- 自动检测测试框架（Vitest, Jest, Playwright等）
- 提供相关代码上下文给AI

### 👁️ 实时Prompt预览
- 左侧输入参数，右侧实时显示渲染后的Prompt
- 支持复制Prompt用于其他工具

### 🔧 Git自动集成
- 自动获取git diff
- AI生成符合Conventional Commits的commit message

---

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制示例配置文件并编辑：

```bash
cp .env.local.example .env.local
```

然后编辑 `.env.local` 文件，填入你的 API Key：

```env
NEXT_PUBLIC_ANTHROPIC_AUTH_TOKEN=sk-ant-xxxxx

# 可选：如果需要使用代理（国内用户）
# NEXT_PUBLIC_ANTHROPIC_BASE_URL=https://your-proxy-url.com

# 可选：最大输出 token 数
NEXT_PUBLIC_CLAUDE_CODE_MAX_OUTPUT_TOKENS=32000
```

**重要提示**：
- 不要使用 `claudecode.site` 作为 Base URL，该域名已被 Cloudflare 拦截
- 如果留空 `NEXT_PUBLIC_ANTHROPIC_BASE_URL`，将使用 Anthropic 官方 API

### 3. 启动应用

```bash
npm run dev
```

访问 http://localhost:3000

**注意**：无需安装任何浏览器扩展或启动额外的文件服务器，所有文件操作都通过 Next.js 服务端 API 直接执行。

### 4. 设置项目路径

1. 点击右上角"⚙️ 设置"
2. 输入你要开发的项目的绝对路径
3. 点击"保存并重新扫描"

---

## 📖 使用指南

详细使用指南请查看 `USAGE.md`

## 🎯 工作流

### 1. 功能开发完整流程

需求分析 → 代码实现 → Review → 单元测试 → E2E测试 → Commit

### 2. Bug修复完整流程  

Bug诊断 → 修复 → 回归测试 → Commit

### 3. 代码重构完整流程

重构分析 → 执行重构 → 测试 → Commit

---

## 🛠️ 技术栈

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS
- Claude API (Anthropic)
- Monaco Editor
- ReactMarkdown

---

**享受AI驱动的开发体验！** 🚀
