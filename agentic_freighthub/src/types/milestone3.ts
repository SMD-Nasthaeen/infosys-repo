// Milestone 3 — Technical Scope, Schemas & Models

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AssessmentStatus = 'COMPLETED' | 'IN_PROGRESS' | 'DEGRADED' | 'FAILED';
export type ComplianceStatus = 'PASS' | 'FAIL' | 'NEEDS_DOCUMENTS' | 'NEEDS_REVIEW' | 'APPROVED' | 'REJECTED' | 'CONDITIONAL';
export type SignOffAction = 'APPROVE' | 'REJECT' | 'CONDITIONAL' | 'REQUEST_DOCUMENTS';
export type ChecklistItemStatus = 'PENDING' | 'VERIFIED' | 'MISSING' | 'REJECTED' | 'WAIVED' | 'DISCREPANCY';
export type DocumentVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type QuoteDecision = 'APPROVED' | 'NEEDS_REVIEW' | 'BLOCKED';
export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';
export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';

// 1. Weather Intelligence Models
export interface WeatherObservation {
  id: string;
  route_id: string;
  waypoint_name?: string;
  latitude: number;
  longitude: number;
  observation_time: string;
  temperature: number; // Celsius
  wind_speed: number; // Knots
  wind_direction: string; // e.g. "ENE", "SW"
  rainfall: number; // mm/h
  wave_height: number; // Meters
  visibility: number; // km
  pressure: number; // hPa
  weather_condition: string; // "Clear", "Rough Seas", "Tropical Gale", "Monsoon Rain"
  storm_detected: boolean;
  storm_type?: string; // "Cyclonic Storm", "Tropical Depression", "Squall"
  storm_severity?: 'MODERATE' | 'SEVERE' | 'EXTREME';
  provider: string; // "NOAA Global Wave & GFS", "Copernicus Marine", "IMD Cyclone Radar"
  raw_payload?: Record<string, any>;
  created_at: string;
}

export interface WeatherAlert {
  id: string;
  shipment_id?: string;
  route_id: string;
  alert_type: 'TROPICAL_STORM' | 'HIGH_WAVES' | 'GALE_WINDS' | 'FOG_LOW_VISIBILITY' | 'MONSOON_DELAY';
  severity: AlertSeverity;
  title: string;
  message: string;
  latitude: number;
  longitude: number;
  starts_at: string;
  ends_at: string;
  status: AlertStatus;
  acknowledged_at?: string;
  resolved_at?: string;
  created_at: string;
}

export interface WeatherAssessment {
  id: string;
  shipment_id: string;
  quote_id: string;
  route_id: string;
  origin_port: string;
  destination_port: string;
  risk_score: number; // 0 - 100
  risk_level: RiskLevel;
  storm_risk: number; // 0 - 100
  rainfall_risk: number; // 0 - 100
  wind_risk: number; // 0 - 100
  wave_risk: number; // 0 - 100
  temperature_risk: number; // 0 - 100
  delay_probability: number; // 0.0 - 1.0 (e.g. 0.38 for 38%)
  expected_delay_hours: number;
  assessment_status: AssessmentStatus;
  provider: string;
  provider_timestamp: string;
  assessed_at: string;
  expires_at: string;
  confidence_score: number; // 0.0 - 1.0
  alternative_route_advice?: {
    recommended: boolean;
    alternativeRouteId?: string;
    alternativeRouteName?: string;
    distanceDeltaNm?: number;
    delayMitigationHours?: number;
    reason?: string;
  };
  sampled_observations: WeatherObservation[];
  active_alerts: WeatherAlert[];
  created_at: string;
  updated_at: string;
}

// 2. Customs Intelligence & RAG Models
export interface HSCodeReference {
  id: string;
  hs_code: string;
  description: string;
  chapter: string;
  heading: string;
  subheading: string;
  commodity_type: string;
  restricted: boolean;
  prohibited: boolean;
  requires_inspection: boolean;
  basic_customs_duty_pct: number;
  igst_pct: number;
  country: string;
  effective_from: string;
  effective_to?: string;
  source: string; // "CBIC Tariff 2026", "WCO Harmonized Schedule", "DGFT India"
  created_at: string;
  updated_at: string;
}

