// @ts-check
const { test, expect } = require('@playwright/test');
const { addPlayers, finishSetup, gotoApp, openManualSetup } = require('./test-helpers');

test.describe('Roster sorting - on-court players first', () => {
  test('should show on-court players at the top in player list during game', async ({ page }) => {
    await gotoApp(page, { width: 1280, height: 720 });
    await openManualSetup(page, { opponent: 'Test Opponent' });
    const players = [
      { firstName: 'John', lastName: 'Doe', jersey: '1' },
      { firstName: 'Jane', lastName: 'Smith', jersey: '2' },
      { firstName: 'Bob', lastName: 'Johnson', jersey: '3' },
    ];
    await addPlayers(page, players);
    await finishSetup(page);

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
