// @ts-check
const { test, expect } = require('@playwright/test');
const { addPlayers, finishSetup, gotoApp, openManualSetup, openSetupDialog, setupGameWithQuickStart } = require('./test-helpers');

test.describe('Game Logic Validation', () => {
  test.beforeEach(async ({ page }) => {
    await gotoApp(page, { width: 1280, height: 720 });
  });

  test('should detect duplicate jersey numbers', async ({ page }) => {
    await openManualSetup(page);
    await addPlayers(page, [
      { firstName: 'John', lastName: 'Doe', jersey: '5' },
      { firstName: 'Jane', lastName: 'Smith', jersey: '5' }
    ]);
    await finishSetup(page);

    await page.waitForTimeout(500);

    // Check for validation error
    const banner = page.locator('#validationBanner');
    await expect(banner).toBeVisible({ timeout: 5000 });
    const bannerText = await banner.textContent();
    expect(bannerText).toContain('Error');
    expect(bannerText).toContain('Duplicate jersey number');
    expect(bannerText).toContain('5');
  });

  test('should not show error when all jersey numbers are unique', async ({ page }) => {
    await openManualSetup(page);
    const players = [
      { firstName: 'John', lastName: 'Doe', jersey: '1' },
      { firstName: 'Jane', lastName: 'Smith', jersey: '2' },
      { firstName: 'Bob', lastName: 'Johnson', jersey: '3' }
    ];
    await addPlayers(page, players);
    await finishSetup(page);

    // Wait to ensure no validation banner appears
    await page.waitForTimeout(1000);

    // Validation banner should not be visible
    const banner = page.locator('#validationBanner');
    await expect(banner).not.toBeVisible();
  });

  test('should warn when more than 5 players on court', async ({ page }) => {
    await setupGameWithQuickStart(page);

    // Toggle exactly 6 players to be on court
    const toggles = page.locator('.court-toggle input[type="checkbox"]');
    for (let i = 0; i < 6; i++) {
      await toggles.nth(i).check();
    }

    // Wait for validation
    await page.waitForTimeout(500);

    // Check for validation error
    const banner = page.locator('#validationBanner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('Error');
    await expect(banner).toContainText('6 players on court');
    await expect(banner).toContainText('maximum is 5');
  });

  test('should warn when fewer than 5 players on court during active play', async ({ page }) => {
    await setupGameWithQuickStart(page);

    // Log an event to start active play
    await page.click('button[data-kind="shot"][data-points="2"][data-result="made"]');
    await page.click('.player-chip:first-child');

    // Toggle only 3 players to be on court
    const toggles = page.locator('.court-toggle input[type="checkbox"]');
    for (let i = 0; i < 3; i++) {
      await toggles.nth(i).check();
    }

    // Wait for validation
    await page.waitForTimeout(500);

    // Check for validation warning
    const banner = page.locator('#validationBanner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('Warning');
    await expect(banner).toContainText('Only 3 players on court');
    await expect(banner).toContainText('normal is 5');
  });

  test('should allow exactly 5 players on court without warning', async ({ page }) => {
    await setupGameWithQuickStart(page);

    // Toggle exactly 5 players to be on court
    const toggles = page.locator('.court-toggle input[type="checkbox"]');
    const count = await toggles.count();
    for (let i = 0; i < Math.min(5, count); i++) {
      await toggles.nth(i).check();
    }

    // Wait for validation
    await page.waitForTimeout(500);

    // No validation banner should appear for exactly 5 players
    const banner = page.locator('#validationBanner');
    await expect(banner).not.toBeVisible();
  });

  test('should warn about 3-pointer inside the arc', async ({ page }) => {
    await setupGameWithQuickStart(page);

    // Click on court near the basket (inside 3-point line)
    // The basket is at approximately (250, 20) for top basket
    // Click at paint area which is definitely inside the arc
    const courtSVG = page.locator('#courtSVG');
    const box = await courtSVG.boundingBox();
    
    if (box) {
      // Click at center horizontally, close to the basket (inside paint)
      await courtSVG.click({ position: { x: box.width / 2, y: 100 } });
    }

    // Select 3-pointer made
    await page.click('button[data-kind="shot"][data-points="3"][data-result="made"]');
    
    // Select a player
    await page.click('.player-chip:first-child');

    // Wait for validation
    await page.waitForTimeout(500);

    // Check for validation warning about shot location
    const banner = page.locator('#validationBanner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('Warning');
    await expect(banner).toContainText('3-pointer recorded inside the 3-point line');
  });

  test('should not warn about 3-pointer outside the arc', async ({ page }) => {
    await setupGameWithQuickStart(page);

    // Click on court far from basket (outside 3-point line)
    // Click near the top-left corner which is definitely beyond the arc
    const courtSVG = page.locator('#courtSVG');
    const box = await courtSVG.boundingBox();
    
    if (box) {
      // Click at left side, far from basket (outside arc)
      await courtSVG.click({ position: { x: 80, y: 350 } });
    }

    // Select 3-pointer made
    await page.click('button[data-kind="shot"][data-points="3"][data-result="made"]');
    
    // Select a player
    await page.click('.player-chip:first-child');

    // Wait for validation
    await page.waitForTimeout(500);

    // Validation banner should not show shot location warning
    const banner = page.locator('#validationBanner');
    const bannerText = await banner.textContent();
    
    if (bannerText && bannerText.trim() !== '') {
      // If banner exists, it should not mention 3-pointer inside arc
      expect(bannerText).not.toContain('3-pointer recorded inside the 3-point line');
    }
  });

  test('should clear validation warnings when issues are resolved', async ({ page }) => {
    await openManualSetup(page);
    await addPlayers(page, [
      { firstName: 'John', lastName: 'Doe', jersey: '5' },
      { firstName: 'Jane', lastName: 'Smith', jersey: '5' }
    ]);
    await finishSetup(page);

    // Confirm error is shown
    const banner = page.locator('#validationBanner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('Duplicate jersey number');

    // Remove one player to resolve the duplicate jersey issue
    await openSetupDialog(page);
    const removeButtons = page.locator('#rosterPreview button:has-text("Remove")');
    await removeButtons.first().click();

    await finishSetup(page);

    // Validation banner should be gone or not showing the duplicate error
    const bannerAfter = page.locator('#validationBanner');
    const isVisible = await bannerAfter.isVisible();
    
    if (isVisible) {
      const text = await bannerAfter.textContent();
      expect(text).not.toContain('Duplicate jersey number');
    }
  });
});
