# 🎨 Prompt Studio 完整使用指南

## 🎉 新功能概览

### Prompt Studio - 专业的 AI Prompt 管理平台

**从 50+ 真实 AI 工具中提取的 Prompt 模板，包括：**
- ✅ Claude Code - Anthropic 官方 CLI 系统提示
- ✅ Cursor - Agent、Chat、Memory 等多个模板
- ✅ VSCode Agent - 多种模型的系统提示
- ✅ Augment Code - GPT-5 和 Claude 4 Agent
- ✅ Cline - 开源 AI 编程助手
- ✅ RooCode、Bolt、Codex CLI 等更多...

## 🚀 快速开始

### 1. 访问 Prompt Studio

打开浏览器访问: **http://localhost:3000**

点击顶部导航栏的 **"🎨 Prompt Studio"** 按钮

### 2. 界面布局

```
┌────────────────────────────────────────────────────────────┐
│  🚀 Claude Dev Assistant    [🎨 Prompt Studio] [🔄 工作流]  │
├──────────────┬──────────────┬──────────────────────────────┤
│              │              │                              │
│  📚 模板库   │  ⚙️ 参数配置  │    👁️ Prompt 预览            │
│              │              │                              │
│  • Claude    │  填写参数:   │  完整的 Prompt 内容          │
│  • Cursor    │  ┌─────────┐│  (实时渲染)                  │
│  • VSCode    │  │ task    ││                              │
│  • Augment   │  ├─────────┤│  统计信息:                   │
│  • ...       │  │ file    ││  • 字符数                    │
│              │  └─────────┘│  • 行数                      │
│  (可搜索)    │              │  • 参数状态                  │
│              │  [🚀执行]   │                              │
└──────────────┴──────────────┴──────────────────────────────┘
```

## 📖 详细使用流程

### 步骤 1: 选择 Prompt 模板

#### 1.1 浏览模板库（左侧面板）

**特性：**
- 🔍 **搜索框**: 输入关键词搜索模板
- 🏷️ **分类标签**: 按工具分类（Claude Code, Cursor, 等）
- 📊 **统计信息**: 显示找到的模板数量

**操作：**
1. 滚动浏览所有可用模板
2. 或使用搜索框输入关键词（如 "code review", "debug", "agent"）
3. 点击分类标签快速筛选

#### 1.2 查看模板详情

每个模板卡片显示：
- **模板名称** - 如 "Claude Code 系统提示"
- **分类标签** - 如 "Claude Code"
- **描述** - 简短说明
- **参数列表** - 需要填写的参数（最多显示 5 个）

**点击任意模板卡片即可选中**

### 步骤 2: 填写参数（中间面板）

#### 2.1 参数类型

系统支持 5 种参数类型：

| 类型 | 图标 | 说明 | 示例 |
|------|------|------|------|
| **string** | 🔤 | 普通文本 | 任务描述、查询内容 |
| **file** | 📄 | 单个文件路径 | `app/page.tsx` |
| **files** | 📁 | 多个文件（每行一个） | `app/page.tsx`<br>`lib/utils.ts` |
| **code** | 💻 | 代码片段 | 完整的代码块 |
| **number** | 🔢 | 数字 | 行号、数量等 |

#### 2.2 必填 vs 可选

- **红色星号 ***: 必填参数（必须填写才能执行）
- **无星号**: 可选参数

#### 2.3 智能表单

系统会根据参数名自动选择合适的输入组件：

**示例 1: 任务描述（多行文本框）**
```
参数名: task, requirement, query, message
↓
显示为: 大文本框（6 行）
```

**示例 2: 文件路径（单行输入）**
```
参数名: file, path
↓
显示为: 文本输入框 + 提示信息
提示: 💡 输入项目中的文件路径
```

**示例 3: 代码（代码编辑器）**
```
参数名: code, content
↓
显示为: 代码文本框（8 行，等宽字体）
提示: 💡 粘贴相关代码片段
```

#### 2.4 填写技巧

**文件路径参数：**
```
✅ 正确: app/page.tsx
✅ 正确: /Users/gaodong/Desktop/project/src/main.ts
❌ 错误: 相对路径 ./file.ts（除非模板支持）
```

**多文件参数：**
```
app/page.tsx
lib/utils.ts
components/Button.tsx
```
每行一个文件路径

**代码参数：**
```typescript
function hello() {
  console.log("Hello World");
}
```
直接粘贴完整代码

### 步骤 3: 实时预览 Prompt（右侧面板）

#### 3.1 预览功能

**实时渲染：**
- 输入参数后，**立即**看到渲染后的完整 Prompt
- 所有变量（`${var}`, `{{var}}`, `<var>`, `[var]`）都会被替换
- 高亮显示未填写的变量