export interface RegulationDocument {
  id: string;
  title: string;
  country: string;
  authority: string; // e.g. "CBIC / Customs India", "DGFT", "US CBP", "EU Commission", "IMO / Maritime"
  document_type: 'TARIFF_SCHEDULE' | 'IMPORT_POLICY' | 'SANCTION_ORDER' | 'HAZMAT_GUIDELINE' | 'FOOD_SAFETY';
  source_url: string;
  source_name: string;
  version: string;
  effective_from: string;
  effective_to?: string;
  published_at: string;
  content: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'DRAFT';
  last_synced_at: string;
  created_at: string;
  updated_at: string;
}

export interface RegulationChunk {
  id: string;
  regulation_document_id: string;
  chunk_index: number;
  content: string;
  section_name: string;
  page_number?: number;
  relevance_score?: number; // Retrieved RAG similarity score
  legal_citation: string;
  citation?: string;
  authority?: string;
  documentId?: string;
  keywords: string[];
  effective_from: string;
  effective_to?: string;
  created_at: string;
}

export interface CustomsDocumentRequirement {
  id: string;
  customs_requirement_id: string;
  document_type: 'COMMERCIAL_INVOICE' | 'BILL_OF_LADING' | 'PACKING_LIST' | 'CERTIFICATE_OF_ORIGIN' | 'MSDS_HAZMAT' | 'FSSAI_PERMIT' | 'FUMIGATION_CERT' | 'EXPORT_DECLARATION';
  document_name: string;
  mandatory: boolean;
  description: string;
  accepted_formats: string[]; // ["PDF", "JPG", "PNG", "DOCX"]
  created_at: string;
}

