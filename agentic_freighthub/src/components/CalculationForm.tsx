import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Ship,
  Plane,
  Truck,
  Zap,
  Tag,
  Calendar,
  MapPin,
  Package,
  AlertCircle,
  ArrowRight,
  BookmarkPlus,
  FolderOpen,
  CheckCircle2,
  X,
  Clock,
  Lock,
  ShieldAlert,
  Upload,
  FileText,
  File,
  Image as ImageIcon
} from 'lucide-react';
import { QuoteFormState, TransportMode, OceanLoadType, Incoterm, PackageType, ContainerSpec, CurrencyCode, QuoteDraft } from '../types';
import { PORTS_AND_HUBS, PICKUP_POINTS, DELIVERY_POINTS, PROMO_COUPONS } from '../data/freightData';
import { useMasterData } from '../services/masterDataService';

interface CalculationFormProps {
  formData: QuoteFormState;
  onChangeForm: (updates: Partial<QuoteFormState>) => void;
  onAddCargoItem: () => void;
  onRemoveCargoItem: (id: string) => void;
  onUpdateCargoItem: (id: string, updates: any) => void;
  onGenerateQuotation?: () => void;
  onResetForm?: () => void;
  isGenerating?: boolean;
  onUploadDocument?: (file: File) => Promise<{ fileUrl: string; fileName: string } | null>;
  uploadedFiles?: Array<{ fileUrl: string; fileName: string; fileSize: number }>;
}

interface FormValidationErrors {
  originPortCode?: string;
  destinationPortCode?: string;
  cargoReadyDate?: string;
  transportMode?: string;
  incoterm?: string;
  cargoItems?: string;
  fullName?: string;
  companyName?: string;
  email?: string;
  country?: string;
}

const DRAFTS_STORAGE_KEY = 'freighthub_saved_drafts_v1';

