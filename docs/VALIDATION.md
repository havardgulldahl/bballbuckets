# Game Logic Validation

## Overview

The basketball stats app now includes comprehensive game logic validation that provides real-time warnings and errors for common game scenarios. The validation system helps coaches and stat keepers avoid data entry mistakes during live games.

## Validation Features

### 1. Duplicate Jersey Numbers (ERROR)

**What it checks:** Detects when two or more players have the same jersey number.

**When it triggers:** Whenever players are added, removed, or modified.

**Severity:** ERROR (red banner)

**Example message:** "Duplicate jersey number: 5"

**Why it matters:** Each player should have a unique jersey number to avoid confusion during stat tracking.

### 2. Too Many Players on Court (ERROR)

**What it checks:** Ensures no more than 5 players are marked as "on court" at any time.

**When it triggers:** When toggling players on/off the court.

**Severity:** ERROR (red banner)

**Example message:** "6 players on court (maximum is 5)"

**Why it matters:** Basketball rules allow only 5 players per team on the court at once.

### 3. Too Few Players on Court (WARNING)

**What it checks:** Warns when fewer than 5 players are marked as "on court" during active gameplay.

**When it triggers:** After the first event is logged and when toggling players.

**Severity:** WARNING (yellow banner)

**Example message:** "Only 3 players on court (normal is 5)"

**Why it matters:** While technically allowed, playing with fewer than 5 players is unusual and may indicate a data entry error.

**Note:** This warning only appears after at least one game event has been logged, allowing initial setup without warnings.

### 4. Shot Location Validation (WARNING)

**What it checks:** Detects when a 3-point shot is logged inside the 3-point arc.

**When it triggers:** When logging a 3-point shot with court coordinates.

**Severity:** WARNING (yellow banner)

**Example message:** "3-pointer recorded inside the 3-point line (shot at 15' from basket)"

**Why it matters:** A shot inside the 3-point line should be recorded as a 2-pointer, not a 3-pointer.

**Technical details:**
- Uses NFHS court dimensions: 3-point arc radius = 19'9" (237.5 units)
- Calculates distance from shot coordinates to basket center
- Includes 1-foot tolerance to account for shot selection on the line
- Works for both top and bottom baskets on the court visualization

## User Interface

### Validation Banner

The validation banner appears at the top of the page, directly below the header, when there are active warnings or errors.

**Error Banner (Red):**
- Background: Light red (#fee)
- Border: Red
- Icon: ❌
- Appears when any ERROR-level validation fails

**Warning Banner (Yellow):**
- Background: Light yellow (#fef3c7)
- Border: Orange
- Icon: ⚠️
- Appears when only WARNING-level validations are triggered

The banner can display multiple issues simultaneously, with each issue shown on its own line.

## Technical Implementation

### Validation State

Validation state is tracked in the global `state` object:

```javascript
state.validationWarnings = [];  // Array of warning objects
state.validationErrors = [];    // Array of error objects
```

### Validation Functions

- `validateGameState()` - Main validation function, called whenever game state changes
- `validateDuplicateJerseys()` - Checks for duplicate jersey numbers
- `validateLineupSize()` - Checks player count on court
- `validateShotLocation(event)` - Validates shot position for 3-pointers
- `updateValidationBanner()` - Updates the UI banner with current issues

### When Validation Runs

Validation is automatically triggered:
- When adding a player
- When removing a player
- When toggling a player on/off court
- When logging a shot event with coordinates
- When updating the UI (calls `validateGameState()`)

### Validation Object Structure

Each validation issue is an object with:

```javascript
{
  type: 'duplicate_jersey',      // Unique identifier
  message: 'Error description',  // Human-readable message
  severity: 'error',             // 'error' or 'warning'
  eventId: '...'                 // Optional: related event ID
}
```

## Testing

Comprehensive Playwright tests are included in `tests/game-validation.spec.js`:

- Duplicate jersey detection
- Unique jersey handling
- Too many players on court
- Too few players on court
- 3-pointer inside the arc detection
- 3-pointer outside the arc (no warning)
- Resolution of validation issues

Run tests with:
```bash
npm test -- tests/game-validation.spec.js
```

## Future Enhancements

Potential additions to the validation system:

1. **Shot Chart Validation**: Warn about unusual shot patterns (e.g., all shots from same location)
2. **Time-Based Validation**: Detect impossible event sequences (e.g., same player with consecutive events seconds apart)
3. **Foul Limit Warnings**: Alert when a player approaches 5 fouls
4. **Substitution Logic**: Validate that substitutions maintain at least 5 players on court
5. **Score Verification**: Compare calculated score against manually entered opponent score
6. **Period Transitions**: Warn if unusual events occur at period boundaries
7. **Statistical Anomalies**: Flag statistically unlikely patterns (e.g., player with 20 assists in one quarter)

## Design Principles

The validation system follows these principles:

1. **Non-Blocking**: Warnings and errors are informational; they don't prevent stat entry
2. **Real-Time**: Validation runs immediately when relevant state changes
3. **Clear Communication**: Messages are concise and actionable
4. **Visual Hierarchy**: Errors are more prominent (red) than warnings (yellow)
5. **Performance**: Validation is lightweight and doesn't impact app responsiveness
6. **Contextual**: Warnings consider game state (e.g., no "few players" warning before first event)

## Accessibility

The validation banner includes:
- High-contrast colors for visibility
- Clear emoji icons (❌ for errors, ⚠️ for warnings)
- Semantic HTML for screen readers
- Descriptive text that explains the issue clearly
