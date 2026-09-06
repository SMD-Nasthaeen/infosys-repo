export interface CustomerMasterItem {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  primaryHub: string;
  tier: 'STANDARD' | 'SILVER' | 'GOLD' | 'ENTERPRISE';
  defaultPaymentTerms: string;
  activeShipmentsCount: number;
}

export interface PortMasterItem {
  id: string;
  code: string;
  name: string;
  city: string;
  country: string;
  region: string;
  type: 'SEAPORT' | 'AIRPORT';
  terminals: string[];
  avgDwellDays: number;
  draftDepthM: number;
}

export interface CarrierMasterItem {
  id: string;
  code: string;
  name: string;
  mode: 'OCEAN' | 'AIR' | 'GROUND';
  serviceTypes: string[];
  reliabilityScore: number; // e.g. 96 for 96%
  fleetSize: number;
  contactEmail: string;
}

export interface CargoTypeMasterItem {
  id: string;
  code: string;
  name: string;
  description: string;
  isHazardous: boolean;
  requiresTempControl: boolean;
  surchargeMultiplier: number;
}

export interface ContainerTypeMasterItem {
  id: string;
  code: string;
  name: string;
  teu: number;
  maxPayloadKg: number;
  volumeCbm: number;
}

export interface RouteOption {
  id: string;
  name: string; // e.g. 'Route A'
  path: string; // e.g. 'Chennai → Singapore'
  transitDays: number;
  transshipmentType: 'Direct' | 'Via Colombo' | 'Via Dubai' | 'Via Port Klang' | 'Via Jebel Ali';
  carrierId: string;
  carrierName: string; // e.g. 'ABC Shipping'
  carrierCode: string;
  reliabilityScore: number;
  co2EmissionsKg: number;
  baseFreightCostUsd: number;
  isRecommended: boolean;
  recommendationReason?: string;
  stops: string[];
}

export interface ShipmentQuotation {
  quoteId: string;
  freightCostUsd: number;
  operationalCostUsd: number;
  marginPct: number;
  marginAmountUsd: number;
  finalQuoteUsd: number;
  status: 'GENERATED' | 'PENDING' | 'APPROVED' | 'REJECTED';
  generatedAt: string;
  approvedAt?: string;
  validUntil: string;
}

export interface ShipmentRecord {
  id: string; // e.g. 'SHP001'
  customerId: string; // e.g. 'C001'
  customerName: string; // e.g. 'ABC Logistics'
  originPort: string; // e.g. 'Chennai'
  originCode: string; // e.g. 'INMAA'
  destinationPort: string; // e.g. 'Singapore'
  destinationCode: string; // e.g. 'SGSIN'
  cargoType: string; // e.g. 'Electronics'
  containerType: string; // e.g. '40FT'
  shipmentDate: string; // e.g. '2026-08-25'
  status: 'REQUESTED' | 'ROUTE_PROCESSING' | 'ROUTE_READY' | 'QUOTE_GENERATED' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  routeOptions: RouteOption[];
  recommendedRoute?: RouteOption;
  selectedRoute?: RouteOption;
  quotation?: ShipmentQuotation;
  notes?: string;
}

// Master Data Initial Collections
export const MASTER_CUSTOMERS: CustomerMasterItem[] = [
  {
    id: 'cust-1',
    code: 'C001',
    name: 'ABC Logistics',
    email: 'ops@abclogistics.com',
    phone: '+91 44 2836 1100',
    primaryHub: 'Chennai (INMAA)',
    tier: 'GOLD',
    defaultPaymentTerms: 'Net 30',
    activeShipmentsCount: 14,
  },
  {
    id: 'cust-2',
    code: 'C002',
    name: 'XYZ Logistics',
    email: 'supply@xyzlogistics.com',
    phone: '+91 22 6780 4321',
    primaryHub: 'Nhava Sheva (INNSA)',
    tier: 'STANDARD',
    defaultPaymentTerms: 'Net 15',
    activeShipmentsCount: 8,
  },
  {
    id: 'cust-3',
    code: 'C003',
    name: 'Global Freight Corp',
    email: 'charters@globalfreight.com',
    phone: '+971 4 881 2900',
    primaryHub: 'Jebel Ali (AEJEA)',
    tier: 'ENTERPRISE',
    defaultPaymentTerms: 'Net 60',
    activeShipmentsCount: 29,
  },
  {
    id: 'cust-4',
    code: 'C004',
    name: 'Apex Cargo Solutions',
    email: 'booking@apexcargo.com',
    phone: '+31 10 798 5500',
    primaryHub: 'Rotterdam (NLRTM)',
    tier: 'SILVER',
    defaultPaymentTerms: 'Net 30',
    activeShipmentsCount: 11,
  },
];

