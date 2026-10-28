import { NexusOrchestratorLogRecord, SemanticRouteId } from '../domain/types';

export const TB_NEXUS_ORCHESTRATOR_LOGS = 'tb_nexus_orchestrator_logs';
const IDB_DATABASE_NAME = 'nexus_orchestrator_db';
const IDB_VERSION = 1;

const memoryFallbackStore = new Map<string, NexusOrchestratorLogRecord>();

function hasIndexedDB(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

function hasLocalStorage(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!hasIndexedDB()) {
      reject(new Error('IndexedDB não disponível neste ambiente.'));
      return;
    }

    const request = window.indexedDB.open(IDB_DATABASE_NAME, IDB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(TB_NEXUS_ORCHESTRATOR_LOGS)) {
        const store = db.createObjectStore(TB_NEXUS_ORCHESTRATOR_LOGS, {
          keyPath: 'log_id',
        });
        store.createIndex('created_at', 'created_at', { unique: false });
        store.createIndex('session_id', 'session_id', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error || new Error('Erro ao abrir IndexedDB.'));
  });
}

function readLocalStorageMirror(): NexusOrchestratorLogRecord[] {
  if (!hasLocalStorage()) {
    return Array.from(memoryFallbackStore.values()).sort((a, b) =>
      b.created_at.localeCompare(a.created_at)
    );
  }
  try {
    const raw = window.localStorage.getItem(TB_NEXUS_ORCHESTRATOR_LOGS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('[Storage] Falha ao ler espelho LocalStorage:', err);
    return [];
  }
}

function writeLocalStorageMirror(records: NexusOrchestratorLogRecord[]): void {
  memoryFallbackStore.clear();
  for (const rec of records) {
    memoryFallbackStore.set(rec.log_id, rec);
  }

  if (!hasLocalStorage()) return;
  try {
    window.localStorage.setItem(
      TB_NEXUS_ORCHESTRATOR_LOGS,
      JSON.stringify(records.slice(0, 150))
    );
  } catch (err) {
    console.warn('[Storage] Falha ao gravar espelho LocalStorage:', err);
  }
}

/**
 * Insere um registro de orquestração na tabela `tb_nexus_orchestrator_logs` (IndexedDB + LocalStorage)
 */
export async function insertOrchestratorLog(
  record: NexusOrchestratorLogRecord
): Promise<void> {
  const current = readLocalStorageMirror().filter(
    (r) => r.log_id !== record.log_id
  );
  const updated = [record, ...current].sort((a, b) =>
    b.created_at.localeCompare(a.created_at)
  );
  writeLocalStorageMirror(updated);

  if (hasIndexedDB()) {
    try {
      const db = await openDatabase();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(TB_NEXUS_ORCHESTRATOR_LOGS, 'readwrite');
        const store = tx.objectStore(TB_NEXUS_ORCHESTRATOR_LOGS);
        store.put(record);
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      });
    } catch (err) {
      console.warn(
        '[Storage] Fallback LocalStorage utilizado para tb_nexus_orchestrator_logs:',
        err
      );
    }
  }
}

/**
 * Lista todos os logs persistidos na tabela `tb_nexus_orchestrator_logs`
 */
export async function listOrchestratorLogs(
  routeFilter?: SemanticRouteId | 'ALL'
): Promise<NexusOrchestratorLogRecord[]> {
  let records: NexusOrchestratorLogRecord[] = [];

  if (hasIndexedDB()) {
    try {
      const db = await openDatabase();
      records = await new Promise<NexusOrchestratorLogRecord[]>(
        (resolve, reject) => {
          const tx = db.transaction(TB_NEXUS_ORCHESTRATOR_LOGS, 'readonly');
          const store = tx.objectStore(TB_NEXUS_ORCHESTRATOR_LOGS);
          const req = store.getAll();
          req.onsuccess = () => {
            db.close();
            resolve((req.result as NexusOrchestratorLogRecord[]) || []);
          };
          req.onerror = () => {
            db.close();
            reject(req.error);
          };
        }
      );
    } catch {
      records = readLocalStorageMirror();
    }
  } else {
    records = readLocalStorageMirror();
  }

  if (records.length === 0) {
    records = readLocalStorageMirror();
  } else {
    writeLocalStorageMirror(records);
  }

  const sorted = [...records].sort((a, b) =>
    b.created_at.localeCompare(a.created_at)
  );

  if (routeFilter && routeFilter !== 'ALL') {
    return sorted.filter(
      (r) => r.structured_output.route_matched === routeFilter
    );
  }

  return sorted;
}

/**
 * Limpa todos os registros da tabela `tb_nexus_orchestrator_logs`
 */
export async function clearOrchestratorLogs(): Promise<void> {
  memoryFallbackStore.clear();
  if (hasLocalStorage()) {
    window.localStorage.removeItem(TB_NEXUS_ORCHESTRATOR_LOGS);
  }

  if (hasIndexedDB()) {
    try {
      const db = await openDatabase();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(TB_NEXUS_ORCHESTRATOR_LOGS, 'readwrite');
        const store = tx.objectStore(TB_NEXUS_ORCHESTRATOR_LOGS);
        store.clear();
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      });
    } catch (err) {
      console.warn('[Storage] Erro ao limpar IndexedDB:', err);
    }
  }
}

/**
 * Exporta o dump completo da tabela `tb_nexus_orchestrator_logs` em formato JSON
 */
export function exportLogsAsJsonString(
  records: NexusOrchestratorLogRecord[]
): string {
  return JSON.stringify(
    {
      table: TB_NEXUS_ORCHESTRATOR_LOGS,
      exported_at: new Date().toISOString(),
      total_records: records.length,
      records,
    },
    null,
    2
  );
}
