// Margin Policy Resolution & Floor Enforcement Engine (Section 5)

export type MarginScope = 'GLOBAL' | 'CARGO_TYPE' | 'LANE' | 'CUSTOMER_TIER' | 'CUSTOMER_LANE';

export interface MarginPolicy {
  id: string;
  scope: MarginScope;
  scopeKey: string; // e.g. "INNSA-AEJEA" or "STRATEGIC" or "STRATEGIC|INNSA-AEJEA"
  floorPct: number; // e.g. 12.0
  targetPct: number; // e.g. 15.0
  stretchPct: number; // e.g. 18.0
  effectiveFrom: string;
  isActive: boolean;
}

export const DEFAULT_MARGIN_POLICIES: MarginPolicy[] = [
  {
    id: 'mp_cust_lane_01',
    scope: 'CUSTOMER_LANE',
    scopeKey: 'VIP_SHARMA|INNSA-AEJEA',
    floorPct: 9.0,
    targetPct: 12.0,
    stretchPct: 15.0,
    effectiveFrom: '2026-01-01',
    isActive: true,
  },
  {
    id: 'mp_tier_strategic',
    scope: 'CUSTOMER_TIER',
    scopeKey: 'STRATEGIC',
    floorPct: 10.0,
    targetPct: 13.0,
    stretchPct: 16.0,
    effectiveFrom: '2026-01-01',
    isActive: true,
  },
  {
    id: 'mp_lane_innsa_aejea',
    scope: 'LANE',
    scopeKey: 'INNSA-AEJEA',
    floorPct: 12.0,
    targetPct: 15.0,
    stretchPct: 18.0,
    effectiveFrom: '2026-01-01',
    isActive: true,
  },
  {
    id: 'mp_cargo_hazmat',
    scope: 'CARGO_TYPE',
    scopeKey: 'HAZARDOUS',
    floorPct: 18.0,
    targetPct: 22.0,
    stretchPct: 25.0,
    effectiveFrom: '2026-01-01',
    isActive: true,
  },
  {
    id: 'mp_global_default',
    scope: 'GLOBAL',
    scopeKey: 'GLOBAL',
    floorPct: 13.0,
    targetPct: 16.0,
    stretchPct: 20.0,
    effectiveFrom: '2026-01-01',
    isActive: true,
  },
];

export interface ResolvedMarginPolicy {
  policy: MarginPolicy;
  scopeMatched: MarginScope;
}

// Section 5.2 Resolution Order — Most Specific Wins
export function resolveMarginPolicy(
  laneKey: string,
  customerTier?: string,
  customerId?: string,
  cargoType?: string,
  policies: MarginPolicy[] = DEFAULT_MARGIN_POLICIES
): ResolvedMarginPolicy {
  const active = policies.filter((p) => p.isActive);

  // 1. CUSTOMER_LANE
  if (customerId && laneKey) {
    const custLaneKey = `${customerId}|${laneKey}`;
    const p1 = active.find((p) => p.scope === 'CUSTOMER_LANE' && p.scopeKey === custLaneKey);
    if (p1) return { policy: p1, scopeMatched: 'CUSTOMER_LANE' };
  }

  // 2. CUSTOMER_TIER
  if (customerTier) {
    const p2 = active.find((p) => p.scope === 'CUSTOMER_TIER' && p.scopeKey === customerTier.toUpperCase());
    if (p2) return { policy: p2, scopeMatched: 'CUSTOMER_TIER' };
  }

  // 3. LANE
  if (laneKey) {
    const p3 = active.find((p) => p.scope === 'LANE' && p.scopeKey === laneKey);
    if (p3) return { policy: p3, scopeMatched: 'LANE' };
  }

  // 4. CARGO_TYPE
  if (cargoType) {
    const p4 = active.find((p) => p.scope === 'CARGO_TYPE' && p.scopeKey === cargoType.toUpperCase());
    if (p4) return { policy: p4, scopeMatched: 'CARGO_TYPE' };
  }

  // 5. GLOBAL
  const p5 = active.find((p) => p.scope === 'GLOBAL') || DEFAULT_MARGIN_POLICIES[4];
  return { policy: p5, scopeMatched: 'GLOBAL' };
}

export interface MarginEnforcementResult {
  recommendedMarginPct: number;
  appliedMarginPct: number;
  marginAmount: number;
  sellPrice: number;
  floorPct: number;
  isSuppressed: boolean;
  floorBreached: boolean;
  breachSeverityPct: number;
  floorSource: MarginScope;
}

// Section 5.3 Enforcement & AI Suppression
export function applyMarginPolicy(
  costTotal: number,
  recommendedMarginPct: number,
  resolved: ResolvedMarginPolicy
): MarginEnforcementResult {
  const floorPct = resolved.policy.floorPct;
  let appliedMarginPct = recommendedMarginPct;
  let isSuppressed = false;

  // AI Recommendation Suppression
  if (recommendedMarginPct < floorPct) {
    appliedMarginPct = floorPct;
    isSuppressed = true;
  }

  const marginAmount = Math.round((costTotal * appliedMarginPct) / 100);
  const sellPrice = costTotal + marginAmount;

  return {
    recommendedMarginPct,
    appliedMarginPct,
    marginAmount,
    sellPrice,
    floorPct,
    isSuppressed,
    floorBreached: recommendedMarginPct < floorPct,
    breachSeverityPct: Math.max(0, floorPct - recommendedMarginPct),
    floorSource: resolved.scopeMatched,
  };
}
