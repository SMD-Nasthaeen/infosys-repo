// Freight Engine Service - Backend Calculation Logic based on PDF Specifications
// Covers Phase 1 (Route Intelligence) & Phase 2 (Pricing, Surcharges & Margin)

/** Strip mode suffixes (-SEA, -RAIL, -AIR) for route lookups */
function npc(code: string): string {
  return code?.replace(/-(SEA|RAIL|AIR)$/, '') || code;
}

export interface CargoItemInput {
  packageType?: string;
  containerSpec?: '20GP' | '40HC' | '40GP' | 'EURO_PALLET' | 'LCL_SLOT';
  quantity?: number;
  grossWeightKg?: number;
  volumeCbm?: number;
}

export interface DetailedTariffParams {
  originPortCode: string;
  destinationPortCode: string;
  transportMode: 'ocean' | 'air' | 'express' | 'ground';
  oceanLoadType?: 'FCL' | 'LCL';
  incoterm?: 'FOB' | 'EXW' | 'CIF' | 'DDP';
  cargoReadyDate?: string;
  cargoItems?: CargoItemInput[];
  declaredValue?: number;
  currency?: 'INR' | 'USD' | 'AED' | 'EUR' | 'GBP';
  fragileGoods?: boolean;
  hazardousMaterials?: boolean;
  temperatureControlled?: boolean;
  addCargoInsurance?: boolean;
  promoCodeApplied?: string;
}

