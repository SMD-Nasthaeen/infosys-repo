# Milestone 3: Requirements & Functional Specifications

## 1. Executive Summary & Scope
Milestone 3 extends the Freight Price Intelligence & Quotation Platform with autonomous, AI-assisted agents and risk engines:
1. **Weather Intelligence Agent**: Ingests route geometry, samples oceanic waypoints, assesses sea conditions (Beaufort scale, wave height, storm proximity), computes weather risk (0-100), and models delay probability.
2. **Customs & Regulatory Intelligence Agent**: Validates HS codes, origin/destination trade corridors, and Incoterms; queries a regulatory knowledge base using Hybrid RAG; determines statutory duties (BCD, IGST, SWS); generates mandatory document checklists; and orchestrates compliance sign-offs.
3. **5-Pillar Shipment Risk Engine**: Combines Weather (30%), Customs & Compliance (25%), Route & Geometry (20%), Port Congestion (15%), and Cargo/Hazmat (10%) into an explainable composite risk score.
4. **Machine Learning Price Predictor**: Operates alongside rule-based pricing algorithms, providing predictive adjustments and regression benchmark telemetry (MAE, RMSE, R²).
5. **Role-Based Workflow & Human-in-the-Loop Sign-Off**: Cleanly separates Shipper / Customer portals from Customs Compliance Officer verification desks.

---

## 2. Functional Requirements by Actor

### 2.1 Shipper / Sales User Portal
- **FR-USR-01**: Input origin, destination, cargo volume, Incoterm, and 6-8 digit HS Code.
- **FR-USR-02**: Receive multi-modal route candidates with nautical distances, port chokepoints, and transit durations.
- **FR-USR-03**: View rule-based breakdown with ML predictive comparisons.
- **FR-USR-04**: View route-specific weather warnings and sea state metrics (Beaufort scale, wave height, storm risk).
- **FR-USR-05**: View statutory duty calculations (BCD, IGST, SWS) and mandatory document checklists.
- **FR-USR-06**: Upload shipping compliance documents (Invoice, Packing List, MSDS, Certificate of Origin).
- **FR-USR-07**: For pre-cleared cargo, immediately generate and issue an official cryptographic 14-day price lock quote. For restricted/high-risk cargo, submit dossier to Customs Officer Desk.

### 2.2 Customs Compliance Officer Portal
- **FR-OFF-01**: Access dedicated compliance queue of held shipments (`NEEDS_REVIEW`, `NEEDS_DOCUMENTS`).
- **FR-OFF-02**: Inspect uploaded compliance documents against mandatory ICEGATE / CBIC requirements.
- **FR-OFF-03**: Verify or reject individual document checklist items.
- **FR-OFF-04**: Search regulatory repository using Hybrid RAG with semantic retrieval and regulatory citations.
- **FR-OFF-05**: Endorse, hold, or reject shipment clearance with timestamped audit notes.

### 2.3 System Risk & Pricing Engine
- **FR-SYS-01**: Calculate composite risk score using weighted formula:
  $$\text{Risk Score} = 0.30 \times \text{Weather} + 0.25 \times \text{Customs} + 0.20 \times \text{Route} + 0.15 \times \text{Port} + 0.10 \times \text{Cargo}$$
- **FR-SYS-02**: Classify risk level into `LOW` (0-30), `MEDIUM` (31-60), `HIGH` (61-80), `CRITICAL` (81-100).
- **FR-SYS-03**: Enforce quote gate: High risk cargo or restricted HS Codes require officer sign-off before quotation release.
- **FR-SYS-04**: Evaluate ML model metrics against benchmark targets ($R^2 \ge 0.94$, $\text{MAE} \le \$95$).
