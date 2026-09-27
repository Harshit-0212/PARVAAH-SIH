import dbConnect from '../dbConnect';
import { Incident } from '../models/Incident';
import { Report } from '../models/Report';
import { Road } from '../models/Road';
import { District } from '../models/District';
import { Village } from '../models/Village';
import { IIncident, IReport, IRoad } from '../../types/db';
import { Types } from 'mongoose';

/**
 * 1. Incidents near a reported location:
 * GeoJSON $near query returning incidents within maxDistanceMeters of [lng, lat].
 */
export async function getIncidentsNearLocation(
  lng: number,
  lat: number,
  maxDistanceMeters: number = 10000
): Promise<IIncident[]> {
  await dbConnect();

  const incidents = await Incident.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        $maxDistance: maxDistanceMeters,
      },
    },
  })
    .populate('districtId', 'name code')
    .lean();

  return incidents as unknown as IIncident[];
}

/**
 * 2. Reports inside a district polygon:
 * Spatial $geoWithin query returning citizen reports located inside the district boundary.
 */
export async function getReportsInsideDistrictPolygon(districtIdOrCode: string): Promise<IReport[]> {
  await dbConnect();

  let districtDoc;
  if (Types.ObjectId.isValid(districtIdOrCode)) {
    districtDoc = await District.findById(districtIdOrCode).lean();
  } else {
    districtDoc = await District.findOne({ code: districtIdOrCode.toUpperCase() }).lean();
  }

  if (!districtDoc || !districtDoc.boundary) {
    throw new Error(`District '${districtIdOrCode}' with valid boundary polygon not found.`);
  }

  const reports = await Report.find({
    location: {
      $geoWithin: {
        $geometry: districtDoc.boundary,
      },
    },
  })
    .sort({ createdAt: -1 })
    .lean();

  return reports as unknown as IReport[];
}

/**
 * 3. Roads near a village:
 * Retrieves roads within maxDistanceMeters of a village's GeoJSON location point.
 */
export async function getRoadsNearVillage(
  villageId: string,
  maxDistanceMeters: number = 15000
): Promise<IRoad[]> {
  await dbConnect();

  if (!Types.ObjectId.isValid(villageId)) {
    throw new Error('Invalid village ObjectId');
  }

  const village = await Village.findById(villageId).lean();
  if (!village || !village.location) {
    throw new Error('Village not found or location missing');
  }

  const villageCoords = village.location.coordinates; // [lng, lat]

  const roads = await Road.find({
    geometry: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: villageCoords,
        },
        $maxDistance: maxDistanceMeters,
      },
    },
  }).lean();

  return roads as unknown as IRoad[];
}
