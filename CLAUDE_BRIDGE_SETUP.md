# Claude Local File Bridge - 完整使用指南

让网页版 Claude (claude.ai) 能够读写本地文件，实现类似 Claude Code CLI 的功能。

## 📋 目录

- [架构原理](#架构原理)
- [快速开始](#快速开始)
- [详细配置](#详细配置)
- [使用示例](#使用示例)
- [安全说明](#安全说明)
- [故障排查](#故障排查)

---

## 🏗️ 架构原理

```
claude.ai 网页 ←→ Chrome 扩展 ←→ 本地 WebSocket 服务 ←→ 本地文件系统
   (对话)         (Tool Calls)      (执行操作)           (实际读写)
```

**工作流程：**
1. 你在 claude.ai 对话中请求操作文件
2. Claude 返回包含 `<tool_use>` 标签的响应
3. Chrome 扩展捕获这些标签
4. 通过 WebSocket 发送到本地服务
5. 本地服务执行文件操作
6. 结果返回给扩展，注入到对话中

---

## 🚀 快速开始

### 步骤 1: 启动本地服务

在项目目录下运行：

```bash
npm run server
```

或指定允许访问的路径（推荐）：

```bash
npm run server -- 8765 /Users/gaodong/Desktop/my-project
```

你应该看到：

```
[Server] Starting Local File Service...
[Server] Port: 8765
[Server] Allowed paths: /Users/gaodong/Desktop/my-project
[Server] Listening on ws://localhost:8765
```

### 步骤 2: 安装 Chrome 扩展

**方法 1: 使用自动化脚本（推荐）**

```bash
npm run install:extension
```

脚本会自动打开 Chrome 扩展页面，你只需：
1. 启用"开发者模式"
2. 点击"加载已解压的扩展程序"
3. 选择显示的文件夹路径

**方法 2: 手动安装**

1. 打开 Chrome，访问 `chrome://extensions/`
2. 启用右上角的"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择项目中的 `extension/` 文件夹
5. 扩展安装成功后，会在工具栏显示图标

### 步骤 3: 配置扩展

1. 点击扩展图标
2. 确认 WebSocket URL 为 `ws://localhost:8765`
3. 检查连接状态：
   - ✓ 绿色 = 已连接
   - ✗ 红色 = 未连接

### 步骤 4: 在 Claude.ai 使用

打开 https://claude.ai，开始对话：

```
你好 Claude！我已经设置好了本地文件访问。
请读取 /Users/gaodong/Desktop/test.txt 的内容。
```

Claude 会返回：

```xml
<tool_use>
<tool_name>read_file</tool_name>
<parameters>
{
  "path": "/Users/gaodong/Desktop/test.txt"
}
</parameters>
</tool_use>
```

扩展会自动执行并显示结果！

---

## ⚙️ 详细配置

### 本地服务配置

#### 基本用法

```bash
npm run server -- <端口> <允许路径1> <允许路径2> ...
```

#### 示例

**1. 允许所有路径（⚠️ 不安全）**
```bash
npm run server
```

**2. 只允许特定项目**
```bash
npm run server -- 8765 /Users/gaodong/Desktop/my-project
```

**3. 允许多个项目**
```bash
npm run server -- 8765 \
  /Users/gaodong/Desktop/project1 \
  /Users/gaodong/Desktop/project2
```

### 扩展配置

1. 点击扩展图标打开设置
2. 修改 WebSocket URL（如果改了端口）
3. 点击"Save Settings"
4. 刷新 claude.ai 页面

---

## 💡 使用示例

### 示例 1: 读取文件

**对话：**
```
读取 app/page.tsx 文件的内容
```

**Claude 返回：**
```xml
<tool_use>
<tool_name>read_file</tool_name>
<parameters>
{
  "path": "/Users/gaodong/Desktop/my-project/app/page.tsx"
}
</parameters>
</tool_use>
```

**结果：**
```
✓ Tool Result:
{
  "path": "/Users/gaodong/Desktop/my-project/app/page.tsx",
  "content": "...",
  "size": 1234
}
```

### 示例 2: 创建文件

**对话：**
```
在 lib/utils.ts 创建一个新的工具函数：
- 函数名：formatDate
- 功能：格式化日期为 YYYY-MM-DD
```

**Claude 返回：**
```xml
<tool_use>
<tool_name>write_file</tool_name>
<parameters>
{
  "path": "/Users/gaodong/Desktop/my-project/lib/utils.ts",
  "content": "export function formatDate(date: Date): string {\n  return date.toISOString().split('T')[0];\n}"
}
</parameters>
</tool_use>
```

### 示例 3: 编辑文件

**对话：**
```
在 app/page.tsx 中，把 "Hello World" 改成 "Hello Claude"
```

**Claude 返回：**
```xml
<tool_use>
<tool_name>edit_file</tool_name>
<parameters>
{
  "path": "/Users/gaodong/Desktop/my-project/app/page.tsx",
  "old_string": "Hello World",
  "new_string": "Hello Claude"
}
</parameters>
</tool_use>
```

### 示例 4: 列出文件

**对话：**
```
列出 components/ 目录下的所有 .tsx 文件
```

**Claude 返回：**
```xml
<tool_use>
<tool_name>list_files</tool_name>
<parameters>
{
  "pattern": "*.tsx",
  "cwd": "/Users/gaodong/Desktop/my-project/components"
}
</parameters>
</tool_use>
```

### 示例 5: 运行命令

**对话：**
```
运行 npm test 看看测试是否通过
```

**Claude 返回：**
```xml
<tool_use>
<tool_name>run_command</tool_name>
<parameters>
{
  "command": "npm test",
  "cwd": "/Users/gaodong/Desktop/my-project"
}
</parameters>
</tool_use>
```

---

## 🔐 安全说明

### 白名单机制

**强烈建议**启动服务时指定允许访问的路径：

```bash
npm run server -- 8765 /Users/gaodong/Desktop/safe-project
```

这样 Claude 只能访问 `/Users/gaodong/Desktop/safe-project` 及其子目录。

### 风险提示

1. **不要在公共网络运行服务**
   - WebSocket 没有身份验证
   - 只在本地使用 (localhost)

2. **审查 Claude 的操作**
   - 扩展会显示每个工具调用
   - 危险操作会高亮显示

3. **不要共享扩展**
   - 此扩展只应在你自己的机器上使用

---

## 🔧 故障排查

### 问题 1: 扩展显示"未连接"

**检查：**
1. 本地服务是否正在运行？
   ```bash
   lsof -i :8765
   ```
2. 端口是否正确？
3. 刷新 claude.ai 页面

### 问题 2: Tool 执行失败

**检查：**
1. 文件路径是否正确？
2. 文件是否在白名单路径内？
3. 查看浏览器控制台 (F12) 的错误信息

### 问题 3: 没有检测到 tool_use

**检查：**
1. 扩展是否已加载？访问 `chrome://extensions/` 确认
2. 打开浏览器控制台 (F12)，查看是否有 `[Bridge]` 日志
3. 尝试刷新页面

### 问题 4: 权限被拒绝

**原因：**
文件不在允许的路径内

**解决：**
重新启动服务，添加该路径：
```bash
npm run server -- 8765 /path/to/your/project
```

---

## 📊 支持的工具

| 工具名 | 功能 | 参数 |
|--------|------|------|
| `read_file` | 读取文件 | `path: string` |
| `write_file` | 写入文件 | `path: string, content: string` |
| `edit_file` | 编辑文件 | `path: string, old_string: string, new_string: string` |
| `list_files` | 列出文件 | `pattern: string, cwd?: string` |
| `run_command` | 运行命令 | `command: string, cwd?: string, timeout?: number` |

---

## 🧪 测试

### 运行单元测试

```bash
npm test -- server/__tests__/file-service.test.ts
```

### 运行端到端测试

```bash
# 终端 1: 启动服务
npm run server

# 终端 2: 运行测试
npm run test:bridge
```

---

## 🎯 最佳实践

1. **始终使用白名单**
   ```bash
   npm run server -- 8765 /path/to/safe/project
   ```

2. **使用完整路径**
   - ✅ `/Users/gaodong/Desktop/project/file.txt`
   - ❌ `./file.txt`

3. **审查 Claude 的操作**
   - 检查 `<tool_use>` 块中的路径和命令
   - 危险操作前确认

4. **定期重启服务**
   - 更新白名单后重启
   - 切换项目时重启

---

## 📝 常见问题

**Q: 能在其他网站使用吗？**  
A: 不能，扩展只在 claude.ai 上工作。

**Q: 支持其他浏览器吗？**  
A: 目前只支持 Chrome/Edge（Chromium 内核）。

**Q: 能访问远程文件吗？**  
A: 不能，只能访问本机文件系统。

**Q: 如何卸载？**  
A: 访问 `chrome://extensions/`，点击"移除"。

---

## 🚀 开始使用

1. 启动服务：`npm run server -- 8765 /path/to/your/project`
2. 加载扩展：`chrome://extensions/` → 加载 `extension/`
3. 打开 claude.ai，开始对话！

**享受 Claude 操作本地文件的强大功能！** 🎉
