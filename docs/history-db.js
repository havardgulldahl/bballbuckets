// history-db.js - Database module for finished games history
const HISTORY_DB_NAME = 'bballbuckets-history';
const HISTORY_DB_VERSION = 1;

export function openHistoryDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(HISTORY_DB_NAME, HISTORY_DB_VERSION);
    req.onupgradeneeded = e => {
      const db = req.result;
      if (!db.objectStoreNames.contains('finishedGames')) {
        const gameStore = db.createObjectStore('finishedGames', { keyPath: 'id' });
        gameStore.createIndex('byDate', 'date', { unique: false });
        gameStore.createIndex('byTimestamp', 'timestamp', { unique: false });
      }
      if (!db.objectStoreNames.contains('finishedEvents')) {
        const eventStore = db.createObjectStore('finishedEvents', { keyPath: 'id' });
        eventStore.createIndex('byGame', 'gameId', { unique: false });
      }
      if (!db.objectStoreNames.contains('finishedPlayers')) {
        const playerStore = db.createObjectStore('finishedPlayers', { keyPath: 'id' });
        playerStore.createIndex('byGame', 'gameId', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function historyTx(db, store, mode = 'readonly') {
  return db.transaction(store, mode).objectStore(store);
}

export async function saveGameToHistory(gameData) {
  const db = await openHistoryDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['finishedGames', 'finishedEvents', 'finishedPlayers'], 'readwrite');
    
    transaction.oncomplete = () => resolve(gameData.id);
    transaction.onerror = () => reject(transaction.error);

    // Save game metadata
    const gameStore = transaction.objectStore('finishedGames');
    gameStore.put(gameData.game);

    // Save events
    const eventStore = transaction.objectStore('finishedEvents');
    gameData.events.forEach(event => {
      const eventCopy = { ...event, gameId: gameData.id };
      eventStore.put(eventCopy);
    });

    // Save players
    const playerStore = transaction.objectStore('finishedPlayers');
    gameData.players.forEach(player => {
      const playerCopy = { ...player, gameId: gameData.id, originalId: player.id, id: `${gameData.id}-${player.id}` };
      playerStore.put(playerCopy);
    });
  });
}

export async function getAllFinishedGames() {
  const db = await openHistoryDB();
  return new Promise((resolve, reject) => {
    const store = historyTx(db, 'finishedGames', 'readonly');
    const index = store.index('byTimestamp');
    const r = index.getAll();
    r.onsuccess = () => {
      const games = r.result || [];
      // Sort by timestamp descending (newest first)
      games.sort((a, b) => b.timestamp - a.timestamp);
      resolve(games);
    };
    r.onerror = () => reject(r.error);
  });
}

export async function getFinishedGame(gameId) {
  const db = await openHistoryDB();
  return new Promise((resolve, reject) => {
    const r = historyTx(db, 'finishedGames', 'readonly').get(gameId);
    r.onsuccess = () => resolve(r.result ?? null);
    r.onerror = () => reject(r.error);
  });
}

export async function getFinishedGameEvents(gameId) {
  const db = await openHistoryDB();
  return new Promise((resolve, reject) => {
    const store = historyTx(db, 'finishedEvents', 'readonly');
    const index = store.index('byGame');
    const r = index.getAll(gameId);
    r.onsuccess = () => resolve(r.result || []);
    r.onerror = () => reject(r.error);
  });
}

export async function getFinishedGamePlayers(gameId) {
  const db = await openHistoryDB();
  return new Promise((resolve, reject) => {
    const store = historyTx(db, 'finishedPlayers', 'readonly');
    const index = store.index('byGame');
    const r = index.getAll(gameId);
    r.onsuccess = () => resolve(r.result || []);
    r.onerror = () => reject(r.error);
  });
}

export async function updateFinishedGame(gameId, updates) {
  const db = await openHistoryDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['finishedGames'], 'readwrite');
    const store = transaction.objectStore('finishedGames');
    const getReq = store.get(gameId);
    getReq.onsuccess = () => {
      const existing = getReq.result;
      if (!existing) {
        reject(new Error('Game not found'));
        return;
      }
      const updated = { ...existing, ...updates };
      const putReq = store.put(updated);
      putReq.onsuccess = () => resolve(updated);
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

export async function deleteFinishedGame(gameId) {
  const db = await openHistoryDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['finishedGames', 'finishedEvents', 'finishedPlayers'], 'readwrite');
    
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);

    // Delete game
    transaction.objectStore('finishedGames').delete(gameId);

    // Delete all events for this game
    const eventStore = transaction.objectStore('finishedEvents');
    const eventIndex = eventStore.index('byGame');
    const eventRequest = eventIndex.openCursor(IDBKeyRange.only(gameId));
    eventRequest.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    // Delete all players for this game
    const playerStore = transaction.objectStore('finishedPlayers');
    const playerIndex = playerStore.index('byGame');
    const playerRequest = playerIndex.openCursor(IDBKeyRange.only(gameId));
    playerRequest.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  });
}