export const MASTER_PORTS: PortMasterItem[] = [
  {
    id: 'p-1',
    code: 'INMAA',
    name: 'Chennai Port',
    city: 'Chennai',
    country: 'India',
    region: 'South Asia',
    type: 'SEAPORT',
    terminals: ['CCTL (DP World)', 'CITPL (PSA)'],
    avgDwellDays: 2.1,
    draftDepthM: 16.5,
  },
  {
    id: 'p-2',
    code: 'SGSIN',
    name: 'Port of Singapore',
    city: 'Singapore',
    country: 'Singapore',
    region: 'Southeast Asia',
    type: 'SEAPORT',
    terminals: ['Tuas Mega Port', 'Pasir Panjang', 'Tanjong Pagar'],
    avgDwellDays: 1.0,
    draftDepthM: 18.0,
  },
  {
    id: 'p-3',
    code: 'AEJEA',
    name: 'Jebel Ali Port',
    city: 'Dubai',
    country: 'United Arab Emirates',
    region: 'Middle East',
    type: 'SEAPORT',
    terminals: ['Terminal 1', 'Terminal 2', 'Terminal 3'],
    avgDwellDays: 1.4,
    draftDepthM: 17.0,
  },
  {
    id: 'p-4',
    code: 'LKCMB',
    name: 'Port of Colombo',
    city: 'Colombo',
    country: 'Sri Lanka',
    region: 'South Asia Transshipment Hub',
    type: 'SEAPORT',
    terminals: ['JCT', 'SAGT', 'CICT (Deep Water)'],
    avgDwellDays: 1.2,
    draftDepthM: 18.0,
  },
  {
    id: 'p-5',
    code: 'NLRTM',
    name: 'Port of Rotterdam',
    city: 'Rotterdam',
    country: 'Netherlands',
    region: 'Northwest Europe',
    type: 'SEAPORT',
    terminals: ['Maasvlakte II', 'APM Terminals', 'ECT Delta'],
    avgDwellDays: 1.8,
    draftDepthM: 24.0,
  },
  {
    id: 'p-6',
    code: 'INNSA',
    name: 'Nhava Sheva (JNPT)',
    city: 'Navi Mumbai',
    country: 'India',
    region: 'West Coast India',
    type: 'SEAPORT',
    terminals: ['BMCT', 'NSICT', 'GTI'],
    avgDwellDays: 2.4,
    draftDepthM: 15.0,
  },
];

export const MASTER_CARRIERS: CarrierMasterItem[] = [
  {
    id: 'car-1',
    code: 'ABCS',
    name: 'ABC Shipping',
    mode: 'OCEAN',
    serviceTypes: ['Direct Express', 'FCL Line', 'Regional Feeder'],
    reliabilityScore: 96,
    fleetSize: 142,
    contactEmail: 'lineops@abcshipping.com',
  },
  {
    id: 'car-2',
    code: 'XYZS',
    name: 'XYZ Shipping',
    mode: 'OCEAN',
    serviceTypes: ['Hub-and-Spoke Transshipment', 'FCL/LCL', 'Breakbulk'],
    reliabilityScore: 91,
    fleetSize: 98,
    contactEmail: 'quotes@xyzshipping.com',
  },
  {
    id: 'car-3',
    code: 'MAEU',
    name: 'Maersk Line',
    mode: 'OCEAN',
    serviceTypes: ['Global Ocean FCL', 'Cold Chain', 'Intermodal'],
    reliabilityScore: 94,
    fleetSize: 730,
    contactEmail: 'oceanrates@maersk.com',
  },
  {
    id: 'car-4',
    code: 'MSCU',
    name: 'MSC Mediterranean',
    mode: 'OCEAN',
    serviceTypes: ['Global Network', 'Reefer Express', 'High Cube FCL'],
    reliabilityScore: 93,
    fleetSize: 780,
    contactEmail: 'commercial@msc.com',
  },
  {
    id: 'car-5',
    code: 'CMDU',
    name: 'CMA CGM',
    mode: 'OCEAN',
    serviceTypes: ['Asia-Europe Loop', 'Direct Feeder'],
    reliabilityScore: 89,
    fleetSize: 590,
    contactEmail: 'pricing@cmacgm.com',
  },
];

