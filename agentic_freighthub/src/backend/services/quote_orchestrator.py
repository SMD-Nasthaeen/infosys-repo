"""
Milestone 3 (M3) — Phase 3: Quote Orchestrator & Compliance State Machine
Integrates pricing, parallel weather / customs / risk intelligence agents, and gating rules.
"""

import asyncio
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from src.backend.models.m3_models import (
    WeatherAssessment,
    CustomsComplianceCheck,
    ShipmentRiskAssessment,
    ComplianceStatus,
    RiskLevel,
    SignOffAction,
    QuoteDecision,
    utc_now,
)
from src.backend.services.weather_agent import (
    WeatherAgentService,
    WeatherAssessRequest,
    RouteWaypoint,
)
from src.backend.services.customs_agent import (
    CustomsAgentService,
    CustomsValidateRequest,
)
from src.backend.services.risk_engine import (
    RiskEngineService,
    RiskAssessRequest,
)


class M3QuoteStatus(str, Enum):
    """
    Phase 3 State Machine Statuses for Quotation Lifecycle:
    - DRAFT: Initial pricing completed, awaiting risk verification
    - HOLD: Blocked on mandatory customs permits / human officer review (NEEDS_DOCUMENTS / NEEDS_REVIEW)
    - BLOCKED: Prohibited cargo, customs rejection, or CRITICAL risk (>80)
    - READY_FOR_ISSUANCE: All compliance verified, acceptable risk posture
    - ISSUED: Formally dispatched to customer
    """
    DRAFT = "DRAFT"
    HOLD = "HOLD"
    BLOCKED = "BLOCKED"
    READY_FOR_ISSUANCE = "READY_FOR_ISSUANCE"
    ISSUED = "ISSUED"


class QuoteOrchestrationInput(BaseModel):
    """
    Unified input payload for end-to-end quote generation.
    """
    quote_id: Optional[str] = Field(None, description="Optional existing quote ID")
    shipment_id: Optional[str] = Field(None, description="Optional linked shipment ID")
    customer_id: str = Field(default="CUST-GLOBAL-01")
    origin_port: str = Field(..., description="UN/LOCODE e.g. INNSA, INMAA")
    destination_port: str = Field(..., description="UN/LOCODE e.g. SGSIN, AEJEA")
    origin_country: str = Field(default="IND")
    dest_country: str = Field(default="SGP")
    incoterm: str = Field(default="FOB", description="Incoterms 2020: FOB, CIF, DDP, etc.")
    transport_mode: str = Field(default="OCEAN_FCL")
    container_type: str = Field(default="40HC")
    hs_code: str = Field(..., description="6-10 digit HS Tariff code")
    commodity: str = Field(..., description="Commercial cargo description")
    declared_value_inr: float = Field(default=2500000.0, ge=0.0)
    is_hazmat: bool = Field(default=False)
    route_geometry: Optional[List[RouteWaypoint]] = None


class CostComponent(BaseModel):
    code: str
    name: str
    amount_inr: float
    currency: str = "INR"


class PricingBreakdown(BaseModel):
    base_freight_inr: float
    thc_origin_inr: float
    thc_dest_inr: float
    baf_fuel_surcharge_inr: float
    customs_handling_inr: float
    margin_pct: float
    margin_amount_inr: float
    total_sell_price_inr: float
    currency: str = "INR"
    components: List[CostComponent]


class OrchestratedQuote(BaseModel):
    quote_id: str
    shipment_id: str
    version_number: int = 1
    status: M3QuoteStatus
    state_machine_reason: str
    created_at: datetime = Field(default_factory=utc_now)
    origin_port: str
    destination_port: str
    incoterm: str
    hs_code: str
    commodity: str
    pricing: PricingBreakdown
    weather_assessment: WeatherAssessment
    customs_compliance: CustomsComplianceCheck
    risk_assessment: ShipmentRiskAssessment
    requires_officer_signoff: bool


class CustomsSignOffRequest(BaseModel):
    action: SignOffAction = Field(..., description="APPROVE, REQUEST_DOCUMENTS, CONDITIONAL, REJECT")
    officer_id: str = Field(default="OFFICER-INMAA-042", description="Officer ID or email")
    officer_name: str = Field(default="Customs Appraiser Rajesh Kumar")
    notes: Optional[str] = Field(None, description="Official review notes or condition clauses")
    verified_item_ids: Optional[List[str]] = Field(default=None, description="Checklist item IDs marked verified")


