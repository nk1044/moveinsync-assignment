import { openDB } from "idb";

const DB_NAME = "room-admin-db";
const STORE = "mutations";

export async function getDb() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
      }
    }
  });
}

export async function queueMutation(item) {
  const db = await getDb();
  await db.add(STORE, { ...item, ts: Date.now() });
}

export async function flushQueue(flushFn) {
  const db = await getDb();
  const tx = db.transaction(STORE, "readwrite");
  const store = tx.objectStore(STORE);
  let cursor = await store.openCursor();
  while (cursor) {
    const val = cursor.value;
    try {
      await flushFn(val);
      await cursor.delete();
      cursor = await cursor.continue();
    } catch (e) {
      // stop on first error (server down); keep remaining items
      console.error("Flush failed", e);
      break;
    }
  }
  await tx.done;
}
