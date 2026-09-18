import React, { useState, useMemo, useEffect, Component, ReactNode } from 'react';
import { CheckCircle2, X, ArrowLeft, AlertCircle } from 'lucide-react';
import { Header } from './components/Header';
import { SignInPage } from './components/SignInPage';
import { AuthModal } from './components/AuthModal';
import { HeroSection } from './components/HeroSection';
import { AboutSection } from './components/AboutSection';
import { PromotionsSection } from './components/PromotionsSection';
import { ReferenceDashboard } from './components/ReferenceDashboard';
import { ContactSection } from './components/ContactSection';
import { WorkspaceHeader } from './components/WorkspaceHeader';
import { SidebarNav } from './components/SidebarNav';
import { CalculationForm } from './components/CalculationForm';
import { LiveEstimatePanel } from './components/LiveEstimatePanel';
import { TrackingView } from './components/TrackingView';
import { QuotationsView } from './components/QuotationsView';
import { RoutesView } from './components/RoutesView';
import { DashboardView } from './components/DashboardView';
import { QuotePDFModal } from './components/QuotePDFModal';
import { QuoteFeedbackModal } from './components/QuoteFeedbackModal';
import { AdminDashboardView } from './components/AdminDashboardView';
import { AdminTab } from './components/AdminSidebarNav';
import { FreightAgentPortalView } from './components/FreightAgentPortalView';
import { FreightAgentTab } from './components/FreightAgentSidebarNav';
import { CompanyInfoPage } from './components/CompanyInfoPage';
import { AccountDeactivationNotice } from './components/AccountDeactivationNotice';
import { QuotationAgentFloatingModal } from './components/QuotationAgentFloatingModal';
import { CustomsOfficerPortalView } from './components/CustomsOfficerPortalView';
import { Milestone3RiskIntelligenceWorkspace } from './components/Milestone3RiskIntelligenceWorkspace';
import { CoreTestScenariosView } from './components/CoreTestScenariosView';
import { M4CustomerDocumentsView } from './components/M4CustomerDocumentsView';
import { M4AgentDocumentReview } from './components/M4AgentDocumentReview';
import { M4CompareQuotesView } from './components/M4CompareQuotesView';
import { M4SelectedQuotesView } from './components/M4SelectedQuotesView';
import { M4CustomerTrackingView } from './components/M4CustomerTrackingView';
import { userService } from './services/userService';

import { QuoteFormState, SavedQuotation, QuoteStatus, CargoLineItem, UserRole, ProofDocumentType, ProofDocumentSlot, CalculationSnapshot } from './types';
import { validateCustomsCompliance } from './backend/customs/customsService';
import { INITIAL_QUOTATIONS } from './data/freightData';
import { calculateTariffBreakdown } from './utils/calculator';

interface ErrorBoundaryProps { children: ReactNode; }
interface ErrorBoundaryState { hasError: boolean; error: Error | null; }
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mb-4">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-700 mb-1">Unable to load tracking information</h3>
          <p className="text-xs text-slate-400 max-w-[300px] mb-4">
            Something went wrong while loading the tracking view. Please try refreshing the page.
          </p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const createEmptyFormState = (): QuoteFormState => ({
  originPortCode: '',
  destinationPortCode: '',
  pickupHubId: '',
  deliveryHubId: '',
  cargoReadyDate: '',
  requiredDeliveryDate: '',
  transportMode: 'ocean',
  oceanLoadType: 'FCL',
  incoterm: 'FOB',
  cargoItems: [
    {
      id: 'item-1',
      packageType: 'Pallet',
      containerSpec: '20GP',
      quantity: 0,
      grossWeightKg: 0,
      commodityDescription: '',
      hsCode: '',
    },
  ],
  declaredValue: 0,
  currency: 'INR',
  specialInstructions: '',
  fragileGoods: false,
  hazardousMaterials: false,
  temperatureControlled: false,
  addCargoInsurance: false,
  promoCodeApplied: null,
  fullName: '',
  companyName: '',
  email: '',
  country: '',
});

