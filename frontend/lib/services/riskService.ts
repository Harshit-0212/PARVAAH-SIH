import dbConnect from '../dbConnect';
import { RiskAssessment } from '../models/RiskAssessment';
import { District } from '../models/District';
import { IRiskAssessment } from '../../types/db';
import { Types } from 'mongoose';

/**
 * Retrieves latest risk assessments for a district.
 */
export async function getRiskAssessmentsByDistrict(
  districtIdOrCode: string,
  limit: number = 5
): Promise<IRiskAssessment[]> {
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

  const assessments = await RiskAssessment.find({ districtId: targetDistrictId })
    .sort({ assessedAt: -1 })
    .limit(limit)
    .populate('villageId', 'name')
    .populate('roadId', 'roadName status')
    .lean();

  return assessments as unknown as IRiskAssessment[];
}