# In-memory store for active quotes and compliance checks
_ORCHESTRATED_QUOTES: Dict[str, OrchestratedQuote] = {}
_COMPLIANCE_CHECKS: Dict[str, CustomsComplianceCheck] = {}


class QuoteOrchestrator:
    """
    Phase 3 Master Quote Orchestration Service:
    1. Executes deterministic/rule pricing engine.
    2. Runs Weather Agent, Customs RAG Agent, and Risk Engine concurrently using asyncio.gather.
    3. Enforces strict State Machine gating:
       - Customs NEEDS_DOCUMENTS or NEEDS_REVIEW -> HOLD
       - Customs REJECTED or Risk CRITICAL_RISK / BLOCKED -> BLOCKED
       - Customs APPROVED and risk acceptable (LOW / MEDIUM / acceptable HIGH) -> READY_FOR_ISSUANCE
    """

    @classmethod
    def _calculate_pricing(cls, inp: QuoteOrchestrationInput) -> PricingBreakdown:
        """
        Deterministic statutory & freight calculation step (preserves pricing model).
        """
        is_long_haul = any(k in inp.destination_port for k in ["HAM", "RTM", "NYC", "LAX"])
        base_freight = 165000.0 if is_long_haul else 88000.0
        thc_orig = 12500.0
        thc_dest = 14200.0
        baf_surcharge = 9800.0
        customs_doc = 6500.0
        hazmat_surcharge = 28000.0 if inp.is_hazmat else 0.0

        subtotal = base_freight + thc_orig + thc_dest + baf_surcharge + customs_doc + hazmat_surcharge
        margin_pct = 12.0
        margin_amt = round(subtotal * (margin_pct / 100.0), 2)
        total_sell = round(subtotal + margin_amt, 2)

        components = [
            CostComponent(code="FRT_BASE", name="Ocean Base Freight", amount_inr=base_freight),
            CostComponent(code="THC_ORIG", name="Origin Terminal Handling Charge (THC)", amount_inr=thc_orig),
            CostComponent(code="THC_DEST", name="Destination Terminal Handling Charge (THC)", amount_inr=thc_dest),
            CostComponent(code="BAF_FUEL", name="Bunker Adjustment Factor (BAF)", amount_inr=baf_surcharge),
            CostComponent(code="CUST_DOC", name="Customs Documentation & Filing", amount_inr=customs_doc),
        ]
        if inp.is_hazmat:
            components.append(CostComponent(code="HAZ_SURCH", name="IMDG Hazmat Compliance Surcharge", amount_inr=hazmat_surcharge))

        return PricingBreakdown(
            base_freight_inr=base_freight,
            thc_origin_inr=thc_orig,
            thc_dest_inr=thc_dest,
            baf_fuel_surcharge_inr=baf_surcharge,
            customs_handling_inr=customs_doc,
            margin_pct=margin_pct,
            margin_amount_inr=margin_amt,
            total_sell_price_inr=total_sell,
            components=components,
        )

    @classmethod
    async def generate_orchestrated_quote(cls, inp: QuoteOrchestrationInput) -> OrchestratedQuote:
        quote_id = inp.quote_id or f"Q-{datetime.now().strftime('%Y%m%d')}-{int(datetime.now().timestamp()) % 10000:04d}"
        shipment_id = inp.shipment_id or f"SHP-M3-{int(datetime.now().timestamp()) % 100000:05d}"

        # 1. Step A: Pricing calculation
        pricing = cls._calculate_pricing(inp)

        # 2. Step B: Parallel execution of Weather Agent, Customs Agent, and Risk Engine
        weather_coroutine = WeatherAgentService.assess_route_weather(
            WeatherAssessRequest(
                shipment_id=shipment_id,
                quote_id=quote_id,
                origin_port=inp.origin_port,
                destination_port=inp.destination_port,
                route_geometry=inp.route_geometry,
                transport_mode=inp.transport_mode,
            )
        )

        customs_coroutine = CustomsAgentService.validate_customs(
            CustomsValidateRequest(
                shipment_id=shipment_id,
                quote_id=quote_id,
                origin_country=inp.origin_country,
                dest_country=inp.dest_country,
                origin_port=inp.origin_port,
                dest_port=inp.destination_port,
                hs_code=inp.hs_code,
                commodity=inp.commodity,
                incoterm=inp.incoterm,
                declared_value_inr=inp.declared_value_inr,
                is_hazmat=inp.is_hazmat,
            )
        )

        # Await Weather and Customs first to feed true scores into Risk Engine
        weather_result, customs_result = await asyncio.gather(
            weather_coroutine,
            customs_coroutine,
        )

        # Store compliance check in registry for sign-off lookups
        check_id = str(customs_result.id) if customs_result.id else f"CHK-{shipment_id}"
        _COMPLIANCE_CHECKS[check_id] = customs_result

        # Execute composite Risk Engine with live agent outputs
        risk_result = await RiskEngineService.assess_risk(
            RiskAssessRequest(
                shipment_id=shipment_id,
                quote_id=quote_id,
                weather_score=weather_result.risk_score,
                customs_score=100.0 - float(customs_result.readiness_score),
                route_score=45.0 if weather_result.storm_detected else 20.0,
                port_score=25.0,
                cargo_score=85.0 if inp.is_hazmat else 15.0,
                is_hazmat=inp.is_hazmat,
                customs_status=customs_result.status.value,
                origin_port=inp.origin_port,
                destination_port=inp.destination_port,
                commodity=inp.commodity,
            )
        )

        # 3. Step C: Enforce State Machine Gating Rules
        # Rule 1: Customs REJECTED or Prohibited or Risk CRITICAL -> BLOCKED
        if (
            customs_result.status == ComplianceStatus.REJECTED
            or customs_result.status == ComplianceStatus.FAIL
            or customs_result.prohibited_match
            or risk_result.risk_level == RiskLevel.CRITICAL
            or risk_result.overall_score >= 81.0
            or risk_result.quote_decision == QuoteDecision.BLOCKED
        ):
            status = M3QuoteStatus.BLOCKED
            reason = (
                "Quote BLOCKED: Statutory customs rejection, prohibited HS classification, "
                "or composite risk exceeded critical safety threshold (>80)."
            )
            requires_signoff = True

        # Rule 2: Customs NEEDS_DOCUMENTS or NEEDS_REVIEW -> HOLD
        elif (
            customs_result.status in [ComplianceStatus.NEEDS_DOCUMENTS, ComplianceStatus.NEEDS_REVIEW]
            or customs_result.readiness_score < 100
            or risk_result.quote_decision == QuoteDecision.NEEDS_REVIEW
        ):
            status = M3QuoteStatus.HOLD
            reason = (
                "Quote placed on Compliance HOLD: Mandatory statutory document uploads or "
                "Customs Appraiser sign-off pending."
            )
            requires_signoff = True

        # Rule 3: Customs APPROVED / PASS and acceptable risk -> READY_FOR_ISSUANCE
        elif (
            customs_result.status in [ComplianceStatus.PASS, ComplianceStatus.APPROVED]
            and risk_result.overall_score < 60.0
        ):
            status = M3QuoteStatus.READY_FOR_ISSUANCE
            reason = "All regulatory filings validated and risk posture is within authorized thresholds."
            requires_signoff = False

        else:
            status = M3QuoteStatus.HOLD
            reason = "Pending final operational review."
            requires_signoff = True

        orchestrated_quote = OrchestratedQuote(
            quote_id=quote_id,
            shipment_id=shipment_id,
            version_number=1,
            status=status,
            state_machine_reason=reason,
            origin_port=inp.origin_port,
            destination_port=inp.destination_port,
            incoterm=inp.incoterm,
            hs_code=inp.hs_code,
            commodity=inp.commodity,
            pricing=pricing,
            weather_assessment=weather_result,
            customs_compliance=customs_result,
            risk_assessment=risk_result,
            requires_officer_signoff=requires_signoff,
        )

        _ORCHESTRATED_QUOTES[quote_id] = orchestrated_quote
        return orchestrated_quote

    @classmethod
    async def process_customs_sign_off(
        cls,
        check_id: str,
        signoff_req: CustomsSignOffRequest,
    ) -> Dict[str, Any]:
        """
        Customs Officer sign-off handler:
        Applies APPROVE, CONDITIONAL, REQUEST_DOCUMENTS, or REJECT to a compliance check
        and triggers state transition on the linked quote.
        """
        # 1. Fetch compliance check
        check = _COMPLIANCE_CHECKS.get(check_id)
        if not check:
            # Attempt to find by ID in MongoDB if connected
            try:
                check = await CustomsComplianceCheck.get(check_id)
            except Exception:
                check = None

        if not check:
            # Fallback: scan in-memory cache
            for c in _COMPLIANCE_CHECKS.values():
                if str(c.id) == check_id or c.shipment_id == check_id:
                    check = c
                    break

        if not check:
            return {
                "success": False,
                "error": f"Customs compliance check with ID '{check_id}' not found.",
            }

        now = utc_now()
        check.reviewed_by = f"{signoff_req.officer_name} ({signoff_req.officer_id})"
        check.reviewer_notes = signoff_req.notes or f"Sign-off processed with action {signoff_req.action.value}."
        check.sign_off_action = signoff_req.action
        check.signed_off_at = now

        # Update checklist items if specified
        if signoff_req.verified_item_ids:
            for item in check.checklist_items:
                if item.id in signoff_req.verified_item_ids:
                    item.status = "VERIFIED"
                    item.document_uploaded = True
                    item.updated_at = now

        # 2. Evaluate updated ComplianceStatus
        if signoff_req.action == SignOffAction.APPROVE:
            check.status = ComplianceStatus.APPROVED
            check.readiness_score = 100
            for item in check.checklist_items:
                item.status = "VERIFIED"
        elif signoff_req.action == SignOffAction.CONDITIONAL:
            check.status = ComplianceStatus.CONDITIONAL
            check.readiness_score = max(check.readiness_score, 85)
        elif signoff_req.action == SignOffAction.REQUEST_DOCUMENTS:
            check.status = ComplianceStatus.NEEDS_DOCUMENTS
            check.readiness_score = min(check.readiness_score, 60)
        elif signoff_req.action == SignOffAction.REJECT:
            check.status = ComplianceStatus.REJECTED
            check.readiness_score = 0

        try:
            await check.save()
        except Exception:
            pass

        # 3. Update linked quote state machine
        linked_quote = _ORCHESTRATED_QUOTES.get(check.quote_id)
        if linked_quote:
            linked_quote.customs_compliance = check

            if signoff_req.action == SignOffAction.APPROVE:
                # If risk is not critical, release from HOLD to READY_FOR_ISSUANCE
                if linked_quote.risk_assessment.risk_level != RiskLevel.CRITICAL:
                    linked_quote.status = M3QuoteStatus.READY_FOR_ISSUANCE
                    linked_quote.state_machine_reason = (
                        f"Customs Officer {signoff_req.officer_name} APPROVED all trade compliance filings."
                    )
                    linked_quote.requires_officer_signoff = False
            elif signoff_req.action == SignOffAction.CONDITIONAL:
                linked_quote.status = M3QuoteStatus.READY_FOR_ISSUANCE
                linked_quote.state_machine_reason = (
                    f"Conditional approval granted by {signoff_req.officer_name}. Subject to port-of-entry inspection."
                )
                linked_quote.requires_officer_signoff = False
            elif signoff_req.action == SignOffAction.REQUEST_DOCUMENTS:
                linked_quote.status = M3QuoteStatus.HOLD
                linked_quote.state_machine_reason = (
                    f"Customs Officer requested additional documents: {signoff_req.notes or 'Missing statutory certificates'}."
                )
                linked_quote.requires_officer_signoff = True
            elif signoff_req.action == SignOffAction.REJECT:
                linked_quote.status = M3QuoteStatus.BLOCKED
                linked_quote.state_machine_reason = (
                    f"Quote BLOCKED: Customs Officer REJECTED consignment ({signoff_req.notes or 'Regulatory discrepancy'})."
                )
                linked_quote.requires_officer_signoff = True

        return {
            "success": True,
            "check_id": check_id,
            "shipment_id": check.shipment_id,
            "quote_id": check.quote_id,
            "action": signoff_req.action.value,
            "officer": check.reviewed_by,
            "compliance_status": check.status.value,
            "readiness_score": check.readiness_score,
            "resulting_quote_status": linked_quote.status.value if linked_quote else None,
            "resulting_quote_reason": linked_quote.state_machine_reason if linked_quote else None,
            "signed_off_at": now.isoformat(),
        }
