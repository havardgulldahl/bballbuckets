# GitHub Copilot Instructions for bballbuckets

## Project Overview

**bballbuckets** (also branded as "HoopTrack Live") is an offline-first Progressive Web App (PWA) for capturing and analyzing live basketball game statistics for youth players (ages 15-18). The app focuses on low cognitive load during live play, development-focused analytics, and offline-first functionality.

## Technology Stack

- **Frontend**: Pure HTML5, vanilla JavaScript (ES6+), and CSS
- **Storage**: IndexedDB for offline event storage
- **Caching**: Service Worker for offline-first PWA functionality
- **No build process**: Direct HTML/JS/CSS editing - no bundler, transpiler, or package manager
- **No dependencies**: Zero npm packages or external libraries

## Repository Structure

```
/
├── index.html              # Main application file (1600+ lines of HTML/CSS/JS)
├── manifest.webmanifest    # PWA manifest configuration
├── sw.js                   # Service Worker for offline caching
├── README.md              # Comprehensive project documentation
├── LICENSE                # Project license
└── .gitignore            # Git ignore patterns (Python-focused template)
```

## Development Guidelines

### Code Organization

The application is a **single-page application** with all code in `index.html`:
- **HTML structure**: Semantic markup with data attributes for dynamic content
- **CSS**: Embedded in `<style>` tag with CSS custom properties for theming
- **JavaScript**: Embedded in `<script>` tag at the end of `<body>`

### Key Application Features

1. **Game Setup**: Create games with opponent name, date, periods configuration
2. **Roster Management**: Add/edit players with jersey numbers, positions, names
3. **Live Event Logging**: Track shots, assists, rebounds, turnovers, fouls, etc.
4. **Shot Chart**: Visual court representation with tap-to-place shot tracking
5. **Box Score**: Real-time player and team statistics
6. **Lineup Tracking**: Substitutions and on-court player management
7. **Data Export**: CSV and JSON export functionality
8. **Offline Support**: Full functionality without internet connection

### Code Style and Patterns

- **Naming**: camelCase for functions and variables (e.g., `showModal`, `currentPeriod`)
- **State Management**: Global `state` object with nested properties for game data
- **DOM Updates**: Direct DOM manipulation with `document.getElementById()`, `querySelector()`
- **Event Handling**: Event listeners attached via `addEventListener()`
- **Async Operations**: Promises and async/await for IndexedDB operations
- **UI Patterns**: Modal dialogs for user input, toast notifications for feedback
- **Styling**: Utility-first approach with inline styles and CSS variables for theming

### IndexedDB Schema

The app uses IndexedDB with three object stores:
- **games**: Game metadata and configuration
- **events**: All game events (shots, rebounds, fouls, etc.)
- **meta**: Application metadata and settings

### Service Worker Strategy

- **Cache-first** strategy for static assets (`index.html`, `manifest.webmanifest`)
- **Network-first** with cache fallback for dynamic requests
- Version-based cache invalidation (`hooptrack-cache-v1`)

## When Making Changes

### Adding New Features

1. **UI Changes**: Add HTML elements within the existing structure, use consistent class names
2. **State Management**: Update the global `state` object appropriately
3. **Event Logging**: Follow the event schema pattern with `timestamp`, `period`, `playerId`, `kind`, `subtype`, etc.
4. **Styling**: Use CSS variables from `:root` for colors and dimensions
5. **Offline Support**: Ensure new features work with IndexedDB and Service Worker

### Testing Approach

- **No automated tests**: The project has no test framework or test files
- **Manual testing**: Test changes by opening `index.html` in a browser
- **Testing checklist**:
  - Test in both light and dark mode (toggle via theme switcher)
  - Test offline functionality (use browser DevTools → Network → Offline)
  - Test on mobile viewport (use responsive design mode)
  - Test IndexedDB operations (check Application tab in DevTools)
  - Verify Service Worker registration and caching

### Development Workflow

1. **Edit directly**: Modify `index.html`, `sw.js`, or `manifest.webmanifest` as needed
2. **No build step**: Changes are immediately reflected on page refresh
3. **Service Worker**: Hard refresh (Ctrl+Shift+R) or unregister SW in DevTools when testing SW changes
4. **Testing**: Open `index.html` in a browser (can use `python -m http.server` or similar for local server)

### Common Patterns

**Adding a new event type:**
```javascript
// 1. Update state.events array
state.events.push({
  id: generateId(),
  timestamp: Date.now(),
  period: currentPeriod,
  playerId: selectedPlayerId,
  kind: 'newEventType',
  subtype: 'optional',
  result: 'success|fail',
  points: 0,
  tags: [],
  coordinates: null
});

// 2. Persist to IndexedDB
await putInStore('events', state.events);

// 3. Update UI
render();
```

**Adding a new modal:**
```javascript
// 1. Add HTML structure in body
<div id="myModal" class="modal" style="display:none;">
  <div class="modal-content">
    <!-- content here -->
  </div>
</div>

// 2. Add show/hide functions
function showMyModal() {
  document.getElementById('myModal').style.display = 'flex';
}

function hideMyModal() {
  document.getElementById('myModal').style.display = 'none';
}

// 3. Wire up event listeners
document.getElementById('openMyModalBtn').addEventListener('click', showMyModal);
```

## Important Considerations

### Performance
- Keep DOM updates efficient - batch changes when possible
- Use `requestIdleCallback` for non-critical updates (already used for sync operations)
- Virtualize long lists if displaying hundreds of events

### Accessibility
- Use semantic HTML elements
- Include ARIA labels for dynamic content
- Ensure keyboard navigation works for all interactive elements
- Maintain sufficient color contrast

### Mobile-First Design
- Touch-friendly targets (minimum 44x44px)
- Responsive layout using clamp() and viewport units
- Portrait-primary orientation
- One-handed operation where possible

### Data Privacy
- All data stored locally (IndexedDB)
- No external API calls or data transmission
- User controls their own data export

## Files NOT to Modify

- `.gitignore`: Contains Python-focused patterns (may not be needed but don't remove existing entries)
- `LICENSE`: Project license file
- `README.md`: Only update if adding major features or changing architecture

## Quality Standards

- **Code clarity**: Prioritize readable code over clever optimizations
- **Consistency**: Match existing code style and patterns
- **Comments**: Add comments for complex logic, but code should be self-documenting
- **Error handling**: Wrap IndexedDB operations in try-catch blocks
- **User feedback**: Provide toast notifications for user actions

## Troubleshooting Common Issues

- **Changes not appearing**: Hard refresh (Ctrl+Shift+R) to bypass Service Worker cache
- **IndexedDB errors**: Check browser console, may need to clear application data
- **Service Worker not updating**: Unregister SW in DevTools → Application → Service Workers
- **Styling issues**: Check CSS custom properties are properly defined in `:root`

## Resources

- [MDN Web Docs - Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [MDN Web Docs - IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [MDN Web Docs - Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
