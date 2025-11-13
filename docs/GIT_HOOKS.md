# Git Hooks 使用指南

本项目使用 Git hooks 来强制执行代码质量标准，确保所有代码变更都有相应的测试覆盖。

## 📋 目录

- [安装](#安装)
- [Pre-commit Hook](#pre-commit-hook)
- [工作流程](#工作流程)
- [常见问题](#常见问题)
- [跳过检查](#跳过检查)

## 🔧 安装

### 自动安装（推荐）

运行安装脚本：

```bash
./scripts/install-hooks.sh
```

### 手动安装

如果自动安装失败，可以手动复制：

```bash
cp .git/hooks/pre-commit.sample .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

## 🎯 Pre-commit Hook

### 功能说明

Pre-commit hook 会在每次 `git commit` 之前自动运行，执行以下检查：

1. **测试文件存在性检查**
   - 检测所有被修改的代码文件
   - 验证是否存在对应的测试文件
   - 如果缺少测试文件，提交会被阻止

2. **单元测试执行**
   - 自动运行所有单元测试 (`npm test`)
   - 只有所有测试通过后才允许提交
   - 测试失败会显示详细错误信息

3. **E2E测试提醒**
   - 检测组件/页面变更
   - 提醒开发者手动运行E2E测试
   - （不自动运行E2E测试，因为耗时较长）

### 检查规则

#### 需要测试文件的代码

Hook 会检查以下文件的测试覆盖：

- `components/*.tsx` → `components/__tests__/*.test.tsx`
- `lib/**/*.ts` → `lib/**/__tests__/*.test.ts`
- `app/**/*.tsx` → `app/**/__tests__/*.test.tsx`

#### 排除的文件

以下文件不需要测试：

- 配置文件 (`*.config.js`, `*.config.ts`)
- 测试文件本身 (`*.test.ts`, `*.spec.ts`, `__tests__/*`)
- E2E测试 (`e2e/*`)

## 🔄 工作流程

### 正常提交流程

```bash
# 1. 修改代码
vim components/MyComponent.tsx

# 2. 创建对应的测试文件
vim components/__tests__/MyComponent.test.tsx

# 3. 运行测试确保通过
npm test

# 4. 添加文件到暂存区
git add components/MyComponent.tsx
git add components/__tests__/MyComponent.test.tsx

# 5. 提交（hook会自动运行）
git commit -m "feat: add MyComponent with tests"
```

### Hook 执行示例

```bash
$ git commit -m "feat: add new feature"

🔍 Git Pre-commit Hook: 检查测试覆盖...

📝 检测到以下文件变更:
components/NewFeature.tsx
components/__tests__/NewFeature.test.tsx

🧪 运行单元测试...
✓ components/__tests__/NewFeature.test.tsx (5 tests) 120ms
✓ All tests passed!

✅ 所有单元测试通过!

🎭 检测到组件/页面变更，准备运行E2E测试...
⚠️  注意: E2E测试需要时间较长，正在跳过...

💡 请在提交后手动运行E2E测试:
   npm run test:e2e

✅ Pre-commit检查通过! 正在提交...
```

### 错误示例

#### 缺少测试文件

```bash
$ git commit -m "feat: add new component"

🔍 Git Pre-commit Hook: 检查测试覆盖...

❌ 错误: 发现代码变更但缺少对应的测试文件!

缺少以下测试文件:
  • components/NewComponent.tsx -> components/__tests__/NewComponent.test.tsx

请为以下文件添加测试:
  1. 创建对应的单元测试文件 (*.test.ts 或 *.test.tsx)
  2. 如果是新功能，还需要添加 E2E 测试 (e2e/*.spec.ts)

💡 提示: 使用以下命令跳过此检查 (不推荐):
   git commit --no-verify
```

#### 测试失败

```bash
$ git commit -m "fix: update logic"

🔍 Git Pre-commit Hook: 检查测试覆盖...

🧪 运行单元测试...
✗ components/__tests__/MyComponent.test.tsx > should render correctly
  AssertionError: expected 'Hello' to equal 'Hi'

❌ 单元测试失败! 请修复测试后再提交。

💡 提示: 使用以下命令跳过此检查 (不推荐):
   git commit --no-verify
```

## ❓ 常见问题

### Q: Hook 没有运行？

**A:** 确保 hook 文件有执行权限：

```bash
chmod +x .git/hooks/pre-commit
```

### Q: 如何更新测试文件路径规则？

**A:** 编辑 `.git/hooks/pre-commit` 文件，修改路径匹配规则：

```bash
# 在这个区域修改路径规则
if [[ "$DIR" =~ ^components/ ]]; then
    TEST_FILE="components/__tests__/${FILENAME}.test.${EXT}"
fi
```

### Q: Hook 检查太慢怎么办？

**A:** 可以考虑以下优化：

1. 只运行相关的测试（需要修改 hook）
2. 使用 `git commit --no-verify` 跳过检查（不推荐）
3. 在 CI/CD 中运行完整测试，本地只做基本检查

### Q: 如何临时禁用 hook？

**A:** 重命名 hook 文件：

```bash
mv .git/hooks/pre-commit .git/hooks/pre-commit.disabled
```

恢复：

```bash
mv .git/hooks/pre-commit.disabled .git/hooks/pre-commit
```

## 🚫 跳过检查

### 何时可以跳过？

**只在以下情况下跳过检查：**

- 紧急热修复（hotfix）
- 仅修改文档或配置文件
- WIP 提交（稍后会补充测试）

### 如何跳过？

使用 `--no-verify` 标志：

```bash
git commit --no-verify -m "docs: update README"
```

**⚠️ 警告：** 跳过检查会降低代码质量，请谨慎使用！

## 📊 测试覆盖要求

### 单元测试

- ✅ 所有 `components/*.tsx` 必须有对应的单元测试
- ✅ 所有 `lib/**/*.ts` 必须有对应的单元测试
- ✅ 测试覆盖率应达到 80% 以上

### E2E 测试

- ✅ 新增页面必须有 E2E 测试
- ✅ 关键用户流程必须有 E2E 测试
- ✅ E2E 测试应覆盖主要交互场景

### 测试命令

```bash
# 运行单元测试
npm test

# 运行单元测试（带覆盖率）
npm run test:coverage

# 运行 E2E 测试
npm run test:e2e

# 运行 E2E 测试（UI模式）
npm run test:e2e:ui
```

## 🛠️ 自定义配置

### 修改测试要求

编辑 `.git/hooks/pre-commit`，找到这些配置项：

```bash
# 排除不需要测试的文件
if [[ "$file" =~ (vitest\.config|playwright\.config|next\.config|tailwind\.config) ]]; then
    continue
fi

# 添加其他排除规则
if [[ "$file" =~ ^scripts/ ]]; then
    continue
fi
```

### 启用 E2E 自动测试

如果想在提交时自动运行 E2E 测试，取消注释这段代码：

```bash
# if ! npm run test:e2e; then
#     echo ""
#     echo "❌ E2E测试失败!"
#     exit 1
# fi
```

改为：

```bash
if ! npm run test:e2e; then
    echo ""
    echo "❌ E2E测试失败!"
    exit 1
fi
```

## 📚 相关文档

- [测试指南](./TESTING.md)
- [贡献指南](../CONTRIBUTING.md)
- [代码规范](./CODE_STANDARDS.md)

## 💡 最佳实践

1. **先写测试，再写代码（TDD）**
   - 这样可以避免提交时被 hook 阻止

2. **频繁提交**
   - 小步提交，每个提交都包含完整的代码+测试

3. **本地运行测试**
   - 提交前手动运行 `npm test` 确保测试通过

4. **使用 watch 模式**
   - 开发时使用 `npm test` 保持测试实时运行

5. **维护测试质量**
   - 测试应该简单、清晰、可维护
   - 避免脆弱的测试（flaky tests）

## 🤝 获取帮助

如果遇到问题：

1. 查看本文档的常见问题部分
2. 运行 `./scripts/install-hooks.sh` 重新安装
3. 查看 Git hooks 日志：`cat /tmp/test-output.txt`
4. 联系团队成员获取帮助

---

**记住：测试不是负担，而是保证代码质量的重要工具！** 🎯
