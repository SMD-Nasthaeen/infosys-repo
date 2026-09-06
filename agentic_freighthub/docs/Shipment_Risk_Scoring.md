# 5-Pillar Shipment Risk Scoring Engine

## 1. Weighting Formulation
The composite risk engine evaluates five orthogonal pillars of maritime and overland freight logistics:

| Pillar | Weight | Key Inputs |
| :--- | :--- | :--- |
| **Weather Risk** | **30%** | Wind speed, swell height, cyclone warning index, seasonal monsoon phase |
| **Customs & Compliance** | **25%** | HS Code restriction tier, documentation readiness, duty complexity, sanctions |
| **Route & Corridor** | **20%** | Distance, piracy chokepoint transit (Bab-el-Mandeb, Malacca), geopolitical security |
| **Port Congestion** | **15%** | Vessel turnaround time, berth waiting hours, container yard occupancy |
| **Cargo Fragility & Hazmat** | **10%** | IMO IMDG classification, temperature sensitivity, value-to-weight ratio |

$$\text{Composite Score} = (0.30 \cdot W) + (0.25 \cdot C) + (0.20 \cdot R) + (0.15 \cdot P) + (0.10 \cdot G)$$

## 2. Risk Classification & Decision Gates
- **0 - 30 (LOW)**: Green status. Eligible for automatic instant pre-clearance and quotation release.
- **31 - 60 (MEDIUM)**: Yellow status. Standard clearance. Flag warnings on quote certificate.
- **61 - 80 (HIGH)**: Orange status. Mandatory Customs Officer sign-off required before quotation issuance.
- **81 - 100 (CRITICAL)**: Red status. Extreme storm / prohibited goods. Automatic route lock or quotation blocked.
