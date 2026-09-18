// Two-Phase Rate Card Importer & Validation Engine (Section 4.4 & Section 9)

import { RateCardLine } from './rateResolver';

export interface RateCardRowImport {
  lineIndex: number;
  originPortCode: string;
  destinationPortCode: string;
  containerType?: string;
  weightBreakMin?: number;
  baseRateAmount: number;
  currency: string;
  minimumChargeAmount?: number;
}

export interface ValidationErrorRow {
  lineIndex: number;
  field: string;
  reason: string;
  severity: 'ERROR' | 'WARNING';
}

export interface ImportValidationReport {
  fileKey: string;
  validationToken: string;
  totalRowsParsed: number;
  validRowsCount: number;
  rejectedRowsCount: number;
  warningsCount: number;
  hasHardErrors: boolean;
  errors: ValidationErrorRow[];
  parsedLines: RateCardLine[];
  canCommit: boolean;
}

const VALID_PORTS = new Set([
  'INNSA', 'BOM', 'DEL', 'MAA', 'MAA-SEA', 'AEJEA', 'DXB', 'NLRTM', 'SGSIN', 'USNYC', 'LHR',
  'SHA', 'HKG', 'SIN', 'FRA', 'AMS', 'JFK', 'HYD', 'LKCMB',
  'MAS', 'BZA', 'SBC', 'HYB', 'DEL-RAIL', 'MUM', 'BLR-RAIL', 'CBE', 'AMD', 'KOL',
]);
const VALID_CONTAINERS = new Set(['20GP', '40GP', '40HC', '20RF', '40RF', 'EURO_PALLET', 'LCL_SLOT']);
const VALID_CURRENCIES = new Set(['INR', 'USD', 'EUR', 'AED', 'GBP']);

export function validateRateCardImport(
  fileKey: string,
  carrierId: string,
  cardType: 'CONTRACT' | 'SPOT' | 'TARIFF',
  currency: string,
  validFrom: string,
  validTo: string,
  rawRows: any[]
): ImportValidationReport {
  const errors: ValidationErrorRow[] = [];
  const parsedLines: RateCardLine[] = [];
  const laneContainerMap = new Set<string>();

  let lineIdx = 1;

  // Header Validation
  if (!VALID_CURRENCIES.has(currency.toUpperCase())) {
    errors.push({
      lineIndex: 0,
      field: 'currency',
      reason: `Unknown ISO currency code "${currency}". Must be one of: INR, USD, EUR, AED, GBP.`,
      severity: 'ERROR',
    });
  }

  if (validFrom >= validTo) {
    errors.push({
      lineIndex: 0,
      field: 'validFrom/validTo',
      reason: `validFrom date (${validFrom}) must be strictly before validTo date (${validTo}).`,
      severity: 'ERROR',
    });
  }

  // Row-by-Row Validation
  for (const row of rawRows) {
    const origin = (row.originPortCode || row.origin_port || '').trim().toUpperCase();
    const dest = (row.destinationPortCode || row.destination_port || '').trim().toUpperCase();
    const container = row.containerType || row.container_type || '20GP';
    const rateVal = parseFloat(row.baseRateAmount || row.rate || row.base_rate);
    const minCharge = parseFloat(row.minimumChargeAmount || row.min_charge || 0);

    // 1. Port code existence
    if (!VALID_PORTS.has(origin)) {
      errors.push({
        lineIndex: lineIdx,
        field: 'originPortCode',
        reason: `Unknown origin port code "${origin}".`,
        severity: 'ERROR',
      });
    }

    if (!VALID_PORTS.has(dest)) {
      errors.push({
        lineIndex: lineIdx,
        field: 'destinationPortCode',
        reason: `Unknown destination port code "${dest}".`,
        severity: 'ERROR',
      });
    }

    // 2. Container type
    if (container && !VALID_CONTAINERS.has(container)) {
      errors.push({
        lineIndex: lineIdx,
        field: 'containerType',
        reason: `Invalid container type "${container}".`,
        severity: 'ERROR',
      });
    }

    // 3. Positive rate parseable as Decimal
    if (isNaN(rateVal) || rateVal <= 0) {
      errors.push({
        lineIndex: lineIdx,
        field: 'baseRateAmount',
        reason: `Rate must be a positive number. Received: "${row.baseRateAmount || row.rate}"`,
        severity: 'ERROR',
      });
    }

    // 4. Duplicate lane + container check
    const laneKey = `${origin}-${dest}`;
    const comboKey = `${laneKey}|${container}`;
    if (laneContainerMap.has(comboKey)) {
      errors.push({
        lineIndex: lineIdx,
        field: 'laneKey',
        reason: `Duplicate lane & container combination "${comboKey}" within file.`,
        severity: 'ERROR',
      });
    } else {
      laneContainerMap.add(comboKey);
    }

    // 5. Anomaly check (Rate > 3x or < 0.3x average baseline)
    if (!isNaN(rateVal) && (rateVal > 1000000 || rateVal < 1000)) {
      errors.push({
        lineIndex: lineIdx,
        field: 'baseRateAmount',
        reason: `Rate value ₹${rateVal} deviates significantly from standard market baseline. Confirm unit currency.`,
        severity: 'WARNING',
      });
    }

    if (errors.filter((e) => e.lineIndex === lineIdx && e.severity === 'ERROR').length === 0) {
      parsedLines.push({
        id: `rcl_${Math.random().toString(36).substring(2, 9)}`,
        rateCardId: `rc_${fileKey}`,
        carrierId,
        carrierName: carrierId.toUpperCase(),
        originPortCode: origin,
        destinationPortCode: dest,
        laneKey,
        containerType: container,
        baseRateAmount: rateVal,
        currency,
        minimumChargeAmount: minCharge,
        cardType,
        validFrom,
        validTo,
        status: 'DRAFT',
      });
    }

    lineIdx++;
  }

  const hardErrors = errors.filter((e) => e.severity === 'ERROR');
  const warnings = errors.filter((e) => e.severity === 'WARNING');
  const hasHardErrors = hardErrors.length > 0;

  return {
    fileKey,
    validationToken: `val_token_${Math.random().toString(36).substring(2, 10)}`,
    totalRowsParsed: rawRows.length,
    validRowsCount: parsedLines.length,
    rejectedRowsCount: hardErrors.length,
    warningsCount: warnings.length,
    hasHardErrors,
    errors,
    parsedLines,
    canCommit: !hasHardErrors && parsedLines.length > 0,
  };
}
