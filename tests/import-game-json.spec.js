// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Import Game JSON', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Dismiss the game setup dialog that opens automatically when no game exists
    const dialog = page.locator('#gameSetupDialog');
    if (await dialog.isVisible()) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
    }
  });

  test('import button and file input are present in history view', async ({ page }) => {
    // Navigate to history view
    await page.click('#historyBtn');
    await page.waitForSelector('#historyView', { state: 'visible' });

    // Check import button exists
    const importBtn = page.locator('#importGameJSONBtn');
    await expect(importBtn).toBeVisible();

    // Check hidden file input exists
    const fileInput = page.locator('#importGameJSONInput');
    await expect(fileInput).toBeAttached();
  });

  test('importing example-game-data.json succeeds and shows the game in history', async ({ page }) => {
    // Navigate to history view
    await page.click('#historyBtn');
    await page.waitForSelector('#historyView', { state: 'visible' });

    // Trigger the file input via the import button
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.click('#importGameJSONBtn'),
    ]);

    const exampleFilePath = path.resolve(__dirname, 'example-game-data.json');
    await fileChooser.setFiles(exampleFilePath);

    // Wait for success toast
    const toast = page.locator('.toast');
    await expect(toast).toContainText('imported', { timeout: 5000, ignoreCase: true });

    // After successful import, history view should still be visible
    await expect(page.locator('#historyView')).toBeVisible();

    // The imported game should appear in the history list
    const historyList = page.locator('#historyList');
    await expect(historyList).toContainText('TSU17');
  });

  test('imported game detail view shows correct stats', async ({ page }) => {
    // Navigate to history view and import the file
    await page.click('#historyBtn');
    await page.waitForSelector('#historyView', { state: 'visible' });

    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.click('#importGameJSONBtn'),
    ]);

    const exampleFilePath = path.resolve(__dirname, 'example-game-data.json');
    await fileChooser.setFiles(exampleFilePath);

    // Wait for import to complete
    await page.waitForTimeout(1000);

    // Click on the imported game to view details
    const gameCard = page.locator('#historyList').locator('text=TSU17').first();
    await gameCard.click();

    // Wait for detail view
    await page.waitForSelector('#historyDetailView', { state: 'visible', timeout: 5000 });

    // Verify game header shows correct opponent
    const header = page.locator('#historyGameHeader');
    await expect(header).toContainText('TSU17');

    // Verify final score is displayed (61-55 from example data)
    await expect(header).toContainText('61');
    await expect(header).toContainText('55');
  });

  test('importing invalid JSON shows an error toast', async ({ page }) => {
    await page.click('#historyBtn');
    await page.waitForSelector('#historyView', { state: 'visible' });

    // Create an in-memory invalid JSON file and upload it
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.click('#importGameJSONBtn'),
    ]);

    // Use a Buffer to simulate a bad JSON file
    await fileChooser.setFiles({
      name: 'bad.json',
      mimeType: 'application/json',
      buffer: Buffer.from('this is not valid json'),
    });

    const toast = page.locator('.toast');
    await expect(toast).toContainText('Invalid JSON', { timeout: 5000, ignoreCase: true });
  });

  test('importing JSON missing required game.opponent field shows error', async ({ page }) => {
    await page.click('#historyBtn');
    await page.waitForSelector('#historyView', { state: 'visible' });

    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.click('#importGameJSONBtn'),
    ]);

    const missingOpponent = JSON.stringify({
      game: { date: '2024-01-01' },
      events: [],
    });

    await fileChooser.setFiles({
      name: 'missing-opponent.json',
      mimeType: 'application/json',
      buffer: Buffer.from(missingOpponent),
    });

    const toast = page.locator('.toast');
    await expect(toast).toContainText('Import failed', { timeout: 5000, ignoreCase: true });
  });
});
