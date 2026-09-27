import dbConnect from '../lib/dbConnect';
import {
  PreparednessCategory,
  PreparednessItem,
  SafetyGuide,
  EmergencyContact,
} from '../lib/models';

export async function seedPreparedness() {
  console.log('🎒 Seeding PARVAAH Emergency Readiness & Preparedness Data...');
  await dbConnect();

  // Clear previous preparedness entries
  await PreparednessCategory.deleteMany({});
  await PreparednessItem.deleteMany({});
  await SafetyGuide.deleteMany({});
  await EmergencyContact.deleteMany({});

  // 1. Seed 13 Categories
  const categories = [
    {
      key: 'water_food',
      title: { en: 'Water & Hydration', as: 'পানী আৰু খাদ্য' },
      description: { en: 'Minimum 3 liters per person per day & high-calorie dry rations', as: 'প্ৰতিজন ব্যক্তিৰ বাবে দিনে কমেও ৩ লিটাৰ পানী আৰু শুকান খাদ্য' },
      iconName: 'Droplet',
      order: 1,
      isActive: true,
    },
    {
      key: 'medicines',
      title: { en: 'Essential Medicines', as: 'প্ৰয়োজনীয় ঔষধ' },
      description: { en: '14-day supply of chronic medications and water-purifying tablets', as: '১৪ দিনৰ নিয়মীয়া ঔষধ আৰু পানী বিশুদ্ধকৰণ টেবলেট' },
      iconName: 'Pill',
      order: 2,
      isActive: true,
    },
    {
      key: 'first_aid',
      title: { en: 'First Aid Kit', as: 'প্ৰাথমিক চিকিৎসা কিট' },
      description: { en: 'Sterile gauze, antiseptic, tourniquets, and burn dressings', as: 'ষ্টেৰাইল গজ, এন্টিচেপ্টিক, বেণ্ডেজ আৰু কটা-ছিঙাৰ মলম' },
      iconName: 'ShieldAlert',
      order: 3,
      isActive: true,
    },
    {
      key: 'documents',
      title: { en: 'Identity & Land Documents', as: 'পৰিচয় আৰু মাটিৰ নথি-পত্ৰ' },
      description: { en: 'Waterproof pouch with Aadhaar, land deeds, EPIC, and bank passbooks', as: 'আধাৰ কাৰ্ড, মাটিৰ পট্টা আৰু বেংক পাছবুকৰ ৱাটাৰপ্ৰুফ বেগ' },
      iconName: 'FileText',
      order: 4,
      isActive: true,
    },
    {
      key: 'lighting',
      title: { en: 'Torch & Spare Batteries', as: 'টৰ্চ আৰু অতিৰিক্ত বেটাৰী' },
      description: { en: 'Waterproof high-lumen torch, headlamps, and alkaline batteries', as: 'ৱাটাৰপ্ৰুফ টৰ্চলাইট আৰু অতিৰিক্ত বেটাৰী' },
      iconName: 'Flashlight',
      order: 5,
      isActive: true,
    },
    {
      key: 'power_comm',
      title: { en: 'Phone & Heavy Power Bank', as: 'ফোন আৰু পাৱাৰ বেংক' },
      description: { en: '20,000mAh rugged power bank and emergency charging cables', as: '২০,০০০ mAh পাৱাৰ বেংক আৰু চাৰ্জিং কেবল' },
      iconName: 'BatteryCharging',
      order: 6,
      isActive: true,
    },
    {
      key: 'clothing',
      title: { en: 'Rain Gear & Boots', as: 'বৰষুণৰ সাজ আৰু বুট জোতা' },
      description: { en: 'Heavy-duty raincoats, high-ankle rubber mud boots, and thermal woolens', as: 'ৰেইনকোট, বোকাৰ বাবে ওখ গামবুট আৰু গৰম কাপোৰ' },
      iconName: 'Umbrella',
      order: 7,
      isActive: true,
    },
    {
      key: 'hygiene',
      title: { en: 'Sanitation & Hygiene', as: 'স্বচ্ছতা আৰু স্বাস্থ্যবিধি' },
      description: { en: 'Chlorine tablets, hand sanitizers, sanitary pads, and biodegradable wipes', as: 'ছেনিটাইজাৰ, চাবোন, ছেনিটেৰী পেড আৰু পৰিষ্কাৰ কাপোৰ' },
      iconName: 'Sparkles',
      order: 8,
      isActive: true,
    },
    {
      key: 'cash_keys',
      title: { en: 'Cash & Duplicate Keys', as: 'নগদ ধন আৰু অতিৰিক্ত চাবি' },
      description: { en: 'Small denomination cash notes and home/vehicle duplicate keys', as: 'সৰু নোটৰ নগদ টকা আৰু ঘৰৰ অতিৰিক্ত চাবি' },
      iconName: 'Key',
      order: 9,
      isActive: true,
    },
    {
      key: 'baby_care',
      title: { en: 'Infant & Toddler Care', as: 'কেঁচুৱাৰ যতন আৰু খাদ্য' },
      description: { en: 'Baby formula, feeding bottles, pediatric ORS, and warm blankets', as: 'কেঁচুৱাৰ গাখীৰ, ফিডিং বটেল, পেডিয়াট্ৰিক অ’ আৰ এছ আৰু কম্বল' },
      iconName: 'HeartHandshake',
      order: 10,
      isActive: true,
    },
    {
      key: 'elderly_care',
      title: { en: 'Elderly Support Kit', as: 'জ্যেষ্ঠ নাগৰিকৰ সহায়ক কিট' },
      description: { en: 'Mobility canes, spare spectacles, hearing aid batteries, and blood pressure log', as: 'লাঠি, অতিৰিক্ত চশমা, শ্ৰৱণ যন্ত্ৰৰ বেটাৰী আৰু প্ৰেচাৰৰ ঔষধ' },
      iconName: 'Users',
      order: 11,
      isActive: true,
    },
    {
      key: 'disability_support',
      title: { en: 'Disability Essentials', as: 'বিশেষভাৱে সক্ষম লোকৰ সহায়' },
      description: { en: 'Wheelchair tire repair, tactile emergency cards, and prescribed assistive gear', as: 'হুইলচেয়াৰ মেৰামতি সঁজুলি আৰু সংকেত কাৰ্ড' },
      iconName: 'Accessibility',
      order: 12,
      isActive: true,
    },
    {
      key: 'pet_care',
      title: { en: 'Pet & Livestock Needs', as: 'পোহনীয়া জীৱ-জন্তুৰ খাদ্য' },
      description: { en: '72-hour dry feed, durable collars/leashes, and identification tags', as: 'জীৱ-জন্তুৰ শুকান খাদ্য আৰু পটি/ডাল' },
      iconName: 'PawPrint',
      order: 13,
      isActive: true,
    },
  ];

  await PreparednessCategory.insertMany(categories);
  console.log(`✅ Seeded ${categories.length} Preparedness Categories.`);

  // 2. Seed Structured Items
  const items = [
    {
      categoryKey: 'water_food',
      itemName: { en: 'Water Bottle & Chlorine Purification Tablets', as: 'পানীৰ বটেল আৰু ক্ল’ৰিন টেবলেট' },
      description: { en: '3 liters per person in sealed containers with halogen purification tablets.', as: 'ছীল কৰা বটেলত ৩ লিটাৰ পানী আৰু ক্ল’ৰিন টেবলেট' },
      priority: 'critical',
      userType: 'all',
      isRequired: true,
      isActive: true,
      order: 1,
    },
    {
      categoryKey: 'water_food',
      itemName: { en: 'High-Calorie Dry Foods (Flattened Rice/Chira, Jaggery, Nuts)', as: 'চিৰা, গুড়, শুকান ফল আৰু বাদাম' },
      description: { en: 'Ready-to-eat dry rations requiring no cooking or electricity.', as: 'ৰন্ধাৰ প্ৰয়োজন নোহোৱা পুষ্টিকৰ শুকান খাদ্য' },
      priority: 'critical',
      userType: 'all',
      isRequired: true,
      order: 2,
    },
    {
      categoryKey: 'medicines',
      itemName: { en: '14-Day Chronic Prescription Box', as: '১৪ দিনৰ নিয়মীয়া ঔষধৰ বাকচ' },
      description: { en: 'Hypertension, cardiac, and asthma inhalers in a double-sealed ziplock.', as: 'ব্লাড প্ৰেচাৰ, হৃদৰোগ আৰু এজমাৰ নিয়মীয়া ঔষধ' },
      priority: 'critical',
      userType: 'elderly',
      isRequired: true,
      order: 1,
    },
    {
      categoryKey: 'documents',
      itemName: { en: 'Waterproof Pouch with Identity & Land Titles', as: 'পৰিচয় আৰু মাটিৰ কাগজৰ ৱাটাৰপ্ৰুফ বেগ' },
      description: { en: 'Aadhaar cards, Jamabandi / Land Revenue documents, voter IDs.', as: 'আধাৰ, জমাবন্দী আৰু ভোটাৰ কাৰ্ড' },
      priority: 'critical',
      userType: 'all',
      isRequired: true,
      order: 1,
    },
    {
      categoryKey: 'lighting',
      itemName: { en: 'Waterproof High-Beam LED Torch & Whistle', as: 'ৱাটাৰপ্ৰুফ এল ই ডি টৰ্চ আৰু হুইচেল' },
      description: { en: 'Searchlight with SOS strobe function and high-decibel survival whistle.', as: 'এচ অ’ এচ লাইট আৰু উদ্ধাৰকাৰীৰ বাবে হুইচেল' },
      priority: 'critical',
      userType: 'all',
      isRequired: true,
      order: 1,
    },
    {
      categoryKey: 'power_comm',
      itemName: { en: '20,000mAh Power Bank (Fully Charged)', as: 'সম্পূৰ্ণ চাৰ্জ কৰা ২০,০০০ mAh পাৱাৰ বেংক' },
      description: { en: 'Durable external battery pack for keeping mobile communications alive.', as: 'ম’বাইল সক্ৰিয় কৰি ৰাখিবলৈ অতিৰিক্ত বেটাৰী' },
      priority: 'critical',
      userType: 'all',
      isRequired: true,
      order: 1,
    },
    {
      categoryKey: 'clothing',
      itemName: { en: 'Heavy-Duty Rubber Mud Boots & Rain Poncho', as: 'ৰবৰৰ ওখ গামবুট আৰু বৰষুণৰ কোট' },
      description: { en: 'Essential for traversing unstable slope mud slurry and sharp rockfall.', as: 'বোকা আৰু চোকা শিলৰ পৰা ভৰি বচাবলৈ বুট' },
      priority: 'critical',
      userType: 'all',
      isRequired: true,
      order: 1,
    },
    {
      categoryKey: 'baby_care',
      itemName: { en: 'Baby Formula & Mountain Sling Carrier', as: 'কেঁচুৱাৰ গাখীৰ আৰু পিঠিত বন্ধা কাপোৰ' },
      description: { en: 'Pre-mixed baby nutrition, sterile nipples, and hands-free child carrier.', as: 'কেঁচুৱাক সুৰক্ষিতভাৱে লগত লৈ পাহাৰ বগাবলৈ' },
      priority: 'critical',
      userType: 'children',
      isRequired: true,
      order: 1,
    },
    {
      categoryKey: 'disability_support',
      itemName: { en: 'Emergency Tactile Card & Mobility Spares', as: 'সংকেত কাৰ্ড আৰু অতিৰিক্ত সহায়ক সামগ্ৰী' },
      description: { en: 'Emergency contact laminated in high-contrast/Braille and spare wheelchair tube.', as: 'দৃষ্টিহীন বা বিশেষভাৱে সক্ষম লোকৰ বাবে লেমিনেটেড তথ্য' },
      priority: 'critical',
      userType: 'pwd',
      isRequired: true,
      order: 1,
    },
    {
      categoryKey: 'pet_care',
      itemName: { en: 'Livestock Tether Rope & 3-Day Pet Rations', as: 'জীৱ-জন্তু বন্ধা ৰছী আৰু ৩ দিনৰ খাদ্য' },
      description: { en: 'Durable nylon ropes to secure animals to high ground and dry kibble.', as: 'উখ স্থানত পোহনীয়া জীৱ সুৰক্ষিত কৰিবলৈ ৰছী' },
      priority: 'recommended',
      userType: 'pets',
      isRequired: false,
      order: 1,
    },
  ];

  await PreparednessItem.insertMany(items);
  console.log(`✅ Seeded ${items.length} Preparedness Items.`);

  // 3. Seed Safety Guides (DOs and DONTs)
  const safetyGuides = [
    {
      hazardType: 'landslide',
      guideType: 'what_to_do',
      title: { en: 'Immediate Actions During Landslide Warning', as: 'ভূমিস্খলনৰ সতৰ্কবাণী জাৰি হ’লে কি কৰিব' },
      content: {
        en: [
          'Evacuate immediately if instructed by DDMA or local SDRF officials.',
          'Turn off main electricity breakers and LPG gas cylinders before leaving.',
          'Move perpendicularly away from the path of the slope or debris torrent, never downhill.',
          'Listen for unusual sounds like trees cracking or boulders knocking together.',
          'Alert vulnerable elderly neighbors and assist persons with mobility challenges.',
        ],
        as: [
          'প্ৰশাসনে নিৰ্দেশ দিয়াৰ লগে লগে ততাতৈয়াকৈ সুৰক্ষিত স্থানলৈ যাওক।',
          'ঘৰ এৰাৰ পূৰ্বে বিজুলী আৰু গেছ চিলিণ্ডাৰৰ সংযোগ বিচ্ছিন্ন কৰক।',
          'মাটি বা বোকা খহি অহাৰ দিশৰ সৈতে সমান্তৰালভাৱে উখ স্থানলৈ দৌৰক, তললৈ নহয়।',
          'গছ ভগা বা শিল বগৰি অহাৰ অস্বাভাৱিক শব্দলৈ কাণ দিয়ক।',
        ],
      },
      priority: 10,
      isActive: true,
    },
    {
      hazardType: 'landslide',
      guideType: 'what_not_to_do',
      title: { en: 'Critical Life Hazards: What NOT To Do', as: 'ভূমিস্খলনৰ সময়ত কি নকৰিব' },
      content: {
        en: [
          'NEVER cross flooded culverts, submerged bridges, or active mud flows on foot or in vehicles.',
          'DO NOT re-enter cracked or tilted dwellings to retrieve physical belongings.',
          'DO NOT stay near stream channels, natural drainages, or ravines during heavy monsoon downpours.',
          'DO NOT stand under steep retaining walls showing tension cracks or bulging.',
          'DO NOT spread unverified rumors on social media; rely solely on official DDMA bulletins.',
        ],
        as: [
          'পানীত ডুবি থকা কালভাৰ্ট বা দলং খোজকাঢ়ি বা গাড়ীৰে পাৰ হ’বলৈ চেষ্টা নকৰিব।',
          'সামগ্ৰী আনিবলৈ ফাট মেলা বা হালি পৰা ঘৰৰ ভিতৰত পুনৰ নোসোমাব।',
          'পাহাৰৰ খহনীয়া বা নলাৰ কাষত ঠিয় নহ’ব।',
          'সামাজিক মাধ্যমত উৰাবাতৰি নিবিলাব; কেৱল চৰকাৰী তথ্য বিশ্বাস কৰক।',
        ],
      },
      priority: 10,
      isActive: true,
    },
    {
      hazardType: 'slope_crack',
      guideType: 'danger_zone_protocol',
      title: { en: 'Protocol When Slope Cracks Appear', as: 'পাহাৰত বা ৰাস্তাত ফাট মেলিলে কি কৰিব' },
      content: {
        en: [
          'Immediately report the location and photo using the PARVAAH Geo-Report feature.',
          'Erect temporary markers to warn oncoming road traffic.',
          'Vacate structures situated directly above or immediately below the crack line.',
        ],
        as: [
          'পাৰৱাহ (PARVAAH) এপৰ জৰিয়তে তৎক্ষণাত ফটো আৰু অৱস্থানৰ সৈতে খবৰ দিয়ক।',
          'ফাট মেলা স্থানৰ তলৰ আৰু ওপৰৰ ঘৰসমূহ অনতিপলমে খালী কৰক।',
        ],
      },
      priority: 8,
      isActive: true,
    },
  ];

  await SafetyGuide.insertMany(safetyGuides);
  console.log(`✅ Seeded ${safetyGuides.length} Safety Guides.`);

  // 4. Seed Official Emergency Helplines
  const contacts = [
    {
      title: { en: 'State Emergency Operation Centre (SEOC) Assam', as: 'অসম ৰাজ্যিক জৰুৰীকালীন নিয়ন্ত্ৰণ কক্ষ' },
      phone: '1070',
      alternatePhone: '0361-2237221',
      roleType: 'ddma_control_room',
      isEmergency: true,
      priorityOrder: 1,
      isActive: true,
    },
    {
      title: { en: 'SDRF Disaster Response Battalion (Assam)', as: 'এছ ডি আৰ এফ দুৰ্যোগ সঁহাৰি বাহিনী' },
      phone: '112',
      alternatePhone: '+919435012345',
      roleType: 'sdrf_dispatch',
      isEmergency: true,
      priorityOrder: 2,
      isActive: true,
    },
    {
      title: { en: 'PWD Road & Highway Landslide Clearance Control Room', as: 'লোকনিৰ্মাণ বিভাগ ৰাজপথ নিয়ন্ত্ৰণ কক্ষ' },
      phone: '1800-345-3888',
      roleType: 'pwd_roads',
      isEmergency: true,
      priorityOrder: 3,
      isActive: true,
    },
    {
      title: { en: 'Medical Emergency & Ambulance Dispatch', as: 'চিকিৎসা জৰুৰীকালীন এম্বুলেন্স' },
      phone: '108',
      roleType: 'medical_emergency',
      isEmergency: true,
      priorityOrder: 4,
      isActive: true,
    },
  ];

  await EmergencyContact.insertMany(contacts);
  console.log(`✅ Seeded ${contacts.length} Official Emergency Contacts.`);
  console.log('🎉 Seed process finished successfully!');
}

// Allow standalone CLI execution
if (process.argv[1]?.includes('seedPreparedness')) {
  seedPreparedness()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding error:', err);
      process.exit(1);
    });
}
