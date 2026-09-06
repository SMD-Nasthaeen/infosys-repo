"""
Milestone 3 (M3) — FastAPI Master Router
Exposes RESTful endpoints for Weather Agent, Customs RAG Agent, Risk Engine, and Alerts Management.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, status

from src.backend.services.weather_agent import (
    WeatherAgentService,
    WeatherAssessRequest,
)
from src.backend.services.customs_agent import (
    CustomsAgentService,
    CustomsValidateRequest,
    RegulationSearchRequest,
    RegulationSearchResult,
)
from src.backend.services.risk_engine import (
    RiskEngineService,
    RiskAssessRequest,
)
from src.backend.services.alerts_service import (
    AlertsService,
    AlertAcknowledgeRequest,
    AlertListResponse,
)
from src.backend.services.quote_orchestrator import (
    QuoteOrchestrator,
    QuoteOrchestrationInput,
    CustomsSignOffRequest,
    OrchestratedQuote,
)
from src.backend.pricing.ml_pricing_engine import (
    MLPricingEngine,
    MLPricingRequest,
    MLPricingResponse,
)

m3_router = APIRouter(tags=["Milestone 3 - Intelligence & Risk Engine"])


# ============================================================================
# ML Pricing Benchmark Endpoint (Phase 4)
# ============================================================================

@m3_router.post(
    "/v1/pricing/ml",
    summary="Predict freight rate using ML Regression pipeline benchmarked against dataset",
    response_model=MLPricingResponse,
)
async def predict_ml_freight_price(
    request: MLPricingRequest,
    rule_based_price: Optional[float] = Query(None, description="Optional rule-based quote to benchmark against"),
):
    """
    ML Pricing Benchmark Model (Trained on 5,000 dataset records):
    - Categorical: Origin, Destination, Transport_Mode, Cargo_Type, Container_Type, Season, Carrier
    - Numerical: Weight_KG, Volume_CBM, Distance_KM, Fuel_Price, Transit_Days
    - Outputs: Predicted Actual_Freight_Price_INR with 95% Confidence Bounds & Benchmark Delta
    """
    try:
        response = MLPricingEngine.predict_freight_price(request, rule_based_price=rule_based_price)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ML Pricing prediction failed: {str(e)}",
        )


# ============================================================================
# 0. Quote Orchestrator & Compliance State Machine Endpoints
# ============================================================================

@m3_router.post(
    "/v1/quotes/generate",
    summary="Generate quote with parallel Weather, Customs, and Risk intelligence agents",
    response_description="Orchestrated quote with pricing, multi-agent assessments, and state machine status",
)
async def generate_quote(request: QuoteOrchestrationInput):
    """
    Core Milestone 3 Quote Orchestration Flow:
    1. Executes pricing calculations.
    2. Runs Weather Agent, Customs Agent, and Risk Engine concurrently.
    3. Evaluates Gating State Machine:
       - Customs NEEDS_DOCUMENTS / NEEDS_REVIEW -> HOLD
       - Customs REJECTED / CRITICAL risk -> BLOCKED
       - Customs APPROVED and acceptable risk -> READY_FOR_ISSUANCE
    """
    try:
        quote = await QuoteOrchestrator.generate_orchestrated_quote(request)
        return {"success": True, "data": quote}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Quote orchestration failed: {str(e)}",
        )


@m3_router.post(
    "/v1/customs/{check_id}/sign-off",
    summary="Process Customs Officer sign-off (APPROVE, REJECT, REQUEST_DOCUMENTS, CONDITIONAL)",
)
async def customs_sign_off(check_id: str, request: CustomsSignOffRequest):
    """
    Compliance Sign-Off Loop:
    - Customs officers sign off on statutory requirements.
    - Transitions linked quote state (e.g. from HOLD to READY_FOR_ISSUANCE or BLOCKED).
    """
    result = await QuoteOrchestrator.process_customs_sign_off(check_id, request)
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=result.get("error", "Compliance check not found"),
        )
    return result


# ============================================================================
# 1. Weather Agent Endpoints
# ============================================================================

@m3_router.post(
    "/v1/weather/assess",
    summary="Assess marine route weather risk & delay probability",
    response_description="Weather assessment with storm detection, wave analysis, and delay probability",
)
async def assess_weather(request: WeatherAssessRequest):
    """
    Evaluates weather along marine route geometry:
    - Samples coordinates & oceanic wave/wind data (NOAA WaveWatch III, Copernicus)
    - Detects storm squalls and high swell conditions
    - Computes 0-100 normalized risk score and transit delay probability
    """
    try:
        assessment = await WeatherAgentService.assess_route_weather(request)
        return {"success": True, "data": assessment}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Weather assessment failed: {str(e)}",
        )


# ============================================================================
# 2. Customs Intelligence & Hybrid RAG Endpoints
# ============================================================================

@m3_router.post(
    "/v1/customs/validate",
    summary="Validate HS code tariff, incoterm, and compile statutory checklist",
    response_description="Customs compliance check with document checklist and readiness score",
)
async def validate_customs(request: CustomsValidateRequest):
    """
    Validates commodity trade parameters:
    - Matches 6-10 digit HS Code against tariff schedules (CBIC/DGFT)
    - Generates mandatory document checklist (Invoice, Packing List, MSDS, FSSAI)
    - Returns readiness score (0-100) and review status (PASS, NEEDS_DOCUMENTS, NEEDS_REVIEW, FAIL)
    """
    try:
        compliance_check = await CustomsAgentService.validate_customs(request)
        return {"success": True, "data": compliance_check}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Customs validation failed: {str(e)}",
        )


@m3_router.post(
    "/v1/regulations/search",
    summary="Hybrid Vector (1024-d) + Keyword search against RegulationChunk collection",
    response_model=List[RegulationSearchResult],
)
async def search_regulations(request: RegulationSearchRequest):
    """
    Hybrid semantic search over trade law regulations:
    - Cosine vector similarity on 1024-dimension embeddings
    - BM25/keyword lexical boost across legal citations and keywords
    """
    try:
        results = await CustomsAgentService.search_regulations_hybrid(request)
        return results
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Regulation search failed: {str(e)}",
        )


# ============================================================================
# 3. Composite Risk Engine Endpoints
# ============================================================================

@m3_router.post(
    "/v1/risk/assess",
    summary="Compute 5-pillar composite shipment risk score and quote gating decision",
    response_description="Fused risk assessment with factor-level explainability breakdown",
)
async def assess_shipment_risk(request: RiskAssessRequest):
    """
    Fuses 5 weighted dimensions:
    - Weather (30%)
    - Customs (25%)
    - Route (20%)
    - Port (15%)
    - Cargo (10%)

    Outputs composite score (0-100), risk tier (LOW/MEDIUM/HIGH/CRITICAL), and quote decision.
    """
    try:
        assessment = await RiskEngineService.assess_risk(request)
        return {"success": True, "data": assessment}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Risk assessment failed: {str(e)}",
        )


@m3_router.get(
    "/v1/risk/{shipment_id}",
    summary="Retrieve composite risk assessment for a specific shipment",
)
async def get_shipment_risk(shipment_id: str):
    """
    Fetches the latest risk assessment and factor breakdown for a given shipment_id.
    """
    assessment = await RiskEngineService.get_assessment_by_shipment(shipment_id)
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No risk assessment found for shipment {shipment_id}",
        )
    return {"success": True, "data": assessment}


# ============================================================================
# 4. Alerts Management Endpoints
# ============================================================================

@m3_router.get(
    "/v1/alerts",
    summary="List active weather and risk alerts",
    response_model=AlertListResponse,
)
async def list_alerts(
    status: Optional[str] = Query(None, description="Filter by status (ACTIVE, ACKNOWLEDGED, RESOLVED)"),
    severity: Optional[str] = Query(None, description="Filter by severity (CRITICAL, WARNING, INFO)"),
    shipment_id: Optional[str] = Query(None, description="Filter by shipment ID"),
):
    """
    Returns unified list of WeatherAlert and RiskAlert objects.
    """
    try:
        return await AlertsService.get_all_alerts(status=status, severity=severity, shipment_id=shipment_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve alerts: {str(e)}",
        )


@m3_router.post(
    "/v1/alerts/{alert_id}/acknowledge",
    summary="Acknowledge active alert by ID",
)
async def acknowledge_alert(alert_id: str, request: AlertAcknowledgeRequest):
    """
    Transitions status of alert from ACTIVE to ACKNOWLEDGED with officer timestamp.
    """
    result = await AlertsService.acknowledge_alert(alert_id, request)
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=result.get("error", "Alert not found"),
        )
    return result
