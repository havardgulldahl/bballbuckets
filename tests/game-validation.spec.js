// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Game Logic Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Set desktop viewport for easier testing
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should detect duplicate jersey numbers', async ({ page }) => {
    // Setup game
    await page.click('#setupGameBtn');
    await page.waitForSelector('#gameSetupDialog', { state: 'visible' });
    await page.fill('#opponentInput', 'Test Team');
    await page.fill('#gameDateInput', '2024-01-01');
    await page.click('button[type="submit"]:has-text("Continue to Roster")');
    
    // Wait for roster section to appear
    await page.waitForSelector('#rosterSetupSection', { state: 'visible' });

    // Add first player with jersey #5
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="jersey"]', '5');
    await page.click('#playerForm button[type="submit"]');
    await page.waitForTimeout(200);

    // Add second player with jersey #5 (duplicate)
    await page.fill('input[name="firstName"]', 'Jane');
    await page.fill('input[name="lastName"]', 'Smith');
    await page.fill('input[name="jersey"]', '5');
    await page.click('#playerForm button[type="submit"]');
    await page.waitForTimeout(200);

    // Finish setup
    await page.click('#finishSetupBtn');

    // Wait for validation banner to appear
    await page.waitForTimeout(1000);

    // Check for validation error
    const banner = page.locator('#validationBanner');
    await expect(banner).toBeVisible({ timeout: 5000 });
    const bannerText = await banner.textContent();
    expect(bannerText).toContain('Error');
    expect(bannerText).toContain('Duplicate jersey number');
    expect(bannerText).toContain('5');
  });

  test('should not show error when all jersey numbers are unique', async ({ page }) => {
    // Setup game
    await page.click('#setupGameBtn');
    await page.waitForSelector('#gameSetupDialog', { state: 'visible' });
    await page.fill('#opponentInput', 'Test Team');
    await page.fill('#gameDateInput', '2024-01-01');
    await page.click('button[type="submit"]:has-text("Continue to Roster")');
    await page.waitForSelector('#rosterSetupSection', { state: 'visible' });

    // Add players with unique jerseys
    const players = [
      { firstName: 'John', lastName: 'Doe', jersey: '1' },
      { firstName: 'Jane', lastName: 'Smith', jersey: '2' },
      { firstName: 'Bob', lastName: 'Johnson', jersey: '3' }
    ];

    for (const player of players) {
      await page.fill('input[name="firstName"]', player.firstName);
      await page.fill('input[name="lastName"]', player.lastName);
      await page.fill('input[name="jersey"]', player.jersey);
      await page.click('#playerForm button[type="submit"]');
      await page.waitForTimeout(100);
    }

    // Finish setup
    await page.click('#finishSetupBtn');

    // Wait to ensure no validation banner appears
    await page.waitForTimeout(1000);

    // Validation banner should not be visible
    const banner = page.locator('#validationBanner');
    await expect(banner).not.toBeVisible();
  });

  test('should warn when more than 5 players on court', async ({ page }) => {
    // Setup game with 6 players
    await page.click('#setupGameBtn');
    await page.fill('#opponentInput', 'Test Team');
    await page.fill('#gameDateInput', '2024-01-01');
    await page.click('button[type="submit"]:has-text("Continue to Roster")');

    // Use quick start to add 5 players
    await page.click('#quickStartBtn');
    
    // Add one more player
    await page.fill('input[name="firstName"]', 'Extra');
    await page.fill('input[name="lastName"]', 'Player');
    await page.fill('input[name="jersey"]', '6');
    await page.click('#playerForm button[type="submit"]');

    // Finish setup
    await page.click('#finishSetupBtn');

    // Toggle all 6 players to be on court
    const toggles = page.locator('.court-toggle input[type="checkbox"]');
    const count = await toggles.count();
    for (let i = 0; i < count; i++) {
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
    // Setup game with quick start
    await page.click('#setupGameBtn');
    await page.fill('#opponentInput', 'Test Team');
    await page.fill('#gameDateInput', '2024-01-01');
    await page.click('button[type="submit"]:has-text("Continue to Roster")');
    await page.click('#quickStartBtn');
    await page.click('#finishSetupBtn');

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
    // Setup game with quick start
    await page.click('#setupGameBtn');
    await page.fill('#opponentInput', 'Test Team');
    await page.fill('#gameDateInput', '2024-01-01');
    await page.click('button[type="submit"]:has-text("Continue to Roster")');
    await page.click('#quickStartBtn');
    await page.click('#finishSetupBtn');

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
    // Setup game
    await page.click('#setupGameBtn');
    await page.fill('#opponentInput', 'Test Team');
    await page.fill('#gameDateInput', '2024-01-01');
    await page.click('button[type="submit"]:has-text("Continue to Roster")');
    await page.click('#quickStartBtn');
    await page.click('#finishSetupBtn');

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
    // Setup game
    await page.click('#setupGameBtn');
    await page.fill('#opponentInput', 'Test Team');
    await page.fill('#gameDateInput', '2024-01-01');
    await page.click('button[type="submit"]:has-text("Continue to Roster")');
    await page.click('#quickStartBtn');
    await page.click('#finishSetupBtn');

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
    // Setup game
    await page.click('#setupGameBtn');
    await page.fill('#opponentInput', 'Test Team');
    await page.fill('#gameDateInput', '2024-01-01');
    await page.click('button[type="submit"]:has-text("Continue to Roster")');

    // Add two players with same jersey
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="jersey"]', '5');
    await page.click('#playerForm button[type="submit"]');

    await page.fill('input[name="firstName"]', 'Jane');
    await page.fill('input[name="lastName"]', 'Smith');
    await page.fill('input[name="jersey"]', '5');
    await page.click('#playerForm button[type="submit"]');

    await page.click('#finishSetupBtn');
    await page.waitForTimeout(500);

    // Confirm error is shown
    const banner = page.locator('#validationBanner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('Duplicate jersey number');

    // Remove one player to resolve the duplicate jersey issue
    await page.click('#setupGameBtn');
    const removeButtons = page.locator('#rosterPreview button:has-text("Remove")');
    await removeButtons.first().click();

    // Close and reopen to trigger validation
    await page.click('#finishSetupBtn');
    await page.waitForTimeout(500);

    // Validation banner should be gone or not showing the duplicate error
    const bannerAfter = page.locator('#validationBanner');
    const isVisible = await bannerAfter.isVisible();
    
    if (isVisible) {
      const text = await bannerAfter.textContent();
      expect(text).not.toContain('Duplicate jersey number');
    }
  });
});
