export type TransportMode = 'ocean' | 'air' | 'ground' | 'express';

export type OceanLoadType = 'FCL' | 'LCL';
export type Incoterm = 'FOB' | 'CIF' | 'EXW' | 'DDP' | 'CFR' | 'FCA' | 'DAP';
export type PackageType = 'Pallet' | 'Wooden Crate' | 'Carton' | '20GP Container' | '40HC Container' | 'Drums' | 'Bales';
export type ContainerSpec = '20GP' | '40HC' | '40GP' | 'LCL_SLOT' | 'EURO_PALLET';
export type CurrencyCode = 'INR' | 'USD' | 'AED' | 'EUR' | 'GBP';

export type ShipmentStatus = 'DRAFT' | 'SUBMITTED' | 'PROCESSING' | 'ANALYZED' | 'QUOTED' | 'CLOSED' | 'CANCELLED';
export type QuoteStatus = 'DRAFT' | 'GENERATED' | 'PENDING_REVIEW' | 'APPROVED' | 'SENT' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'BOOKED' | 'PENDING_BROKER_REVIEW' | 'BROKER_FINALIZED' | 'ISSUED' | 'REJECTED' | 'SUPERSEDED' | 'SELECTED';

export interface AuditLogRecord {
  id: string;
  quoteId: string;
  action: string;
  modifiedBy: string;
  reason?: string;
  previousValue?: string | number;
  newValue?: string | number;
  timestamp: string;
}

export interface PortHub {
  code: string;
  name: string;
  city: string;
  country: string;
  type: 'sea' | 'air' | 'ground';
  locationLabel: string;
}

export interface PickupDeliveryPoint {
  id: string;
  name: string;
  category: 'pickup' | 'delivery';
  address: string;
}

export interface CargoLineItem {
  id: string;
  packageType: PackageType;
  containerSpec: ContainerSpec;
  quantity: number;
  grossWeightKg: number;
  commodityDescription: string;
  hsCode: string;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
}

export interface QuoteFormState {
  originPortCode: string;
  destinationPortCode: string;
  pickupHubId: string;
  deliveryHubId: string;
  cargoReadyDate: string;
  requiredDeliveryDate: string;
  transportMode: TransportMode;
  oceanLoadType: OceanLoadType;
  incoterm: Incoterm;
  cargoItems: CargoLineItem[];
  declaredValue: number;
  currency: CurrencyCode;
  specialInstructions: string;
  fragileGoods: boolean;
  hazardousMaterials: boolean;
  temperatureControlled: boolean;
  addCargoInsurance: boolean;
  promoCodeApplied: string | null;
  fullName: string;
  companyName: string;
  email: string;
  country: string;
  // Custom pricing parameters (editable & reactive)
  baseRatePerUnit?: number;
  bafPercentage?: number;
  originThcPerUnit?: number;
  documentationFeeAmount?: number;
  marginPercentage?: number;
}

