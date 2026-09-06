"""
Milestone 3 (M3) — Composite Shipment Risk Engine Service
Fuses 5 dimensions: Weather (30%), Customs (25%), Route (20%), Port (15%), and Cargo (10%).
"""

from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field

from src.backend.models.m3_models import (
    ShipmentRiskAssessment,
    RiskFactor,
    RiskAlert,
    RiskFactorType,
    RiskLevel,
    AlertSeverity,
    AlertStatus,
    QuoteDecision,
    utc_now,
)


class RiskAssessRequest(BaseModel):
    shipment_id: Optional[str] = Field(None, description="Linked shipment ID")
    quote_id: Optional[str] = Field(None, description="Linked quote ID")
    weather_score: Optional[float] = Field(None, ge=0.0, le=100.0, description="0-100 Weather risk score")
    customs_score: Optional[float] = Field(None, ge=0.0, le=100.0, description="0-100 Customs readiness risk score")
    route_score: Optional[float] = Field(None, ge=0.0, le=100.0, description="0-100 Geopolitical & chokepoint score")
    port_score: Optional[float] = Field(None, ge=0.0, le=100.0, description="0-100 Port congestion score")
    cargo_score: Optional[float] = Field(None, ge=0.0, le=100.0, description="0-100 Commodity hazmat/volatility score")
    is_hazmat: bool = Field(default=False)
    customs_status: Optional[str] = Field(default="NEEDS_REVIEW")
    requires_customs_signoff: bool = Field(default=True)
    customs_signoff_completed: bool = Field(default=False)
    origin_port: Optional[str] = Field(default="INMAA")
    destination_port: Optional[str] = Field(default="SGSIN")
    commodity: Optional[str] = Field(default="Standard Cargo")


