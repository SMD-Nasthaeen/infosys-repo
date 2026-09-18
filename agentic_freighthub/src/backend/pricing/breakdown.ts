// Complete Cost Build-Up Assembly Engine (10 Calculation Order Steps - Section 2.1 & 7)

import { toMoneyString } from './money';
import { filterByIncoterm, isComponentInIncoterm } from './incoterm';
import { resolveRateCard, calculateAirWeightBreak, RateCardLine } from './rateResolver';
import { resolveApplicableSurcharges } from './surcharges';
import { resolveMarginPolicy, applyMarginPolicy, MarginEnforcementResult } from './marginPolicy';

/** Strip mode suffixes (-SEA, -RAIL, -AIR) for route lookups */
function npc(code: string): string {
  return code?.replace(/-(SEA|RAIL|AIR)$/, '') || code;
}

export interface CostComponentLine {
  code: string;
  name: string;
  calculationType: string;
  amount: number;
  amountString: string; // Transported as string over API (Rule 8.3)
  currency: string;
  sourceLabel: 'RATE_CARD' | 'SURCHARGE_TABLE' | 'PREDICTED' | 'MANUAL';
  description?: string;
}

export interface CompleteCostBreakdown {
  components: CostComponentLine[];
  totalCostInr: number;
  totalCostString: string;
  marginResult: MarginEnforcementResult;
  sellPriceInr: number;
  sellPriceString: string;
  rateCardRuleMatched: string;
  incotermUsed: string;
  hasPredictedComponent: boolean;
}

export interface BuildCostInput {
  originPortCode: string;
  destinationPortCode: string;
  transportMode: 'ocean' | 'air' | 'express' | 'ground';
  oceanLoadType?: 'FCL' | 'LCL';
  containerSpec?: '20GP' | '40HC' | '40GP' | 'EURO_PALLET' | 'LCL_SLOT';
  containerCount?: number;
  grossWeightKg?: number;
  declaredValueInr?: number;
  incoterm?: string;
  customerTier?: string;
  customerId?: string;
  hazardousMaterials?: boolean;
  temperatureControlled?: boolean;
  needsInsurance?: boolean;
  requestedMarginPct?: number;
  rateLinesStore?: RateCardLine[];
  readyDate?: string;
  baseRatePerUnit?: number;
  bafPercentage?: number;
  originThcPerUnit?: number;
  documentationFeeAmount?: number;
}

