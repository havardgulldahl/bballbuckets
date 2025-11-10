// db.js
const DB_NAME = 'scorekeeper';
const DB_VERSION = 1;

export function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const db = req.result;
      if (!db.objectStoreNames.contains('players')) {
        db.createObjectStore('players', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('games')) {
        db.createObjectStore('games', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('events')) {
        const store = db.createObjectStore('events', { keyPath: 'id' });
        store.createIndex('byGame', 'gameId', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(db, store, mode = 'readonly') {
  return db.transaction(store, mode).objectStore(store);
}

export async function put(store, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const r = tx(db, store, 'readwrite').put(value);
    r.onsuccess = () => resolve(value);
    r.onerror = () => reject(r.error);
  });
}

export async function get(store, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const r = tx(db, store, 'readonly').get(key);
    r.onsuccess = () => resolve(r.result ?? null);
    r.onerror = () => reject(r.error);
  });
}

export async function getAll(store, indexName, query) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const os = tx(db, store, 'readonly');
    let r;
    if (indexName) {
      r = os.index(indexName).getAll(query);
    } else {
      r = os.getAll();
    }
    r.onsuccess = () => resolve(r.result || []);
    r.onerror = () => reject(r.error);
  });
}

export async function del(store, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const r = tx(db, store, 'readwrite').delete(key);
    r.onsuccess = () => resolve();
    r.onerror = () => reject(r.error);
  });
}
