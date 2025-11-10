// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('New Game button functionality', () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear IndexedDB before each test
    await context.clearCookies();
    await page.goto('/');
    await page.evaluate(() => {
      const databases = ['hooptrack-db'];
      databases.forEach(dbName => {
        indexedDB.deleteDatabase(dbName);
      });
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('new game button should be hidden initially and after game setup', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    // New Game button should not be visible without a game
    let newGameBtn = page.locator('#newGameBtn');
    await expect(newGameBtn).not.toBeVisible();

    // Setup a game
    const setupGameBtn = page.locator('#setupGameBtn');
    await setupGameBtn.click();
    
    // Fill in game details
    await page.fill('input[name="opponent"]', 'Test Opponent');
    await page.fill('input[name="date"]', '2025-11-10');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    
    // Add a quick player
    await page.click('#quickStartBtn');
    await page.waitForTimeout(500);
    
    // Finish setup
    await page.click('#finishSetupBtn');
    await page.waitForTimeout(1000);
    
    // New Game button should still not be visible during active game
    newGameBtn = page.locator('#newGameBtn');
    await expect(newGameBtn).not.toBeVisible();
    
    // Finish Game button should be visible
    const finishGameBtn = page.locator('#finishGameBtn');
    await expect(finishGameBtn).toBeVisible();
  });

  test('new game button should appear after game is finished', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    // Setup a game
    const setupGameBtn = page.locator('#setupGameBtn');
    await setupGameBtn.click();
    
    // Fill in game details
    await page.fill('input[name="opponent"]', 'Test Opponent');
    await page.fill('input[name="date"]', '2025-11-10');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    
    // Add a quick player
    await page.click('#quickStartBtn');
    await page.waitForTimeout(500);
    
    // Finish setup
    await page.click('#finishSetupBtn');
    await page.waitForTimeout(1000);
    
    // New Game button should not be visible before game is finished
    const newGameBtn = page.locator('#newGameBtn');
    await expect(newGameBtn).not.toBeVisible();
    
    // Setup dialog handler before clicking finish game
    page.on('dialog', dialog => dialog.accept());
    
    // Finish the game
    const finishGameBtn = page.locator('#finishGameBtn');
    await finishGameBtn.click();
    
    // Wait for dialog to be handled and UI to update
    await page.waitForTimeout(2000);
    
    // New Game button should now be visible
    await expect(newGameBtn).toBeVisible();
    
    // Finish Game button should be hidden
    await expect(finishGameBtn).not.toBeVisible();
  });

  test('clicking new game button shows confirmation and resets state', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    // Setup a game
    const setupGameBtn = page.locator('#setupGameBtn');
    await setupGameBtn.click();
    
    // Fill in game details
    await page.fill('input[name="opponent"]', 'Test Opponent');
    await page.fill('input[name="date"]', '2025-11-10');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);
    
    // Add a quick player
    await page.click('#quickStartBtn');
    await page.waitForTimeout(500);
    
    // Finish setup
    await page.click('#finishSetupBtn');
    await page.waitForTimeout(1000);
    
    // Setup dialog handler to accept all dialogs
    page.on('dialog', dialog => dialog.accept());
    
    // Finish the game
    const finishGameBtn = page.locator('#finishGameBtn');
    await finishGameBtn.click();
    await page.waitForTimeout(2000);
    
    // Click the New Game button
    const newGameBtn = page.locator('#newGameBtn');
    await newGameBtn.click();
    await page.waitForTimeout(2000);
    
    // Check that game setup dialog is shown
    const gameSetupDialog = page.locator('#gameSetupDialog');
    await expect(gameSetupDialog).toBeVisible();
    
    // Check that opponent field is empty (state was reset)
    const opponentInput = page.locator('input[name="opponent"]');
    await expect(opponentInput).toHaveValue('');
  });
});
