const { expect } = require('@playwright/test');

async function gotoApp(page, viewport) {
  if (viewport) {
    await page.setViewportSize(viewport);
  }

  await page.goto('/');
  await page.waitForLoadState('networkidle');
}

async function openSetupDialog(page) {
  const dialog = page.locator('#gameSetupDialog');

  if (!(await dialog.isVisible())) {
    await page.locator('#setupGameBtn').click();
    await expect(dialog).toBeVisible();
  }

  return dialog;
}

async function openManualSetup(page, game = {}) {
  const { opponent = 'Test Team', date = '2024-01-01' } = game;

  await openSetupDialog(page);

  const manualSetupSection = page.locator('#manualSetupSection');
  if (!(await manualSetupSection.isVisible())) {
    await page.locator('#manualSetupBtn').click();
    await expect(manualSetupSection).toBeVisible();
  }

  await page.locator('#opponentInput').fill(opponent);
  await page.locator('#gameDateInput').fill(date);
  await page.locator('#gameSetupForm button[type="submit"]').click();
  await expect(page.locator('#rosterSetupSection')).toBeVisible();
}

async function addPlayers(page, players) {
  for (const player of players) {
    await page.locator('input[name="firstName"]').fill(player.firstName);
    await page.locator('input[name="lastName"]').fill(player.lastName ?? '');
    await page.locator('input[name="jersey"]').fill(player.jersey);
    await page.locator('#playerForm button[type="submit"]').click();
  }
}

async function finishSetup(page) {
  await page.locator('#finishSetupBtn').click();
  await page.waitForTimeout(300);
}

async function setupGameWithQuickStart(page, game = {}) {
  await openManualSetup(page, game);
  await page.locator('#quickStartBtn').click();
  await finishSetup(page);
}

async function dismissSetupDialog(page) {
  const dialog = page.locator('#gameSetupDialog');

  if (await dialog.isVisible()) {
    const cancelButton = page.locator('#cancelSetupMethodBtn');
    if (await cancelButton.isVisible()) {
      await cancelButton.click();
    } else {
      await page.keyboard.press('Escape');
    }
    await expect(dialog).not.toBeVisible();
  }
}

module.exports = {
  addPlayers,
  dismissSetupDialog,
  finishSetup,
  gotoApp,
  openManualSetup,
  openSetupDialog,
  setupGameWithQuickStart
};
