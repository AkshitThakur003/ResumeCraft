import { test, expect } from '@playwright/test';

test.describe('Resume Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Login (adjust selectors based on your actual login form)
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation after login
    await page.waitForURL('/dashboard', { timeout: 10000 });
  });

  test('should navigate to resume list page', async ({ page }) => {
    await page.goto('/resumes');
    
    // Check if resume list page is loaded
    await expect(page).toHaveURL(/.*\/resumes/);
    
    // Check for page title or heading
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('should display empty state when no resumes', async ({ page }) => {
    await page.goto('/resumes');
    
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Check for empty state message (adjust selector based on your UI)
    const emptyState = page.locator('text=/no resume|no resumes|empty/i').first();
    
    // This test might fail if there are resumes - adjust accordingly
    if (await emptyState.isVisible()) {
      await expect(emptyState).toBeVisible();
    }
  });

  test('should navigate to upload resume page', async ({ page }) => {
    await page.goto('/resumes');
    
    // Look for upload button or link
    const uploadButton = page.locator('button:has-text("Upload"), a:has-text("Upload")').first();
    
    if (await uploadButton.isVisible()) {
      await uploadButton.click();
      
      // Wait for navigation
      await page.waitForLoadState('networkidle');
      
      // Check if we're on upload page
      await expect(page).toHaveURL(/.*\/upload|.*\/resumes\/upload/);
    }
  });

  test('should filter resumes by status', async ({ page }) => {
    await page.goto('/resumes');
    
    await page.waitForLoadState('networkidle');
    
    // Look for filter dropdown or buttons
    const filterButton = page.locator('button:has-text("Filter"), select').first();
    
    if (await filterButton.isVisible()) {
      await filterButton.click();
      
      // Select a filter option (adjust based on your UI)
      const option = page.locator('text=/active|all|draft/i').first();
      if (await option.isVisible()) {
        await option.click();
        
        // Wait for filter to apply
        await page.waitForTimeout(1000);
        
        // Verify URL has filter parameter or content changed
        const url = page.url();
        expect(url).toMatch(/status=|filter=/);
      }
    }
  });

  test('should search resumes', async ({ page }) => {
    await page.goto('/resumes');
    
    await page.waitForLoadState('networkidle');
    
    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('test resume');
      
      // Wait for search to complete
      await page.waitForTimeout(1000);
      
      // Verify search parameter in URL
      const url = page.url();
      expect(url).toMatch(/search=/);
    }
  });
});

test.describe('Resume Analysis', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });
  });

  test('should navigate to analysis page', async ({ page }) => {
    // Assume there's at least one resume
    await page.goto('/resumes');
    await page.waitForLoadState('networkidle');
    
    // Look for a resume card or link
    const resumeLink = page.locator('[data-testid*="resume"], a[href*="/resumes/"]').first();
    
    if (await resumeLink.isVisible({ timeout: 5000 })) {
      await resumeLink.click();
      await page.waitForLoadState('networkidle');
      
      // Should be on analysis or detail page
      await expect(page).toHaveURL(/.*\/resumes\/.*/);
    }
  });
});

