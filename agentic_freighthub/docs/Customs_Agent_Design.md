# Customs Agent & Regulatory RAG Design

## 1. Scope & Capabilities
The Customs Intelligence Agent automates regulatory compliance verification for cross-border freight movements:
- **HS Code Validation**: Maps 6-digit to 8-digit tariff classifications against the Indian Customs Tariff / CBIC schedule.
- **Duty & Tax Calculation**: Evaluates Basic Customs Duty (BCD), Integrated GST (IGST), and Social Welfare Surcharge (SWS).
- **Prohibited & Restricted Item Screening**: Identifies hazardous materials, dual-use technologies, and restricted commodities.
- **Mandatory Documentation Generation**: Dynamic ICEGATE document checklists tailored to commodity, Incoterm, and trade corridor.
- **Human-in-the-Loop Workflow**: Assigns non-trivial or restricted shipments to the Customs Officer Portal for verification.

## 2. Hybrid RAG Architecture
- **Chunking Strategy**: Semantic chunking of regulatory circulars (DGFT, CBIC, IMO IMDG Code) into 250-500 token passages with metadata (article number, effective date, issuing authority).
- **Hybrid Retrieval**: Combines BM25 lexical keyword matching with Dense Vector Cosine Similarity ($k=5$).
- **Citation Traceability**: Every compliance recommendation includes exact source document, chapter, paragraph, and legal circular references.
