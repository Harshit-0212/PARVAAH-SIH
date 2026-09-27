export interface HazardActionGuide {
  hazardType: 'landslide' | 'flood' | 'cyclone';
  hazardTitle: { en: string; hi: string };
  immediateActions: { en: string[]; hi: string[] };
  evacuationTriggers: { en: string[]; hi: string[] };
  emergencyKitChecklist: { en: string[]; hi: string[] };
  whatNotToDo: { en: string[]; hi: string[] };
  afterEventPrecautions: { en: string[]; hi: string[] };
  metadata: {
    lastReviewed: string;
    source: string;
    officialApprovalStatus: 'STANDARD_PUBLIC_SAFETY_GUIDELINE_DRAFT';
    disclaimer: string;
  };
}

export const CITIZEN_ACTION_GUIDES: Record<string, HazardActionGuide> = {
  landslide: {
    hazardType: 'landslide',
    hazardTitle: {
      en: 'Landslide & Hill Slope Failure Safety Guide',
      hi: 'भूस्खलन एवं पहाड़ी ढलान सुरक्षा मार्गदर्शिका'
    },
    immediateActions: {
      en: [
        'Move away from the path of a landslide or debris flow immediately.',
        'Run to the nearest high ground in a direction away from the path.',
        'If escape is impossible, curl into a tight ball and protect your head.'
      ],
      hi: [
        'तुरंत भूस्खलन या मलबे के बहाव के रास्ते से दूर हट जाएं।',
        'बहाव की दिशा से दूर निकटतम ऊंचे स्थान की ओर दौड़ें।',
        'यदि बचना असंभव हो, तो गेंद की तरह झुकें और अपने सिर की रक्षा करें।'
      ]
    },
    evacuationTriggers: {
      en: [
        'Widening tension cracks along roads, retaining walls, or house floors.',
        'Sudden muddy runoff or sudden reduction in mountain stream flow.',
        'Rumbling sounds that increase in volume, or trees cracking/tilting noticeably.'
      ],
      hi: [
        'सड़कों, सुरक्षा दीवारों या घर के फर्श पर चौड़ी होती दरारें।',
        'पहाड़ी नालों में अचानक मटमैला पानी या अचानक पानी का रुकना।',
        'गड़गड़ाहट की तेज होती आवाज या पेड़ों का झुकना और टूटना।'
      ]
    },
    emergencyKitChecklist: {
      en: [
        'Waterproof pouch with government identity cards and property deeds.',
        'Torch with extra batteries and whistle for signaling rescuers.',
        'Essential medications (at least 7 days supply).',
        'First aid kit, thermal emergency blanket, and high-energy rations.'
      ],
      hi: [
        'सरकारी पहचान पत्र और दस्तावेजों के साथ वाटरप्रूफ थैली।',
        'अतिरिक्त बैटरी वाली टॉर्च और बचाव दल को संकेत देने के लिए सीटी।',
        'आवश्यक दवाएं (कम से कम 7 दिनों की खुराक)।',
        'प्राथमिक चिकित्सा किट और सूखा राशन।'
      ]
    },
    whatNotToDo: {
      en: [
        'Do not cross closed highway barricades or ignore road caution flags.',
        'Do not stay in low-lying valley bottoms or river confluences during intense cloudbursts.',
        'Do not return to a landslide area without geotechnical clearance from authorities.'
      ],
      hi: [
        'सड़क बंद होने के बैरिकेड को पार न करें।',
        'भारी बारिश के दौरान निचली घाटियों या नदियों के पास न रुकें।',
        'प्रशासन की अनुमति के बिना भूस्खलन क्षेत्र में वापस न लौटें।'
      ]
    },
    afterEventPrecautions: {
      en: [
        'Stay alert for secondary slope failures and flash floods following initial slide.',
        'Check for injured or trapped persons around the perimeter without entering slide debris.',
        'Report downed power lines and ruptured pipes immediately to emergency line 112.'
      ],
      hi: [
        'शुरुआती भूस्खलन के बाद दूसरे दौर के मलबे और अचानक बाढ़ के प्रति सतर्क रहें।',
        'मलबे में उतरे बिना किनारे से फंसे लोगों की जांच करें।',
        'बिजली के टूटे तारों और पानी की पाइपलाइनों की सूचना तुरंत 112 पर दें।'
      ]
    },
    metadata: {
      lastReviewed: '2026-09-12',
      source: 'National Disaster Management Guidelines (Standard Public Safety Edition)',
      officialApprovalStatus: 'STANDARD_PUBLIC_SAFETY_GUIDELINE_DRAFT',
      disclaimer: 'Advisory guidance compiled from standard disaster management protocols. Not a substitute for local emergency orders.'
    }
  },
  flood: {
    hazardType: 'flood',
    hazardTitle: {
      en: 'Flash Flood & River Swell Safety Guide',
      hi: 'अचानक बाढ़ एवं नदी जलस्तर वृद्धि सुरक्षा मार्गदर्शिका'
    },
    immediateActions: {
      en: [
        'Climb immediately to higher ground; do not wait for water to enter dwellings.',
        'Avoid walking or driving through moving water; 15 cm of moving water can knock you down.',
        'Disconnect electricity and gas mains if safe to do so.'
      ],
      hi: [
        'तुरंत ऊंचे स्थानों पर जाएं; घरों में पानी घुसने का इंतजार न करें।',
        'बहते पानी में चलने या गाड़ी चलाने से बचें।',
        'सुरक्षित होने पर बिजली और गैस के मुख्य कनेक्शन बंद कर दें।'
      ]
    },
    evacuationTriggers: {
      en: [
        'River levels crossing danger marks at upstream gauging stations.',
        'Debris dams forming and threatening sudden breaching.',
        'Continuous downpour exceeding 100mm in 3 hours upstream.'
      ],
      hi: [
        'नदी का जलस्तर खतरे के निशान को पार करना।',
        'नदी में मलबे का बांध बनना जो अचानक टूट सकता है।',
        'ऊपरी जलग्रहण क्षेत्र में 3 घंटे में 100 मिमी से अधिक बारिश।'
      ]
    },
    emergencyKitChecklist: {
      en: [
        'Drinking water (3-day supply in sealed containers).',
        'Water purification tablets and oral rehydration salts.',
        'Waterproof phone pouch with power bank.',
        'Personal documents in watertight zip bags.'
      ],
      hi: [
        'पीने का पानी (3 दिन का सीलबंद भंडारण)।',
        'पानी शुद्ध करने की गोलियां और ओआरएस।',
        'पावर बैंक के साथ वाटरप्रूफ पाउच।',
        'वाटरप्रूफ बैग में जरूरी दस्तावेज।'
      ]
    },
    whatNotToDo: {
      en: [
        'Never drive into flooded underpasses or over bridges with submerged decks.',
        'Do not consume food or water contaminated by flood runoff.',
        'Do not touch electrical equipment while standing in water.'
      ],
      hi: [
        'जलमग्न पुलों या अंडरपास पर गाड़ी न चलाएं।',
        'बाढ़ के पानी से दूषित खाना या पानी न पिएं।',
        'पानी में खड़े होकर बिजली के उपकरणों को न छुएं।'
      ]
    },
    afterEventPrecautions: {
      en: [
        'Boil all drinking water until local health authority certifies municipal supplies.',
        'Watch out for snakes and rodents displaced by floodwaters seeking shelter.',
        'Document property damage with photos before beginning cleanup.'
      ],
      hi: [
        'प्रशासन द्वारा पानी सुरक्षित घोषित होने तक उबालकर पिएं।',
        'बाढ़ के पानी से विस्थापित सांपों और कीड़ों से सावधान रहें।',
        'सफाई से पहले नुकसान की तस्वीरें खींच लें।'
      ]
    },
    metadata: {
      lastReviewed: '2026-09-12',
      source: 'Flood Safety Protocols (Standard Public Safety Edition)',
      officialApprovalStatus: 'STANDARD_PUBLIC_SAFETY_GUIDELINE_DRAFT',
      disclaimer: 'Advisory guidance compiled from standard disaster management protocols.'
    }
  },
  cyclone: {
    hazardType: 'cyclone',
    hazardTitle: {
      en: 'Severe Gale & Mountain Storm Guide',
      hi: 'तीव्र तूफान एवं चक्रवात सुरक्षा मार्गदर्शिका'
    },
    immediateActions: {
      en: [
        'Remain indoors in the strongest part of the house away from windows.',
        'Secure or store outside objects that could become wind-borne projectiles.',
        'Listen to battery-powered radio for official administrative announcements.'
      ],
      hi: [
        'खिड़कियों से दूर घर के सबसे मजबूत हिस्से में अंदर रहें।',
        'बाहर रखी वस्तुओं को सुरक्षित बांधें जो हवा में उड़ सकती हैं।',
        'प्रशासनिक घोषणाओं के लिए रेडियो सुनें।'
      ]
    },
    evacuationTriggers: {
      en: [
        'Official cyclone red alert issued by the District Disaster Management Authority.',
        'Structures with non-engineered tin roofs in exposed ridge positions.'
      ],
      hi: [
        'जिला आपदा प्रबंधन प्राधिकरण द्वारा रेड अलर्ट जारी होना।',
        'पहाड़ी ढलानों पर कमजोर टीन की छत वाले घर।'
      ]
    },
    emergencyKitChecklist: {
      en: [
        'Battery lantern, rope, heavy-duty tarpaulins, warm clothing, non-perishable food.'
      ],
      hi: [
        'बैटरी लालटेन, रस्सी, तिरपाल, गर्म कपड़े, सूखा भोजन।'
      ]
    },
    whatNotToDo: {
      en: [
        'Do not go outside during the lull (eye of the storm); destructive winds will resume.',
        'Do not park vehicles under large trees or weak overhead utility lines.'
      ],
      hi: [
        'तूफान के बीच में हवा रुकने पर बाहर न निकलें; तेज हवाएं दोबारा शुरू होंगी।',
        'बड़े पेड़ों या बिजली के तारों के नीचे वाहन खड़े न करें।'
      ]
    },
    afterEventPrecautions: {
      en: [
        'Check for structural damage before re-entering houses.',
        'Avoid fallen power lines and report sparking transformers.'
      ],
      hi: [
        'घरों में दोबारा प्रवेश करने से पहले संरचनात्मक क्षति की जांच करें।',
        'टूटे बिजली के तारों से दूर रहें।'
      ]
    },
    metadata: {
      lastReviewed: '2026-09-12',
      source: 'Severe Weather Public Safety Standard',
      officialApprovalStatus: 'STANDARD_PUBLIC_SAFETY_GUIDELINE_DRAFT',
      disclaimer: 'Advisory guidance. Obey all evacuation directives from authorized officials.'
    }
  }
};
