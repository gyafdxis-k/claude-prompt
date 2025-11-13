# 测试工作流程

本文档介绍项目的完整测试工作流程，包括Git hooks、单元测试和E2E测试。

## 🚀 快速开始

### 1. 安装依赖和Hooks

```bash
# 安装项目依赖
npm install

# Hooks会自动安装（通过prepare脚本）
# 或手动安装
npm run hooks:install
```

### 2. 开发流程

```bash
# 1. 创建新功能文件
vim components/NewFeature.tsx

# 2. 同时创建测试文件
vim components/__tests__/NewFeature.test.tsx

# 3. 开发时保持测试运行
npm test  # 在另一个终端保持运行

# 4. 提交代码
git add .
git commit -m "feat: add new feature"
# Git hook会自动运行测试
```

## 📋 测试类型

### 单元测试 (Vitest)

**位置**: `**/__tests__/*.test.{ts,tsx}`

**运行命令**:
```bash
npm test              # watch模式
npm test -- --run     # 单次运行
npm run test:ui       # UI界面
npm run test:coverage # 覆盖率报告
```

**编写规范**:
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### E2E测试 (Playwright)

**位置**: `e2e/*.spec.ts`

**运行命令**:
```bash
npm run test:e2e        # headless模式
npm run test:e2e:ui     # UI界面
npm run test:e2e:debug  # 调试模式
```

**编写规范**:
```typescript
import { test, expect } from '@playwright/test';

test('user can create template', async ({ page }) => {
  await page.goto('/');
  await page.click('text=创建模板');
  await page.fill('[placeholder*="模板名称"]', 'Test Template');
  await page.click('text=保存');
  await expect(page.locator('text=Test Template')).toBeVisible();
});
```

## 🎯 Git Hooks

### Pre-commit Hook

**功能**:
1. ✅ 检查代码文件是否有对应的测试文件
2. ✅ 运行所有单元测试
3. ✅ 提醒开发者运行E2E测试

**自动触发**:
```bash
git commit -m "your message"
```

**手动跳过** (不推荐):
```bash
git commit --no-verify -m "your message"
```

### 测试文件要求

| 代码文件 | 测试文件 |
|---------|---------|
| `components/Foo.tsx` | `components/__tests__/Foo.test.tsx` |
| `lib/bar.ts` | `lib/__tests__/bar.test.ts` |
| `lib/utils/baz.ts` | `lib/utils/__tests__/baz.test.ts` |
| `app/page.tsx` | `app/__tests__/page.test.tsx` |

## 📊 测试覆盖率

### 当前覆盖率

```bash
npm run test:coverage
```

### 覆盖率要求

- ✅ **单元测试**: 80% 以上
- ✅ **组件测试**: 100% (所有组件必须有测试)
- ✅ **关键功能**: 100% (核心业务逻辑)

## 🔄 完整开发流程

### 场景1: 添加新组件

```bash
# 1. 创建组件文件
cat > components/Button.tsx << 'EOF'
export default function Button({ children, onClick }) {
  return <button onClick={onClick}>{children}</button>;
}
EOF

# 2. 创建测试文件
cat > components/__tests__/Button.test.tsx << 'EOF'
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../Button';

describe('Button', () => {
  it('should call onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(onClick).toHaveBeenCalled();
  });
});
EOF

# 3. 运行测试
npm test -- --run

# 4. 提交代码
git add components/Button.tsx components/__tests__/Button.test.tsx
git commit -m "feat: add Button component"
```

### 场景2: 修改现有代码

```bash
# 1. 修改组件
vim components/Button.tsx

# 2. 更新测试
vim components/__tests__/Button.test.tsx

# 3. 确保测试通过
npm test -- --run

# 4. 提交
git add components/Button.tsx components/__tests__/Button.test.tsx
git commit -m "fix: update Button styling"
```

### 场景3: 添加E2E测试

```bash
# 1. 创建E2E测试
cat > e2e/button-interaction.spec.ts << 'EOF'
import { test, expect } from '@playwright/test';

test('button interaction', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Click me');
  await expect(page.locator('text=Clicked!')).toBeVisible();
});
EOF

# 2. 运行E2E测试
npm run test:e2e:ui

# 3. 提交
git add e2e/button-interaction.spec.ts
git commit -m "test: add button interaction E2E test"
```

## ⚠️ 常见错误

### 错误1: 提交时被阻止

```bash
❌ 错误: 发现代码变更但缺少对应的测试文件!

缺少以下测试文件:
  • components/NewComponent.tsx -> components/__tests__/NewComponent.test.tsx
```

**解决方案**:
```bash
# 创建缺失的测试文件
touch components/__tests__/NewComponent.test.tsx
# 编写测试...
git add components/__tests__/NewComponent.test.tsx
git commit -m "feat: add NewComponent with tests"
```

### 错误2: 测试失败

```bash
❌ 单元测试失败! 请修复测试后再提交。
```

**解决方案**:
```bash
# 查看失败的测试
npm test -- --run

# 修复测试
vim components/__tests__/MyComponent.test.tsx

# 重新提交
git commit -m "fix: update component logic"
```

### 错误3: Hook未运行

**解决方案**:
```bash
# 重新安装hooks
npm run hooks:install

# 检查权限
ls -la .git/hooks/pre-commit
# 应该显示 -rwxr-xr-x (有执行权限)

# 如果没有权限
chmod +x .git/hooks/pre-commit
```

## 💡 最佳实践

### 1. TDD (测试驱动开发)

```bash
# ✅ 推荐: 先写测试
1. 写测试 (失败)
2. 写代码 (通过)
3. 重构
4. 提交

# ❌ 不推荐: 后补测试
1. 写代码
2. 提交被阻止
3. 匆忙补测试
```

### 2. 小步提交

```bash
# ✅ 好的提交
git commit -m "feat: add Button component"        # +Button.tsx +Button.test.tsx
git commit -m "feat: add Button disabled state"   # 修改Button +新测试
git commit -m "style: improve Button appearance"  # 样式改进

# ❌ 不好的提交
git commit -m "add many features"  # 修改10个文件，测试不完整
```

### 3. 保持测试更新

```bash
# ✅ 每次修改代码都更新测试
修改代码 → 更新测试 → 运行测试 → 提交

# ❌ 不更新测试
修改代码 → 不更新测试 → 测试失败 → 提交被阻止
```

### 4. 使用Watch模式

```bash
# 开发时在另一个终端运行
npm test

# 测试会自动重新运行
# 实时反馈测试结果
```

### 5. 定期运行E2E测试

```bash
# 每天至少运行一次
npm run test:e2e

# 或在CI/CD中自动运行
```

## 🛠️ 工具和配置

### Vitest配置 (`vitest.config.ts`)

```typescript
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    exclude: ['**/node_modules/**', '**/e2e/**'],
  },
});
```

### Playwright配置 (`playwright.config.ts`)

```typescript
export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
  },
});
```

## 📚 相关文档

- [Git Hooks详细说明](./GIT_HOOKS.md)
- [测试编写指南](./TESTING_GUIDE.md)
- [CI/CD配置](./CICD.md)

## 🆘 获取帮助

遇到问题？

1. 查看 [常见错误](#常见错误)
2. 运行 `npm run hooks:install` 重新安装
3. 查看测试日志: `cat /tmp/test-output.txt`
4. 联系团队成员

---

**记住: 测试是保证代码质量的关键！** ✨
