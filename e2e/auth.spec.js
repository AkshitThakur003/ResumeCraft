import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await expect(page).toHaveTitle(/ResumeCraft/i);
    // Add more specific checks based on your login page structure
  });

  test('should navigate to register page', async ({ page }) => {
    // This is a basic example - adjust based on your actual UI
    const registerLink = page.getByRole('link', { name: /register|sign up/i });
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await expect(page).toHaveURL(/.*register|.*signup/i);
    }
  });

  // Add more E2E tests as needed
  // Example: test('should login with valid credentials', async ({ page }) => { ... });
});