export interface CustomsRequirement {
  id: string;
  origin_country: string;
  destination_country: string;
  hs_code: string;
  commodity: string;
  incoterm: string;
  requirement_type: 'MANDATORY_DOCUMENT' | 'SPECIAL_PERMIT' | 'PHYSICAL_INSPECTION' | 'TARIFF_PAYMENT' | 'SANCTION_CHECK';
  description: string;
  mandatory: boolean;
  risk_level: RiskLevel;
  regulation_id: string;
  document_requirements: CustomsDocumentRequirement[];
  effective_from: string;
  effective_to?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomsChecklistItem {
  id: string;
  compliance_check_id: string;
  requirement_id: string;
  item_name: string;
  description: string;
  mandatory: boolean;
  status: ChecklistItemStatus;
  document_required: boolean;
  document_uploaded: boolean;
  uploaded_document_id?: string;
  uploaded_file_name?: string;
  evidence: string;
  citation: string;
  reviewer_comment?: string;
  created_at: string;
  updated_at: string;
}

export interface ShipmentDocument {
  id: string;
  shipment_id: string;
  customs_check_id?: string;
  document_type: string;
  file_name: string;
  file_url: string;
  mime_type: string;
  file_size_kb: number;
  uploaded_by: string;
  uploaded_at: string;
  verification_status: DocumentVerificationStatus;
  verified_by?: string;
  verified_at?: string;
  rejection_reason?: string;
}

export interface CustomsComplianceCheck {
  id: string;
  shipment_id: string;
  quote_id: string;
  origin_country: string;
  destination_country: string;
  origin_port: string;
  destination_port: string;
  hs_code: string;
  hs_code_declared?: string; // Manually edited/declared HS code by officer
  hs_code_matched?: string; // System-matched HS code
  commodity: string;
  commodity_description?: string; // Manually edited commodity description
  incoterm: string;
  declared_value_inr: number;
  basic_customs_duty_pct?: number;
  igst_pct?: number;
  readiness_score: number; // 0 - 100
  risk_level: RiskLevel;
  status: ComplianceStatus;
  prohibited_match: boolean;
  sanction_match: boolean;
  mandatory_documents_count: number;
  uploaded_documents_count: number;
  verified_documents_count: number;
  checklist_items: CustomsChecklistItem[];
  regulation_citations: {
    regulationTitle: string;
    citation: string;
    snippet: string;
    authority: string;
  }[];
  checked_at: string;
  expires_at: string;
  created_by: string;
  reviewed_by?: string;
  reviewer_notes?: string;
  sign_off_action?: 'APPROVE' | 'REQUEST_DOCUMENTS' | 'CONDITIONAL' | 'REJECT';
  signed_off_at?: string;
  created_at: string;
  updated_at: string;
}

// 3. Composite Shipment Risk Engine Models
export interface RiskFactor {
  id: string;
  risk_assessment_id: string;
  factor_type: 'WEATHER' | 'CUSTOMS' | 'ROUTE' | 'PORT' | 'CARGO';
  factor_name: string;
  score: number; // 0 - 100
  weight: number; // e.g. 0.30 for weather, 0.25 for customs, etc.
  contribution: number; // score * weight
  severity: RiskLevel;
  reason: string;
  source: string;
  created_at: string;
}

export interface RiskAlert {
  id: string;
  shipment_id: string;
  quote_id: string;
  risk_assessment_id: string;
  alert_type: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  source: string;
  status: AlertStatus;
  acknowledged_by?: string;
  acknowledged_at?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
}

export interface ShipmentRiskAssessment {
  id: string;
  shipment_id: string;
  quote_id: string;
  weather_score: number; // Weight: 0.30
  customs_score: number; // Weight: 0.25
  route_score: number; // Weight: 0.20
  port_score: number; // Weight: 0.15
  cargo_score: number; // Weight: 0.10
  overall_score: number; // 0 - 100 weighted composite
  risk_level: RiskLevel; // 0-30 LOW, 31-60 MEDIUM, 61-80 HIGH, 81-100 CRITICAL
  confidence_score: number; // 0.0 - 1.0 (e.g. 0.94)
  explanation: string;
  quote_decision: QuoteDecision; // APPROVED | NEEDS_REVIEW | BLOCKED
  requires_customs_signoff: boolean;
  customs_signoff_completed: boolean;
  decision_rationale: string;
  factors: RiskFactor[];
  alerts: RiskAlert[];
  assessed_at: string;
  model_version: string;
  created_at: string;
  updated_at: string;
}

// 4. ML Pricing Models & Evaluation
export interface MLPricingFeatureVector {
  distance_nm: number;
  weight_kg: number;
  volume_cbm: number;
  transport_mode: string;
  ocean_load_type?: string;
  container_spec: string;
  origin_port: string;
  destination_port: string;
  departure_month: number;
  fuel_index_bunker: number; // USD per metric ton
  cargo_risk_tier: 'LOW' | 'MEDIUM' | 'HIGH';
  is_hazmat: boolean;
  is_reefer: boolean;
  incoterm: string;
  carrier_reliability_pct: number;
  port_congestion_index: number;
}

export interface MLModelEvaluationMetrics {
  model_name: string;
  model_type: 'LINEAR_REGRESSION' | 'RANDOM_FOREST' | 'GRADIENT_BOOSTING_XGB';
  mae_inr: number; // Mean Absolute Error
  rmse_inr: number; // Root Mean Squared Error
  r2_score: number; // Coefficient of Determination (e.g. 0.962)
  training_samples_count: number;
  test_samples_count: number;
  features_count: number;
  is_best_model: boolean;
  feature_importances: { feature: string; importancePct: number }[];
}

export interface RuleVsMLComparison {
  quote_id: string;
  rule_price_inr: number;
  ml_predicted_price_inr: number;
  variance_inr: number;
  variance_pct: number; // e.g. +3.4% or -2.1%
  rule_breakdown: {
    base_tariff: number;
    baf_fuel: number;
    thc: number;
    doc_fee: number;
    margin: number;
  };
  ml_confidence_interval: {
    lower_bound_inr: number;
    upper_bound_inr: number;
  };
  recommended_pricing: 'ACCEPT_RULE' | 'ACCEPT_ML' | 'ADJUST_HYBRID' | 'FLAG_FOR_PRICING_DESK';
  recommendation_reason: string;
  evaluated_at: string;
}

// 5. System Infrastructure & Governance
export interface DataFreshness {
  id: string;
  provider: string;
  data_type: 'WEATHER_RADAR' | 'CUSTOMS_TARIFF' | 'FOREX_RATES' | 'PORT_DWELL' | 'CARRIER_SPOT_RATES';
  last_success_at: string;
  last_attempt_at: string;
  record_count: number;
  status: 'OPTIMAL' | 'STALE' | 'DEGRADED';
  freshness_seconds: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface IntegrationSyncLog {
  id: string;
  provider: string;
  integration_type: string;
  started_at: string;
  completed_at: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  records_processed: number;
  records_failed: number;
  error_message?: string;
  request_id: string;
  created_at: string;
}

export interface AlertSubscription {
  id: string;
  user_id: string;
  alert_type: string;
  severity: AlertSeverity;
  email_enabled: boolean;
  teams_enabled: boolean;
  slack_enabled: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}
