import dbConnect from '../dbConnect';
import { SyncQueue } from '../models/SyncQueue';
import { ISyncQueue } from '../../types/db';
import { Types } from 'mongoose';

/**
 * Retrieves pending offline sync queue items for a user.
 */
export async function getPendingSyncItemsForUser(userId: string): Promise<ISyncQueue[]> {
  await dbConnect();

  if (!Types.ObjectId.isValid(userId)) {
    return [];
  }

  const items = await SyncQueue.find({
    userId: new Types.ObjectId(userId),
    syncStatus: { $in: ['pending', 'failed'] },
    retryCount: { $lt: 5 },
  })
    .sort({ createdAt: 1 })
    .lean();

  return items as unknown as ISyncQueue[];
}

/**
 * Enqueues an offline action into the server sync queue.
 */
export async function enqueueSyncItem(
  userId: string,
  entityType: 'Report' | 'Incident' | 'RoadStatus',
  actionType: 'CREATE' | 'UPDATE' | 'DELETE',
  payload: Record<string, unknown>,
  entityId?: string
): Promise<ISyncQueue> {
  await dbConnect();

  const syncItem = new SyncQueue({
    userId: new Types.ObjectId(userId),
    entityType,
    entityId: entityId && Types.ObjectId.isValid(entityId) ? new Types.ObjectId(entityId) : undefined,
    actionType,
    payload,
    syncStatus: 'pending',
    retryCount: 0,
  });

  const saved = await syncItem.save();
  return saved.toObject() as unknown as ISyncQueue;
}