**颜色编码：**
- 🔵 蓝色: `${variable}`
- 🟣 紫色: `{{variable}}`
- 🟢 绿色: `<variable>`
- 🟠 橙色: `[variable]`

#### 3.2 统计信息

显示 Prompt 的详细统计：
- **总字符数**: 用于估算 token 使用量
- **行数**: Prompt 的总行数
- **单词数**: 英文单词计数
- **已填参数**: 3 / 5（已填 / 总数）

#### 3.3 参数状态

显示每个参数的填写状态：
- 🟢 绿点: 已填写
- 🔴 红点: 必填但未填
- ⚪ 灰点: 可选且未填

#### 3.4 复制功能

点击右上角 **"📋 复制"** 按钮，将完整的渲染后 Prompt 复制到剪贴板

### 步骤 4: 执行 Prompt

#### 4.1 执行前检查

点击 **"🚀 执行 Prompt"** 按钮前，系统会自动检查：
- ✅ 所有必填参数是否已填写
- ✅ 参数值是否为空

如果有缺失，会弹出提示：
```
⚠️ 请填写必填参数: task, file
```

#### 4.2 执行过程

**点击执行按钮后：**

1. **按钮变化**
   ```
   🚀 执行 Prompt  →  ⏳ 执行中...
   ```

2. **弹出实时显示窗口**（右下角）
   ```
   ┌────────────────────────────────────┐
   │ 🧠 Claude 思考中...    ● ● ●      │
   ├──────────┬─────────────────────────┤
   │ 📤 Prompt│ 📥 响应 ▊               │
   │          │                         │
   │ (左 1/3) │ (右 2/3)                │
   │          │ 实时流式显示...          │
   └──────────┴─────────────────────────┘
   ```

3. **实时显示内容**
   - **左侧**: 发送给 Claude 的完整 Prompt
   - **右侧**: Claude 的实时响应（Markdown 渲染）
   - **光标**: ▊ 显示正在生成

4. **完成后**
   - 实时窗口延迟 2 秒后自动关闭
   - 执行历史计数器 +1

#### 4.3 查看历史

左下角显示执行历史统计：
```
┌─────────────────┐
│ 📊 执行历史     │
│ 已执行 3 次     │
└─────────────────┘
```

## 🎯 实际使用案例

### 案例 1: 使用 Claude Code 系统提示

**场景**: 你想让 AI 帮你重构代码

**步骤：**

1. **选择模板**
   - 在左侧搜索 "claude code"
   - 点击 "Claude Code 系统提示"

2. **填写参数**
   ```
   cwd: /Users/gaodong/Desktop/claude_prompt/claude-dev-assistant
   task: 重构 app/page.tsx，将状态管理逻辑提取到单独的 hook
   file: app/page.tsx
   ```

3. **预览 Prompt**
   - 右侧查看完整的系统提示
   - 确认所有变量都已替换

4. **执行**
   - 点击 "🚀 执行 Prompt"
   - 观察实时响应
   - 获得详细的重构建议

### 案例 2: 使用 Cursor Agent Prompt

**场景**: 需要 AI 审查和修改代码

**步骤：**

1. **选择模板**
   - 搜索 "cursor agent"
   - 选择 "Cursor Agent 提示"

2. **填写参数**
   ```
   user_query: 这段代码有内存泄漏问题，帮我找出并修复
   
   target_file: lib/workflows/workflow-engine.ts
   
   code: 
   async executeStep(step, context) {
     const stream = await this.getStream();
     // ... 可能有问题的代码
   }
   ```

3. **实时查看**
   - AI 会分析代码
   - 指出具体问题
   - 提供修复方案

### 案例 3: 自定义参数组合

**场景**: 使用开源 Cline Prompt 进行文件搜索

**步骤：**

1. **选择** "Cline 提示"

2. **填写多文件参数**
   ```
   path: src/
   
   regex: interface.*Context
   
   file_pattern: *.ts
   ```

3. **执行并获取结果**

## 🔧 高级功能

### 1. 参数智能识别

系统会自动识别 Prompt 模板中的参数：

**支持的变量格式：**
```
${variable}    - Shell 风格
{{variable}}   - Mustache 风格
<variable>     - XML 风格
[variable]     - 方括号风格
```

**自动推断参数类型：**
- 包含 "file" → 文件类型
- 包含 "code" → 代码类型
- 包含 "count", "number" → 数字类型
- 其他 → 字符串类型

### 2. 自动填充

系统会自动填充某些常见参数：
- `cwd` → 当前项目路径
- `project_path` → 当前项目路径

