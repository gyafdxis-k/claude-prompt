#!/bin/bash

# Git Hooks 安装脚本
# 用于安装项目的 Git hooks

set -e

echo "🔧 安装 Git Hooks..."

# 检查是否在Git仓库中
if [ ! -d .git ]; then
    echo "❌ 错误: 当前目录不是Git仓库"
    exit 1
fi

# 创建hooks目录（如果不存在）
mkdir -p .git/hooks

# 复制pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

# Git Pre-commit Hook
# 强制要求所有代码更改必须包含相应的测试文件

set -e

echo "🔍 Git Pre-commit Hook: 检查测试覆盖..."

# 获取即将提交的文件
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

if [ -z "$STAGED_FILES" ]; then
    echo "✅ 没有文件被暂存"
    exit 0
fi

echo "📝 检测到以下文件变更:"
echo "$STAGED_FILES"
echo ""

# 检查是否有代码文件变更
HAS_CODE_CHANGES=false
HAS_TEST_CHANGES=false
MISSING_TESTS=()

# 遍历所有暂存的文件
while IFS= read -r file; do
    # 跳过被删除的文件
    if [ ! -f "$file" ]; then
        continue
    fi
    
    # 检查是否是代码文件（排除测试文件）
    if [[ "$file" =~ \.(ts|tsx|js|jsx)$ ]] && [[ ! "$file" =~ __tests__ ]] && [[ ! "$file" =~ \.test\. ]] && [[ ! "$file" =~ \.spec\. ]] && [[ ! "$file" =~ ^e2e/ ]]; then
        HAS_CODE_CHANGES=true
        
        # 跳过配置文件
        if [[ "$file" =~ (vitest\.config|playwright\.config|next\.config|tailwind\.config) ]]; then
            continue
        fi
        
        # 确定测试文件路径
        DIR=$(dirname "$file")
        FILENAME=$(basename "$file" | sed 's/\.[^.]*$//')
        EXT="${file##*.}"
        
        # 检查对应的单元测试文件
        if [[ "$DIR" =~ ^components/ ]]; then
            TEST_FILE="components/__tests__/${FILENAME}.test.${EXT}"
        elif [[ "$DIR" =~ ^lib/ ]]; then
            # 对于lib下的文件，测试文件在同级__tests__目录
            SUBDIR=$(echo "$DIR" | sed 's|^lib/||' | sed 's|/[^/]*$||')
            if [ -n "$SUBDIR" ] && [ "$SUBDIR" != "lib" ]; then
                TEST_FILE="lib/${SUBDIR}/__tests__/${FILENAME}.test.${EXT}"
            else
                TEST_FILE="lib/__tests__/${FILENAME}.test.${EXT}"
            fi
        elif [[ "$DIR" =~ ^app/ ]]; then
            # app目录下的测试文件
            TEST_FILE="${DIR}/__tests__/${FILENAME}.test.${EXT}"
        else
            # 其他目录的测试文件
            TEST_FILE="${DIR}/__tests__/${FILENAME}.test.${EXT}"
        fi
        
        # 检查测试文件是否存在或被添加
        if [ ! -f "$TEST_FILE" ] && ! echo "$STAGED_FILES" | grep -q "$TEST_FILE"; then
            MISSING_TESTS+=("$file -> $TEST_FILE")
        fi
    fi
    
    # 检查是否有测试文件变更
    if [[ "$file" =~ (__tests__|\.test\.|\.spec\.|^e2e/) ]]; then
        HAS_TEST_CHANGES=true
    fi
done <<< "$STAGED_FILES"

# 如果有代码变更但缺少测试
if [ "$HAS_CODE_CHANGES" = true ] && [ ${#MISSING_TESTS[@]} -gt 0 ]; then
    echo "❌ 错误: 发现代码变更但缺少对应的测试文件!"
    echo ""
    echo "缺少以下测试文件:"
    for test in "${MISSING_TESTS[@]}"; do
        echo "  • $test"
    done
    echo ""
    echo "请为以下文件添加测试:"
    echo "  1. 创建对应的单元测试文件 (*.test.ts 或 *.test.tsx)"
    echo "  2. 如果是新功能，还需要添加 E2E 测试 (e2e/*.spec.ts)"
    echo ""
    echo "💡 提示: 使用以下命令跳过此检查 (不推荐):"
    echo "   git commit --no-verify"
    echo ""
    exit 1
fi

# 运行所有测试
echo ""
echo "🧪 运行单元测试..."
if ! npm test -- --run --reporter=basic 2>&1 | tee /tmp/test-output.txt; then
    echo ""
    echo "❌ 单元测试失败! 请修复测试后再提交。"
    echo ""
    echo "💡 查看详细错误信息:"
    cat /tmp/test-output.txt | tail -50
    echo ""
    echo "💡 提示: 使用以下命令跳过此检查 (不推荐):"
    echo "   git commit --no-verify"
    echo ""
    exit 1
fi

echo ""
echo "✅ 所有单元测试通过!"

# 检查是否需要运行E2E测试
SHOULD_RUN_E2E=false

# 如果有组件或页面变更，运行E2E测试
if echo "$STAGED_FILES" | grep -qE "(components/|app/|pages/)"; then
    SHOULD_RUN_E2E=true
fi

# 如果有E2E测试文件变更，运行E2E测试
if echo "$STAGED_FILES" | grep -q "^e2e/"; then
    SHOULD_RUN_E2E=true
fi

if [ "$SHOULD_RUN_E2E" = true ]; then
    echo ""
    echo "🎭 检测到组件/页面变更，准备运行E2E测试..."
    echo "⚠️  注意: E2E测试需要时间较长，正在跳过..."
    echo ""
    echo "💡 请在提交后手动运行E2E测试:"
    echo "   npm run test:e2e"
    echo ""
    # 注释掉E2E测试，因为它们需要启动开发服务器且耗时较长
    # 但会提醒用户手动运行
    # if ! npm run test:e2e; then
    #     echo ""
    #     echo "❌ E2E测试失败!"
    #     exit 1
    # fi
fi

echo ""
echo "✅ Pre-commit检查通过! 正在提交..."
echo ""

exit 0
EOF

# 设置执行权限
chmod +x .git/hooks/pre-commit

echo "✅ Git Hooks 安装成功!"
echo ""
echo "已安装的 hooks:"
echo "  • pre-commit - 提交前检查测试覆盖并运行所有测试"
echo ""
echo "📝 使用说明:"
echo "  1. 正常提交代码时，hook会自动运行"
echo "  2. 如果代码变更没有对应的测试文件，提交会被阻止"
echo "  3. 所有单元测试必须通过才能提交"
echo "  4. 如需跳过检查 (不推荐): git commit --no-verify"
echo ""
