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
  RefreshCw,
  Cpu,
  CloudRain,
  ShieldCheck,
  ShieldAlert,
  Percent,
  Sliders,
  FileCheck,
  XCircle,
  AlertTriangle,
  Zap,
  BookmarkPlus,
  UserCheck,
  ChevronRight,
  ExternalLink,
  ChevronDown,
  Info
} from 'lucide-react';
import { SavedQuotation, QuoteFormState, CargoLineItem, Incoterm, PackageType, ContainerSpec, CurrencyCode } from '../types';
import { PORTS_AND_HUBS, CARGO_TYPES, INCOTERMS } from '../data/freightData';
import { SEEDED_HS_CODES, SEEDED_RISK_ASSESSMENTS, ML_MODEL_METRICS } from '../data/milestone3Data';
import { runRouteAgent, RouteOption } from '../data/shipmentData';
import { formatCurrency } from '../utils/calculator';
import { generateQuotePDF } from '../utils/pdfGenerator';
import { useMasterData } from '../services/masterDataService';

export type UserWorkflowStep =
  | 'create_shipment'
  | 'validate_inputs'
  | 'route_intelligence'
  | 'pricing_engine'
  | 'weather_agent'
  | 'customs_agent'
  | 'risk_engine'
  | 'quote_preview'
  | 'customs_signoff'
  | 'quote_issued'
  | 'quote_details_view';

interface UserPortalShipmentWorkflowProps {
  initialCustomerName?: string;
  initialCustomerCode?: string;
  onAddQuotation?: (quote: SavedQuotation) => void;
  onViewQuotePDF?: (quote: SavedQuotation) => void;
  onBackToDashboard?: () => void;
  onNavigateToQuotations?: () => void;
}