export const MASTER_CARGO_TYPES: CargoTypeMasterItem[] = [
  {
    id: 'cg-1',
    code: 'ELEC',
    name: 'Electronics',
    description: 'High-value consumer tech, semiconductor chips, computing hardware',
    isHazardous: false,
    requiresTempControl: false,
    surchargeMultiplier: 1.0,
  },
  {
    id: 'cg-2',
    code: 'DRY',
    name: 'Dry Bulk',
    description: 'Aggregates, grains, cement, minerals, unpackaged industrial commodities',
    isHazardous: false,
    requiresTempControl: false,
    surchargeMultiplier: 0.95,
  },
  {
    id: 'cg-3',
    code: 'GEN',
    name: 'General Cargo',
    description: 'Textiles, packaged consumer goods, furniture, manufactured items',
    isHazardous: false,
    requiresTempControl: false,
    surchargeMultiplier: 1.0,
  },
  {
    id: 'cg-4',
    code: 'REEF',
    name: 'Refrigerated & Perishables',
    description: 'Fresh fruits, seafood, pharmaceuticals, dairy under active cold chain',
    isHazardous: false,
    requiresTempControl: true,
    surchargeMultiplier: 1.25,
  },
  {
    id: 'cg-5',
    code: 'CHEM',
    name: 'Chemicals (DG/Hazmat)',
    description: 'IMO Class certified industrial chemicals, paints, flammable liquids',
    isHazardous: true,
    requiresTempControl: false,
    surchargeMultiplier: 1.35,
  },
  {
    id: 'cg-6',
    code: 'AUTO',
    name: 'Automotive & Machinery',
    description: 'Vehicle components, transmissions, industrial robotic assemblies',
    isHazardous: false,
    requiresTempControl: false,
    surchargeMultiplier: 1.08,
  },
];

export const MASTER_CONTAINER_TYPES: ContainerTypeMasterItem[] = [
  {
    id: 'cnt-1',
    code: '20FT',
    name: '20FT Standard GP',
    teu: 1.0,
    maxPayloadKg: 28200,
    volumeCbm: 33.2,
  },
  {
    id: 'cnt-2',
    code: '40FT',
    name: '40FT Standard GP',
    teu: 2.0,
    maxPayloadKg: 26680,
    volumeCbm: 67.7,
  },
  {
    id: 'cnt-3',
    code: '40HC',
    name: '40FT High Cube',
    teu: 2.0,
    maxPayloadKg: 26460,
    volumeCbm: 76.3,
  },
  {
    id: 'cnt-4',
    code: '45HC',
    name: '45FT Super High Cube',
    teu: 2.25,
    maxPayloadKg: 27700,
    volumeCbm: 86.0,
  },
];