export default function App() {
  // Authentication State (Defaults to FALSE - Sign In Page First)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<UserRole>('customer');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Navigation State
  const [activePublicTab, setActivePublicTab] = useState<string>('workspace');
  const [workspaceView, setWorkspaceView] = useState<'dashboard' | 'calculation' | 'routes' | 'tracking' | 'quotations' | 'test-scenarios' | 'customer-documents' | 'agent-documents' | 'compare-quotes' | 'selected-quotes'>('calculation');
  const [adminSubTab, setAdminSubTab] = useState<AdminTab>('home');
  const [agentSubTab, setAgentSubTab] = useState<FreightAgentTab>('operations-overview');

  // Quotation History State - persisted to localStorage for cross-session sharing
  const [quotations, setQuotations] = useState<SavedQuotation[]>(() => {
    try {
      const saved = localStorage.getItem('freighthub_quotations');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedQuoteForPDF, setSelectedQuoteForPDF] = useState<SavedQuotation | null>(null);
  const [quoteFeedback, setQuoteFeedback] = useState<string | null>(null);
  const [isGeneratingQuote, setIsGeneratingQuote] = useState<boolean>(false);
  const [isEstimateCalculated, setIsEstimateCalculated] = useState<boolean>(false);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState<boolean>(false);
  const [formUploadedFiles, setFormUploadedFiles] = useState<Array<{ fileUrl: string; fileName: string; fileSize: number }>>([]);

  // Proof document state for 3 required document types
  const [proofDocuments, setProofDocuments] = useState<ProofDocumentSlot[]>(() => {
    return [
      { documentType: 'AADHAAR', label: 'Aadhaar / Identity Proof', status: 'NOT_UPLOADED' },
      { documentType: 'COMPANY_VERIFICATION', label: 'Company Verification Proof', status: 'NOT_UPLOADED' },
      { documentType: 'ADDRESS_PROOF', label: 'Business / Address Proof', status: 'NOT_UPLOADED' },
    ];
  });

  // Persist quotations to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('freighthub_quotations', JSON.stringify(quotations));
  }, [quotations]);

  // Persist proof documents to localStorage (per-user)
  useEffect(() => {
    if (userEmail) {
      localStorage.setItem(`freighthub_proof_docs_${userEmail}`, JSON.stringify(proofDocuments));
    }
  }, [proofDocuments, userEmail]);

  // Feedback Popup State (middle screen pop up box)
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState<boolean>(false);
  const [feedbackQuoteId, setFeedbackQuoteId] = useState<string>('');

  // Form State initialized to empty/none state
  const [formData, setFormData] = useState<QuoteFormState>(createEmptyFormState());

  // Auto-fill contact details from user profile when authenticated
  useEffect(() => {
    if (isAuthenticated && userEmail && !formData.fullName && !formData.email) {
      const userAccount = userService.getUserByEmailOrUsername(userEmail);
      if (userAccount) {
        setFormData((prev) => ({
          ...prev,
          fullName: userAccount.fullName || userName || '',
          companyName: userAccount.companyName || '',
          email: userEmail,
          country: prev.country || 'India',
        }));
      }
    }
  }, [isAuthenticated, userEmail, userName]);

  // Handle user login / sign in -> resets form state to none
  const handleLoginSuccess = (email: string, role: UserRole = 'user', fullName?: string, username?: string) => {
    setUserEmail(email);
    setUserRole(role);
    setUserName(fullName || username || email.split('@')[0] || 'User');
    setIsAuthenticated(true);
    // Auto-fill contact details from logged-in user profile
    const userAccount = userService.getUserByEmailOrUsername(email);
    setFormData({
      ...createEmptyFormState(),
      fullName: fullName || userAccount?.fullName || username || email.split('@')[0] || '',
      companyName: userAccount?.companyName || '',
      email: email,
      country: 'India', // Default, can be updated by user
    });
    setQuoteFeedback(null);
    setIsEstimateCalculated(false);
    setIsAgentModalOpen(false);
    // Clean up old shared localStorage key (migration from shared to per-user keys)
    localStorage.removeItem('freighthub_proof_docs');
    // Load this user's proof documents from localStorage (or reset to empty)
    try {
      const stored = localStorage.getItem(`freighthub_proof_docs_${email}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length === 3) {
          setProofDocuments(parsed);
        } else {
          setProofDocuments([
            { documentType: 'AADHAAR', label: 'Aadhaar / Identity Proof', status: 'NOT_UPLOADED' },
            { documentType: 'COMPANY_VERIFICATION', label: 'Company Verification Proof', status: 'NOT_UPLOADED' },
            { documentType: 'ADDRESS_PROOF', label: 'Business / Address Proof', status: 'NOT_UPLOADED' },
          ]);
        }
      } else {
        setProofDocuments([
          { documentType: 'AADHAAR', label: 'Aadhaar / Identity Proof', status: 'NOT_UPLOADED' },
          { documentType: 'COMPANY_VERIFICATION', label: 'Company Verification Proof', status: 'NOT_UPLOADED' },
          { documentType: 'ADDRESS_PROOF', label: 'Business / Address Proof', status: 'NOT_UPLOADED' },
        ]);
      }
    } catch {
      setProofDocuments([
        { documentType: 'AADHAAR', label: 'Aadhaar / Identity Proof', status: 'NOT_UPLOADED' },
        { documentType: 'COMPANY_VERIFICATION', label: 'Company Verification Proof', status: 'NOT_UPLOADED' },
        { documentType: 'ADDRESS_PROOF', label: 'Business / Address Proof', status: 'NOT_UPLOADED' },
      ]);
    }
    const isSpecialRole = role === 'admin' || role === 'freight-agent' || role === 'customs-officer';
    setWorkspaceView(isSpecialRole ? 'dashboard' : 'calculation');
    setAdminSubTab('home');
    setAgentSubTab('operations-overview');
    setActivePublicTab(isSpecialRole ? 'workspace' : 'home');
  };

  // Live Tariff Calculation Memo
  const liveBreakdown = useMemo(() => {
    return calculateTariffBreakdown(formData);
  }, [formData]);

  // Update Quotation (e.g. by Freight Agent review & dispatch, or Customer accept/decline)
  // Mirrors the change into the shared localStorage quote store so status changes survive reloads.
  const handleUpdateQuotation = (updatedQuote: SavedQuotation) => {
    setQuotations((prev) => {
      const exists = prev.some((q) => q && q.id === updatedQuote.id);
      const next = exists
        ? prev.map((q) => (q.id === updatedQuote.id ? updatedQuote : q))
        : [updatedQuote, ...prev];
      return next;
    });
  };

  const handleDeleteQuotation = (quoteId: string) => {
    setQuotations((prev) => {
      return prev.filter((q) => q.id !== quoteId);
    });
  };

  const handleDeleteMultipleQuotations = (quoteIds: string[]) => {
    setQuotations((prev) => {
      return prev.filter((q) => !quoteIds.includes(q.id));
    });
  };

  // Customs Officer decision propagation (M3): mirrors officer sign-off into the shared quote store
  // so Customer, Freight Agent and Admin portals all see the same customs status & audit trail.
  const handleCustomsDecision = (decision: {
    caseId: string;
    shipmentId: string;
    quoteId?: string;
    action: 'APPROVE' | 'REQUEST_DOCUMENTS' | 'CONDITIONAL' | 'REJECT';
    status: string;
    officerEmail: string;
    officerName: string;
    notes: string;
    readinessScore: number;
  }) => {
    const target = quotations.find(
      (q) => q && (q.customsCaseId === decision.caseId || (decision.quoteId && q.id === decision.quoteId))
    );
    if (!target) return;

    const nextStatus: QuoteStatus = decision.action === 'REJECT' ? 'DECLINED' : target.status;
    handleUpdateQuotation({
      ...target,
      status: nextStatus,
      customsStatus: decision.status,
      customsFlags: [
        ...(target.customsFlags || []),
        `CUSTOMS_${decision.action}:${decision.status} by ${decision.officerEmail} @ ${new Date().toISOString()}`,
      ],
      auditLogs: [
        ...(target.auditLogs || []),
        {
          id: `AUD-${Date.now()}`,
          quoteId: target.id,
          action: `CUSTOMS_${decision.action}`,
          modifiedBy: decision.officerEmail,
          reason: decision.notes,
          previousValue: target.customsStatus || 'PENDING',
          newValue: decision.status,
          timestamp: new Date().toISOString(),
        },
      ],
    });
  };

  // Handle editing a rejected quote
  const handleEditQuote = (quoteId: string) => {
    const target = quotations.find((q) => q.id === quoteId);
    if (target) {
      setFormData(target.formData);
      setIsEstimateCalculated(false);
      setWorkspaceView('calculation');
    }
  };

  // Form Handlers - changes return the live estimate to zero until user generates quote
  const handleUpdateForm = (updates: Partial<QuoteFormState>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    setIsEstimateCalculated(false);
  };

  const handleResetForm = () => {
    setFormData(createEmptyFormState());
    setQuoteFeedback(null);
    setIsEstimateCalculated(false);
    setIsAgentModalOpen(false);
  };

  const handleGenerateNewQuote = () => {
    setFormData(createEmptyFormState());
    setQuoteFeedback(null);
    setIsEstimateCalculated(false);
    setIsAgentModalOpen(false);
    setWorkspaceView('calculation');
  };

  const handleAddCargoItem = () => {
    const newItem: CargoLineItem = {
      id: `item-${Date.now()}`,
      packageType: 'Pallet',
      containerSpec: '20GP',
      quantity: 0,
      grossWeightKg: 0,
      commodityDescription: '',
      hsCode: '',
    };
    setFormData((prev) => ({
      ...prev,
      cargoItems: [...prev.cargoItems, newItem],
    }));
    setIsEstimateCalculated(false);
  };

  const handleRemoveCargoItem = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      cargoItems: (prev.cargoItems || []).filter((i) => i && i.id !== id),
    }));
    setIsEstimateCalculated(false);
  };

  const handleUpdateCargoItem = (id: string, updates: Partial<CargoLineItem>) => {
    setFormData((prev) => ({
      ...prev,
      cargoItems: (prev.cargoItems || []).map((i) => (i && i.id === id ? { ...i, ...updates } : i)),
    }));
    setIsEstimateCalculated(false);
  };

  // Save current form inputs and calculated tariff into saved drafts
  const handleSaveDraftFromModal = () => {
    try {
      const origin = formData.originPortCode || 'BOM';
      const dest = formData.destinationPortCode || 'AEJEA';
      const draftTitle = `${origin} → ${dest} (${formData.transportMode.toUpperCase()})`;
      const now = new Date();
      const formattedDate = `${now.toLocaleDateString()} at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      const totalWeight = (formData.cargoItems || []).reduce((sum, item) => sum + (item?.grossWeightKg || 0) * (item?.quantity || 1), 0);

      const newDraft = {
        id: `draft-${Date.now()}`,
        title: draftTitle,
        savedAt: formattedDate,
        formData: { ...formData },
        routeSummary: `${origin} -> ${dest}`,
        transportMode: formData.transportMode,
        totalWeightKg: totalWeight,
        estimatedTariffInr: liveBreakdown.grandTotal,
      };

      const existingRaw = localStorage.getItem('freighthub_saved_drafts_v1');
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      const updated = [newDraft, ...(Array.isArray(existing) ? existing : []).filter((d: any) => d && d.id !== newDraft.id)];
      localStorage.setItem('freighthub_saved_drafts_v1', JSON.stringify(updated));
    } catch (err) {
      console.error('Error saving draft from modal:', err);
    }
  };

  // Generate Quotation Action - creates quotes from multiple freight companies
  const handleFormUploadDocument = async (file: File): Promise<{ fileUrl: string; fileName: string } | null> => {
    try {
      const token = localStorage.getItem('freighthub_session_token') || '';
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataUpload,
      });
      const result = await res.json();
      if (res.ok && result.success) {
        const newFile = { fileUrl: result.fileUrl, fileName: file.name, fileSize: file.size };
        setFormUploadedFiles(prev => [...prev, newFile]);
        return { fileUrl: result.fileUrl, fileName: file.name };
      }
      return null;
    } catch {
      return null;
    }
  };

  // Upload a specific proof document type (Aadhaar, Company Verification, Address Proof)
  const handleUploadProofDocument = async (docType: ProofDocumentType, file: File): Promise<{ fileUrl: string; fileName: string } | null> => {
    try {
      const token = localStorage.getItem('freighthub_session_token') || '';
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataUpload,
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setProofDocuments((prev) =>
          prev.map((d) =>
            d.documentType === docType
              ? { ...d, fileName: file.name, fileUrl: result.fileUrl, fileSize: file.size, status: 'UPLOADED' as const, uploadedAt: new Date().toISOString() }
              : d
          )
        );
        return { fileUrl: result.fileUrl, fileName: file.name };
      }
      return null;
    } catch {
      return null;
    }
  };

  const handleRemoveProofDocument = (docType: ProofDocumentType) => {
    setProofDocuments((prev) =>
      prev.map((d) =>
        d.documentType === docType
          ? { documentType: d.documentType, label: d.label, status: 'NOT_UPLOADED' as const }
          : d
      )
    );
  };

  const handleGenerateQuotation = () => {
    if (isGeneratingQuote) return;
    setIsGeneratingQuote(true);

    const companies = [
      { companyId: 'COMP-001', name: 'Global Freight Networks', margin: 1.0 },
      { companyId: 'COMP-002', name: 'Oceanic Express Logistics', margin: 1.05 },
      { companyId: 'COMP-003', name: 'TransContinental Shipping', margin: 0.95 },
    ];

    const basePrice = liveBreakdown.grandTotal;
    const newQuotes: SavedQuotation[] = [];

    companies.forEach((company, index) => {
      const quoteId = `QT-${Date.now()}-${index + 1}`;
      const adjustedPrice = Math.round(basePrice * company.margin);

      // Build company-specific breakdown with recalculation
      const companyBreakdown = { ...liveBreakdown };
      companyBreakdown.finalSellPrice = adjustedPrice;
      companyBreakdown.grandTotal = adjustedPrice;
      companyBreakdown.marginAmount = adjustedPrice - liveBreakdown.totalCost;
      companyBreakdown.marginPercentage = liveBreakdown.totalCost > 0
        ? Math.round(((adjustedPrice - liveBreakdown.totalCost) / liveBreakdown.totalCost) * 100 * 100) / 100
        : liveBreakdown.marginPercentage;

      // Create immutable calculation snapshot for this specific quote
      const calculationSnapshot: CalculationSnapshot = {
        baseFreight: liveBreakdown.baseTariff,
        bafFuelSurcharge: liveBreakdown.bafFuelSurcharge,
        originThc: liveBreakdown.terminalHandlingCharge,
        documentationFee: liveBreakdown.documentationFee,
        specialHandling: liveBreakdown.specialHandlingSurcharge,
        insuranceFee: liveBreakdown.insuranceFee,
        discountAmount: liveBreakdown.discountAmount,
        totalCost: liveBreakdown.totalCost,
        marginPercentage: companyBreakdown.marginPercentage,
        marginAmount: companyBreakdown.marginAmount,
        finalSellPrice: adjustedPrice,
        routeDetails: {
          origin: formData.originPortCode || 'BOM',
          destination: formData.destinationPortCode || 'AEJEA',
          distance: liveBreakdown.estimatedDistanceNmOrKm || 'N/A',
          transitDays: liveBreakdown.estimatedTransitDays || 'N/A',
          estimatedArrival: liveBreakdown.estimatedArrivalDate || 'N/A',
        },
        pricingFactors: {
          transportMode: formData.transportMode,
          containerSpec: formData.cargoItems?.[0]?.containerSpec,
          containerCount: liveBreakdown.containerCount || 1,
          incoterm: formData.incoterm || 'FOB',
          totalWeightKg: liveBreakdown.totalWeightKg,
          cargoSummary: liveBreakdown.cargoCountSummary || 'N/A',
        },
        aiCalculation: {
          ruleBasedPrice: liveBreakdown.ruleBasedPriceInr,
          aiPredictedPrice: liveBreakdown.aiPredictedPriceInr,
          recommendedPrice: liveBreakdown.recommendedPriceInr,
          weatherRiskScore: liveBreakdown.weatherRiskScore,
          customsRiskScore: liveBreakdown.customsRiskScore,
          compositeRiskScore: liveBreakdown.compositeRiskScore,
          overallRiskLevel: liveBreakdown.overallRiskLevel,
        },
      };

      const newQuote: SavedQuotation = {
        id: quoteId,
        shipperName: formData.fullName || userName || '',
        companyName: company.name,
        companyId: company.companyId,
        routeSummary: `${formData.originPortCode || 'BOM'} -> ${formData.destinationPortCode || 'AEJEA'}`,
        originCode: formData.originPortCode || 'BOM',
        destinationCode: formData.destinationPortCode || 'AEJEA',
        transportMode: formData.transportMode,
        oceanLoadType: formData.oceanLoadType,
        tariffAmount: adjustedPrice,
        currency: formData.currency,
        status: 'ISSUED',
        createdAt: new Date().toISOString().split('T')[0],
        cargoSummary: liveBreakdown.cargoCountSummary,
        breakdown: companyBreakdown,
        formData: { ...formData },
        version: 1,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        calculationSnapshot,
      };

      newQuotes.push(newQuote);
    });

    // REPLACE all previous quotes - only show the new 3
    setQuotations(newQuotes);

    // Build missing document alert
    const missingDocs = proofDocuments.filter((d) => d.status !== 'UPLOADED').map((d) => d.label);
    let feedbackMsg = `Generated ${newQuotes.length} company quotes for ${formData.originPortCode} → ${formData.destinationPortCode}. Go to "Compare Quotes" to review and select.`;
    if (missingDocs.length > 0 && missingDocs.length < 3) {
      feedbackMsg += ` ⚠ Missing proof documents: ${missingDocs.join(', ')}. You can upload them later from the document section.`;
    } else if (missingDocs.length === 3) {
      feedbackMsg += ` ⚠ No proof documents uploaded. Please upload your Aadhaar, Company Verification, and Address Proof documents for faster processing.`;
    }

    setQuoteFeedback(feedbackMsg);
    setIsGeneratingQuote(false);
    setIsEstimateCalculated(true);
    setWorkspaceView('compare-quotes');
  };

  const handleCloseQuotePDFModal = () => {
    setSelectedQuoteForPDF(null);
    if (feedbackQuoteId) {
      setIsFeedbackModalOpen(true);
    }
  };

  const handleSelectCorridor = (origin: string, dest: string, modeStr: string) => {
    let mode: any = 'ocean';
    if (modeStr.toLowerCase().includes('air')) mode = 'air';

    setFormData((prev) => ({
      ...prev,
      originPortCode: origin.split(' ')[0],
      destinationPortCode: dest.split(' ')[0],
      transportMode: mode,
    }));

    setIsAuthenticated(true);
    setActivePublicTab('workspace');
    setWorkspaceView('calculation');
  };

  const currentUserAccount = useMemo(() => {
    if (!isAuthenticated || !userEmail) return undefined;
    return userService.getUserByEmailOrUsername(userEmail);
  }, [isAuthenticated, userEmail, workspaceView, adminSubTab, agentSubTab]);

  return (
    <div className={`min-h-screen text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white transition-colors duration-300 ${!isAuthenticated ? 'bg-gradient-to-br from-[#070D1E] via-[#0B132B] to-[#141E38]' : 'bg-slate-100'}`}>
      {/* Top Header Navigation (Only shown after user/admin sign in) */}
      {isAuthenticated && (
        <Header
          activeTab={activePublicTab}
          workspaceView={workspaceView}
          adminSubTab={adminSubTab}
          setActiveTab={(tab) => {
            setActivePublicTab(tab);
          }}
          onSelectAdminTab={(tab) => setAdminSubTab(tab)}
          isAuthenticated={isAuthenticated}
          userEmail={userEmail}
          userRole={userRole}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onLogout={() => {
            setIsAuthenticated(false);
            setActivePublicTab('home');
          }}
          onNavigateToWorkspace={(view = 'calculation') => {
            setIsAuthenticated(true);
            setActivePublicTab('workspace');
            setWorkspaceView(view);
          }}
        />
      )}

      {/* Account Deactivation Notice Banner (If account is scheduled for deletion with 24h notice) */}
      {isAuthenticated && currentUserAccount && currentUserAccount.status === 'pending_deletion' && (
        <AccountDeactivationNotice currentUser={currentUserAccount} />
      )}

      {/* Main Container */}
      <main className={`flex-1 max-w-[1400px] w-full mx-auto px-3 sm:px-5 lg:px-6 ${!isAuthenticated ? 'py-4 flex flex-col justify-center min-h-[92vh]' : 'py-5 sm:py-6'}`}>
        {/* FIRST: SIGN IN PAGE (When not logged in) */}
        {!isAuthenticated ? (
          <SignInPage onLoginSuccess={(email, role, fullName, username) => handleLoginSuccess(email, role, fullName, username)} />
        ) : activePublicTab === 'about' || activePublicTab === 'services' || activePublicTab === 'contact' || activePublicTab === 'company-info' ? (
          /* UNIFIED COMPANY INFO PAGE (ABOUT, SERVICES, CONTACT US ONE BELOW ANOTHER WITH INSTANT BUTTON JUMPING & RETURN TO WORKSPACE) */
          <CompanyInfoPage
            userRole={userRole}
            initialSection={activePublicTab === 'company-info' ? 'about' : (activePublicTab as 'about' | 'services' | 'contact')}
            selectedCoupon={formData.promoCodeApplied}
            onApplyCoupon={(code) => handleUpdateForm({ promoCodeApplied: code })}
            brokerName={userName}
            brokerEmail={userEmail}
            onNavigateBack={() => {
              if (userRole === 'freight-agent' || userRole === 'admin' || userRole === 'customs-officer') {
                setActivePublicTab('workspace');
                setWorkspaceView('dashboard');
              } else {
                setActivePublicTab('home');
              }
            }}
            onAccessSystem={() => {
              setActivePublicTab('workspace');
              setWorkspaceView('calculation');
            }}
            onNavigateToWorkspace={(view = 'calculation') => {
              setActivePublicTab('workspace');
              setWorkspaceView(view);
            }}
          />
        ) : userRole === 'admin' ? (
          /* SYSTEM ADMINISTRATOR PORTAL ONLY FOR ADMIN */
          <AdminDashboardView
            quotations={quotations}
            onViewQuotePDF={(q) => setSelectedQuoteForPDF(q)}
            activeTab={adminSubTab}
            onTabChange={(tab) => setAdminSubTab(tab)}
          />
        ) : userRole === 'freight-agent' ? (
          /* FREIGHT AGENT DESK (VESSEL DISPATCH, LIVE SPOT RATES, ROUTE OPERATIONS, TRACKING) */
          <FreightAgentPortalView
            userName={userName}
            userEmail={userEmail}
            agentSubTab={agentSubTab}
            onSelectAgentTab={(tab) => setAgentSubTab(tab)}
            userRole={userRole}
            quotations={quotations}
            onUpdateQuotation={handleUpdateQuotation}
          />
        ) : userRole === 'customs-officer' ? (
          /* CUSTOMS OFFICER PORTAL */
          <CustomsOfficerPortalView
            officerName={userName}
            officerEmail={userEmail}
            onLogout={() => setIsAuthenticated(false)}
            onCustomsDecision={handleCustomsDecision}
          />
        ) : activePublicTab !== 'workspace' ? (
          /* PUBLIC HOME LANDING SECTION FOR SHIPPER USER */
          <div className="space-y-12 animate-in fade-in duration-300">
            <HeroSection
              userRole={userRole}
              onAccessSystem={() => {
                setActivePublicTab('workspace');
                setWorkspaceView('calculation');
              }}
            />
            <AboutSection />
            <PromotionsSection
              selectedCoupon={formData.promoCodeApplied}
              onApplyCoupon={(code) => {
                handleUpdateForm({ promoCodeApplied: code });
                setActivePublicTab('workspace');
                setWorkspaceView('calculation');
              }}
            />
            <ReferenceDashboard onSelectCorridor={handleSelectCorridor} />
            <ContactSection />
          </div>
        ) : (
          /* AUTHENTICATED SHIPPER USER WORKSPACE */
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Top Shipper Banner */}
            <WorkspaceHeader quoteCount={quotations.length} userName={userName || 'User'} />

            {/* Generated Quote Feedback Confirmation Banner */}
            {quoteFeedback && (
              <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between border border-emerald-500 animate-in fade-in slide-in-from-top duration-300">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-700/80 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-extrabold text-xs uppercase tracking-wider text-emerald-100">FEEDBACK CONFIRMATION</div>
                    <div className="text-sm font-bold text-white">{quoteFeedback}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGenerateNewQuote}
                    className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-black transition-colors shadow-sm cursor-pointer"
                  >
                    <span className="flex items-center gap-1"><ArrowLeft className="w-3.5 h-3.5" /> Back to Calculation</span>
                  </button>
                  <button
                    onClick={() => {
                      setWorkspaceView('quotations');
                      setQuoteFeedback(null);
                    }}
                    className="px-3.5 py-1.5 bg-white text-emerald-900 rounded-xl text-xs font-black hover:bg-emerald-50 transition-colors shadow-sm cursor-pointer"
                  >
                    View All Quotes
                  </button>
                  <button
                    onClick={() => setQuoteFeedback(null)}
                    className="p-1.5 text-emerald-200 hover:text-white rounded-lg hover:bg-emerald-700/50 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Main Workspace Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Sidebar Freight Navigation */}
              <div className="lg:col-span-3 lg:sticky lg:top-20 z-10">
                <SidebarNav
                  activeView={workspaceView}
                  onSelectView={(view) => {
                    setWorkspaceView(view);
                  }}
                  quotationCount={quotations.length}
                  userRole={userRole}
                />
              </div>

              {/* Center Main Content Area */}
              <div className="lg:col-span-9">
                {/* CALCULATION VIEW */}
                {workspaceView === 'calculation' && (
                  <div>
                    <CalculationForm
                      formData={formData}
                      onChangeForm={handleUpdateForm}
                      onAddCargoItem={handleAddCargoItem}
                      onRemoveCargoItem={handleRemoveCargoItem}
                      onUpdateCargoItem={handleUpdateCargoItem}
                      onGenerateQuotation={() => setIsAgentModalOpen(true)}
                      onResetForm={handleResetForm}
                      isGenerating={isGeneratingQuote}
                      onUploadDocument={handleFormUploadDocument}
                      uploadedFiles={formUploadedFiles}
                      proofDocuments={proofDocuments}
                      onUploadProofDocument={handleUploadProofDocument}
                      onRemoveProofDocument={handleRemoveProofDocument}
                    />
                  </div>
                )}

                {/* DASHBOARD VIEW */}
                {workspaceView === 'dashboard' && (
                  <DashboardView
                    quotations={quotations}
                    onNavigateToCalculation={handleGenerateNewQuote}
                    onNavigateToQuotations={() => setWorkspaceView('quotations')}
                  />
                )}

                {/* ROUTES VIEW */}
                {workspaceView === 'routes' && (
                  <RoutesView
                    onCalculateRoute={(origin, dest, mode) => {
                      setFormData((prev) => ({
                        ...prev,
                        originPortCode: origin,
                        destinationPortCode: dest,
                        transportMode: mode as any,
                      }));
                      setWorkspaceView('calculation');
                    }}
                  />
                )}

                {/* TRACKING VIEW */}
                {workspaceView === 'tracking' && (
                  (userRole === 'customer' || userRole === 'user') ? (
                    <ErrorBoundary>
                      <M4CustomerTrackingView
                        userEmail={userEmail}
                        userRole={userRole}
                        quotations={quotations}
                      />
                    </ErrorBoundary>
                  ) : (
                    <TrackingView
                      userRole={userRole}
                      onViewQuotationPdf={(quoteId) => {
                        const matched = quotations.find((q) => q.id === quoteId);
                        if (matched) setSelectedQuoteForPDF(matched);
                      }}
                    />
                  )
                )}

                {/* QUOTATIONS HISTORY VIEW */}
                {workspaceView === 'quotations' && (
                  <QuotationsView
                    quotations={quotations}
                    onViewQuotePDF={(q) => setSelectedQuoteForPDF(q)}
                    onCreateNewQuote={handleGenerateNewQuote}
                    onUpdateQuotation={handleUpdateQuotation}
                  />
                )}

                {/* M4 COMPARE QUOTES VIEW */}
                {workspaceView === 'compare-quotes' && (
                  <M4CompareQuotesView
                    quotations={quotations}
                    onQuoteSelected={() => {
                      setWorkspaceView('selected-quotes');
                    }}
                    userEmail={userEmail}
                    onUpdateQuotation={handleUpdateQuotation}
                    onDeleteQuotation={handleDeleteQuotation}
                    onDeleteMultipleQuotations={handleDeleteMultipleQuotations}
                    uploadedFiles={formUploadedFiles}
                    proofDocuments={proofDocuments}
                  />
                )}

                {/* M4 SELECTED QUOTES VIEW */}
                {workspaceView === 'selected-quotes' && (
                  <M4SelectedQuotesView
                    userEmail={userEmail}
                    onNavigateToTracking={() => setWorkspaceView('tracking')}
                    onEditQuote={handleEditQuote}
                  />
                )}

                {/* CORE TEST SCENARIOS VIEW */}
                {workspaceView === 'test-scenarios' && (
                  <CoreTestScenariosView
                    quotations={quotations}
                    onUpdateQuotation={handleUpdateQuotation}
                  />
                )}

                {/* CUSTOMER DOCUMENTS VIEW */}
                {workspaceView === 'customer-documents' && (
                  <M4CustomerDocumentsView
                    userEmail={userEmail}
                    userId={currentUserAccount?.id || ''}
                  />
                )}

                {/* AGENT DOCUMENT REVIEW VIEW */}
                {workspaceView === 'agent-documents' && (
                  <M4AgentDocumentReview
                    companyId={currentUserAccount?.companyId || 'COMP-001'}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(email, role) => handleLoginSuccess(email, role)}
      />

      {/* Multi-Agent 8-Second Floating Calculation Modal & Generated Quote View */}
      <QuotationAgentFloatingModal
        isOpen={isAgentModalOpen}
        onClose={() => setIsAgentModalOpen(false)}
        breakdown={liveBreakdown}
        formData={formData}
        onConfirmQuote={handleGenerateQuotation}
        onSaveDraft={handleSaveDraftFromModal}
        onCalculationFinished={() => {
          setIsEstimateCalculated(true);
        }}
      />

      {/* Commercial Quote PDF Preview Modal */}
      <QuotePDFModal
        quote={selectedQuoteForPDF}
        onClose={handleCloseQuotePDFModal}
      />

      {/* Optional Middle Screen Popup Box for Feedback */}
      <QuoteFeedbackModal
        isOpen={isFeedbackModalOpen}
        quoteId={feedbackQuoteId}
        onClose={() => setIsFeedbackModalOpen(false)}
      />
    </div>
  );
}