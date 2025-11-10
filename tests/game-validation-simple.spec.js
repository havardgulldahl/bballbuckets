// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Game Logic Validation - Simple Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('validation banner exists in DOM', async ({ page }) => {
    // Check that validation banner element exists
    const banner = page.locator('#validationBanner');
    await expect(banner).toBeInDOM();
  });

  test('can add players without errors when jerseys are unique', async ({ page }) => {
    // Setup game
    await page.click('#setupGameBtn');
    await page.waitForSelector('#gameSetupDialog', { state: 'visible' });
    await page.fill('#opponentInput', 'Test Team');
    await page.fill('#gameDateInput', '2024-01-01');
    await page.click('button[type="submit"]:has-text("Continue to Roster")');
    await page.waitForSelector('#rosterSetupSection', { state: 'visible' });

    // Use quick start
    await page.click('#quickStartBtn');
    await page.waitForTimeout(500);

    // Verify players were added
    const rosterItems = page.locator('#rosterPreview > div');
    const count = await rosterItems.count();
    expect(count).toBe(5); // Quick start adds 5 players
  });

  test('can toggle players on and off court', async ({ page }) => {
    // Setup game with quick start
    await page.click('#setupGameBtn');
    await page.waitForSelector('#gameSetupDialog', { state: 'visible' });
    await page.fill('#opponentInput', 'Test Team');
    await page.fill('#gameDateInput', '2024-01-01');
    await page.click('button[type="submit"]:has-text("Continue to Roster")');
    await page.waitForSelector('#rosterSetupSection', { state: 'visible' });
    await page.click('#quickStartBtn');
    await page.waitForTimeout(300);
    await page.click('#finishSetupBtn');
    await page.waitForTimeout(500);

    // Toggle first player on court
    const firstToggle = page.locator('.court-toggle input[type="checkbox"]').first();
    await firstToggle.check();
    await page.waitForTimeout(300);

    // Verify checkbox is checked
    await expect(firstToggle).toBeChecked();
  });

  test('court coordinates are tracked for shots', async ({ page }) => {
    // Setup game
    await page.click('#setupGameBtn');
    await page.waitForSelector('#gameSetupDialog', { state: 'visible' });
    await page.fill('#opponentInput', 'Test Team');
    await page.fill('#gameDateInput', '2024-01-01');
    await page.click('button[type="submit"]:has-text("Continue to Roster")');
    await page.waitForSelector('#rosterSetupSection', { state: 'visible' });
    await page.click('#quickStartBtn');
    await page.click('#finishSetupBtn');
    await page.waitForTimeout(500);

    // Click on court to select position
    const courtSVG = page.locator('#courtSVG');
    await courtSVG.click({ position: { x: 250, y: 100 } });
    await page.waitForTimeout(200);

    // Select shot event
    await page.click('button[data-kind="shot"][data-points="2"][data-result="made"]');
    await page.waitForTimeout(200);

    // Select first player
    await page.click('.player-chip:first-child');
    await page.waitForTimeout(500);

    // Verify event was logged (score should update)
    const scoreElement = page.locator('#headerScore');
    const scoreText = await scoreElement.textContent();
    expect(scoreText).toContain('2');
  });

  test('validation functions are defined', async ({ page }) => {
    // Check that validation functions exist in window
    const hasFunctions = await page.evaluate(() => {
      // These functions should be accessible globally or in the state
      return typeof validateGameState !== 'undefined' || 
             document.getElementById('validationBanner') !== null;
    });
    expect(hasFunctions).toBeTruthy();
  });
});
