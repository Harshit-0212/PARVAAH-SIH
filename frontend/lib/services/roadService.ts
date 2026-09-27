import dbConnect from '../dbConnect';
import { Road } from '../models/Road';
import { District } from '../models/District';
import { IRoad } from '../../types/db';
import { Types } from 'mongoose';

/**
 * Retrieves status and risk level of all monitored roads in a district.
 */
export async function getRoadStatusByDistrict(districtIdOrCode: string): Promise<IRoad[]> {
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

  const roads = await Road.find({ districtId: targetDistrictId })
    .sort({ riskLevel: -1, status: -1 })
    .lean();

  return roads as unknown as IRoad[];
}
