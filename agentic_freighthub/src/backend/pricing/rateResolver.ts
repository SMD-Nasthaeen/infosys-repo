// Rate Card Resolution & Air Weight Break Module (Section 4.2 & 4.3)

export interface RateCardLine {
  id: string;
  rateCardId: string;
  carrierId: string;
  carrierName: string;
  originPortCode: string;
  destinationPortCode: string;
  laneKey: string;
  containerType?: string; // 20GP, 40HC, etc.
  weightBreakMin?: number; // 0, 45, 100, 300, 500, 1000
  baseRateAmount: number;
  currency: string;
  minimumChargeAmount?: number;
  cardType: 'CONTRACT' | 'SPOT' | 'TARIFF';
  customerId?: string; // If specific to a customer
  validFrom: string;
  validTo: string;
  status: 'ACTIVE' | 'DRAFT' | 'EXPIRED' | 'SUPERSEDED';
}

export interface WeightBreakResult {
  chargeableWeight: number;
  chosenBreakMin: number;
  ratePerKg: number;
  totalFreight: number;
  ruleUsed: string; // e.g., "APPLICABLE_BREAK_+100" or "LOWER_BREAK_OPTIMIZED_AT_300KG"
}

// Section 4.3 Air Weight Break & Lower-Break Rule
export function calculateAirWeightBreak(
  weightKg: number,
  rateLines: RateCardLine[]
): WeightBreakResult {
  const chargeableWeight = Math.max(1, weightKg);

  // Default fallback rate schedule if no rate lines provided
  const defaultBreaks = [
    { min: 0, rate: 250, minCharge: 3500 },
    { min: 45, rate: 220, minCharge: 3500 },
    { min: 100, rate: 195, minCharge: 3500 },
    { min: 300, rate: 180, minCharge: 3500 },
    { min: 500, rate: 165, minCharge: 3500 },
    { min: 1000, rate: 148, minCharge: 3500 },
  ];

  // 1. Calculate cost at applicable break
  let applicableBreak = defaultBreaks[0];
  for (const b of defaultBreaks) {
    if (chargeableWeight >= b.min) {
      applicableBreak = b;
    }
  }

  const directCost = Math.max(
    applicableBreak.minCharge,
    chargeableWeight * applicableBreak.rate
  );

  let bestCost = directCost;
  let chosenBreakMin = applicableBreak.min;
  let chosenRatePerKg = applicableBreak.rate;
  let ruleUsed = `APPLICABLE_BREAK_+${applicableBreak.min}`;

  // 2. Check lower-break rule: evaluate higher weight breaks at their minimum weight
  for (const b of defaultBreaks) {
    if (b.min > chargeableWeight) {
      const breakMinWeightCost = Math.max(b.minCharge, b.min * b.rate);
      if (breakMinWeightCost < bestCost) {
        bestCost = breakMinWeightCost;
        chosenBreakMin = b.min;
        chosenRatePerKg = b.rate;
        ruleUsed = `LOWER_BREAK_OPTIMIZED_AT_${b.min}KG`;
      }
    }
  }

  return {
    chargeableWeight,
    chosenBreakMin,
    ratePerKg: chosenRatePerKg,
    totalFreight: bestCost,
    ruleUsed,
  };
}

// Section 4.2 5-Level Priority Order Rate Card Resolution
export interface ResolvedRate {
  rateLine: RateCardLine | null;
  resolutionRule:
    | '1_CUSTOMER_CONTRACT'
    | '2_GENERAL_CONTRACT'
    | '3_CARRIER_SPOT'
    | '4_PUBLISHED_TARIFF'
    | '5_MARKET_PREDICTED';
  sourceLabel: 'RATE_CARD' | 'PREDICTED';
}

export function resolveRateCard(
  laneKey: string,
  containerType: string | undefined,
  customerId: string | undefined,
  rateLines: RateCardLine[],
  readyDate: string = new Date().toISOString().split('T')[0]
): ResolvedRate {
  const activeLines = rateLines.filter(
    (line) =>
      line.laneKey === laneKey &&
      line.status === 'ACTIVE' &&
      (!containerType || line.containerType === containerType) &&
      line.validFrom <= readyDate &&
      line.validTo >= readyDate
  );

  // Priority 1: Customer specific contract
  if (customerId) {
    const customerMatch = activeLines.find(
      (l) => l.cardType === 'CONTRACT' && l.customerId === customerId
    );
    if (customerMatch) {
      return {
        rateLine: customerMatch,
        resolutionRule: '1_CUSTOMER_CONTRACT',
        sourceLabel: 'RATE_CARD',
      };
    }
  }

  // Priority 2: General carrier contract
  const generalContract = activeLines.find(
    (l) => l.cardType === 'CONTRACT' && !l.customerId
  );
  if (generalContract) {
    return {
      rateLine: generalContract,
      resolutionRule: '2_GENERAL_CONTRACT',
      sourceLabel: 'RATE_CARD',
    };
  }

  // Priority 3: Carrier Spot card
  const spotMatch = activeLines.find((l) => l.cardType === 'SPOT');
  if (spotMatch) {
    return {
      rateLine: spotMatch,
      resolutionRule: '3_CARRIER_SPOT',
      sourceLabel: 'RATE_CARD',
    };
  }

  // Priority 4: Published Tariff
  const tariffMatch = activeLines.find((l) => l.cardType === 'TARIFF');
  if (tariffMatch) {
    return {
      rateLine: tariffMatch,
      resolutionRule: '4_PUBLISHED_TARIFF',
      sourceLabel: 'RATE_CARD',
    };
  }

  // Priority 5: None found -> Fallback to Market Rate Model (labeled PREDICTED)
  return {
    rateLine: null,
    resolutionRule: '5_MARKET_PREDICTED',
    sourceLabel: 'PREDICTED',
  };
}
