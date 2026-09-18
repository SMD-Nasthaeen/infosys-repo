import React, { useState } from 'react';
import { SavedQuotation, ProofDocumentSlot, CalculationSnapshot } from '../types';
import { Check, Shield, AlertCircle, Package, ArrowRight, ChevronDown, ChevronUp, Calculator } from 'lucide-react';

interface M4CompareQuotesViewProps {
  quotations: SavedQuotation[];
  onQuoteSelected: () => void;
  userEmail: string;
  onUpdateQuotation?: (quote: SavedQuotation) => void;
  onDeleteQuotation?: (quoteId: string) => void;
  onDeleteMultipleQuotations?: (quoteIds: string[]) => void;
  uploadedFiles?: Array<{ fileUrl: string; fileName: string; fileSize: number }>;
  proofDocuments?: ProofDocumentSlot[];
}

const SnapshotRow: React.FC<{ label: string; value: string | number; bold?: boolean; color?: string }> = ({ label, value, bold, color }) => (
  <div className="flex items-center justify-between py-1">
    <span className="text-[10px] text-slate-400 font-bold uppercase">{label}</span>
    <span className={`text-[11px] ${bold ? 'font-black' : 'font-bold'} ${color || 'text-slate-700'}`}>{value}</span>
  </div>
);

const CalculationPanel: React.FC<{ snapshot: CalculationSnapshot; companyName: string; quoteId: string }> = ({ snapshot, companyName, quoteId }) => (
  <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-4">
    <div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">AI Calculation Breakdown</p>
      <p className="text-[10px] text-slate-400 font-bold mb-3">{companyName} — {quoteId}</p>
    </div>

    <div className="space-y-0.5">
      <SnapshotRow label="Base Freight" value={`₹${snapshot.baseFreight.toLocaleString()}`} />
      <SnapshotRow label="BAF (Bunker Adjustment)" value={`₹${snapshot.bafFuelSurcharge.toLocaleString()}`} />
      <SnapshotRow label="Origin THC" value={`₹${snapshot.originThc.toLocaleString()}`} />
      <SnapshotRow label="Documentation" value={`₹${snapshot.documentationFee.toLocaleString()}`} />
      {snapshot.specialHandling > 0 && <SnapshotRow label="Special Handling" value={`₹${snapshot.specialHandling.toLocaleString()}`} />}
      {snapshot.insuranceFee > 0 && <SnapshotRow label="Insurance" value={`₹${snapshot.insuranceFee.toLocaleString()}`} />}
      {snapshot.discountAmount > 0 && <SnapshotRow label="Discount" value={`-₹${snapshot.discountAmount.toLocaleString()}`} color="text-emerald-600" />}
      <div className="border-t border-slate-200 my-1" />
      <SnapshotRow label="Total Cost" value={`₹${snapshot.totalCost.toLocaleString()}`} bold />
      <SnapshotRow label="Margin" value={`${snapshot.marginPercentage}% (₹${snapshot.marginAmount.toLocaleString()})`} />
      <div className="border-t border-slate-200 my-1" />
      <SnapshotRow label="Final Sell Price" value={`₹${snapshot.finalSellPrice.toLocaleString()}`} bold color="text-blue-700" />
    </div>

    <div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Route Calculation</p>
      <div className="space-y-0.5">
        <SnapshotRow label="Origin" value={snapshot.routeDetails.origin} />
        <SnapshotRow label="Destination" value={snapshot.routeDetails.destination} />
        <SnapshotRow label="Distance" value={snapshot.routeDetails.distance} />
        <SnapshotRow label="Transit" value={snapshot.routeDetails.transitDays} />
        <SnapshotRow label="Estimated Arrival" value={snapshot.routeDetails.estimatedArrival} />
      </div>
    </div>

    <div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Pricing Factors</p>
      <div className="space-y-0.5">
        <SnapshotRow label="Transport Mode" value={snapshot.pricingFactors.transportMode.toUpperCase()} />
        {snapshot.pricingFactors.containerSpec && <SnapshotRow label="Container Type" value={snapshot.pricingFactors.containerSpec} />}
        <SnapshotRow label="Containers" value={snapshot.pricingFactors.containerCount} />
        <SnapshotRow label="Incoterm" value={snapshot.pricingFactors.incoterm} />
        <SnapshotRow label="Total Weight" value={`${snapshot.pricingFactors.totalWeightKg} kg`} />
        <SnapshotRow label="Cargo" value={snapshot.pricingFactors.cargoSummary} />
      </div>
    </div>

    {(snapshot.aiCalculation.ruleBasedPrice || snapshot.aiCalculation.aiPredictedPrice) && (
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">AI / ML Calculation</p>
        <div className="space-y-0.5">
          {snapshot.aiCalculation.ruleBasedPrice && <SnapshotRow label="Rule Based Price" value={`₹${snapshot.aiCalculation.ruleBasedPrice.toLocaleString()}`} />}
          {snapshot.aiCalculation.aiPredictedPrice && <SnapshotRow label="ML Predicted Price" value={`₹${snapshot.aiCalculation.aiPredictedPrice.toLocaleString()}`} />}
          {snapshot.aiCalculation.recommendedPrice && <SnapshotRow label="Recommended Price" value={`₹${snapshot.aiCalculation.recommendedPrice.toLocaleString()}`} />}
          {snapshot.aiCalculation.weatherRiskScore !== undefined && <SnapshotRow label="Weather Risk" value={snapshot.aiCalculation.weatherRiskScore} />}
          {snapshot.aiCalculation.customsRiskScore !== undefined && <SnapshotRow label="Customs Risk" value={snapshot.aiCalculation.customsRiskScore} />}
          {snapshot.aiCalculation.compositeRiskScore !== undefined && <SnapshotRow label="Composite Risk" value={snapshot.aiCalculation.compositeRiskScore} />}
          {snapshot.aiCalculation.overallRiskLevel && <SnapshotRow label="Risk Level" value={snapshot.aiCalculation.overallRiskLevel} />}
        </div>
      </div>
    )}
  </div>
);

