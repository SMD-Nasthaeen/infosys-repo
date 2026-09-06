# Milestone 3: System Architecture

## 1. High-Level Architecture
The system architecture follows a decoupled, service-oriented full-stack design with event-driven agents:

```
[ Frontend: React 18 + Tailwind CSS + Lucide ]
   ├── Customer / Shipper Portal (Workflow & Live Quotes)
   ├── Customs Officer Portal (Compliance Review & Sign-Off)
   ├── Admin Master Console & Analytics
   └── Shared Risk & Intelligence Workspaces
           │
           ▼  (REST / WebSocket API)
[ Node.js / Express Server API Gateway ]
   ├── /api/weather/*  ──> Weather Intelligence Agent
   ├── /api/customs/*  ──> Customs & RAG Agent
   ├── /api/risk/*     ──> 5-Pillar Shipment Risk Engine
   ├── /api/pricing/*  ──> ML Model & Rule Engine Benchmark
   └── /api/quotes/*   ──> Quotation Minting & PDF Generator
           │
           ▼
[ Data Layer & Knowledge Stores ]
   ├── In-Memory & Distributed Document Cache
   ├── Vector Embedding Store & Inverted Lexical Index
   └── Statutory Tariff Rules & Master HS Code Directory
```

## 2. Agent Collaboration Model
1. **Parallel Extraction**: On shipment creation, the system triggers the Weather Agent and Customs Agent concurrently.
2. **Synthesis & Weighting**: The 5-Pillar Risk Engine aggregates agent signals and corridor data into an explainable composite risk payload.
3. **Decision Tree**:
   - `APPROVED`: Automatic pre-clearance -> immediate quote issuance.
   - `NEEDS_REVIEW`: Routed to Customs Officer Portal inbox -> human sign-off required.
   - `BLOCKED`: Cargo prohibited by statutory trade policy -> quotation disallowed.
