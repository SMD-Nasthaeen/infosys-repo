# Milestone 3: REST & Service API Documentation

## 1. Endpoints

### 1.1 Weather Agent
- `POST /v1/weather/assess`
  - **Body**: `{ origin_port, destination_port, departure_date, route_geometry? }`
  - **Response**: `{ wave_height_meters, wind_knots, beaufort_scale, storm_risk_score, delay_probability_pct, buffer_hours, advisory }`

### 1.2 Customs Agent
- `POST /v1/customs/validate`
  - **Body**: `{ hs_code, origin_port, destination_port, incoterm, cargo_value_inr }`
  - **Response**: `{ valid, bcd_pct, igst_pct, sws_pct, estimated_duty_inr, required_documents, status }`
- `POST /v1/customs/{check_id}/sign-off`
  - **Headers**: `Authorization: Bearer <officer_token>`
  - **Body**: `{ decision: "APPROVED" | "NEEDS_DOCUMENTS" | "REJECTED", notes: string }`
  - **Response**: `{ check_id, status, signed_off_at, signed_off_by }`
- `POST /v1/customs/rag/search`
  - **Body**: `{ query: string, top_k?: number }`
  - **Response**: `{ results: Array<{ id, document_title, text, similarity_score, citation }> }`

### 1.3 5-Pillar Risk Engine
- `POST /v1/risk/evaluate`
  - **Body**: `{ weather_score, customs_score, route_score, congestion_score, cargo_score }`
  - **Response**: `{ composite_score, risk_level, confidence, factors: [...] }`

### 1.4 ML Pricing Comparison
- `POST /v1/pricing/predict`
  - **Body**: `{ origin, destination, container_type, weight_mt, transit_days, fuel_index }`
  - **Response**: `{ rule_price, ml_predicted_price, delta_amount, delta_pct, metrics: { mae, rmse, r2 } }`
