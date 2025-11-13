#!/usr/bin/env node

/**
 * Claude Test Generator
 * 使用 Claude API 自动生成单元测试和 E2E 测试
 */

const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

// 从环境变量读取配置
const API_KEY = process.env.ANTHROPIC_API_KEY;
const API_URL = process.env.ANTHROPIC_API_URL;

if (!API_KEY) {
  console.error('❌ 错误: 未找到 ANTHROPIC_API_KEY 环境变量');
  console.error('');
  console.error('请设置环境变量:');
  console.error('  export ANTHROPIC_API_KEY="your-api-key"');
  console.error('');
  console.error('或创建 .env 文件:');
  console.error('  echo "ANTHROPIC_API_KEY=your-api-key" > .env');
  console.error('');
  console.error('💡 详细配置说明: docs/API_CONFIGURATION.md');
  console.error('');
  process.exit(1);
}

// 配置 Anthropic 客户端
const anthropicConfig = {
  apiKey: API_KEY,
};

// 如果设置了自定义 API URL，使用它
if (API_URL) {
  anthropicConfig.baseURL = API_URL;
  console.log(`🔗 使用自定义 API URL: ${API_URL}`);
}

const anthropic = new Anthropic(anthropicConfig);

/**
 * 生成单元测试
 */
async function generateUnitTest(sourceFile, targetTestFile) {
  console.log(`\n🤖 Claude 正在为 ${sourceFile} 生成单元测试...`);
  
  // 读取源代码
  const sourceCode = fs.readFileSync(sourceFile, 'utf-8');
  
  // 检查是否是组件文件
  const isComponent = sourceFile.endsWith('.tsx') || sourceFile.endsWith('.jsx');
  
  // 构建提示词
  const prompt = `请为以下${isComponent ? 'React组件' : '代码'}生成完整的单元测试。

源文件路径: ${sourceFile}
测试文件路径: ${targetTestFile}

源代码:
\`\`\`${sourceFile.endsWith('.tsx') || sourceFile.endsWith('.jsx') ? 'typescript' : 'javascript'}
${sourceCode}
\`\`\`

要求:
1. 使用 Vitest 作为测试框架
2. ${isComponent ? '使用 @testing-library/react 进行组件测试' : '测试所有导出的函数和类'}
3. 测试覆盖率至少 80%
4. 包含以下测试场景:
   ${isComponent ? `- 渲染测试
   - Props 测试
   - 用户交互测试
   - 状态变化测试
   - 边界情况测试` : `- 正常情况测试
   - 边界情况测试
   - 错误处理测试
   - 参数验证测试`}
5. 使用清晰的测试描述
6. 每个测试应该独立且可重复运行
7. 不要添加任何注释或解释，只输出测试代码

请直接输出完整的测试文件代码，不要包含任何其他文字。`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // 提取生成的测试代码
    let testCode = message.content[0].text;
    
    // 移除可能的 markdown 代码块标记
    testCode = testCode.replace(/^```(?:typescript|javascript|tsx|jsx)?\n/gm, '');
    testCode = testCode.replace(/\n```$/gm, '');
    
    // 确保目录存在
    const testDir = path.dirname(targetTestFile);
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    // 写入测试文件
    fs.writeFileSync(targetTestFile, testCode, 'utf-8');
    
    console.log(`✅ 单元测试已生成: ${targetTestFile}`);
    return true;
  } catch (error) {
    console.error(`❌ 生成单元测试失败: ${error.message}`);
    return false;
  }
}

/**
 * 生成 E2E 测试
 */
