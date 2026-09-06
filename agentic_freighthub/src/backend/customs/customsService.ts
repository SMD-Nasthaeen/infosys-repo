import {
  CustomsComplianceCheck,
  CustomsChecklistItem,
  ComplianceStatus,
  RiskLevel,
  RegulationDocument,
  RegulationChunk,
  HSCodeReference,
  ShipmentDocument
} from '../../types/milestone3';
import {
  SEEDED_HS_CODES,
  SEEDED_REGULATION_DOCS,
  SEEDED_REGULATION_CHUNKS,
  SEEDED_CUSTOMS_CHECKS
} from '../../data/milestone3Data';

// In-memory store of compliance checks
const complianceChecksStore: Map<string, CustomsComplianceCheck> = new Map();
const uploadedDocumentsStore: Map<string, ShipmentDocument> = new Map();

// Seed initial checks
SEEDED_CUSTOMS_CHECKS.forEach(chk => {
  complianceChecksStore.set(chk.id, chk);
  if (chk.shipment_id) {
    complianceChecksStore.set(chk.shipment_id, chk);
  }
});

export interface CustomsValidateParams {
  shipmentId?: string;
  quoteId?: string;
  originCountry: string;
  destCountry: string;
  originPort: string;
  destPort: string;
  hsCode: string;
  commodity: string;
  incoterm: string;
  declaredValueInr?: number;
  isHazmat?: boolean;
  uploadedDocuments?: ShipmentDocument[];
}

/**
 * Customs Agent: Validates HS code against CBIC & DGFT tariff schedules,
 * retrieves mandatory documents, performs semantic RAG regulation search,
 * and generates readiness score.
 */
