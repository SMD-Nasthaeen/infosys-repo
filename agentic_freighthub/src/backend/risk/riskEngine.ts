import {
  ShipmentRiskAssessment,
  RiskFactor,
  RiskAlert,
  RiskLevel,
  QuoteDecision
} from '../../types/milestone3';
import { SEEDED_RISK_ASSESSMENTS } from '../../data/milestone3Data';

const riskAssessmentsStore: Map<string, ShipmentRiskAssessment> = new Map();
const riskAlertsStore: Map<string, RiskAlert> = new Map();

// Seed initial risk assessments
Object.entries(SEEDED_RISK_ASSESSMENTS).forEach(([key, assessment]) => {
  riskAssessmentsStore.set(key, assessment);
  if (assessment.shipment_id) {
    riskAssessmentsStore.set(assessment.shipment_id, assessment);
  }
  assessment.alerts.forEach(alert => {
    riskAlertsStore.set(alert.id, alert);
  });
});

export interface RiskAssessParams {
  shipmentId: string;
  quoteId?: string;
  weatherScore?: number;
  customsScore?: number;
  routeScore?: number;
  portScore?: number;
  cargoScore?: number;
  isHazmat?: boolean;
  requiresCustomsSignoff?: boolean;
  customsSignoffCompleted?: boolean;
  customsStatus?: string;
  originPort?: string;
  destPort?: string;
  commodity?: string;
}

/**
 * Shipment Risk Engine:
 * Combines 5 weighted dimensions:
 *   Weather: 30%
 *   Customs: 25%
 *   Route:   20%
 *   Port:    15%
 *   Cargo:   10%
 *
 * overall_score =
 *   weather_score * 0.30
 * + customs_score * 0.25
 * + route_score * 0.20
 * + port_score * 0.15
 * + cargo_score * 0.10
 *
 * Thresholds:
 *   0–30: LOW
 *   31–60: MEDIUM
 *   61–80: HIGH
 *   81–100: CRITICAL
 */