export function buildCostBreakdown(input: BuildCostInput): CompleteCostBreakdown {
  const {
    originPortCode = 'MAA',
    destinationPortCode = 'SGSIN',
    transportMode = 'ocean',
    oceanLoadType = 'FCL',
    containerSpec = '40HC',
    containerCount = 1,
    grossWeightKg = 1000,
    declaredValueInr = 500000,
    incoterm = 'FOB',
    customerTier,
    customerId,
    hazardousMaterials = false,
    temperatureControlled = false,
    needsInsurance = false,
    requestedMarginPct = 15.0,
    rateLinesStore = [],
    readyDate = new Date().toISOString().split('T')[0],
    baseRatePerUnit: customBaseRate,
    bafPercentage: customBafPct,
    originThcPerUnit: customThcPerUnit,
    documentationFeeAmount: customDocFee,
  } = input;

  const laneKey = `${originPortCode}-${destinationPortCode}`;
  const components: CostComponentLine[] = [];
  let hasPredicted = false;

  // STEP 1: Base Freight (OFR / AFR)
  let baseFreightAmount = 0;
  let baseSource: 'RATE_CARD' | 'PREDICTED' = 'RATE_CARD';

  const resolvedRate = resolveRateCard(laneKey, containerSpec, customerId, rateLinesStore, readyDate);
  if (resolvedRate.sourceLabel === 'PREDICTED') {
    hasPredicted = true;
  }

  if (transportMode === 'ocean') {
    let unitRate = 50000;
    if (customBaseRate !== undefined && customBaseRate > 0) {
      unitRate = customBaseRate;
    } else if (resolvedRate.rateLine) {
      unitRate = resolvedRate.rateLine.baseRateAmount;
    } else if ((npc(originPortCode) === 'MAA' || npc(originPortCode) === 'INMAA') && (npc(destinationPortCode) === 'SGSIN' || npc(destinationPortCode) === 'SIN')) {
      unitRate = containerSpec === '40HC' ? 50000 : (containerSpec === '20GP' ? 35000 : 45000);
    } else if (npc(destinationPortCode) === 'AEJEA' || npc(destinationPortCode) === 'DXB') {
      unitRate = containerSpec === '40HC' ? 120000 : 80000;
    } else {
      unitRate = containerSpec === '40HC' ? 50000 : 40000;
    }

    baseFreightAmount = unitRate * containerCount;

    components.push({
      code: 'OFR',
      name: 'Base Freight',
      calculationType: 'PER_CONTAINER',
      amount: baseFreightAmount,
      amountString: toMoneyString(baseFreightAmount),
      currency: 'INR',
      sourceLabel: resolvedRate.sourceLabel,
      description: `₹${unitRate.toLocaleString('en-IN')} × ${containerCount} containers (${containerSpec})`,
    });
  } else if (transportMode === 'air' || transportMode === 'express') {
    const airResult = calculateAirWeightBreak(grossWeightKg, rateLinesStore);
    baseFreightAmount = customBaseRate ? customBaseRate * containerCount : airResult.totalFreight;
    if (resolvedRate.sourceLabel === 'PREDICTED') baseSource = 'PREDICTED';

    components.push({
      code: 'AFR',
      name: 'Base Freight',
      calculationType: 'PER_KG',
      amount: baseFreightAmount,
      amountString: toMoneyString(baseFreightAmount),
      currency: 'INR',
      sourceLabel: baseSource,
      description: `Air Freight @ ₹${airResult.ratePerKg}/KG`,
    });
  } else {
    // Ground
    baseFreightAmount = customBaseRate ? customBaseRate * containerCount : Math.max(25000, Math.round(grossWeightKg * 18));
    components.push({
      code: 'PUH',
      name: 'Base Freight',
      calculationType: 'BASE_PLUS_PER_KM',
      amount: baseFreightAmount,
      amountString: toMoneyString(baseFreightAmount),
      currency: 'INR',
      sourceLabel: 'RATE_CARD',
    });
  }

  // STEP 2: BAF (Bunker Adjustment Factor)
  const bafPct = customBafPct !== undefined && customBafPct >= 0 ? customBafPct : 10.0;
  const bafAmount = Math.round((baseFreightAmount * bafPct) / 100);
  components.push({
    code: 'BAF',
    name: 'BAF (Bunker Adjustment Factor)',
    calculationType: 'PERCENT_OF_BASE',
    amount: bafAmount,
    amountString: toMoneyString(bafAmount),
    currency: 'INR',
    sourceLabel: 'SURCHARGE_TABLE',
    description: `${bafPct}% of ₹${baseFreightAmount.toLocaleString('en-IN')}`,
  });

  // STEP 3: Origin THC
  const thcRate = customThcPerUnit !== undefined && customThcPerUnit >= 0 ? customThcPerUnit : 8000;
  const thcAmount = thcRate * containerCount;
  components.push({
    code: 'THCO',
    name: 'Origin THC',
    calculationType: 'PER_CONTAINER',
    amount: thcAmount,
    amountString: toMoneyString(thcAmount),
    currency: 'INR',
    sourceLabel: 'SURCHARGE_TABLE',
    description: `₹${thcRate.toLocaleString('en-IN')} × ${containerCount} containers`,
  });

  // STEP 4: Documentation
  const docFee = customDocFee !== undefined && customDocFee >= 0 ? customDocFee : 3000;
  components.push({
    code: 'DOC',
    name: 'Documentation',
    calculationType: 'FLAT_PER_SHIPMENT',
    amount: docFee,
    amountString: toMoneyString(docFee),
    currency: 'INR',
    sourceLabel: 'SURCHARGE_TABLE',
    description: `Statutory port document filing fee`,
  });

  // Optional Special Handling (HAZ, RFR) if enabled
  if (hazardousMaterials) {
    const hazAmount = Math.round(baseFreightAmount * 0.25);
    components.push({
      code: 'HAZ',
      name: 'Hazardous Surcharge',
      calculationType: 'PERCENT_OF_BASE',
      amount: hazAmount,
      amountString: toMoneyString(hazAmount),
      currency: 'INR',
      sourceLabel: 'SURCHARGE_TABLE',
    });
  }

  if (temperatureControlled) {
    const rfrAmount = 14500 * containerCount;
    components.push({
      code: 'RFR',
      name: 'Reefer Temperature Surcharge',
      calculationType: 'PER_CONTAINER',
      amount: rfrAmount,
      amountString: toMoneyString(rfrAmount),
      currency: 'INR',
      sourceLabel: 'SURCHARGE_TABLE',
    });
  }

  if (needsInsurance) {
    const freightTotal = components.reduce((acc, c) => acc + c.amount, 0);
    const cifBasis = (declaredValueInr + freightTotal) * 1.10;
    const insuranceAmount = Math.max(1500, Math.round(cifBasis * 0.0035));

    components.push({
      code: 'INS',
      name: 'Cargo Insurance',
      calculationType: 'PERCENT_OF_VALUE',
      amount: insuranceAmount,
      amountString: toMoneyString(insuranceAmount),
      currency: 'INR',
      sourceLabel: 'SURCHARGE_TABLE',
    });
  }

  // STEP 5: Sum to Total Cost
  const totalCostInr = components.reduce((acc, c) => acc + c.amount, 0);

  // STEP 6: Margin Calculation
  const resolvedPolicy = resolveMarginPolicy(laneKey, customerTier, customerId);
  const marginResult = applyMarginPolicy(totalCostInr, requestedMarginPct, resolvedPolicy);

  // STEP 7: Final Sell Price
  const sellPriceInr = marginResult.sellPrice;

  return {
    components,
    totalCostInr,
    totalCostString: toMoneyString(totalCostInr),
    marginResult,
    sellPriceInr,
    sellPriceString: toMoneyString(sellPriceInr),
    rateCardRuleMatched: resolvedRate.resolutionRule,
    incotermUsed: incoterm.toUpperCase(),
    hasPredictedComponent: hasPredicted,
  };
}
