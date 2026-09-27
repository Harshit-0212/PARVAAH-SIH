/**
 * IndexedDB Service for PARVAAH Offline Report Queue
 * Database: 'parvaah_db_v1'
 * ObjectStore: 'reports'
 * Keys: clientReportId (string)
 */

export type OfflineQueueStatus =
  | 'DRAFT_OFFLINE'
  | 'QUEUED_FOR_SYNC'
  | 'SYNCING'
  | 'SYNCED'
  | 'FAILED_RETRYABLE'
  | 'FAILED_FINAL';

export interface OfflineAttachment {
  name: string;
  type: string;
  size: number;
  blob: Blob;
}

export interface OfflineReportItem {
  clientReportId: string;
  title?: string;
  description: string;
  hazardType: string;
  severity?: string;
  latitude: number;
  longitude: number;
  district?: string;
  state?: string;
  roadCondition?: string;
  numberOfPeopleAffected?: number;
  contactNumber?: string;
  reporterRole?: string;
  selectedLanguage: string;
  captureTimestamp: string;
  localCreatedAt: string;
  attachmentBlobs: OfflineAttachment[];
  attachmentMetadata: Array<{ fileName: string; fileSizeBytes: number; mimeType: string }>;
  queueStatus: OfflineQueueStatus;
  retryCount: number;
  errorState?: string | null;
  serverReportId?: string | null;
}

const DB_NAME = 'parvaah_db_v1';
const STORE_NAME = 'offline_reports';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'clientReportId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save or update a report in IndexedDB
 */
export async function saveOfflineReport(report: OfflineReportItem): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(report);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Get all queued offline reports from IndexedDB
 */
export async function getOfflineReports(): Promise<OfflineReportItem[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Failed to fetch offline reports:', err);
    return [];
  }
}

/**
 * Delete a report from IndexedDB by clientReportId
 */
export async function deleteOfflineReport(clientReportId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(clientReportId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Update the status of an offline report
 */
export async function updateOfflineReportStatus(
  clientReportId: string,
  queueStatus: OfflineQueueStatus,
  errorState: string | null = null,
  serverReportId: string | null = null
): Promise<void> {
  const reports = await getOfflineReports();
  const target = reports.find(r => r.clientReportId === clientReportId);
  if (target) {
    target.queueStatus = queueStatus;
    target.errorState = errorState;
    if (serverReportId) {
      target.serverReportId = serverReportId;
    }
    if (queueStatus === 'FAILED_RETRYABLE') {
      target.retryCount = (target.retryCount || 0) + 1;
    }
    await saveOfflineReport(target);
  }
}

/**
 * Synchronize all QUEUED_FOR_SYNC reports to the backend server
 */
export async function syncOfflineReportQueue(
  submitApiFn: (formData: FormData) => Promise<any>
): Promise<{ synced: number; failed: number }> {
  if (typeof window !== 'undefined' && !navigator.onLine) {
    return { synced: 0, failed: 0 };
  }

  const reports = await getOfflineReports();
  const pending = reports.filter(r => r.queueStatus === 'QUEUED_FOR_SYNC' || r.queueStatus === 'FAILED_RETRYABLE');

  let synced = 0;
  let failed = 0;

  for (const item of pending) {
    try {
      await updateOfflineReportStatus(item.clientReportId, 'SYNCING');

      const formData = new FormData();
      formData.append('clientReportId', item.clientReportId);
      formData.append('hazardType', item.hazardType);
      formData.append('description', item.description);
      formData.append('latitude', String(item.latitude));
      formData.append('longitude', String(item.longitude));
      if (item.district) formData.append('district', item.district);
      if (item.state) formData.append('state', item.state);
      if (item.roadCondition) formData.append('roadCondition', item.roadCondition);
      if (item.numberOfPeopleAffected !== undefined) formData.append('numberOfPeopleAffected', String(item.numberOfPeopleAffected));
      if (item.contactNumber) formData.append('contactNumber', item.contactNumber);
      if (item.reporterRole) formData.append('reporterRole', item.reporterRole);
      if (item.captureTimestamp) formData.append('captureTimestamp', item.captureTimestamp);

      // Append files
      if (item.attachmentBlobs && item.attachmentBlobs.length > 0) {
        item.attachmentBlobs.forEach(att => {
          const file = new File([att.blob], att.name, { type: att.type });
          formData.append('attachments', file);
        });
      }

      const res = await submitApiFn(formData);

      if (res && (res.serverReportId || res.id || res.success)) {
        const serverId = res.serverReportId || res.id || 'REP-SYNCED';
        await updateOfflineReportStatus(item.clientReportId, 'SYNCED', null, serverId);
        synced++;
      } else {
        await updateOfflineReportStatus(item.clientReportId, 'FAILED_RETRYABLE', res?.error || 'Server rejected submission');
        failed++;
      }
    } catch (err: any) {
      console.error(`[IndexedDB Sync] Sync failed for ${item.clientReportId}:`, err);
      const isFinal = item.retryCount >= 3;
      await updateOfflineReportStatus(
        item.clientReportId,
        isFinal ? 'FAILED_FINAL' : 'FAILED_RETRYABLE',
        err.message || 'Network error during sync'
      );
      failed++;
    }
  }

  return { synced, failed };
}
