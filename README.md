# bballbuckets

Offline-first basketball stat tracking for live games, optimized for phones and tablets.

Current app version: 1.3.3

Live app: https://havardgulldahl.github.io/bballbuckets/

## What the app does today

The app is a single-page PWA for recording one team during a game and reviewing the result afterward. It stores live data locally in IndexedDB, works without a backend for normal stat tracking, and keeps a separate history database for completed or imported games.

Implemented functionality:

- Manual game setup with opponent, date, location, rule set, and roster entry.
- Quick Start roster creation for fast testing and scrimmage use.
- NIF import flow for official season, tournament, team, match, and roster lookup through the proxy-backed federation integration.
- Live event logging for shots, free throws, rebounds, assists, steals, blocks, turnovers, fouls, substitutions, and opponent scoring.
- Court-based shot selection with stored shot coordinates.
- On-court tracking with player chips sorted to keep active players first.
- Undo of the most recent event.
- Period progression and game finishing flow.
- Real-time score header and box score calculations.
- Hollinger Game Score and estimated GameScore36 values.
- Validation warnings and errors for duplicate jerseys, invalid lineup size, benched-player logging, and suspicious 3-point locations.
- History view for finished and imported games.
- History detail view with stat tables, notes, shot chart, and printable report output.
- Export of live and historical games as JSON, CSV, and TXT.
- Web Share support for JSON files or compact share links when supported by the browser.
- JSON import from file and from shared URL hash links.
- Theme support and mobile-specific two-step event logging flow.
- Service worker caching for installability and offline shell behavior.

## Repository layout

