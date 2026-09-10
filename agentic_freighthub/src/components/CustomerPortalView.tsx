import React, { useState, useMemo, useEffect } from 'react';
import {
  Package,
  Plus,
  Ship,
  Compass,
  FileText,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Shield,
  Layers,
  Sparkles,
  AlertCircle,
  Calendar,
  DollarSign,
  Download,
  Building,
  Anchor,
  Box,
  Truck,
  Check,
  Globe,
  Radar,
  MapPin,
  Search,
  Filter,
  Eye,
  RefreshCw
} from 'lucide-react';
import {
  runRouteAgent,
  INITIAL_SHIPMENTS,
  ShipmentRecord,
  RouteOption,
  ShipmentQuotation
} from '../data/shipmentData';
import { SavedQuotation } from '../types';
import { useMasterData } from '../services/masterDataService';
import { TrackingView } from './TrackingView';
import { UserPortalShipmentWorkflow } from './UserPortalShipmentWorkflow';
import { M4CompareQuotesView } from './M4CompareQuotesView';
import { M4SelectedQuotesView } from './M4SelectedQuotesView';

export interface CustomerPortalViewProps {
  onNavigateToTab?: (tab: string) => void;
  onOpenQuotationPdf?: (quoteId: string) => void;
  quotations?: SavedQuotation[];
  onAddQuotation?: (quote: SavedQuotation) => void;
  onUpdateQuotation?: (quote: SavedQuotation) => void;
  onViewQuotePDF?: (quote: SavedQuotation) => void;
}

