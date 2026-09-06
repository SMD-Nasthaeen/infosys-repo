# Retrieval-Augmented Generation (RAG) Architecture

## 1. Pipeline Overview
The Customs Intelligence Agent uses a Hybrid RAG architecture to parse trade circulars and legal acts:
1. **Document Ingestion**: Parsing PDF / Text regulations from CBIC, DGFT, and IMO.
2. **Chunking & Metadata**: Text split into fixed window size (350 tokens) with 50-token overlap, preserving Chapter, Section, and Clause tags.
3. **Dual Indexing**:
   - Inverted BM25 keyword index for exact legal terms and HS Code digits.
   - Dense vector embeddings for conceptual matching (e.g., "lithium batteries fire hazard" mapping to IMDG Class 9).
4. **Re-Ranking & Context Formulation**: Top-K retrieved chunks are scored, filtered, and injected into the prompt context for compliance assessment.
5. **Traceability**: Every output maps to a verifiable legal citation.