export function assessShipmentCompositeRisk(params: RiskAssessParams): ShipmentRiskAssessment {
  const shipmentId = params.shipmentId || `SHP-${Math.floor(1000 + Math.random() * 9000)}`;
  const quoteId = params.quoteId || `Q-${Math.floor(1000 + Math.random() * 9000)}`;

  const weatherScore = Math.min(100, Math.max(0, params.weatherScore ?? 22));
  const customsScore = Math.min(100, Math.max(0, params.customsScore ?? (params.isHazmat ? 75 : 20)));
  const routeScore = Math.min(100, Math.max(0, params.routeScore ?? 25));
  const portScore = Math.min(100, Math.max(0, params.portScore ?? 20));
  const cargoScore = Math.min(100, Math.max(0, params.cargoScore ?? (params.isHazmat ? 80 : 15)));

  // Weighted contributions
  const weatherContrib = Number((weatherScore * 0.30).toFixed(2));
  const customsContrib = Number((customsScore * 0.25).toFixed(2));
  const routeContrib = Number((routeScore * 0.20).toFixed(2));
  const portContrib = Number((portScore * 0.15).toFixed(2));
  const cargoContrib = Number((cargoScore * 0.10).toFixed(2));

  const overallScore = Math.round(weatherContrib + customsContrib + routeContrib + portContrib + cargoContrib);

  let riskLevel: RiskLevel = 'LOW';
  if (overallScore >= 81) riskLevel = 'CRITICAL';
  else if (overallScore >= 61) riskLevel = 'HIGH';
  else if (overallScore >= 31) riskLevel = 'MEDIUM';

  const isCustomsRejected = params.customsStatus === 'REJECTED' || params.customsStatus === 'FAIL';
  const isCustomsApproved = params.customsStatus === 'APPROVED' || params.customsSignoffCompleted;
  const isCustomsHeld = params.customsStatus === 'NEEDS_DOCUMENTS' || params.customsStatus === 'NEEDS_REVIEW';

  let quoteDecision: QuoteDecision = 'APPROVED';
  let decisionRationale = 'Composite risk is within acceptable parameters. Quote issuance is approved.';

  if (isCustomsRejected || overallScore >= 81) {
    quoteDecision = 'BLOCKED';
    decisionRationale = isCustomsRejected
      ? 'Customs Compliance Officer has REJECTED the compliance check or prohibited goods were identified. Quote is BLOCKED.'
      : 'Composite Risk Score is in the CRITICAL zone (>80). Automatic and manual quotation blocked by enterprise safety policy.';
  } else if (isCustomsHeld || !isCustomsApproved || overallScore >= 61) {
    quoteDecision = 'NEEDS_REVIEW';
    decisionRationale = isCustomsHeld
      ? 'Customs documentation is incomplete or pending Customs Officer sign-off. Quote is placed on COMPLIANCE HOLD.'
      : 'Composite Risk Score is elevated (HIGH: 61-80). Requires human supervisory authorization before quote issuance.';
  }

  const assessmentId = `RSK-${Math.floor(1000 + Math.random() * 9000)}`;

  const factors: RiskFactor[] = [
    {
      id: `RF-${Math.floor(100 + Math.random() * 900)}`,
      risk_assessment_id: assessmentId,
      factor_type: 'WEATHER',
      factor_name: 'Maritime Weather & Delay Probability',
      score: weatherScore,
      weight: 0.30,
      contribution: weatherContrib,
      severity: weatherScore > 60 ? 'HIGH' : weatherScore > 30 ? 'MEDIUM' : 'LOW',
      reason: weatherScore > 60
        ? 'Severe gale/monsoon depression along corridor. High probability of vessel speed reduction.'
        : 'Favorable sailing conditions with minimal sea state resistance.',
      source: 'NOAA GFS & Copernicus Marine Radar',
      created_at: new Date().toISOString(),
    },
    {
      id: `RF-${Math.floor(100 + Math.random() * 900)}`,
      risk_assessment_id: assessmentId,
      factor_type: 'CUSTOMS',
      factor_name: 'Regulatory & Document Readiness',
      score: customsScore,
      weight: 0.25,
      contribution: customsContrib,
      severity: customsScore > 60 ? 'HIGH' : customsScore > 30 ? 'MEDIUM' : 'LOW',
      reason: customsScore > 60
        ? 'Pending mandatory compliance certificates or regulatory permits (MSDS/FSSAI/CECA).'
        : 'All core commercial trade documents verified on ICEGATE.',
      source: 'Customs Intelligence Agent & CBIC Schedule',
      created_at: new Date().toISOString(),
    },
    {
      id: `RF-${Math.floor(100 + Math.random() * 900)}`,
      risk_assessment_id: assessmentId,
      factor_type: 'ROUTE',
      factor_name: 'Corridor & Chokepoint Safety',
      score: routeScore,
      weight: 0.20,
      contribution: routeContrib,
      severity: routeScore > 60 ? 'HIGH' : routeScore > 30 ? 'MEDIUM' : 'LOW',
      reason: routeScore > 60
        ? 'High traffic density in maritime chokepoints or potential coastal deviation.'
        : 'Standard direct navigation lane with high historical reliability.',
      source: 'IMU Marine Route Graph',
      created_at: new Date().toISOString(),
    },
    {
      id: `RF-${Math.floor(100 + Math.random() * 900)}`,
      risk_assessment_id: assessmentId,
      factor_type: 'PORT',
      factor_name: 'Port Congestion & Terminal Dwell',
      score: portScore,
      weight: 0.15,
      contribution: portContrib,
      severity: portScore > 60 ? 'HIGH' : portScore > 30 ? 'MEDIUM' : 'LOW',
      reason: portScore > 60
        ? 'Elevated container dwell and berth queue at origin/destination hubs.'
        : 'Origin and destination terminal turnarounds are within optimal benchmarks (<2 days).',
      source: 'Global AIS & Port Master Dwell Analytics',
      created_at: new Date().toISOString(),
    },
    {
      id: `RF-${Math.floor(100 + Math.random() * 900)}`,
      risk_assessment_id: assessmentId,
      factor_type: 'CARGO',
      factor_name: 'Commodity Risk & Hazmat Classification',
      score: cargoScore,
      weight: 0.10,
      contribution: cargoContrib,
      severity: cargoScore > 60 ? 'HIGH' : cargoScore > 30 ? 'MEDIUM' : 'LOW',
      reason: cargoScore > 60
        ? 'Dangerous goods / temperature-controlled cargo requiring specialized container handling.'
        : 'Standard dry general cargo with low damage/theft susceptibility.',
      source: 'IMDG Hazardous Cargo Code & Master Data',
      created_at: new Date().toISOString(),
    }
  ];

  const alerts: RiskAlert[] = [];
  if (quoteDecision === 'BLOCKED' || quoteDecision === 'NEEDS_REVIEW') {
    const alert: RiskAlert = {
      id: `ALT-RSK-${Math.floor(1000 + Math.random() * 9000)}`,
      shipment_id: shipmentId,
      quote_id: quoteId,
      risk_assessment_id: assessmentId,
      alert_type: quoteDecision === 'BLOCKED' ? 'QUOTE_BLOCKED_CRITICAL' : 'QUOTE_HOLD_COMPLIANCE',
      severity: quoteDecision === 'BLOCKED' ? 'CRITICAL' : 'WARNING',
      title: quoteDecision === 'BLOCKED' ? 'Critical Shipment Risk Triggered' : 'Compliance & Risk Review Required',
      message: decisionRationale,
      source: 'Shipment Risk Engine',
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
    };
    alerts.push(alert);
    riskAlertsStore.set(alert.id, alert);
  }

  const assessment: ShipmentRiskAssessment = {
    id: assessmentId,
    shipment_id: shipmentId,
    quote_id: quoteId,
    weather_score: weatherScore,
    customs_score: customsScore,
    route_score: routeScore,
    port_score: portScore,
    cargo_score: cargoScore,
    overall_score: overallScore,
    risk_level: riskLevel,
    confidence_score: 0.95,
    explanation: `Composite risk score is ${overallScore} (${riskLevel}). Weather contrib: ${weatherContrib}, Customs contrib: ${customsContrib}, Route contrib: ${routeContrib}, Port contrib: ${portContrib}, Cargo contrib: ${cargoContrib}.`,
    quote_decision: quoteDecision,
    requires_customs_signoff: params.requiresCustomsSignoff ?? true,
    customs_signoff_completed: isCustomsApproved,
    decision_rationale: decisionRationale,
    factors: factors,
    alerts: alerts,
    assessed_at: new Date().toISOString(),
    model_version: 'RiskEngine-v3.2-Hybrid',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  riskAssessmentsStore.set(assessmentId, assessment);
  riskAssessmentsStore.set(shipmentId, assessment);
  return assessment;
}

export function getShipmentRisk(shipmentId: string): ShipmentRiskAssessment | undefined {
  return riskAssessmentsStore.get(shipmentId);
}

export function getAllRiskAlerts(): RiskAlert[] {
  return Array.from(riskAlertsStore.values());
}

export function acknowledgeRiskAlert(alertId: string, ackUser: string = 'User'): boolean {
  const alert = riskAlertsStore.get(alertId);
  if (!alert) return false;
  alert.status = 'ACKNOWLEDGED';
  alert.acknowledged_by = ackUser;
  alert.acknowledged_at = new Date().toISOString();
  return true;
}
