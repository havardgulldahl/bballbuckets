// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Roster sorting - on-court players first', () => {
  test('should show on-court players at the top in player list during game', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Setup a game
    const setupBtn = page.locator('#setupGameBtn');
    await setupBtn.click();

    // Choose manual setup
    const manualSetupBtn = page.locator('#manualSetupBtn');
    await manualSetupBtn.click();

    // Fill in game details
    await page.locator('#opponentInput').fill('Test Opponent');
    await page.locator('#gameSetupForm button[type="submit"]').click();

    // Add multiple players
    const players = [
      { firstName: 'John', lastName: 'Doe', jersey: '1' },
      { firstName: 'Jane', lastName: 'Smith', jersey: '2' },
      { firstName: 'Bob', lastName: 'Johnson', jersey: '3' },
    ];

    for (const player of players) {
      await page.locator('input[name="firstName"]').fill(player.firstName);
      await page.locator('input[name="lastName"]').fill(player.lastName);
      await page.locator('input[name="jersey"]').fill(player.jersey);
      await page.locator('#playerForm button[type="submit"]').click();
      await page.waitForTimeout(100);
    }

    // Finish setup
    await page.locator('#finishSetupBtn').click();
    await page.waitForTimeout(500);

    // Toggle Bob (player 3) to be on court
    const checkboxes = page.locator('#playerList .player-chip input[type="checkbox"]');
    await checkboxes.nth(2).check(); // Bob Johnson (#3)
    await page.waitForTimeout(200);

    // Get the player chips after sorting
    const sortedChips = page.locator('#playerList .player-chip');
    
    // First player should be Bob (on court)
    const firstChipText = await sortedChips.nth(0).textContent();
    expect(firstChipText).toContain('Bob Johnson');
    
    // First chip should have 'on-court' class
    const firstChipClass = await sortedChips.nth(0).getAttribute('class');
    expect(firstChipClass).toContain('on-court');
  });
});
