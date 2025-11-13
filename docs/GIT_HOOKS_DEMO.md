# Git Hooks 演示

本文档展示Git pre-commit hook的实际工作效果。

## 🎬 演示场景

### 场景1: ✅ 正常提交（有测试）

```bash
$ # 创建组件
$ cat > components/Demo.tsx << 'EOF'
export default function Demo() {
  return <div>Demo Component</div>;
}
EOF

$ # 创建测试
$ cat > components/__tests__/Demo.test.tsx << 'EOF'
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Demo from '../Demo';

describe('Demo', () => {
  it('should render', () => {
    render(<Demo />);
    expect(screen.getByText('Demo Component')).toBeInTheDocument();
  });
});
EOF

$ # 添加到暂存区
$ git add components/Demo.tsx components/__tests__/Demo.test.tsx

$ # 提交
$ git commit -m "feat: add Demo component"

🔍 Git Pre-commit Hook: 检查测试覆盖...

📝 检测到以下文件变更:
components/Demo.tsx
components/__tests__/Demo.test.tsx

🧪 运行单元测试...
 ✓ components/__tests__/Demo.test.tsx (1 test) 50ms

✅ 所有单元测试通过!

🎭 检测到组件/页面变更，准备运行E2E测试...
⚠️  注意: E2E测试需要时间较长，正在跳过...

💡 请在提交后手动运行E2E测试:
   npm run test:e2e

✅ Pre-commit检查通过! 正在提交...

[main 1a2b3c4] feat: add Demo component
 2 files changed, 15 insertions(+)
 create mode 100644 components/Demo.tsx
 create mode 100644 components/__tests__/Demo.test.tsx
```

### 场景2: ❌ 提交失败（缺少测试）

```bash
$ # 只创建组件，不创建测试
$ cat > components/NoTest.tsx << 'EOF'
export default function NoTest() {
  return <div>No Test</div>;
}
EOF

$ # 尝试提交
$ git add components/NoTest.tsx
$ git commit -m "feat: add NoTest component"

🔍 Git Pre-commit Hook: 检查测试覆盖...

📝 检测到以下文件变更:
components/NoTest.tsx

❌ 错误: 发现代码变更但缺少对应的测试文件!

缺少以下测试文件:
  • components/NoTest.tsx -> components/__tests__/NoTest.test.tsx

请为以下文件添加测试:
  1. 创建对应的单元测试文件 (*.test.ts 或 *.test.tsx)
  2. 如果是新功能，还需要添加 E2E 测试 (e2e/*.spec.ts)

💡 提示: 使用以下命令跳过此检查 (不推荐):
   git commit --no-verify

$ # 提交被阻止!
```

**修复方法**:
```bash
$ # 创建测试文件
$ cat > components/__tests__/NoTest.test.tsx << 'EOF'
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import NoTest from '../NoTest';

describe('NoTest', () => {
  it('should render', () => {
    render(<NoTest />);
    expect(screen.getByText('No Test')).toBeInTheDocument();
  });
});
EOF

$ # 再次提交
$ git add components/__tests__/NoTest.test.tsx
$ git commit -m "feat: add NoTest component with tests"

✅ Pre-commit检查通过! 正在提交...
```

### 场景3: ❌ 测试失败

```bash
$ # 创建有bug的组件
$ cat > components/Buggy.tsx << 'EOF'
export default function Buggy() {
  return <div>Hello World</div>;  // 实际显示 "Hello World"
}
EOF

$ # 创建期望不同的测试
$ cat > components/__tests__/Buggy.test.tsx << 'EOF'
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Buggy from '../Buggy';

describe('Buggy', () => {
  it('should render Hi', () => {
    render(<Buggy />);
    expect(screen.getByText('Hi')).toBeInTheDocument();  // 期望 "Hi"
  });
});
EOF

$ # 尝试提交
$ git add components/Buggy.tsx components/__tests__/Buggy.test.tsx
$ git commit -m "feat: add Buggy component"

🔍 Git Pre-commit Hook: 检查测试覆盖...

📝 检测到以下文件变更:
components/Buggy.tsx
components/__tests__/Buggy.test.tsx

🧪 运行单元测试...
 ✗ components/__tests__/Buggy.test.tsx > Buggy > should render Hi
   AssertionError: expected 'Hi' to be in the document

   - Expected  "Hi"
   + Received  "Hello World"

❌ 单元测试失败! 请修复测试后再提交。

💡 查看详细错误信息:
[详细的测试输出...]

💡 提示: 使用以下命令跳过此检查 (不推荐):
   git commit --no-verify

$ # 提交被阻止!
```

**修复方法**:
```bash
$ # 修复测试（或修复代码）
$ vim components/__tests__/Buggy.test.tsx
# 改为: expect(screen.getByText('Hello World')).toBeInTheDocument();

$ # 再次提交
$ git add components/__tests__/Buggy.test.tsx
$ git commit -m "feat: add Buggy component"

✅ Pre-commit检查通过! 正在提交...
```

