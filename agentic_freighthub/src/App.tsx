import React, { useState, useMemo, useEffect } from 'react';
import { CheckCircle2, X, ArrowLeft } from 'lucide-react';
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
import { userService } from './services/userService';

import { QuoteFormState, SavedQuotation, QuoteStatus, CargoLineItem, UserRole } from './types';
import { validateCustomsCompliance } from './backend/customs/customsService';
import { INITIAL_QUOTATIONS } from './data/freightData';
import { calculateTariffBreakdown } from './utils/calculator';

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
  const [workspaceView, setWorkspaceView] = useState<'dashboard' | 'calculation' | 'routes' | 'tracking' | 'quotations' | 'test-scenarios'>('calculation');
  const [adminSubTab, setAdminSubTab] = useState<AdminTab>('home');
  const [agentSubTab, setAgentSubTab] = useState<FreightAgentTab>('operations-overview');

  // Quotation History State
  const [quotations, setQuotations] = useState<SavedQuotation[]>(INITIAL_QUOTATIONS);
  const [selectedQuoteForPDF, setSelectedQuoteForPDF] = useState<SavedQuotation | null>(null);
  const [quoteFeedback, setQuoteFeedback] = useState<string | null>(null);
  const [isGeneratingQuote, setIsGeneratingQuote] = useState<boolean>(false);
  const [isEstimateCalculated, setIsEstimateCalculated] = useState<boolean>(false);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState<boolean>(false);

  // Feedback Popup State (middle screen pop up box)
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState<boolean>(false);
  const [feedbackQuoteId, setFeedbackQuoteId] = useState<string>('');

  // Form State initialized to empty/none state
  const [formData, setFormData] = useState<QuoteFormState>(createEmptyFormState());

  // Handle user login / sign in -> resets form state to none
  const handleLoginSuccess = (email: string, role: UserRole = 'user', fullName?: string, username?: string) => {
    setUserEmail(email);
    setUserRole(role);
    setUserName(fullName || username || email.split('@')[0] || 'User');
    setIsAuthenticated(true);
    setFormData(createEmptyFormState()); // Reset all inputs on login
    setQuoteFeedback(null);
    setIsEstimateCalculated(false);
    setIsAgentModalOpen(false);
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
      try {
        localStorage.setItem('freighthub_saved_quotations_v1', JSON.stringify(next));
      } catch (err) {
        console.error('Failed to persist quotation update:', err);
      }
      return next;
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

  // Generate Quotation Action (Submitted by Shipper -> Enters Broker Review Queue)
  const handleGenerateQuotation = () => {
    if (isGeneratingQuote) return;
    setIsGeneratingQuote(true);

    const newQuoteId = `QT-2026-00${935 + quotations.length - 3}`;
    const newQuote: SavedQuotation = {
      id: newQuoteId,
      shipperName: formData.fullName || userName || 'Aparajita',
      companyName: formData.companyName || 'Sharma Logistics',
      routeSummary: `${formData.originPortCode || 'BOM'} -> ${formData.destinationPortCode || 'AEJEA'}`,
      originCode: formData.originPortCode || 'BOM',
      destinationCode: formData.destinationPortCode || 'AEJEA',
      transportMode: formData.transportMode,
      oceanLoadType: formData.oceanLoadType,
      tariffAmount: liveBreakdown.grandTotal,
      currency: formData.currency,
      status: 'PENDING_REVIEW', // Automatically submitted to Broker for review & optimization
      createdAt: new Date().toISOString().split('T')[0],
      cargoSummary: liveBreakdown.cargoCountSummary,
      breakdown: liveBreakdown,
      formData: { ...formData },
    };

    // Link the customer-generated shipment to a Customs compliance case (M3 workflow):
    // the case lands in the Customs Officer queue with this Shipment ID & document checklist.
    const shipmentRefId = `SHP-${newQuoteId.replace(/\D/g, '') || Date.now().toString().slice(-6)}`;
    const customsCheck = validateCustomsCompliance({
      shipmentId: shipmentRefId,
      quoteId: newQuoteId,
      originCountry: (newQuote.originCode || 'IN').slice(0, 2).toUpperCase(),
      destCountry: (newQuote.destinationCode || 'AE').slice(0, 2).toUpperCase(),
      originPort: newQuote.originCode || 'INNSA',
      destPort: newQuote.destinationCode || 'AEJEA',
      hsCode: formData.cargoItems?.[0]?.hsCode || '',
      commodity: formData.cargoItems?.[0]?.commodityDescription || 'General Cargo',
      incoterm: formData.incoterm,
      declaredValueInr: formData.declaredValue,
      isHazmat: formData.hazardousMaterials,
    });

    const newQuoteWithCustoms: SavedQuotation = {
      ...newQuote,
      shipmentId: shipmentRefId,
      customsCaseId: customsCheck.id,
      customsStatus: customsCheck.status,
      customsFlags: [...(newQuote.customsFlags || []), `CUSTOMS_CASE:${customsCheck.id}`],
      auditLogs: [
        ...(newQuote.auditLogs || []),
        {
          id: `AUD-${Date.now()}`,
          quoteId: newQuoteId,
          action: 'CUSTOMS_CASE_CREATED',
          modifiedBy: 'System - Customs Agent',
          reason: `Compliance case ${customsCheck.id} auto-created for shipment ${shipmentRefId}`,
          newValue: customsCheck.status,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    handleUpdateQuotation(newQuoteWithCustoms);
    setSelectedQuoteForPDF(newQuoteWithCustoms);
    setFeedbackQuoteId(newQuoteId);
    setQuoteFeedback(
      `Quotation ${newQuoteId} submitted! Transferred directly to our freight brokerage team for rate review, carrier confirmation, and final dispatch.`
    );
    setIsGeneratingQuote(false);
    setIsEstimateCalculated(true);
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
                />
              </div>

              {/* Center Main Content Area */}
              <div className="lg:col-span-9">
                {/* CALCULATION VIEW */}
                {workspaceView === 'calculation' && (
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                    {/* Middle Calculation Form (Scrollable) */}
                    <div className="xl:col-span-8">
                      <CalculationForm
                        formData={formData}
                        onChangeForm={handleUpdateForm}
                        onAddCargoItem={handleAddCargoItem}
                        onRemoveCargoItem={handleRemoveCargoItem}
                        onUpdateCargoItem={handleUpdateCargoItem}
                        onGenerateQuotation={() => setIsAgentModalOpen(true)}
                        onResetForm={handleResetForm}
                        isGenerating={isGeneratingQuote}
                      />
                    </div>

                    {/* Right Live Estimation Box (Fixed in place when scrolling) */}
                    <div className="xl:col-span-4 xl:sticky xl:top-20 z-10">
                      <LiveEstimatePanel
                        breakdown={liveBreakdown}
                        onOpenAgentCalculation={() => setIsAgentModalOpen(true)}
                        isEstimateCalculated={isEstimateCalculated}
                        onViewGeneratedQuote={() => setIsAgentModalOpen(true)}
                      />
                    </div>
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
                  <TrackingView
                    userRole={userRole}
                    onViewQuotationPdf={(quoteId) => {
                      const matched = quotations.find((q) => q.id === quoteId);
                      if (matched) setSelectedQuoteForPDF(matched);
                    }}
                  />
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

                {/* CORE TEST SCENARIOS VIEW */}
                {workspaceView === 'test-scenarios' && (
                  <CoreTestScenariosView
                    quotations={quotations}
                    onUpdateQuotation={handleUpdateQuotation}
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