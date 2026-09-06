// Quote Service & Immutable Versioning Engine (Section 6 & Section 9)

import { CompleteCostBreakdown, buildCostBreakdown, BuildCostInput } from '../pricing/breakdown';
import { evaluateApprovalRules, RequiredApproval } from '../pricing/approvalRules';
import { toMoneyString } from '../pricing/money';

export type QuoteStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'ISSUED'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'EXPIRED'
  | 'SUPERSEDED';

export interface QuoteVersionDocument {
  versionId: string;
  quoteId: string;
  versionNumber: number;
  status: QuoteStatus;
  createdAt: string;
  issuedAt?: string;
  validUntil?: string;
  originPortCode: string;
  destinationPortCode: string;
  incoterm: string;
  transportMode: string;
  breakdown: CompleteCostBreakdown;
  frozenFxRate: number;
  frozenFxDate: string;
  rateCardId: string;
  rateCardResolutionRule: string;
  marginPolicyId: string;
  requiresApproval: boolean;
  approvalsRequired: RequiredApproval[];
  winProbabilityPct: number;
}

export interface CustomerQuoteProjection {
  quoteId: string;
  versionNumber: number;
  status: QuoteStatus;
  originPortCode: string;
  destinationPortCode: string;
  incoterm: string;
  transportMode: string;
  issuedAt?: string;
  validUntil?: string;
  sellPrice: string;
  currency: string;
  chargeBasisLabel: string;
  items: Array<{
    code: string;
    name: string;
    description?: string;
  }>;
}

const QUOTE_STORE = new Map<string, QuoteVersionDocument[]>();

export function createQuote(input: BuildCostInput & { quoteId?: string }): QuoteVersionDocument {
  const quoteId = input.quoteId || `q_${Math.random().toString(36).substring(2, 9)}`;
  const existingVersions = QUOTE_STORE.get(quoteId) || [];
  const versionNumber = existingVersions.length + 1;

  // Build 10-step Cost Breakdown
  const breakdown = buildCostBreakdown(input);

  // Evaluate Approval Rules
  const approvalCtx = {
    requestedMarginPct: breakdown.marginResult.appliedMarginPct,
    policyFloorPct: breakdown.marginResult.floorPct,
    quoteTotalValue: breakdown.sellPriceInr,
    hasPredictedComponent: breakdown.hasPredictedComponent,
    isNewCustomerNoCredit: input.customerId === 'new_cust_01',
    rateCardExpiresBeforeQuoteValidity: false,
  };

  const approvalEval = evaluateApprovalRules(approvalCtx);

  const newVersion: QuoteVersionDocument = {
    versionId: `qv_${quoteId}_v${versionNumber}`,
    quoteId,
    versionNumber,
    status: approvalEval.requiresApproval ? 'PENDING_APPROVAL' : 'DRAFT',
    createdAt: new Date().toISOString(),
    originPortCode: input.originPortCode || 'INNSA',
    destinationPortCode: input.destinationPortCode || 'AEJEA',
    incoterm: (input.incoterm || 'FOB').toUpperCase(),
    transportMode: input.transportMode || 'ocean',
    breakdown,
    frozenFxRate: 1.0,
    frozenFxDate: new Date().toISOString().split('T')[0],
    rateCardId: `rc_${input.originPortCode}-${input.destinationPortCode}`,
    rateCardResolutionRule: breakdown.rateCardRuleMatched,
    marginPolicyId: 'mp_resolved_01',
    requiresApproval: approvalEval.requiresApproval,
    approvalsRequired: approvalEval.approvalsRequired,
    winProbabilityPct: Math.round(65 + Math.random() * 20),
  };

  // Supersede previous version if exists
  if (existingVersions.length > 0) {
    existingVersions.forEach((v) => {
      if (v.status !== 'SUPERSEDED') {
        v.status = 'SUPERSEDED';
      }
    });
  }

  existingVersions.push(newVersion);
  QUOTE_STORE.set(quoteId, existingVersions);

  return newVersion;
}

export function getQuoteVersions(quoteId: string): QuoteVersionDocument[] {
  return QUOTE_STORE.get(quoteId) || [];
}

export function getLatestQuoteVersion(quoteId: string): QuoteVersionDocument | null {
  const versions = getQuoteVersions(quoteId);
  return versions.length > 0 ? versions[versions.length - 1] : null;
}

// Section 9 Customer Projection Stripping (Commercially Confidential Keys Stripped in Backend)
export function getCustomerQuoteProjection(quoteId: string): CustomerQuoteProjection | null {
  const latest = getLatestQuoteVersion(quoteId);
  if (!latest) return null;

  return {
    quoteId: latest.quoteId,
    versionNumber: latest.versionNumber,
    status: latest.status,
    originPortCode: latest.originPortCode,
    destinationPortCode: latest.destinationPortCode,
    incoterm: latest.incoterm,
    transportMode: latest.transportMode,
    issuedAt: latest.issuedAt,
    validUntil: latest.validUntil,
    sellPrice: latest.breakdown.sellPriceString,
    currency: 'INR',
    chargeBasisLabel: `${latest.incoterm} Freight Services`,
    items: (latest.breakdown.components || []).map((c) => ({
      code: c.code,
      name: c.name,
      description: c.description,
    })),
  };
}
