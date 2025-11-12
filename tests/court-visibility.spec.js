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

    // On mobile, two-stage flow: event section visible, roster hidden until event selected
    const eventSection = page.locator('#eventSection');
    const rosterSection = page.locator('#rosterSection');
    await expect(eventSection).toBeVisible();
    await expect(rosterSection).not.toBeVisible();
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

  test('two-stage mobile flow: roster appears after event selection', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Setup a game first
    const setupBtn = page.locator('#setupGameBtn');
    await setupBtn.click();

    // Choose manual setup
    const manualSetupBtn = page.locator('#manualSetupBtn');
    await manualSetupBtn.click();

    // Fill in game details
    await page.locator('#opponentInput').fill('Test Opponent');
    await page.locator('#gameSetupForm button[type="submit"]').click();

    // Add a player
    await page.locator('input[name="firstName"]').fill('John');
    await page.locator('input[name="lastName"]').fill('Doe');
    await page.locator('input[name="jersey"]').fill('23');
    await page.locator('#playerForm button[type="submit"]').click();

    // Finish setup
    await page.locator('#finishSetupBtn').click();

    // Wait for modal to close
    await page.waitForTimeout(500);

    // Initial state: event section visible, roster not visible
    const eventSection = page.locator('#eventSection');
    const rosterSection = page.locator('#rosterSection');
    await expect(eventSection).toBeVisible();
    await expect(rosterSection).not.toBeVisible();

    // Click an event button (Made 2)
    const made2Btn = page.locator('button[data-kind="shot"][data-points="2"][data-result="made"]');
    await made2Btn.click();

    // After event selection: roster visible, event section not visible
    await expect(rosterSection).toBeVisible();
    await expect(eventSection).not.toBeVisible();

    // Back button should be visible
    const backBtn = page.locator('#backToEventsBtn');
    await expect(backBtn).toBeVisible();

    // Click back button
    await backBtn.click();

    // Back to first screen: event section visible, roster not visible
    await expect(eventSection).toBeVisible();
    await expect(rosterSection).not.toBeVisible();
  });
});
