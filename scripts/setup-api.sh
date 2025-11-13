#!/bin/bash

# API 配置助手脚本
# 帮助用户快速配置 Anthropic API Key

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔑 Anthropic API 配置助手"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 检查当前配置状态
echo "📊 当前配置状态:"
echo ""

if [ -n "$ANTHROPIC_API_KEY" ]; then
    echo "  ✅ 环境变量 ANTHROPIC_API_KEY: 已设置"
    echo "     ${ANTHROPIC_API_KEY:0:20}..."
else
    echo "  ❌ 环境变量 ANTHROPIC_API_KEY: 未设置"
fi

if [ -f .env ]; then
    if grep -q "ANTHROPIC_API_KEY=" .env; then
        echo "  ✅ .env 文件: 存在且包含配置"
    else
        echo "  ⚠️  .env 文件: 存在但未配置"
    fi
else
    echo "  ❌ .env 文件: 不存在"
fi

if [ -n "$ANTHROPIC_API_URL" ]; then
    echo "  ℹ️  自定义 API URL: $ANTHROPIC_API_URL"
else
    echo "  ℹ️  API URL: https://api.anthropic.com (默认)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 如果已经配置，询问是否重新配置
if [ -n "$ANTHROPIC_API_KEY" ] || [ -f .env ]; then
    read -p "配置已存在，是否重新配置? [y/N] " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "✅ 保持现有配置"
        exit 0
    fi
    echo ""
fi

# 配置方式选择
echo "请选择配置方式:"
echo ""
echo "  1. .env 文件 (推荐 - 仅本项目)"
echo "  2. Shell 配置文件 (全局 - 所有项目)"
echo "  3. 临时环境变量 (当前会话)"
echo "  4. 查看配置说明并退出"
echo ""

read -p "请选择 [1-4]: " choice
echo ""

case $choice in
    1)
        # .env 文件配置
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "📝 配置 .env 文件"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        
        read -p "请输入 Anthropic API Key: " api_key
        
        if [ -z "$api_key" ]; then
            echo "❌ API Key 不能为空"
            exit 1
        fi
        
        # 创建 .env 文件
        cat > .env << EOF
# Anthropic API Configuration
# 生成时间: $(date)

# API Key
ANTHROPIC_API_KEY=${api_key}

# 自定义 API URL (可选)
# ANTHROPIC_API_URL=https://api.anthropic.com
EOF
        
        echo "✅ .env 文件已创建！"
        echo ""
        echo "配置内容:"
        echo "  ANTHROPIC_API_KEY: ${api_key:0:20}..."
        echo ""
        echo "💡 提示:"
        echo "  • .env 文件已添加到 .gitignore，不会被提交"
        echo "  • 如需修改，编辑 .env 文件"
        echo "  • 删除配置: rm .env"
        ;;
        
    2)
        # Shell 配置文件
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "📝 配置 Shell 配置文件"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        
        # 检测 Shell 类型
        if [ -n "$ZSH_VERSION" ]; then
            SHELL_CONFIG="$HOME/.zshrc"
            SHELL_NAME="Zsh"
        elif [ -n "$BASH_VERSION" ]; then
            if [ "$(uname)" = "Darwin" ]; then
                SHELL_CONFIG="$HOME/.bash_profile"
            else
                SHELL_CONFIG="$HOME/.bashrc"
            fi
            SHELL_NAME="Bash"
        else
            echo "⚠️  未能检测到 Shell 类型"
            read -p "请输入配置文件路径 (如 ~/.zshrc): " SHELL_CONFIG
            SHELL_NAME="Custom"
        fi
        
        echo "检测到: $SHELL_NAME"
        echo "配置文件: $SHELL_CONFIG"
        echo ""
        
        read -p "请输入 Anthropic API Key: " api_key
        
        if [ -z "$api_key" ]; then
            echo "❌ API Key 不能为空"
            exit 1
        fi
        
        # 添加到配置文件
        echo "" >> "$SHELL_CONFIG"
        echo "# Anthropic API Configuration (added $(date))" >> "$SHELL_CONFIG"
        echo "export ANTHROPIC_API_KEY=\"${api_key}\"" >> "$SHELL_CONFIG"
        
        echo "✅ 已添加到 $SHELL_CONFIG"
        echo ""
        echo "💡 使配置生效:"
        echo "  source $SHELL_CONFIG"
        echo ""
        
        read -p "是否立即重新加载配置? [Y/n] " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
            source "$SHELL_CONFIG"
            echo "✅ 配置已重新加载"
        fi
        ;;
        
    3)
        # 临时环境变量
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "📝 设置临时环境变量"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        
        read -p "请输入 Anthropic API Key: " api_key
        
        if [ -z "$api_key" ]; then
            echo "❌ API Key 不能为空"
            exit 1
        fi
        
        export ANTHROPIC_API_KEY="$api_key"
        
        echo "✅ 环境变量已设置（当前会话）"
        echo ""
        echo "⚠️  注意: 关闭终端后配置将失效"
        echo ""
        echo "💡 永久配置请选择方式 1 或 2"
        ;;
        
    4)
        # 显示文档
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "📚 API 配置说明"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "详细配置文档:"
        echo "  docs/API_CONFIGURATION.md"
        echo ""
        echo "快速开始:"
        echo "  docs/QUICK_START_CLAUDE_HOOKS.md"
        echo ""
        echo "在线查看:"
        echo "  cat docs/API_CONFIGURATION.md"
        echo ""
        exit 0
        ;;
        
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 配置完成！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 验证配置
echo "🧪 验证配置..."
echo ""

if [ -n "$ANTHROPIC_API_KEY" ]; then
    echo "✅ API Key: ${ANTHROPIC_API_KEY:0:20}..."
    
    # 测试脚本
    echo ""
    read -p "是否测试 API 连接? [Y/n] " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
        echo ""
        echo "测试命令: node scripts/generate-tests.js"
        echo ""
        node scripts/generate-tests.js 2>&1 | head -10
        echo ""
        echo "💡 如果看到 '用法:' 提示，说明配置成功"
        echo "💡 如果看到错误，请检查 API Key 是否正确"
    fi
else
    echo "⚠️  环境变量未设置，可能需要重新加载终端"
    echo ""
    echo "尝试:"
    if [ -f .env ]; then
        echo "  source .env"
    else
        echo "  重新打开终端"
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 下一步"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. 查看快速开始指南:"
echo "   cat docs/QUICK_START_CLAUDE_HOOKS.md"
echo ""
echo "2. 测试自动生成功能:"
echo "   echo 'export default function Test() { return <div>Test</div>; }' > /tmp/test.tsx"
echo "   node scripts/generate-tests.js /tmp/test.tsx"
echo ""
echo "3. 正常使用 Git commit，体验自动生成测试！"
echo ""