```text
.
|- docs/
|  |- index.html              Main app UI, styles, and most application logic
|  |- app.js                  Service worker registration and update prompt
|  |- db.js                   IndexedDB helper for the live game database
|  |- history-db.js           IndexedDB helper for finished game history
|  |- nif.js                  NIF federation API client used by the setup flow
|  |- sw.js                   Service worker and cache strategy
|  |- manifest.webmanifest    PWA manifest
|  `- VALIDATION.md           Notes about in-app validation behavior
|- src/
|  `- index.ts                Worker/proxy source used for NIF integration
|- tests/                     Playwright tests and example JSON fixtures
|- wrangler.jsonc             Worker configuration
`- package.json               Test scripts and repo version
```

## Running locally

The app itself has no frontend build step. Serve the docs directory as static files.

```bash
cd docs
python3 -m http.server 8080
```

Then open http://localhost:8080.

For Playwright tests:

```bash
npm install
npm test
```

Useful test commands:

- `npm test`
- `npm test -- tests/import-game-json.spec.js`
- `npm test -- tests/game-validation.spec.js`
- `npm test -- tests/roster-sorting.spec.js`

## Live game workflow

### 1. Start a game

You can begin from one of three setup paths:

- Manual setup: enter opponent and date, then build the roster by hand.
- Quick Start: add a sample five-player roster for testing.
- NIF import: fetch seasons, tournaments, teams, matches, and roster data from the Norwegian Basketball Federation integration.

Imported NIF games also store NIF-specific metadata such as match and tournament IDs inside the current game object.

### 2. Track live events

During a live game the app lets you:

- Log made or missed 2-point and 3-point shots.
- Log made or missed free throws.
- Log rebounds with offensive or defensive subtype.
- Log assists, steals, blocks, turnovers, and fouls.
- Toggle players in and out of the on-court lineup, which creates substitution events.
- Record opponent scoring separately.
- Tap the court before a shot to attach shot coordinates.
- Undo the last logged event.

On smaller screens the app switches to a two-step flow: choose an event first, then choose the player.

### 3. Review and finish

The live game view continuously recalculates:

- Team shooting splits.
- Player counting stats.
- Hollinger Game Score.
- Estimated GameScore36 based on tracked substitution timeline.
- Scoreboard totals.

When the game is finished, it can be saved to history and exported or shared.

## Validation behavior

The app surfaces non-blocking validation messages in the UI while you work.

Current validations:

- Duplicate jersey numbers on the tracked roster.
- More than five players on court.
- Fewer than five players on court once active play has started.
- Logging a home-team event to a player currently marked as benched.
- Logging a 3-point shot from a location that appears to be inside the arc.

These are warnings and errors only. They do not block data entry.

## History, sharing, and export

Finished and imported games are stored separately from the live game database. From history, the app supports:

- Viewing completed games.
- Reviewing team and player stats.
- Rendering a historical shot chart.
- Saving a free-text game note/description.
- Exporting as JSON.
- Sharing as a file or share link.
- Printing a report for paper or PDF output.
- Deleting a saved historical game.

The live game export dialog supports:

- JSON export.
- CSV export.
- TXT export.
- Web Share of the current game.
- Copying a compact share URL when the payload fits the configured size limit.

## Storage model

### Live game IndexedDB

The live app database stores:

- `players`
- `games`
- `events`
- `meta`

The current game, current period, and game-finished state are persisted in `meta`.

### History IndexedDB

The history database stores:

- `finishedGames`
- `finishedEvents`
- `finishedPlayers`

This separation allows the app to keep a current in-progress game while maintaining an archive of completed or imported games.

## JSON file format

Current export schema version: `3`

JSON export is the canonical interchange format for a game. Both live-game export and history export use the same top-level shape.

### Top-level fields

Required for import:

- `game` object
- `game.opponent` non-empty string
- `game.date` non-empty string
- `events` array

Written by current exports:

- `schemaVersion`: number
- `exportedAt`: ISO-8601 timestamp
- `exportedBy`: object with `userAgent`, `platform`, and `app`
- `description`: string
- `game`: object
- `finalScore`: object
- `periods`: number
- `stats`: object
- `events`: array

Backward-compatible import behavior:

- `players` at the top level is still accepted on import.
- `schemaVersion` is optional on import but must be numeric if present.
- Older coordinate objects without `space: "normalized"` are accepted and migrated.

### Canonical structure

```json
{
  "schemaVersion": 3,
  "exportedAt": "2026-05-08T12:34:56.000Z",
  "exportedBy": {
    "userAgent": "...",
    "platform": "Linux x86_64",
    "app": "bballbuckets"
  },
  "description": "Optional notes for the game",
  "game": {
    "opponent": "TSU17",
    "date": "2026-04-12",
    "location": "Tromsohallen",
    "ruleSet": "FIBA"
  },
  "finalScore": {
    "home": 61,
    "opponent": 55
  },
  "periods": 4,
  "stats": {
    "team": {
      "fgm": 25,
      "fga": 53,
      "fgPct": "47.2",
      "threepm": 4,
      "threepa": 9,
      "threePct": "44.4",
      "ftm": 7,
      "fta": 10,
      "ftPct": "70.0",
      "rebounds": 5,
      "oreb": 0,
      "dreb": 5,
      "assists": 6,
      "steals": 0,
      "blocks": 0,
      "turnovers": 0,
      "fouls": 0
    },
    "players": [
      {
        "id": "player-1",
        "name": "Alex A",
        "jersey": "12",
        "points": 6,
        "fgm": 3,
        "fga": 7,
        "threepm": 0,
        "threepa": 2,
        "ftm": 0,
        "fta": 0,
        "rebounds": 0,
        "oreb": 0,
        "dreb": 0,
        "assists": 2,
        "steals": 0,
        "blocks": 0,
        "turnovers": 0,
        "fouls": 0,
        "gameScore": 2.4,
        "estimatedMinutes": 18,
        "onCourtShare": 0.5,
        "gameScore36Estimated": 4.8
      }
    ],
    "meta": {
      "estimatedGameMinutes": 40,
      "trackedDurationMs": 1800000,
      "validLineupRatio": 0.92,
      "openingLineupCount": 5,
      "lineupConfidence": "medium",
      "lineupConfidenceReasons": [
        "only 92% of tracked time had exactly 5 players on court"
      ],
      "hasSubstitutionTimeline": true
    }
  },
  "events": [
    {
      "id": "event-1",
      "timestamp": 1775980943614,
      "period": 1,
      "playerId": "player-1",
      "playerName": "Alex A",
      "playerJersey": "12",
      "kind": "shot",
      "points": 2,
      "result": "made",
      "subtype": null,
      "coordinates": {
        "x": 0.487,
        "y": 0.873,
        "space": "normalized"
      },
      "team": "home"
    }
  ]
}
```

### `game`

The `game` object currently uses these fields:

- `opponent`: required string.
- `date`: required string, typically `YYYY-MM-DD`.
- `location`: optional string.
- `ruleSet`: optional string, defaults to `FIBA` during import when missing.

Additional metadata may also appear for NIF-imported live games, for example:

- `nifMatchId`
- `nifTournamentId`
- `isHomeTeam`

Import ignores extra fields it does not need.

### `finalScore`

- `home`: numeric home-team score.
- `opponent`: numeric opponent score.

If `finalScore` is missing during import, both values fall back to `0`.

### `stats`

`stats` is included in exports for convenience, but import can recompute compatible stats from players and events when needed.

`stats.players` is the preferred roster source during import. If it is not available, the importer falls back to a top-level `players` array.

Player stat objects may contain computed fields such as:

- `gameScore`
- `estimatedMinutes`
- `onCourtShare`
- `gameScore36Estimated`

These derived values are safe to include. If older files omit them, the app normalizes the stats.

### `events`

Each event should be an object. Current event kinds written by the app include:

- `shot`
- `ft`
- `rebound`
- `assist`
- `steal`
- `block`
- `turnover`
- `foul`
- `substitution`

Common event fields:

- `id`: string.
- `timestamp`: epoch milliseconds.
- `period`: game period number.
- `playerId`: string or `null` for opponent events.
- `playerName`: string.
- `playerJersey`: string.
- `kind`: event type.
- `points`: numeric value, mainly for shots.
- `result`: `made`, `missed`, or `null` depending on event kind.
- `subtype`: optional event subtype such as `offensive`, `defensive`, `in`, or `out`.
- `coordinates`: optional object.
- `team`: `home` or `opponent`.

History export removes `gameId` from events. Imported events are stored internally with a new history game ID.

### Coordinates

Schema version 3 exports always write coordinates in canonical normalized form:

```json
{
  "x": 0.487,
  "y": 0.873,
  "space": "normalized"
}
```

Rules:

- `x` and `y` are clamped to the range `0..1`.
- Values are rounded to three decimals.
- `space` is always `normalized` on export.

Import is backward compatible with older files that stored raw SVG coordinates such as:

```json
{
  "x": 243.67,
  "y": 451.46
}
```

Older coordinate payloads are converted to normalized coordinates when the file is imported or when legacy live data is hydrated.

## Offline and update behavior

The app shell is cached by the service worker and the app prompts the user when a new version is available. When testing service-worker changes, use a hard refresh or unregister the existing service worker if you appear to be running stale assets.

## Notes for contributors

- The shipped app has no bundler for the frontend. Edit the files in `docs/` directly.
- The NIF integration depends on the worker/proxy configuration in `src/` and `wrangler.jsonc`.
- Playwright covers viewport behavior, validation, roster ordering, and JSON import paths.
- If you change the JSON export structure, bump `JSON_SCHEMA_VERSION` in the app and update this README.