export const CalculationForm: React.FC<CalculationFormProps> = ({
  formData,
  onChangeForm,
  onAddCargoItem,
  onRemoveCargoItem,
  onUpdateCargoItem,
  onGenerateQuotation,
  onResetForm,
  isGenerating = false,
  onUploadDocument,
  uploadedFiles = [],
}) => {
  const [drafts, setDrafts] = useState<QuoteDraft[]>([]);
  const [isDraftsModalOpen, setIsDraftsModalOpen] = useState<boolean>(false);
  const [isDraftSavedModalOpen, setIsDraftSavedModalOpen] = useState<boolean>(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [justSavedDraft, setJustSavedDraft] = useState<QuoteDraft | null>(null);
  const [draftToast, setDraftToast] = useState<string | null>(null);

  // Validation State Tracking
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);

  // Live Master Data
  const { ports: masterPorts, incoterms: masterIncoterms, packagingTypes: masterPackagingTypes } = useMasterData();

  // Combine static and live master ports seamlessly
  const combinedPorts = React.useMemo(() => {
    const list = [...PORTS_AND_HUBS];
    masterPorts.forEach((mp) => {
      if (mp.isActive !== false) {
        const code = mp.unlocode || mp._id;
        if (code && !list.some((p) => p.code === code || p.name.includes(mp.portName))) {
          list.push({
            code,
            name: `${code} — ${mp.portName}, ${mp.city || mp.countryCode || ''}`,
            city: mp.city || mp.portName,
            country: mp.countryCode || 'Global',
            type: 'sea',
            locationLabel: `${mp.portName} Hub`,
          });
        }
      }
    });
    return list;
  }, [masterPorts]);

  // Load saved drafts on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(DRAFTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setDrafts(parsed);
        }
      }
    } catch (err) {
      console.error('Failed to load drafts:', err);
    }
  }, []);

  const markTouched = (fieldName: string) => {
    setTouchedFields((prev) => ({ ...prev, [fieldName]: true }));
  };

  // Comprehensive Required Field Validation Engine
  const getValidationErrors = (): FormValidationErrors => {
    const errors: FormValidationErrors = {};

    if (!formData.originPortCode) {
      errors.originPortCode = 'Origin Port / Hub is required.';
    }

    if (!formData.destinationPortCode) {
      errors.destinationPortCode = 'Destination Port / Hub is required.';
    } else if (formData.originPortCode && formData.originPortCode === formData.destinationPortCode) {
      errors.destinationPortCode = 'Origin and Destination ports cannot be identical.';
    }

    if (!formData.cargoReadyDate) {
      errors.cargoReadyDate = 'Cargo Ready Date is required.';
    }

    if (!formData.transportMode) {
      errors.transportMode = 'Transport mode selection is required.';
    }

    if (!formData.incoterm) {
      errors.incoterm = 'Incoterm commercial trade term is required.';
    }

    const items = formData.cargoItems || [];
    if (items.length === 0) {
      errors.cargoItems = 'At least 1 cargo item is required.';
    } else {
      const invalidItem = items.find(
        (item) => !item || !item.quantity || Number(item.quantity) <= 0 || !item.grossWeightKg || Number(item.grossWeightKg) <= 0
      );
      if (invalidItem) {
        errors.cargoItems = 'All cargo items must have quantity > 0 and gross weight > 0 kg.';
      }
    }

    if (!formData.fullName || !formData.fullName.trim()) {
      errors.fullName = 'Shipper Full Name is required.';
    }

    if (!formData.companyName || !formData.companyName.trim()) {
      errors.companyName = 'Company Name is required.';
    }

    if (!formData.email || !formData.email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address format.';
    }

    if (!formData.country) {
      errors.country = 'Country is required.';
    }

    return errors;
  };

  const validationErrors = getValidationErrors();
  const errorKeys = Object.keys(validationErrors) as (keyof FormValidationErrors)[];
  const isFormValid = errorKeys.length === 0;

  const isFieldInvalid = (fieldName: keyof FormValidationErrors): boolean => {
    return Boolean((touchedFields[fieldName] || formSubmitted) && validationErrors[fieldName]);
  };

  const validateAndSubmitQuotation = () => {
    setFormSubmitted(true);
    const errors = getValidationErrors();
    if (Object.keys(errors).length > 0) {
      return false;
    }
    if (onGenerateQuotation) {
      onGenerateQuotation();
    }
    return true;
  };

  // Save current form inputs as draft
  const handleSaveDraft = () => {
    const origin = formData.originPortCode || 'BOM';
    const dest = formData.destinationPortCode || 'AEJEA';
    const originHub = PORTS_AND_HUBS.find((p) => p.code === origin);
    const destHub = PORTS_AND_HUBS.find((p) => p.code === dest);

    const draftTitle = `${originHub?.city || origin} → ${destHub?.city || dest} (${formData.transportMode.toUpperCase()})`;
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString()} at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const totalWeight = (formData.cargoItems || []).reduce((sum, item) => sum + (item.grossWeightKg || 0) * (item.quantity || 1), 0);

    const newDraft: QuoteDraft = {
      id: `draft-${Date.now()}`,
      title: draftTitle,
      savedAt: formattedDate,
      formData: { ...formData },
      routeSummary: `${origin} -> ${dest}`,
      transportMode: formData.transportMode,
      totalWeightKg: totalWeight,
      estimatedTariffInr: 0,
    };

    const updatedDrafts = [newDraft, ...(drafts || []).filter((d) => d && d.id !== newDraft.id)];
    setDrafts(updatedDrafts);
    setJustSavedDraft(newDraft);
    setIsDraftSavedModalOpen(true);

    try {
      localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(updatedDrafts));
    } catch (err) {
      console.error('Failed to persist draft:', err);
    }

    setDraftToast(`Quotation inputs saved as draft "${draftTitle}"!`);
    setTimeout(() => setDraftToast(null), 4500);
  };

  const handleLoadDraft = (draft: QuoteDraft) => {
    onChangeForm({ ...draft.formData });
    setIsDraftsModalOpen(false);
    setDraftToast(`Draft "${draft.title}" loaded successfully into calculator.`);
    setTimeout(() => setDraftToast(null), 4000);
  };

  const handleDeleteDraft = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = (drafts || []).filter((d) => d && d.id !== id);
    setDrafts(updated);
    try {
      localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to update drafts:', err);
    }
  };

  // Helper to get today's date in YYYY-MM-DD local format
  const getTodayDateString = (): string => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayDateStr = getTodayDateString();

  const getMinDeliveryDate = (readyDateStr: string): string => {
    const baseDateStr = readyDateStr && readyDateStr >= todayDateStr ? readyDateStr : todayDateStr;
    const date = new Date(baseDateStr);
    if (isNaN(date.getTime())) return todayDateStr;
    date.setDate(date.getDate() + 2);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const minDeliveryDate = getMinDeliveryDate(formData.cargoReadyDate);

  const handleCargoReadyDateChange = (newDateStr: string) => {
    let sanitizedReadyDate = newDateStr;
    if (sanitizedReadyDate && sanitizedReadyDate < todayDateStr) {
      sanitizedReadyDate = todayDateStr;
    }

    const newMinDelivery = getMinDeliveryDate(sanitizedReadyDate);
    let updatedDelivery = formData.requiredDeliveryDate;

    if (updatedDelivery && newMinDelivery && updatedDelivery < newMinDelivery) {
      updatedDelivery = newMinDelivery;
    }

    onChangeForm({
      cargoReadyDate: sanitizedReadyDate,
      requiredDeliveryDate: updatedDelivery,
    });
    markTouched('cargoReadyDate');
  };

  const handleRequiredDeliveryDateChange = (selectedDateStr: string) => {
    const effectiveMin = minDeliveryDate || todayDateStr;
    if (effectiveMin && selectedDateStr && selectedDateStr < effectiveMin) {
      onChangeForm({ requiredDeliveryDate: effectiveMin });
    } else {
      onChangeForm({ requiredDeliveryDate: selectedDateStr });
    }
  };

  return (
    <div className="space-y-6 relative font-sans">
      {/* Top Required Field Error Alert Banner */}
      {formSubmitted && !isFormValid && (
        <div className="p-4 bg-red-500/10 border-2 border-red-500/60 rounded-3xl space-y-2 text-red-300 text-xs shadow-xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 font-black text-red-400">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span className="text-sm">Freight Quotation Blocked — Mandatory Fields Required</span>
            </div>
            <span className="px-2.5 py-1 bg-red-500/20 text-red-300 rounded-full text-[10px] font-mono font-bold border border-red-500/40">
              {errorKeys.length} Field(s) Invalid
            </span>
          </div>
          <p className="text-[11px] text-slate-300 pl-7">
            You cannot calculate or generate an official freight quote without completing all required parameters highlighted below:
          </p>
          <ul className="pl-7 list-disc space-y-1 text-[11px] font-mono text-red-200">
            {Object.entries(validationErrors).map(([key, msg]) => (
              <li key={key}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Draft Notification Toast */}
      {draftToast && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between border border-emerald-500 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
            <span className="text-xs font-bold">{draftToast}</span>
          </div>
          <button
            onClick={() => setDraftToast(null)}
            className="p-1 text-emerald-200 hover:text-white rounded-lg hover:bg-emerald-700/50 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* STEP 1: ROUTE DETAILS */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md shadow-blue-600/30">
              1
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Route Details</h3>
              <p className="text-xs text-slate-500 font-medium">Origin, destination, and dispatch dates</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsDraftsModalOpen(true)}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-bold transition-all border border-amber-200 flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="View and restore saved quotation drafts"
            >
              <FolderOpen className="w-3.5 h-3.5 text-amber-600" />
              <span>Saved Drafts ({drafts.length})</span>
            </button>

            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-xl text-xs font-bold transition-all border border-blue-200 flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Save current form inputs as draft"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-blue-600" />
              <span>Save as Draft</span>
            </button>

            {onResetForm && (
              <button
                type="button"
                onClick={onResetForm}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-xl text-xs font-bold transition-all border border-slate-200 flex items-center gap-1.5 cursor-pointer"
                title="Reset all form inputs"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Origin Port */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>ORIGIN PORT / HUB <span className="text-red-500 font-bold">*</span></span>
              </span>
              {!formData.originPortCode && <span className="text-[9px] text-amber-600 font-mono font-bold">Required</span>}
            </label>
            <select
              value={formData.originPortCode}
              onBlur={() => markTouched('originPortCode')}
              onChange={(e) => {
                onChangeForm({ originPortCode: e.target.value });
                markTouched('originPortCode');
              }}
              className={`w-full border rounded-2xl px-3.5 py-3 text-xs font-semibold focus:outline-none transition-all ${
                isFieldInvalid('originPortCode')
                  ? 'bg-red-50 border-red-500 text-red-900 focus:border-red-600'
                  : formData.originPortCode
                  ? 'bg-emerald-50/50 border-emerald-500/60 text-slate-900'
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-blue-600'
              }`}
            >
              <option value="">-- Select Origin Port / Hub ({combinedPorts.length} available) --</option>
              {combinedPorts.map((port) => (
                <option key={port.code} value={port.code}>
                  {port.name}
                </option>
              ))}
            </select>
            {isFieldInvalid('originPortCode') && (
              <p className="text-[10px] font-bold text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-red-500 shrink-0" /> {validationErrors.originPortCode}
              </p>
            )}
          </div>

          {/* Destination Port */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>DESTINATION PORT / HUB <span className="text-red-500 font-bold">*</span></span>
              </span>
              {!formData.destinationPortCode && <span className="text-[9px] text-amber-600 font-mono font-bold">Required</span>}
            </label>
            <select
              value={formData.destinationPortCode}
              onBlur={() => markTouched('destinationPortCode')}
              onChange={(e) => {
                onChangeForm({ destinationPortCode: e.target.value });
                markTouched('destinationPortCode');
              }}
              className={`w-full border rounded-2xl px-3.5 py-3 text-xs font-semibold focus:outline-none transition-all ${
                isFieldInvalid('destinationPortCode')
                  ? 'bg-red-50 border-red-500 text-red-900 focus:border-red-600'
                  : formData.destinationPortCode && formData.destinationPortCode !== formData.originPortCode
                  ? 'bg-emerald-50/50 border-emerald-500/60 text-slate-900'
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-blue-600'
              }`}
            >
              <option value="">-- Select Destination Port / Hub ({combinedPorts.length} available) --</option>
              {combinedPorts.map((port) => (
                <option key={port.code} value={port.code}>
                  {port.name}
                </option>
              ))}
            </select>
            {isFieldInvalid('destinationPortCode') && (
              <p className="text-[10px] font-bold text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-red-500 shrink-0" /> {validationErrors.destinationPortCode}
              </p>
            )}
          </div>

          {/* Pickup Hub */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>PICKUP HUB / ADDRESS (DOOR PICKUP)</span>
            </label>
            <select
              value={formData.pickupHubId}
              onChange={(e) => onChangeForm({ pickupHubId: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-3 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
            >
              <option value="">-- Select Pickup Point (Optional) --</option>
              {PICKUP_POINTS.map((pickup) => (
                <option key={pickup.id} value={pickup.id}>
                  {pickup.name}
                </option>
              ))}
            </select>
          </div>

          {/* Delivery Hub */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>DELIVERY HUB / ADDRESS (DOOR DELIVERY)</span>
            </label>
            <select
              value={formData.deliveryHubId}
              onChange={(e) => onChangeForm({ deliveryHubId: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-3 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
            >
              <option value="">-- Select Delivery Point (Optional) --</option>
              {DELIVERY_POINTS.map((delivery) => (
                <option key={delivery.id} value={delivery.id}>
                  {delivery.name}
                </option>
              ))}
            </select>
          </div>

          {/* Cargo Ready Date */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>CARGO READY DATE <span className="text-red-500 font-bold">*</span></span>
              </span>
              <span className="text-[10px] font-bold text-slate-400 normal-case">Days before today disabled</span>
            </label>
            <input
              type="date"
              min={todayDateStr}
              value={formData.cargoReadyDate}
              onBlur={() => markTouched('cargoReadyDate')}
              onChange={(e) => handleCargoReadyDateChange(e.target.value)}
              className={`w-full border rounded-2xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none transition-all ${
                isFieldInvalid('cargoReadyDate')
                  ? 'bg-red-50 border-red-500 text-red-900 focus:border-red-600'
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-blue-600'
              }`}
            />
            {isFieldInvalid('cargoReadyDate') && (
              <p className="text-[10px] font-bold text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-red-500 shrink-0" /> {validationErrors.cargoReadyDate}
              </p>
            )}
            <p className="text-[10px] font-semibold text-slate-400 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-500 shrink-0" />
              <span>Earliest selectable: Today ({todayDateStr})</span>
            </p>
          </div>

          {/* Required Delivery Date */}
          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>REQUIRED DELIVERY DATE (MIN 2-DAY GAP)</span>
            </label>
            <input
              type="date"
              min={minDeliveryDate || todayDateStr}
              value={formData.requiredDeliveryDate}
              onChange={(e) => handleRequiredDeliveryDateChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-none"
            />
            {minDeliveryDate && (
              <p className="text-[10px] font-semibold text-amber-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Must be at least 2 days after cargo ready date (Earliest: {minDeliveryDate})</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* STEP 2: SERVICE & COMMERCIAL TERMS */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md shadow-blue-600/30">
            2
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Service & Commercial Terms</h3>
            <p className="text-xs text-slate-500 font-medium">Transport mode and commercial terms</p>
          </div>
        </div>

        {/* Transport Mode Buttons */}
        <div>
          <label className="block text-[11px] font-extrabold text-slate-700 mb-2 uppercase tracking-wider">
            TRANSPORT MODE <span className="text-red-500 font-bold">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: 'ocean', label: 'Ocean Freight', icon: Ship },
              { id: 'air', label: 'Air Freight', icon: Plane },
              { id: 'ground', label: 'Ground & Rail', icon: Truck },
              { id: 'express', label: 'Express Air', icon: Zap },
            ].map((mode) => {
              const Icon = mode.icon;
              const isActive = formData.transportMode === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => {
                    onChangeForm({ transportMode: mode.id as TransportMode });
                    markTouched('transportMode');
                  }}
                  className={`py-3 px-3 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all border ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/30'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{mode.label}</span>
                </button>
              );
            })}
          </div>
          {isFieldInvalid('transportMode') && (
            <p className="text-[10px] font-bold text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-red-500 shrink-0" /> {validationErrors.transportMode}
            </p>
          )}
        </div>

        {/* Ocean Parameters Block */}
        {formData.transportMode === 'ocean' && (
          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 space-y-4">
            <div className="text-[10px] font-black text-blue-900 uppercase tracking-widest">
              OCEAN PARAMETERS
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1.5 uppercase tracking-wider">
                  LOAD TYPE <span className="text-red-500 font-bold">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onChangeForm({ oceanLoadType: 'FCL' })}
                    className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all border ${
                      formData.oceanLoadType === 'FCL'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    FCL (Full Container)
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeForm({ oceanLoadType: 'LCL' })}
                    className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all border ${
                      formData.oceanLoadType === 'LCL'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    LCL (Shared)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1.5 uppercase tracking-wider">
                  INCOTERM <span className="text-red-500 font-bold">*</span>
                </label>
                <select
                  value={formData.incoterm}
                  onBlur={() => markTouched('incoterm')}
                  onChange={(e) => {
                    onChangeForm({ incoterm: e.target.value as Incoterm });
                    markTouched('incoterm');
                  }}
                  className={`w-full border rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none transition-all ${
                    isFieldInvalid('incoterm')
                      ? 'bg-red-50 border-red-500 text-red-900 focus:border-red-600'
                      : 'bg-white border-slate-200 text-slate-800 focus:border-blue-600'
                  }`}
                >
                  <option value="FOB">FOB — Free On Board</option>
                  <option value="CIF">CIF — Cost Insurance Freight</option>
                  <option value="EXW">EXW — Ex Works</option>
                  <option value="DDP">DDP — Delivered Duty Paid</option>
                  <option value="CFR">CFR — Cost and Freight</option>
                  <option value="FCA">FCA — Free Carrier</option>
                  <option value="DAP">DAP — Delivered At Place</option>
                </select>
                {isFieldInvalid('incoterm') && (
                  <p className="text-[10px] font-bold text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-red-500 shrink-0" /> {validationErrors.incoterm}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* STEP 3: CARGO & CARGO LINE ITEMS */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md shadow-blue-600/30">
              3
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Cargo & Cargo Line Items</h3>
              <p className="text-xs text-slate-500 font-medium">Package dimensions, weights, and descriptions</p>
            </div>
          </div>
          {isFieldInvalid('cargoItems') && (
            <span className="text-[11px] font-bold text-red-600 bg-red-100 px-3 py-1 rounded-full flex items-center gap-1 border border-red-200">
              <AlertCircle className="w-3.5 h-3.5 text-red-500" /> Invalid Cargo Line Items
            </span>
          )}
        </div>

        {/* Line Items Array */}
        <div className="space-y-4">
          {(formData?.cargoItems || []).map((item, index) => (
            <div
              key={item.id}
              className={`border rounded-2xl p-5 space-y-4 relative transition-all ${
                (!item.quantity || item.quantity <= 0 || !item.grossWeightKg || item.grossWeightKg <= 0) && (formSubmitted || touchedFields[`item_${item.id}`])
                  ? 'bg-red-50/50 border-red-300'
                  : 'bg-slate-50/80 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  ITEM #{index + 1 < 10 ? `0${index + 1}` : index + 1}
                </span>

                {formData.cargoItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveCargoItem(item.id)}
                    className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider">
                    PACKAGE TYPE <span className="text-red-500 font-bold">*</span>
                  </label>
                  <select
                    value={item.packageType}
                    onChange={(e) => onUpdateCargoItem(item.id, { packageType: e.target.value as PackageType })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:border-blue-600 focus:outline-none"
                  >
                    <option value="Pallet">Pallet</option>
                    <option value="Wooden Crate">Wooden Crate</option>
                    <option value="Carton">Carton</option>
                    <option value="20GP Container">20GP Container</option>
                    <option value="40HC Container">40HC Container</option>
                    <option value="Drums">Drums</option>
                    <option value="Bales">Bales</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider">
                    CONTAINER SPEC <span className="text-red-500 font-bold">*</span>
                  </label>
                  <select
                    value={item.containerSpec}
                    onChange={(e) => onUpdateCargoItem(item.id, { containerSpec: e.target.value as ContainerSpec })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:border-blue-600 focus:outline-none"
                  >
                    <option value="20GP">20GP — General Purpose</option>
                    <option value="40HC">40HC — High Cube</option>
                    <option value="40GP">40GP — General Purpose</option>
                    <option value="LCL_SLOT">LCL Shared Slot</option>
                    <option value="EURO_PALLET">Euro Pallet (120x80cm)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider flex items-center justify-between">
                    <span>QUANTITY / COUNT <span className="text-red-500 font-bold">*</span></span>
                    {(!item.quantity || item.quantity <= 0) && <span className="text-[9px] text-red-600 font-mono">Min 1</span>}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity || ''}
                    onBlur={() => markTouched(`item_${item.id}`)}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      onUpdateCargoItem(item.id, { quantity: isNaN(val) ? 0 : val });
                      markTouched(`item_${item.id}`);
                    }}
                    className={`w-full border rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none transition-all ${
                      (!item.quantity || item.quantity <= 0) && (formSubmitted || touchedFields[`item_${item.id}`])
                        ? 'bg-red-50 border-red-500 text-red-900 focus:border-red-600'
                        : 'bg-white border-slate-200 text-slate-800 focus:border-blue-600'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider flex items-center justify-between">
                    <span>GROSS WEIGHT (KG) <span className="text-red-500 font-bold">*</span></span>
                    {(!item.grossWeightKg || item.grossWeightKg <= 0) && <span className="text-[9px] text-red-600 font-mono">Min 1 KG</span>}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={item.grossWeightKg || ''}
                    onBlur={() => markTouched(`item_${item.id}`)}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      onUpdateCargoItem(item.id, { grossWeightKg: isNaN(val) ? 0 : val });
                      markTouched(`item_${item.id}`);
                    }}
                    className={`w-full border rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none transition-all ${
                      (!item.grossWeightKg || item.grossWeightKg <= 0) && (formSubmitted || touchedFields[`item_${item.id}`])
                        ? 'bg-red-50 border-red-500 text-red-900 focus:border-red-600'
                        : 'bg-white border-slate-200 text-slate-800 focus:border-blue-600'
                    }`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider">
                    COMMODITY DESCRIPTION
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cotton Textiles, Electronic Machinery Parts..."
                    value={item.commodityDescription}
                    onChange={(e) => onUpdateCargoItem(item.id, { commodityDescription: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={onAddCargoItem}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 transition-colors border border-slate-200/80 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-blue-600" />
            <span>ADD ANOTHER CARGO ITEM</span>
          </button>
        </div>
      </div>

      {/* STEP 4: SHIPPER & CONTACT DETAILS */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md shadow-blue-600/30">
            4
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Contact Details</h3>
            <p className="text-xs text-slate-500 font-medium">Who receives the quotation</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider flex items-center justify-between">
              <span>FULL NAME <span className="text-red-500 font-bold">*</span></span>
              {!formData.fullName && <span className="text-[9px] text-amber-600 font-mono font-bold">Required</span>}
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onBlur={() => markTouched('fullName')}
              onChange={(e) => {
                onChangeForm({ fullName: e.target.value });
                markTouched('fullName');
              }}
              placeholder="e.g. Aparajita Sharma"
              className={`w-full border rounded-2xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none transition-all ${
                isFieldInvalid('fullName')
                  ? 'bg-red-50 border-red-500 text-red-900 focus:border-red-600'
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-blue-600'
              }`}
            />
            {isFieldInvalid('fullName') && (
              <p className="text-[10px] font-bold text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-red-500 shrink-0" /> {validationErrors.fullName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider flex items-center justify-between">
              <span>COMPANY <span className="text-red-500 font-bold">*</span></span>
              {!formData.companyName && <span className="text-[9px] text-amber-600 font-mono font-bold">Required</span>}
            </label>
            <input
              type="text"
              required
              value={formData.companyName}
              onBlur={() => markTouched('companyName')}
              onChange={(e) => {
                onChangeForm({ companyName: e.target.value });
                markTouched('companyName');
              }}
              placeholder="e.g. Sharma Logistics Pvt Ltd"
              className={`w-full border rounded-2xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none transition-all ${
                isFieldInvalid('companyName')
                  ? 'bg-red-50 border-red-500 text-red-900 focus:border-red-600'
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-blue-600'
              }`}
            />
            {isFieldInvalid('companyName') && (
              <p className="text-[10px] font-bold text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-red-500 shrink-0" /> {validationErrors.companyName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider flex items-center justify-between">
              <span>EMAIL <span className="text-red-500 font-bold">*</span></span>
              {!formData.email && <span className="text-[9px] text-amber-600 font-mono font-bold">Required</span>}
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onBlur={() => markTouched('email')}
              onChange={(e) => {
                onChangeForm({ email: e.target.value });
                markTouched('email');
              }}
              placeholder="e.g. aparajita@sharmalogistics.com"
              className={`w-full border rounded-2xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none transition-all ${
                isFieldInvalid('email')
                  ? 'bg-red-50 border-red-500 text-red-900 focus:border-red-600'
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-blue-600'
              }`}
            />
            {isFieldInvalid('email') && (
              <p className="text-[10px] font-bold text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-red-500 shrink-0" /> {validationErrors.email}
              </p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-slate-700 mb-1 uppercase tracking-wider flex items-center justify-between">
              <span>COUNTRY <span className="text-red-500 font-bold">*</span></span>
              {!formData.country && <span className="text-[9px] text-amber-600 font-mono font-bold">Required</span>}
            </label>
            <select
              value={formData.country}
              onBlur={() => markTouched('country')}
              onChange={(e) => {
                onChangeForm({ country: e.target.value });
                markTouched('country');
              }}
              className={`w-full border rounded-2xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none transition-all ${
                isFieldInvalid('country')
                  ? 'bg-red-50 border-red-500 text-red-900 focus:border-red-600'
                  : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-blue-600'
              }`}
            >
              <option value="">-- Select Country --</option>
              <option value="India">India</option>
              <option value="United Arab Emirates">United Arab Emirates</option>
              <option value="Netherlands">Netherlands</option>
              <option value="United States">United States</option>
              <option value="Singapore">Singapore</option>
              <option value="United Kingdom">United Kingdom</option>
            </select>
            {isFieldInvalid('country') && (
              <p className="text-[10px] font-bold text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-red-500 shrink-0" /> {validationErrors.country}
              </p>
            )}
          </div>
        </div>

        {/* STEP 5: DOCUMENT UPLOAD */}
        <div className="mt-6 pt-6 border-t border-slate-200/80 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-xl bg-violet-100 flex items-center justify-center text-violet-700 font-black text-xs">5</div>
            <h3 className="font-extrabold text-slate-900 text-base">Upload Proof Documents</h3>
            <span className="text-[10px] text-slate-400 font-bold ml-1">(Optional)</span>
          </div>
          <p className="text-xs text-slate-500">Upload invoice, packing list, or any proof documents. These will be visible to the freight agent and customs officer.</p>
          
          <div className="flex flex-wrap gap-3">
            <label className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
              isUploadingDoc ? 'border-blue-300 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
            }`}>
              <Upload className={`w-4 h-4 ${isUploadingDoc ? 'text-blue-500 animate-pulse' : 'text-slate-400'}`} />
              <span className="text-xs font-bold text-slate-600">{isUploadingDoc ? 'Uploading...' : 'Upload Document'}</span>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                disabled={isUploadingDoc}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file && onUploadDocument) {
                    setIsUploadingDoc(true);
                    await onUploadDocument(file);
                    setIsUploadingDoc(false);
                  }
                  e.target.value = '';
                }}
              />
            </label>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              {uploadedFiles.map((f, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  {f.fileName.match(/\.(jpg|jpeg|png)$/i) ? (
                    <div className="p-2 bg-blue-100 rounded-lg"><ImageIcon className="w-4 h-4 text-blue-600" /></div>
                  ) : (
                    <div className="p-2 bg-red-100 rounded-lg"><File className="w-4 h-4 text-red-600" /></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{f.fileName}</p>
                    <p className="text-[10px] text-slate-400">{(f.fileSize / 1024).toFixed(1)} KB</p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Primary Action Button & Save as Draft */}
        <div className="pt-6 mt-6 border-t border-slate-200/80 flex flex-col sm:flex-row justify-center items-center gap-3">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="w-full sm:w-auto px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all border border-slate-300 shadow-sm hover:shadow active:scale-95 cursor-pointer"
          >
            <BookmarkPlus className="w-4 h-4 text-blue-600" />
            <span>SAVE INPUTS AS DRAFT</span>
          </button>

          {onGenerateQuotation && (
            <button
              type="button"
              onClick={validateAndSubmitQuotation}
              disabled={isGenerating}
              className={`w-full sm:w-auto min-w-[300px] relative group overflow-hidden font-black py-4 px-8 rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all duration-200 shadow-xl cursor-pointer active:scale-95 ${
                isFormValid
                  ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-500 text-white shadow-blue-600/30 ring-2 ring-blue-500/40'
                  : 'bg-gradient-to-r from-red-950/40 via-red-900/40 to-red-950/40 text-red-300 border border-red-500/40 hover:bg-red-900/50'
              }`}
            >
              <div className="absolute inset-0 w-full h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
              {isGenerating ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                  <span className="animate-pulse">CALCULATING OFFICIAL QUOTE...</span>
                </>
              ) : isFormValid ? (
                <span className="flex items-center gap-2 relative z-10">
                  <Zap className="w-4 h-4 text-amber-300 fill-amber-300 shrink-0 group-hover:scale-110 transition-transform" />
                  <span>GENERATE OFFICIAL FREIGHT QUOTATION</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              ) : (
                <span className="flex items-center gap-2 relative z-10 text-red-300">
                  <Lock className="w-4 h-4 text-red-400 shrink-0" />
                  <span>COMPLETE REQUIRED FIELDS TO CALCULATE</span>
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* SAVED DRAFTS MODAL */}
      {isDraftsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 px-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500 text-slate-950 rounded-xl">
                  <FolderOpen className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Saved Quotation Drafts</h3>
                  <p className="text-xs text-slate-400">Restore or manage saved cargo & route inputs</p>
                </div>
              </div>
              <button
                onClick={() => setIsDraftsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {drafts.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <BookmarkPlus className="w-6 h-6" />
                  </div>
                  <div className="font-bold text-slate-800 text-sm">No Saved Drafts Yet</div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Fill out your route, mode, and cargo items, then click "Save Inputs as Draft" to store your template for quick future calculation.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(drafts || []).map((draft) => (
                    <div
                      key={draft.id}
                      className="p-4 rounded-2xl border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 text-sm">{draft.title}</span>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            {draft.transportMode}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {draft.savedAt}
                          </span>
                          <span>•</span>
                          <span>{draft.formData.cargoItems.length} cargo item(s)</span>
                          {draft.formData.incoterm && (
                            <>
                              <span>•</span>
                              <span>Incoterm: {draft.formData.incoterm}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                          type="button"
                          onClick={(e) => handleDeleteDraft(draft.id, e)}
                          className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete draft"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLoadDraft(draft)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>Load Draft</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                {drafts.length} template draft(s) stored locally
              </span>
              <button
                type="button"
                onClick={() => setIsDraftsModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRAFT IS SAVED SUCCESSFULLY POP-UP MODAL */}
      {isDraftSavedModalOpen && justSavedDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            <div className="p-5 sm:p-6 bg-gradient-to-br from-emerald-600 to-teal-700 text-white text-center relative">
              <button
                type="button"
                onClick={() => setIsDraftSavedModalOpen(false)}
                className="absolute top-3.5 right-3.5 p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-black/10">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>

              <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 text-white px-2.5 py-0.5 rounded-full inline-block mb-1.5">
                SAVED TO LOCAL WORKSPACE
              </span>
              <h3 className="text-xl font-black text-white">Draft is Saved Successfully!</h3>
              <p className="text-xs text-emerald-100 font-medium mt-1">
                Your quotation inputs and cargo parameters have been stored safely.
              </p>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 sm:p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Route Summary</span>
                  <span className="font-extrabold text-slate-900">{justSavedDraft.title}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Mode & Items</span>
                  <span className="font-bold text-slate-800">
                    {justSavedDraft.transportMode.toUpperCase()} • {justSavedDraft.formData.cargoItems.length} Cargo Item(s)
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Saved Timestamp</span>
                  <span className="text-slate-700 font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {justSavedDraft.savedAt}
                  </span>
                </div>

                {justSavedDraft.formData.incoterm && (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <span className="text-slate-500 font-medium">Commercial Term</span>
                    <span className="font-extrabold text-blue-600">{justSavedDraft.formData.incoterm}</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-slate-500 text-center leading-relaxed">
                You can reload these inputs anytime using the <span className="font-bold text-slate-700">"Saved Drafts"</span> button in the calculator or continue editing.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsDraftSavedModalOpen(false)}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-600/25 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>CONTINUE EDITING</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsDraftSavedModalOpen(false);
                    setIsDraftsModalOpen(true);
                  }}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-200 cursor-pointer"
                >
                  <FolderOpen className="w-4 h-4 text-slate-600" />
                  <span>VIEW ALL DRAFTS ({drafts.length})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
