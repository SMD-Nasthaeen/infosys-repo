import { QuoteFormState, TariffBreakdown, CurrencyCode } from '../types';
import { PORTS_AND_HUBS, PROMO_COUPONS } from '../data/freightData';

const CURRENCY_RATES: Record<CurrencyCode, number> = {
  INR: 1,
  USD: 0.012,
  AED: 0.044,
  EUR: 0.011,
  GBP: 0.0093,
};

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  INR: '₹',
  USD: '$',
  AED: 'AED',
  EUR: '€',
  GBP: '£',
};

export function formatCurrency(amount: number, currency: CurrencyCode = 'INR'): string {
  const symbol = CURRENCY_SYMBOLS[currency] || '₹';
  const rate = CURRENCY_RATES[currency] || 1;
  const converted = amount * rate;

  if (currency === 'INR') {
    return `${symbol} ${Math.round(converted).toLocaleString('en-IN')}`;
  }
  return `${symbol} ${converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function getRouteDistanceAndTransit(originCode: string, destCode: string, mode: string) {
  const isOcean = mode === 'ocean';
  
  if ((originCode === 'INNSA' || originCode === 'BOM') && (destCode === 'AEJEA' || destCode === 'DXB')) {
    return {
      distanceText: isOcean ? '1,205 nm (Nautical)' : '1,920 km (Airway)',
      transitText: isOcean ? '6–8 d' : '2–4 d',
      days: isOcean ? 7 : 3,
    };
  }
  if ((originCode === 'INNSA' || originCode === 'BOM') && destCode === 'NLRTM') {
    return {
      distanceText: isOcean ? '6,350 nm (Nautical)' : '6,850 km (Airway)',
      transitText: isOcean ? '24–28 d' : '3–5 d',
      days: isOcean ? 26 : 4,
    };
  }
  if (originCode === 'MAA' && destCode === 'SGSIN') {
    return {
      distanceText: isOcean ? '1,580 nm (Nautical)' : '2,900 km (Airway)',
      transitText: isOcean ? '4–6 d' : '2–3 d',
      days: isOcean ? 5 : 2,
    };
  }
  if (destCode === 'USNYC') {
    return {
      distanceText: isOcean ? '8,200 nm (Nautical)' : '12,500 km (Airway)',
      transitText: isOcean ? '30–35 d' : '4–6 d',
      days: isOcean ? 32 : 5,
    };
  }
  if (destCode === 'LHR') {
    return {
      distanceText: isOcean ? '6,500 nm (Nautical)' : '6,710 km (Airway)',
      transitText: isOcean ? '22–26 d' : '1–3 d',
      days: isOcean ? 24 : 2,
    };
  }

  return {
    distanceText: isOcean ? '2,400 nm (Nautical)' : '3,200 km (Airway)',
    transitText: isOcean ? '10–14 d' : '3–5 d',
    days: isOcean ? 12 : 4,
  };
}

export function calculateTariffBreakdown(formData: QuoteFormState): TariffBreakdown {
  const {
    originPortCode,
    destinationPortCode,
    pickupHubId,
    deliveryHubId,
    transportMode,
    oceanLoadType,
    incoterm,
    cargoItems,
    declaredValue,
    currency,
    fragileGoods,
    hazardousMaterials,
    temperatureControlled,
    addCargoInsurance,
    promoCodeApplied,
    cargoReadyDate,
    requiredDeliveryDate,
    baseRatePerUnit: customBaseRate,
    bafPercentage: customBafPct,
    originThcPerUnit: customThcPerUnit,
    documentationFeeAmount: customDocFee,
    marginPercentage: customMarginPct,
  } = formData;

  const totalWeightKg = cargoItems.reduce((acc, item) => acc + (Number(item.grossWeightKg) || 0), 0);
  const totalItemCount = cargoItems.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);

  const hasOrigin = Boolean(originPortCode && originPortCode.trim() !== '');
  const hasDest = Boolean(destinationPortCode && destinationPortCode.trim() !== '');
  const hasCargo = totalItemCount > 0 || totalWeightKg > 0;
  const hasPickup = Boolean(pickupHubId && pickupHubId.trim() !== '');
  const hasDelivery = Boolean(deliveryHubId && deliveryHubId.trim() !== '');
  const hasValue = Number(declaredValue) > 0;
  const hasSpecial = fragileGoods || hazardousMaterials || temperatureControlled || addCargoInsurance || Boolean(promoCodeApplied);
  const hasCustomPricing = customBaseRate !== undefined || customBafPct !== undefined || customThcPerUnit !== undefined || customDocFee !== undefined || customMarginPct !== undefined;

  // If literally no inputs have been provided yet (all empty after login), return 0 cost
  const isFormStarted = hasOrigin || hasDest || hasCargo || hasPickup || hasDelivery || hasValue || hasSpecial || hasCustomPricing;

  const originPortObj = PORTS_AND_HUBS.find((p) => p.code === originPortCode);
  const destPortObj = PORTS_AND_HUBS.find((p) => p.code === destinationPortCode);
  const originPortName = originPortObj?.city || (originPortCode === 'MAA' ? 'Chennai' : originPortCode) || 'Origin';
  const destPortName = destPortObj?.city || (destinationPortCode === 'SGSIN' ? 'Singapore' : destinationPortCode) || 'Destination';

  if (!isFormStarted) {
    return {
      baseTariff: 0,
      baseRatePerUnit: 0,
      containerCount: 0,
      bafPercentage: 10,
      bafFuelSurcharge: 0,
      originThcPerUnit: 8000,
      terminalHandlingCharge: 0,
      documentationFee: 0,
      specialHandlingSurcharge: 0,
      insuranceFee: 0,
      discountAmount: 0,
      totalCost: 0,
      marginPercentage: 15,
      marginAmount: 0,
      finalSellPrice: 0,
      subtotal: 0,
      estimatedTax: 0,
      grandTotal: 0,
      currency,
      chargeBasis: 'Select origin, mode & cargo details',
      cargoCountSummary: '0 Cargo Items',
      totalWeightKg: 0,
      estimatedDistanceNmOrKm: 'Select origin & destination',
      estimatedTransitDays: 'N/A',
      estimatedArrivalDate: 'Pending input',
      originPortName,
      destPortName,
      equipmentSummary: '0 Units',
    };
  }

  // Determine Container Spec and Quantity
  let totalContainers = 0;
  let primarySpec = '40HC';
  let containerSummaryParts: string[] = [];

  cargoItems.forEach((item) => {
    const qty = Number(item.quantity) || 0;
    totalContainers += qty;
    if (item.containerSpec) primarySpec = item.containerSpec;
    if (qty > 0) {
      containerSummaryParts.push(`${item.containerSpec || '40HC'} × ${qty}`);
    }
  });

  const effectiveContainerCount = totalContainers > 0 ? totalContainers : 1;
  const equipmentSummary = containerSummaryParts.length > 0 ? containerSummaryParts.join(', ') : `${primarySpec} × ${effectiveContainerCount}`;

  // STEP 1 — Base Freight
  // Base Rate per container benchmark
  let defaultBaseRate = 50000; // Default for Chennai -> Singapore / standard corridor

  if (transportMode === 'ocean') {
    if ((originPortCode === 'MAA' || originPortCode === 'INMAA') && (destinationPortCode === 'SGSIN' || destinationPortCode === 'SIN')) {
      // Exact test case: Chennai -> Singapore
      if (primarySpec === '40HC') defaultBaseRate = 50000;
      else if (primarySpec === '20GP') defaultBaseRate = 35000;
      else if (primarySpec === '40GP') defaultBaseRate = 45000;
      else defaultBaseRate = 50000;
    } else if (destinationPortCode === 'NLRTM') {
      defaultBaseRate = primarySpec === '40HC' ? 180000 : 120000;
    } else if (destinationPortCode === 'USNYC') {
      defaultBaseRate = primarySpec === '40HC' ? 240000 : 160000;
    } else if (destinationPortCode === 'AEJEA' || destinationPortCode === 'DXB') {
      defaultBaseRate = primarySpec === '40HC' ? 120000 : 80000;
    } else {
      defaultBaseRate = primarySpec === '40HC' ? 50000 : 40000;
    }
  } else if (transportMode === 'air' || transportMode === 'express') {
    defaultBaseRate = 35000;
  } else {
    defaultBaseRate = 25000;
  }

  const baseRatePerUnit = customBaseRate !== undefined && customBaseRate > 0 ? customBaseRate : defaultBaseRate;
  const baseFreight = baseRatePerUnit * effectiveContainerCount;

  // STEP 2 — BAF (Bunker Adjustment Factor)
  const bafPercentage = customBafPct !== undefined && customBafPct >= 0 ? customBafPct : 10;
  const bafAmount = Math.round((baseFreight * bafPercentage) / 100);

  // STEP 3 — Origin THC (Terminal Handling Charge)
  const originThcPerUnit = customThcPerUnit !== undefined && customThcPerUnit >= 0 ? customThcPerUnit : 8000;
  const thcAmount = originThcPerUnit * effectiveContainerCount;

  // STEP 4 — Documentation
  const documentationFee = customDocFee !== undefined && customDocFee >= 0 ? customDocFee : 3000;

  // Additional Special Surcharges (if enabled)
  let specialHandlingInr = 0;
  if (fragileGoods) specialHandlingInr += Math.round(baseFreight * 0.03);
  if (hazardousMaterials) specialHandlingInr += Math.round(baseFreight * 0.12);
  if (temperatureControlled) specialHandlingInr += Math.round(baseFreight * 0.08);

  let insuranceInr = 0;
  if (addCargoInsurance || incoterm === 'CIF') {
    const val = Number(declaredValue) > 0 ? Number(declaredValue) : 500000;
    insuranceInr = Math.max(1200, Math.round(val * 0.0035));
  }

  let discountInr = 0;
  if (promoCodeApplied) {
    const coupon = PROMO_COUPONS.find((c) => c.code === promoCodeApplied);
    if (coupon) {
      if (coupon.discountType === 'percentage') {
        discountInr = Math.round(baseFreight * (coupon.discountValue / 100));
      } else if (coupon.discountType === 'doc_free') {
        discountInr = documentationFee;
      }
    }
  }

  // STEP 5 — Total Cost
  // Base Freight + BAF + Origin THC + Documentation + Extras
  const totalCost = baseFreight + bafAmount + thcAmount + documentationFee + specialHandlingInr + insuranceInr - discountInr;

  // STEP 6 — Margin Calculation
  const marginPercentage = customMarginPct !== undefined && customMarginPct >= 0 ? customMarginPct : 15;
  const marginAmount = Math.round((totalCost * marginPercentage) / 100);

  // STEP 7 — Final Sell Price
  const finalSellPrice = totalCost + marginAmount;

  const estimatedTaxInr = Math.round(finalSellPrice * 0.18);

  const { distanceText, transitText, days } = getRouteDistanceAndTransit(
    originPortCode || 'MAA',
    destinationPortCode || 'SGSIN',
    transportMode
  );

  let arrDateStr = 'Pending Date Selection';
  if (cargoReadyDate) {
    const ready = new Date(cargoReadyDate);
    if (!isNaN(ready.getTime())) {
      ready.setDate(ready.getDate() + days);
      arrDateStr = ready.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  }

  const chargeBasis = `${primarySpec} × ${effectiveContainerCount} (${transportMode.toUpperCase()}) • ${incoterm}`;

  return {
    baseTariff: baseFreight,
    baseRatePerUnit,
    containerCount: effectiveContainerCount,
    bafPercentage,
    bafFuelSurcharge: bafAmount,
    originThcPerUnit,
    terminalHandlingCharge: thcAmount,
    documentationFee,
    specialHandlingSurcharge: specialHandlingInr,
    insuranceFee: insuranceInr,
    discountAmount: discountInr,
    totalCost,
    marginPercentage,
    marginAmount,
    finalSellPrice,
    subtotal: totalCost,
    estimatedTax: estimatedTaxInr,
    grandTotal: finalSellPrice,
    currency,
    chargeBasis,
    cargoCountSummary: equipmentSummary,
    totalWeightKg,
    estimatedDistanceNmOrKm: hasOrigin && hasDest ? distanceText : `${distanceText} (Est.)`,
    estimatedTransitDays: transitText,
    estimatedArrivalDate: arrDateStr,
    originPortName,
    destPortName,
    equipmentSummary,
  };
}
