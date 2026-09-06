"""
Milestone 3 (M3) — Database Expansion Models
Framework: Python 3.11+, Pydantic v2, Beanie ODM (MongoDB Motor async driver)

Zero DB Mutation Policy:
- Existing `shipments`, `routes`, and `quote_versions` collections remain untouched.
- All new M3 models link via foreign string references (`shipment_id`, `quote_id`, `route_id`).

Configured for MongoDB Atlas Vector Search on `RegulationChunk` (1024-dimension embeddings).
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from beanie import Document, Indexed, Link
from pydantic import BaseModel, Field, HttpUrl, field_validator
import pymongo


# ============================================================================
# Enums & Value Objects
# ============================================================================

class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class AssessmentStatus(str, Enum):
    COMPLETED = "COMPLETED"
    IN_PROGRESS = "IN_PROGRESS"
    DEGRADED = "DEGRADED"
    FAILED = "FAILED"


class AlertSeverity(str, Enum):
    CRITICAL = "CRITICAL"
    WARNING = "WARNING"
    INFO = "INFO"


class AlertStatus(str, Enum):
    ACTIVE = "ACTIVE"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVED = "RESOLVED"


class WeatherAlertType(str, Enum):
    TROPICAL_STORM = "TROPICAL_STORM"
    HIGH_WAVES = "HIGH_WAVES"
    GALE_WINDS = "GALE_WINDS"
    FOG_LOW_VISIBILITY = "FOG_LOW_VISIBILITY"
    MONSOON_DELAY = "MONSOON_DELAY"


class StormSeverity(str, Enum):
    MODERATE = "MODERATE"
    SEVERE = "SEVERE"
    EXTREME = "EXTREME"


class DocumentType(str, Enum):
    COMMERCIAL_INVOICE = "COMMERCIAL_INVOICE"
    BILL_OF_LADING = "BILL_OF_LADING"
    PACKING_LIST = "PACKING_LIST"
    CERTIFICATE_OF_ORIGIN = "CERTIFICATE_OF_ORIGIN"
    MSDS_HAZMAT = "MSDS_HAZMAT"
    FSSAI_PERMIT = "FSSAI_PERMIT"
    FUMIGATION_CERT = "FUMIGATION_CERT"
    EXPORT_DECLARATION = "EXPORT_DECLARATION"


class RegulationDocType(str, Enum):
    TARIFF_SCHEDULE = "TARIFF_SCHEDULE"
    IMPORT_POLICY = "IMPORT_POLICY"
    SANCTION_ORDER = "SANCTION_ORDER"
    HAZMAT_GUIDELINE = "HAZMAT_GUIDELINE"
    FOOD_SAFETY = "FOOD_SAFETY"


class RegulationDocStatus(str, Enum):
    ACTIVE = "ACTIVE"
    ARCHIVED = "ARCHIVED"
    DRAFT = "DRAFT"


class RequirementType(str, Enum):
    MANDATORY_DOCUMENT = "MANDATORY_DOCUMENT"
    SPECIAL_PERMIT = "SPECIAL_PERMIT"
    PHYSICAL_INSPECTION = "PHYSICAL_INSPECTION"
    TARIFF_PAYMENT = "TARIFF_PAYMENT"
    SANCTION_CHECK = "SANCTION_CHECK"


class ChecklistItemStatus(str, Enum):
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    MISSING = "MISSING"
    REJECTED = "REJECTED"
    WAIVED = "WAIVED"


class ComplianceStatus(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    NEEDS_DOCUMENTS = "NEEDS_DOCUMENTS"
    NEEDS_REVIEW = "NEEDS_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CONDITIONAL = "CONDITIONAL"


class DocumentVerificationStatus(str, Enum):
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"


class SignOffAction(str, Enum):
    APPROVE = "APPROVE"
    REQUEST_DOCUMENTS = "REQUEST_DOCUMENTS"
    CONDITIONAL = "CONDITIONAL"
    REJECT = "REJECT"


class RiskFactorType(str, Enum):
    WEATHER = "WEATHER"
    CUSTOMS = "CUSTOMS"
    ROUTE = "ROUTE"
    PORT = "PORT"
    CARGO = "CARGO"


class QuoteDecision(str, Enum):
    APPROVED = "APPROVED"
    NEEDS_REVIEW = "NEEDS_REVIEW"
    BLOCKED = "BLOCKED"


class DataFreshnessStatus(str, Enum):
    OPTIMAL = "OPTIMAL"
    STALE = "STALE"
    DEGRADED = "DEGRADED"


class FreshnessDataType(str, Enum):
    WEATHER_RADAR = "WEATHER_RADAR"
    CUSTOMS_TARIFF = "CUSTOMS_TARIFF"
    FOREX_RATES = "FOREX_RATES"
    PORT_DWELL = "PORT_DWELL"
    CARRIER_SPOT_RATES = "CARRIER_SPOT_RATES"


class SyncStatus(str, Enum):
    SUCCESS = "SUCCESS"
    WARNING = "WARNING"
    FAILED = "FAILED"


# ============================================================================
# Base Abstract Model with Audit Timestamps
# ============================================================================

def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class AuditBaseModel(BaseModel):
    """Base Pydantic schema for embedded audit fields."""
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class AuditDocument(Document):
    """Base Beanie Document providing automatic timestamp updates and indexing."""
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

    class Settings:
        use_state_management = True

    async def save(self, *args, **kwargs):
        self.updated_at = utc_now()
        return await super().save(*args, **kwargs)


# ============================================================================
# 1. Weather Intelligence Models
# ============================================================================

class WeatherObservation(AuditDocument):
    """
    Real-time meteorological observation along marine routes and port coordinates.
    """
    route_id: Indexed(str)
    waypoint_name: Optional[str] = None
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    observation_time: datetime = Field(default_factory=utc_now)
    temperature_c: float = Field(..., description="Sea surface / ambient temperature in Celsius")
    wind_speed_knots: float = Field(..., ge=0.0, description="Wind velocity in knots")
    wind_direction: str = Field(..., description="Compass direction e.g., 'ENE', 'SW'")
    rainfall_mm_h: float = Field(0.0, ge=0.0, description="Precipitation rate mm/h")
    wave_height_m: float = Field(..., ge=0.0, description="Significant wave height in meters")
    visibility_km: float = Field(..., ge=0.0, description="Horizontal visibility in km")
    pressure_hpa: float = Field(..., description="Atmospheric pressure in hPa")
    weather_condition: str = Field(..., description="e.g. 'Clear Seas', 'Tropical Gale', 'Rough Seas'")
    storm_detected: bool = False
    storm_type: Optional[str] = None
    storm_severity: Optional[StormSeverity] = None
    provider: str = Field(default="NOAA Global Wave & GFS", description="Telemetry data provider")
    raw_payload: Optional[Dict[str, Any]] = None

    class Settings:
        name = "weather_observations"
        indexes = [
            [("route_id", pymongo.ASCENDING), ("observation_time", pymongo.DESCENDING)],
            [("latitude", pymongo.ASCENDING), ("longitude", pymongo.ASCENDING)],
        ]


class WeatherAlert(AuditDocument):
    """
    Active meteorological hazard warnings affecting cargo transits.
    """
    shipment_id: Optional[Indexed(str)] = None
    quote_id: Optional[Indexed(str)] = None
    route_id: Indexed(str)
    alert_type: WeatherAlertType
    severity: AlertSeverity
    title: str
    message: str
    latitude: float
    longitude: float
    starts_at: datetime
    ends_at: datetime
    status: AlertStatus = AlertStatus.ACTIVE
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None

    class Settings:
        name = "weather_alerts"
        indexes = [
            [("route_id", pymongo.ASCENDING), ("status", pymongo.ASCENDING)],
            [("shipment_id", pymongo.ASCENDING)],
            [("severity", pymongo.ASCENDING)],
        ]


class AlternativeRouteAdvice(BaseModel):
    recommended: bool = False
    alternative_route_id: Optional[str] = None
    alternative_route_name: Optional[str] = None
    distance_delta_nm: Optional[float] = None
    delay_mitigation_hours: Optional[float] = None
    reason: Optional[str] = None


class WeatherAssessment(AuditDocument):
    """
    Aggregated weather risk evaluation for an entire shipment transit corridor.
    """
    shipment_id: Indexed(str, unique=False)
    quote_id: Indexed(str, unique=False)
    route_id: Indexed(str)
    origin_port: str
    destination_port: str
    risk_score: float = Field(..., ge=0.0, le=100.0, description="Normalized weather risk score (0-100)")
    risk_level: RiskLevel
    storm_risk: float = Field(..., ge=0.0, le=100.0)
    rainfall_risk: float = Field(..., ge=0.0, le=100.0)
    wind_risk: float = Field(..., ge=0.0, le=100.0)
    wave_risk: float = Field(..., ge=0.0, le=100.0)
    temperature_risk: float = Field(..., ge=0.0, le=100.0)
    delay_probability: float = Field(..., ge=0.0, le=1.0, description="Expected delay probability (0.0 to 1.0)")
    expected_delay_hours: float = Field(0.0, ge=0.0)
    assessment_status: AssessmentStatus = AssessmentStatus.COMPLETED
    provider: str = "NOAA WaveWatch III & Copernicus"
    provider_timestamp: datetime = Field(default_factory=utc_now)
    assessed_at: datetime = Field(default_factory=utc_now)
    expires_at: datetime
    confidence_score: float = Field(0.95, ge=0.0, le=1.0)
    alternative_route_advice: Optional[AlternativeRouteAdvice] = None
    sampled_observations: List[WeatherObservation] = []
    active_alerts: List[WeatherAlert] = []

    class Settings:
        name = "weather_assessments"
        indexes = [
            [("shipment_id", pymongo.ASCENDING)],
            [("quote_id", pymongo.ASCENDING)],
            [("route_id", pymongo.ASCENDING)],
            [("risk_level", pymongo.ASCENDING)],
        ]


# ============================================================================
# 2. Customs Intelligence & RAG / Regulations Models
# ============================================================================

class HSCodeReference(AuditDocument):
    """
    Harmonized System (HS) Tariff reference table with statutory duties and restrictions.
    """
    hs_code: Indexed(str, unique=True)
    description: str
    chapter: str = Field(..., max_length=4)
    heading: str = Field(..., max_length=6)
    subheading: str = Field(..., max_length=10)
    commodity_type: str
    restricted: bool = False
    prohibited: bool = False
    requires_inspection: bool = False
    basic_customs_duty_pct: float = Field(0.0, ge=0.0)
    igst_pct: float = Field(0.0, ge=0.0)
    country: str = "IND"
    effective_from: datetime
    effective_to: Optional[datetime] = None
    source: str = "CBIC Tariff Schedule 2026"

    class Settings:
        name = "hs_code_references"
        indexes = [
            [("hs_code", pymongo.ASCENDING)],
            [("chapter", pymongo.ASCENDING)],
            [("restricted", pymongo.ASCENDING)],
            [("prohibited", pymongo.ASCENDING)],
        ]


class RegulationDocument(AuditDocument):
    """
    Official regulatory policy documents, gazette notifications, and customs acts.
    """
    title: str
    country: str
    authority: str = Field(..., description="e.g. 'CBIC / Customs India', 'DGFT', 'US CBP'")
    document_type: RegulationDocType
    source_url: Optional[str] = None
    source_name: str
    version: str
    effective_from: datetime
    effective_to: Optional[datetime] = None
    published_at: datetime
    content: str
    status: RegulationDocStatus = RegulationDocStatus.ACTIVE
    last_synced_at: datetime = Field(default_factory=utc_now)

    class Settings:
        name = "regulation_documents"
        indexes = [
            [("country", pymongo.ASCENDING), ("authority", pymongo.ASCENDING)],
            [("status", pymongo.ASCENDING)],
            [("document_type", pymongo.ASCENDING)],
        ]


class RegulationChunk(AuditDocument):
    """
    Semantic chunk extracted from regulatory texts, embedded for MongoDB Atlas Vector Search.
    
    CRUCIAL:
    Configured with a 1024-dimensional embedding vector representing text semantics
    (e.g., generated via Voyage AI voyage-3, Gecko, or text-embedding-3-large).
    """
    regulation_document_id: Indexed(str)
    chunk_index: int
    content: str = Field(..., description="Parsed section text chunk")
    section_name: str
    page_number: Optional[int] = None
    legal_citation: str
    keywords: List[str] = []
    effective_from: datetime
    effective_to: Optional[datetime] = None
    
    # 1024-dimensional embedding for Atlas Vector Search
    embedding: List[float] = Field(
        ...,
        description="1024-dimensional vector embedding for semantic search"
    )

    @field_validator("embedding")
    @classmethod
    def validate_embedding_dimensions(cls, v: List[float]) -> List[float]:
        if len(v) != 1024:
            raise ValueError(f"Atlas Vector Search requires exactly 1024 dimensions, got {len(v)}")
        return v

    class Settings:
        name = "regulation_chunks"
        indexes = [
            [("regulation_document_id", pymongo.ASCENDING)],
            [("keywords", pymongo.ASCENDING)],
            # MongoDB Atlas Vector Search index definition metadata
            # Index name: "vector_index_1024", path: "embedding", dimensions: 1024, similarity: "cosine"
        ]


class CustomsDocumentRequirement(BaseModel):
    """Embedded document requirement specification for compliance schemas."""
    id: str
    document_type: DocumentType
    document_name: str
    mandatory: bool = True
    description: str
    accepted_formats: List[str] = ["PDF", "JPG", "PNG", "DOCX"]
    created_at: datetime = Field(default_factory=utc_now)


class CustomsRequirement(AuditDocument):
    """
    Country-pair and commodity-specific regulatory requirement definition.
    """
    origin_country: str
    destination_country: str
    hs_code: Indexed(str)
    commodity: str
    incoterm: str
    requirement_type: RequirementType
    description: str
    mandatory: bool = True
    risk_level: RiskLevel = RiskLevel.MEDIUM
    regulation_id: Optional[str] = None
    document_requirements: List[CustomsDocumentRequirement] = []
    effective_from: datetime
    effective_to: Optional[datetime] = None
    active: bool = True

    class Settings:
        name = "customs_requirements"
        indexes = [
            [("origin_country", pymongo.ASCENDING), ("destination_country", pymongo.ASCENDING), ("hs_code", pymongo.ASCENDING)],
            [("active", pymongo.ASCENDING)],
        ]


class CustomsChecklistItem(BaseModel):
    """Checklist validation row within an active customs clearance inspection."""
    id: str
    requirement_id: str
    item_name: str
    description: str
    mandatory: bool = True
    status: ChecklistItemStatus = ChecklistItemStatus.PENDING
    document_required: bool = True
    document_uploaded: bool = False
    uploaded_document_id: Optional[str] = None
    uploaded_file_name: Optional[str] = None
    evidence: str = ""
    citation: str = ""
    reviewer_comment: Optional[str] = None
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class RegulationCitation(BaseModel):
    regulation_title: str
    citation: str
    snippet: str
    authority: str


class CustomsComplianceCheck(AuditDocument):
    """
    Per-shipment statutory customs and ICEGATE verification document.
    """
    shipment_id: Indexed(str, unique=False)
    quote_id: Indexed(str, unique=False)
    origin_country: str
    destination_country: str
    origin_port: str
    destination_port: str
    hs_code: str
    commodity: str
    incoterm: str
    declared_value_inr: float = Field(..., ge=0.0)
    basic_customs_duty_pct: float = Field(default=7.5, ge=0.0)
    igst_pct: float = Field(default=18.0, ge=0.0)
    readiness_score: int = Field(..., ge=0, le=100, description="Readiness percentage 0-100")
    risk_level: RiskLevel
    status: ComplianceStatus = ComplianceStatus.NEEDS_REVIEW
    prohibited_match: bool = False
    sanction_match: bool = False
    mandatory_documents_count: int = 0
    uploaded_documents_count: int = 0
    verified_documents_count: int = 0
    checklist_items: List[CustomsChecklistItem] = []
    regulation_citations: List[RegulationCitation] = []
    checked_at: datetime = Field(default_factory=utc_now)
    expires_at: datetime
    created_by: str = "SYSTEM_AUTOMATION"
    reviewed_by: Optional[str] = None
    reviewer_notes: Optional[str] = None
    sign_off_action: Optional[SignOffAction] = None
    signed_off_at: Optional[datetime] = None

    class Settings:
        name = "customs_compliance_checks"
        indexes = [
            [("shipment_id", pymongo.ASCENDING)],
            [("quote_id", pymongo.ASCENDING)],
            [("status", pymongo.ASCENDING)],
            [("hs_code", pymongo.ASCENDING)],
        ]


class ShipmentDocument(AuditDocument):
    """
    Uploaded commercial invoice, bill of lading, MSDS, or phytosanitary certificate.
    """
    shipment_id: Indexed(str)
    customs_check_id: Optional[Indexed(str)] = None
    document_type: DocumentType
    file_name: str
    file_url: str
    mime_type: str
    file_size_kb: int
    uploaded_by: str
    uploaded_at: datetime = Field(default_factory=utc_now)
    verification_status: DocumentVerificationStatus = DocumentVerificationStatus.PENDING
    verified_by: Optional[str] = None
    verified_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None

    class Settings:
        name = "shipment_documents"
        indexes = [
            [("shipment_id", pymongo.ASCENDING)],
            [("customs_check_id", pymongo.ASCENDING)],
            [("verification_status", pymongo.ASCENDING)],
        ]


# ============================================================================
# 3. Composite Shipment Risk Intelligence Models
# ============================================================================

class RiskFactor(BaseModel):
    """Embedded risk vector component (Weather 30%, Customs 25%, Route 20%, Port 15%, Cargo 10%)."""
    id: str
    factor_type: RiskFactorType
    factor_name: str
    score: float = Field(..., ge=0.0, le=100.0)
    weight: float = Field(..., ge=0.0, le=1.0)
    contribution: float = Field(..., ge=0.0, le=100.0)
    severity: RiskLevel
    reason: str
    source: str
    created_at: datetime = Field(default_factory=utc_now)


class RiskAlert(AuditDocument):
    """
    Active threshold exception alert triggered by risk engine scoring.
    """
    shipment_id: Indexed(str)
    quote_id: Indexed(str)
    risk_assessment_id: Indexed(str)
    alert_type: str
    severity: AlertSeverity
    title: str
    message: str
    source: str
    status: AlertStatus = AlertStatus.ACTIVE
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    resolved_at: Optional[datetime] = None

    class Settings:
        name = "risk_alerts"
        indexes = [
            [("shipment_id", pymongo.ASCENDING)],
            [("quote_id", pymongo.ASCENDING)],
            [("risk_assessment_id", pymongo.ASCENDING)],
            [("status", pymongo.ASCENDING)],
            [("severity", pymongo.ASCENDING)],
        ]


class ShipmentRiskAssessment(AuditDocument):
    """
    Composite 5-pillar risk determination for quoting and operational routing.
    """
    shipment_id: Indexed(str, unique=False)
    quote_id: Indexed(str, unique=False)
    weather_score: float = Field(..., ge=0.0, le=100.0, description="Weather sub-score (Weight 0.30)")
    customs_score: float = Field(..., ge=0.0, le=100.0, description="Customs sub-score (Weight 0.25)")
    route_score: float = Field(..., ge=0.0, le=100.0, description="Geopolitical & transit sub-score (Weight 0.20)")
    port_score: float = Field(..., ge=0.0, le=100.0, description="Port dwell & congestion sub-score (Weight 0.15)")
    cargo_score: float = Field(..., ge=0.0, le=100.0, description="Cargo volatility/hazmat sub-score (Weight 0.10)")
    overall_score: float = Field(..., ge=0.0, le=100.0, description="Composite weighted index (0-100)")
    risk_level: RiskLevel
    confidence_score: float = Field(0.95, ge=0.0, le=1.0)
    explanation: str
    quote_decision: QuoteDecision = QuoteDecision.APPROVED
    requires_customs_signoff: bool = False
    customs_signoff_completed: bool = False
    decision_rationale: str
    factors: List[RiskFactor] = []
    alerts: List[RiskAlert] = []
    assessed_at: datetime = Field(default_factory=utc_now)
    model_version: str = "v3.4-risk-engine"

    class Settings:
        name = "shipment_risk_assessments"
        indexes = [
            [("shipment_id", pymongo.ASCENDING)],
            [("quote_id", pymongo.ASCENDING)],
            [("overall_score", pymongo.DESCENDING)],
            [("risk_level", pymongo.ASCENDING)],
            [("quote_decision", pymongo.ASCENDING)],
        ]


# ============================================================================
# 4. System Governance & Telemetry Models
# ============================================================================

class DataFreshness(AuditDocument):
    """
    Tracks telemetry heartbeat, synchronization TTL, and data degradation metrics.
    """
    provider: Indexed(str)
    data_type: FreshnessDataType
    last_success_at: datetime
    last_attempt_at: datetime
    record_count: int = Field(0, ge=0)
    status: DataFreshnessStatus = DataFreshnessStatus.OPTIMAL
    freshness_seconds: int = Field(0, ge=0)
    error_message: Optional[str] = None

    class Settings:
        name = "data_freshness"
        indexes = [
            [("provider", pymongo.ASCENDING), ("data_type", pymongo.ASCENDING)],
            [("status", pymongo.ASCENDING)],
        ]


class IntegrationSyncLog(AuditDocument):
    """
    Immutable pipeline sync log for third-party telemetry and rate provider integrations.
    """
    provider: Indexed(str)
    integration_type: str
    started_at: datetime
    completed_at: datetime
    status: SyncStatus = SyncStatus.SUCCESS
    records_processed: int = 0
    records_failed: int = 0
    error_message: Optional[str] = None
    request_id: str

    class Settings:
        name = "integration_sync_logs"
        indexes = [
            [("provider", pymongo.ASCENDING)],
            [("started_at", pymongo.DESCENDING)],
            [("status", pymongo.ASCENDING)],
        ]


class AlertSubscription(AuditDocument):
    """
    Multi-channel alert dispatch settings for risk officers, customs agents, and brokers.
    """
    user_id: Indexed(str)
    alert_type: str
    severity: AlertSeverity = AlertSeverity.WARNING
    email_enabled: bool = True
    teams_enabled: bool = False
    slack_enabled: bool = True
    active: bool = True

    class Settings:
        name = "alert_subscriptions"
        indexes = [
            [("user_id", pymongo.ASCENDING)],
            [("alert_type", pymongo.ASCENDING)],
            [("active", pymongo.ASCENDING)],
        ]


# ============================================================================
# Registry for Beanie Document Initialization
# ============================================================================

M3_BEANIE_DOCUMENTS = [
    WeatherObservation,
    WeatherAlert,
    WeatherAssessment,
    HSCodeReference,
    RegulationDocument,
    RegulationChunk,
    CustomsRequirement,
    CustomsComplianceCheck,
    ShipmentDocument,
    RiskAlert,
    ShipmentRiskAssessment,
    DataFreshness,
    IntegrationSyncLog,
    AlertSubscription,
]