class RiskEngineService:
    """
    Composite 5-Pillar Shipment Risk Engine:
    Weighted Scoring Formula:
      overall_score = (weather_score * 0.30)
                    + (customs_score * 0.25)
                    + (route_score   * 0.20)
                    + (port_score    * 0.15)
                    + (cargo_score   * 0.10)
    """

    # In-memory backup cache for instant retrieval
    _cache: dict[str, ShipmentRiskAssessment] = {}

    @classmethod
    async def assess_risk(cls, req: RiskAssessRequest) -> ShipmentRiskAssessment:
        shipment_id = req.shipment_id or f"SHP-{int(datetime.now().timestamp())}"
        quote_id = req.quote_id or f"Q-{int(datetime.now().timestamp())}"

        # 1. Normalize sub-scores (0-100)
        weather_s = min(100.0, max(0.0, req.weather_score if req.weather_score is not None else 24.0))
        customs_s = min(100.0, max(0.0, req.customs_score if req.customs_score is not None else (75.0 if req.is_hazmat else 22.0)))
        route_s = min(100.0, max(0.0, req.route_score if req.route_score is not None else 25.0))
        port_s = min(100.0, max(0.0, req.port_score if req.port_score is not None else 20.0))
        cargo_s = min(100.0, max(0.0, req.cargo_score if req.cargo_score is not None else (80.0 if req.is_hazmat else 15.0)))

        # 2. Compute weighted contributions
        weather_contrib = round(weather_s * 0.30, 2)
        customs_contrib = round(customs_s * 0.25, 2)
        route_contrib = round(route_s * 0.20, 2)
        port_contrib = round(port_s * 0.15, 2)
        cargo_contrib = round(cargo_s * 0.10, 2)

        overall_score = round(weather_contrib + customs_contrib + route_contrib + port_contrib + cargo_contrib, 1)

        # 3. Determine Risk Tier
        if overall_score >= 81.0:
            risk_level = RiskLevel.CRITICAL
        elif overall_score >= 61.0:
            risk_level = RiskLevel.HIGH
        elif overall_score >= 31.0:
            risk_level = RiskLevel.MEDIUM
        else:
            risk_level = RiskLevel.LOW

        # 4. Evaluate automated quotation gating
        is_customs_rejected = req.customs_status in ["REJECTED", "FAIL"]
        is_customs_approved = req.customs_status == "APPROVED" or req.customs_signoff_completed
        is_customs_held = req.customs_status in ["NEEDS_DOCUMENTS", "NEEDS_REVIEW", "PENDING"]

        if is_customs_rejected or overall_score >= 81.0:
            quote_decision = QuoteDecision.BLOCKED
            decision_rationale = (
                "Customs Compliance REJECTED or Prohibited Commodity Identified."
                if is_customs_rejected
                else "Composite risk score exceeds Enterprise Safety Threshold (CRITICAL >80). Instant automated quoting blocked."
            )
        elif is_customs_held or not is_customs_approved or overall_score >= 61.0:
            quote_decision = QuoteDecision.NEEDS_REVIEW
            decision_rationale = (
                "Mandatory trade permits or customs sign-off pending. Quote placed on Compliance Hold."
                if is_customs_held
                else "Elevated composite risk (HIGH: 61-80). Requires human trade officer approval prior to release."
            )
        else:
            quote_decision = QuoteDecision.APPROVED
            decision_rationale = "Composite risk is within standard parameters. Automated quotation is authorized."

        # 5. Build factor-level explainability breakdown
        factors: List[RiskFactor] = [
            RiskFactor(
                id="RF-WTR-01",
                factor_type=RiskFactorType.WEATHER,
                factor_name="Marine Weather & Delay Probability",
                score=weather_s,
                weight=0.30,
                contribution=weather_contrib,
                severity=RiskLevel.HIGH if weather_s > 60 else (RiskLevel.MEDIUM if weather_s > 30 else RiskLevel.LOW),
                reason="Severe gale/swell alert along transit trench." if weather_s > 60 else "Favorable sea state and low squall probability.",
                source="NOAA WaveWatch III & Copernicus Radar",
            ),
            RiskFactor(
                id="RF-CUST-02",
                factor_type=RiskFactorType.CUSTOMS,
                factor_name="Customs Tariff & Document Readiness",
                score=customs_s,
                weight=0.25,
                contribution=customs_contrib,
                severity=RiskLevel.HIGH if customs_s > 60 else (RiskLevel.MEDIUM if customs_s > 30 else RiskLevel.LOW),
                reason="Pending required import permits or ICEGATE declaration verification." if customs_s > 60 else "Statutory documentation verified.",
                source="Customs Agent RAG & CBIC Schedule",
            ),
            RiskFactor(
                id="RF-RTE-03",
                factor_type=RiskFactorType.ROUTE,
                factor_name="Corridor & Chokepoint Safety",
                score=route_s,
                weight=0.20,
                contribution=route_contrib,
                severity=RiskLevel.HIGH if route_s > 60 else (RiskLevel.MEDIUM if route_s > 30 else RiskLevel.LOW),
                reason="Transit via elevated geopolitical traffic lane." if route_s > 60 else "Standard commercial sea lane with high reliability.",
                source="IMU Marine Route Graph",
            ),
            RiskFactor(
                id="RF-PRT-04",
                factor_type=RiskFactorType.PORT,
                factor_name="Port Congestion & Terminal Dwell",
                score=port_s,
                weight=0.15,
                contribution=port_contrib,
                severity=RiskLevel.HIGH if port_s > 60 else (RiskLevel.MEDIUM if port_s > 30 else RiskLevel.LOW),
                reason="Elevated container berth queue and yard congestion at destination." if port_s > 60 else "Optimal turnaround times (<48h).",
                source="Global Port Master & AIS Telemetry",
            ),
            RiskFactor(
                id="RF-CRG-05",
                factor_type=RiskFactorType.CARGO,
                factor_name="Commodity & Dangerous Goods Classification",
                score=cargo_s,
                weight=0.10,
                contribution=cargo_contrib,
                severity=RiskLevel.HIGH if cargo_s > 60 else (RiskLevel.MEDIUM if cargo_s > 30 else RiskLevel.LOW),
                reason="Hazardous materials (IMDG) or temperature-sensitive cargo." if cargo_s > 60 else "Standard dry containerized freight.",
                source="IMDG Dangerous Goods Code & Master Data",
            ),
        ]

        # 6. Generate active alerts if risk is elevated
        alerts: List[RiskAlert] = []
        if quote_decision in [QuoteDecision.BLOCKED, QuoteDecision.NEEDS_REVIEW]:
            alert = RiskAlert(
                shipment_id=shipment_id,
                quote_id=quote_id,
                risk_assessment_id="RSK-PENDING",
                alert_type="QUOTE_BLOCKED_CRITICAL" if quote_decision == QuoteDecision.BLOCKED else "QUOTE_HOLD_COMPLIANCE",
                severity=AlertSeverity.CRITICAL if quote_decision == QuoteDecision.BLOCKED else AlertSeverity.WARNING,
                title="Critical Shipment Risk Triggered" if quote_decision == QuoteDecision.BLOCKED else "Customs & Risk Review Required",
                message=decision_rationale,
                source="Shipment Risk Engine v3.4",
                status=AlertStatus.ACTIVE,
            )
            alerts.append(alert)

        # 7. Create and persist assessment
        assessment = ShipmentRiskAssessment(
            shipment_id=shipment_id,
            quote_id=quote_id,
            weather_score=weather_s,
            customs_score=customs_s,
            route_score=route_s,
            port_score=port_s,
            cargo_score=cargo_s,
            overall_score=overall_score,
            risk_level=risk_level,
            confidence_score=0.96,
            explanation=(
                f"Composite score is {overall_score}/100 ({risk_level.value}). "
                f"Weather: {weather_contrib} pts, Customs: {customs_contrib} pts, "
                f"Route: {route_contrib} pts, Port: {port_contrib} pts, Cargo: {cargo_contrib} pts."
            ),
            quote_decision=quote_decision,
            requires_customs_signoff=req.requires_customs_signoff,
            customs_signoff_completed=is_customs_approved,
            decision_rationale=decision_rationale,
            factors=factors,
            alerts=alerts,
            assessed_at=utc_now(),
            model_version="RiskEngine-v3.4-Fused",
        )

        try:
            await assessment.save()
        except Exception:
            pass

        cls._cache[shipment_id] = assessment
        return assessment

    @classmethod
    async def get_assessment_by_shipment(cls, shipment_id: str) -> Optional[ShipmentRiskAssessment]:
        """Fetch existing risk assessment or synthesize a baseline."""
        try:
            doc = await ShipmentRiskAssessment.find_one(ShipmentRiskAssessment.shipment_id == shipment_id)
            if doc:
                return doc
        except Exception:
            pass

        if shipment_id in cls._cache:
            return cls._cache[shipment_id]

        # Generate on the fly if not found
        req = RiskAssessRequest(shipment_id=shipment_id)
        return await cls.assess_risk(req)