// Helper: M1 Route Agent Engine
export function runRouteAgent(
  origin: string,
  destination: string,
  cargoType: string = 'Electronics',
  containerType: string = '40FT',
  customOptions?: {
    carriers?: Array<{ carrierCode?: string; carrierName?: string; reliabilityScore?: number; _id?: string }>;
    tradeLanes?: Array<{ originPortCode?: string; destPortCode?: string; baseTransitDays?: number; distanceNm?: number; laneCode?: string }>;
  }
): { routes: RouteOption[]; recommendedRoute: RouteOption } {
  // Normalize ports
  const originClean = origin.includes('Chennai') || origin === 'INMAA' ? 'Chennai' : origin;
  const destClean = destination.includes('Singapore') || destination === 'SGSIN' ? 'Singapore' : destination;

  // Base pricing scaling by container type
  const containerMultiplier = containerType === '20FT' ? 0.75 : containerType === '40HC' || containerType === '45HC' ? 1.15 : 1.0;

  // Check if there is a direct custom tradeLane in master data
  const matchingLane = customOptions?.tradeLanes?.find(
    (l) =>
      (origin.includes(l.originPortCode || '') || l.originPortCode?.includes(origin)) &&
      (destination.includes(l.destPortCode || '') || l.destPortCode?.includes(destination))
  );

  const availableCarriers = customOptions?.carriers && customOptions.carriers.length > 0
    ? customOptions.carriers
    : [
        { _id: 'car-1', carrierCode: 'ABCS', carrierName: 'ABC Shipping', reliabilityScore: 96 },
        { _id: 'car-2', carrierCode: 'XYZS', carrierName: 'XYZ Shipping', reliabilityScore: 90 },
        { _id: 'car-3', carrierCode: 'MAEU', carrierName: 'Maersk Line', reliabilityScore: 93 },
      ];

  const primaryCarrier = availableCarriers[0] || { _id: 'car-1', carrierCode: 'ABCS', carrierName: 'ABC Shipping', reliabilityScore: 96 };
  const secondaryCarrier = availableCarriers[1] || { _id: 'car-2', carrierCode: 'XYZS', carrierName: 'XYZ Shipping', reliabilityScore: 90 };
  const tertiaryCarrier = availableCarriers[2] || { _id: 'car-3', carrierCode: 'MAEU', carrierName: 'Maersk Line', reliabilityScore: 92 };

  let routes: RouteOption[] = [];

  if (matchingLane) {
    const laneTransit = Number(matchingLane.baseTransitDays) || 7;
    routes = [
      {
        id: 'R-A',
        name: 'Route A (Master Direct)',
        path: `${origin} → ${destination}`,
        transitDays: laneTransit,
        transshipmentType: 'Direct',
        carrierId: primaryCarrier._id || 'car-1',
        carrierName: primaryCarrier.carrierName || 'ABC Shipping',
        carrierCode: primaryCarrier.carrierCode || 'ABCS',
        reliabilityScore: primaryCarrier.reliabilityScore || 96,
        co2EmissionsKg: laneTransit * 60,
        baseFreightCostUsd: Math.round((950 + laneTransit * 45) * containerMultiplier),
        isRecommended: true,
        recommendationReason: `Direct master corridor service (${laneTransit} days) via ${primaryCarrier.carrierName}`,
        stops: [`${origin} Port`, `${destination} Port`],
      },
      {
        id: 'R-B',
        name: 'Route B (Hub Option)',
        path: `${origin} → Colombo → ${destination}`,
        transitDays: laneTransit + 2,
        transshipmentType: 'Via Colombo',
        carrierId: secondaryCarrier._id || 'car-2',
        carrierName: secondaryCarrier.carrierName || 'XYZ Shipping',
        carrierCode: secondaryCarrier.carrierCode || 'XYZS',
        reliabilityScore: secondaryCarrier.reliabilityScore || 90,
        co2EmissionsKg: (laneTransit + 2) * 55,
        baseFreightCostUsd: Math.round((870 + laneTransit * 40) * containerMultiplier),
        isRecommended: false,
        recommendationReason: `Economical hub transshipment through Colombo`,
        stops: [`${origin} Port`, 'Port of Colombo (LKCMB)', `${destination} Port`],
      },
    ];
  } else if (originClean === 'Chennai' && destClean === 'Singapore') {
    routes = [
      {
        id: 'R-A',
        name: 'Route A',
        path: 'Chennai → Singapore',
        transitDays: 6,
        transshipmentType: 'Direct',
        carrierId: primaryCarrier._id || 'car-1',
        carrierName: primaryCarrier.carrierName || 'ABC Shipping',
        carrierCode: primaryCarrier.carrierCode || 'ABCS',
        reliabilityScore: primaryCarrier.reliabilityScore || 96,
        co2EmissionsKg: 410,
        baseFreightCostUsd: Math.round(1280 * containerMultiplier),
        isRecommended: true,
        recommendationReason: 'Optimal Transit Time (6 Days), Zero Transshipment Risk, Highest On-Time Reliability (96%)',
        stops: ['Chennai Port (INMAA)', 'Port of Singapore (SGSIN)'],
      },
      {
        id: 'R-B',
        name: 'Route B',
        path: 'Chennai → Colombo → Singapore',
        transitDays: 8,
        transshipmentType: 'Via Colombo',
        carrierId: secondaryCarrier._id || 'car-2',
        carrierName: secondaryCarrier.carrierName || 'XYZ Shipping',
        carrierCode: secondaryCarrier.carrierCode || 'XYZS',
        reliabilityScore: secondaryCarrier.reliabilityScore || 89,
        co2EmissionsKg: 495,
        baseFreightCostUsd: Math.round(1150 * containerMultiplier),
        isRecommended: false,
        recommendationReason: 'Economical alternative with 1 transshipment in Colombo (+2 days dwell)',
        stops: ['Chennai Port (INMAA)', 'Port of Colombo (LKCMB)', 'Port of Singapore (SGSIN)'],
      },
      {
        id: 'R-C',
        name: 'Route C',
        path: 'Chennai → Dubai → Singapore',
        transitDays: 12,
        transshipmentType: 'Via Dubai',
        carrierId: tertiaryCarrier._id || 'car-3',
        carrierName: tertiaryCarrier.carrierName || 'Maersk Line',
        carrierCode: tertiaryCarrier.carrierCode || 'MAEU',
        reliabilityScore: tertiaryCarrier.reliabilityScore || 92,
        co2EmissionsKg: 730,
        baseFreightCostUsd: Math.round(1420 * containerMultiplier),
        isRecommended: false,
        recommendationReason: 'Extended Middle-East feeder connection (+6 days dwell & bunker surcharge)',
        stops: ['Chennai Port (INMAA)', 'Jebel Ali Port (AEJEA)', 'Port of Singapore (SGSIN)'],
      },
    ];
  } else if (originClean === 'Chennai' && (destClean.includes('Dubai') || destClean === 'AEJEA')) {
    routes = [
      {
        id: 'R-A',
        name: 'Route A',
        path: 'Chennai → Dubai',
        transitDays: 9,
        transshipmentType: 'Direct',
        carrierId: secondaryCarrier._id || 'car-2',
        carrierName: secondaryCarrier.carrierName || 'XYZ Shipping',
        carrierCode: secondaryCarrier.carrierCode || 'XYZS',
        reliabilityScore: secondaryCarrier.reliabilityScore || 93,
        co2EmissionsKg: 580,
        baseFreightCostUsd: Math.round(1450 * containerMultiplier),
        isRecommended: true,
        recommendationReason: 'Direct Westbound Express to Jebel Ali (9 Days)',
        stops: ['Chennai Port (INMAA)', 'Jebel Ali Port (AEJEA)'],
      },
      {
        id: 'R-B',
        name: 'Route B',
        path: 'Chennai → Colombo → Dubai',
        transitDays: 11,
        transshipmentType: 'Via Colombo',
        carrierId: primaryCarrier._id || 'car-1',
        carrierName: primaryCarrier.carrierName || 'ABC Shipping',
        carrierCode: primaryCarrier.carrierCode || 'ABCS',
        reliabilityScore: primaryCarrier.reliabilityScore || 91,
        co2EmissionsKg: 640,
        baseFreightCostUsd: Math.round(1320 * containerMultiplier),
        isRecommended: false,
        recommendationReason: 'Transshipment through Colombo Hub (+2 days transit)',
        stops: ['Chennai Port (INMAA)', 'Port of Colombo (LKCMB)', 'Jebel Ali Port (AEJEA)'],
      },
    ];
  } else {
    // Dynamic generated routes for any corridor
    const baseDays = destClean.includes('Rotterdam') ? 22 : destClean.includes('Dubai') ? 9 : 7;
    routes = [
      {
        id: 'R-A',
        name: 'Route A (Direct)',
        path: `${originClean} → ${destClean}`,
        transitDays: baseDays,
        transshipmentType: 'Direct',
        carrierId: primaryCarrier._id || 'car-1',
        carrierName: primaryCarrier.carrierName || 'ABC Shipping',
        carrierCode: primaryCarrier.carrierCode || 'ABCS',
        reliabilityScore: primaryCarrier.reliabilityScore || 95,
        co2EmissionsKg: baseDays * 65,
        baseFreightCostUsd: Math.round((950 + baseDays * 40) * containerMultiplier),
        isRecommended: true,
        recommendationReason: `Fastest Direct Service (${baseDays} Days) with ${primaryCarrier.carrierName}`,
        stops: [`${originClean} Port`, `${destClean} Port`],
      },
      {
        id: 'R-B',
        name: 'Route B (Hub Feeder)',
        path: `${originClean} → Colombo → ${destClean}`,
        transitDays: baseDays + 3,
        transshipmentType: 'Via Colombo',
        carrierId: secondaryCarrier._id || 'car-2',
        carrierName: secondaryCarrier.carrierName || 'XYZ Shipping',
        carrierCode: secondaryCarrier.carrierCode || 'XYZS',
        reliabilityScore: secondaryCarrier.reliabilityScore || 90,
        co2EmissionsKg: (baseDays + 3) * 60,
        baseFreightCostUsd: Math.round((860 + baseDays * 36) * containerMultiplier),
        isRecommended: false,
        recommendationReason: `Cost-optimized transshipment via Port of Colombo with ${secondaryCarrier.carrierName}`,
        stops: [`${originClean} Port`, 'Port of Colombo (LKCMB)', `${destClean} Port`],
      },
    ];
  }

  const recommendedRoute = routes.find((r) => r.isRecommended) || routes[0];
  return { routes, recommendedRoute };
}

