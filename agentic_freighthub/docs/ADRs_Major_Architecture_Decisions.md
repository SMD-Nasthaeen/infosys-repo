# Architecture Decision Records (ADRs)

## ADR-001: 5-Pillar Risk Weighting Formulation
- **Status**: Accepted
- **Context**: Risk must balance immediate navigational hazards with regulatory delays and corridor safety.
- **Decision**: Adopt 30% Weather, 25% Customs, 20% Route, 15% Port Congestion, and 10% Cargo Fragility.
- **Consequences**: Weather and customs govern 55% of the score, reflecting their dominant impact on demurrage and detention.

## ADR-002: Role-Based Separation of Customs Sign-Off
- **Status**: Accepted
- **Context**: Shippers should not approve their own regulatory compliance checks.
- **Decision**: Decouple the Customs Officer Workspace from the User Risk view. Shippers submit dossiers and view status; verified Customs Officers execute approvals in the Customs Officer Portal.
- **Consequences**: Strict compliance integrity and realistic simulation of CBIC / ICEGATE workflows.

## ADR-003: Hybrid Lexical-Dense RAG for Trade Regulations
- **Status**: Accepted
- **Context**: Trade regulations require precision matching on HS codes alongside semantic matching for hazard classes.
- **Decision**: Implement BM25 + Vector cosine similarity re-ranking.
