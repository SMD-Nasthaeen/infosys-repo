// Master Data Collections for FreightQuote AI (MongoDB Collections)
// Admin-managed collections referenced by the quotation engine

export interface Customer {
  _id: string;
  customerCode: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  tier: 'STANDARD' | 'SILVER' | 'GOLD' | 'ENTERPRISE';
  primaryHub: string;
  defaultPaymentTerms: string;
  isActive: boolean;
}

export interface Country {
  _id: string;
  countryCode: string;
  countryName: string;
  iso3: string;
  region: 'Asia' | 'Europe' | 'NAM' | 'LATAM' | 'MEA';
  currencyCode: string;
  dialCode: string;
  customsUnion: 'EU' | 'GCC' | 'USMCA' | 'NAFTA' | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Port {
  _id: string;
  unlocode: string;
  portName: string;
  portType: 'SEAPORT' | 'AIRPORT' | 'ICD' | 'RAIL';
  iataCode?: string;
  city: string;
  countryCode: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  timezone: string;
  maxVesselDraftM?: number;
  terminals: string[];
  customsOffice: string;
  avgDwellTimeHrs: number;
  congestionIndex: number;
  isActive: boolean;
}

export interface TradeLane {
  _id: string;
  laneCode: string; // e.g. INNSA-AEJEA-OCEAN
  originPortCode: string;
  destPortCode: string;
  mode: 'OCEAN' | 'AIR' | 'GROUND' | 'EXPRESS';
  distanceNm: number;
  baseTransitDays: number;
  transhipmentPorts: string[];
  canalsCrossed: string[];
  riskZones: string[];
  isActive: boolean;
}

export interface Carrier {
  _id: string;
  carrierCode: string; // SCAC / IATA
  carrierName: string;
  mode: 'OCEAN' | 'AIR' | 'GROUND';
  serviceTypes: string[];
  reliabilityScore: number; // 0-100
  contractTier: 'SPOT' | 'CONTRACT' | 'NVOCC';
  apiEnabled: boolean;
  contactEmail: string;
  isActive: boolean;
}

export interface ServiceType {
  _id: string;
  code: string;
  label: string;
  mode: 'OCEAN' | 'AIR' | 'GROUND';
  volumetricDivisor: number; // 6000 air, 1000 ocean LCL
  minChargeableKg: number;
  defaultTransitDays: number;
  sortOrder: number;
  isActive: boolean;
}

export interface ContainerType {
  _id: string;
  code: string;
  description: string;
  teu: number;
  internalLengthM: number;
  internalWidthM: number;
  internalHeightM: number;
  maxPayloadKg: number;
  capacityCbm: number;
  isReefer: boolean;
  isActive: boolean;
}

export interface CargoType {
  _id: string;
  code: string;
  label: string;
  isHazardous: boolean;
  imoClass?: string | null;
  requiresTempControl: boolean;
  tempRangeC?: { min: number; max: number } | null;
  handlingSurchargePct: number;
  restrictedCountries: string[];
  isActive: boolean;
}

export interface Commodity {
  _id: string;
  hsCode: string;
  description: string;
  cargoTypeCode: string;
  defaultDutyPct: number;
  requiresLicense: boolean;
  isActive: boolean;
}

export interface PackagingType {
  _id: string;
  code: string;
  label: string;
  defaultTareKg: number;
  stackable: boolean;
  isActive: boolean;
}

export interface IncotermMaster {
  _id: string;
  code: string;
  label: string;
  version: string;
  freightPaidBy: 'SHIPPER' | 'CONSIGNEE';
  insurancePaidBy: 'SHIPPER' | 'CONSIGNEE';
  originChargesIncluded: boolean;
  destChargesIncluded: boolean;
  isActive: boolean;
}

export interface ChargeHead {
  _id: string;
  code: string;
  label: string;
  category: 'ORIGIN' | 'FREIGHT' | 'DEST' | 'CUSTOMS';
  calcBasis: 'PER_CONTAINER' | 'PER_KG' | 'PER_CBM' | 'PER_SHIPMENT' | 'PERCENT';
  defaultValue: number;
  currency: string;
  taxable: boolean;
  isActive: boolean;
}

export interface Currency {
  _id: string;
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  isBaseCurrency: boolean;
  isActive: boolean;
}

export interface ExchangeRate {
  _id: string;
  baseCurrency: string;
  quoteCurrency: string;
  rate: number;
  effectiveFrom: string;
  effectiveTo: string;
  source: string;
}

export interface RateCardMaster {
  _id: string;
  rateCardId: string;
  laneCode: string;
  carrierCode: string;
  serviceTypeCode: string;
  containerTypeCode?: string | null;
  baseRate: number;
  currency: string;
  rateUnit: 'PER_CONTAINER' | 'PER_KG' | 'PER_CBM';
  charges: Array<{ chargeCode: string; value: number }>;
  validFrom: string;
  validTo: string;
  isActive: boolean;
}

export interface SurchargeRule {
  _id: string;
  ruleCode: string;
  label: string;
  appliesTo: {
    mode?: string | null;
    laneCode?: string | null;
    cargoTypeCode?: string | null;
    portCode?: string | null;
  };
  triggerCondition: string;
  valueType: 'FLAT' | 'PERCENT';
  value: number;
  currency?: string | null;
  priority: number;
  isActive: boolean;
}

export interface MarginRule {
  _id: string;
  ruleCode: string;
  customerTier: 'STANDARD' | 'SILVER' | 'GOLD' | 'ENTERPRISE';
  mode?: string | null;
  laneCode?: string | null;
  marginType: 'PERCENT' | 'FLAT';
  marginValue: number;
  minMarginUsd: number;
  maxDiscountPct: number;
  isActive: boolean;
}

export interface CustomsTariff {
  _id: string;
  countryCode: string;
  hsCode: string;
  dutyPct: number;
  vatPct: number;
  otherLevies: Array<{ name: string; pct: number }>;
  requiredDocs: string[];
  effectiveFrom: string;
  isActive: boolean;
}

export interface DocumentType {
  _id: string;
  code: string;
  label: string;
  issuedBy: 'SHIPPER' | 'CARRIER' | 'AUTHORITY';
  mandatoryFor: string[];
  isActive: boolean;
}

export interface CustomerTier {
  _id: string;
  code: string;
  label: string;
  minAnnualVolumeTeu: number;
  discountPct: number;
  creditDays: number;
  slaResponseHrs: number;
  isActive: boolean;
}

export interface MasterDataAudit {
  _id: string;
  collectionName: string;
  recordId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'ACTIVATE';
  changedFields: Record<string, { old: any; new: any }>;
  performedBy: string;
  performedAt: string;
  ipAddress: string;
}

// Initial Master Data Seed Arrays from Technical PDF Reference
export const INITIAL_CUSTOMERS: Customer[] = [
  { _id: 'cust-1', customerCode: 'C001', companyName: 'ABC Logistics', contactName: 'Rajesh Sharma', email: 'ops@abclogistics.com', phone: '+91 44 2836 1100', tier: 'GOLD', primaryHub: 'Chennai (INMAA)', defaultPaymentTerms: 'Net 30', isActive: true },
  { _id: 'cust-2', customerCode: 'C002', companyName: 'XYZ Logistics', contactName: 'Ananya Verma', email: 'supply@xyzlogistics.com', phone: '+91 22 6780 4321', tier: 'STANDARD', primaryHub: 'Nhava Sheva (INNSA)', defaultPaymentTerms: 'Net 15', isActive: true },
  { _id: 'cust-3', customerCode: 'C003', companyName: 'Global Freight Corp', contactName: 'Tariq Al-Mansoor', email: 'charters@globalfreight.com', phone: '+971 4 881 2900', tier: 'ENTERPRISE', primaryHub: 'Jebel Ali (AEJEA)', defaultPaymentTerms: 'Net 60', isActive: true },
  { _id: 'cust-4', customerCode: 'C004', companyName: 'Apex Cargo Solutions', contactName: 'Lars Van Der Berg', email: 'booking@apexcargo.com', phone: '+31 10 798 5500', tier: 'SILVER', primaryHub: 'Rotterdam (NLRTM)', defaultPaymentTerms: 'Net 30', isActive: true },
];

export const INITIAL_COUNTRIES: Country[] = [
  { _id: 'c-1', countryCode: 'IN', countryName: 'India', iso3: 'IND', region: 'Asia', currencyCode: 'INR', dialCode: '+91', customsUnion: null, isActive: true },
  { _id: 'c-2', countryCode: 'AE', countryName: 'United Arab Emirates', iso3: 'ARE', region: 'MEA', currencyCode: 'AED', dialCode: '+971', customsUnion: 'GCC', isActive: true },
  { _id: 'c-3', countryCode: 'SG', countryName: 'Singapore', iso3: 'SGP', region: 'Asia', currencyCode: 'SGD', dialCode: '+65', customsUnion: null, isActive: true },
  { _id: 'c-4', countryCode: 'NL', countryName: 'Netherlands', iso3: 'NLD', region: 'Europe', currencyCode: 'EUR', dialCode: '+31', customsUnion: 'EU', isActive: true },
  { _id: 'c-5', countryCode: 'LK', countryName: 'Sri Lanka', iso3: 'LKA', region: 'Asia', currencyCode: 'LKR', dialCode: '+94', customsUnion: null, isActive: true },
  { _id: 'c-6', countryCode: 'US', countryName: 'United States', iso3: 'USA', region: 'NAM', currencyCode: 'USD', dialCode: '+1', customsUnion: 'USMCA', isActive: true },
];

export const INITIAL_PORTS: Port[] = [
  {
    _id: 'p-1',
    unlocode: 'INMAA',
    portName: 'Chennai Port',
    portType: 'SEAPORT',
    city: 'Chennai',
    countryCode: 'IN',
    location: { type: 'Point', coordinates: [80.2924, 13.0975] },
    timezone: 'Asia/Kolkata',
    maxVesselDraftM: 16.5,
    terminals: ['CCTL', 'CITPL'],
    customsOffice: 'INMAA1',
    avgDwellTimeHrs: 62,
    congestionIndex: 0.42,
    isActive: true,
  },
  {
    _id: 'p-2',
    unlocode: 'SGSIN',
    portName: 'Port of Singapore',
    portType: 'SEAPORT',
    city: 'Singapore',
    countryCode: 'SG',
    location: { type: 'Point', coordinates: [103.8198, 1.2644] },
    timezone: 'Asia/Singapore',
    maxVesselDraftM: 18.0,
    terminals: ['Tuas', 'Pasir Panjang'],
    customsOffice: 'SGSIN1',
    avgDwellTimeHrs: 24,
    congestionIndex: 0.18,
    isActive: true,
  },
  {
    _id: 'p-3',
    unlocode: 'AEJEA',
    portName: 'Jebel Ali Port (Dubai)',
    portType: 'SEAPORT',
    city: 'Dubai',
    countryCode: 'AE',
    location: { type: 'Point', coordinates: [55.0272, 25.011] },
    timezone: 'Asia/Dubai',
    maxVesselDraftM: 17.0,
    terminals: ['T1', 'T2', 'T3'],
    customsOffice: 'AEJEA1',
    avgDwellTimeHrs: 30,
    congestionIndex: 0.21,
    isActive: true,
  },
  {
    _id: 'p-4',
    unlocode: 'LKCMB',
    portName: 'Port of Colombo',
    portType: 'SEAPORT',
    city: 'Colombo',
    countryCode: 'LK',
    location: { type: 'Point', coordinates: [79.8612, 6.9271] },
    timezone: 'Asia/Colombo',
    maxVesselDraftM: 18.0,
    terminals: ['JCT', 'SAGT', 'CICT'],
    customsOffice: 'LKCMB1',
    avgDwellTimeHrs: 28,
    congestionIndex: 0.25,
    isActive: true,
  },
  {
    _id: 'p-5',
    unlocode: 'NLRTM',
    portName: 'Port of Rotterdam',
    portType: 'SEAPORT',
    city: 'Rotterdam',
    countryCode: 'NL',
    location: { type: 'Point', coordinates: [4.142, 51.949] },
    timezone: 'Europe/Amsterdam',
    maxVesselDraftM: 24.0,
    terminals: ['Maasvlakte II', 'Euromax'],
    customsOffice: 'NLRTM1',
    avgDwellTimeHrs: 36,
    congestionIndex: 0.33,
    isActive: true,
  },
  {
    _id: 'p-6',
    unlocode: 'INNSA',
    portName: 'Jawaharlal Nehru Port (Nhava Sheva)',
    portType: 'SEAPORT',
    city: 'Navi Mumbai',
    countryCode: 'IN',
    location: { type: 'Point', coordinates: [72.949, 18.949] },
    timezone: 'Asia/Kolkata',
    maxVesselDraftM: 15.0,
    terminals: ['NSICT', 'BMCT', 'GTI'],
    customsOffice: 'INNSA1',
    avgDwellTimeHrs: 48,
    congestionIndex: 0.55,
    isActive: true,
  },
  {
    _id: 'p-7',
    unlocode: 'MAA',
    portName: 'Chennai International Airport',
    portType: 'AIRPORT',
    iataCode: 'MAA',
    city: 'Chennai',
    countryCode: 'IN',
    location: { type: 'Point', coordinates: [80.1709, 12.9941] },
    timezone: 'Asia/Kolkata',
    terminals: ['Cargo Terminal 1'],
    customsOffice: 'INMAA4',
    avgDwellTimeHrs: 8,
    congestionIndex: 0.15,
    isActive: true,
  },
  {
    _id: 'p-8',
    unlocode: 'DXB',
    portName: 'Dubai International Airport',
    portType: 'AIRPORT',
    iataCode: 'DXB',
    city: 'Dubai',
    countryCode: 'AE',
    location: { type: 'Point', coordinates: [55.3644, 25.2532] },
    timezone: 'Asia/Dubai',
    terminals: ['Cargo Mega Terminal'],
    customsOffice: 'AEDXB4',
    avgDwellTimeHrs: 6,
    congestionIndex: 0.12,
    isActive: true,
  },
];

export const INITIAL_TRADE_LANES: TradeLane[] = [
  { _id: 'tl-1', laneCode: 'INMAA-SGSIN-OCEAN', originPortCode: 'INMAA', destPortCode: 'SGSIN', mode: 'OCEAN', distanceNm: 1560, baseTransitDays: 6, transhipmentPorts: [], canalsCrossed: [], riskZones: [], isActive: true },
  { _id: 'tl-2', laneCode: 'INMAA-LKCMB-SGSIN', originPortCode: 'INMAA', destPortCode: 'SGSIN', mode: 'OCEAN', distanceNm: 1820, baseTransitDays: 8, transhipmentPorts: ['LKCMB'], canalsCrossed: [], riskZones: [], isActive: true },
  { _id: 'tl-3', laneCode: 'INMAA-AEJEA-SGSIN', originPortCode: 'INMAA', destPortCode: 'SGSIN', mode: 'OCEAN', distanceNm: 3400, baseTransitDays: 12, transhipmentPorts: ['AEJEA'], canalsCrossed: [], riskZones: [], isActive: true },
  { _id: 'tl-4', laneCode: 'INMAA-AEJEA-OCEAN', originPortCode: 'INMAA', destPortCode: 'AEJEA', mode: 'OCEAN', distanceNm: 2100, baseTransitDays: 9, transhipmentPorts: [], canalsCrossed: [], riskZones: [], isActive: true },
  { _id: 'tl-5', laneCode: 'INNSA-AEJEA-OCEAN', originPortCode: 'INNSA', destPortCode: 'AEJEA', mode: 'OCEAN', distanceNm: 1080, baseTransitDays: 5, transhipmentPorts: [], canalsCrossed: [], riskZones: [], isActive: true },
  { _id: 'tl-6', laneCode: 'INNSA-NLRTM-OCEAN', originPortCode: 'INNSA', destPortCode: 'NLRTM', mode: 'OCEAN', distanceNm: 6350, baseTransitDays: 22, transhipmentPorts: ['AEJEA'], canalsCrossed: ['SUEZ'], riskZones: ['RED_SEA'], isActive: true },
];

export const INITIAL_CARRIERS: Carrier[] = [
  { _id: 'car-1', carrierCode: 'ABCS', carrierName: 'ABC Shipping', mode: 'OCEAN', serviceTypes: ['Direct Express', 'FCL', 'LCL'], reliabilityScore: 96, contractTier: 'CONTRACT', apiEnabled: true, contactEmail: 'lineops@abcshipping.example', isActive: true },
  { _id: 'car-2', carrierCode: 'XYZS', carrierName: 'XYZ Shipping', mode: 'OCEAN', serviceTypes: ['Transshipment Loop', 'FCL', 'Breakbulk'], reliabilityScore: 91, contractTier: 'CONTRACT', apiEnabled: true, contactEmail: 'quotes@xyzshipping.example', isActive: true },
  { _id: 'car-3', carrierCode: 'MAEU', carrierName: 'Maersk Line', mode: 'OCEAN', serviceTypes: ['FCL', 'LCL', 'Reefer'], reliabilityScore: 94, contractTier: 'CONTRACT', apiEnabled: true, contactEmail: 'booking@maersk.example', isActive: true },
  { _id: 'car-4', carrierCode: 'MSCU', carrierName: 'MSC Mediterranean', mode: 'OCEAN', serviceTypes: ['FCL', 'LCL', 'REEFER'], reliabilityScore: 93, contractTier: 'CONTRACT', apiEnabled: true, contactEmail: 'ops@msc.example', isActive: true },
  { _id: 'car-5', carrierCode: 'CMDU', carrierName: 'CMA CGM', mode: 'OCEAN', serviceTypes: ['FCL', 'REEFER'], reliabilityScore: 89, contractTier: 'SPOT', apiEnabled: false, contactEmail: 'quotes@cmacgm.example', isActive: true },
  { _id: 'car-6', carrierCode: 'EK', carrierName: 'Emirates SkyCargo', mode: 'AIR', serviceTypes: ['AIR_GEN', 'AIR_EXPRESS'], reliabilityScore: 91, contractTier: 'CONTRACT', apiEnabled: true, contactEmail: 'cargo@ek.example', isActive: true },
];

export const INITIAL_SERVICE_TYPES: ServiceType[] = [
  { _id: 'st-1', code: 'FCL', label: 'Ocean Freight - FCL', mode: 'OCEAN', volumetricDivisor: 1000, minChargeableKg: 0, defaultTransitDays: 22, sortOrder: 1, isActive: true },
  { _id: 'st-2', code: 'LCL', label: 'Ocean Freight - LCL', mode: 'OCEAN', volumetricDivisor: 1000, minChargeableKg: 100, defaultTransitDays: 26, sortOrder: 2, isActive: true },
  { _id: 'st-3', code: 'AIR_GEN', label: 'Air Freight', mode: 'AIR', volumetricDivisor: 6000, minChargeableKg: 45, defaultTransitDays: 5, sortOrder: 3, isActive: true },
  { _id: 'st-4', code: 'AIR_EXPRESS', label: 'Express Air', mode: 'AIR', volumetricDivisor: 5000, minChargeableKg: 1, defaultTransitDays: 2, sortOrder: 4, isActive: true },
  { _id: 'st-5', code: 'GROUND', label: 'Ground & Rail', mode: 'GROUND', volumetricDivisor: 4000, minChargeableKg: 50, defaultTransitDays: 6, sortOrder: 5, isActive: true },
];

export const INITIAL_CONTAINER_TYPES: ContainerType[] = [
  { _id: 'ct-1', code: '20GP', description: '20ft General Purpose (20FT)', teu: 1, internalLengthM: 5.9, internalWidthM: 2.35, internalHeightM: 2.39, maxPayloadKg: 28200, capacityCbm: 33.2, isReefer: false, isActive: true },
  { _id: 'ct-2', code: '40GP', description: '40ft General Purpose (40FT)', teu: 2, internalLengthM: 12.03, internalWidthM: 2.35, internalHeightM: 2.39, maxPayloadKg: 26680, capacityCbm: 67.7, isReefer: false, isActive: true },
  { _id: 'ct-3', code: '40HC', description: '40ft High Cube (40HC)', teu: 2, internalLengthM: 12.03, internalWidthM: 2.35, internalHeightM: 2.69, maxPayloadKg: 26460, capacityCbm: 76.3, isReefer: false, isActive: true },
  { _id: 'ct-4', code: '20RF', description: '20ft Reefer', teu: 1, internalLengthM: 5.44, internalWidthM: 2.29, internalHeightM: 2.27, maxPayloadKg: 27400, capacityCbm: 28.3, isReefer: true, isActive: true },
  { _id: 'ct-5', code: '45HC', description: '45ft High Cube', teu: 2.25, internalLengthM: 13.56, internalWidthM: 2.35, internalHeightM: 2.69, maxPayloadKg: 27700, capacityCbm: 86.0, isReefer: false, isActive: true },
];

export const INITIAL_CARGO_TYPES: CargoType[] = [
  { _id: 'cg-1', code: 'ELEC', label: 'Electronics', isHazardous: false, imoClass: null, requiresTempControl: false, handlingSurchargePct: 0, restrictedCountries: [], isActive: true },
  { _id: 'cg-2', code: 'DRY', label: 'Dry Bulk', isHazardous: false, imoClass: null, requiresTempControl: false, handlingSurchargePct: 0, restrictedCountries: [], isActive: true },
  { _id: 'cg-3', code: 'GEN', label: 'General Cargo', isHazardous: false, imoClass: null, requiresTempControl: false, handlingSurchargePct: 0, restrictedCountries: [], isActive: true },
  { _id: 'cg-4', code: 'PERISH', label: 'Refrigerated / Perishable', isHazardous: false, imoClass: null, requiresTempControl: true, tempRangeC: { min: 2, max: 8 }, handlingSurchargePct: 12, restrictedCountries: [], isActive: true },
  { _id: 'cg-5', code: 'PHARMA', label: 'Pharmaceuticals', isHazardous: false, imoClass: null, requiresTempControl: true, tempRangeC: { min: -20, max: 8 }, handlingSurchargePct: 18, restrictedCountries: [], isActive: true },
  { _id: 'cg-6', code: 'DG3', label: 'Chemicals (Flammable Liquids)', isHazardous: true, imoClass: '3', requiresTempControl: false, handlingSurchargePct: 25, restrictedCountries: ['SG'], isActive: true },
  { _id: 'cg-7', code: 'AUTO', label: 'Automotive Parts', isHazardous: false, imoClass: null, requiresTempControl: false, handlingSurchargePct: 5, restrictedCountries: [], isActive: true },
];

export const INITIAL_COMMODITIES: Commodity[] = [
  { _id: 'com-1', hsCode: '620342', description: "Men's cotton trousers", cargoTypeCode: 'GEN', defaultDutyPct: 12.0, requiresLicense: false, isActive: true },
  { _id: 'com-2', hsCode: '870899', description: 'Motor vehicle parts, other', cargoTypeCode: 'AUTO', defaultDutyPct: 10.0, requiresLicense: false, isActive: true },
  { _id: 'com-3', hsCode: '300490', description: 'Medicaments, packaged doses', cargoTypeCode: 'PHARMA', defaultDutyPct: 5.0, requiresLicense: true, isActive: true },
  { _id: 'com-4', hsCode: '850760', description: 'Lithium-ion accumulators', cargoTypeCode: 'LIION', defaultDutyPct: 15.0, requiresLicense: true, isActive: true },
  { _id: 'com-5', hsCode: '080450', description: 'Mangoes, fresh or dried', cargoTypeCode: 'PERISH', defaultDutyPct: 30.0, requiresLicense: false, isActive: true },
];

export const INITIAL_PACKAGING_TYPES: PackagingType[] = [
  { _id: 'pkg-1', code: 'PLT_EUR', label: 'Euro Pallet (1200x800)', defaultTareKg: 25, stackable: true, isActive: true },
  { _id: 'pkg-2', code: 'PLT_STD', label: 'Standard Pallet (1200x1000)', defaultTareKg: 30, stackable: true, isActive: true },
  { _id: 'pkg-3', code: 'CTN', label: 'Carton Box', defaultTareKg: 0.5, stackable: true, isActive: true },
  { _id: 'pkg-4', code: 'CRATE', label: 'Wooden Crate', defaultTareKg: 40, stackable: false, isActive: true },
  { _id: 'pkg-5', code: 'DRUM', label: 'Steel Drum (200L)', defaultTareKg: 18, stackable: false, isActive: true },
];

export const INITIAL_INCOTERMS: IncotermMaster[] = [
  { _id: 'inc-1', code: 'EXW', label: 'Ex Works', version: '2020', freightPaidBy: 'CONSIGNEE', insurancePaidBy: 'CONSIGNEE', originChargesIncluded: false, destChargesIncluded: false, isActive: true },
  { _id: 'inc-2', code: 'FOB', label: 'Free On Board', version: '2020', freightPaidBy: 'CONSIGNEE', insurancePaidBy: 'CONSIGNEE', originChargesIncluded: true, destChargesIncluded: false, isActive: true },
  { _id: 'inc-3', code: 'CIF', label: 'Cost, Insurance and Freight', version: '2020', freightPaidBy: 'SHIPPER', insurancePaidBy: 'SHIPPER', originChargesIncluded: true, destChargesIncluded: false, isActive: true },
  { _id: 'inc-4', code: 'DAP', label: 'Delivered At Place', version: '2020', freightPaidBy: 'SHIPPER', insurancePaidBy: 'SHIPPER', originChargesIncluded: true, destChargesIncluded: true, isActive: true },
  { _id: 'inc-5', code: 'DDP', label: 'Delivered Duty Paid', version: '2020', freightPaidBy: 'SHIPPER', insurancePaidBy: 'SHIPPER', originChargesIncluded: true, destChargesIncluded: true, isActive: true },
];

export const INITIAL_CHARGE_HEADS: ChargeHead[] = [
  { _id: 'ch-1', code: 'OFR', label: 'Ocean Freight', category: 'FREIGHT', calcBasis: 'PER_CONTAINER', defaultValue: 950, currency: 'USD', taxable: false, isActive: true },
  { _id: 'ch-2', code: 'BAF', label: 'Bunker Adjustment Factor', category: 'FREIGHT', calcBasis: 'PER_CONTAINER', defaultValue: 180, currency: 'USD', taxable: false, isActive: true },
  { _id: 'ch-3', code: 'THC_O', label: 'Terminal Handling - Origin', category: 'ORIGIN', calcBasis: 'PER_CONTAINER', defaultValue: 8500, currency: 'INR', taxable: true, isActive: true },
  { _id: 'ch-4', code: 'THC_D', label: 'Terminal Handling - Destination', category: 'DEST', calcBasis: 'PER_CONTAINER', defaultValue: 210, currency: 'USD', taxable: true, isActive: true },
  { _id: 'ch-5', code: 'DOC', label: 'Documentation Fee', category: 'ORIGIN', calcBasis: 'PER_SHIPMENT', defaultValue: 3500, currency: 'INR', taxable: true, isActive: true },
  { _id: 'ch-6', code: 'CUSTCL', label: 'Customs Clearance', category: 'CUSTOMS', calcBasis: 'PER_SHIPMENT', defaultValue: 5000, currency: 'INR', taxable: true, isActive: true },
  { _id: 'ch-7', code: 'INS', label: 'Cargo Insurance', category: 'FREIGHT', calcBasis: 'PERCENT', defaultValue: 0.35, currency: 'USD', taxable: false, isActive: true },
];

export const INITIAL_CURRENCIES: Currency[] = [
  { _id: 'cur-1', code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2, isBaseCurrency: true, isActive: true },
  { _id: 'cur-2', code: 'INR', name: 'Indian Rupee', symbol: '₹', decimalPlaces: 2, isBaseCurrency: false, isActive: true },
  { _id: 'cur-3', code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2, isBaseCurrency: false, isActive: true },
  { _id: 'cur-4', code: 'AED', name: 'UAE Dirham', symbol: 'AED', decimalPlaces: 2, isBaseCurrency: false, isActive: true },
  { _id: 'cur-5', code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', decimalPlaces: 2, isBaseCurrency: false, isActive: true },
];

export const INITIAL_EXCHANGE_RATES: ExchangeRate[] = [
  { _id: 'fx-1', baseCurrency: 'USD', quoteCurrency: 'INR', rate: 87.42, effectiveFrom: '2026-08-01T00:00:00Z', effectiveTo: '2026-08-31T23:59:59Z', source: 'ADMIN' },
  { _id: 'fx-2', baseCurrency: 'USD', quoteCurrency: 'EUR', rate: 0.91, effectiveFrom: '2026-08-01T00:00:00Z', effectiveTo: '2026-08-31T23:59:59Z', source: 'ADMIN' },
  { _id: 'fx-3', baseCurrency: 'USD', quoteCurrency: 'AED', rate: 3.67, effectiveFrom: '2026-08-01T00:00:00Z', effectiveTo: '2026-08-31T23:59:59Z', source: 'ADMIN' },
  { _id: 'fx-4', baseCurrency: 'USD', quoteCurrency: 'SGD', rate: 1.29, effectiveFrom: '2026-08-01T00:00:00Z', effectiveTo: '2026-08-31T23:59:59Z', source: 'ADMIN' },
];

export const INITIAL_RATE_CARDS_MASTER: RateCardMaster[] = [
  { _id: 'rcm-1', rateCardId: 'RC-2026-0001', laneCode: 'INNSA-AEJEA-OCEAN', carrierCode: 'MAEU', serviceTypeCode: 'FCL', containerTypeCode: '40HC', baseRate: 1150, currency: 'USD', rateUnit: 'PER_CONTAINER', charges: [{ chargeCode: 'BAF', value: 180 }, { chargeCode: 'THC_O', value: 8500 }], validFrom: '2026-08-01', validTo: '2026-10-31', isActive: true },
  { _id: 'rcm-2', rateCardId: 'RC-2026-0002', laneCode: 'INNSA-NLRTM-OCEAN', carrierCode: 'MSCU', serviceTypeCode: 'FCL', containerTypeCode: '20GP', baseRate: 1780, currency: 'USD', rateUnit: 'PER_CONTAINER', charges: [{ chargeCode: 'BAF', value: 240 }, { chargeCode: 'THC_D', value: 210 }], validFrom: '2026-08-01', validTo: '2026-09-30', isActive: true },
  { _id: 'rcm-3', rateCardId: 'RC-2026-0003', laneCode: 'INMAA-SGSIN-OCEAN', carrierCode: 'CMDU', serviceTypeCode: 'LCL', containerTypeCode: null, baseRate: 48, currency: 'USD', rateUnit: 'PER_CBM', charges: [{ chargeCode: 'DOC', value: 3500 }], validFrom: '2026-07-15', validTo: '2026-12-31', isActive: true },
  { _id: 'rcm-4', rateCardId: 'RC-2026-0004', laneCode: 'MAA-DXB-AIR', carrierCode: 'EK', serviceTypeCode: 'AIR_GEN', containerTypeCode: null, baseRate: 2.85, currency: 'USD', rateUnit: 'PER_KG', charges: [{ chargeCode: 'DOC', value: 3500 }], validFrom: '2026-08-01', validTo: '2026-09-30', isActive: true },
];

export const INITIAL_SURCHARGE_RULES: SurchargeRule[] = [
  { _id: 'sr-1', ruleCode: 'SUR-PEAK', label: 'Peak Season Surcharge', appliesTo: { mode: 'OCEAN' }, triggerCondition: 'month IN [8,9,10]', valueType: 'FLAT', value: 300, currency: 'USD', priority: 10, isActive: true },
  { _id: 'sr-2', ruleCode: 'SUR-WAR', label: 'War Risk / Red Sea Surcharge', appliesTo: { mode: 'OCEAN', laneCode: 'INNSA-NLRTM-OCEAN' }, triggerCondition: "riskZones CONTAINS 'RED_SEA'", valueType: 'FLAT', value: 550, currency: 'USD', priority: 5, isActive: true },
  { _id: 'sr-3', ruleCode: 'SUR-DG', label: 'Dangerous Goods Surcharge', appliesTo: { cargoTypeCode: 'DG3' }, triggerCondition: 'cargo.isHazardous == true', valueType: 'PERCENT', value: 25, priority: 3, isActive: true },
  { _id: 'sr-4', ruleCode: 'SUR-CONG', label: 'Port Congestion Surcharge', appliesTo: { mode: 'OCEAN', portCode: 'INNSA' }, triggerCondition: 'port.congestionIndex > 0.5', valueType: 'FLAT', value: 120, currency: 'USD', priority: 8, isActive: true },
];

export const INITIAL_MARGIN_RULES: MarginRule[] = [
  { _id: 'mr-1', ruleCode: 'MR-STD-OCEAN', customerTier: 'STANDARD', mode: 'OCEAN', laneCode: null, marginType: 'PERCENT', marginValue: 18, minMarginUsd: 120, maxDiscountPct: 5, isActive: true },
  { _id: 'mr-2', ruleCode: 'MR-GOLD-OCEAN', customerTier: 'GOLD', mode: 'OCEAN', laneCode: null, marginType: 'PERCENT', marginValue: 11, minMarginUsd: 90, maxDiscountPct: 12, isActive: true },
  { _id: 'mr-3', ruleCode: 'MR-STD-AIR', customerTier: 'STANDARD', mode: 'AIR', laneCode: null, marginType: 'PERCENT', marginValue: 22, minMarginUsd: 60, maxDiscountPct: 6, isActive: true },
  { _id: 'mr-4', ruleCode: 'MR-ENT-ALL', customerTier: 'ENTERPRISE', mode: null, laneCode: null, marginType: 'PERCENT', marginValue: 8, minMarginUsd: 75, maxDiscountPct: 15, isActive: true },
];

export const INITIAL_CUSTOMS_TARIFFS: CustomsTariff[] = [
  { _id: 'ctf-1', countryCode: 'AE', hsCode: '620342', dutyPct: 5.0, vatPct: 5.0, otherLevies: [], requiredDocs: ['COMMERCIAL_INVOICE', 'PACKING_LIST', 'COO'], effectiveFrom: '2026-01-01', isActive: true },
  { _id: 'ctf-2', countryCode: 'NL', hsCode: '870899', dutyPct: 4.5, vatPct: 21.0, otherLevies: [{ name: 'EU Handling', pct: 0.5 }], requiredDocs: ['COMMERCIAL_INVOICE', 'PACKING_LIST', 'EUR1'], effectiveFrom: '2026-01-01', isActive: true },
  { _id: 'ctf-3', countryCode: 'IN', hsCode: '850760', dutyPct: 15.0, vatPct: 18.0, otherLevies: [{ name: 'Social Welfare Surcharge', pct: 10 }], requiredDocs: ['COMMERCIAL_INVOICE', 'BIS_CERT', 'MSDS'], effectiveFrom: '2026-04-01', isActive: true },
  { _id: 'ctf-4', countryCode: 'SG', hsCode: '080450', dutyPct: 0.0, vatPct: 9.0, otherLevies: [], requiredDocs: ['PHYTOSANITARY', 'COMMERCIAL_INVOICE'], effectiveFrom: '2026-01-01', isActive: true },
];

export const INITIAL_DOCUMENT_TYPES: DocumentType[] = [
  { _id: 'dt-1', code: 'COMMERCIAL_INVOICE', label: 'Commercial Invoice', issuedBy: 'SHIPPER', mandatoryFor: ['OCEAN', 'AIR', 'GROUND'], isActive: true },
  { _id: 'dt-2', code: 'PACKING_LIST', label: 'Packing List', issuedBy: 'SHIPPER', mandatoryFor: ['OCEAN', 'AIR', 'GROUND'], isActive: true },
  { _id: 'dt-3', code: 'BL', label: 'Bill of Lading', issuedBy: 'CARRIER', mandatoryFor: ['OCEAN'], isActive: true },
  { _id: 'dt-4', code: 'AWB', label: 'Air Waybill', issuedBy: 'CARRIER', mandatoryFor: ['AIR'], isActive: true },
  { _id: 'dt-5', code: 'COO', label: 'Certificate of Origin', issuedBy: 'AUTHORITY', mandatoryFor: [], isActive: true },
  { _id: 'dt-6', code: 'MSDS', label: 'Material Safety Data Sheet', issuedBy: 'SHIPPER', mandatoryFor: ['DG3', 'LIION'], isActive: true },
  { _id: 'dt-7', code: 'PHYTOSANITARY', label: 'Phytosanitary Certificate', issuedBy: 'AUTHORITY', mandatoryFor: ['PERISH'], isActive: true },
];

export const INITIAL_CUSTOMER_TIERS: CustomerTier[] = [
  { _id: 'tier-1', code: 'STANDARD', label: 'Standard', minAnnualVolumeTeu: 0, discountPct: 0, creditDays: 0, slaResponseHrs: 24, isActive: true },
  { _id: 'tier-2', code: 'SILVER', label: 'Silver', minAnnualVolumeTeu: 50, discountPct: 3, creditDays: 15, slaResponseHrs: 12, isActive: true },
  { _id: 'tier-3', code: 'GOLD', label: 'Gold', minAnnualVolumeTeu: 250, discountPct: 7, creditDays: 30, slaResponseHrs: 6, isActive: true },
  { _id: 'tier-4', code: 'ENTERPRISE', label: 'Enterprise', minAnnualVolumeTeu: 1000, discountPct: 12, creditDays: 60, slaResponseHrs: 2, isActive: true },
];

export const INITIAL_MASTER_DATA_AUDIT: MasterDataAudit[] = [
  { _id: 'mda-1', collectionName: 'rateCards', recordId: 'RC-2026-0001', action: 'UPDATE', changedFields: { baseRate: { old: 1090, new: 1150 } }, performedBy: 'adm_001', performedAt: '2026-08-04T09:12:00Z', ipAddress: '10.4.2.18' },
  { _id: 'mda-2', collectionName: 'ports', recordId: 'INNSA', action: 'UPDATE', changedFields: { congestionIndex: { old: 0.38, new: 0.55 } }, performedBy: 'adm_002', performedAt: '2026-08-06T14:30:00Z', ipAddress: '10.4.2.21' },
  { _id: 'mda-3', collectionName: 'surchargeRules', recordId: 'SUR-WAR', action: 'CREATE', changedFields: {}, performedBy: 'adm_001', performedAt: '2026-07-28T11:05:00Z', ipAddress: '10.4.2.18' },
];
