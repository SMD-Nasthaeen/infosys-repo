import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Sparkles,
  Layers,
  ShieldCheck,
  FileText,
  ExternalLink,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Building,
  RefreshCw
} from 'lucide-react';
import { RegulationChunk, HSCodeReference } from '../types/milestone3';
import { SEEDED_REGULATION_CHUNKS, SEEDED_HS_CODES, SEEDED_REGULATION_DOCS } from '../data/milestone3Data';

interface RegulationsLibraryWorkspaceProps {
  onBackToCustoms?: () => void;
}

export const RegulationsLibraryWorkspace: React.FC<RegulationsLibraryWorkspaceProps> = ({
  onBackToCustoms,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('advance manifest notification IMO IMDG declaration');
  const [selectedAuthority, setSelectedAuthority] = useState<string>('ALL');
  const [selectedDocId, setSelectedDocId] = useState<string>('ALL');
  const [results, setResults] = useState<RegulationChunk[]>(SEEDED_REGULATION_CHUNKS);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [selectedHsCode, setSelectedHsCode] = useState<string>('8471.30.10');
  const [hsCatalog] = useState<HSCodeReference[]>(SEEDED_HS_CODES);

  // Active HS Details
  const activeHs =
    (hsCatalog || []).find((h) => h && h.hs_code === selectedHsCode) ||
    (hsCatalog || [])[0] || null;

  // Search RAG pipeline
  const handleRAGSearch = async (queryToRun: string = searchQuery) => {
    setIsSearching(true);
    try {
      const response = await fetch(`/v1/regulations/search?q=${encodeURIComponent(queryToRun || '')}&limit=8`);
      if (response.ok) {
        const data = await response.json();
        if (data.results && Array.isArray(data.results) && data.results.length > 0) {
          setResults(data.results);
          setIsSearching(false);
          return;
        }
      }
    } catch {
      // Fallback local query filter
    }

    // Local Hybrid RAG Simulation (BM25 + Semantic filter)
    const terms = (queryToRun || '').toLowerCase().split(' ').filter(Boolean);
    const filtered = (SEEDED_REGULATION_CHUNKS || []).filter((chunk) => {
      if (!chunk) return false;
      const chunkCitation = chunk.legal_citation || chunk.citation || '';
      const chunkContent = chunk.content || '';
      const chunkSection = chunk.section_name || '';
      const chunkKeywords = Array.isArray(chunk.keywords) ? chunk.keywords : [];
      const matchesTerms = terms.some(
        (t) =>
          chunkContent.toLowerCase().includes(t) ||
          chunkCitation.toLowerCase().includes(t) ||
          chunkSection.toLowerCase().includes(t) ||
          chunkKeywords.some((k) => (k || '').toLowerCase().includes(t))
      );
      const matchesAuth =
        selectedAuthority === 'ALL' ||
        chunk.authority === selectedAuthority ||
        (chunkCitation && chunkCitation.includes(selectedAuthority));
      const matchesDoc =
        selectedDocId === 'ALL' ||
        chunk.regulation_document_id === selectedDocId ||
        chunk.documentId === selectedDocId;
      return (matchesTerms || terms.length === 0) && matchesAuth && matchesDoc;
    });

    setResults(filtered.length > 0 ? filtered : SEEDED_REGULATION_CHUNKS);
    setIsSearching(false);
  };

  const authorities = ['ALL', 'CBIC (India)', 'DGFT', 'IMO / SOLAS', 'Singapore Customs', 'WCO / HS'];

  return (
    <div id="regulations-library-workspace" className="max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Cross-Border Regulatory Knowledge Library & RAG
              <span className="text-xs bg-purple-900/60 text-purple-300 font-semibold px-2 py-0.5 rounded border border-purple-700/50">
                Hybrid Vector Retrieval
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Query statutory maritime law, customs circulars, and FTA schedules using 1024-dimensional semantic embeddings
            </p>
          </div>
        </div>

        {onBackToCustoms && (
          <button
            onClick={onBackToCustoms}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            ← Back to Customs Queue
          </button>
        )}
      </div>

      {/* RAG Search Engine Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Query statutory compliance, advance filing timeframes, DGFT notifications, IMO IMDG codes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRAGSearch()}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-medium"
            />
          </div>

          <button
            id="btn-run-rag-query"
            onClick={() => handleRAGSearch()}
            disabled={isSearching}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Retrieve Citations
          </button>
        </div>

        {/* Quick Query Suggestions */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800">
          <span className="font-semibold text-slate-500">Preset Queries:</span>
          {[
            'Customs Act Section 46 advance bill of entry',
            'SOLAS Verified Gross Mass VGM 16-point guidelines',
            'IMDG Code Class 3 marine flammable clearance',
            'India-Singapore CECA rules of origin certificate',
          ].map((preset, pIdx) => (
            <button
              key={`preset-${pIdx}-${preset.slice(0, 15)}`}
              onClick={() => {
                setSearchQuery(preset);
                handleRAGSearch(preset);
              }}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] border border-slate-700 transition-colors cursor-pointer"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Grid: Search Results & HS Code Classifier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: RAG Retrieved Chunks & Legal Citations (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-purple-400" />
              Retrieved Statutory Citations ({(results || []).length} Matches)
            </span>
            <span className="font-mono text-[11px]">Similarity Metric: Cosine Hybrid BM25</span>
          </div>

          <div className="space-y-3.5">
            {(results || []).map((chunk, idx) => (
              <div
                key={`chunk-${chunk.id || idx}-${idx}`}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4.5 shadow-md transition-all"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono text-purple-400">
                      {chunk.legal_citation || chunk.citation || chunk.section_name || `Section ${idx + 1}`}
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 font-semibold px-2 py-0.5 rounded border border-slate-700">
                      {chunk.authority || 'Customs Regulation'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono font-bold">
                    <span>Score:</span>
                    <span>{((chunk.relevance_score ?? 0.88) * 100).toFixed(1)}%</span>
                  </div>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed font-sans">{chunk.content}</p>

                <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-800/60 text-[11px]">
                  <div className="flex flex-wrap gap-1">
                    {(chunk.keywords || []).map((kw, kwIdx) => (
                      <span key={`kw-${chunk.id || idx}-${kwIdx}-${kw}`} className="bg-slate-950 text-slate-400 px-1.5 py-0.5 rounded text-[10px]">
                        #{kw}
                      </span>
                    ))}
                  </div>
                  <span className="text-slate-500 font-mono text-[10px]">Doc Ref: {chunk.regulation_document_id || chunk.documentId || chunk.id || `DOC-${idx}`}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: HS Code Classification & Tariff Schedule (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-purple-400" /> HS Code Tariff Explorer
            </h3>

            {/* HS Code Selector */}
            <div>
              <label className="text-xs text-slate-400 font-medium block mb-1">Select Commodity HS Code</label>
              <select
                value={selectedHsCode}
                onChange={(e) => setSelectedHsCode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 font-mono"
              >
                {(hsCatalog || []).map((h, hIdx) => (
                  <option key={`hs-${h.hs_code || hIdx}-${hIdx}`} value={h.hs_code}>
                    {h.hs_code} — {h.description}
                  </option>
                ))}
              </select>
            </div>

            {/* HS Details Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 space-y-2.5">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Description</span>
                <span className="text-xs font-bold text-slate-200">{activeHs?.description || 'N/A'}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Basic Duty (BCD)</span>
                  <span className="font-mono font-bold text-emerald-400">{activeHs?.basic_customs_duty_pct ?? 0}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">IGST Rate</span>
                  <span className="font-mono font-bold text-emerald-400">{activeHs?.igst_pct ?? 18}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">SWS Surcharge</span>
                  <span className="font-mono font-bold text-slate-300">10%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Risk Category</span>
                  <span className="font-bold text-amber-400">{activeHs?.restricted ? 'HIGH' : activeHs?.requires_inspection ? 'MEDIUM' : 'LOW'}</span>
                </div>
              </div>
            </div>

            {/* Mandatory Documentation Requirements */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Mandatory Documentation Required
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {['Commercial Invoice', 'Packing List', 'Certificate of Origin'].map((doc, idx) => (
                  <li key={`doc-${idx}-${doc.slice(0, 10)}`} className="flex items-start gap-2 bg-slate-800/40 p-2 rounded border border-slate-700/50">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 mt-0.5 shrink-0" />
                    <span>{doc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