async function generateE2ETest(sourceFiles) {
  console.log(`\n🤖 Claude 正在生成 E2E 测试...`);
  
  // 读取所有源文件
  const sourceContents = sourceFiles.map(file => ({
    path: file,
    code: fs.readFileSync(file, 'utf-8')
  }));
  
  // 构建提示词
  const filesInfo = sourceContents.map(({ path, code }) => 
    `文件: ${path}\n\`\`\`typescript\n${code}\n\`\`\``
  ).join('\n\n');
  
  const prompt = `请为以下React组件生成完整的端到端(E2E)测试。

源文件:
${filesInfo}

要求:
1. 使用 Playwright 作为测试框架
2. 测试完整的用户工作流程
3. 包含以下测试场景:
   - 页面加载和初始状态
   - 用户交互流程
   - 表单提交和验证
   - 错误处理
   - 成功状态验证
4. 使用清晰的测试描述
5. 使用 async/await 处理异步操作
6. 添加适当的等待和断言
7. 不要添加任何注释或解释，只输出测试代码

请直接输出完整的 E2E 测试文件代码，文件名应该放在第一行的注释中。`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    // 提取生成的测试代码
    let testCode = message.content[0].text;
    
    // 移除可能的 markdown 代码块标记
    testCode = testCode.replace(/^```(?:typescript|javascript)?\n/gm, '');
    testCode = testCode.replace(/\n```$/gm, '');
    
    // 从代码中提取建议的文件名，如果没有则使用默认名称
    let fileName = 'generated-workflow.spec.ts';
    const fileNameMatch = testCode.match(/^\/\/\s*(.+\.spec\.ts)/m);
    if (fileNameMatch) {
      fileName = fileNameMatch[1];
    }
    
    // 生成测试文件路径
    const e2eDir = path.join(process.cwd(), 'e2e');
    if (!fs.existsSync(e2eDir)) {
      fs.mkdirSync(e2eDir, { recursive: true });
    }
    
    const testFile = path.join(e2eDir, fileName);
    
    // 写入测试文件
    fs.writeFileSync(testFile, testCode, 'utf-8');
    
    console.log(`✅ E2E 测试已生成: ${testFile}`);
    return testFile;
  } catch (error) {
    console.error(`❌ 生成 E2E 测试失败: ${error.message}`);
    return null;
  }
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('用法: node generate-tests.js <source-file> [test-file]');
    console.error('');
    console.error('示例:');
    console.error('  node generate-tests.js components/Button.tsx');
    console.error('  node generate-tests.js components/Button.tsx components/__tests__/Button.test.tsx');
    console.error('');
    console.error('或生成 E2E 测试:');
    console.error('  node generate-tests.js --e2e components/Button.tsx components/Form.tsx');
    process.exit(1);
  }
  
  // E2E 测试生成
  if (args[0] === '--e2e') {
    const sourceFiles = args.slice(1);
    const testFile = await generateE2ETest(sourceFiles);
    if (testFile) {
      console.log(`\n✅ 测试生成完成!`);
      console.log(`\n请检查生成的测试并添加到 git:`);
      console.log(`  git add ${testFile}`);
      process.exit(0);
    } else {
      process.exit(1);
    }
  }
  
  // 单元测试生成
  const sourceFile = args[0];
  let targetTestFile = args[1];
  
  // 如果没有指定测试文件路径，自动推断
  if (!targetTestFile) {
    const dir = path.dirname(sourceFile);
    const filename = path.basename(sourceFile);
    const nameWithoutExt = filename.replace(/\.(tsx?|jsx?)$/, '');
    const ext = filename.match(/\.(tsx?|jsx?)$/)?.[1] || 'ts';
    
    if (dir.startsWith('components')) {
      targetTestFile = `components/__tests__/${nameWithoutExt}.test.${ext}`;
    } else if (dir.startsWith('lib')) {
      const subdir = dir.replace(/^lib\/?/, '');
      if (subdir) {
        targetTestFile = `lib/${subdir}/__tests__/${nameWithoutExt}.test.${ext}`;
      } else {
        targetTestFile = `lib/__tests__/${nameWithoutExt}.test.${ext}`;
      }
    } else if (dir.startsWith('app')) {
      targetTestFile = `${dir}/__tests__/${nameWithoutExt}.test.${ext}`;
    } else {
      targetTestFile = `${dir}/__tests__/${nameWithoutExt}.test.${ext}`;
    }
  }
  
  // 检查源文件是否存在
  if (!fs.existsSync(sourceFile)) {
    console.error(`❌ 错误: 源文件不存在: ${sourceFile}`);
    process.exit(1);
  }
  
  // 生成测试
  const success = await generateUnitTest(sourceFile, targetTestFile);
  
  if (success) {
    console.log(`\n✅ 测试生成完成!`);
    console.log(`\n请检查生成的测试并添加到 git:`);
    console.log(`  git add ${targetTestFile}`);
    console.log(`  npm test -- --run`);
    process.exit(0);
  } else {
    process.exit(1);
  }
}

// 运行主函数
main().catch(error => {
  console.error('❌ 发生错误:', error);
  process.exit(1);
});