export function calculatePdfBackendTariff(params: DetailedTariffParams) {
  const {
    originPortCode = 'INNSA',
    destinationPortCode = 'AEJEA',
    transportMode = 'ocean',
    oceanLoadType = 'FCL',
    incoterm = 'FOB',
    cargoReadyDate,
    cargoItems = [],
    declaredValue = 0,
    currency = 'INR',
    fragileGoods = false,
    hazardousMaterials = false,
    temperatureControlled = false,
    addCargoInsurance = false,
    promoCodeApplied = '',
  } = params;

  const totalWeightKg = cargoItems.reduce((acc, item) => acc + (Number(item.grossWeightKg) || 0), 0);
  const totalItemCount = cargoItems.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);

  // 1. Distance & Transit Time Determination
  const isOcean = transportMode === 'ocean';
  let distanceValue = 1205;
  let distanceUnit = isOcean ? 'nm' : 'km';
  let minDays = 6;
  let maxDays = 10;
  let avgDays = 8;

  const o = npc(originPortCode);
  const d = npc(destinationPortCode);

  if ((o === 'INNSA' || o === 'BOM') && (d === 'AEJEA' || d === 'DXB')) {
    distanceValue = isOcean ? 1205 : 1920;
    minDays = isOcean ? 6 : 2;
    maxDays = isOcean ? 8 : 4;
    avgDays = isOcean ? 7 : 3;
  } else if ((o === 'INNSA' || o === 'BOM') && d === 'NLRTM') {
    distanceValue = isOcean ? 6350 : 6850;
    minDays = isOcean ? 24 : 3;
    maxDays = isOcean ? 28 : 5;
    avgDays = isOcean ? 26 : 4;
  } else if (o === 'MAA' && d === 'SGSIN') {
    distanceValue = isOcean ? 1580 : 2900;
    minDays = isOcean ? 4 : 2;
    maxDays = isOcean ? 6 : 3;
    avgDays = isOcean ? 5 : 2;
  } else if (d === 'USNYC') {
    distanceValue = isOcean ? 8200 : 12500;
    minDays = isOcean ? 30 : 4;
    maxDays = isOcean ? 35 : 6;
    avgDays = isOcean ? 32 : 5;
  } else if (d === 'LHR') {
    distanceValue = isOcean ? 6500 : 6710;
    minDays = isOcean ? 22 : 1;
    maxDays = isOcean ? 26 : 3;
    avgDays = isOcean ? 24 : 2;
  } else {
    distanceValue = isOcean ? 2400 : 3200;
    minDays = isOcean ? 10 : 3;
    maxDays = isOcean ? 14 : 5;
    avgDays = isOcean ? 12 : 4;
  }

  // 2. Base Freight & Charge Basis
  let chargeBasisType = 'PER_CONTAINER';
  let chargeBasisUnits = '1';
  let chargeBasisLabel = '1 x 20GP';
  let baseTariffInr = 0;
  let bafInr = 0;
  let thcInr = 0;
  let docFeeInr = 3500;

  if (transportMode === 'ocean') {
    if (oceanLoadType === 'FCL') {
      chargeBasisType = 'PER_CONTAINER';
      let totalContainers = 0;
      let containerSpecs: string[] = [];

      if (cargoItems.length === 0) {
        totalContainers = 1;
        containerSpecs.push('1 x 20GP');
        baseTariffInr = 125000;
      } else {
        cargoItems.forEach((item) => {
          const qty = Number(item.quantity) || 1;
          totalContainers += qty;
          const spec = item.containerSpec || '20GP';
          containerSpecs.push(`${qty} × ${spec}`);

          let unitBase = 125000;
          if (npc(destinationPortCode) === 'NLRTM') unitBase = 180000;
          if (npc(destinationPortCode) === 'SGSIN') unitBase = 110000;
          if (npc(destinationPortCode) === 'USNYC') unitBase = 240000;
          if (npc(originPortCode) === 'DEL' || npc(originPortCode) === 'MAA') unitBase += 15000;

          if (spec === '40HC') unitBase = Math.round(unitBase * 1.60);
          else if (spec === '40GP') unitBase = Math.round(unitBase * 1.45);
          else if (spec === 'EURO_PALLET') unitBase = Math.round(unitBase * 0.75);
          else if (spec === 'LCL_SLOT') unitBase = Math.round(unitBase * 0.50);

          baseTariffInr += unitBase * qty;
        });
      }

      chargeBasisUnits = String(totalContainers);
      chargeBasisLabel = containerSpecs.join(', ');
      bafInr = Math.round(baseTariffInr * 0.08); // 8% BAF
      thcInr = totalContainers * 9500;
    } else {
      // Ocean LCL
      chargeBasisType = 'PER_CBM';
      const weightTon = Math.max(0.5, totalWeightKg / 1000);
      chargeBasisUnits = `${weightTon.toFixed(1)}`;
      chargeBasisLabel = `${totalItemCount || 1} Pkgs (${weightTon.toFixed(1)} Ton)`;
      baseTariffInr = Math.max(18500, Math.round(weightTon * 22000));
      bafInr = Math.round(baseTariffInr * 0.10);
      thcInr = 4500;
    }
  } else if (transportMode === 'air' || transportMode === 'express') {
    chargeBasisType = 'CHARGEABLE_WEIGHT';
    const effectiveWeight = Math.max(20, totalWeightKg || 50);
    chargeBasisUnits = `${effectiveWeight.toFixed(1)}`;
    chargeBasisLabel = `${effectiveWeight} KG Chargeable Weight`;

    let ratePerKg = 250;
    if (originPortCode === 'DEL' || destinationPortCode === 'LHR') ratePerKg = 320;
    if (destinationPortCode === 'USNYC') ratePerKg = 480;
    if (transportMode === 'express') ratePerKg = Math.round(ratePerKg * 1.45);

    baseTariffInr = effectiveWeight * ratePerKg;
    bafInr = effectiveWeight * 28;
    thcInr = 4200;
    docFeeInr = 3100;
  } else {
    // Ground
    chargeBasisType = 'TONNAGE';
    const effectiveWeight = Math.max(100, totalWeightKg || 200);
    chargeBasisUnits = `${(effectiveWeight / 1000).toFixed(1)}`;
    chargeBasisLabel = `${effectiveWeight} KG Ground Freight`;
    baseTariffInr = Math.max(25000, Math.round(effectiveWeight * 18));
    bafInr = Math.round(baseTariffInr * 0.06);
    thcInr = 3000;
    docFeeInr = 2500;
  }

  // 3. Incoterm & Surcharges
  let incotermAdjustmentInr = 0;
  if (incoterm === 'EXW') {
    incotermAdjustmentInr = 4200;
  } else if (incoterm === 'CIF') {
    incotermAdjustmentInr = Math.round(baseTariffInr * 0.04);
  } else if (incoterm === 'DDP') {
    incotermAdjustmentInr = 8500;
  }

  let specialHandlingInr = 0;
  if (fragileGoods) specialHandlingInr += Math.round(baseTariffInr * 0.03);
  if (hazardousMaterials) specialHandlingInr += Math.round(baseTariffInr * 0.12);
  if (temperatureControlled) specialHandlingInr += Math.round(baseTariffInr * 0.08);

  let insuranceInr = 0;
  if (addCargoInsurance || incoterm === 'CIF') {
    const val = declaredValue > 0 ? declaredValue : 500000;
    insuranceInr = Math.max(1200, Math.round(val * 0.0035));
  }

  let discountInr = 0;
  if (promoCodeApplied === 'FREIGHT20') {
    discountInr = Math.round(baseTariffInr * 0.20);
  } else if (promoCodeApplied === 'INLAND15') {
    discountInr = Math.round(baseTariffInr * 0.15);
  } else if (promoCodeApplied === 'AIRSHIP10') {
    discountInr = Math.round(baseTariffInr * 0.10);
  } else if (promoCodeApplied === 'NODOCFEE') {
    docFeeInr = 0;
    discountInr = 3500;
  }

  const subtotalInr = Math.max(
    1000,
    baseTariffInr + bafInr + thcInr + docFeeInr + incotermAdjustmentInr + specialHandlingInr + insuranceInr - discountInr
  );

  const estimatedTaxInr = Math.round(subtotalInr * 0.18);
  const grandTotalInr = subtotalInr;

  // Calculate estimated arrival date string
  let estimatedArrivalStr = 'Pending Date';
  if (cargoReadyDate) {
    const ready = new Date(cargoReadyDate);
    if (!isNaN(ready.getTime())) {
      ready.setDate(ready.getDate() + avgDays);
      estimatedArrivalStr = ready.toISOString().split('T')[0];
    }
  } else {
    const now = new Date();
    now.setDate(now.getDate() + avgDays);
    estimatedArrivalStr = now.toISOString().split('T')[0];
  }

  // PDF Schema compliant envelope output (with monetary fields as string as mandated in rule 8.3)
  return {
    raw: {
      baseTariff: baseTariffInr,
      bafFuelSurcharge: bafInr,
      terminalHandlingCharge: thcInr + incotermAdjustmentInr,
      documentationFee: docFeeInr,
      specialHandlingSurcharge: specialHandlingInr,
      insuranceFee: insuranceInr,
      discountAmount: discountInr,
      subtotal: subtotalInr,
      estimatedTax: estimatedTaxInr,
      grandTotal: grandTotalInr,
      currency,
    },
    // PDF API Specification shape (Section 4.3 & 5.2 & Rule 8.3)
    pdfApiEnvelope: {
      success: true,
      data: {
        charge_basis: {
          type: chargeBasisType,
          units: chargeBasisUnits,
          label: chargeBasisLabel,
        },
        distance: {
          value: distanceValue,
          unit: distanceUnit,
        },
        transit: {
          min_days: minDays,
          max_days: maxDays,
          estimated_arrival: estimatedArrivalStr,
        },
        pricing: {
          base_freight: baseTariffInr.toFixed(4),
          baf_surcharge: bafInr.toFixed(4),
          terminal_handling: thcInr.toFixed(4),
          documentation: docFeeInr.toFixed(4),
          special_handling: specialHandlingInr.toFixed(4),
          insurance_fee: insuranceInr.toFixed(4),
          discount_amount: discountInr.toFixed(4),
          taxable_subtotal: subtotalInr.toFixed(4),
          tax_amount: estimatedTaxInr.toFixed(4),
          total_cost: grandTotalInr.toFixed(4),
          currency,
        },
        indicative_total: {
          amount: grandTotalInr.toFixed(4),
          currency,
        },
        is_indicative: true,
        route_count: 3,
      },
      meta: {
        request_id: `req_${Math.random().toString(36).substring(2, 8)}`,
      },
    },
  };
}
