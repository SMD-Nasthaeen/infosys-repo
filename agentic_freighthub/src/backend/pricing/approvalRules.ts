// Approval Rules Engine (Section 5.4)

export type ApproverRole = 'PRICING_MANAGER' | 'SENIOR_BROKER';

export interface RequiredApproval {
  order: number;
  conditionName: string;
  breachReason: string;
  approverRole: ApproverRole;
}

export interface QuoteEvaluationContext {
  requestedMarginPct: number;
  policyFloorPct: number;
  quoteTotalValue: number;
  hasPredictedComponent: boolean;
  isNewCustomerNoCredit: boolean;
  rateCardExpiresBeforeQuoteValidity: boolean;
  highValueThresholdInr?: number; // default 1,000,000
}

export function evaluateApprovalRules(
  ctx: QuoteEvaluationContext
): { requiresApproval: boolean; approvalsRequired: RequiredApproval[] } {
  const approvals: RequiredApproval[] = [];
  const highValueThreshold = ctx.highValueThresholdInr || 1000000;
  const marginDeficit = ctx.policyFloorPct - ctx.requestedMarginPct;

  // Rule 1: Margin below floor by > 5 percentage points
  if (marginDeficit > 5.0) {
    approvals.push({
      order: 1,
      conditionName: 'MARGIN_FLOOR_BREACH_MAJOR',
      breachReason: `Margin (${ctx.requestedMarginPct}%) is more than 5% below floor (${ctx.policyFloorPct}%)`,
      approverRole: 'PRICING_MANAGER',
    });
  }
  // Rule 2: Margin below floor by up to 5 percentage points
  else if (marginDeficit > 0) {
    approvals.push({
      order: 2,
      conditionName: 'MARGIN_FLOOR_BREACH_MINOR',
      breachReason: `Margin (${ctx.requestedMarginPct}%) is below policy floor (${ctx.policyFloorPct}%)`,
      approverRole: 'SENIOR_BROKER',
    });
  }

  // Rule 3: Quote value above high-value threshold
  if (ctx.quoteTotalValue > highValueThreshold) {
    approvals.push({
      order: 3,
      conditionName: 'HIGH_VALUE_QUOTE',
      breachReason: `Quote total value (₹${ctx.quoteTotalValue.toLocaleString('en-IN')}) exceeds high-value threshold (₹${highValueThreshold.toLocaleString('en-IN')})`,
      approverRole: 'PRICING_MANAGER',
    });
  }

  // Rule 4: Any component sourced as PREDICTED
  if (ctx.hasPredictedComponent) {
    approvals.push({
      order: 4,
      conditionName: 'PREDICTED_COMPONENT_USED',
      breachReason: 'Quote relies on AI market-rate prediction because no active rate card line was found',
      approverRole: 'SENIOR_BROKER',
    });
  }

  // Rule 5: New customer with no credit profile
  if (ctx.isNewCustomerNoCredit) {
    approvals.push({
      order: 5,
      conditionName: 'NEW_CUSTOMER_NO_CREDIT',
      breachReason: 'Customer account has no verified credit profile or financial history',
      approverRole: 'SENIOR_BROKER',
    });
  }

  // Rule 6: Rate card expires before quote validity ends
  if (ctx.rateCardExpiresBeforeQuoteValidity) {
    approvals.push({
      order: 6,
      conditionName: 'RATE_CARD_EXPIRING_SOON',
      breachReason: 'Carrier rate card expires prior to quote validity window expiration',
      approverRole: 'SENIOR_BROKER',
    });
  }

  return {
    requiresApproval: approvals.length > 0,
    approvalsRequired: approvals,
  };
}
