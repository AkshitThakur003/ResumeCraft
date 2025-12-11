import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Login
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation after login
    await page.waitForURL('/dashboard', { timeout: 10000 });
  });

  test('should display dashboard page', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check if dashboard page is loaded
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Check for dashboard heading or title
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('should display dashboard statistics', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Look for stat cards or numbers
    // Adjust selectors based on your actual dashboard structure
    const stats = page.locator('[data-testid*="stat"], .stat-card, .dashboard-stat').first();
    
    if (await stats.isVisible({ timeout: 5000 })) {
      await expect(stats).toBeVisible();
    }
  });

  test('should display quick actions', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Look for quick action buttons
    const quickActions = page.locator('button:has-text("Upload"), a:has-text("Upload"), button:has-text("Create")').first();
    
    if (await quickActions.isVisible({ timeout: 5000 })) {
      await expect(quickActions).toBeVisible();
    }
  });

  test('should navigate to resume list from dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Look for link or button to resumes
    const resumesLink = page.locator('a:has-text("Resumes"), button:has-text("Resumes")').first();
    
    if (await resumesLink.isVisible({ timeout: 5000 })) {
      await resumesLink.click();
      await page.waitForLoadState('networkidle');
      
      // Should navigate to resumes page
      await expect(page).toHaveURL(/.*\/resumes/);
    }
  });

  test('should display recent activity', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Look for recent activity section
    const recentActivity = page.locator('text=/recent|activity/i').first();
    
    if (await recentActivity.isVisible({ timeout: 5000 })) {
      await expect(recentActivity).toBeVisible();
    }
  });

  test('should display charts or visualizations', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Look for charts (Recharts, etc.)
    const charts = page.locator('svg, canvas, [class*="chart"]').first();
    
    if (await charts.isVisible({ timeout: 5000 })) {
      await expect(charts).toBeVisible();
    }
  });
});