### 场景4: ✅ 跳过检查（紧急情况）

```bash
$ # 紧急修复，暂时跳过测试
$ git commit --no-verify -m "hotfix: critical bug fix"

[main 5e6f7g8] hotfix: critical bug fix
 1 file changed, 5 insertions(+), 2 deletions(-)

⚠️  警告: 已跳过pre-commit检查!
💡 请尽快补充测试!
```

### 场景5: ✅ 只修改测试文件

```bash
$ # 只修改测试文件，不修改源代码
$ vim components/__tests__/Demo.test.tsx

$ git add components/__tests__/Demo.test.tsx
$ git commit -m "test: improve Demo tests"

🔍 Git Pre-commit Hook: 检查测试覆盖...

📝 检测到以下文件变更:
components/__tests__/Demo.test.tsx

🧪 运行单元测试...
 ✓ components/__tests__/Demo.test.tsx (2 tests) 60ms

✅ 所有单元测试通过!
✅ Pre-commit检查通过! 正在提交...

[main 9h0i1j2] test: improve Demo tests
 1 file changed, 10 insertions(+), 2 deletions(-)
```

### 场景6: ✅ 修改配置文件（不需要测试）

```bash
$ # 修改配置文件
$ vim next.config.js

$ git add next.config.js
$ git commit -m "chore: update next config"

🔍 Git Pre-commit Hook: 检查测试覆盖...

📝 检测到以下文件变更:
next.config.js

🧪 运行单元测试...
 ✓ 106 tests passed

✅ 所有单元测试通过!
✅ Pre-commit检查通过! 正在提交...

[main 3k4l5m6] chore: update next config
 1 file changed, 3 insertions(+), 1 deletion(-)
```

## 📊 统计数据

hook运行后的典型输出统计：

```
📈 测试执行统计:
  • 检查时间: ~2-5秒
  • 测试运行时间: ~1-3秒（取决于测试数量）
  • 总耗时: ~3-8秒

📁 文件检查统计:
  • 检查规则: *.ts, *.tsx, *.js, *.jsx
  • 排除: __tests__, *.test.*, *.spec.*, e2e/, *.config.*
  • 测试文件路径规则: 根据源文件目录自动推断

🎯 拦截统计（示例项目）:
  • 成功提交: 95%
  • 被拦截（缺少测试）: 3%
  • 被拦截（测试失败）: 2%
```

## 🔧 Hook配置说明

### 检查的文件类型

```bash
# ✅ 会被检查
components/Button.tsx
lib/utils.ts
app/page.tsx

# ❌ 不会被检查
vitest.config.ts          # 配置文件
next.config.js            # 配置文件
components/Button.test.tsx # 测试文件本身
e2e/test.spec.ts          # E2E测试
```

### 测试文件路径映射

| 源文件 | 测试文件 |
|--------|---------|
| `components/Foo.tsx` | `components/__tests__/Foo.test.tsx` |
| `lib/bar.ts` | `lib/__tests__/bar.test.ts` |
| `lib/utils/baz.ts` | `lib/utils/__tests__/baz.test.ts` |
| `app/page.tsx` | `app/__tests__/page.test.tsx` |

### Hook行为

```bash
# 1. 检查测试文件存在性
✅ 有测试文件 → 继续
❌ 缺少测试文件 → 阻止提交

# 2. 运行单元测试
✅ 所有测试通过 → 继续
❌ 有测试失败 → 阻止提交

# 3. E2E测试提醒
✅ 提醒用户手动运行 → 允许提交
```

## 💡 使用技巧

### 1. 开发时保持测试运行

```bash
# 终端1: 运行开发服务器
npm run dev

# 终端2: 保持测试运行（watch模式）
npm test

# 这样可以实时看到测试结果，提交前就知道是否会通过
```

### 2. 提交前预检查

```bash
# 手动运行测试（模拟hook）
npm test -- --run

# 如果通过，提交就不会有问题
git commit -m "your message"
```

### 3. 批量提交技巧

```bash
# 一次性添加所有代码和测试
git add components/Foo.tsx components/__tests__/Foo.test.tsx
git add lib/bar.ts lib/__tests__/bar.test.ts

# 一次提交
git commit -m "feat: add multiple features"
```

### 4. 紧急情况处理

```bash
# 线上紧急bug修复
git commit --no-verify -m "hotfix: fix critical bug"

# 立即推送
git push origin main

# 事后补充测试
git commit -m "test: add tests for hotfix"
git push origin main
```

## 🎓 学习资源

- [Vitest文档](https://vitest.dev/)
- [Playwright文档](https://playwright.dev/)
- [Testing Library文档](https://testing-library.com/)
- [Git Hooks文档](https://git-scm.com/docs/githooks)

## 📞 支持

遇到问题？

1. 查看 [Git Hooks详细文档](./GIT_HOOKS.md)
2. 查看 [测试工作流程](./TESTING_WORKFLOW.md)
3. 运行 `npm run hooks:install` 重新安装
4. 联系团队成员

---

**Happy Testing! 🎉**
