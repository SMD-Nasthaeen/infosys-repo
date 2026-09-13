import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  m4DocumentsCollection,
  documentVersionsCollection,
  documentAuditLogsCollection,
  documentChecklistsCollection,
  verificationRequestsCollection,
  nextSequence
} from '../db/database';
import {
  DocumentRecord,
  DocumentVersion,
  DocumentAuditLog,
  DocumentVerificationChecklist,
  DocumentChecklistItem,
  DocumentType,
  DocumentStatus,
  VerificationRequest
} from '../../types';

export const documentRouter = Router();

// Apply requireAuth to all routes
documentRouter.use('/api/m4/documents', requireAuth);

/**
 * POST /api/m4/documents/request
 * Agent requests documents from customer
 */
documentRouter.post('/api/m4/documents/request', async (req: Request, res: Response): Promise<void> => {
  try {
    const { requestId, documentTypes, remarks } = req.body;
    const authUser = req.authUser!;

    if (!requestId || !Array.isArray(documentTypes) || documentTypes.length === 0) {
      res.status(400).json({ success: false, error: 'requestId and documentTypes array are required' });
      return;
    }

    // Verify agent has access to this verification request
    const verReqCol = await verificationRequestsCollection();
    const verification = (await verReqCol.findOne({ requestId })) as unknown as VerificationRequest | null;

    if (!verification) {
      res.status(404).json({ success: false, error: 'Verification request not found' });
      return;
    }

    if (authUser.role === 'freight-agent' && verification.companyId !== authUser.companyId || 'COMP-001') {
      res.status(403).json({ success: false, error: 'Unauthorized cross-company access' });
      return;
    }

    const docsCol = await m4DocumentsCollection();
    const auditCol = await documentAuditLogsCollection();
    const nowIso = new Date().toISOString();

    // Create document records for each requested type
    const requestedDocs: DocumentRecord[] = [];

    for (const docType of documentTypes) {
      const documentId = await nextSequence('m4_document', 'DOC');

      const newDoc: DocumentRecord = {
        documentId,
        requestId,
        shipmentId: verification.quoteSnapshot.shipmentId || 'PENDING',
        customerId: verification.customerId,
        companyId: verification.companyId,
        documentType: docType as DocumentType,
        fileName: '',
        fileReference: '',
        fileSize: 0,
        mimeType: '',
        status: 'REQUESTED',
        remarks: remarks || `Document requested by agent`,
        version: 0,
        uploadedBy: '',
        uploadedAt: '',
        isActive: true,
        createdAt: nowIso,
      } as any;

      await docsCol.insertOne(newDoc);
      requestedDocs.push(newDoc);

      // Create audit log
      const auditId = await nextSequence('doc_audit', 'DA');
      const auditLog: DocumentAuditLog = {
        auditId,
        documentId,
        requestId,
        userId: authUser.id,
        companyId: verification.companyId,
        action: 'REQUESTED',
        timestamp: nowIso,
        remarks: remarks || `Document ${docType} requested`,
      };
      await auditCol.insertOne(auditLog);
    }

    // Update verification request status to INFO_REQUESTED
    await verReqCol.updateOne(
      { requestId },
      { $set: { status: 'INFO_REQUESTED', updatedAt: nowIso } }
    );

    res.status(201).json({ success: true, data: requestedDocs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/m4/documents/upload
 * Customer uploads a document
 */
documentRouter.post('/api/m4/documents/upload', async (req: Request, res: Response): Promise<void> => {
  try {
    const { requestId, documentType, fileName, fileSize, mimeType, remarks, existingDocumentId } = req.body;
    const authUser = req.authUser!;

    if (!requestId || !documentType || !fileName) {
      res.status(400).json({ success: false, error: 'requestId, documentType, and fileName are required' });
      return;
    }

    if (authUser.role !== 'customer' && authUser.role !== 'user') {
      res.status(403).json({ success: false, error: 'Only customers can upload documents' });
      return;
    }

    // Verify customer owns this verification request
    const verReqCol = await verificationRequestsCollection();
    const verification = (await verReqCol.findOne({ requestId })) as unknown as VerificationRequest | null;

    if (!verification) {
      res.status(404).json({ success: false, error: 'Verification request not found' });
      return;
    }

    if (verification.customerId !== authUser.id) {
      res.status(403).json({ success: false, error: 'You do not own this verification request' });
      return;
    }

    const docsCol = await m4DocumentsCollection();
    const versionsCol = await documentVersionsCollection();
    const auditCol = await documentAuditLogsCollection();
    const nowIso = new Date().toISOString();

    let documentId: string;
    let version = 1;
    let previousVersionId: string | undefined;

    if (existingDocumentId) {
      // Update existing document (re-upload)
      const existingDoc = await docsCol.findOne({ documentId: existingDocumentId }) as unknown as DocumentRecord | null;
      if (!existingDoc) {
        res.status(404).json({ success: false, error: 'Existing document not found' });
        return;
      }

      if (existingDoc.customerId !== authUser.id) {
        res.status(403).json({ success: false, error: 'You do not own this document' });
        return;
      }

      // Create version record for old document
      const versionId = await nextSequence('doc_version', 'DV');
      const versionRecord: DocumentVersion = {
        versionId,
        documentId: existingDoc.documentId,
        version: existingDoc.version,
        fileName: existingDoc.fileName,
        fileReference: existingDoc.fileReference,
        fileSize: existingDoc.fileSize,
        uploadedBy: existingDoc.uploadedBy,
        uploadedAt: existingDoc.uploadedAt,
        remarks: 'Previous version before re-upload',
      };
      await versionsCol.insertOne(versionRecord);

      previousVersionId = existingDoc.documentId;
      documentId = existingDoc.documentId;
      version = existingDoc.version + 1;

      // Update existing document
      await docsCol.updateOne(
        { documentId: existingDoc.documentId },
        {
          $set: {
            fileName,
            fileReference: `ref_${existingDoc.documentId}_v${version}`,
            fileSize: fileSize || 0,
            mimeType: mimeType || 'application/octet-stream',
            status: 'UPLOADED',
            remarks: remarks || '',
            version,
            previousVersionId,
            uploadedBy: authUser.id,
            uploadedAt: nowIso,
          }
        }
      );

      // Audit log for replacement
      const auditId = await nextSequence('doc_audit', 'DA');
      const auditLog: DocumentAuditLog = {
        auditId,
        documentId: existingDoc.documentId,
        requestId,
        userId: authUser.id,
        companyId: verification.companyId,
        action: 'REPLACED',
        timestamp: nowIso,
        remarks: remarks || 'Document replaced with new version',
        version,
      };
      await auditCol.insertOne(auditLog);
    } else {
      // Upload new document
      documentId = await nextSequence('m4_document', 'DOC');

      const newDoc: DocumentRecord = {
        documentId,
        requestId,
        shipmentId: verification.quoteSnapshot.shipmentId || 'PENDING',
        customerId: verification.customerId,
        companyId: verification.companyId,
        documentType: documentType as DocumentType,
        fileName,
        fileReference: `ref_${documentId}_v1`,
        fileSize: fileSize || 0,
        mimeType: mimeType || 'application/octet-stream',
        status: 'UPLOADED',
        remarks: remarks || '',
        version: 1,
        uploadedBy: authUser.id,
        uploadedAt: nowIso,
        isActive: true,
      };

      await docsCol.insertOne(newDoc);

      // Audit log for upload
      const auditId = await nextSequence('doc_audit', 'DA');
      const auditLog: DocumentAuditLog = {
        auditId,
        documentId,
        requestId,
        userId: authUser.id,
        companyId: verification.companyId,
        action: 'UPLOADED',
        timestamp: nowIso,
        remarks: remarks || `Document ${documentType} uploaded`,
        version: 1,
      };
      await auditCol.insertOne(auditLog);
    }

    res.status(201).json({ success: true, data: { documentId, version } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/m4/documents/request/:requestId
 * Get all documents for a verification request
 */
documentRouter.get('/api/m4/documents/request/:requestId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { requestId } = req.params;
    const authUser = req.authUser!;

    // Verify access
    const verReqCol = await verificationRequestsCollection();
    const verification = (await verReqCol.findOne({ requestId })) as unknown as VerificationRequest | null;

    if (!verification) {
      res.status(404).json({ success: false, error: 'Verification request not found' });
      return;
    }

    if (authUser.role === 'freight-agent' && verification.companyId !== authUser.companyId || 'COMP-001') {
      res.status(403).json({ success: false, error: 'Unauthorized cross-company access' });
      return;
    }

    if ((authUser.role === 'customer' || authUser.role === 'user') && verification.customerId !== authUser.id) {
      res.status(403).json({ success: false, error: 'You do not own this verification request' });
      return;
    }

    const docsCol = await m4DocumentsCollection();
    const documents = await docsCol.find({ requestId, isActive: true }).toArray();

    res.json({ success: true, data: documents });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/m4/documents/:documentId
 * Get a specific document
 */
documentRouter.get('/api/m4/documents/:documentId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { documentId } = req.params;
    const authUser = req.authUser!;

    const docsCol = await m4DocumentsCollection();
    const document = (await docsCol.findOne({ documentId })) as unknown as DocumentRecord | null;

    if (!document) {
      res.status(404).json({ success: false, error: 'Document not found' });
      return;
    }

    // Verify access
    if (authUser.role === 'freight-agent' && document.companyId !== authUser.companyId || 'COMP-001') {
      res.status(403).json({ success: false, error: 'Unauthorized cross-company access' });
      return;
    }

    if ((authUser.role === 'customer' || authUser.role === 'user') && document.customerId !== authUser.id) {
      res.status(403).json({ success: false, error: 'You do not own this document' });
      return;
    }

    // Audit log for view
    const auditCol = await documentAuditLogsCollection();
    const auditId = await nextSequence('doc_audit', 'DA');
    const auditLog: DocumentAuditLog = {
      auditId,
      documentId,
      requestId: document.requestId,
      userId: authUser.id,
      companyId: document.companyId,
      action: 'VIEWED',
      timestamp: new Date().toISOString(),
    };
    await auditCol.insertOne(auditLog);

    res.json({ success: true, data: document });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/m4/documents/:documentId/verify
 * Agent verifies a document
 */
documentRouter.patch('/api/m4/documents/:documentId/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const { documentId } = req.params;
    const { remarks } = req.body;
    const authUser = req.authUser!;

    if (authUser.role !== 'freight-agent' && authUser.role !== 'customs-officer') {
      res.status(403).json({ success: false, error: 'Only authorized personnel can verify documents' });
      return;
    }

    const docsCol = await m4DocumentsCollection();
    const document = (await docsCol.findOne({ documentId })) as unknown as DocumentRecord | null;

    if (!document) {
      res.status(404).json({ success: false, error: 'Document not found' });
      return;
    }

    if (authUser.role === 'freight-agent' && document.companyId !== authUser.companyId || 'COMP-001') {
      res.status(403).json({ success: false, error: 'Unauthorized cross-company access' });
      return;
    }

    const nowIso = new Date().toISOString();

    await docsCol.updateOne(
      { documentId },
      {
        $set: {
          status: 'VERIFIED',
          remarks: remarks || document.remarks,
          reviewedBy: authUser.id,
          reviewedAt: nowIso,
        }
      }
    );

    // Audit log
    const auditCol = await documentAuditLogsCollection();
    const auditId = await nextSequence('doc_audit', 'DA');
    const auditLog: DocumentAuditLog = {
      auditId,
      documentId,
      requestId: document.requestId,
      userId: authUser.id,
      companyId: document.companyId,
      action: 'VERIFIED',
      timestamp: nowIso,
      remarks: remarks || 'Document verified',
      version: document.version,
    };
    await auditCol.insertOne(auditLog);

    res.json({ success: true, message: 'Document verified successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/m4/documents/:documentId/reject
 * Agent rejects a document
 */
documentRouter.patch('/api/m4/documents/:documentId/reject', async (req: Request, res: Response): Promise<void> => {
  try {
    const { documentId } = req.params;
    const { remarks } = req.body;
    const authUser = req.authUser!;

    if (authUser.role !== 'freight-agent' && authUser.role !== 'customs-officer') {
      res.status(403).json({ success: false, error: 'Only authorized personnel can reject documents' });
      return;
    }

    if (!remarks) {
      res.status(400).json({ success: false, error: 'Remarks are required when rejecting a document' });
      return;
    }

    const docsCol = await m4DocumentsCollection();
    const document = (await docsCol.findOne({ documentId })) as unknown as DocumentRecord | null;

    if (!document) {
      res.status(404).json({ success: false, error: 'Document not found' });
      return;
    }

    if (authUser.role === 'freight-agent' && document.companyId !== authUser.companyId || 'COMP-001') {
      res.status(403).json({ success: false, error: 'Unauthorized cross-company access' });
      return;
    }

    const nowIso = new Date().toISOString();

    await docsCol.updateOne(
      { documentId },
      {
        $set: {
          status: 'REJECTED',
          remarks,
          reviewedBy: authUser.id,
          reviewedAt: nowIso,
        }
      }
    );

    // Audit log
    const auditCol = await documentAuditLogsCollection();
    const auditId = await nextSequence('doc_audit', 'DA');
    const auditLog: DocumentAuditLog = {
      auditId,
      documentId,
      requestId: document.requestId,
      userId: authUser.id,
      companyId: document.companyId,
      action: 'REJECTED',
      timestamp: nowIso,
      remarks,
      version: document.version,
    };
    await auditCol.insertOne(auditLog);

    res.json({ success: true, message: 'Document rejected' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/m4/documents/:documentId/versions
 * Get version history for a document
 */
documentRouter.get('/api/m4/documents/:documentId/versions', async (req: Request, res: Response): Promise<void> => {
  try {
    const { documentId } = req.params;
    const authUser = req.authUser!;

    const docsCol = await m4DocumentsCollection();
    const document = (await docsCol.findOne({ documentId })) as unknown as DocumentRecord | null;

    if (!document) {
      res.status(404).json({ success: false, error: 'Document not found' });
      return;
    }

    if (authUser.role === 'freight-agent' && document.companyId !== authUser.companyId || 'COMP-001') {
      res.status(403).json({ success: false, error: 'Unauthorized cross-company access' });
      return;
    }

    if ((authUser.role === 'customer' || authUser.role === 'user') && document.customerId !== authUser.id) {
      res.status(403).json({ success: false, error: 'You do not own this document' });
      return;
    }

    const versionsCol = await documentVersionsCollection();
    const versions = await versionsCol.find({ documentId }).sort({ version: -1 }).toArray();

    res.json({ success: true, data: versions });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/m4/documents/audit/:requestId
 * Get audit trail for a verification request
 */
documentRouter.get('/api/m4/documents/audit/:requestId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { requestId } = req.params;
    const authUser = req.authUser!;

    // Verify access
    const verReqCol = await verificationRequestsCollection();
    const verification = (await verReqCol.findOne({ requestId })) as unknown as VerificationRequest | null;

    if (!verification) {
      res.status(404).json({ success: false, error: 'Verification request not found' });
      return;
    }

    if (authUser.role === 'freight-agent' && verification.companyId !== authUser.companyId || 'COMP-001') {
      res.status(403).json({ success: false, error: 'Unauthorized cross-company access' });
      return;
    }

    const auditCol = await documentAuditLogsCollection();
    const auditLogs = await auditCol.find({ requestId }).sort({ timestamp: -1 }).toArray();

    res.json({ success: true, data: auditLogs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/m4/documents/checklist
 * Create or get document verification checklist
 */
documentRouter.post('/api/m4/documents/checklist', async (req: Request, res: Response): Promise<void> => {
  try {
    const { requestId, requiredDocuments } = req.body;
    const authUser = req.authUser!;

    if (!requestId) {
      res.status(400).json({ success: false, error: 'requestId is required' });
      return;
    }

    // Verify access
    const verReqCol = await verificationRequestsCollection();
    const verification = (await verReqCol.findOne({ requestId })) as unknown as VerificationRequest | null;

    if (!verification) {
      res.status(404).json({ success: false, error: 'Verification request not found' });
      return;
    }

    if (authUser.role === 'freight-agent' && verification.companyId !== authUser.companyId || 'COMP-001') {
      res.status(403).json({ success: false, error: 'Unauthorized cross-company access' });
      return;
    }

    const checklistsCol = await documentChecklistsCollection();
    
    // Check if checklist already exists
    const existingChecklist = await checklistsCol.findOne({ requestId });
    if (existingChecklist) {
      res.json({ success: true, data: existingChecklist });
      return;
    }

    // Create new checklist
    const checklistId = await nextSequence('doc_checklist', 'DCL');
    const defaultRequiredDocs: DocumentChecklistItem[] = requiredDocuments || [
      { documentType: 'COMMERCIAL_INVOICE', required: true, status: 'REQUESTED' },
      { documentType: 'PACKING_LIST', required: true, status: 'REQUESTED' },
      { documentType: 'CUSTOMS_DOCUMENT', required: true, status: 'REQUESTED' },
    ];

    const newChecklist: DocumentVerificationChecklist = {
      checklistId,
      requestId,
      requiredDocuments: defaultRequiredDocs,
      isComplete: false,
    };

    await checklistsCol.insertOne(newChecklist);

    res.status(201).json({ success: true, data: newChecklist });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/m4/documents/checklist/:requestId
 * Update document verification checklist
 */
documentRouter.patch('/api/m4/documents/checklist/:requestId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { requestId } = req.params;
    const { documentType, status, documentId, remarks } = req.body;
    const authUser = req.authUser!;

    if (authUser.role !== 'freight-agent' && authUser.role !== 'customs-officer') {
      res.status(403).json({ success: false, error: 'Only authorized personnel can update checklists' });
      return;
    }

    // Verify access
    const verReqCol = await verificationRequestsCollection();
    const verification = (await verReqCol.findOne({ requestId })) as unknown as VerificationRequest | null;

    if (!verification) {
      res.status(404).json({ success: false, error: 'Verification request not found' });
      return;
    }

    if (authUser.role === 'freight-agent' && verification.companyId !== authUser.companyId || 'COMP-001') {
      res.status(403).json({ success: false, error: 'Unauthorized cross-company access' });
      return;
    }

    const checklistsCol = await documentChecklistsCollection();
    const checklist = await checklistsCol.findOne({ requestId });

    if (!checklist) {
      res.status(404).json({ success: false, error: 'Checklist not found' });
      return;
    }

    // Update the specific document type in the checklist
    const requiredDocs = checklist.requiredDocuments || [];
    const docIndex = requiredDocs.findIndex((d: DocumentChecklistItem) => d.documentType === documentType);

    if (docIndex >= 0) {
      requiredDocs[docIndex].status = status;
      if (documentId) requiredDocs[docIndex].documentId = documentId;
      if (remarks) requiredDocs[docIndex].remarks = remarks;
    } else {
      requiredDocs.push({
        documentType,
        required: true,
        status,
        documentId,
        remarks,
      });
    }

    // Check if all required documents are verified
    const isComplete = requiredDocs
      .filter((d: DocumentChecklistItem) => d.required)
      .every((d: DocumentChecklistItem) => d.status === 'VERIFIED');

    await checklistsCol.updateOne(
      { requestId },
      {
        $set: {
          requiredDocuments: requiredDocs,
          isComplete,
          verifiedBy: authUser.id,
          verifiedAt: new Date().toISOString(),
        }
      }
    );

    const updatedChecklist = await checklistsCol.findOne({ requestId });
    res.json({ success: true, data: updatedChecklist });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/m4/documents/checklist/:requestId
 * Get document verification checklist
 */
documentRouter.get('/api/m4/documents/checklist/:requestId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { requestId } = req.params;
    const authUser = req.authUser!;

    // Verify access
    const verReqCol = await verificationRequestsCollection();
    const verification = (await verReqCol.findOne({ requestId })) as unknown as VerificationRequest | null;

    if (!verification) {
      res.status(404).json({ success: false, error: 'Verification request not found' });
      return;
    }

    if (authUser.role === 'freight-agent' && verification.companyId !== authUser.companyId || 'COMP-001') {
      res.status(403).json({ success: false, error: 'Unauthorized cross-company access' });
      return;
    }

    if ((authUser.role === 'customer' || authUser.role === 'user') && verification.customerId !== authUser.id) {
      res.status(403).json({ success: false, error: 'You do not own this verification request' });
      return;
    }

    const checklistsCol = await documentChecklistsCollection();
    const checklist = await checklistsCol.findOne({ requestId });

    if (!checklist) {
      res.status(404).json({ success: false, error: 'Checklist not found' });
      return;
    }

    res.json({ success: true, data: checklist });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
