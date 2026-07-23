import type { CollectionItem, Settings } from "@/types";

const DB_NAME = "minha-colecao-moedas";
const DB_VERSION = 2;
const COLLECTION_STORE = "collection";
const SETTINGS_STORE = "settings";
const FALLBACK_KEY = "minha-colecao-fallback-v1";
const fallbackSettings: Settings = { theme: "system", view: "list" };

type FallbackData = { items: CollectionItem[]; settings: Settings };

let memory: FallbackData = { items: [], settings: fallbackSettings };
let storageLoaded = false;
let indexedDbAvailable = true;

function isSettings(value: unknown): value is Settings {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Settings>;
  return ["system", "light", "dark"].includes(candidate.theme ?? "")
    && ["list", "grid"].includes(candidate.view ?? "");
}

function migrateItem(value: unknown): CollectionItem | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<CollectionItem>;
  if (typeof item.coinId !== "string" || !item.coinId) return null;
  return {
    coinId: item.coinId,
    owned: item.owned === true,
    quantity: Number.isFinite(item.quantity) && Number(item.quantity) >= 0
      ? Number(item.quantity)
      : item.owned === true ? 1 : 0,
    condition: ["", "FC", "SOB", "MBC", "BC", "REGULAR"].includes(item.condition ?? "")
      ? item.condition
      : "",
    acquisitionDate: typeof item.acquisitionDate === "string" ? item.acquisitionDate : undefined,
    acquisitionPrice: typeof item.acquisitionPrice === "number" && Number.isFinite(item.acquisitionPrice)
      ? item.acquisitionPrice
      : null,
    personalNotes: typeof item.personalNotes === "string" ? item.personalNotes : undefined,
    updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : new Date(0).toISOString(),
  };
}

function loadFallback() {
  if (storageLoaded || typeof window === "undefined") return;
  storageLoaded = true;
  try {
    const raw = window.localStorage.getItem(FALLBACK_KEY);
    if (!raw) return;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return;
    const data = parsed as Partial<FallbackData>;
    memory = {
      items: Array.isArray(data.items)
        ? data.items.map(migrateItem).filter((item): item is CollectionItem => item !== null)
        : [],
      settings: isSettings(data.settings) ? data.settings : fallbackSettings,
    };
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.warn("[storage] Fallback inválido; usando padrões.", error);
    memory = { items: [], settings: fallbackSettings };
  }
}

function persistFallback() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FALLBACK_KEY, JSON.stringify(memory));
  } catch (error) {
    if (process.env.NODE_ENV === "development") console.warn("[storage] Não foi possível persistir o fallback.", error);
  }
}

function disableIndexedDb(error: unknown) {
  indexedDbAvailable = false;
  if (process.env.NODE_ENV === "development") console.warn("[indexedDB] Indisponível; usando armazenamento seguro alternativo.", error);
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    try {
      if (typeof window === "undefined" || !("indexedDB" in window)) {
        reject(new Error("IndexedDB indisponível"));
        return;
      }
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(COLLECTION_STORE)) {
          db.createObjectStore(COLLECTION_STORE, { keyPath: "coinId" });
        }
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) db.createObjectStore(SETTINGS_STORE);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("Falha ao abrir IndexedDB"));
      request.onblocked = () => reject(new Error("Atualização do IndexedDB bloqueada"));
    } catch (error) {
      reject(error);
    }
  });
}

async function transaction<T>(
  storeName: string,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    let result: T;
    try {
      const tx = db.transaction(storeName, mode);
      const request = operation(tx.objectStore(storeName));
      request.onsuccess = () => { result = request.result; };
      request.onerror = () => reject(request.error ?? new Error("Falha na operação IndexedDB"));
      tx.oncomplete = () => {
        db.close();
        resolve(result);
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error ?? new Error("Falha na transação IndexedDB"));
      };
      tx.onabort = () => {
        db.close();
        reject(tx.error ?? new Error("Transação IndexedDB cancelada"));
      };
    } catch (error) {
      db.close();
      reject(error);
    }
  });
}

async function tryIndexedDb<T>(operation: () => Promise<T>, fallback: () => T | Promise<T>): Promise<T> {
  loadFallback();
  if (!indexedDbAvailable) return fallback();
  try {
    return await operation();
  } catch (error) {
    disableIndexedDb(error);
    return fallback();
  }
}

export const repository = {
  async all() {
    return tryIndexedDb(
      async () => {
        const rows = await transaction<unknown[]>(COLLECTION_STORE, "readonly", (store) => store.getAll());
        const items = rows.map(migrateItem).filter((item): item is CollectionItem => item !== null);
        memory.items = items;
        persistFallback();
        return items;
      },
      () => memory.items,
    );
  },
  async save(item: CollectionItem) {
    const migrated = migrateItem(item);
    if (!migrated) return item;
    await tryIndexedDb(
      () => transaction<IDBValidKey>(COLLECTION_STORE, "readwrite", (store) => store.put(migrated)),
      () => undefined,
    );
    memory.items = [...memory.items.filter((row) => row.coinId !== migrated.coinId), migrated];
    persistFallback();
    return migrated;
  },
  async remove(id: string) {
    await tryIndexedDb(
      () => transaction<undefined>(COLLECTION_STORE, "readwrite", (store) => store.delete(id)),
      () => undefined,
    );
    memory.items = memory.items.filter((item) => item.coinId !== id);
    persistFallback();
  },
  async clear() {
    await tryIndexedDb(
      () => transaction<undefined>(COLLECTION_STORE, "readwrite", (store) => store.clear()),
      () => undefined,
    );
    memory.items = [];
    persistFallback();
  },
  async settings() {
    return tryIndexedDb(
      async () => {
        const value = await transaction<unknown>(SETTINGS_STORE, "readonly", (store) => store.get("app"));
        const settings = isSettings(value) ? value : fallbackSettings;
        memory.settings = settings;
        persistFallback();
        return settings;
      },
      () => memory.settings,
    );
  },
  async saveSettings(value: Settings) {
    const settings = isSettings(value) ? value : fallbackSettings;
    await tryIndexedDb(
      () => transaction<IDBValidKey>(SETTINGS_STORE, "readwrite", (store) => store.put(settings, "app")),
      () => undefined,
    );
    memory.settings = settings;
    persistFallback();
    return settings;
  },
};
