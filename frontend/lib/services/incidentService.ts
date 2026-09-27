import dbConnect from '../dbConnect';
import { Incident } from '../models/Incident';
import { District } from '../models/District';
import { IIncident } from '../../types/db';
import { Types } from 'mongoose';

/**
 * Retrieves recent incidents for a district sorted by createdAt descending.
 */
export async function getRecentIncidentsByDistrict(
  districtIdOrCode: string,
  limit: number = 10
): Promise<IIncident[]> {
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

  const incidents = await Incident.find({ districtId: targetDistrictId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('villageId', 'name location')
    .populate('roadId', 'roadName status riskLevel')
    .lean();

  return incidents as unknown as IIncident[];
}

/**
 * Spatial query: Retrieves incidents near a given GeoJSON point [lng, lat] within radiusMeters.
 */
export async function getNearbyIncidents(
  lng: number,
  lat: number,
  radiusMeters: number = 5000
): Promise<IIncident[]> {
  await dbConnect();

  // MongoDB geospatial queries require [longitude, latitude]
  const incidents = await Incident.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        $maxDistance: radiusMeters,
      },
    },
  })
    .populate('districtId', 'name code')
    .populate('villageId', 'name')
    .populate('roadId', 'roadName')
    .lean();

  return incidents as unknown as IIncident[];
}
