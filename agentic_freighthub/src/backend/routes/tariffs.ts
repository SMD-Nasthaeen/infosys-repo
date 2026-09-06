// Pricing & Rate Card Routes (Section 10.2)

import { Router } from 'express';
import { validateRateCardImport } from '../pricing/importers';
import { DEFAULT_SURCHARGES } from '../pricing/surcharges';
import { buildCostBreakdown } from '../pricing/breakdown';
import { RateCardLine } from '../pricing/rateResolver';

export const tariffRouter = Router();

const RATE_CARD_STORE: RateCardLine[] = [
  {
    id: 'rcl_default_01',
    rateCardId: 'rc_default_ocean',
    carrierId: 'MAERSK',
    carrierName: 'Maersk Line',
    originPortCode: 'INNSA',
    destinationPortCode: 'AEJEA',
    laneKey: 'INNSA-AEJEA',
    containerType: '20GP',
    baseRateAmount: 125000,
    currency: 'INR',
    cardType: 'CONTRACT',
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
    status: 'ACTIVE',
  },
  {
    id: 'rcl_default_02',
    rateCardId: 'rc_default_ocean',
    carrierId: 'MAERSK',
    carrierName: 'Maersk Line',
    originPortCode: 'INNSA',
    destinationPortCode: 'AEJEA',
    laneKey: 'INNSA-AEJEA',
    containerType: '40HC',
    baseRateAmount: 200000,
    currency: 'INR',
    cardType: 'CONTRACT',
    validFrom: '2026-01-01',
    validTo: '2026-12-31',
    status: 'ACTIVE',
  },
];

// GET /api/v1/pricing/rate-cards
tariffRouter.get('/v1/pricing/rate-cards', (req, res) => {
  res.json({
    success: true,
    data: RATE_CARD_STORE,
  });
});

// POST /api/v1/pricing/rate-cards/validate (Two-Phase Import Step 1)
tariffRouter.post('/v1/pricing/rate-cards/validate', (req, res) => {
  try {
    const { fileKey, carrierId, cardType, currency, validFrom, validTo, rawRows } = req.body;
    const report = validateRateCardImport(
      fileKey || `file_${Date.now()}`,
      carrierId || 'GENERIC',
      cardType || 'CONTRACT',
      currency || 'INR',
      validFrom || '2026-01-01',
      validTo || '2026-12-31',
      rawRows || []
    );
    res.json({ success: true, report });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/v1/pricing/rate-cards/commit (Two-Phase Import Step 2)
tariffRouter.post('/v1/pricing/rate-cards/commit', (req, res) => {
  try {
    const { validationToken, parsedLines } = req.body;
    if (!validationToken) {
      return res.status(400).json({ success: false, error: 'Validation token required for commit.' });
    }

    if (Array.isArray(parsedLines)) {
      parsedLines.forEach((line) => {
        line.status = 'ACTIVE';
        RATE_CARD_STORE.push(line);
      });
    }

    res.json({
      success: true,
      message: 'Rate card successfully committed and activated.',
      committedRows: parsedLines ? parsedLines.length : 0,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// GET/PUT /api/v1/pricing/surcharges
tariffRouter.get('/v1/pricing/surcharges', (req, res) => {
  res.json({ success: true, data: DEFAULT_SURCHARGES });
});

// GET /api/v1/pricing/cost-breakdown
tariffRouter.get('/v1/pricing/cost-breakdown', (req, res) => {
  try {
    const {
      originPortCode,
      destinationPortCode,
      transportMode,
      oceanLoadType,
      containerSpec,
      containerCount,
      grossWeightKg,
      incoterm,
      customerTier,
      requestedMarginPct,
      baseRatePerUnit,
      bafPercentage,
      originThcPerUnit,
      documentationFeeAmount,
    } = req.query;

    const breakdown = buildCostBreakdown({
      originPortCode: (originPortCode as string) || 'MAA',
      destinationPortCode: (destinationPortCode as string) || 'SGSIN',
      transportMode: (transportMode as any) || 'ocean',
      oceanLoadType: (oceanLoadType as any) || 'FCL',
      containerSpec: (containerSpec as any) || '40HC',
      containerCount: Number(containerCount) || 2,
      grossWeightKg: Number(grossWeightKg) || 1200,
      incoterm: (incoterm as string) || 'FOB',
      customerTier: customerTier as string,
      requestedMarginPct: requestedMarginPct ? Number(requestedMarginPct) : 15.0,
      baseRatePerUnit: baseRatePerUnit ? Number(baseRatePerUnit) : undefined,
      bafPercentage: bafPercentage ? Number(bafPercentage) : undefined,
      originThcPerUnit: originThcPerUnit ? Number(originThcPerUnit) : undefined,
      documentationFeeAmount: documentationFeeAmount ? Number(documentationFeeAmount) : undefined,
      rateLinesStore: RATE_CARD_STORE,
    });

    res.json({ success: true, data: breakdown });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});