export interface TariffBreakdown {
  baseTariff: number;
  baseRatePerUnit?: number;
  containerCount?: number;
  bafPercentage?: number;
  bafFuelSurcharge: number;
  originThcPerUnit?: number;
  terminalHandlingCharge: number;
  documentationFee: number;
  specialHandlingSurcharge: number;
  insuranceFee: number;
  discountAmount: number;
  totalCost?: number;
  marginPercentage?: number;
  marginAmount?: number;
  finalSellPrice?: number;
  subtotal: number;
  estimatedTax: number;
  grandTotal: number;
  currency: CurrencyCode;
  chargeBasis: string;
  cargoCountSummary: string;
  totalWeightKg: number;
  estimatedDistanceNmOrKm: string;
  estimatedTransitDays: string;
  estimatedArrivalDate: string;
  originPortName?: string;
  destPortName?: string;
  carrierName?: string;
  transitDaysRange?: string;
  equipmentSummary?: string;
  ruleBasedPriceInr?: number;
  aiPredictedPriceInr?: number;
  recommendedPriceInr?: number;
  weatherRiskScore?: number;
  customsRiskScore?: number;
  routeRiskScore?: number;
  compositeRiskScore?: number;
  overallRiskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface SavedQuotation {
  id: string;
  shipmentId?: string;
  shipperName: string;
  shipperEmail?: string;
  companyName: string;
  routeSummary: string;
  originCode: string;
  destinationCode: string;
  transportMode: TransportMode;
  oceanLoadType?: OceanLoadType;
  tariffAmount: number;
  currency: CurrencyCode;
  shipmentStatus?: ShipmentStatus;
  status: QuoteStatus;
  createdAt: string;
  validUntil?: string;
  cargoSummary: string;
  breakdown: TariffBreakdown;
  formData: QuoteFormState;
  brokerReviewNotes?: string;
  brokerAdjustedAt?: string;
  assignedCarrier?: string;
  brokerMarginPct?: number;
  brokerProfitInr?: number;
  isBrokerEdited?: boolean;
  brokerReviewed?: boolean;
  priceModificationReason?: string;
  customsFlags?: string[];
  customsCaseId?: string;
  customsStatus?: string;
  weatherAlerts?: string[];
  auditLogs?: AuditLogRecord[];
  // M4 Fields
  companyId?: string;
  version?: number;
  parentQuoteId?: string;
  modificationReason?: string;
  expiresAt?: string;
}

export interface QuoteDraft {
  id: string;
  title: string;
  savedAt: string;
  formData: QuoteFormState;
  routeSummary: string;
  transportMode: TransportMode;
  totalWeightKg: number;
  estimatedTariffInr: number;
}

export interface TrackingStep {
  title: string;
  location: string;
  timestamp: string;
  completed: boolean;
  current?: boolean;
}

export interface ContainerTrackingRecord {
  trackingId: string;
  quoteId: string;
  containerNo: string;
  vesselOrFlight: string;
  carrier: string;
  origin: string;
  destination: string;
  status: 'BOOKED' | 'IN_TRANSIT' | 'CUSTOMS_CLEARANCE' | 'DELIVERED';
  statusText: string;
  eta: string;
  progressPercentage: number;
  currentLocation: string;
  timeline: TrackingStep[];
}

export interface PromoCoupon {
  code: string;
  title: string;
  description: string;
  validityText: string;
  badgeText: string;
  discountType: 'percentage' | 'flat' | 'doc_free';
  discountValue: number;
  applicableMode?: TransportMode;
  minWeightKg?: number;
}

export interface CorridorBenchmark {
  originCode: string;
  originName: string;
  destinationCode: string;
  destinationName: string;
  mode: string;
  transitTime: string;
  rateInr: string;
}

export type UserRole = 'customer' | 'user' | 'shipper' | 'freight-agent' | 'customs-officer' | 'customer-officer' | 'admin' | 'business' | 'broker';

export * from './types/milestone3';

export interface BrokerClientQuote extends SavedQuotation {
  brokerMarginPct?: number;
  carrierBuyRate?: number;
  brokerProfitInr?: number;
  carrierName?: string;
  brokerageRef?: string;
}

export interface CarrierSpotRate {
  id: string;
  carrierName: string;
  carrierLogo?: string;
  originPort: string;
  destinationPort: string;
  mode: TransportMode;
  equipment: string;
  buyRateInr: number;
  suggestedSellInr: number;
  transitDays: number;
  validUntil: string;
  spaceAvailability: 'High' | 'Medium' | 'Tight';
  reliabilityScore: string;
  directOrTranshipment: string;
}

export interface CommissionLedgerItem {
  id: string;
  shipmentRef: string;
  clientName: string;
  route: string;
  carrier: string;
  buyCostInr: number;
  sellPriceInr: number;
  marginPct: number;
  commissionEarnedInr: number;
  status: 'SETTLED' | 'PENDING_PAYOUT' | 'IN_PROCESSING';
  date: string;
}

// M4 Interfaces
export interface Company {
  companyId: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: string;
}

export interface VerificationChecklist {
  shipment: boolean;
  cargo: boolean;
  capacity: boolean;
  route: boolean;
  schedule: boolean;
  document: boolean;
  commercial: boolean;
}

export interface VerificationRequest {
  requestId: string;
  quoteId: string;
  quoteSnapshot: SavedQuotation;
  customerId: string;
  companyId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'INFO_REQUESTED' | 'REVISION_ISSUED' | 'APPROVED' | 'REJECTED';
  checklist: VerificationChecklist;
  missingInfoRequested: string[];
  revisedQuoteId?: string;
  revisedQuoteSnapshot?: SavedQuotation;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  bookingRef: string;
  quoteId: string;
  quoteVersion: number;
  shipmentId: string;
  companyId: string;
  customerId: string;
  quoteSnapshot: SavedQuotation;
  status: 'CONFIRMED' | 'PROCESSING' | 'READY_FOR_DISPATCH' | 'COMPLETED' | 'CANCELLED';
  verificationRequestId?: string;
  createdAt: string;
  updatedAt?: string;
}

// M4 Document Types
export type DocumentType = 'COMMERCIAL_INVOICE' | 'PACKING_LIST' | 'CUSTOMS_DOCUMENT' | 'INSURANCE' | 'BILL_OF_LADING' | 'CERTIFICATE_OF_ORIGIN' | 'OTHER';
export type DocumentStatus = 'REQUESTED' | 'UPLOADED' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' | 'MISSING';
export type VerificationArea = 'OPERATIONAL' | 'COMMERCIAL' | 'DOCUMENT';

export interface DocumentRecord {
  documentId: string;
  requestId: string;
  shipmentId: string;
  customerId: string;
  companyId: string;
  documentType: DocumentType;
  customDocumentType?: string;
  fileName: string;
  fileReference: string;
  fileSize: number;
  mimeType: string;
  status: DocumentStatus;
  remarks?: string;
  version: number;
  previousVersionId?: string;
  uploadedBy: string;
  uploadedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  isActive: boolean;
}

export interface DocumentVersion {
  versionId: string;
  documentId: string;
  version: number;
  fileName: string;
  fileReference: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
  remarks?: string;
}

export interface DocumentChecklistItem {
  documentType: DocumentType;
  required: boolean;
  status: DocumentStatus;
  documentId?: string;
  remarks?: string;
}

export interface DocumentVerificationChecklist {
  checklistId: string;
  requestId: string;
  requiredDocuments: DocumentChecklistItem[];
  verifiedBy?: string;
  verifiedAt?: string;
  isComplete: boolean;
}

export interface DocumentAuditLog {
  auditId: string;
  documentId: string;
  requestId: string;
  userId: string;
  companyId: string;
  action: 'REQUESTED' | 'UPLOADED' | 'VIEWED' | 'VERIFIED' | 'REJECTED' | 'REPLACED' | 'COMPLETED';
  timestamp: string;
  remarks?: string;
  version?: number;
}
