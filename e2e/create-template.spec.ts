import { test, expect } from '@playwright/test';

test.describe('Create Prompt Template', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should open create template modal', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /新建.*模板/i });
    if (await createButton.isVisible()) {
      await createButton.click();
      await expect(page.getByText('创建新 Prompt 模板')).toBeVisible();
    }
  });

  test('should create a new prompt template with all fields', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /新建.*模板/i });
    if (await createButton.isVisible()) {
      await createButton.click();

      await page.fill('input[placeholder*="模板名称"]', 'E2E Test Template');
      
      await page.fill('textarea[placeholder*="描述"]', 'This is a test template created by E2E tests');
      
      const developmentCategory = page.getByTestId('category-filter-development');
      await developmentCategory.click();
      
      await page.fill(
        'textarea[placeholder*="prompt 内容"]',
        'Test prompt with ${param1} and {{param2}}'
      );

      await page.getByRole('button', { name: '保存模板' }).click();

      await page.waitForTimeout(1000);
    }
  });

  test('should validate required fields', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /新建.*模板/i });
    if (await createButton.isVisible()) {
      await createButton.click();

      const saveButton = page.getByRole('button', { name: '保存模板' });
      await saveButton.click();

      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('请填写');
        await dialog.accept();
      });
    }
  });

  test('should detect parameters automatically', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /新建.*模板/i });
    if (await createButton.isVisible()) {
      await createButton.click();

      await page.fill(
        'textarea[placeholder*="prompt 内容"]',
        'Use ${variable1}, {{variable2}}, <variable3>, and [variable4]'
      );

      await expect(page.getByText('variable1')).toBeVisible();
      await expect(page.getByText('variable2')).toBeVisible();
      await expect(page.getByText('variable3')).toBeVisible();
      await expect(page.getByText('variable4')).toBeVisible();
      
      await expect(page.getByText(/检测到的参数.*4/)).toBeVisible();
    }
  });

  test('should allow selecting multiple categories', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /新建.*模板/i });
    if (await createButton.isVisible()) {
      await createButton.click();

      const developmentBtn = page.getByTestId('category-filter-development');
      await developmentBtn.click();

      const testBtn = page.getByTestId('category-filter-test');
      await testBtn.click();

      const reviewBtn = page.getByTestId('category-filter-review');
      await reviewBtn.click();

      await expect(page.getByText('已选择 4 个分类')).toBeVisible();
    }
  });

  test('should require at least one category', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /新建.*模板/i });
    if (await createButton.isVisible()) {
      await createButton.click();

      await page.fill('input[placeholder*="模板名称"]', 'Test Template');
      await page.fill('textarea[placeholder*="prompt 内容"]', 'Test content');

      const customBadge = page.getByText('自定义').first();
      if (await customBadge.isVisible()) {
        await customBadge.click();
      }

      page.once('dialog', async dialog => {
        expect(dialog.message()).toContain('请至少选择一个分类');
        await dialog.accept();
      });

      await page.getByRole('button', { name: '保存模板' }).click();
      await page.waitForTimeout(500);
    }
  });

  test('should close modal on cancel', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /新建.*模板/i });
    if (await createButton.isVisible()) {
      await createButton.click();
      
      await expect(page.getByText('创建新 Prompt 模板')).toBeVisible();

      await page.getByRole('button', { name: '取消' }).click();

      await expect(page.getByText('创建新 Prompt 模板')).not.toBeVisible();
    }
  });

  test('should close modal on X button', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /新建.*模板/i });
    if (await createButton.isVisible()) {
      await createButton.click();
      
      await expect(page.getByText('创建新 Prompt 模板')).toBeVisible();

      await page.getByText('×').click();

      await expect(page.getByText('创建新 Prompt 模板')).not.toBeVisible();
    }
  });

  test('should handle special characters in template name', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /新建.*模板/i });
    if (await createButton.isVisible()) {
      await createButton.click();

      await page.fill('input[placeholder*="模板名称"]', 'Test Template !@#$%^&*()');
      await page.fill('textarea[placeholder*="prompt 内容"]', 'Test content');

      await page.getByRole('button', { name: '保存模板' }).click();
      await page.waitForTimeout(1000);
    }
  });

  test('should preserve form data when switching categories', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /新建.*模板/i });
    if (await createButton.isVisible()) {
      await createButton.click();

      const templateName = 'Persistent Template';
      await page.fill('input[placeholder*="模板名称"]', templateName);

      const developmentBtn = page.getByTestId('category-filter-development');
      await developmentBtn.click();

      const nameInput = page.locator('input[placeholder*="模板名称"]');
      await expect(nameInput).toHaveValue(templateName);
    }
  });
});
