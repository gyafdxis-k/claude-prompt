# API 配置指南

本文档详细说明如何配置 Anthropic API Key 和 API URL。

---

## 📋 目录

- [方法 1: 环境变量（推荐）](#方法-1-环境变量推荐)
- [方法 2: .env 文件](#方法-2-env-文件)
- [方法 3: Shell 配置文件](#方法-3-shell-配置文件)
- [自定义 API URL](#自定义-api-url)
- [验证配置](#验证配置)
- [常见问题](#常见问题)

---

## 方法 1: 环境变量（推荐）

### macOS / Linux

**临时设置（当前终端会话）**:
```bash
export ANTHROPIC_API_KEY='sk-ant-api03-...'
```

**永久设置（推荐）**:
```bash
# 对于 Zsh (macOS 默认)
echo 'export ANTHROPIC_API_KEY="sk-ant-api03-..."' >> ~/.zshrc
source ~/.zshrc

# 对于 Bash
echo 'export ANTHROPIC_API_KEY="sk-ant-api03-..."' >> ~/.bashrc
source ~/.bashrc
```

### Windows

**PowerShell**:
```powershell
# 临时设置
$env:ANTHROPIC_API_KEY = "sk-ant-api03-..."

# 永久设置（用户级别）
[System.Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", "sk-ant-api03-...", "User")
```

**命令提示符 (CMD)**:
```cmd
# 临时设置
set ANTHROPIC_API_KEY=sk-ant-api03-...

# 永久设置
setx ANTHROPIC_API_KEY "sk-ant-api03-..."
```

---

## 方法 2: .env 文件

### 创建 .env 文件

在项目根目录创建 `.env` 文件：

```bash
# 项目根目录 (/Users/gaodong/Desktop/claude-prompt/)
cat > .env << 'EOF'
# Anthropic API 配置
ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here

# 可选: 自定义 API URL (如果使用代理或中转服务)
# ANTHROPIC_API_URL=https://your-custom-api-url.com
EOF
```

### 使用 .env.example 模板

```bash
# 复制示例文件
cp .env.example .env

# 编辑并填入你的 API Key
vim .env
```

**`.env.example` 内容**:
```bash
# Anthropic API Configuration
# 获取 API Key: https://console.anthropic.com/

# 必需: API Key
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here

# 可选: 自定义 API 端点
# ANTHROPIC_API_URL=https://api.anthropic.com

# 可选: API 版本
# ANTHROPIC_API_VERSION=2023-06-01
```

### ⚠️ 安全注意事项

```bash
# 确保 .env 在 .gitignore 中
echo ".env" >> .gitignore

# 检查 .env 不会被提交
git status --ignored
```

---

## 方法 3: Shell 配置文件

### Zsh (.zshrc)

```bash
# 编辑配置文件
vim ~/.zshrc

# 添加以下内容
export ANTHROPIC_API_KEY="sk-ant-api03-your-key-here"
export ANTHROPIC_API_URL="https://api.anthropic.com"  # 可选

# 保存后重新加载
source ~/.zshrc
```

### Bash (.bashrc 或 .bash_profile)

```bash
# macOS 使用 .bash_profile
vim ~/.bash_profile

# Linux 使用 .bashrc
vim ~/.bashrc

# 添加以下内容
export ANTHROPIC_API_KEY="sk-ant-api03-your-key-here"
export ANTHROPIC_API_URL="https://api.anthropic.com"  # 可选

# 重新加载
source ~/.bash_profile  # 或 source ~/.bashrc
```

### Fish Shell

```bash
# 编辑配置
vim ~/.config/fish/config.fish

# 添加以下内容
set -gx ANTHROPIC_API_KEY "sk-ant-api03-your-key-here"
set -gx ANTHROPIC_API_URL "https://api.anthropic.com"  # 可选

# 重新加载
source ~/.config/fish/config.fish
```

---

## 自定义 API URL

### 为什么需要自定义 URL？

1. **使用代理服务**: 通过代理访问 Anthropic API
2. **使用中转服务**: 使用第三方 API 中转
3. **本地开发**: 使用本地模拟 API
4. **企业内网**: 通过企业代理访问

### 配置自定义 URL

**方法 1: 环境变量**
```bash
export ANTHROPIC_API_URL="https://your-proxy.com"
```

**方法 2: .env 文件**
```bash
# .env
ANTHROPIC_API_KEY=sk-ant-api03-...
ANTHROPIC_API_URL=https://your-proxy.com
```

**方法 3: 修改脚本**

编辑 `scripts/generate-tests.js`:

```javascript
const anthropic = new Anthropic({
  apiKey: API_KEY,
  baseURL: process.env.ANTHROPIC_API_URL || 'https://api.anthropic.com',
});
```

### 常用的代理/中转服务

```bash
# 示例配置（请使用你自己的服务）
ANTHROPIC_API_URL=https://api.anthropic-proxy.com
ANTHROPIC_API_URL=https://your-company-proxy.com/anthropic
```

---

## 验证配置

### 检查环境变量

```bash
# 检查 API Key 是否设置
echo $ANTHROPIC_API_KEY

# 应该显示: sk-ant-api03-...
# 如果为空，说明未设置

# 检查 API URL
echo $ANTHROPIC_API_URL

# 如果未设置，将使用默认值
```

### 测试 API 连接

**方法 1: 使用测试脚本**
```bash
# 运行测试脚本
node scripts/generate-tests.js

# 如果配置正确，会提示: "用法: node generate-tests.js <source-file>"
# 如果配置错误，会提示: "❌ 错误: 未找到 ANTHROPIC_API_KEY"
```

**方法 2: 创建测试文件**
```bash
# 创建测试组件
cat > /tmp/test-component.tsx << 'EOF'
export default function Test() {
  return <div>Test</div>;
}
EOF

# 尝试生成测试
node scripts/generate-tests.js /tmp/test-component.tsx

# 如果成功，会看到 Claude 开始生成测试
# 如果失败，检查错误信息
```

**方法 3: 通过 Git Hook 验证**
```bash
# 创建测试组件
echo 'export default function Hi() { return <h1>Hi</h1>; }' > components/TestHook.tsx

# 添加到 git
git add components/TestHook.tsx

# 尝试提交（会触发 hook）
git commit -m "test: verify API configuration"

# Hook 会检测配置并提示
```

---

## 完整配置示例

### 示例 1: 基础配置（仅 API Key）

```bash
# ~/.zshrc 或 ~/.bashrc
export ANTHROPIC_API_KEY="sk-ant-api03-xxxxxxxxxxxxx"
```

### 示例 2: 完整配置（API Key + URL）

```bash
# ~/.zshrc
export ANTHROPIC_API_KEY="sk-ant-api03-xxxxxxxxxxxxx"
export ANTHROPIC_API_URL="https://api.anthropic.com"
```

### 示例 3: 项目级配置（.env）

```bash
# /Users/gaodong/Desktop/claude-prompt/.env
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx
ANTHROPIC_API_URL=https://api.anthropic.com

# 可选: 其他配置
NODE_ENV=development
```

### 示例 4: 企业代理配置

```bash
# .env
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx
ANTHROPIC_API_URL=https://proxy.company.com/anthropic

# 可能需要的代理设置
HTTP_PROXY=http://proxy.company.com:8080
HTTPS_PROXY=http://proxy.company.com:8080
```

---

## 获取 API Key

### 步骤 1: 访问 Anthropic Console

打开浏览器访问: https://console.anthropic.com/

### 步骤 2: 注册或登录

- 如果没有账号，点击 "Sign Up" 注册
- 如果有账号，点击 "Log In" 登录

### 步骤 3: 创建 API Key

1. 登录后，进入 "API Keys" 页面
2. 点击 "Create Key" 按钮
3. 给 Key 起一个名字（如 "claude-prompt-dev"）
4. 复制生成的 API Key（格式: `sk-ant-api03-...`）
5. ⚠️ **重要**: 立即保存 API Key，关闭页面后无法再次查看

### 步骤 4: 配置 API Key

使用上面介绍的任一方法配置 API Key。

---

## 常见问题

### Q1: API Key 应该设置在哪里？

**A:** 推荐顺序：
1. **开发环境**: Shell 配置文件 (`.zshrc` / `.bashrc`) ← **推荐**
2. **项目特定**: `.env` 文件
3. **临时测试**: 临时环境变量

### Q2: 为什么建议用环境变量而不是硬编码？

**A:** 安全原因：
- ❌ **不要**: 把 API Key 写在代码里
- ❌ **不要**: 把 API Key 提交到 Git
- ✅ **应该**: 使用环境变量
- ✅ **应该**: 把 `.env` 添加到 `.gitignore`

### Q3: 如何在团队中共享配置？

**A:** 
```bash
# 1. 创建 .env.example (不包含真实 Key)
cat > .env.example << 'EOF'
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
ANTHROPIC_API_URL=https://api.anthropic.com
EOF

# 2. 提交 .env.example 到 Git
git add .env.example
git commit -m "docs: add API configuration example"

# 3. 团队成员复制并配置
cp .env.example .env
vim .env  # 填入自己的 API Key
```

### Q4: 如何检查当前使用的配置？

**A:**
```bash
# 检查环境变量
env | grep ANTHROPIC

# 或
echo "API Key: $ANTHROPIC_API_KEY"
echo "API URL: $ANTHROPIC_API_URL"

# 检查 .env 文件
cat .env 2>/dev/null || echo ".env file not found"
```

### Q5: .env 文件优先级如何？

**A:** 优先级（从高到低）：
1. 已设置的环境变量
2. `.env` 文件
3. 脚本中的默认值

```javascript
// 脚本中的逻辑
const API_KEY = process.env.ANTHROPIC_API_KEY;  // 优先使用环境变量

// Hook 中的逻辑
if [ -z "$ANTHROPIC_API_KEY" ]; then
    # 如果环境变量未设置，尝试从 .env 加载
    if [ -f .env ]; then
        export $(cat .env | grep -v '^#' | xargs)
    fi
fi
```

### Q6: 如何在 CI/CD 中配置？

**A:** 

**GitHub Actions**:
```yaml
# .github/workflows/test.yml
jobs:
  test:
    steps:
      - name: Run tests with Claude
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: npm test
```

**GitLab CI**:
```yaml
# .gitlab-ci.yml
test:
  variables:
    ANTHROPIC_API_KEY: $CI_ANTHROPIC_API_KEY
  script:
    - npm test
```

### Q7: API Key 安全吗？

**A:** 安全措施：
- ✅ 使用环境变量，不硬编码
- ✅ `.env` 添加到 `.gitignore`
- ✅ 定期轮换 API Key
- ✅ 限制 API Key 权限
- ✅ 监控 API 使用情况
- ❌ 不要在公共仓库中暴露
- ❌ 不要截图时包含 API Key

### Q8: 忘记了 API Key 怎么办？

**A:** 
1. 登录 https://console.anthropic.com/
2. 删除旧的 API Key
3. 创建新的 API Key
4. 更新本地配置

### Q9: 可以使用多个 API Key 吗？

**A:** 可以，但需要手动切换：
```bash
# 开发环境
export ANTHROPIC_API_KEY="sk-ant-api03-dev-key"

# 生产环境
export ANTHROPIC_API_KEY="sk-ant-api03-prod-key"

# 或使用不同的环境文件
cp .env.development .env  # 开发时
cp .env.production .env   # 生产时
```

---

## 快速配置命令

### 一键配置（macOS/Linux）

```bash
# 交互式配置
read -p "请输入你的 Anthropic API Key: " api_key
echo "export ANTHROPIC_API_KEY='$api_key'" >> ~/.zshrc
source ~/.zshrc
echo "✅ API Key 已配置！"
```

### 验证配置

```bash
# 完整验证脚本
if [ -n "$ANTHROPIC_API_KEY" ]; then
    echo "✅ API Key 已设置"
    echo "   Key: ${ANTHROPIC_API_KEY:0:20}..."
else
    echo "❌ API Key 未设置"
    echo "请运行: export ANTHROPIC_API_KEY='your-key'"
fi

if [ -n "$ANTHROPIC_API_URL" ]; then
    echo "✅ API URL: $ANTHROPIC_API_URL"
else
    echo "ℹ️  使用默认 API URL: https://api.anthropic.com"
fi
```

---

## 总结

### 推荐配置方法

**个人开发**:
```bash
# ~/.zshrc
export ANTHROPIC_API_KEY="sk-ant-api03-..."
```

**团队项目**:
```bash
# .env (本地)
ANTHROPIC_API_KEY=sk-ant-api03-...

# .env.example (提交到 Git)
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
```

**CI/CD**:
```yaml
# 使用 secrets 管理
secrets.ANTHROPIC_API_KEY
```

### 下一步

1. ✅ 按上述方法配置 API Key
2. ✅ 运行验证命令确认配置成功
3. ✅ 阅读 [快速开始指南](./QUICK_START_CLAUDE_HOOKS.md)
4. ✅ 开始使用自动测试生成功能！

---

**需要帮助？** 查看 [故障排除](#常见问题) 或查看其他文档。
