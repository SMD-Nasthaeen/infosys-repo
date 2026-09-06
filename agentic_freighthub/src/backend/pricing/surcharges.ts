// Surcharge Definitions & Applicability Engine (Section 2.2 & 4.1)

export interface SurchargeRule {
  code: string;
  name: string;
  calculationType:
    | 'FLAT_PER_SHIPMENT'
    | 'PER_CONTAINER'
    | 'PER_KG'
    | 'PER_RT'
    | 'PERCENT_OF_BASE'
    | 'PERCENT_OF_VALUE'
    | 'BASE_PLUS_PER_KM';
  value: number;
  currency: string;
  appliesToModes?: string[];
  appliesToPorts?: string[];
  appliesToLanes?: string[];
  validFrom: string;
  validTo: string;
}

export const DEFAULT_SURCHARGES: SurchargeRule[] = [
  {
    code: 'BAF',
    name: 'Bunker Adjustment Factor',
    calculationType: 'PERCENT_OF_BASE',
    value: 12.0, // 12% of base
    currency: 'INR',
    appliesToModes: ['ocean'],
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
  },
  {
    code: 'CAF',
    name: 'Currency Adjustment Factor',
    calculationType: 'PERCENT_OF_BASE',
    value: 2.5,
    currency: 'INR',
    appliesToModes: ['ocean', 'air'],
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
  },
  {
    code: 'LSS',
    name: 'Low Sulphur Surcharge',
    calculationType: 'PER_CONTAINER',
    value: 4500,
    currency: 'INR',
    appliesToModes: ['ocean'],
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
  },
  {
    code: 'PSS',
    name: 'Peak Season Surcharge',
    calculationType: 'PER_CONTAINER',
    value: 6500,
    currency: 'INR',
    appliesToModes: ['ocean'],
    validFrom: '2026-08-01',
    validTo: '2026-11-30',
  },
  {
    code: 'WRS',
    name: 'War Risk Surcharge',
    calculationType: 'PER_CONTAINER',
    value: 8500,
    currency: 'INR',
    appliesToModes: ['ocean'],
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
  },
  {
    code: 'THCO',
    name: 'Terminal Handling - Origin',
    calculationType: 'PER_CONTAINER',
    value: 9250,
    currency: 'INR',
    appliesToModes: ['ocean'],
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
  },
  {
    code: 'THCD',
    name: 'Terminal Handling - Destination',
    calculationType: 'PER_CONTAINER',
    value: 8400,
    currency: 'INR',
    appliesToModes: ['ocean'],
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
  },
  {
    code: 'ISPS',
    name: 'Security Surcharge',
    calculationType: 'PER_CONTAINER',
    value: 2100,
    currency: 'INR',
    appliesToModes: ['ocean', 'air'],
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
  },
  {
    code: 'DOC',
    name: 'Documentation / B/L Fee',
    calculationType: 'FLAT_PER_SHIPMENT',
    value: 3500,
    currency: 'INR',
    appliesToModes: ['ocean', 'air', 'ground'],
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
  },
  {
    code: 'CCO',
    name: 'Customs Clearance - Origin',
    calculationType: 'FLAT_PER_SHIPMENT',
    value: 6500,
    currency: 'INR',
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
  },
  {
    code: 'CCD',
    name: 'Customs Clearance - Destination',
    calculationType: 'FLAT_PER_SHIPMENT',
    value: 8500,
    currency: 'INR',
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
  },
  {
    code: 'PUH',
    name: 'Pickup Haulage',
    calculationType: 'BASE_PLUS_PER_KM',
    value: 4500, // flat base + per km
    currency: 'INR',
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
  },
  {
    code: 'DLH',
    name: 'Delivery Haulage',
    calculationType: 'BASE_PLUS_PER_KM',
    value: 5500,
    currency: 'INR',
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
  },
];

export function resolveApplicableSurcharges(
  mode: string,
  laneKey: string,
  readyDate: string = new Date().toISOString().split('T')[0]
): SurchargeRule[] {
  const normMode = mode.toLowerCase();
  return DEFAULT_SURCHARGES.filter((s) => {
    if (s.validFrom > readyDate || s.validTo < readyDate) return false;
    if (s.appliesToModes && !s.appliesToModes.includes(normMode)) return false;
    if (s.appliesToLanes && !s.appliesToLanes.includes(laneKey)) return false;
    return true;
  });
}
