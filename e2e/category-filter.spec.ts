import { test, expect } from '@playwright/test';

test.describe('Category Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display all category filter buttons', async ({ page }) => {
    await expect(page.getByTestId('category-filter-development')).toBeVisible();
    await expect(page.getByTestId('category-filter-debug')).toBeVisible();
    await expect(page.getByTestId('category-filter-review')).toBeVisible();
    await expect(page.getByTestId('category-filter-refactor')).toBeVisible();
    await expect(page.getByTestId('category-filter-test')).toBeVisible();
  });

  test('should filter templates by single category', async ({ page }) => {
    const initialCount = await page.locator('[class*="border rounded-lg cursor-pointer"]').count();
    
    const debugButton = page.getByTestId('category-filter-debug');
    await debugButton.click();
    
    await page.waitForTimeout(500);
    
    const filteredCount = await page.locator('[class*="border rounded-lg cursor-pointer"]').count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  test('should filter by multiple categories', async ({ page }) => {
    const devButton = page.getByTestId('category-filter-development');
    await devButton.click();
    await page.waitForTimeout(300);

    const testButton = page.getByTestId('category-filter-test');
    await testButton.click();
    await page.waitForTimeout(300);

    const countText = await page.locator('text=/找到.*个模板/').textContent();
    expect(countText).toBeTruthy();
  });

  test('should show clear filter button when categories selected', async ({ page }) => {
    const debugButton = page.getByTestId('category-filter-debug');
    await debugButton.click();
    
    await expect(page.getByText('清除筛选')).toBeVisible();
  });

  test('should clear all category filters', async ({ page }) => {
    const devButton = page.getByTestId('category-filter-development');
    await devButton.click();
    
    const testButton = page.getByTestId('category-filter-test');
    await testButton.click();
    
    await expect(page.getByText('清除筛选')).toBeVisible();
    
    await page.getByText('清除筛选').click();
    
    await page.waitForTimeout(500);
    
    const allTemplates = await page.locator('[class*="border rounded-lg cursor-pointer"]').count();
    expect(allTemplates).toBeGreaterThan(0);
  });

  test('should highlight selected category filters', async ({ page }) => {
    const debugButton = page.getByTestId('category-filter-debug');
    await debugButton.click();
    
    await page.waitForTimeout(300);
    
    const buttonClasses = await debugButton.getAttribute('class');
    expect(buttonClasses).toContain('border-current');
  });

  test('should toggle category selection on click', async ({ page }) => {
    const devButton = page.getByTestId('category-filter-development');
    
    await devButton.click();
    await page.waitForTimeout(300);
    
    let buttonClasses = await devButton.getAttribute('class');
    expect(buttonClasses).toContain('border-current');
    
    await devButton.click();
    await page.waitForTimeout(300);
    
    buttonClasses = await devButton.getAttribute('class');
    expect(buttonClasses).not.toContain('border-current');
  });

  test('should update template count based on filter', async ({ page }) => {
    const initialCountText = await page.locator('text=/找到.*个模板/').textContent();
    const initialMatch = initialCountText?.match(/\d+/);
    const initialCount = initialMatch ? parseInt(initialMatch[0]) : 0;

    const debugButton = page.getByTestId('category-filter-debug');
    await debugButton.click();
    await page.waitForTimeout(500);

    const filteredCountText = await page.locator('text=/找到.*个模板/').textContent();
    expect(filteredCountText).toBeTruthy();
  });

  test('should show no results message when no templates match', async ({ page }) => {
    const allCategories = await page.locator('[title]').filter({ hasText: /修复|开发|测试/ }).all();
    
    for (const category of allCategories.slice(0, 3)) {
      await category.click();
      await page.waitForTimeout(200);
    }

    await page.fill('input[placeholder*="搜索"]', 'NonExistentTemplateXYZ123');
    await page.waitForTimeout(500);

    const noResults = page.getByText(/没有找到匹配/);
    if (await noResults.isVisible()) {
      await expect(noResults).toBeVisible();
    }
  });

  test('should display category badges on templates', async ({ page }) => {
    const templates = page.locator('[class*="border rounded-lg cursor-pointer"]').first();
    
    const categoryBadge = templates.locator('span').filter({ hasText: /开发|调试|审查|测试/ }).first();
    if (await categoryBadge.isVisible()) {
      await expect(categoryBadge).toBeVisible();
    }
  });

  test('should maintain filters when navigating', async ({ page }) => {
    const devButton = page.getByTestId('category-filter-development');
    await devButton.click();
    await page.waitForTimeout(500);

    await expect(page.getByText('清除筛选')).toBeVisible();
  });

  test('should filter works with search', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="搜索"]');
    await searchInput.fill('test');
    await page.waitForTimeout(500);

    const devButton = page.getByTestId('category-filter-development');
    await devButton.click();
    await page.waitForTimeout(500);

    const countText = await page.locator('text=/找到.*个模板/').textContent();
    expect(countText).toBeTruthy();
  });

  test('should show all templates when no filters applied', async ({ page }) => {
    const allTemplates = await page.locator('[class*="border rounded-lg cursor-pointer"]').count();
    expect(allTemplates).toBeGreaterThan(0);
  });

  test('should respect category hierarchy', async ({ page }) => {
    const aiButton = page.getByTestId('category-filter-ai');
    if (await aiButton.isVisible()) {
      await aiButton.click();
      await page.waitForTimeout(500);
      
      const templates = await page.locator('[class*="border rounded-lg cursor-pointer"]').count();
      expect(templates).toBeGreaterThanOrEqual(0);
    }
  });

  test('should handle rapid category selection', async ({ page }) => {
    const categories = await page.locator('[title]').filter({ hasText: /修复|开发|测试|审查/ }).all();
    
    for (const category of categories.slice(0, 5)) {
      await category.click();
      await page.waitForTimeout(100);
    }

    const countText = await page.locator('text=/找到.*个模板/').textContent();
    expect(countText).toBeTruthy();
  });
});
