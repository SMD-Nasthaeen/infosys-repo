import React from 'react';
import { X, Printer, Download, Rocket, ShieldCheck, Check, ArrowLeft } from 'lucide-react';
import { SavedQuotation } from '../types';
import { formatCurrency } from '../utils/calculator';
import { generateQuotePDF } from '../utils/pdfGenerator';

interface QuotePDFModalProps {
  quote: SavedQuotation | null;
  onClose: () => void;
}

export const QuotePDFModal: React.FC<QuotePDFModalProps> = ({ quote, onClose }) => {
  if (!quote) return null;

  const { breakdown, formData } = quote;
  const cur = breakdown.currency;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-2 sm:p-4 overflow-hidden">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[92vh] sm:max-h-[90vh] shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col my-auto">
        {/* Top Control Bar */}
        <div className="bg-[#0F172A] text-white p-3.5 px-6 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/30 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Form</span>
            </button>
            <div className="hidden sm:flex items-center gap-2 border-l border-slate-800 pl-3">
              <Rocket className="w-4 h-4 text-blue-400" />
              <span className="font-extrabold text-xs tracking-wide">COMMERCIAL QUOTATION</span>
              <span className="bg-blue-600/30 text-blue-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-blue-500/30">
                {quote.id}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={() => generateQuotePDF(quote)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-700 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
              title="Close & Return to Calculation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Confirmation Bar */}
        <div className="bg-emerald-50 border-b border-emerald-100 p-2.5 px-6 sm:px-8 text-emerald-800 text-xs font-bold flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
            <span>Quotation generated & issued successfully. Official Reference ID: {quote.id}</span>
          </div>
          <span className="text-[10px] text-emerald-600 uppercase font-extrabold tracking-wider bg-emerald-100 px-2 py-0.5 rounded-full">
            CONFIRMED
          </span>
        </div>

        {/* Printable Commercial Invoice Document Area */}
        <div className="p-6 sm:p-8 space-y-6 bg-white overflow-y-auto flex-1 min-h-0 print:p-0 print:m-0 print:shadow-none" id="printable-quote">
          {/* Document Header */}
          <div className="bg-[#0F172A] text-white p-6 rounded-2xl flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-white tracking-wider flex items-center gap-2">
                FREIGHTHUB
              </h2>
              <p className="text-xs text-cyan-400 font-bold uppercase tracking-widest mt-0.5">
                SMART LOGISTICS ENGINE • COMMERCIAL FREIGHT QUOTATION
              </p>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-base font-black text-amber-400">QUOTE NO: {quote.id}</div>
              <div className="text-xs text-slate-300 font-medium">DATE ISSUED: {quote.createdAt}</div>
              <div className="text-xs text-emerald-400 font-bold mt-1 uppercase">
                STATUS: {quote.status}
              </div>
            </div>
          </div>

          {/* Shipper & Route Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <div>
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                SHIPPER / COMMERCIAL CLIENT
              </h4>
              <div className="text-xs space-y-1 font-semibold text-slate-800">
                <p className="text-sm font-black text-slate-900">{quote.companyName || quote.shipperName}</p>
                <p>Contact: {quote.shipperName}</p>
                <p>Email: {formData.email || 'N/A'}</p>
                <p>Country: {formData.country || 'India'}</p>
              </div>
            </div>

            <div>
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                ROUTE & SERVICE PARAMETERS
              </h4>
              <div className="text-xs space-y-1 font-semibold text-slate-800">
                <p className="text-sm font-black text-blue-700">{quote.routeSummary}</p>
                <p>Mode: {quote.transportMode.toUpperCase()} {quote.oceanLoadType ? `(${quote.oceanLoadType})` : ''}</p>
                <p>Incoterm: {formData.incoterm || 'FOB'}</p>
                <p>Est. Transit: {breakdown.estimatedTransitDays} ({breakdown.estimatedDistanceNmOrKm})</p>
              </div>
            </div>
          </div>

          {/* Cargo Line Items */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              CARGO PARAMETERS & SPECIFICATIONS
            </h4>
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-[10px] font-black text-slate-600 uppercase border-b border-slate-200">
                    <th className="py-2.5 px-4">#</th>
                    <th className="py-2.5 px-4">COMMODITY</th>
                    <th className="py-2.5 px-4">PACKAGE / SPEC</th>
                    <th className="py-2.5 px-4">QTY</th>
                    <th className="py-2.5 px-4">GROSS WEIGHT</th>
                    <th className="py-2.5 px-4">HS CODE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                  {(formData?.cargoItems || []).map((item, idx) => (
                    <tr key={item.id}>
                      <td className="py-3 px-4 font-bold text-slate-500">0{idx + 1}</td>
                      <td className="py-3 px-4 font-bold">{item.commodityDescription || 'Freight Cargo'}</td>
                      <td className="py-3 px-4">{item.containerSpec || item.packageType}</td>
                      <td className="py-3 px-4 font-bold">{item.quantity}</td>
                      <td className="py-3 px-4">{item.grossWeightKg} kg</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{item.hsCode || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Itemized Cost Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              ITEMIZED COMMERCIAL TARIFF BREAKDOWN
            </h4>
            <div className="border border-slate-200 rounded-2xl p-5 space-y-2 text-xs bg-slate-50/50">
              <div className="flex justify-between py-1 text-slate-700">
                <span>Base {quote.transportMode.toUpperCase()} Tariff Rate</span>
                <span className="font-bold text-slate-900">{formatCurrency(breakdown.baseTariff, cur)}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-700">
                <span>Bunker Adjustment Factor (BAF / Fuel Surcharge)</span>
                <span className="font-bold text-slate-900">{formatCurrency(breakdown.bafFuelSurcharge, cur)}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-700">
                <span>Terminal Handling Charges (THC)</span>
                <span className="font-bold text-slate-900">{formatCurrency(breakdown.terminalHandlingCharge, cur)}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-700">
                <span>Port Documentation Filing & Customs Paperwork</span>
                <span className="font-bold text-slate-900">{formatCurrency(breakdown.documentationFee, cur)}</span>
              </div>
              {breakdown.specialHandlingSurcharge > 0 && (
                <div className="flex justify-between py-1 text-amber-700 font-medium">
                  <span>Special Goods Handling Surcharge</span>
                  <span className="font-bold">{formatCurrency(breakdown.specialHandlingSurcharge, cur)}</span>
                </div>
              )}
              {breakdown.insuranceFee > 0 && (
                <div className="flex justify-between py-1 text-blue-700 font-medium">
                  <span>Cargo Marine Insurance Premium</span>
                  <span className="font-bold">{formatCurrency(breakdown.insuranceFee, cur)}</span>
                </div>
              )}
              {breakdown.discountAmount > 0 && (
                <div className="flex justify-between py-1 text-emerald-700 font-bold">
                  <span>Promotional Offer Discount</span>
                  <span>-{formatCurrency(breakdown.discountAmount, cur)}</span>
                </div>
              )}

              <div className="border-t border-slate-300 pt-3 flex justify-between text-base font-black text-slate-900">
                <span>TOTAL COMMERCIAL TARIFF:</span>
                <span className="text-blue-700">{formatCurrency(breakdown.grandTotal, cur)}</span>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="bg-slate-100 rounded-2xl p-5 text-[11px] text-slate-600 space-y-1.5 border border-slate-200">
            <h5 className="font-black text-slate-800 uppercase tracking-wider">COMMERCIAL SLA & TERMS:</h5>
            <p>• Quotation rate locked for 14 calendar days from date of issuance.</p>
            <p>• Transit time subject to ocean/weather delays and port customs clearance verification.</p>
            <p>• Rate excludes import customs duties and destination demurrage charges if incurred.</p>
          </div>
        </div>

        {/* Modal Footer Control Bar */}
        <div className="bg-[#0F172A] p-4 px-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/30 hover:scale-[1.01]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Calculation Form</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handlePrint}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700 hover:text-white"
            >
              <Printer className="w-4 h-4 text-slate-400" />
              <span>Print Quote</span>
            </button>
            <button
              onClick={() => generateQuotePDF(quote)}
              className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-700"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Download Official PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
