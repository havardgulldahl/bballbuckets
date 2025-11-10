// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Court visibility on different viewports', () => {
  test('court section should be hidden on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check that court section is not visible
    const courtSection = page.locator('#courtSection');
    await expect(courtSection).not.toBeVisible();

    // Verify event and roster sections are visible
    const eventSection = page.locator('#eventSection');
    const rosterSection = page.locator('#rosterSection');
    await expect(eventSection).toBeVisible();
    await expect(rosterSection).toBeVisible();
  });

  test('court section should be visible on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check that court section is visible
    const courtSection = page.locator('#courtSection');
    await expect(courtSection).toBeVisible();

    // Verify all sections are visible
    const eventSection = page.locator('#eventSection');
    const rosterSection = page.locator('#rosterSection');
    await expect(eventSection).toBeVisible();
    await expect(rosterSection).toBeVisible();
  });

  test('court section should be visible on desktop viewport', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check that court section is visible
    const courtSection = page.locator('#courtSection');
    await expect(courtSection).toBeVisible();

    // Verify all sections are visible
    const eventSection = page.locator('#eventSection');
    const rosterSection = page.locator('#rosterSection');
    await expect(eventSection).toBeVisible();
    await expect(rosterSection).toBeVisible();
  });

  test('layout adjusts correctly on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check that main grid is using single column layout on mobile
    const main = page.locator('main');
    const gridTemplateColumns = await main.evaluate((el) => {
      return window.getComputedStyle(el).getPropertyValue('grid-template-columns');
    });

    // On mobile, we expect grid to have a single column (not two columns separated by space)
    // The value could be "1fr" or a pixel value like "375px" depending on the browser
    const columnCount = gridTemplateColumns.trim().split(/\s+/).length;
    expect(columnCount).toBe(1);
  });
});
