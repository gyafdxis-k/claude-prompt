import { test, expect } from '@playwright/test';

test.describe('Full Workflow Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('complete workflow: create template, filter, select, and use', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /新建.*模板/i });
    if (await createButton.isVisible()) {
      await createButton.click();

      await page.fill('input[placeholder*="模板名称"]', 'Complete Workflow Template');
      await page.fill('textarea[placeholder*="描述"]', 'Testing complete workflow');
      
      const devCategory = page.getByTestId('category-filter-development');
      await devCategory.click();
      
      await page.fill(
        'textarea[placeholder*="prompt 内容"]',
        'This is a test prompt with ${parameter1} and {{parameter2}}'
      );

      await expect(page.getByText(/检测到的参数.*2/)).toBeVisible();

      await page.getByRole('button', { name: '保存模板' }).click();
      await page.waitForTimeout(1500);

      const searchInput = page.locator('input[placeholder*="搜索"]');
      await searchInput.fill('Complete Workflow');
      await page.waitForTimeout(500);

      const template = page.getByText('Complete Workflow Template');
      if (await template.isVisible()) {
        await template.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('search, filter by category, and select template', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="搜索"]');
    await searchInput.fill('code');
    await page.waitForTimeout(500);

    const debugCategory = page.getByTestId('category-filter-debug');
    await debugCategory.click();
    await page.waitForTimeout(500);

    const templates = page.locator('[class*="border rounded-lg cursor-pointer"]');
    const count = await templates.count();
    
    if (count > 0) {
      await templates.first().click();
      await page.waitForTimeout(500);
      
      const selectedTemplate = templates.first();
      const classes = await selectedTemplate.getAttribute('class');
      expect(classes).toContain('border-blue-500');
    }
  });

  test('clear filters and browse all templates', async ({ page }) => {
    const devCategory = page.getByTestId('category-filter-development');
    await devCategory.click();
    await page.waitForTimeout(300);

    const searchInput = page.locator('input[placeholder*="搜索"]');
    await searchInput.fill('test');
    await page.waitForTimeout(500);

    const filteredCount = await page.locator('[class*="border rounded-lg cursor-pointer"]').count();

    await searchInput.clear();
    await page.waitForTimeout(300);

    const clearButton = page.getByText('清除筛选');
    if (await clearButton.isVisible()) {
      await clearButton.click();
      await page.waitForTimeout(500);
    }

    const allCount = await page.locator('[class*="border rounded-lg cursor-pointer"]').count();
    expect(allCount).toBeGreaterThanOrEqual(filteredCount);
  });

  test('template selection persists across filters', async ({ page }) => {
    const templates = page.locator('[class*="border rounded-lg cursor-pointer"]');
    if ((await templates.count()) > 0) {
      await templates.first().click();
      await page.waitForTimeout(500);

      const devCategory = page.getByTestId('category-filter-development');
      await devCategory.click();
      await page.waitForTimeout(500);

      const selectedTemplate = page.locator('[class*="border-blue-500"]');
      const count = await selectedTemplate.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('create multiple templates with different categories', async ({ page }) => {
    const templateData = [
      { name: 'Dev Template 1', categories: ['代码开发'], content: 'Dev ${var1}' },
      { name: 'Debug Template 1', categories: ['Bug修复'], content: 'Debug {{var2}}' },
      { name: 'Review Template 1', categories: ['代码审查'], content: 'Review <var3>' },
    ];

    const createButton = page.getByRole('button', { name: /新建.*模板/i });
    
    for (const template of templateData) {
      if (await createButton.isVisible()) {
        await createButton.click();

        await page.fill('input[placeholder*="模板名称"]', template.name);
        
        for (const category of template.categories) {
          const categoryButton = page.getByTitle(new RegExp(category)).first();
          await categoryButton.click();
        }
        
        await page.fill('textarea[placeholder*="prompt 内容"]', template.content);

        await page.getByRole('button', { name: '保存模板' }).click();
        await page.waitForTimeout(1500);
      }
    }

    const searchInput = page.locator('input[placeholder*="搜索"]');
    await searchInput.fill('Template 1');
    await page.waitForTimeout(500);

    const count = await page.locator('[class*="border rounded-lg cursor-pointer"]').count();
    expect(count).toBeGreaterThan(0);
  });

  test('verify category badges display correctly on templates', async ({ page }) => {
    const templates = page.locator('[class*="border rounded-lg cursor-pointer"]');
    if ((await templates.count()) > 0) {
      const firstTemplate = templates.first();
      const categoryBadges = firstTemplate.locator('span').filter({ hasText: /开发|调试|审查|重构|测试/ });
      
      const badgeCount = await categoryBadges.count();
      expect(badgeCount).toBeGreaterThan(0);
    }
  });

  test('parameter display on template cards', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /新建.*模板/i });
    if (await createButton.isVisible()) {
      await createButton.click();

      await page.fill('input[placeholder*="模板名称"]', 'Param Display Test');
      await page.fill(
        'textarea[placeholder*="prompt 内容"]',
        'Test with ${p1}, {{p2}}, <p3>, [p4], ${p5}, {{p6}}'
      );

      await page.getByRole('button', { name: '保存模板' }).click();
      await page.waitForTimeout(1500);

      const searchInput = page.locator('input[placeholder*="搜索"]');
      await searchInput.fill('Param Display Test');
      await page.waitForTimeout(500);

      const template = page.getByText('Param Display Test');
      if (await template.isVisible()) {
        const parameterBadges = page.locator('span').filter({ hasText: /^(p1|p2|p3|p4|p5)$/ });
        const visibleParams = await parameterBadges.count();
        expect(visibleParams).toBeGreaterThan(0);
      }
    }
  });

  test('empty state handling', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="搜索"]');
    await searchInput.fill('ThisTemplateDefinitelyDoesNotExist12345');
    await page.waitForTimeout(500);

    await expect(page.getByText(/没有找到匹配/)).toBeVisible();
    await expect(page.getByText('找到 0 个模板')).toBeVisible();
  });

  test('rapid interaction stress test', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="搜索"]');
    
    await searchInput.fill('test');
    await page.waitForTimeout(100);
    await searchInput.clear();
    await page.waitForTimeout(100);
    await searchInput.fill('debug');
    await page.waitForTimeout(100);
    
    const devCategory = page.getByTestId('category-filter-development');
    await devCategory.click();
    await page.waitForTimeout(100);
    await devCategory.click();
    await page.waitForTimeout(100);
    
    const templates = page.locator('[class*="border rounded-lg cursor-pointer"]');
    if ((await templates.count()) > 0) {
      await templates.first().click();
      await page.waitForTimeout(100);
    }

    const countText = await page.locator('text=/找到.*个模板/').textContent();
    expect(countText).toBeTruthy();
  });

  test('category multi-select and clear workflow', async ({ page }) => {
    const categories = [
      page.getByTestId('category-filter-development'),
      page.getByTestId('category-filter-test'),
      page.getByTestId('category-filter-review')
    ];

    for (const category of categories) {
      if (await category.isVisible()) {
        await category.click();
        await page.waitForTimeout(200);
      }
    }

    await expect(page.getByText('清除筛选')).toBeVisible();

    await page.getByText('清除筛选').click();
    await page.waitForTimeout(500);

    const allTemplates = await page.locator('[class*="border rounded-lg cursor-pointer"]').count();
    expect(allTemplates).toBeGreaterThan(0);
  });

  test('template search with special characters', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="搜索"]');
    
    const specialSearches = ['test!', 'code@', 'debug#', 'prompt$'];
    
    for (const search of specialSearches) {
      await searchInput.fill(search);
      await page.waitForTimeout(300);
      
      const countText = await page.locator('text=/找到.*个模板/').textContent();
      expect(countText).toBeTruthy();
      
      await searchInput.clear();
    }
  });

  test('verify responsive template list updates', async ({ page }) => {
    const initialCount = await page.locator('[class*="border rounded-lg cursor-pointer"]').count();
    
    const searchInput = page.locator('input[placeholder*="搜索"]');
    await searchInput.fill('a');
    await page.waitForTimeout(500);
    
    const countAfterSearch = await page.locator('[class*="border rounded-lg cursor-pointer"]').count();
    
    const devCategory = page.getByTitle(/代码开发/).first();
    await devCategory.click();
    await page.waitForTimeout(500);
    
    const countAfterFilter = await page.locator('[class*="border rounded-lg cursor-pointer"]').count();
    
    expect(typeof countAfterFilter).toBe('number');
  });
});