// Initial Shipments Seed Database (Aligned with Milestone 1 & 2 requirements)
export const INITIAL_SHIPMENTS: ShipmentRecord[] = [
  {
    id: 'SHP001',
    customerId: 'C001',
    customerName: 'ABC Logistics',
    originPort: 'Chennai',
    originCode: 'INMAA',
    destinationPort: 'Singapore',
    destinationCode: 'SGSIN',
    cargoType: 'Electronics',
    containerType: '40FT',
    shipmentDate: '2026-08-25',
    status: 'ROUTE_READY',
    createdAt: '2026-08-16',
    routeOptions: [
      {
        id: 'R-A',
        name: 'Route A',
        path: 'Chennai → Singapore',
        transitDays: 6,
        transshipmentType: 'Direct',
        carrierId: 'car-1',
        carrierName: 'ABC Shipping',
        carrierCode: 'ABCS',
        reliabilityScore: 96,
        co2EmissionsKg: 410,
        baseFreightCostUsd: 1280,
        isRecommended: true,
        recommendationReason: 'Optimal Transit Time (6 Days), Zero Transshipment Risk, Highest On-Time Reliability (96%)',
        stops: ['Chennai Port (INMAA)', 'Port of Singapore (SGSIN)'],
      },
      {
        id: 'R-B',
        name: 'Route B',
        path: 'Chennai → Colombo → Singapore',
        transitDays: 8,
        transshipmentType: 'Via Colombo',
        carrierId: 'car-2',
        carrierName: 'XYZ Shipping',
        carrierCode: 'XYZS',
        reliabilityScore: 89,
        co2EmissionsKg: 495,
        baseFreightCostUsd: 1150,
        isRecommended: false,
        recommendationReason: 'Economical alternative with 1 transshipment in Colombo (+2 days dwell)',
        stops: ['Chennai Port (INMAA)', 'Port of Colombo (LKCMB)', 'Port of Singapore (SGSIN)'],
      },
      {
        id: 'R-C',
        name: 'Route C',
        path: 'Chennai → Dubai → Singapore',
        transitDays: 12,
        transshipmentType: 'Via Dubai',
        carrierId: 'car-3',
        carrierName: 'Maersk Line',
        carrierCode: 'MAEU',
        reliabilityScore: 92,
        co2EmissionsKg: 730,
        baseFreightCostUsd: 1420,
        isRecommended: false,
        recommendationReason: 'Extended Middle-East feeder connection (+6 days dwell & bunker surcharge)',
        stops: ['Chennai Port (INMAA)', 'Jebel Ali Port (AEJEA)', 'Port of Singapore (SGSIN)'],
      },
    ],
    recommendedRoute: {
      id: 'R-A',
      name: 'Route A',
      path: 'Chennai → Singapore',
      transitDays: 6,
      transshipmentType: 'Direct',
      carrierId: 'car-1',
      carrierName: 'ABC Shipping',
      carrierCode: 'ABCS',
      reliabilityScore: 96,
      co2EmissionsKg: 410,
      baseFreightCostUsd: 1280,
      isRecommended: true,
      recommendationReason: 'Optimal Transit Time (6 Days), Zero Transshipment Risk, Highest On-Time Reliability (96%)',
      stops: ['Chennai Port (INMAA)', 'Port of Singapore (SGSIN)'],
    },
    selectedRoute: {
      id: 'R-A',
      name: 'Route A',
      path: 'Chennai → Singapore',
      transitDays: 6,
      transshipmentType: 'Direct',
      carrierId: 'car-1',
      carrierName: 'ABC Shipping',
      carrierCode: 'ABCS',
      reliabilityScore: 96,
      co2EmissionsKg: 410,
      baseFreightCostUsd: 1280,
      isRecommended: true,
      recommendationReason: 'Optimal Transit Time (6 Days), Zero Transshipment Risk, Highest On-Time Reliability (96%)',
      stops: ['Chennai Port (INMAA)', 'Port of Singapore (SGSIN)'],
    },
    quotation: {
      quoteId: 'Q001',
      freightCostUsd: 1280,
      operationalCostUsd: 100,
      marginPct: 15,
      marginAmountUsd: 207,
      finalQuoteUsd: 1587,
      status: 'GENERATED',
      generatedAt: '2026-08-16',
      validUntil: '2026-08-31',
    },
  },
  {
    id: 'SHP002',
    customerId: 'C002',
    customerName: 'XYZ Logistics',
    originPort: 'Chennai',
    originCode: 'INMAA',
    destinationPort: 'Dubai',
    destinationCode: 'AEJEA',
    cargoType: 'General Cargo',
    containerType: '20FT',
    shipmentDate: '2026-08-28',
    status: 'ROUTE_PROCESSING',
    createdAt: '2026-08-16',
    routeOptions: [
      {
        id: 'R-A',
        name: 'Route A',
        path: 'Chennai → Dubai',
        transitDays: 9,
        transshipmentType: 'Direct',
        carrierId: 'car-2',
        carrierName: 'XYZ Shipping',
        carrierCode: 'XYZS',
        reliabilityScore: 93,
        co2EmissionsKg: 580,
        baseFreightCostUsd: 1100,
        isRecommended: true,
        recommendationReason: 'Direct Westbound Express to Jebel Ali (9 Days)',
        stops: ['Chennai Port (INMAA)', 'Jebel Ali Port (AEJEA)'],
      },
    ],
    recommendedRoute: {
      id: 'R-A',
      name: 'Route A',
      path: 'Chennai → Dubai',
      transitDays: 9,
      transshipmentType: 'Direct',
      carrierId: 'car-2',
      carrierName: 'XYZ Shipping',
      carrierCode: 'XYZS',
      reliabilityScore: 93,
      co2EmissionsKg: 580,
      baseFreightCostUsd: 1100,
      isRecommended: true,
      recommendationReason: 'Direct Westbound Express to Jebel Ali (9 Days)',
      stops: ['Chennai Port (INMAA)', 'Jebel Ali Port (AEJEA)'],
    },
  },
  {
    id: 'SHP003',
    customerId: 'C001',
    customerName: 'ABC Logistics',
    originPort: 'Chennai',
    originCode: 'INMAA',
    destinationPort: 'Colombo',
    destinationCode: 'LKCMB',
    cargoType: 'Dry Bulk',
    containerType: '40FT',
    shipmentDate: '2026-08-30',
    status: 'ROUTE_READY',
    createdAt: '2026-08-15',
    routeOptions: [
      {
        id: 'R-A',
        name: 'Route A (Direct Feeder)',
        path: 'Chennai → Colombo',
        transitDays: 3,
        transshipmentType: 'Direct',
        carrierId: 'car-1',
        carrierName: 'ABC Shipping',
        carrierCode: 'ABCS',
        reliabilityScore: 97,
        co2EmissionsKg: 180,
        baseFreightCostUsd: 720,
        isRecommended: true,
        recommendationReason: 'High frequency direct feeder connection (3 Days)',
        stops: ['Chennai Port (INMAA)', 'Port of Colombo (LKCMB)'],
      },
    ],
    recommendedRoute: {
      id: 'R-A',
      name: 'Route A (Direct Feeder)',
      path: 'Chennai → Colombo',
      transitDays: 3,
      transshipmentType: 'Direct',
      carrierId: 'car-1',
      carrierName: 'ABC Shipping',
      carrierCode: 'ABCS',
      reliabilityScore: 97,
      co2EmissionsKg: 180,
      baseFreightCostUsd: 720,
      isRecommended: true,
      recommendationReason: 'High frequency direct feeder connection (3 Days)',
      stops: ['Chennai Port (INMAA)', 'Port of Colombo (LKCMB)'],
    },
  },
  {
    id: 'SHP004',
    customerId: 'C003',
    customerName: 'Global Freight Corp',
    originPort: 'Chennai',
    originCode: 'INMAA',
    destinationPort: 'Rotterdam',
    destinationCode: 'NLRTM',
    cargoType: 'Automotive',
    containerType: '40HC',
    shipmentDate: '2026-09-02',
    status: 'APPROVED',
    createdAt: '2026-08-14',
    routeOptions: [
      {
        id: 'R-A',
        name: 'Route A (Suez Express)',
        path: 'Chennai → Rotterdam',
        transitDays: 22,
        transshipmentType: 'Direct',
        carrierId: 'car-3',
        carrierName: 'Maersk Line',
        carrierCode: 'MAEU',
        reliabilityScore: 94,
        co2EmissionsKg: 1420,
        baseFreightCostUsd: 2140,
        isRecommended: true,
        recommendationReason: 'Fastest Europe Service via Suez Canal',
        stops: ['Chennai Port (INMAA)', 'Port of Rotterdam (NLRTM)'],
      },
    ],
    recommendedRoute: {
      id: 'R-A',
      name: 'Route A (Suez Express)',
      path: 'Chennai → Rotterdam',
      transitDays: 22,
      transshipmentType: 'Direct',
      carrierId: 'car-3',
      carrierName: 'Maersk Line',
      carrierCode: 'MAEU',
      reliabilityScore: 94,
      co2EmissionsKg: 1420,
      baseFreightCostUsd: 2140,
      isRecommended: true,
      recommendationReason: 'Fastest Europe Service via Suez Canal',
      stops: ['Chennai Port (INMAA)', 'Port of Rotterdam (NLRTM)'],
    },
    quotation: {
      quoteId: 'Q002',
      freightCostUsd: 2140,
      operationalCostUsd: 140,
      marginPct: 14,
      marginAmountUsd: 319,
      finalQuoteUsd: 2599,
      status: 'APPROVED',
      generatedAt: '2026-08-14',
      approvedAt: '2026-08-15',
      validUntil: '2026-08-31',
    },
  },
];