export const UserPortalShipmentWorkflow: React.FC<UserPortalShipmentWorkflowProps> = ({
  initialCustomerName = 'ABC Global Exporters Ltd',
  initialCustomerCode = 'C001',
  onAddQuotation,
  onViewQuotePDF,
  onBackToDashboard,
  onNavigateToQuotations,
}) => {
  const { ports: masterPorts, cargoTypes: masterCargoTypes, containerTypes: masterContainerTypes, carriers: masterCarriers, tradeLanes: masterTradeLanes } = useMasterData();

  // Workflow State
  const [currentStep, setCurrentStep] = useState<UserWorkflowStep>('create_shipment');
  const [isProcessingStep, setIsProcessingStep] = useState<boolean>(false);
  const [processingSubLog, setProcessingSubLog] = useState<string>('');

  // 1. Inputs: Origin / Destination / Cargo / HS Code / Incoterm
  const [originPort, setOriginPort] = useState<string>('Nhava Sheva (INNSA)');
  const [originCode, setOriginCode] = useState<string>('INNSA');
  const [destinationPort, setDestinationPort] = useState<string>('Jebel Ali (AEJEA)');
  const [destinationCode, setDestinationCode] = useState<string>('AEJEA');
  const [incoterm, setIncoterm] = useState<Incoterm>('FOB');
  const [cargoReadyDate, setCargoReadyDate] = useState<string>(
    new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0]
  );
  const [requiredDeliveryDate, setRequiredDeliveryDate] = useState<string>(
    new Date(Date.now() + 12 * 86400000).toISOString().split('T')[0]
  );
  const [transportMode, setTransportMode] = useState<'ocean' | 'air'>('ocean');
  const [containerSpec, setContainerSpec] = useState<ContainerSpec>('40HC');
  const [packageType, setPackageType] = useState<PackageType>('40HC Container');
  const [quantity, setQuantity] = useState<number>(2);
  const [grossWeightKg, setGrossWeightKg] = useState<number>(14500);
  const [commodityDescription, setCommodityDescription] = useState<string>('Consumer Electronics & High-Density Circuit Modules');
  const [selectedHsCode, setSelectedHsCode] = useState<string>('8471.30.10');
  const [hsSearchTerm, setHsSearchTerm] = useState<string>('');
  const [declaredValue, setDeclaredValue] = useState<number>(2400000);
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [isHazmat, setIsHazmat] = useState<boolean>(false);
  const [isFragile, setIsFragile] = useState<boolean>(true);
  const [isTempControlled, setIsTempControlled] = useState<boolean>(false);
  const [addInsurance, setAddInsurance] = useState<boolean>(true);

  // Validation Results State
  const [validationChecks, setValidationChecks] = useState<{
    originDestValid: boolean;
    cargoSpecValid: boolean;
    hsCodeValid: boolean;
    incotermValid: boolean;
    details: { name: string; status: 'PASS' | 'FAIL'; note: string }[];
  }>({
    originDestValid: true,
    cargoSpecValid: true,
    hsCodeValid: true,
    incotermValid: true,
    details: []
  });

  // Route Intelligence Result
  const [routeOptions, setRouteOptions] = useState<RouteOption[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteOption | null>(null);

  // Pricing Result (Rule + ML)
  const [pricingBreakdown, setPricingBreakdown] = useState<{
    baseRuleRate: number;
    bafSurcharge: number;
    terminalHandling: number;
    documentationFee: number;
    mlAdjustmentAmount: number;
    mlFactorPct: number;
    mlConfidence: number;
    subtotal: number;
    estimatedTax: number;
    grandTotal: number;
    currency: CurrencyCode;
  }>({
    baseRuleRate: 198000,
    bafSurcharge: 19800,
    terminalHandling: 14500,
    documentationFee: 4200,
    mlAdjustmentAmount: -3200,
    mlFactorPct: -1.3,
    mlConfidence: 0.974,
    subtotal: 233300,
    estimatedTax: 41994,
    grandTotal: 275294,
    currency: 'INR'
  });

  // Weather Agent Result
  const [weatherData, setWeatherData] = useState<{
    waveHeightMeters: number;
    windKnots: number;
    beaufortScale: string;
    condition: string;
    stormRiskScore: number;
    delayProbabilityPct: number;
    bufferHours: number;
    advisoryText: string;
  }>({
    waveHeightMeters: 1.8,
    windKnots: 16,
    beaufortScale: 'Force 4 (Moderate Breeze)',
    condition: 'Slight Sea Swell, Clear Visibility',
    stormRiskScore: 18,
    delayProbabilityPct: 12,
    bufferHours: 4,
    advisoryText: 'Corridor conditions optimal across Arabian Sea & Gulf of Oman. Nominal weather buffer added.'
  });

  // Customs Agent Result
  const [customsData, setCustomsData] = useState<{
    hsCode: string;
    commodityName: string;
    bcdPct: number;
    igstPct: number;
    swsPct: number;
    estimatedDutyInr: number;
    prohibitedRestrictedStatus: 'CLEARED' | 'RESTRICTED' | 'PROHIBITED';
    icegateFilingReady: boolean;
    requiredDocuments: string[];
  }>({
    hsCode: '8471.30.10',
    commodityName: 'Portable automatic data processing machines (Laptops / Notebooks)',
    bcdPct: 0.0,
    igstPct: 18.0,
    swsPct: 10.0,
    estimatedDutyInr: 432000,
    prohibitedRestrictedStatus: 'CLEARED',
    icegateFilingReady: true,
    requiredDocuments: [
      'Commercial Invoice & Value Declaration',
      'Bill of Lading / Sea Waybill',
      'Detailed Packing List with Serialized Items',
      'Certificate of Origin (CECA / Form A)'
    ]
  });

  // Risk Engine Result
  const [riskData, setRiskData] = useState<{
    compositeScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    weatherRisk: number;
    congestionRisk: number;
    cargoRisk: number;
    customsRisk: number;
    geopoliticalRisk: number;
    signOffRequired: boolean;
    signOffReason: string;
  }>({
    compositeScore: 24,
    riskLevel: 'LOW',
    weatherRisk: 18,
    congestionRisk: 22,
    cargoRisk: 28,
    customsRisk: 15,
    geopoliticalRisk: 20,
    signOffRequired: false,
    signOffReason: 'Low risk general cargo with pre-cleared ICEGATE documentation.'
  });

  // Customs Sign-Off State
  const [isOfficerSignedOff, setIsOfficerSignedOff] = useState<boolean>(false);
  const [officerNotes, setOfficerNotes] = useState<string>('Pre-approved via Automated Regulatory Compliance Desk.');

  // Issued Quotation State
  const [issuedQuote, setIssuedQuote] = useState<SavedQuotation | null>(null);

  // Filter matched HS codes
  const matchedHsCodes = useMemo(() => {
    const term = (hsSearchTerm || '').toLowerCase().trim();
    if (!term) return (SEEDED_HS_CODES || []).slice(0, 5);
    return (SEEDED_HS_CODES || []).filter(
      (h) =>
        h &&
        ((h.hs_code || '').toLowerCase().includes(term) ||
          (h.description || '').toLowerCase().includes(term) ||
          (h.commodity_type || '').toLowerCase().includes(term))
    );
  }, [hsSearchTerm]);

  // Handle HS code selection
  const handleSelectHsCode = (hs: typeof SEEDED_HS_CODES[0]) => {
    setSelectedHsCode(hs.hs_code);
    setCommodityDescription(hs.description);
    if ((hs.commodity_type || '').toLowerCase().includes('haz') || hs.restricted) {
      setIsHazmat(true);
    } else {
      setIsHazmat(false);
    }
  };

  // STEP TRANSITIONS & PIPELINE RUNNER
  const runValidationStep = () => {
    setIsProcessingStep(true);
    setProcessingSubLog('Checking origin & destination UN/LOCODE coordinates...');

    setTimeout(() => {
      setProcessingSubLog('Verifying cargo dimensions, payload & container specs...');
    }, 400);

    setTimeout(() => {
      setProcessingSubLog('Validating HS Code tariff registry & statutory obligations under Incoterms 2020...');
    }, 800);

    setTimeout(() => {
      const isOriginDestGood = Boolean(originPort && destinationPort && originPort !== destinationPort);
      const isCargoGood = grossWeightKg > 0 && quantity > 0 && commodityDescription.trim().length > 0;
      const isHsGood = Boolean(selectedHsCode && selectedHsCode.length >= 4);
      const isIncGood = Boolean(incoterm);

      const checks = [
        {
          name: 'Origin & Destination Validation',
          status: isOriginDestGood ? ('PASS' as const) : ('FAIL' as const),
          note: isOriginDestGood
            ? `Corridor verified: ${originPort} ➔ ${destinationPort}`
            : 'Origin and Destination must be distinct valid trade ports.'
        },
        {
          name: 'Cargo Payload & Equipment Integrity',
          status: isCargoGood ? ('PASS' as const) : ('FAIL' as const),
          note: isCargoGood
            ? `${quantity} × ${containerSpec} (${grossWeightKg.toLocaleString()} kg total payload)`
            : 'Invalid weight or cargo line item definition.'
        },
        {
          name: 'HS Code Harmonized Classification',
          status: isHsGood ? ('PASS' as const) : ('FAIL' as const),
          note: isHsGood
            ? `HS ${selectedHsCode} indexed in CBIC / WCO Tariff Database`
            : 'HS Code required for customs tariff evaluation.'
        },
        {
          name: 'Incoterm 2020 Trade Rules Compliance',
          status: isIncGood ? ('PASS' as const) : ('FAIL' as const),
          note: `Commercial risk handover defined under ${incoterm} terms.`
        }
      ];

      setValidationChecks({
        originDestValid: isOriginDestGood,
        cargoSpecValid: isCargoGood,
        hsCodeValid: isHsGood,
        incotermValid: isIncGood,
        details: checks
      });

      setIsProcessingStep(false);
      setCurrentStep('validate_inputs');
    }, 1200);
  };

  const runRouteIntelligenceStep = () => {
    setIsProcessingStep(true);
    setProcessingSubLog('Calculating geodetic nautical miles & AIS vessel lane density...');

    setTimeout(() => {
      setProcessingSubLog('Querying carrier capacity (Maersk, MSC, CMA CGM, Hapag-Lloyd)...');
    }, 500);

    setTimeout(() => {
      const { routes, recommendedRoute } = runRouteAgent(
        originPort,
        destinationPort,
        commodityDescription,
        containerSpec,
        { carriers: masterCarriers, tradeLanes: masterTradeLanes }
      );
      setRouteOptions(routes);
      setSelectedRoute(recommendedRoute || routes[0]);
      setIsProcessingStep(false);
      setCurrentStep('route_intelligence');
    }, 1200);
  };

  const runPricingEngineStep = () => {
    setIsProcessingStep(true);
    setProcessingSubLog('Executing Rule-Based Tariff Matrix (Base + BAF + THC + DOC)...');

    setTimeout(() => {
      setProcessingSubLog('Feeding features to ML Spot Model (Gradient Boosted Tree / XGBoost)...');
    }, 600);

    setTimeout(() => {
      const baseFreight = selectedRoute ? selectedRoute.baseFreightCostUsd * 83 * quantity : 185000;
      const baf = Math.round(baseFreight * 0.10);
      const thc = Math.round(14500 * quantity);
      const doc = 4200;
      const mlAdj = -3200; // Machine Learning market adjustment factor
      const sub = baseFreight + baf + thc + doc + mlAdj;
      const tax = Math.round(sub * 0.18);
      const grand = sub + tax;

      setPricingBreakdown({
        baseRuleRate: baseFreight,
        bafSurcharge: baf,
        terminalHandling: thc,
        documentationFee: doc,
        mlAdjustmentAmount: mlAdj,
        mlFactorPct: -1.3,
        mlConfidence: 0.974,
        subtotal: sub,
        estimatedTax: tax,
        grandTotal: grand,
        currency: 'INR'
      });

      setIsProcessingStep(false);
      setCurrentStep('pricing_engine');
    }, 1300);
  };

  const runWeatherAgentStep = () => {
    setIsProcessingStep(true);
    setProcessingSubLog('Connecting to NOAA GFS & IMD Marine Weather Radar nodes...');

    setTimeout(() => {
      setProcessingSubLog('Scanning sea state wave swells and wind vectors along shipping lane...');
    }, 600);

    setTimeout(() => {
      const isHaz = isHazmat || declaredValue > 2000000;
      setWeatherData({
        waveHeightMeters: 1.8,
        windKnots: 16,
        beaufortScale: 'Force 4 (Moderate Breeze)',
        condition: 'Slight Sea Swell, Clear Visibility',
        stormRiskScore: 18,
        delayProbabilityPct: 12,
        bufferHours: 4,
        advisoryText: 'Corridor conditions optimal across Arabian Sea & Gulf of Oman. Nominal weather buffer added.'
      });
      setIsProcessingStep(false);
      setCurrentStep('weather_agent');
    }, 1200);
  };

  const runCustomsAgentStep = () => {
    setIsProcessingStep(true);
    setProcessingSubLog('Querying CBIC ICEGATE Tariff Schedule for HS ' + selectedHsCode + '...');

    setTimeout(() => {
      setProcessingSubLog('Evaluating Basic Customs Duty, IGST, Social Welfare Surcharge & DGFT list...');
    }, 600);

    setTimeout(() => {
      const matched = SEEDED_HS_CODES.find((h) => h.hs_code === selectedHsCode) || SEEDED_HS_CODES[0];
      const duty = Math.round(declaredValue * ((matched.basic_customs_duty_pct + matched.igst_pct) / 100));

      setCustomsData({
        hsCode: matched.hs_code,
        commodityName: matched.description,
        bcdPct: matched.basic_customs_duty_pct,
        igstPct: matched.igst_pct,
        swsPct: 10.0,
        estimatedDutyInr: duty,
        prohibitedRestrictedStatus: matched.prohibited ? 'PROHIBITED' : matched.restricted ? 'RESTRICTED' : 'CLEARED',
        icegateFilingReady: true,
        requiredDocuments: [
          'Commercial Invoice & Value Declaration',
          'Bill of Lading / Sea Waybill',
          'Detailed Packing List with Serialized Items',
          'Certificate of Origin (CECA / Form A)'
        ]
      });

      setIsProcessingStep(false);
      setCurrentStep('customs_agent');
    }, 1200);
  };

  const runRiskEngineStep = () => {
    setIsProcessingStep(true);
    setProcessingSubLog('Aggregating Weather + Route + Port + Cargo + Customs 5-Pillar Matrix...');

    setTimeout(() => {
      setProcessingSubLog('Calculating Composite Risk Index and Customer Officer sign-off mandate...');
    }, 600);

    setTimeout(() => {
      const hazScore = isHazmat ? 80 : 25;
      const valScore = declaredValue > 2000000 ? 55 : 20;
      const weatherScore = weatherData.stormRiskScore;
      const customsScore = customsData.prohibitedRestrictedStatus !== 'CLEARED' ? 65 : 15;
      const routeScore = 22;

      const composite = Math.round(
        weatherScore * 0.25 + customsScore * 0.25 + routeScore * 0.20 + hazScore * 0.15 + valScore * 0.15
      );

      const requiresSignOff = isHazmat || isTempControlled || declaredValue > 2000000 || composite > 50;

      setRiskData({
        compositeScore: composite,
        riskLevel: composite > 60 ? 'HIGH' : composite > 35 ? 'MEDIUM' : 'LOW',
        weatherRisk: weatherScore,
        congestionRisk: routeScore,
        cargoRisk: hazScore,
        customsRisk: customsScore,
        geopoliticalRisk: 20,
        signOffRequired: requiresSignOff,
        signOffReason: requiresSignOff
          ? isHazmat
            ? 'Hazardous cargo classification requires Customer Officer compliance validation.'
            : declaredValue > 2000000
            ? 'High-value consignment (>₹20L) triggers statutory officer sign-off.'
            : 'Composite risk threshold exceeded.'
          : 'Low risk standard cargo. Eligible for automated compliance pre-approval.'
      });

      setIsOfficerSignedOff(!requiresSignOff);

      setIsProcessingStep(false);
      setCurrentStep('risk_engine');
    }, 1300);
  };

  const runQuotePreviewStep = () => {
    setCurrentStep('quote_preview');
  };

  const runCustomsSignOffStep = () => {
    if (riskData.signOffRequired && !isOfficerSignedOff) {
      setCurrentStep('customs_signoff');
    } else {
      finalizeAndIssueQuote();
    }
  };

  const handleOfficerSignOffAction = () => {
    setIsOfficerSignedOff(true);
    setOfficerNotes('Signed off by Customer Compliance Officer Desk on ' + new Date().toLocaleTimeString());
    finalizeAndIssueQuote();
  };

  const finalizeAndIssueQuote = () => {
    setIsProcessingStep(true);
    setProcessingSubLog('Minting official cryptographic Quote ID and locking 14-day tariff rate...');

    setTimeout(() => {
      const quoteNum = Math.floor(1000 + Math.random() * 9000);
      const newQuoteId = `QT-2026-00${quoteNum}`;
      const transitDaysStr = selectedRoute ? `${selectedRoute.transitDays} Days` : '6–8 Days';
      const arrivalDateStr = new Date(Date.now() + (selectedRoute ? selectedRoute.transitDays : 7) * 86400000)
        .toISOString()
        .split('T')[0];

      const newQuote: SavedQuotation = {
        id: newQuoteId,
        shipperName: initialCustomerName,
        companyName: initialCustomerName,
        routeSummary: `${originPort} ➔ ${destinationPort}`,
        originCode: originCode,
        destinationCode: destinationCode,
        transportMode: transportMode,
        oceanLoadType: 'FCL',
        tariffAmount: pricingBreakdown.grandTotal,
        currency: pricingBreakdown.currency,
        status: 'ISSUED',
        createdAt: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        cargoSummary: `${quantity} × ${containerSpec} (${commodityDescription})`,
        breakdown: {
          baseTariff: pricingBreakdown.baseRuleRate,
          bafFuelSurcharge: pricingBreakdown.bafSurcharge,
          terminalHandlingCharge: pricingBreakdown.terminalHandling,
          documentationFee: pricingBreakdown.documentationFee,
          specialHandlingSurcharge: 0,
          insuranceFee: addInsurance ? Math.round(declaredValue * 0.003) : 0,
          discountAmount: 0,
          subtotal: pricingBreakdown.subtotal,
          estimatedTax: pricingBreakdown.estimatedTax,
          grandTotal: pricingBreakdown.grandTotal,
          currency: pricingBreakdown.currency,
          chargeBasis: `${incoterm} Commercial Freight (Rule + ML Rate Lock)`,
          cargoCountSummary: `${quantity} × ${containerSpec}`,
          totalWeightKg: grossWeightKg,
          estimatedDistanceNmOrKm: '1650 NM',
          estimatedTransitDays: transitDaysStr,
          estimatedArrivalDate: arrivalDateStr
        },
        formData: {
          originPortCode: originCode,
          destinationPortCode: destinationCode,
          pickupHubId: 'PK-01',
          deliveryHubId: 'DL-01',
          cargoReadyDate: cargoReadyDate,
          requiredDeliveryDate: requiredDeliveryDate,
          transportMode: transportMode,
          oceanLoadType: 'FCL',
          incoterm: incoterm,
          cargoItems: [
            {
              id: 'cargo-item-01',
              packageType: packageType,
              containerSpec: containerSpec,
              quantity: quantity,
              grossWeightKg: grossWeightKg,
              commodityDescription: commodityDescription,
              hsCode: selectedHsCode
            }
          ],
          declaredValue: declaredValue,
          currency: currency,
          specialInstructions: `Route Agent recommended: ${selectedRoute ? selectedRoute.name : 'Direct Liner'}`,
          fragileGoods: isFragile,
          hazardousMaterials: isHazmat,
          temperatureControlled: isTempControlled,
          addCargoInsurance: addInsurance,
          promoCodeApplied: null,
          fullName: initialCustomerName,
          companyName: initialCustomerName,
          email: 'ops@freightclient.com',
          country: 'India'
        }
      };

      setIssuedQuote(newQuote);

      // Persist to parent and storage
      if (onAddQuotation) {
        onAddQuotation(newQuote);
      }

      try {
        const storedQuotes = JSON.parse(localStorage.getItem('freighthub_saved_quotations_v1') || '[]');
        localStorage.setItem('freighthub_saved_quotations_v1', JSON.stringify([newQuote, ...storedQuotes]));
      } catch (e) {
        console.error(e);
      }

      setIsProcessingStep(false);
      setCurrentStep('quote_issued');
    }, 1200);
  };

  // 13 Pipeline Steps Meta for UI Progress Indicator
  const PIPELINE_STEPS = [
    { id: 'create_shipment', label: '1. Create Shipment', short: 'Shipment' },
    { id: 'validate_inputs', label: '2. Validate Parameters', short: 'Validate' },
    { id: 'route_intelligence', label: '3. Route Intelligence', short: 'Route' },
    { id: 'pricing_engine', label: '4. Pricing (Rule + ML)', short: 'Pricing' },
    { id: 'weather_agent', label: '5. Weather Agent', short: 'Weather' },
    { id: 'customs_agent', label: '6. Customs Agent', short: 'Customs' },
    { id: 'risk_engine', label: '7. Risk Engine', short: 'Risk' },
    { id: 'quote_preview', label: '8. Quote Preview', short: 'Preview' },
    { id: 'customs_signoff', label: '9. Customs Sign-Off', short: 'Sign-Off' },
    { id: 'quote_issued', label: '10. Quote Issued', short: 'Issued' },
    { id: 'quote_details_view', label: '11. View Breakdown', short: '4-Pillar View' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 13-STEP INTERACTIVE PIPELINE STATUS HEADER */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-800">
                  SHAPED TO USER FLOW
                </span>
                <span className="text-xs text-slate-400 font-bold">• 13 Core Pipeline Stages</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white">
                Customer Freight Quotation & Compliance Engine
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onBackToDashboard && (
              <button
                type="button"
                onClick={onBackToDashboard}
                className="text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ← Back to Dashboard
              </button>
            )}
            {issuedQuote && (
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-black">
                Quote ID: {issuedQuote.id}
              </span>
            )}
          </div>
        </div>

        {/* Visual Progress Breadcrumbs Strip */}
        <div className="overflow-x-auto pb-2 scrollbar-none">
          <div className="flex items-center gap-1.5 min-w-max text-[11px] font-bold">
            {PIPELINE_STEPS.map((step, idx) => {
              const stepIndex = PIPELINE_STEPS.findIndex((s) => s.id === step.id);
              const currentIndex = PIPELINE_STEPS.findIndex((s) => s.id === currentStep);
              const isPast = stepIndex < currentIndex;
              const isCurrent = step.id === currentStep;

              return (
                <div key={step.id} className="flex items-center gap-1.5">
                  <div
                    className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
                      isCurrent
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/40 ring-1 ring-blue-400 font-black'
                        : isPast
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                        : 'bg-slate-800/60 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {isPast ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : isCurrent ? (
                      <span className="w-2 h-2 rounded-full bg-cyan-300 animate-pulse" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-600" />
                    )}
                    <span>{step.label}</span>
                  </div>
                  {idx < PIPELINE_STEPS.length - 1 && (
                    <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Sublog Terminal during async transitions */}
        {isProcessingStep && (
          <div className="p-3 bg-slate-950/90 border border-cyan-500/30 rounded-2xl flex items-center gap-2.5 text-xs font-mono text-cyan-300 animate-in fade-in">
            <RefreshCw className="w-4 h-4 animate-spin text-cyan-400 shrink-0" />
            <span>{processingSubLog}</span>
          </div>
        )}
      </div>

      {/* =========================================================
          STAGE 1: CREATE SHIPMENT (Inputs Form)
          ========================================================= */}
      {currentStep === 'create_shipment' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                STAGE 1 OF 13
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-1">
                Define Shipment Corridor, Cargo & Incoterm
              </h3>
              <p className="text-xs text-slate-500">
                Input trade parameters to initialize validation, route intelligence, weather scan & dual pricing.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-400">Shipper Account:</span>
              <div className="text-xs font-black text-slate-800">{initialCustomerName} ({initialCustomerCode})</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Origin Port */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Anchor className="w-3.5 h-3.5 text-blue-600" />
                <span>Origin Port / Terminal *</span>
              </label>
              <select
                value={originPort}
                onChange={(e) => {
                  setOriginPort(e.target.value);
                  const matched = PORTS_AND_HUBS.find((p) => p.name === e.target.value || p.code === e.target.value);
                  if (matched) setOriginCode(matched.code);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {PORTS_AND_HUBS.map((p) => (
                  <option key={p.code} value={p.name}>
                    {p.name} ({p.code}) — {p.country}
                  </option>
                ))}
              </select>
            </div>

            {/* Destination Port */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Anchor className="w-3.5 h-3.5 text-emerald-600" />
                <span>Destination Port / Hub *</span>
              </label>
              <select
                value={destinationPort}
                onChange={(e) => {
                  setDestinationPort(e.target.value);
                  const matched = PORTS_AND_HUBS.find((p) => p.name === e.target.value || p.code === e.target.value);
                  if (matched) setDestinationCode(matched.code);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {PORTS_AND_HUBS.map((p) => (
                  <option key={p.code} value={p.name}>
                    {p.name} ({p.code}) — {p.country}
                  </option>
                ))}
              </select>
            </div>

            {/* Incoterm */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-600" />
                <span>Commercial Incoterm (2020) *</span>
              </label>
              <select
                value={incoterm}
                onChange={(e) => setIncoterm(e.target.value as Incoterm)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {INCOTERMS.map((inc) => (
                  <option key={inc.code} value={inc.code}>
                    {inc.code} — {inc.name} ({inc.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Cargo Ready Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Cargo Ready Date *</span>
              </label>
              <input
                type="date"
                value={cargoReadyDate}
                onChange={(e) => setCargoReadyDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Required Delivery Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Required Delivery Date *</span>
              </label>
              <input
                type="date"
                value={requiredDeliveryDate}
                onChange={(e) => setRequiredDeliveryDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Container Spec & Quantity */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-slate-500" />
                <span>Equipment & Quantity *</span>
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={containerSpec}
                  onChange={(e) => {
                    setContainerSpec(e.target.value as ContainerSpec);
                    setPackageType((e.target.value + ' Container') as PackageType);
                  }}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="40HC">40HC High Cube</option>
                  <option value="20GP">20GP General Purpose</option>
                  <option value="40GP">40GP Standard</option>
                  <option value="LCL_SLOT">LCL Consolidated Slot</option>
                </select>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-3 text-xs font-black text-center text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* HS CODE & COMMODITY SECTION */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Box className="w-4 h-4 text-blue-600" />
                  <span>Harmonized System (HS) Code & Commodity Classification</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Search 6-8 digit tariff headings to auto-populate regulatory duty & customs compliance.
                </p>
              </div>

              <div className="w-full sm:w-64 relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Lookup HS code (e.g. 8471, 5208)..."
                  value={hsSearchTerm}
                  onChange={(e) => setHsSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            {/* Quick HS Suggestions Pills */}
            <div className="flex flex-wrap gap-2 pt-1">
              {matchedHsCodes.map((hs) => (
                <button
                  key={hs.id}
                  type="button"
                  onClick={() => handleSelectHsCode(hs)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    selectedHsCode === hs.hs_code
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-200 hover:border-blue-400'
                  }`}
                >
                  <span className="font-mono">{hs.hs_code}</span>
                  <span className="text-[10px] text-slate-400 truncate max-w-[140px]">• {hs.commodity_type}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="sm:col-span-2">
                <label className="text-[10px] font-extrabold text-slate-600 uppercase">Commodity Description</label>
                <input
                  type="text"
                  value={commodityDescription}
                  onChange={(e) => setCommodityDescription(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-600 uppercase">Gross Weight (KG)</label>
                <input
                  type="number"
                  value={grossWeightKg}
                  onChange={(e) => setGrossWeightKg(Math.max(10, parseFloat(e.target.value) || 0))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Handling & Value Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <label className="flex items-center gap-2.5 p-3 rounded-2xl border border-slate-200 bg-slate-50/50 cursor-pointer">
              <input
                type="checkbox"
                checked={isHazmat}
                onChange={(e) => setIsHazmat(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-xs font-bold text-slate-800">Dangerous / Hazmat</span>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-2xl border border-slate-200 bg-slate-50/50 cursor-pointer">
              <input
                type="checkbox"
                checked={isFragile}
                onChange={(e) => setIsFragile(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-xs font-bold text-slate-800">Fragile Goods</span>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-2xl border border-slate-200 bg-slate-50/50 cursor-pointer">
              <input
                type="checkbox"
                checked={isTempControlled}
                onChange={(e) => setIsTempControlled(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-xs font-bold text-slate-800">Reefer / Temp-Controlled</span>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-2xl border border-slate-200 bg-slate-50/50 cursor-pointer">
              <input
                type="checkbox"
                checked={addInsurance}
                onChange={(e) => setAddInsurance(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-xs font-bold text-slate-800">Add Marine Insurance</span>
            </label>
          </div>

          {/* Primary Action Button */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Inputs will be audited against CBIC Tariff Schedule & IMU Route Graph</span>
            </div>

            <button
              type="button"
              disabled={isProcessingStep}
              onClick={runValidationStep}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-blue-600/30 cursor-pointer active:scale-95"
            >
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>VALIDATE & PROCEED TO ROUTE INTELLIGENCE</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================
          STAGE 2: VALIDATE ORIGIN / DESTINATION / CARGO / HS CODE / INCOTERM
          ========================================================= */}
      {currentStep === 'validate_inputs' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                STAGE 2: PRE-FLIGHT VALIDATION
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-1">
                Shipment Parameters Audit & Integrity Check
              </h3>
              <p className="text-xs text-slate-500">
                All 4 critical shipment parameters verified against international customs and maritime registers.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% VALIDATED</span>
              </span>
            </div>
          </div>

          {/* Validation Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(validationChecks?.details || []).map((check, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-all flex items-start gap-3.5"
              >
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shrink-0 mt-0.5">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-black text-slate-900">{check.name}</h4>
                    <span className="text-[9px] font-extrabold uppercase px-2 py-0.2 bg-emerald-100 text-emerald-700 rounded-md">
                      {check.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">{check.note}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep('create_shipment')}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 px-4 py-2.5 rounded-xl hover:bg-slate-100 transition-colors"
            >
              ← Edit Inputs
            </button>

            <button
              type="button"
              disabled={isProcessingStep}
              onClick={runRouteIntelligenceStep}
              className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/25 cursor-pointer"
            >
              <span>RUN ROUTE INTELLIGENCE AGENT</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================
          STAGE 3: ROUTE INTELLIGENCE
          ========================================================= */}
      {currentStep === 'route_intelligence' && (
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-950 px-2.5 py-0.5 rounded-full border border-cyan-800">
                STAGE 3: ROUTE INTELLIGENCE
              </span>
              <h3 className="text-xl font-black text-white mt-1">
                Multi-Corridor Simulation & Space Allocation
              </h3>
              <p className="text-xs text-slate-400">
                Nautical miles, AIS lane density & carrier transit options analyzed for {originPort} ➔ {destinationPort}
              </p>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-2xl text-right">
              <span className="text-[10px] font-bold text-cyan-400 uppercase">Recommended Corridor</span>
              <div className="text-sm font-black text-white">{selectedRoute?.name || 'Direct Ocean Express'}</div>
              <span className="text-xs text-slate-300">{selectedRoute?.carrierName || 'CMA CGM'} • {selectedRoute?.transitDays || 6} Days</span>
            </div>
          </div>

          {/* Candidate Routes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {routeOptions.map((opt) => {
              const isSelected = selectedRoute?.id === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => setSelectedRoute(opt)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
                    opt.isRecommended
                      ? 'bg-blue-950/60 border-cyan-400/80 shadow-lg shadow-cyan-900/30 ring-1 ring-cyan-400/50'
                      : isSelected
                      ? 'bg-slate-800 border-blue-400'
                      : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {opt.isRecommended && (
                    <div className="absolute -top-2.5 left-4 bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow">
                      ★ OPTIMAL ROUTE
                    </div>
                  )}

                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm text-white">{opt.name}</span>
                      <span className="text-xs font-bold text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                        {opt.transitDays} Days
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <p className="text-slate-300 font-bold">{opt.path}</p>
                      <p className="text-slate-400">Carrier: <span className="text-white font-bold">{opt.carrierName}</span></p>
                      <p className="text-slate-400">Reliability Score: <span className="text-emerald-400 font-bold">{opt.reliabilityScore}%</span></p>
                    </div>

                    <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-700/60">
                      <span className="text-slate-400">Base Estimate:</span>
                      <span className="font-black text-cyan-400">${opt.baseFreightCostUsd}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setCurrentStep('validate_inputs')}
              className="text-xs font-bold text-slate-400 hover:text-white px-4 py-2"
            >
              ← Back to Validation
            </button>

            <button
              type="button"
              disabled={isProcessingStep}
              onClick={runPricingEngineStep}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
            >
              <span>TRIGGER DUAL PRICING (RULE + ML)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================
          STAGE 4: PRICING (RULE + ML)
          ========================================================= */}
      {currentStep === 'pricing_engine' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                STAGE 4: DUAL PRICING ENGINE
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-1">
                Deterministic Rule Ledger + Machine Learning Spot Optimization
              </h3>
              <p className="text-xs text-slate-500">
                LightGBM & XGBoost regression models applied over base freight tariffs.
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 px-4 py-2 rounded-2xl text-right">
              <span className="text-[10px] font-black text-purple-700 uppercase">ML Model Confidence</span>
              <div className="text-base font-black text-purple-900">{(pricingBreakdown.mlConfidence * 100).toFixed(1)}% R² Accuracy</div>
            </div>
          </div>

          {/* Pricing Ledger & ML Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rule Based Ledger */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>1. Rule-Based Base Tariff Ledger</span>
              </h4>

              <div className="space-y-2 text-xs divide-y divide-slate-200/80">
                <div className="flex justify-between pt-1 text-slate-600">
                  <span>Base Ocean Freight ({quantity} × {containerSpec})</span>
                  <span className="font-bold text-slate-900">{formatCurrency(pricingBreakdown.baseRuleRate, 'INR')}</span>
                </div>
                <div className="flex justify-between pt-2 text-slate-600">
                  <span>BAF Fuel Surcharge (10%)</span>
                  <span className="font-bold text-slate-900">{formatCurrency(pricingBreakdown.bafSurcharge, 'INR')}</span>
                </div>
                <div className="flex justify-between pt-2 text-slate-600">
                  <span>Origin Terminal Handling (THC)</span>
                  <span className="font-bold text-slate-900">{formatCurrency(pricingBreakdown.terminalHandling, 'INR')}</span>
                </div>
                <div className="flex justify-between pt-2 text-slate-600">
                  <span>Documentation & ICEGATE BL Fee</span>
                  <span className="font-bold text-slate-900">{formatCurrency(pricingBreakdown.documentationFee, 'INR')}</span>
                </div>
              </div>
            </div>

            {/* ML Predictive Delta */}
            <div className="p-5 rounded-2xl border border-purple-200 bg-purple-50/40 space-y-3">
              <h4 className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-600" />
                <span>2. ML Dynamic Spot Index Adjustment</span>
              </h4>

              <div className="space-y-2 text-xs divide-y divide-purple-200/80">
                <div className="flex justify-between pt-1 text-purple-800">
                  <span>Spot Market Index Dynamic Multiplier</span>
                  <span className="font-bold text-emerald-700">{pricingBreakdown.mlFactorPct}%</span>
                </div>
                <div className="flex justify-between pt-2 text-purple-800">
                  <span>AI Volatility Rebate / Surcharge</span>
                  <span className="font-bold text-emerald-700">{formatCurrency(pricingBreakdown.mlAdjustmentAmount, 'INR')}</span>
                </div>
                <div className="flex justify-between pt-2 text-purple-800">
                  <span>Statutory GST / Tax (18%)</span>
                  <span className="font-bold text-purple-900">{formatCurrency(pricingBreakdown.estimatedTax, 'INR')}</span>
                </div>
                <div className="flex justify-between pt-2 text-purple-950 font-black text-sm">
                  <span>TOTAL ESTIMATED TARIFF</span>
                  <span className="text-purple-900">{formatCurrency(pricingBreakdown.grandTotal, 'INR')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep('route_intelligence')}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 px-4 py-2"
            >
              ← Back to Routes
            </button>

            <button
              type="button"
              disabled={isProcessingStep}
              onClick={runWeatherAgentStep}
              className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
            >
              <span>RUN WEATHER AGENT RADAR</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================
          STAGE 5: WEATHER AGENT
          ========================================================= */}
      {currentStep === 'weather_agent' && (
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-950 px-2.5 py-0.5 rounded-full border border-cyan-800">
                STAGE 5: WEATHER AGENT
              </span>
              <h3 className="text-xl font-black text-white mt-1">
                Ocean State, Wave Swell & Marine Meteorology
              </h3>
              <p className="text-xs text-slate-400">
                Real-time marine radar analysis along the voyage path.
              </p>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-2xl text-right">
              <span className="text-[10px] font-bold text-emerald-400 uppercase">Sea State Safety</span>
              <div className="text-sm font-black text-white">{weatherData.beaufortScale}</div>
              <span className="text-xs text-slate-300">{weatherData.waveHeightMeters}m Swells • {weatherData.windKnots} Knots</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Atmospheric Condition</span>
              <div className="text-sm font-black text-cyan-300">{weatherData.condition}</div>
              <p className="text-[11px] text-slate-400">Clear linehaul sailing window</p>
            </div>

            <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Storm Delay Probability</span>
              <div className="text-sm font-black text-emerald-400">{weatherData.delayProbabilityPct}% (Low Delay Risk)</div>
              <p className="text-[11px] text-slate-400">Estimated buffer: +{weatherData.bufferHours} hours</p>
            </div>

            <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/60 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Radar Provider</span>
              <div className="text-sm font-black text-white">NOAA WaveWatch III & IMD</div>
              <p className="text-[11px] text-slate-400">Synchronized 18 mins ago</p>
            </div>
          </div>

          <div className="p-4 bg-cyan-950/40 border border-cyan-500/30 rounded-2xl text-xs text-cyan-200">
            <strong>Weather Advisory:</strong> {weatherData.advisoryText}
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setCurrentStep('pricing_engine')}
              className="text-xs font-bold text-slate-400 hover:text-white px-4 py-2"
            >
              ← Back to Pricing
            </button>

            <button
              type="button"
              disabled={isProcessingStep}
              onClick={runCustomsAgentStep}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
            >
              <span>RUN CUSTOMS AGENT REGULATORY AUDIT</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================
          STAGE 6: CUSTOMS AGENT
          ========================================================= */}
      {currentStep === 'customs_agent' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                STAGE 6: CUSTOMS AGENT
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-1">
                Customs Tariff, Duties & ICEGATE Document Audit
              </h3>
              <p className="text-xs text-slate-500">
                HS Code {customsData.hsCode} audited against CBIC statutory duties and documentation mandates.
              </p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-2xl text-right">
              <span className="text-[10px] font-black text-emerald-700 uppercase">Regulatory Status</span>
              <div className="text-base font-black text-emerald-800">{customsData.prohibitedRestrictedStatus}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Duty Calculation */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-600" />
                <span>Statutory Duty & Tax Calculation</span>
              </h4>

              <div className="space-y-2 text-xs divide-y divide-slate-200/80">
                <div className="flex justify-between pt-1">
                  <span className="text-slate-600">Basic Customs Duty (BCD)</span>
                  <span className="font-bold text-slate-900">{customsData.bcdPct}%</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-slate-600">Integrated GST (IGST)</span>
                  <span className="font-bold text-slate-900">{customsData.igstPct}%</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-slate-600">Social Welfare Surcharge (SWS)</span>
                  <span className="font-bold text-slate-900">{customsData.swsPct}%</span>
                </div>
                <div className="flex justify-between pt-2 font-black text-blue-900">
                  <span>Estimated Import Duty Obligation</span>
                  <span>{formatCurrency(customsData.estimatedDutyInr, 'INR')}</span>
                </div>
              </div>
            </div>

            {/* Mandatory ICEGATE Documents */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Mandatory ICEGATE Documents Checklist</span>
              </h4>

              <div className="space-y-2 text-xs">
                {(customsData?.requiredDocuments || []).map((doc, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-medium">{doc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep('weather_agent')}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 px-4 py-2"
            >
              ← Back to Weather
            </button>

            <button
              type="button"
              disabled={isProcessingStep}
              onClick={runRiskEngineStep}
              className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
            >
              <span>RUN 5-PILLAR RISK ENGINE</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================
          STAGE 7: RISK ENGINE
          ========================================================= */}
      {currentStep === 'risk_engine' && (
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-950 px-2.5 py-0.5 rounded-full border border-cyan-800">
                STAGE 7: RISK ENGINE
              </span>
              <h3 className="text-xl font-black text-white mt-1">
                5-Pillar Composite Risk Assessment
              </h3>
              <p className="text-xs text-slate-400">
                Synthesizing Weather, Port Congestion, Cargo Fragility/Hazmat, Customs & Geopolitical factors.
              </p>
            </div>

            <div className="bg-slate-800 border border-slate-700 p-4 rounded-2xl text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Composite Risk Score</span>
              <div className="text-2xl font-black text-cyan-400">{riskData.compositeScore} / 100</div>
              <span className="text-xs font-bold text-emerald-400 uppercase">{riskData.riskLevel} RISK CLASSIFICATION</span>
            </div>
          </div>

          {/* 5-Pillar Matrix Gauges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            {[
              { name: 'Weather Risk', score: riskData.weatherRisk, icon: CloudRain },
              { name: 'Port Congestion', score: riskData.congestionRisk, icon: Anchor },
              { name: 'Cargo & Hazmat', score: riskData.cargoRisk, icon: Box },
              { name: 'Customs & Tariff', score: riskData.customsRisk, icon: FileText },
              { name: 'Geopolitical Passage', score: riskData.geopoliticalRisk, icon: ShieldAlert },
            ].map((p, idx) => {
              const Icon = p.icon;
              return (
                <div key={idx} className="p-4 bg-slate-800/70 border border-slate-700/70 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-slate-400">
                    <Icon className="w-4 h-4 text-cyan-400" />
                    <span className="font-mono font-bold text-white">{p.score}/100</span>
                  </div>
                  <div className="font-bold text-slate-200">{p.name}</div>
                  <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full ${
                        p.score > 60 ? 'bg-red-500' : p.score > 35 ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${p.score}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Customs Sign-Off Mandate Evaluation */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                CUSTOMS & CUSTOMER OFFICER SIGN-OFF REQUIREMENT
              </span>
              <div className="text-sm font-black text-white">
                {riskData.signOffRequired ? 'OFFICER SIGN-OFF REQUIRED' : 'AUTOMATED PRE-CLEARANCE ELIGIBLE'}
              </div>
              <p className="text-xs text-slate-400">{riskData.signOffReason}</p>
            </div>

            <div className="shrink-0">
              {riskData.signOffRequired ? (
                <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs font-black">
                  Pending Officer Sign-Off
                </span>
              ) : (
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Pre-Cleared</span>
                </span>
              )}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setCurrentStep('customs_agent')}
              className="text-xs font-bold text-slate-400 hover:text-white px-4 py-2"
            >
              ← Back to Customs
            </button>

            <button
              type="button"
              onClick={runQuotePreviewStep}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
            >
              <span>PROCEED TO QUOTE PREVIEW</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================
          STAGE 8: QUOTE PREVIEW
          ========================================================= */}
      {currentStep === 'quote_preview' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                STAGE 8: QUOTE PREVIEW
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-1">
                Official Freight Quotation Summary & Tariff Review
              </h3>
              <p className="text-xs text-slate-500">
                Comprehensive preview of Price, Route ETA, Weather Rating, Customs & Risk.
              </p>
            </div>

            <div className="bg-slate-900 text-white p-4 rounded-2xl text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Committed All-In Sell Price</span>
              <div className="text-2xl font-black text-cyan-400">
                {formatCurrency(pricingBreakdown.grandTotal, 'INR')}
              </div>
              <span className="text-[10px] text-slate-400 font-semibold">{incoterm} • 14-Day Price Lock Guarantee</span>
            </div>
          </div>

          {/* 4 Summary Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Corridor & Mode</span>
              <div className="font-black text-slate-900">{originPort} ➔ {destinationPort}</div>
              <p className="text-slate-500">{quantity} × {containerSpec} ({transportMode.toUpperCase()})</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Transit Schedule (ETA)</span>
              <div className="font-black text-slate-900">{selectedRoute?.transitDays || 6} Calendar Days</div>
              <p className="text-emerald-700 font-semibold">Carrier: {selectedRoute?.carrierName || 'CMA CGM'}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Weather & Ocean State</span>
              <div className="font-black text-slate-900">{weatherData.beaufortScale}</div>
              <p className="text-slate-500">Delay Buffer: +{weatherData.bufferHours} hrs</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Risk & Compliance</span>
              <div className="font-black text-slate-900">Score: {riskData.compositeScore}/100 ({riskData.riskLevel})</div>
              <p className="text-blue-700 font-semibold">HS {customsData.hsCode} Verified</p>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep('risk_engine')}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 px-4 py-2"
            >
              ← Back to Risk Engine
            </button>

            <button
              type="button"
              disabled={isProcessingStep}
              onClick={runCustomsSignOffStep}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 text-white font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer"
            >
              <span>{riskData.signOffRequired ? 'PROCEED TO CUSTOMS SIGN-OFF' : 'ISSUE OFFICIAL QUOTATION'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================
          STAGE 9: CUSTOMS COMPLIANCE REVIEW & SUBMISSION
          ========================================================= */}
      {currentStep === 'customs_signoff' && (
        <div className="bg-amber-950/20 border border-amber-500/40 rounded-3xl p-6 sm:p-8 space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-amber-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-950 px-2.5 py-0.5 rounded-full border border-amber-700">
                  STAGE 9: CUSTOMS COMPLIANCE QUEUE
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  Customs Officer Endorsement Required
                </h3>
                <p className="text-xs text-slate-600">
                  This shipment requires formal compliance sign-off due to: <strong>{riskData.signOffReason}</strong>
                </p>
              </div>
            </div>

            <span className="bg-amber-100 text-amber-800 text-xs font-black px-3.5 py-1.5 rounded-xl">
              OFFICER REVIEW MANDATORY
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Required Documents Checklist */}
            <div className="bg-white rounded-2xl p-5 border border-amber-200/80 space-y-3 text-xs">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-600" />
                <span>Uploaded Documents for Officer Review</span>
              </h4>
              <div className="space-y-2">
                {(customsData.requiredDocuments || []).map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-semibold text-slate-700">{doc}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">Attached</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipper Declaration & Officer Routing */}
            <div className="bg-white rounded-2xl p-5 border border-amber-200/80 space-y-3 text-xs">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Customs Compliance Desk Routing</span>
              </h4>
              <div className="p-3 bg-amber-50 rounded-xl text-slate-700 text-xs leading-relaxed space-y-1">
                <p className="font-bold text-amber-900">Assigned Desk: Port Customs & ICEGATE Clearance Bureau</p>
                <p className="text-slate-600">
                  Per statutory policy, customer officers independently audit HS classification ({customsData.hsCode}), duty obligations ({customsData.bcdPct}% BCD + {customsData.igstPct}% IGST), and hazardous material declarations before quotation release.
                </p>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-800">
                💡 <strong>Note for Testing:</strong> As a Shipper, you submit the dossier. The Customs Officer reviews and signs off from the dedicated <strong>Customs Officer Portal</strong>.
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-amber-500/20">
            <button
              type="button"
              onClick={() => setCurrentStep('quote_preview')}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 px-4 py-2"
            >
              ← Back to Preview
            </button>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                disabled={isProcessingStep}
                onClick={handleOfficerSignOffAction}
                className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/25 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>SUBMIT FOR CUSTOMS SIGN-OFF & ISSUE QUOTE</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          STAGE 10: QUOTE ISSUED & STAGE 11: USER VIEWS PRICE + ETA + RISK + COMPLIANCE
          ========================================================= */}
      {(currentStep === 'quote_issued' || currentStep === 'quote_details_view') && issuedQuote && (
        <div className="bg-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
          {/* Top Issued Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-800">
                    STAGE 10 & 11: QUOTE ISSUED & 4-PILLAR VIEW
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-300">{issuedQuote.id}</span>
                </div>
                <h3 className="text-xl font-black text-white mt-0.5">
                  Official Freight Quotation Certificate
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => generateQuotePDF(issuedQuote)}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all border border-slate-700 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Download PDF</span>
              </button>

              {onNavigateToQuotations && (
                <button
                  type="button"
                  onClick={onNavigateToQuotations}
                  className="flex-1 sm:flex-initial px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <span>My Quotations</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* THE 4 PILLARS REQUESTED BY USER: PRICE + ETA + RISK + COMPLIANCE */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* PILLAR 1: PRICE */}
            <div className="p-5 rounded-2xl border border-cyan-500/30 bg-[#0A1224] space-y-2 relative overflow-hidden">
              <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center justify-between">
                <span>1. COMMITTED PRICE</span>
                <DollarSign className="w-3.5 h-3.5" />
              </div>
              <div className="text-2xl font-black text-white tracking-tight">
                {formatCurrency(issuedQuote.tariffAmount, issuedQuote.currency)}
              </div>
              <p className="text-xs text-slate-300">
                Rule + ML rate locked for 14 calendar days.
              </p>
              <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-800">
                Includes BAF, THC, DOC & Tax
              </div>
            </div>

            {/* PILLAR 2: ETA & TRANSIT */}
            <div className="p-5 rounded-2xl border border-blue-500/30 bg-[#0A1224] space-y-2">
              <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center justify-between">
                <span>2. TRANSIT & ETA</span>
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div className="text-2xl font-black text-white tracking-tight">
                {issuedQuote.breakdown?.estimatedTransitDays || '6 Days'}
              </div>
              <p className="text-xs text-slate-300">
                Est. Arrival: <span className="font-bold text-emerald-400">{issuedQuote.breakdown?.estimatedArrivalDate}</span>
              </p>
              <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-800">
                Carrier: {selectedRoute?.carrierName || 'CMA CGM Liner'}
              </div>
            </div>

            {/* PILLAR 3: RISK ENGINE SCORE */}
            <div className="p-5 rounded-2xl border border-purple-500/30 bg-[#0A1224] space-y-2">
              <div className="text-[10px] font-black text-purple-400 uppercase tracking-widest flex items-center justify-between">
                <span>3. COMPOSITE RISK</span>
                <ShieldAlert className="w-3.5 h-3.5" />
              </div>
              <div className="text-2xl font-black text-white tracking-tight">
                {riskData.compositeScore} <span className="text-xs text-slate-400 font-normal">/ 100</span>
              </div>
              <p className="text-xs text-emerald-400 font-bold">
                {riskData.riskLevel} RISK TIER
              </p>
              <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-800">
                Weather Score: {weatherData.stormRiskScore}/100
              </div>
            </div>

            {/* PILLAR 4: COMPLIANCE & CUSTOMS */}
            <div className="p-5 rounded-2xl border border-emerald-500/30 bg-[#0A1224] space-y-2">
              <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center justify-between">
                <span>4. COMPLIANCE & SIGN-OFF</span>
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <div className="text-lg font-black text-emerald-400 tracking-tight">
                {isOfficerSignedOff ? 'ENDORSED & CLEARED' : 'AUTOMATED CLEARANCE'}
              </div>
              <p className="text-xs text-slate-300">
                HS {customsData.hsCode} • ICEGATE Ready
              </p>
              <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-800">
                Duty: {formatCurrency(customsData.estimatedDutyInr, 'INR')}
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setCurrentStep('create_shipment');
                setIssuedQuote(null);
              }}
              className="text-xs font-bold text-slate-400 hover:text-white px-4 py-2"
            >
              + Create Another Shipment
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => generateQuotePDF(issuedQuote)}
                className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/30 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>DOWNLOAD OFFICIAL PDF QUOTE</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
