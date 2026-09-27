import dbConnect from '../lib/dbConnect';
import {
  User,
  District,
  Village,
  Road,
  Incident,
  Report,
  Alert,
  WeatherSnapshot,
  RiskAssessment,
  SyncQueue,
} from '../lib/models';
import { generateDedupeHash } from '../lib/services/reportService';

export async function seedDatabase() {
  console.log('🌱 Starting PARVAAH Database Seed process...');

  await dbConnect();

  // Clear existing collections safely for clean seed
  await User.deleteMany({});
  await District.deleteMany({});
  await Village.deleteMany({});
  await Road.deleteMany({});
  await Incident.deleteMany({});
  await Report.deleteMany({});
  await Alert.deleteMany({});
  await WeatherSnapshot.deleteMany({});
  await RiskAssessment.deleteMany({});
  await SyncQueue.deleteMany({});

  console.log('🧹 Cleaned existing database collections.');

  // 1. Create District: Kamrup Metropolitan (Guwahati region, Assam)
  // Coordinates for Kamrup Metro boundary & center [lng, lat]
  const district = await District.create({
    name: 'Kamrup Metropolitan',
    stateName: 'Assam',
    code: 'KAMRUP_METRO',
    center: {
      type: 'Point',
      coordinates: [91.7362, 26.1445], // [Longitude, Latitude]
    },
    boundary: {
      type: 'Polygon',
      coordinates: [
        [
          [91.5000, 26.0000],
          [92.0000, 26.0000],
          [92.0000, 26.3000],
          [91.5000, 26.3000],
          [91.5000, 26.0000],
        ],
      ],
    },
  });
  console.log(`✅ Created District: ${district.name} (${district.code})`);

  // 2. Create Users (Field Officer & Citizen)
  const officerUser = await User.create({
    fullName: 'Anurag Kalita',
    email: 'anurag.kalita@parvaah.gov.in',
    phone: '+919864012345',
    role: 'officer',
    districtId: district._id,
    languagePreference: 'as',
    isActive: true,
  });

  const citizenUser = await User.create({
    fullName: 'Bhaben Gogoi',
    email: 'bhaben.gogoi@gmail.com',
    phone: '+919435098765',
    role: 'citizen',
    districtId: district._id,
    languagePreference: 'as',
    isActive: true,
  });
  console.log('✅ Created User Accounts (Officer & Citizen)');

  // 3. Create Village: Sonapur
  const village = await Village.create({
    districtId: district._id,
    name: 'Sonapur Gaon',
    population: 4850,
    location: {
      type: 'Point',
      coordinates: [91.9782, 26.1174], // [Longitude, Latitude]
    },
  });
  console.log(`✅ Created Village: ${village.name}`);

  // 4. Create Road: NH-27 (Guwahati - East West Corridor Highway)
  const road = await Road.create({
    districtId: district._id,
    roadName: 'National Highway 27 (Sonapur Bypass Section)',
    roadCode: 'NH-27',
    status: 'at_risk',
    riskLevel: 'high',
    geometry: {
      type: 'LineString',
      coordinates: [
        [91.9500, 26.1100],
        [91.9650, 26.1140],
        [91.9782, 26.1174],
        [91.9900, 26.1210],
      ],
    },
  });
  console.log(`✅ Created Road: ${road.roadName}`);

  // 5. Create Incident: Active Landslide / Debris flow threat
  const incident = await Incident.create({
    districtId: district._id,
    villageId: village._id,
    roadId: road._id,
    reportedBy: officerUser._id,
    incidentType: 'slope_crack_debris_flow',
    description: 'Major slope instability detected on eastern embankment near Sonapur cutting. Continuous rain causing active soil displacement.',
    severity: 'critical',
    status: 'in_progress',
    sourceType: 'officer',
    location: {
      type: 'Point',
      coordinates: [91.9790, 26.1180],
    },
    mediaUrls: [
      'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=800&q=80',
    ],
  });
  console.log(`✅ Created Incident: ${incident.incidentType}`);

  // 6. Create Alert: High Warning Alert
  const alert = await Alert.create({
    districtId: district._id,
    title: 'RED ALERT: Severe Landslide Warning for Sonapur-Khetri Belt',
    message: 'Heavy localized rainfall (>180mm) has saturated hill slopes. Commuters on NH-27 are advised to exercise extreme caution or use detours.',
    severity: 'emergency',
    languageCode: 'en',
    isActive: true,
    issuedBy: officerUser._id,
    startsAt: new Date(),
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours validity
  });
  console.log(`✅ Created Alert: ${alert.title}`);

  // 7. Create Weather Snapshot
  const weather = await WeatherSnapshot.create({
    districtId: district._id,
    rainfallMm: 185.4,
    soilMoisture: 88.5,
    forecastWindow: '24h',
    sourceName: 'IMD Guwahati Radar & Sonapur AWS',
    observedAt: new Date(),
  });
  console.log(`✅ Created Weather Snapshot: ${weather.rainfallMm}mm rainfall`);

  // 8. Create Risk Assessment
  const risk = await RiskAssessment.create({
    districtId: district._id,
    villageId: village._id,
    roadId: road._id,
    riskScore: 87.5,
    riskLevel: 'severe',
    reasoning: 'Cumulative 72h rainfall exceeds 320mm. Soil moisture saturation index at 88.5%. Steep 42-degree slope angle indicates high vulnerability.',
    modelVersion: 'PARVAAH-ML-v2.1',
    assessedAt: new Date(),
  });
  console.log(`✅ Created Risk Assessment: Score ${risk.riskScore} (${risk.riskLevel})`);

  // 9. Create Citizen Report with Offline Sync fields
  const dedupe = generateDedupeHash(
    citizenUser._id.toString(),
    'Mud accumulation on NH-27 near Sonapur',
    91.9785,
    26.1176
  );

  const report = await Report.create({
    reporterId: citizenUser._id,
    incidentId: incident._id,
    districtId: district._id,
    title: 'Mud accumulation on NH-27 near Sonapur',
    description: 'Small rocks and mud flowing onto the left lane of the highway after heavy morning rain.',
    mediaUrls: [],
    location: {
      type: 'Point',
      coordinates: [91.9785, 26.1176],
    },
    reportStatus: 'verified',
    clientTempId: 'client-temp-uuid-9871',
    offlineCreatedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago offline
    syncedAt: new Date(),
    dedupeHash: dedupe,
  });
  console.log(`✅ Created Citizen Report: ${report.title}`);

  console.log('🎉 PARVAAH Database Seed complete!');

  // Seed Module 1 Preparedness Data
  const { seedPreparedness } = await import('./seedPreparedness');
  await seedPreparedness();
}

// Execute seed script if run directly
if (import.meta.url === `file://${process.argv[1]}` || process.env.RUN_SEED === 'true') {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Database seed failed:', err);
      process.exit(1);
    });
}
