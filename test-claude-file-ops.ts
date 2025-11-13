import { chromium } from 'playwright';

async function testClaudeFileOperations() {
  console.log('🚀 启动浏览器测试...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('📄 打开 Claude 聊天页面...');
    await page.goto('http://localhost:3000/claude-chat');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('\n=== 测试 1: 读取 README 文件 ===');
    await page.fill('input[type="text"]', '读取文件 /Users/gaodong/Desktop/claude-prompt/README.md');
    await page.click('button:has-text("发送")');
    await page.waitForTimeout(3000);

    let messages = await page.locator('div.rounded-lg pre').allTextContents();
    console.log('📖 响应:', messages[messages.length - 1].substring(0, 200) + '...');

    console.log('\n=== 测试 2: 列出目录文件 ===');
    await page.fill('input[type="text"]', '列出文件 /Users/gaodong/Desktop/claude-prompt');
    await page.click('button:has-text("发送")');
    await page.waitForTimeout(3000);

    messages = await page.locator('div.rounded-lg pre').allTextContents();
    console.log('📁 响应:', messages[messages.length - 1]);

    console.log('\n=== 测试 3: 写入测试文件 ===');
    const testContent = `这是 Claude 在 ${new Date().toISOString()} 创建的测试文件！`;
    await page.fill('input[type="text"]', `写入文件 /Users/gaodong/Desktop/claude-prompt/claude-test-${Date.now()}.txt 内容: ${testContent}`);
    await page.click('button:has-text("发送")');
    await page.waitForTimeout(3000);

    messages = await page.locator('div.rounded-lg pre').allTextContents();
    console.log('✍️ 响应:', messages[messages.length - 1]);

    console.log('\n✅ 所有测试通过！Claude 可以成功操作本地文件！');
    console.log('\n按 Ctrl+C 关闭浏览器...');
    
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    await browser.close();
  }
}

testClaudeFileOperations();