### 3. 重置功能

点击 **"🔄 重置为默认值"** 可以：
- 清空所有已填参数
- 恢复模板的默认值（如果有）

### 4. 参数验证

**必填验证：**
- 未填写必填参数时无法执行
- 会显示清晰的错误提示

**格式提示：**
- 每个输入框都有上下文提示
- 帮助用户理解应该填什么

## 📊 可用的 Prompt 模板

### Claude Code 分类
- **claude-code-system-prompt** - 完整的 CLI 系统提示

### Cursor Prompts 分类
- **Agent Prompt** - Cursor Agent 核心提示
- **Agent Prompt v1.0, v1.2** - 不同版本
- **Chat Prompt** - Cursor Chat 提示
- **Memory Prompt** - 记忆管理提示
- **Memory Rating Prompt** - 记忆评分

### VSCode Agent 分类
- **gpt-5** - GPT-5 系统提示
- **gpt-5-mini** - GPT-5 Mini 版本
- **claude-sonnet-4** - Claude Sonnet 4
- **gemini-2.5-pro** - Gemini 2.5 Pro

### Augment Code 分类
- **gpt-5-agent-prompts** - GPT-5 Agent
- **claude-4-sonnet-agent-prompts** - Claude 4 Sonnet

### Open Source 分类
- **Cline Prompt** - 开源 AI 编程助手
- **RooCode Prompt** - RooCode 系统提示
- **Bolt Prompt** - Bolt 开发工具
- **Codex CLI Prompt** - OpenAI Codex CLI

### 还有更多...
- CodeBuddy、Lovable、Manus Agent、Orchids.app 等

## 🎨 界面操作技巧

### 搜索技巧

**搜索关键词示例：**
```
"code review"  → 找到所有代码审查相关模板
"agent"        → 找到所有 Agent 类型模板
"claude"       → 找到所有 Claude 相关模板
"cursor"       → 找到 Cursor 的所有模板
"debug"        → 找到调试相关模板
```

### 快速切换

**分类快速切换：**
1. 点击分类标签立即筛选
2. 点击 "全部" 查看所有模板

### 参数填写效率

**使用 Tab 键：**
- 在输入框之间快速切换
- 提高填写效率

**复制粘贴：**
- 代码参数支持直接粘贴
- 文件列表可以批量粘贴

## 🐛 常见问题

### Q1: 找不到想要的模板？

**A:** 使用搜索功能！输入关键词如 "code", "review", "debug" 等

### Q2: 参数不知道填什么？

**A:** 
- 查看参数描述（每个参数下方都有说明）
- 查看右侧预览，了解变量在 Prompt 中的位置
- 查看 💡 提示信息

### Q3: 执行没有反应？

**A:** 检查：
- 是否填写了所有必填参数（红色星号）
- 浏览器控制台 (F12) 是否有错误
- 终端是否正常运行 `npm run dev`

### Q4: 想看完整的 Prompt 内容？

**A:** 
- 右侧预览面板显示完整内容
- 点击 "📋 复制" 复制到剪贴板
- 或在模板库中查看模板源文件

### Q5: 如何添加自己的模板？

**A:** 
1. 在 `/Users/gaodong/Desktop/claude_prompt/system-prompts-and-models-of-ai-tools` 目录添加 `.txt` 或 `.md` 文件
2. 刷新页面，系统会自动扫描
3. 使用 `${variable}` 或 `{{variable}}` 定义参数

## 🚀 性能优化

### 加载速度

**首次加载：**
- 扫描所有 Prompt 模板（约 1-2 秒）
- 提取参数和元数据

**后续使用：**
- 模板选择和参数填写：即时响应
- Prompt 预览：实时渲染

### 内存使用

- 所有模板内容在客户端缓存
- 只在首次访问时加载

## 📝 总结

### 核心优势

1. ✅ **真实模板** - 从 50+ AI 工具提取的生产级 Prompt
2. ✅ **智能参数** - 自动识别和类型推断
3. ✅ **实时预览** - 所见即所得
4. ✅ **流式显示** - 实时查看 AI 响应
5. ✅ **简单易用** - 3 步完成：选择 → 填写 → 执行

### 使用场景

- 🔍 **学习** - 研究顶级 AI 工具的 Prompt 设计
- 🎨 **创作** - 基于真实模板创建自己的 Prompt
- 🚀 **开发** - 直接使用专业 Prompt 辅助编程
- 📊 **对比** - 比较不同工具的 Prompt 策略

---

**立即开始使用！** 

访问: **http://localhost:3000**  
点击: **🎨 Prompt Studio**

✨ 体验专业级 AI Prompt 管理平台！