export const M4CompareQuotesView: React.FC<M4CompareQuotesViewProps> = ({
  quotations,
  onQuoteSelected,
  userEmail,
  onUpdateQuotation,
  onDeleteQuotation,
  onDeleteMultipleQuotations,
  uploadedFiles = [],
  proofDocuments = [],
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [expandedCalcId, setExpandedCalcId] = useState<string | null>(null);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);

  const availableQuotes = quotations.filter(
    (q) =>
      q.status !== 'REJECTED' &&
      q.status !== 'ACCEPTED' &&
      q.status !== 'BOOKED' &&
      q.status !== 'SUPERSEDED' &&
      (!q.shipperEmail || q.shipperEmail === userEmail)
  );

  const handleSelectQuote = async (quote: SavedQuotation) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const token = localStorage.getItem('freighthub_session_token') || '';
      
      // Build available quotes array for agent visibility
      const allAvailableQuotes = availableQuotes.map((q) => ({
        quoteId: q.id,
        companyName: q.companyName,
        companyId: q.companyId || 'COMP-001',
        tariffAmount: q.tariffAmount,
        currency: q.currency,
        originCode: q.originCode,
        destinationCode: q.destinationCode,
        transportMode: q.transportMode,
        calculationSnapshot: q.calculationSnapshot || null,
      }));

      const response = await fetch('/api/selected-quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          quoteId: quote.id,
          companyName: quote.companyName,
          companyId: quote.companyId || 'COMP-001',
          originCode: quote.originCode,
          destinationCode: quote.destinationCode,
          transportMode: quote.transportMode,
          tariffAmount: quote.tariffAmount,
          currency: quote.currency,
          shipperEmail: quote.shipperEmail || userEmail,
          calculationSnapshot: quote.calculationSnapshot || null,
          availableQuotes: allAvailableQuotes,
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const selectedSqId = result.data.selectedQuoteId;
        if (onUpdateQuotation) {
          onUpdateQuotation({ ...quote, status: 'SELECTED' });
        }
        if (uploadedFiles.length > 0 && selectedSqId) {
          const t = localStorage.getItem('freighthub_session_token') || '';
          for (const file of uploadedFiles) {
            let documentType = 'OTHER';
            if (file.fileName.match(/\.(pdf)$/i)) documentType = 'COMMERCIAL_INVOICE';
            else if (file.fileName.match(/\.(jpg|jpeg|png)$/i)) documentType = 'PACKING_LIST';
            else if (file.fileName.match(/\.(doc|docx)$/i)) documentType = 'CUSTOMS_DOCUMENT';

            await fetch(`/api/selected-quotes/${selectedSqId}/documents`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
              body: JSON.stringify({ documentType, fileName: file.fileName, fileUrl: file.fileUrl, fileSize: file.fileSize, mimeType: file.fileName.match(/\.(jpg|jpeg|png)$/i) ? 'image/jpeg' : file.fileName.match(/\.pdf$/i) ? 'application/pdf' : 'application/msword' })
            });
          }
        }
        if (proofDocuments.length > 0) {
          const t = localStorage.getItem('freighthub_session_token') || '';
          for (const doc of proofDocuments) {
            if (doc.status === 'UPLOADED' && doc.fileUrl && doc.fileName) {
              await fetch('/api/selected-quotes/proof-documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
                body: JSON.stringify({ documentType: doc.documentType, fileName: doc.fileName, fileUrl: doc.fileUrl, fileSize: doc.fileSize || 0, mimeType: doc.fileName.match(/\.(jpg|jpeg|png)$/i) ? 'image/jpeg' : doc.fileName.match(/\.pdf$/i) ? 'application/pdf' : 'application/msword' })
            });
            }
          }
        }
        const idsToDelete = quotations.filter(q => q.id !== quote.id).map(q => q.id);
        if (onDeleteMultipleQuotations && idsToDelete.length > 0) {
          onDeleteMultipleQuotations(idsToDelete);
        } else if (onDeleteQuotation) {
          idsToDelete.forEach(id => onDeleteQuotation(id));
        }
        setSelectedQuoteId(quote.id);
        setSuccessMsg(`Quote ${quote.id} Selected Successfully!`);
        setTimeout(() => { onQuoteSelected(); }, 1200);
        setIsSubmitting(false);
        return;
      }

      if (onUpdateQuotation) {
        onUpdateQuotation({ ...quote, status: 'SELECTED' });
      }
      const fallbackIds = quotations.filter(q => q.id !== quote.id).map(q => q.id);
      if (onDeleteMultipleQuotations && fallbackIds.length > 0) {
        onDeleteMultipleQuotations(fallbackIds);
      } else if (onDeleteQuotation) {
        fallbackIds.forEach(id => onDeleteQuotation(id));
      }
      setSelectedQuoteId(quote.id);
      setSuccessMsg(`Quote ${quote.id} Selected Successfully!`);
      setTimeout(() => { onQuoteSelected(); }, 1200);
    } catch {
      if (onUpdateQuotation) {
        onUpdateQuotation({ ...quote, status: 'SELECTED' });
      }
      const catchIds = quotations.filter(q => q.id !== quote.id).map(q => q.id);
      if (onDeleteMultipleQuotations && catchIds.length > 0) {
        onDeleteMultipleQuotations(catchIds);
      } else if (onDeleteQuotation) {
        catchIds.forEach(id => onDeleteQuotation(id));
      }
      setSelectedQuoteId(quote.id);
      setSuccessMsg(`Quote ${quote.id} Selected Successfully!`);
      setTimeout(() => { onQuoteSelected(); }, 1200);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5 animate-in fade-in">
      <div>
        <h3 className="text-base font-black text-slate-900">Compare Company Quotes</h3>
        <p className="text-xs text-slate-500">
          Select a verified rate proposal below to submit it for final freight agent verification.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-xs font-bold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-xs font-bold">
          <Check className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {availableQuotes.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
          <Package className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">No Quotes Available</h4>
          <p className="text-xs text-slate-400">Generate a quote from the Rate Calculator to view comparisons here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {availableQuotes.map((q) => {
            const isExpired = q.status === 'EXPIRED' || (q.expiresAt && Date.now() > new Date(q.expiresAt).getTime());
            const isCalcExpanded = expandedCalcId === q.id;
            const isSelected = selectedQuoteId === q.id || q.status === 'SELECTED';
            return (
            <div key={q.id} className={`bg-white border rounded-2xl overflow-hidden transition-all duration-200 ${isSelected ? 'border-blue-400 ring-2 ring-blue-100 shadow-md' : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'} ${isExpired ? 'opacity-75' : ''}`}>
              {/* Card Header - Clickable to toggle calculation */}
              <button
                type="button"
                onClick={() => setExpandedCalcId(isCalcExpanded ? null : q.id)}
                className="w-full text-left p-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className={`w-4 h-4 ${isSelected ? 'text-blue-600' : isExpired ? 'text-slate-400' : 'text-slate-600'}`} />
                      <span className="font-black text-xs text-slate-900">{q.companyName || 'FreightHub'}</span>
                      {q.version && q.version > 1 && (
                        <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-full">v{q.version}</span>
                      )}
                      {isSelected && (
                        <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" /> SELECTED
                        </span>
                      )}
                      {isExpired && (
                        <span className="bg-red-100 text-red-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Expired</span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">{q.id}</span>
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="font-bold text-slate-800">{q.originCode} → {q.destinationCode}</span>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {(q.transportMode || '').toUpperCase()}
                      </span>
                      <span className="font-black text-slate-700">{q.currency || 'INR'} {q.tariffAmount?.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {q.calculationSnapshot && (
                      <span className="hidden sm:flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                        <Calculator className="w-3 h-3" /> View Calculation
                      </span>
                    )}
                    {isCalcExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>
              </button>

              {/* Expanded Calculation Panel */}
              {isCalcExpanded && q.calculationSnapshot && (
                <CalculationPanel snapshot={q.calculationSnapshot} companyName={q.companyName} quoteId={q.id} />
              )}

              {/* Action Footer */}
              <div className="px-4 pb-4 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase">
                  {q.validUntil ? `Valid until ${q.validUntil}` : 'Standard validity'}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleSelectQuote(q); }}
                  disabled={isSubmitting || isExpired}
                  className={`${isExpired ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'} font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm`}
                >
                  <span>{isExpired ? 'Quote Expired' : 'Select Quote'}</span>
                  {!isExpired && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
