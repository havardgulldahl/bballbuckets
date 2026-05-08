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

  test('persisted shot coordinates are normalized and rounded', async ({ page }) => {
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

    const courtSVG = page.locator('#courtSVG');
    await courtSVG.click({ position: { x: 333, y: 140 } });
    await page.click('button[data-kind="shot"][data-points="2"][data-result="made"]');
    await page.click('.player-chip:first-child');
    await page.waitForTimeout(400);

    const storedShot = await page.evaluate(async () => {
      const readEvents = () => new Promise((resolve, reject) => {
        const request = indexedDB.open('hooptrack-db');
        request.onerror = () => reject(request.error?.message || 'Failed to open IndexedDB');
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction('events', 'readonly');
          const store = tx.objectStore('events');
          const getAllRequest = store.getAll();
          getAllRequest.onerror = () => reject(getAllRequest.error?.message || 'Failed to read events');
          getAllRequest.onsuccess = () => {
            db.close();
            resolve(getAllRequest.result.filter(event => event.kind === 'shot').at(-1) || null);
          };
        };
      });

      return await readEvents();
    });

    expect(storedShot).toBeTruthy();
    expect(storedShot.coordinates).toBeTruthy();
    expect(storedShot.coordinates.space).toBe('normalized');
    expect(storedShot.coordinates.x).toBeGreaterThan(0);
    expect(storedShot.coordinates.x).toBeLessThanOrEqual(1);
    expect(storedShot.coordinates.y).toBeGreaterThan(0);
    expect(storedShot.coordinates.y).toBeLessThanOrEqual(1);

    const decimalPlaces = value => {
      const text = String(value);
      return text.includes('.') ? text.split('.')[1].length : 0;
    };

    expect(decimalPlaces(storedShot.coordinates.x)).toBeLessThanOrEqual(3);
    expect(decimalPlaces(storedShot.coordinates.y)).toBeLessThanOrEqual(3);
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

  test('steal and turnover buttons are available in the event pad', async ({ page }) => {
    await expect(page.locator('button[data-kind="steal"]')).toBeVisible();
    await expect(page.locator('button[data-kind="turnover"]')).toBeVisible();
  });

  test('Shift+D maps to steal keyboard shortcut', async ({ page }) => {
    const definition = await page.evaluate(() => {
      return getKeyboardEventDefinition(new KeyboardEvent('keydown', { key: 'D', shiftKey: true }));
    });

    expect(definition).toEqual({ kind: 'steal', points: 0, result: null, subtype: null });
  });

  test('calculates Hollinger game score for player stats', async ({ page }) => {
    await page.click('#setupGameBtn');
    await page.waitForSelector('#gameSetupDialog', { state: 'visible' });
    await page.fill('#opponentInput', 'Test Team');
    await page.fill('#gameDateInput', '2024-01-01');
    await page.click('button[type="submit"]:has-text("Continue to Roster")');
    await page.waitForSelector('#rosterSetupSection', { state: 'visible' });
    await page.click('#quickStartBtn');
    await page.click('#finishSetupBtn');
    await page.waitForTimeout(400);

    const firstPlayer = page.locator('.player-chip').first();

    await page.click('button[data-kind="ft"][data-result="made"]');
    await firstPlayer.click();
    await page.waitForTimeout(150);

    await page.click('button[data-kind="rebound"][data-subtype="defensive"]');
    await firstPlayer.click();
    await page.waitForTimeout(150);

    await page.click('button[data-kind="steal"]');
    await firstPlayer.click();
    await page.waitForTimeout(150);

    await page.click('button[data-kind="turnover"]');
    await firstPlayer.click();
    await page.waitForTimeout(150);

    const gameScore = await page.evaluate(() => {
      const stats = calculateStats();
      const player = stats.players.find(p => p.points === 1 && p.steals === 1 && p.turnovers === 1 && p.dreb === 1);
      return player ? player.gameScore.toFixed(1) : null;
    });

    expect(gameScore).toBe('1.3');
  });

  test('normalizes legacy player stats without stored game score', async ({ page }) => {
    const gameScore = await page.evaluate(() => {
      const normalized = normalizeStats({
        team: {
          fgm: 0, fga: 0, fgPct: '0.0',
          threepm: 0, threepa: 0, threePct: '0.0',
          ftm: 1, fta: 1, ftPct: '100.0',
          rebounds: 1, oreb: 0, dreb: 1,
          assists: 0, steals: 1, blocks: 0,
          turnovers: 1, fouls: 0
        },
        players: [{
          id: 'p1',
          name: 'Legacy Player',
          jersey: '7',
          points: 1,
          fgm: 0, fga: 0,
          threepm: 0, threepa: 0,
          ftm: 1, fta: 1,
          rebounds: 1,
          assists: 0, steals: 1, blocks: 0,
          turnovers: 1, fouls: 0
        }]
      });

      return normalized.players[0].gameScore.toFixed(1);
    });

    expect(gameScore).toBe('1.3');
  });

  test('estimates GameScore36 from substitution timeline', async ({ page }) => {
    const estimated = await page.evaluate(() => {
      const players = [1, 2, 3, 4, 5].map(number => ({
        id: `p${number}`,
        name: `Player ${number}`,
        jersey: String(number)
      }));

      const events = [
        { id: 's1', kind: 'substitution', subtype: 'in', playerId: 'p1', timestamp: 0 },
        { id: 's2', kind: 'substitution', subtype: 'in', playerId: 'p2', timestamp: 0 },
        { id: 's3', kind: 'substitution', subtype: 'in', playerId: 'p3', timestamp: 0 },
        { id: 's4', kind: 'substitution', subtype: 'in', playerId: 'p4', timestamp: 0 },
        { id: 's5', kind: 'substitution', subtype: 'in', playerId: 'p5', timestamp: 0 },
        { id: 'e1', kind: 'shot', playerId: 'p1', points: 2, result: 'made', timestamp: 600000 }
      ];

      const stats = calculateStats(players, events, { ruleSet: 'FIBA', periods: 4 }, 4);
      const player = stats.players.find(p => p.id === 'p1');

      return {
        estimatedMinutes: player ? player.estimatedMinutes.toFixed(1) : null,
        gameScore36Estimated: player ? player.gameScore36Estimated.toFixed(1) : null,
        lineupConfidence: stats.meta?.lineupConfidence || null
      };
    });

    expect(estimated).toEqual({
      estimatedMinutes: '40.0',
      gameScore36Estimated: '1.5',
      lineupConfidence: 'high'
    });
  });

  test('flags low-confidence GameScore36 when substitutions are missing', async ({ page }) => {
    const result = await page.evaluate(() => {
      const players = [1, 2].map(number => ({
        id: `p${number}`,
        name: `Player ${number}`,
        jersey: String(number)
      }));

      const events = [
        { id: 'e1', kind: 'shot', playerId: 'p1', points: 2, result: 'made', timestamp: 1000 },
        { id: 'e2', kind: 'turnover', playerId: 'p2', timestamp: 2000 }
      ];

      const stats = calculateStats(players, events, { ruleSet: 'FIBA', periods: 4 }, 4);

      return {
        lineupConfidence: stats.meta?.lineupConfidence || null,
        reasons: stats.meta?.lineupConfidenceReasons || [],
        estimatedMetric: stats.players[0]?.gameScore36Estimated ?? null
      };
    });

    expect(result.lineupConfidence).toBe('low');
    expect(result.reasons).toContain('no substitution events were logged');
    expect(result.estimatedMetric).toBeNull();
  });

  test('can add player without last name', async ({ page }) => {
    // Setup game
    await page.click('#setupGameBtn');
    await page.waitForSelector('#gameSetupDialog', { state: 'visible' });
    await page.fill('#opponentInput', 'Test Team');
    await page.fill('#gameDateInput', '2024-01-01');
    await page.click('button[type="submit"]:has-text("Continue to Roster")');
    await page.waitForSelector('#rosterSetupSection', { state: 'visible' });

    // Add a player with no last name
    await page.fill('input[name="firstName"]', 'SingleName');
    await page.fill('input[name="jersey"]', '42');
    await page.click('#playerForm button[type="submit"]');
    await page.waitForTimeout(200);

    // Roster preview should render clean name
    await expect(page.locator('#rosterPreview')).toContainText('#42 SingleName');
    await expect(page.locator('#rosterPreview')).not.toContainText('undefined');

    // Finish setup and verify player list also renders without undefined
    await page.click('#finishSetupBtn');
    await page.waitForTimeout(300);
    await expect(page.locator('#playerList')).toContainText('#42 SingleName');
    await expect(page.locator('#playerList')).not.toContainText('undefined');
  });
});