export const CustomerPortalView: React.FC<CustomerPortalViewProps> = ({
  onNavigateToTab,
  onOpenQuotationPdf,
  quotations = [],
  onAddQuotation,
  onUpdateQuotation,
  onViewQuotePDF,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'create' | 'my-shipments' | 'my-quotations' | 'tracking' | 'compare-quotes' | 'selected-quotes' | 'bookings'>('overview');
  const [trackingInitialQuote, setTrackingInitialQuote] = useState<string>('');

  // Filter state for My Shipments & My Quotations
  const [shipmentFilterStatus, setShipmentFilterStatus] = useState<string>('ALL');
  const [shipmentSearchTerm, setShipmentSearchTerm] = useState<string>('');
  const [quoteFilterStatus, setQuoteFilterStatus] = useState<string>('ALL');

  // Live Master Data from Service & Backend Sync
  const {
    customers: masterCustomersList,
    ports: masterPortsList,
    cargoTypes: masterCargoTypesList,
    containerTypes: masterContainerTypesList,
    carriers: masterCarriersList,
    tradeLanes: masterTradeLanesList,
  } = useMasterData();

  const activeCustomers = (masterCustomersList || []).filter((c) => c && c.isActive !== false);
  const activePorts = (masterPortsList || []).filter((p) => p && p.isActive !== false);
  const activeCargoTypes = (masterCargoTypesList || []).filter((c) => c && c.isActive !== false);
  const activeContainerTypes = (masterContainerTypesList || []).filter((ct) => ct && ct.isActive !== false);
  const activeCarriers = (masterCarriersList || []).filter((c) => c && c.isActive !== false);
  const activeTradeLanes = (masterTradeLanesList || []).filter((t) => t && t.isActive !== false);

  // Customer State
  const [selectedCustomer, setSelectedCustomer] = useState<string>(''); 
  
  // Persistent Shipments state
  const [shipments, setShipments] = useState<ShipmentRecord[]>(() => {
    try {
      const stored = localStorage.getItem('freighthub_saved_shipments_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load cached shipments', e);
    }
    return INITIAL_SHIPMENTS;
  });

  // Synchronize shipments with other components / storage events
  useEffect(() => {
    const handleSync = () => {
      try {
        const stored = localStorage.getItem('freighthub_saved_shipments_v1');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setShipments(parsed);
          }
        }
      } catch (e) {
        console.error('Failed to sync shipments', e);
      }
    };

    window.addEventListener('freighthub_shipments_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('freighthub_shipments_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Helper for today's date YYYY-MM-DD
  const todayDateStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Create Shipment Form State
  const [originPort, setOriginPort] = useState<string>('');
  const [originCode, setOriginCode] = useState<string>('');
  const [destinationPort, setDestinationPort] = useState<string>('');
  const [destinationCode, setDestinationCode] = useState<string>('');
  const [cargoType, setCargoType] = useState<string>('');
  const [containerType, setContainerType] = useState<string>('');
  const [shipmentDate, setShipmentDate] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Agent State during creation
  const [isAnalyzingRoute, setIsAnalyzingRoute] = useState<boolean>(false);
  const [agentAnalysisStep, setAgentAnalysisStep] = useState<number>(0);
  const [createdShipment, setCreatedShipment] = useState<ShipmentRecord | null>(null);
  const [selectedRouteOption, setSelectedRouteOption] = useState<RouteOption | null>(null);

  // Selected Detail Modal
  const [viewingShipment, setViewingShipment] = useState<ShipmentRecord | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const matchedCustomer = activeCustomers.find(
    (c) => c.customerCode === selectedCustomer || c._id === selectedCustomer
  ) || activeCustomers[0] || {
    customerCode: 'C001',
    companyName: 'ABC Logistics',
    tier: 'GOLD',
    primaryHub: 'Chennai (INMAA)',
    email: 'ops@abclogistics.com',
  };

  const currentCustomer = {
    code: selectedCustomer ? (matchedCustomer.customerCode || selectedCustomer) : (matchedCustomer.customerCode || 'C001'),
    name: selectedCustomer ? matchedCustomer.companyName : (matchedCustomer.companyName || 'ABC Logistics'),
    tier: matchedCustomer.tier || 'GOLD',
    primaryHub: matchedCustomer.primaryHub || 'Chennai (INMAA)',
    email: matchedCustomer.email || 'ops@abclogistics.com',
  };

  // Filtered shipments for current view:
  // If a specific customer is explicitly selected, we can filter or show all
  const displayedShipments = useMemo(() => {
    let list = shipments || [];
    if (selectedCustomer) {
      list = (list || []).filter(
        (s) =>
          s.customerId === currentCustomer.code ||
          (s.customerName || '').toLowerCase().includes((currentCustomer.name || '').toLowerCase())
      );
    }
    if (shipmentFilterStatus !== 'ALL') {
      list = (list || []).filter((s) => s.status === shipmentFilterStatus);
    }
    if ((shipmentSearchTerm || '').trim()) {
      const term = shipmentSearchTerm.toLowerCase().trim();
      list = (list || []).filter(
        (s) =>
          (s.id || '').toLowerCase().includes(term) ||
          (s.originPort || '').toLowerCase().includes(term) ||
          (s.destinationPort || '').toLowerCase().includes(term) ||
          (s.cargoType || '').toLowerCase().includes(term) ||
          (s.recommendedRoute?.carrierName && s.recommendedRoute.carrierName.toLowerCase().includes(term))
      );
    }
    return list;
  }, [shipments, selectedCustomer, currentCustomer.code, currentCustomer.name, shipmentFilterStatus, shipmentSearchTerm]);

  // Combined Quotations List:
  // Merges shipments with quotations AND global quotations passed down from calculation workspace
  const combinedQuotations = useMemo(() => {
    interface QuotationDisplayItem {
      quoteId: string;
      shipmentId?: string;
      shipperName: string;
      originPort: string;
      destinationPort: string;
      cargoSummary: string;
      carrierName: string;
      transitDays: number | string;
      freightCostUsd: number;
      operationalCostUsd: number;
      marginPct: number;
      marginAmountUsd: number;
      finalQuoteUsd: number;
      tariffAmountInr?: number;
      currency?: string;
      status: string;
      validUntil: string;
      createdAt: string;
      rawQuote?: SavedQuotation;
      shipment?: ShipmentRecord;
    }

    const items: QuotationDisplayItem[] = [];
    const seenIds = new Set<string>();

    // 1. From shipments with quotation
    shipments.forEach((s) => {
      if (s.quotation) {
        seenIds.add(s.quotation.quoteId);
        items.push({
          quoteId: s.quotation.quoteId,
          shipmentId: s.id,
          shipperName: s.customerName || currentCustomer.name,
          originPort: s.originPort,
          destinationPort: s.destinationPort,
          cargoSummary: `${s.containerType} • ${s.cargoType}`,
          carrierName: s.recommendedRoute?.carrierName || 'Direct Ocean Liner',
          transitDays: s.recommendedRoute?.transitDays || 6,
          freightCostUsd: s.quotation.freightCostUsd,
          operationalCostUsd: s.quotation.operationalCostUsd,
          marginPct: s.quotation.marginPct,
          marginAmountUsd: s.quotation.marginAmountUsd,
          finalQuoteUsd: s.quotation.finalQuoteUsd,
          tariffAmountInr: s.quotation.finalQuoteUsd * 83,
          currency: 'USD',
          status: s.quotation.status || s.status,
          validUntil: s.quotation.validUntil,
          createdAt: s.quotation.generatedAt || s.createdAt,
          shipment: s,
        });
      }
    });

    // 2. From global quotations passed via props / storage
    quotations.forEach((q) => {
      if (!seenIds.has(q.id)) {
        seenIds.add(q.id);
        const usdRate = Math.round(q.tariffAmount / 83);
        const baseCost = q.breakdown?.baseTariff ? Math.round(q.breakdown.baseTariff / 83) : Math.round(usdRate * 0.75);
        const opCost = Math.round(usdRate * 0.15);
        const marginAmt = Math.round(usdRate * 0.10);

        items.push({
          quoteId: q.id,
          shipperName: q.companyName || q.shipperName,
          originPort: q.originCode || 'Nhava Sheva (INNSA)',
          destinationPort: q.destinationCode || 'Jebel Ali (AEJEA)',
          cargoSummary: q.cargoSummary || `${q.oceanLoadType || 'FCL'} Container`,
          carrierName: q.breakdown?.carrierName || 'CMA CGM Express',
          transitDays: q.breakdown?.transitDaysRange || '6–8 Days',
          freightCostUsd: baseCost,
          operationalCostUsd: opCost,
          marginPct: 15,
          marginAmountUsd: marginAmt,
          finalQuoteUsd: usdRate,
          tariffAmountInr: q.tariffAmount,
          currency: q.currency || 'INR',
          status: q.status === 'APPROVED' ? 'APPROVED' : 'GENERATED',
          validUntil: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
          createdAt: q.createdAt,
          rawQuote: q,
        });
      }
    });

    if (quoteFilterStatus !== 'ALL') {
      return (items || []).filter((item) => item.status.toUpperCase() === quoteFilterStatus.toUpperCase());
    }
    return items || [];
  }, [shipments, quotations, currentCustomer.name, quoteFilterStatus]);

  const handleClearForm = () => {
    setSelectedCustomer('');
    setOriginPort('');
    setOriginCode('');
    setDestinationPort('');
    setDestinationCode('');
    setCargoType('');
    setContainerType('');
    setShipmentDate('');
    setValidationError(null);
  };

  const handleSubmitShipment = () => {
    if (!selectedCustomer) {
      setValidationError('Please select a Customer from the dropdown.');
      return;
    }
    if (!originPort) {
      setValidationError('Please select an Origin Port.');
      return;
    }
    if (!destinationPort) {
      setValidationError('Please select a Destination Port.');
      return;
    }
    if (originPort === destinationPort) {
      setValidationError('Origin Port and Destination Port cannot be identical. Please choose distinct locations.');
      return;
    }
    if (!cargoType) {
      setValidationError('Please select a Cargo Type.');
      return;
    }
    if (!containerType) {
      setValidationError('Please select a Container Type.');
      return;
    }
    if (!shipmentDate) {
      setValidationError('Please select a valid Shipment Date.');
      return;
    }

    setValidationError(null);
    setIsAnalyzingRoute(true);
    setAgentAnalysisStep(1);

    setTimeout(() => {
      setAgentAnalysisStep(2);
    }, 600);

    setTimeout(() => {
      setAgentAnalysisStep(3);
    }, 1200);

    setTimeout(() => {
      const { routes, recommendedRoute } = runRouteAgent(
        originPort,
        destinationPort,
        cargoType,
        containerType,
        { carriers: activeCarriers, tradeLanes: activeTradeLanes }
      );
      const nextIdNum = shipments.length + 1;
      const newShipmentId = `SHP00${nextIdNum}`;
      const newQuoteId = `QT-2026-00${935 + nextIdNum}`;

      const baseFreight = recommendedRoute.baseFreightCostUsd || 1450;
      const opCost = Math.round(baseFreight * 0.18);
      const marginPct = 15;
      const marginAmt = Math.round((baseFreight + opCost) * (marginPct / 100));
      const finalQuote = baseFreight + opCost + marginAmt;

      const generatedQuotation: ShipmentQuotation = {
        quoteId: newQuoteId,
        freightCostUsd: baseFreight,
        operationalCostUsd: opCost,
        marginPct: marginPct,
        marginAmountUsd: marginAmt,
        finalQuoteUsd: finalQuote,
        status: 'GENERATED',
        generatedAt: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      };

      const newRecord: ShipmentRecord = {
        id: newShipmentId,
        customerId: currentCustomer.code,
        customerName: currentCustomer.name,
        originPort,
        originCode: originCode || 'INMAA',
        destinationPort,
        destinationCode: destinationCode || 'SGSIN',
        cargoType,
        containerType,
        shipmentDate,
        status: 'QUOTE_GENERATED',
        createdAt: new Date().toISOString().split('T')[0],
        routeOptions: routes,
        recommendedRoute: recommendedRoute,
        selectedRoute: recommendedRoute,
        quotation: generatedQuotation,
        notes: `Created via Customer Portal. Route Agent recommended ${recommendedRoute.name} (${recommendedRoute.carrierName}, ${recommendedRoute.transitDays} Days). Quotation ${newQuoteId} auto-generated.`,
      };

      const newSavedQuote: SavedQuotation = {
        id: newQuoteId,
        shipperName: currentCustomer.name,
        companyName: currentCustomer.name,
        routeSummary: `${originPort} -> ${destinationPort}`,
        originCode: originCode || 'INMAA',
        destinationCode: destinationCode || 'SGSIN',
        transportMode: 'ocean',
        oceanLoadType: 'FCL',
        tariffAmount: finalQuote * 83,
        currency: 'INR',
        status: 'PENDING_BROKER_REVIEW',
        createdAt: new Date().toISOString().split('T')[0],
        cargoSummary: `1 x ${containerType} (${cargoType})`,
        breakdown: {
          baseTariff: baseFreight * 83,
          bafFuelSurcharge: Math.round(opCost * 0.5 * 83),
          terminalHandlingCharge: Math.round(opCost * 0.4 * 83),
          documentationFee: Math.round(opCost * 0.1 * 83),
          specialHandlingSurcharge: 0,
          insuranceFee: Math.round(finalQuote * 0.02 * 83),
          discountAmount: 0,
          subtotal: Math.round(finalQuote * 83),
          estimatedTax: Math.round(finalQuote * 0.18 * 83),
          grandTotal: Math.round(finalQuote * 1.18 * 83),
          currency: 'INR',
          chargeBasis: 'Per Container Spec (Ocean FCL)',
          cargoCountSummary: `1 x ${containerType}`,
          totalWeightKg: 1000,
          estimatedDistanceNmOrKm: 'Direct Ocean Corridor',
          estimatedTransitDays: `${recommendedRoute.transitDays} d`,
          estimatedArrivalDate: new Date(Date.now() + recommendedRoute.transitDays * 86400000).toISOString().split('T')[0],
        },
        formData: {
          originPortCode: originCode || 'INMAA',
          destinationPortCode: destinationCode || 'SGSIN',
          pickupHubId: 'PK-02',
          deliveryHubId: 'DL-01',
          cargoReadyDate: shipmentDate,
          requiredDeliveryDate: new Date(new Date(shipmentDate).getTime() + (recommendedRoute.transitDays + 2) * 86400000).toISOString().split('T')[0],
          transportMode: 'ocean',
          oceanLoadType: 'FCL',
          incoterm: 'FOB',
          cargoItems: [
            {
              id: 'item-portal-1',
              packageType: containerType.includes('20') ? '20GP Container' : '40HC Container',
              containerSpec: containerType.includes('20') ? '20GP' : '40HC',
              quantity: 1,
              grossWeightKg: 1000,
              commodityDescription: cargoType,
              hsCode: '8400.00',
            }
          ],
          declaredValue: finalQuote * 83 * 10,
          currency: 'INR',
          specialInstructions: `Route Agent recommended ${recommendedRoute.name} (${recommendedRoute.carrierName})`,
          fragileGoods: false,
          hazardousMaterials: (cargoType || '').toLowerCase().includes('chemical') || (cargoType || '').toLowerCase().includes('haz'),
          temperatureControlled: (cargoType || '').toLowerCase().includes('pharma') || (cargoType || '').toLowerCase().includes('perish'),
          addCargoInsurance: true,
          promoCodeApplied: null,
          fullName: currentCustomer.name,
          companyName: currentCustomer.name,
          email: currentCustomer.email,
          country: 'India',
        }
      };

      const updatedShipments = [newRecord, ...shipments];
      setShipments(updatedShipments);
      try {
        localStorage.setItem('freighthub_saved_shipments_v1', JSON.stringify(updatedShipments));
        window.dispatchEvent(new Event('freighthub_shipments_updated'));
      } catch (e) {
        console.error(e);
      }

      if (onAddQuotation) {
        onAddQuotation(newSavedQuote);
      }

      setCreatedShipment(newRecord);
      setSelectedRouteOption(recommendedRoute);
      setIsAnalyzingRoute(false);
      setAgentAnalysisStep(0);
      setSuccessToast(`Shipment ${newShipmentId} logged & Quotation ${newQuoteId} generated successfully!`);
      setTimeout(() => setSuccessToast(null), 5000);
    }, 1800);
  };

  const handleApproveQuote = (quoteId: string, shipmentId?: string) => {
    // Update shipment state
    const updatedShipments = shipments.map((s) => {
      if ((shipmentId && s.id === shipmentId) || (s.quotation && s.quotation.quoteId === quoteId)) {
        return {
          ...s,
          status: 'APPROVED' as const,
          quotation: s.quotation
            ? {
                ...s.quotation,
                status: 'APPROVED' as const,
                approvedAt: new Date().toISOString().split('T')[0],
              }
            : undefined,
        };
      }
      return s;
    });

    setShipments(updatedShipments);
    try {
      localStorage.setItem('freighthub_saved_shipments_v1', JSON.stringify(updatedShipments));
      window.dispatchEvent(new Event('freighthub_shipments_updated'));
    } catch (e) {
      console.error(e);
    }

    // Update quote in parent if callback available
    if (onUpdateQuotation) {
      const matched = quotations.find((q) => q.id === quoteId);
      if (matched) {
        onUpdateQuotation({ ...matched, status: 'APPROVED' });
      }
    }

    setSuccessToast(`Quotation ${quoteId} approved! Commercial booking confirmed and carrier notified.`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleViewQuotationPDF = (quoteId: string) => {
    const matched = quotations.find((q) => q.id === quoteId);
    if (matched && onViewQuotePDF) {
      onViewQuotePDF(matched);
    } else if (onOpenQuotationPdf) {
      onOpenQuotationPdf(quoteId);
    } else {
      setSuccessToast(`Opening Quotation PDF for ${quoteId}...`);
      setTimeout(() => setSuccessToast(null), 3000);
    }
  };


  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <span className="text-xs font-bold">{successToast}</span>
        </div>
      )}

      {/* Customer Header with Account Switcher */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-600">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">{currentCustomer.name}</h2>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {currentCustomer.tier} TIER
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Code: <span className="font-bold text-slate-700">{currentCustomer.code}</span> | Hub: {currentCustomer.primaryHub} | {currentCustomer.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="text-xs font-bold text-slate-500">Switch Customer Account:</label>
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {activeCustomers.map((cust) => (
              <option key={cust._id || cust.customerCode} value={cust.customerCode}>
                {cust.companyName} ({cust.customerCode})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Customer Dashboard Navigation Tabs */}
      <div className="bg-slate-900 text-white rounded-2xl p-2 flex flex-wrap gap-1">
        <button
          onClick={() => {
            setActiveSubTab('overview');
            setCreatedShipment(null);
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'overview' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('create');
            setCreatedShipment(null);
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'create' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Create Shipment</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>

        <button
          onClick={() => {
            setActiveSubTab('my-shipments');
            setCreatedShipment(null);
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'my-shipments' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Ship className="w-4 h-4" />
          <span>My Shipments</span>
          <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-full font-black">
            {displayedShipments.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('my-quotations');
            setCreatedShipment(null);
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'my-quotations' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>My Quotations</span>
          <span className="bg-slate-800 text-slate-300 text-[10px] px-2 py-0.5 rounded-full font-black">
            {combinedQuotations.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('tracking');
            setCreatedShipment(null);
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'tracking' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Shipment Tracking</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('compare-quotes');
            setCreatedShipment(null);
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'compare-quotes' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Compare Quotes</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('selected-quotes');
            setCreatedShipment(null);
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'selected-quotes' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Selected Quotes</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('bookings');
            setCreatedShipment(null);
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'bookings' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Bookings</span>
        </button>
      </div>

      {/* VIEW 1: OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Shipments</span>
              <div className="text-2xl font-black text-slate-900">{displayedShipments.length}</div>
              <p className="text-[11px] text-slate-500">Active registered cargo jobs</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-1">
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Routes Optimized</span>
              <div className="text-2xl font-black text-emerald-700">
                {(displayedShipments || []).filter((s) => s.status === 'ROUTE_READY' || s.status === 'APPROVED' || s.status === 'QUOTE_GENERATED').length}
              </div>
              <p className="text-[11px] text-slate-500">Route Agent direct & feeder</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-1">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider">Quotations Issued</span>
              <div className="text-2xl font-black text-blue-700">
                {combinedQuotations.length}
              </div>
              <p className="text-[11px] text-slate-500">Commercial verified rates</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-1">
              <span className="text-[10px] font-black text-purple-600 uppercase tracking-wider">Avg Transit Time</span>
              <div className="text-2xl font-black text-purple-700">5.5 Days</div>
              <p className="text-[11px] text-slate-500">Direct Express corridors</p>
            </div>
          </div>

          {/* Quick Create CTA Card */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 z-10 max-w-xl">
              <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 px-3 py-1 rounded-full text-xs font-bold text-cyan-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Autonomous Route Agent Engine Active</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black">Plan & Book Next Freight Shipment</h3>
              <p className="text-xs text-blue-200">
                Create a shipment with Origin, Destination, Cargo & Container specs. The AI Route Agent will instantly analyze carriers, transit times, and generate optimal routes.
              </p>
            </div>

            <button
              onClick={() => setActiveSubTab('create')}
              className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black px-6 py-3.5 rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Shipment Now</span>
            </button>
          </div>

          {/* Recent Shipments Preview */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Recent Customer Shipments</h3>
                <p className="text-xs text-slate-500">Live corridor status & route recommendations</p>
              </div>
              <button
                onClick={() => setActiveSubTab('my-shipments')}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View All Shipments ({displayedShipments.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {displayedShipments.slice(0, 5).map((s) => (
                <div key={s.id} className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">{s.id}</span>
                      <span className="text-xs font-black text-slate-900">
                        {s.originPort} → {s.destinationPort}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">({s.cargoType}, {s.containerType})</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Recommended Carrier: <span className="font-bold text-slate-700">{s.recommendedRoute?.carrierName || 'Direct Liner'}</span> ({s.recommendedRoute?.transitDays || '--'} Days)
                    </p>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span
                      className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                        s.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : s.status === 'ROUTE_READY' || s.status === 'QUOTE_GENERATED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {s.status.replace('_', ' ')}
                    </span>
                    <button
                      onClick={() => {
                        setViewingShipment(s);
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: CREATE SHIPMENT (Matching Steps 2, 3, 4, 5) */}
      {activeSubTab === 'create' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900">Create New Freight Shipment</h3>
                <p className="text-xs text-slate-500">
                  Define corridor, cargo, container type & shipment date to trigger the Route Agent
                </p>
              </div>
              <button
                type="button"
                onClick={handleClearForm}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Reset Form</span>
              </button>
            </div>

            {/* Validation Error Banner */}
            {validationError && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Customer */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span>Customer ({activeCustomers.length} Active in Master)</span>
                </label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => {
                    setSelectedCustomer(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Select an option</option>
                  {activeCustomers.map((cust) => (
                    <option key={cust._id || cust.customerCode} value={cust.customerCode}>
                      {cust.companyName} ({cust.customerCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Origin Port */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Anchor className="w-3.5 h-3.5 text-slate-400" />
                  <span>Origin Port ({activePorts.length} Ports Available)</span>
                </label>
                <select
                  value={originPort}
                  onChange={(e) => {
                    setOriginPort(e.target.value);
                    const port = activePorts.find((p) => p.portName === e.target.value || p.unlocode === e.target.value);
                    if (port) setOriginCode(port.unlocode);
                    else setOriginCode('');
                    if (validationError) setValidationError(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Select an option</option>
                  {activePorts.map((port) => (
                    <option key={port._id || port.unlocode} value={port.portName}>
                      {port.portName} ({port.unlocode}) — {port.city || port.countryCode}
                    </option>
                  ))}
                </select>
              </div>

              {/* Destination Port */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Anchor className="w-3.5 h-3.5 text-slate-400" />
                  <span>Destination Port ({activePorts.length} Ports Available)</span>
                </label>
                <select
                  value={destinationPort}
                  onChange={(e) => {
                    setDestinationPort(e.target.value);
                    const port = activePorts.find((p) => p.portName === e.target.value || p.unlocode === e.target.value);
                    if (port) setDestinationCode(port.unlocode);
                    else setDestinationCode('');
                    if (validationError) setValidationError(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Select an option</option>
                  {activePorts.map((port) => (
                    <option key={port._id || port.unlocode} value={port.portName}>
                      {port.portName} ({port.unlocode}) — {port.city || port.countryCode}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cargo Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Box className="w-3.5 h-3.5 text-slate-400" />
                  <span>Cargo Type</span>
                </label>
                <select
                  value={cargoType}
                  onChange={(e) => {
                    setCargoType(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Select an option</option>
                  {activeCargoTypes.map((cg) => (
                    <option key={cg._id || cg.code} value={cg.label || cg.code}>
                      {cg.label || cg.code} ({cg.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Container Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Container Type</span>
                </label>
                <select
                  value={containerType}
                  onChange={(e) => {
                    setContainerType(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Select an option</option>
                  {activeContainerTypes.map((ct) => (
                    <option key={ct._id || ct.code} value={ct.code}>
                      {ct.code} — {ct.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Shipment Date */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Shipment Date</span>
                  </label>
                  <span className="text-[10px] font-semibold text-slate-400">Past dates disabled</span>
                </div>
                <input
                  type="date"
                  min={todayDateStr}
                  value={shipmentDate}
                  onChange={(e) => {
                    setShipmentDate(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="button"
                disabled={isAnalyzingRoute}
                onClick={handleSubmitShipment}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/30 cursor-pointer"
              >
                {isAnalyzingRoute ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Route Agent Analyzing Corridor ({agentAnalysisStep}/3)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Submit Shipment & Trigger Route Agent</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Route Agent Execution & Result Panel (Step 4 & Step 5) */}
          {createdShipment && (
            <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-black">
                      STATUS: {createdShipment.status}
                    </span>
                    <span className="font-mono text-xs text-slate-400">ID: {createdShipment.id}</span>
                  </div>
                  <h3 className="text-xl font-black text-white">
                    Route Intelligence Agent Results: {createdShipment.originPort} → {createdShipment.destinationPort}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Generated candidate routes for {createdShipment.customerName} ({createdShipment.cargoType}, {createdShipment.containerType})
                  </p>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-2xl text-right">
                  <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest block">Recommended Route</span>
                  <span className="text-lg font-black text-white">{createdShipment.recommendedRoute?.name}</span>
                  <span className="text-xs text-slate-300 block">{createdShipment.recommendedRoute?.carrierName} • {createdShipment.recommendedRoute?.transitDays} Days</span>
                </div>
              </div>

              {/* Step 4 Candidate Routes List */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  Step 4: Possible Generated Routes ({(createdShipment.routeOptions || []).length})
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(createdShipment.routeOptions || []).map((opt) => {
                    const isSelected = selectedRouteOption?.id === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setSelectedRouteOption(opt)}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
                          opt.isRecommended
                            ? 'bg-blue-950/60 border-cyan-400/80 shadow-lg shadow-cyan-900/20 ring-1 ring-cyan-400/50'
                            : isSelected
                            ? 'bg-slate-800 border-blue-400'
                            : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        {opt.isRecommended && (
                          <div className="absolute -top-3 left-4 bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider shadow">
                            ★ RECOMMENDED
                          </div>
                        )}

                        <div className="space-y-3 pt-1">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-base text-white">{opt.name}</span>
                            <span className="text-xs font-extrabold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-800/60">
                              {opt.transitDays} Days
                            </span>
                          </div>

                          <div className="space-y-1 text-xs">
                            <p className="text-slate-300 font-bold">{opt.path}</p>
                            <p className="text-slate-400">
                              Carrier: <span className="text-white font-bold">{opt.carrierName}</span>
                            </p>
                            <p className="text-slate-400">
                              Mode: <span className="text-slate-200">{opt.transshipmentType}</span>
                            </p>
                            <p className="text-slate-400">
                              Reliability: <span className="text-emerald-400 font-bold">{opt.reliabilityScore}%</span>
                            </p>
                          </div>

                          {opt.recommendationReason && (
                            <div className="p-2.5 bg-slate-900/80 rounded-xl text-[11px] text-slate-300 border border-slate-700/60">
                              {opt.recommendationReason}
                            </div>
                          )}

                          <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-700/60">
                            <span className="text-slate-400">Est. Base Freight:</span>
                            <span className="font-black text-white">${opt.baseFreightCostUsd}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  onClick={() => setActiveSubTab('my-shipments')}
                  className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white font-bold px-5 py-3 rounded-xl text-xs transition-all cursor-pointer"
                >
                  View in My Shipments
                </button>
                <button
                  onClick={() => {
                    setActiveSubTab('my-quotations');
                  }}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-black px-6 py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>Go to Quotations</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: MY SHIPMENTS */}
      {activeSubTab === 'my-shipments' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900">My Registered Shipments</h3>
              <p className="text-xs text-slate-500">
                Active shipments across all corridors with real-time status and synchronized quotations ({displayedShipments.length})
              </p>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => setActiveSubTab('create')}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Shipment</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by ID, Origin, Destination, Cargo or Carrier..."
                value={shipmentSearchTerm}
                onChange={(e) => setShipmentSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {['ALL', 'QUOTE_GENERATED', 'ROUTE_READY', 'APPROVED'].map((status) => (
                <button
                  key={status}
                  onClick={() => setShipmentFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                    shipmentFilterStatus === status
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {status.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {displayedShipments.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
              <Ship className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-700">No Shipments Found</h4>
                <p className="text-xs text-slate-400">Try adjusting search filters or create a new freight shipment.</p>
              </div>
              <button
                onClick={() => setActiveSubTab('create')}
                className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-blue-500 cursor-pointer"
              >
                Create New Shipment
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-3">Shipment ID</th>
                    <th className="py-3 px-3">Shipper / Customer</th>
                    <th className="py-3 px-3">Corridor</th>
                    <th className="py-3 px-3">Cargo & Container</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Carrier / Transit</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {displayedShipments.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-3">
                        <span className="font-black text-blue-700 bg-blue-50 px-2 py-1 rounded-md">{s.id}</span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-slate-800">{s.customerName}</span>
                        <span className="block text-[10px] text-slate-400 font-normal">{s.customerId}</span>
                      </td>
                      <td className="py-3.5 px-3 font-bold text-slate-900">
                        {s.originPort} → {s.destinationPort}
                      </td>
                      <td className="py-3.5 px-3 text-slate-600">
                        {s.cargoType} • <span className="font-bold text-slate-800">{s.containerType}</span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-600">{s.shipmentDate}</td>
                      <td className="py-3.5 px-3 font-bold text-slate-900">
                        <span>{s.recommendedRoute?.carrierName || 'Liner Express'}</span>
                        <span className="block text-[10px] text-slate-500 font-medium">
                          {s.recommendedRoute?.transitDays ? `${s.recommendedRoute.transitDays} Days` : '--'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                            s.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : s.status === 'ROUTE_READY' || s.status === 'QUOTE_GENERATED'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {s.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingShipment(s)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-2.5 py-1.5 rounded-xl cursor-pointer"
                            title="View Route Details"
                          >
                            Routes
                          </button>
                          {s.quotation && (
                            <button
                              onClick={() => {
                                handleViewQuotationPDF(s.quotation!.quoteId);
                              }}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1.5 rounded-xl cursor-pointer"
                              title="View Quotation"
                            >
                              Quote
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setActiveSubTab('tracking');
                            }}
                            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl cursor-pointer"
                            title="Track Live"
                          >
                            Track
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW 4: MY QUOTATIONS */}
      {activeSubTab === 'my-quotations' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900">Commercial Quotations</h3>
              <p className="text-xs text-slate-500">
                Verified rate proposals generated across calculation workspaces and shipment jobs ({combinedQuotations.length})
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (onNavigateToTab) onNavigateToTab('calculation');
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Calculator Quote</span>
              </button>
            </div>
          </div>

          {/* Status Filter Bar */}
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 overflow-x-auto">
            {['ALL', 'GENERATED', 'APPROVED', 'PENDING_BROKER_REVIEW'].map((st) => (
              <button
                key={st}
                onClick={() => setQuoteFilterStatus(st)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                  quoteFilterStatus === st
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {combinedQuotations.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-700">No Quotations Found</h4>
                <p className="text-xs text-slate-400">Generate a quote from the Rate Calculator or create a new shipment to get commercial rates.</p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => setActiveSubTab('create')}
                  className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-blue-500 cursor-pointer"
                >
                  Create Shipment
                </button>
                <button
                  onClick={() => {
                    if (onNavigateToTab) onNavigateToTab('calculation');
                  }}
                  className="bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-slate-700 cursor-pointer"
                >
                  Open Rate Calculator
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {combinedQuotations.map((q) => {
                const isApproved = q.status.toUpperCase() === 'APPROVED';
                return (
                  <div key={q.quoteId} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs text-blue-700 bg-blue-100 px-2.5 py-1 rounded-md">
                          {q.quoteId}
                        </span>
                        {q.shipmentId && (
                          <span className="text-xs font-bold text-slate-500">Ref: {q.shipmentId}</span>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                          isApproved
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {q.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black text-slate-900">
                          {q.originPort} → {q.destinationPort}
                        </h4>
                        <span className="text-[11px] font-bold text-slate-600">{q.shipperName}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Cargo: <span className="font-bold text-slate-700">{q.cargoSummary}</span> • Carrier: <span className="font-bold text-slate-700">{q.carrierName}</span> • Transit: {q.transitDays}
                      </p>
                    </div>

                    <div className="bg-white rounded-xl p-3 border border-slate-200 space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Base Freight Cost:</span>
                        <span className="font-bold text-slate-900">${q.freightCostUsd}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Operational & Terminal Surcharges:</span>
                        <span className="font-bold text-slate-900">${q.operationalCostUsd}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Commercial Margin ({q.marginPct}%):</span>
                        <span className="font-bold text-slate-900">${q.marginAmountUsd}</span>
                      </div>
                      <div className="flex justify-between text-slate-900 font-black border-t border-slate-100 pt-1.5 text-sm">
                        <span>Grand Total:</span>
                        <div className="text-right">
                          <span className="text-blue-700">${q.finalQuoteUsd}</span>
                          {q.tariffAmountInr && (
                            <span className="block text-[10px] text-slate-400 font-medium">
                              (₹ {q.tariffAmountInr.toLocaleString('en-IN')})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-1">
                      <span className="text-[10px] text-slate-400 font-medium">Valid until: {q.validUntil}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewQuotationPDF(q.quoteId)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                          title="View PDF Document"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </button>

                        {!isApproved ? (
                          <button
                            onClick={() => handleApproveQuote(q.quoteId, q.shipmentId)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve Quote</span>
                          </button>
                        ) : (
                          <span className="text-xs font-extrabold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Booked</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 5: LIVE TRACKING ON GOOGLE MAP */}
      {activeSubTab === 'tracking' && (
        <div className="space-y-6 animate-in fade-in">
          <TrackingView
            userRole="user"
            onOpenCreateShipment={() => setActiveSubTab('create')}
            onViewQuotationPdf={onOpenQuotationPdf}
          />
        </div>
      )}

      {/* Shipment Details & Route Agent Recommendation Modal */}
      {viewingShipment && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                    {viewingShipment.id}
                  </span>
                  <h3 className="text-base font-black text-slate-900">Shipment Details & Route Options</h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Customer: <span className="font-bold text-slate-700">{viewingShipment.customerName}</span> ({viewingShipment.customerId})
                </p>
              </div>
              <button
                onClick={() => setViewingShipment(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-black cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Spec grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-black uppercase">Origin</span>
                <p className="font-bold text-slate-900">{viewingShipment.originPort}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-black uppercase">Destination</span>
                <p className="font-bold text-slate-900">{viewingShipment.destinationPort}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-black uppercase">Cargo</span>
                <p className="font-bold text-slate-900">{viewingShipment.cargoType}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-black uppercase">Container</span>
                <p className="font-bold text-slate-900">{viewingShipment.containerType}</p>
              </div>
            </div>

            {/* Recommended Route Highlights */}
            {viewingShipment.recommendedRoute && (
              <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-cyan-300 uppercase tracking-wider">
                    ★ Route Agent Recommendation
                  </span>
                  <span className="bg-cyan-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                    {viewingShipment.recommendedRoute.transitDays} Days
                  </span>
                </div>
                <h4 className="text-base font-black">{viewingShipment.recommendedRoute.name}: {viewingShipment.recommendedRoute.path}</h4>
                <p className="text-xs text-blue-200">
                  Carrier: <span className="font-bold text-white">{viewingShipment.recommendedRoute.carrierName}</span> • Mode: {viewingShipment.recommendedRoute.transshipmentType} • Reliability: {viewingShipment.recommendedRoute.reliabilityScore}%
                </p>
                {viewingShipment.recommendedRoute.recommendationReason && (
                  <p className="text-[11px] text-cyan-200 bg-blue-950/60 p-2 rounded-lg mt-1">
                    {viewingShipment.recommendedRoute.recommendationReason}
                  </p>
                )}
              </div>
            )}

            {/* All Options list */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">All Route Options</h4>
              <div className="space-y-2">
                {(viewingShipment.routeOptions || []).map((opt) => (
                  <div
                    key={opt.id}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900">{opt.name}</span>
                        <span className="text-slate-500 font-medium">({opt.carrierName})</span>
                        {opt.isRecommended && (
                          <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-slate-500 mt-0.5">{opt.path} • {opt.transshipmentType}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-900 text-sm">{opt.transitDays} Days</span>
                      <span className="block text-[10px] text-slate-400">${opt.baseFreightCostUsd}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setViewingShipment(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: COMPARE QUOTES */}
      {activeSubTab === 'compare-quotes' && (
        <M4CompareQuotesView 
          quotations={quotations} 
          onQuoteSelected={() => setActiveSubTab('selected-quotes')} 
          userEmail={currentCustomer.email} 
        />
      )}

      {/* VIEW: SELECTED QUOTES (VERIFICATIONS) */}
      {activeSubTab === 'selected-quotes' && (
        <M4SelectedQuotesView 
          userEmail={currentCustomer.email} 
        />
      )}

      {/* VIEW: BOOKINGS (PLACEHOLDER FOR NOW) */}
      {activeSubTab === 'bookings' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-black text-slate-900">My Bookings</h3>
          <p className="text-xs text-slate-500 mt-2">Bookings feature will be available soon.</p>
        </div>
      )}

    </div>
  );
};