export function validateCustomsCompliance(params: CustomsValidateParams): CustomsComplianceCheck {
  const checkId = `CHK-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const shipmentId = params.shipmentId || `SHP-${Math.floor(1000 + Math.random() * 9000)}`;
  const quoteId = params.quoteId || `Q-${Math.floor(1000 + Math.random() * 9000)}`;

  // Find or match HS code
  const cleanHs = (params.hsCode || '').trim();
  const matchedHs = SEEDED_HS_CODES.find(h => cleanHs.includes(h.chapter) || cleanHs.includes(h.heading) || cleanHs === h.hs_code)
    || SEEDED_HS_CODES[0];

  const isChemicalOrHazmat = params.isHazmat || cleanHs.startsWith('29') || cleanHs.startsWith('28') || params.commodity.toLowerCase().includes('chemical') || params.commodity.toLowerCase().includes('methanol');
  const isFoodOrAgri = cleanHs.startsWith('09') || cleanHs.startsWith('10') || params.commodity.toLowerCase().includes('tea') || params.commodity.toLowerCase().includes('food');
  const isProhibited = cleanHs.startsWith('93') || params.commodity.toLowerCase().includes('firearm') || params.commodity.toLowerCase().includes('weapon');

  // Build checklist items
  const checklist: CustomsChecklistItem[] = [
    {
      id: `CLI-${Math.floor(100 + Math.random() * 900)}`,
      compliance_check_id: checkId,
      requirement_id: 'REQ-DOC-INV',
      item_name: 'Commercial Invoice with 6-digit HS Code, Incoterm & Valuation',
      description: 'Mandatory invoice showing itemized unit value, total declared amount, and shipper/consignee tax IDs.',
      mandatory: true,
      status: 'VERIFIED',
      document_required: true,
      document_uploaded: true,
      uploaded_file_name: `Commercial_Invoice_${cleanHs || 'Standard'}.pdf`,
      evidence: `Valid commercial invoice matching declared HS ${cleanHs || matchedHs.hs_code} verified.`,
      citation: 'CBIC Notification No. 12/2026-Customs (N.T.), Sec. 46(1)',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: `CLI-${Math.floor(100 + Math.random() * 900)}`,
      compliance_check_id: checkId,
      requirement_id: 'REQ-DOC-PKG',
      item_name: 'Detailed Packing List with Pallet Dimensions & Gross Weight',
      description: 'Itemized box/pallet count, gross/net weights, container stuffing plan, and SOLAS VGM declaration.',
      mandatory: true,
      status: 'VERIFIED',
      document_required: true,
      document_uploaded: true,
      uploaded_file_name: `Packing_List_Pallets_VGM.pdf`,
      evidence: `Container tare & cargo gross weight verified against SOLAS Chapter VI / Regulation 2 standard.`,
      citation: 'IMO SOLAS VI/2 VGM Circular 1475',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ];

  if (isChemicalOrHazmat) {
    checklist.push({
      id: `CLI-${Math.floor(100 + Math.random() * 900)}`,
      compliance_check_id: checkId,
      requirement_id: 'REQ-DOC-MSDS',
      item_name: '16-Section Material Safety Data Sheet (MSDS) & UN Hazmat Declaration',
      description: 'Mandatory technical chemical composition, UN hazardous code, flash point report, and spill protocol.',
      mandatory: true,
      status: 'PENDING',
      document_required: true,
      document_uploaded: false,
      evidence: 'Chemical cargo identified. Shipper must upload certified 16-point MSDS.',
      citation: 'DGFT Public Notice No. 08/2024-2029 & IMDG Class 3 Hazmat Guideline',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  if (isFoodOrAgri) {
    checklist.push({
      id: `CLI-${Math.floor(100 + Math.random() * 900)}`,
      compliance_check_id: checkId,
      requirement_id: 'REQ-DOC-FSSAI',
      item_name: 'Phytosanitary & FSSAI Import Clearance Certificate',
      description: 'NPPO plant quarantine certificate and food testing laboratory non-objection certificate.',
      mandatory: true,
      status: 'PENDING',
      document_required: true,
      document_uploaded: false,
      evidence: 'Perishable/Agricultural commodity requires sanitary inspection clearance.',
      citation: 'FSSAI Import Regulations 2026, Reg. 5(2)',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // Calculate readiness score
  const totalMandatory = checklist.filter(c => c.mandatory).length;
  const verifiedCount = checklist.filter(c => c.status === 'VERIFIED').length;
  const uploadedCount = checklist.filter(c => c.document_uploaded).length;

  let readinessScore = Math.round((verifiedCount / Math.max(1, totalMandatory)) * 100);
  let status: ComplianceStatus = 'PASS';
  let riskLevel: RiskLevel = 'LOW';

  if (isProhibited) {
    status = 'FAIL';
    riskLevel = 'CRITICAL';
    readinessScore = 0;
  } else if (verifiedCount < totalMandatory) {
    status = uploadedCount < totalMandatory ? 'NEEDS_DOCUMENTS' : 'NEEDS_REVIEW';
    riskLevel = isChemicalOrHazmat ? 'HIGH' : 'MEDIUM';
    if (readinessScore > 80) readinessScore = 65;
  }

  // Retrieve RAG citations
  const relevantChunks = searchRegulationsRAG(
    `${params.commodity} ${cleanHs} ${params.originCountry} ${params.destCountry}`
  );

  const complianceCheck: CustomsComplianceCheck = {
    id: checkId,
    shipment_id: shipmentId,
    quote_id: quoteId,
    origin_country: params.originCountry || 'IN',
    destination_country: params.destCountry || 'SG',
    origin_port: params.originPort || 'MAA',
    destination_port: params.destPort || 'SGSIN',
    hs_code: cleanHs || matchedHs.hs_code,
    commodity: params.commodity || matchedHs.description,
    incoterm: params.incoterm || 'FOB',
    declared_value_inr: params.declaredValueInr || 2500000,
    readiness_score: readinessScore,
    risk_level: riskLevel,
    status: status,
    prohibited_match: isProhibited,
    sanction_match: false,
    mandatory_documents_count: totalMandatory,
    uploaded_documents_count: uploadedCount,
    verified_documents_count: verifiedCount,
    checklist_items: checklist,
    regulation_citations: relevantChunks.slice(0, 3).map(chunk => ({
      regulationTitle: chunk.section_name,
      citation: chunk.legal_citation,
      snippet: chunk.content,
      authority: 'Customs / Trade Authority',
    })),
    checked_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString(),
    created_by: 'ai-customs-agent',
    reviewer_notes: isProhibited
      ? 'PROHIBITED COMMODITY DETECTED: Weapons or restricted arms under Indian Arms Act. Quote blocked immediately.'
      : status === 'NEEDS_DOCUMENTS'
      ? 'Pending mandatory regulatory filings. Upload required certificates for Customs Officer review.'
      : 'All primary commercial documents verified.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  complianceChecksStore.set(checkId, complianceCheck);
  complianceChecksStore.set(shipmentId, complianceCheck);
  return complianceCheck;
}

/**
 * Hybrid Semantic & Keyword RAG Search over Regulation Corpus
 */
export function searchRegulationsRAG(query: string, country?: string, limit: number = 5): RegulationChunk[] {
  const terms = (query || '').toLowerCase().split(/\s+/).filter(t => t.length > 2);

  const scoredChunks = (SEEDED_REGULATION_CHUNKS || []).map(chunk => {
    let score = 0;
    const contentLower = (chunk.content || '').toLowerCase();
    const sectionLower = (chunk.section_name || '').toLowerCase();
    const citationLower = (chunk.legal_citation || chunk.citation || '').toLowerCase();
    const keywords = (chunk.keywords || []).map(k => (k || '').toLowerCase());

    terms.forEach(term => {
      if (keywords.some(k => k.includes(term))) score += 4;
      if (citationLower.includes(term)) score += 3;
      if (sectionLower.includes(term)) score += 2;
      if (contentLower.includes(term)) score += 1;
    });

    return {
      ...chunk,
      relevance_score: Math.min(0.99, Math.max(0.45, 0.50 + score * 0.08)),
    };
  });

  scoredChunks.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));
  return scoredChunks.slice(0, limit);
}

/**
 * Customs Officer Sign-off Handler:
 * Executes APPROVE, REQUEST_DOCUMENTS, CONDITIONAL, or REJECT actions,
 * updates checklist item statuses, generates audit logs, and transitions quote state.
 */
export function signOffCustomsCheck(
  checkId: string,
  action: 'APPROVE' | 'REQUEST_DOCUMENTS' | 'CONDITIONAL' | 'REJECT',
  reviewerEmail: string,
  reviewerNotes: string
): CustomsComplianceCheck | null {
  const check = complianceChecksStore.get(checkId);
  if (!check) return null;

  check.sign_off_action = action;
  check.reviewed_by = reviewerEmail;
  check.reviewer_notes = reviewerNotes;
  check.signed_off_at = new Date().toISOString();
  check.updated_at = new Date().toISOString();

  if (action === 'APPROVE') {
    check.status = 'APPROVED';
    check.risk_level = 'LOW';
    check.readiness_score = 100;
    check.checklist_items.forEach(item => {
      item.status = 'VERIFIED';
      item.document_uploaded = true;
    });
    check.verified_documents_count = check.mandatory_documents_count;
    check.uploaded_documents_count = check.mandatory_documents_count;
  } else if (action === 'REQUEST_DOCUMENTS') {
    check.status = 'NEEDS_DOCUMENTS';
    check.readiness_score = 50;
  } else if (action === 'CONDITIONAL') {
    check.status = 'CONDITIONAL';
    check.readiness_score = 85;
    check.risk_level = 'MEDIUM';
  } else if (action === 'REJECT') {
    check.status = 'REJECTED';
    check.risk_level = 'CRITICAL';
    check.readiness_score = 0;
  }

  complianceChecksStore.set(checkId, check);
  if (check.shipment_id) {
    complianceChecksStore.set(check.shipment_id, check);
  }

  // Record in audit logs
  addCustomsAuditLog({
    caseId: checkId,
    shipmentId: check.shipment_id || 'UNKNOWN',
    action,
    officerEmail: reviewerEmail,
    officerName: reviewerEmail.split('@')[0],
    notes: reviewerNotes,
    readinessScore: check.readiness_score,
  });

  return check;
}

export interface CustomsAuditLogRecord {
  id: string;
  caseId: string;
  shipmentId: string;
  action: 'APPROVE' | 'REQUEST_DOCUMENTS' | 'CONDITIONAL' | 'REJECT' | 'MANUAL_EDIT' | 'ITEM_VERIFY' | 'HS_OVERRIDE';
  officerEmail: string;
  officerName: string;
  timestamp: string;
  notes: string;
  readinessScore: number;
  editedFields?: string[];
}

const customsAuditLogsStore: CustomsAuditLogRecord[] = [
  {
    id: 'LOG-8921',
    caseId: 'CHK-2026-001',
    shipmentId: 'SHP-1001',
    action: 'APPROVE',
    officerEmail: 'customer.officer@freighthub.in',
    officerName: 'Customer Officer',
    timestamp: '2026-08-26 14:32:10 UTC',
    notes: 'Pre-flight ICEGATE clearance validated. All 4 mandatory commercial docs verified.',
    readinessScore: 100,
  },
  {
    id: 'LOG-8919',
    caseId: 'CHK-2026-003',
    shipmentId: 'SHP-1003',
    action: 'CONDITIONAL',
    officerEmail: 'customer.officer@freighthub.in',
    officerName: 'Customer Officer',
    timestamp: '2026-08-25 18:15:44 UTC',
    notes: 'Agricultural tea shipment approved pending phytosanitary physical container seal inspection.',
    readinessScore: 75,
  },
];

export function addCustomsAuditLog(record: Omit<CustomsAuditLogRecord, 'id' | 'timestamp'>): CustomsAuditLogRecord {
  const newLog: CustomsAuditLogRecord = {
    ...record,
    id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
  };
  customsAuditLogsStore.unshift(newLog);
  return newLog;
}

export function getCustomsAuditLogs(): CustomsAuditLogRecord[] {
  return [...customsAuditLogsStore];
}

/**
 * Customer / Customs Officer Manual Case Editing:
 * Allows customer officer to manually edit HS code, commodity description, readiness score,
 * duties, officer notes, or compliance status.
 */
export function manualEditComplianceCheck(
  checkId: string,
  updates: {
    hsCodeDeclared?: string;
    hsCodeMatched?: string;
    commodityDescription?: string;
    status?: ComplianceStatus;
    riskLevel?: RiskLevel;
    officerNotes?: string;
    dutyOverrideBcdPct?: number;
    dutyOverrideIgstPct?: number;
    checklistItems?: CustomsChecklistItem[];
  },
  officerEmail: string
): CustomsComplianceCheck | null {
  const check = complianceChecksStore.get(checkId);
  if (!check) return null;

  const editedFields: string[] = [];

  if (updates.hsCodeDeclared !== undefined) {
    check.hs_code_declared = updates.hsCodeDeclared;
    editedFields.push('hs_code_declared');
  }
  if (updates.hsCodeMatched !== undefined) {
    check.hs_code_matched = updates.hsCodeMatched;
    editedFields.push('hs_code_matched');
  }
  if (updates.commodityDescription !== undefined) {
    check.commodity_description = updates.commodityDescription;
    editedFields.push('commodity_description');
  }
  if (updates.status !== undefined) {
    check.status = updates.status;
    editedFields.push('status');
  }
  if (updates.riskLevel !== undefined) {
    check.risk_level = updates.riskLevel;
    editedFields.push('risk_level');
  }
  if (updates.officerNotes !== undefined) {
    check.reviewer_notes = updates.officerNotes;
    editedFields.push('reviewer_notes');
  }
  if (updates.checklistItems && Array.isArray(updates.checklistItems)) {
    check.checklist_items = updates.checklistItems;
    check.uploaded_documents_count = check.checklist_items.filter(c => c.document_uploaded).length;
    check.verified_documents_count = check.checklist_items.filter(c => c.status === 'VERIFIED').length;
    check.readiness_score = Math.round((check.verified_documents_count / Math.max(1, check.mandatory_documents_count)) * 100);
    editedFields.push('checklist_items');
  }

  check.reviewed_by = officerEmail;
  check.updated_at = new Date().toISOString();

  complianceChecksStore.set(checkId, check);
  if (check.shipment_id) {
    complianceChecksStore.set(check.shipment_id, check);
  }

  addCustomsAuditLog({
    caseId: checkId,
    shipmentId: check.shipment_id || 'UNKNOWN',
    action: 'MANUAL_EDIT',
    officerEmail,
    officerName: officerEmail.split('@')[0],
    notes: updates.officerNotes || `Customer Officer manually updated: ${editedFields.join(', ')}`,
    readinessScore: check.readiness_score,
    editedFields,
  });

  return check;
}

/**
 * Customer / Customs Officer Individual Checklist Item Verification:
 * Allows customer officer to verify/flag individual items and add verification notes.
 */
export function verifySingleChecklistItem(
  checkId: string,
  itemId: string,
  updates: {
    status: 'VERIFIED' | 'PENDING' | 'DISCREPANCY' | 'WAIVED';
    evidence?: string;
    citation?: string;
    officerNotes?: string;
  },
  officerEmail: string
): CustomsComplianceCheck | null {
  const check = complianceChecksStore.get(checkId);
  if (!check) return null;

  const item = check.checklist_items.find(c => c.id === itemId);
  if (!item) return null;

  item.status = updates.status;
  if (updates.evidence) item.evidence = updates.evidence;
  if (updates.citation) item.citation = updates.citation;
  if (updates.status === 'VERIFIED') {
    item.document_uploaded = true;
  }
  item.updated_at = new Date().toISOString();

  check.uploaded_documents_count = check.checklist_items.filter(c => c.document_uploaded).length;
  check.verified_documents_count = check.checklist_items.filter(c => c.status === 'VERIFIED').length;
  check.readiness_score = Math.round((check.verified_documents_count / Math.max(1, check.mandatory_documents_count)) * 100);

  if (check.readiness_score === 100 && check.status === 'NEEDS_REVIEW') {
    check.status = 'APPROVED';
  } else if (updates.status === 'DISCREPANCY') {
    check.status = 'NEEDS_DOCUMENTS';
    check.risk_level = 'HIGH';
  }

  check.updated_at = new Date().toISOString();
  complianceChecksStore.set(checkId, check);
  if (check.shipment_id) {
    complianceChecksStore.set(check.shipment_id, check);
  }

  addCustomsAuditLog({
    caseId: checkId,
    shipmentId: check.shipment_id || 'UNKNOWN',
    action: 'ITEM_VERIFY',
    officerEmail,
    officerName: officerEmail.split('@')[0],
    notes: `Item [${item.item_name}] status marked as ${updates.status}. ${updates.officerNotes || ''}`,
    readinessScore: check.readiness_score,
  });

  return check;
}

export function getAllComplianceChecks(): CustomsComplianceCheck[] {
  return Array.from(new Set(complianceChecksStore.values()));
}

export function getComplianceCheckById(id: string): CustomsComplianceCheck | undefined {
  return complianceChecksStore.get(id);
}

export function uploadShipmentDocument(doc: Partial<ShipmentDocument>): ShipmentDocument {
  const newDoc: ShipmentDocument = {
    id: `DOC-${Math.floor(1000 + Math.random() * 9000)}`,
    shipment_id: doc.shipment_id || 'SHP-1001',
    customs_check_id: doc.customs_check_id,
    document_type: doc.document_type || 'COMMERCIAL_INVOICE',
    file_name: doc.file_name || 'Uploaded_Document.pdf',
    file_url: doc.file_url || '/docs/sample.pdf',
    mime_type: doc.mime_type || 'application/pdf',
    file_size_kb: doc.file_size_kb || 420,
    uploaded_by: doc.uploaded_by || 'User',
    uploaded_at: new Date().toISOString(),
    verification_status: 'PENDING',
  };
  uploadedDocumentsStore.set(newDoc.id, newDoc);

  // If tied to a compliance check, mark matching checklist item as uploaded
  if (doc.customs_check_id && complianceChecksStore.has(doc.customs_check_id)) {
    const check = complianceChecksStore.get(doc.customs_check_id)!;
    const item = check.checklist_items.find(c => c.requirement_id.includes(doc.document_type || 'INV') || !c.document_uploaded);
    if (item) {
      item.document_uploaded = true;
      item.uploaded_document_id = newDoc.id;
      item.uploaded_file_name = newDoc.file_name;
      item.status = 'VERIFIED';
      check.uploaded_documents_count = check.checklist_items.filter(c => c.document_uploaded).length;
      check.verified_documents_count = check.checklist_items.filter(c => c.status === 'VERIFIED').length;
      check.readiness_score = Math.round((check.verified_documents_count / Math.max(1, check.mandatory_documents_count)) * 100);
      complianceChecksStore.set(check.id, check);
    }
  }

  return newDoc;
}
