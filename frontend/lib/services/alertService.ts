import dbConnect from '../dbConnect';
import { Alert } from '../models/Alert';
import { District } from '../models/District';
import { IAlert } from '../../types/db';
import { Types } from 'mongoose';

/**
 * Retrieves active, non-expired alerts for a district.
 * Supports district lookup by ObjectId string or District Code (e.g. 'KAMRUP_METRO').
 */
export async function getActiveAlertsByDistrict(districtIdOrCode: string): Promise<IAlert[]> {
  await dbConnect();

  let targetDistrictId: Types.ObjectId | null = null;

  if (Types.ObjectId.isValid(districtIdOrCode)) {
    targetDistrictId = new Types.ObjectId(districtIdOrCode);
  } else {
    const district = await District.findOne({ code: districtIdOrCode.toUpperCase() }).lean();
    if (district) {
      targetDistrictId = district._id as Types.ObjectId;
    }
  }

  if (!targetDistrictId) {
    return [];
  }

  const now = new Date();

  const alerts = await Alert.find({
    districtId: targetDistrictId,
    isActive: true,
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: null }, { expiresAt: { $gte: now } }],
  })
    .sort({ severity: -1, createdAt: -1 })
    .lean();

  return alerts as unknown as IAlert[];
}
