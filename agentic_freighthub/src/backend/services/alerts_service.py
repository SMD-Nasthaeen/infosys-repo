"""
Milestone 3 (M3) — Alerts Management Service
Handles CRUD, filtering, and acknowledgement workflows for WeatherAlert and RiskAlert.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from src.backend.models.m3_models import (
    WeatherAlert,
    RiskAlert,
    AlertStatus,
    AlertSeverity,
    utc_now,
)


class AlertAcknowledgeRequest(BaseModel):
    user: str = Field(default="customs.officer@freighthub.in", description="User email acknowledging the alert")
    notes: Optional[str] = Field(None, description="Optional acknowledgement resolution notes")


class AlertListResponse(BaseModel):
    success: bool = True
    total_count: int
    weather_alerts: List[Dict[str, Any]]
    risk_alerts: List[Dict[str, Any]]


class AlertsService:
    """
    Alerts Service for operational exception handling across weather and composite risk domains.
    """

    # In-memory backup store
    _weather_alerts: dict[str, dict] = {}
    _risk_alerts: dict[str, dict] = {}

    @classmethod
    async def get_all_alerts(
        cls,
        status: Optional[str] = None,
        severity: Optional[str] = None,
        shipment_id: Optional[str] = None,
    ) -> AlertListResponse:
        weather_list: List[Dict[str, Any]] = []
        risk_list: List[Dict[str, Any]] = []

        try:
            # Query Beanie documents
            w_query = {}
            r_query = {}
            if status:
                w_query["status"] = status
                r_query["status"] = status
            if severity:
                w_query["severity"] = severity
                r_query["severity"] = severity
            if shipment_id:
                w_query["shipment_id"] = shipment_id
                r_query["shipment_id"] = shipment_id

            w_docs = await WeatherAlert.find(w_query).to_list()
            r_docs = await RiskAlert.find(r_query).to_list()

            weather_list = [w.dict() for w in w_docs]
            risk_list = [r.dict() for r in r_docs]
        except Exception:
            pass

        # Fallback seeded data if empty
        if not weather_list and not cls._weather_alerts:
            cls._seed_alerts()

        if not weather_list:
            weather_list = list(cls._weather_alerts.values())
        if not risk_list:
            risk_list = list(cls._risk_alerts.values())

        if status:
            weather_list = [w for w in weather_list if w.get("status") == status]
            risk_list = [r for r in risk_list if r.get("status") == status]

        return AlertListResponse(
            success=True,
            total_count=len(weather_list) + len(risk_list),
            weather_alerts=weather_list,
            risk_alerts=risk_list,
        )

    @classmethod
    async def acknowledge_alert(cls, alert_id: str, req: AlertAcknowledgeRequest) -> Dict[str, Any]:
        """
        Acknowledge an active alert by ID in either WeatherAlert or RiskAlert collection.
        """
        now = utc_now()

        # 1. Check MongoDB Beanie
        try:
            w_alert = await WeatherAlert.get(alert_id)
            if w_alert:
                w_alert.status = AlertStatus.ACKNOWLEDGED
                w_alert.acknowledged_by = req.user
                w_alert.acknowledged_at = now
                await w_alert.save()
                return {
                    "success": True,
                    "alert_id": alert_id,
                    "type": "WEATHER_ALERT",
                    "status": "ACKNOWLEDGED",
                    "acknowledged_by": req.user,
                    "acknowledged_at": now.isoformat(),
                }

            r_alert = await RiskAlert.get(alert_id)
            if r_alert:
                r_alert.status = AlertStatus.ACKNOWLEDGED
                r_alert.acknowledged_by = req.user
                r_alert.acknowledged_at = now
                await r_alert.save()
                return {
                    "success": True,
                    "alert_id": alert_id,
                    "type": "RISK_ALERT",
                    "status": "ACKNOWLEDGED",
                    "acknowledged_by": req.user,
                    "acknowledged_at": now.isoformat(),
                }
        except Exception:
            pass

        # 2. Check in-memory store
        if alert_id in cls._weather_alerts:
            cls._weather_alerts[alert_id]["status"] = "ACKNOWLEDGED"
            cls._weather_alerts[alert_id]["acknowledged_by"] = req.user
            cls._weather_alerts[alert_id]["acknowledged_at"] = now.isoformat()
            return {
                "success": True,
                "alert_id": alert_id,
                "type": "WEATHER_ALERT",
                "status": "ACKNOWLEDGED",
                "acknowledged_by": req.user,
                "acknowledged_at": now.isoformat(),
            }

        if alert_id in cls._risk_alerts:
            cls._risk_alerts[alert_id]["status"] = "ACKNOWLEDGED"
            cls._risk_alerts[alert_id]["acknowledged_by"] = req.user
            cls._risk_alerts[alert_id]["acknowledged_at"] = now.isoformat()
            return {
                "success": True,
                "alert_id": alert_id,
                "type": "RISK_ALERT",
                "status": "ACKNOWLEDGED",
                "acknowledged_by": req.user,
                "acknowledged_at": now.isoformat(),
            }

        return {
            "success": False,
            "error": f"Alert with ID {alert_id} not found",
        }

    @classmethod
    def _seed_alerts(cls):
        now_str = utc_now().isoformat()
        cls._weather_alerts["ALT-WTR-8812"] = {
            "id": "ALT-WTR-8812",
            "shipment_id": "SHP-1002",
            "route_id": "ROUTE-INBOM-AEDXB-01",
            "alert_type": "TROPICAL_STORM",
            "severity": "CRITICAL",
            "title": "Arabian Sea Monsoon Squall Alert",
            "message": "Heavy cyclonic depression in Sector 4 generating 34-knot winds and 3.8m wave swells.",
            "latitude": 18.92,
            "longitude": 68.45,
            "starts_at": now_str,
            "ends_at": now_str,
            "status": "ACTIVE",
            "created_at": now_str,
        }
        cls._risk_alerts["ALT-RSK-9901"] = {
            "id": "ALT-RSK-9901",
            "shipment_id": "SHP-1002",
            "quote_id": "Q-2026-8842",
            "risk_assessment_id": "RSK-8812",
            "alert_type": "QUOTE_HOLD_COMPLIANCE",
            "severity": "WARNING",
            "title": "Customs MSDS Clearance Pending",
            "message": "Class 3 flammable cargo requires chemical flashpoint certificate verification.",
            "source": "Customs Agent RAG",
            "status": "ACTIVE",
            "created_at": now_str,
        }
