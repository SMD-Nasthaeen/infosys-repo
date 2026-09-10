import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { quotesCollection, verificationRequestsCollection, bookingsCollection, documentsCollection, nextSequence } from '../db/database';
import { SavedQuotation, VerificationRequest, Booking, VerificationChecklist } from '../../types';

export const m4Router = Router();

// Middleware to apply requireAuth to all routes in this router
m4Router.use(requireAuth);

/**
 * 1. POST /api/quotes/select
 * Customer selects a quote -> Creates VerificationRequest
 */
m4Router.post('/api/quotes/select', async (req: Request, res: Response): Promise<void> => {
  try {
    const { quoteId } = req.body;
    if (!quoteId) {
      res.status(400).json({ success: false, error: 'quoteId is required' });
      return;
    }

    const authUser = req.authUser!;
    if (authUser.role !== 'user' && authUser.role !== 'customer') {
      res.status(403).json({ success: false, error: 'Only customers can select quotes' });
      return;
    }

    const quotesCol = await quotesCollection();
    const quote = (await quotesCol.findOne({ id: quoteId })) as unknown as SavedQuotation | null;

    if (!quote) {
      res.status(404).json({ success: false, error: 'Quote not found' });
      return;
    }

    // 3. Verify the customer is allowed to access/select that quote
    // For M1-M3 quotes, it's either generic or assigned to the shipper
    // We assume if it's not EXPIRED, DRAFT, etc., it can be selected.
    if (quote.shipperEmail && quote.shipperEmail !== authUser.email) {
      res.status(403).json({ success: false, error: 'You are not authorized to select this quote' });
      return;
    }

    // 4 & 5 & 6. Verify quote is active and not expired
    if (quote.status === 'EXPIRED') {
      res.status(400).json({ success: false, error: 'Quote is expired' });
      return;
    }
    if (quote.expiresAt && Date.now() > new Date(quote.expiresAt).getTime()) {
      res.status(400).json({ success: false, error: 'Quote is expired' });
      return;
    }

    const verReqCol = await verificationRequestsCollection();
    // 7. Prevent duplicate selection
    const existingReq = await verReqCol.findOne({ quoteId });
    if (existingReq) {
      res.status(409).json({ success: false, error: 'A verification request for this quote already exists' });
      return;
    }

    // 8 & 9. Create a VerificationRequest with an IMMUTABLE quoteSnapshot
    const requestId = await nextSequence('verification_request', 'VRQ');
    const companyId = quote.companyId || 'COMP-001'; // Fallback for old quotes

    const newReq: VerificationRequest = {
      requestId,
      quoteId,
      quoteSnapshot: { ...quote },
      customerId: authUser.id,
      companyId,
      status: 'PENDING',
      checklist: {
        shipment: false,
        cargo: false,
        capacity: false,
        route: false,
        schedule: false,
        document: false,
        commercial: false,
      },
      missingInfoRequested: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await verReqCol.insertOne(newReq);
    
    // Update quote status
    await quotesCol.updateOne({ id: quoteId }, { $set: { status: 'SELECTED' } });

    res.status(201).json({ success: true, data: newReq });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 2. GET /api/verifications
 * Freight Agent: return ONLY requests belonging to req.authUser.companyId
 * Customer: return ONLY their own requests
 * Admin: all
 */
m4Router.get('/api/verifications', async (req: Request, res: Response): Promise<void> => {
  try {
    const authUser = req.authUser!;
    const verReqCol = await verificationRequestsCollection();

    let query: any = {};
    if (authUser.role === 'freight-agent') {
      if (!authUser.companyId) {
        res.status(403).json({ success: false, error: 'Agent is not associated with any company' });
        return;
      }
      query.companyId = authUser.companyId;
    } else if (authUser.role === 'user' || authUser.role === 'customer') {
      query.customerId = authUser.id;
    } else if (authUser.role === 'admin' || authUser.role === 'customs-officer') {
      // no filter
    } else {
      res.status(403).json({ success: false, error: 'Unauthorized access' });
      return;
    }

    const requests = await verReqCol.find(query).toArray();
    res.json({ success: true, data: requests });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 3. GET /api/verifications/:id
 */
m4Router.get('/api/verifications/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const authUser = req.authUser!;
    const verReqCol = await verificationRequestsCollection();

    const request = (await verReqCol.findOne({ requestId: id })) as unknown as VerificationRequest | null;
    if (!request) {
      res.status(404).json({ success: false, error: 'Verification request not found' });
      return;
    }

    // Authorization Check
    if (authUser.role === 'freight-agent') {
      if (request.companyId !== authUser.companyId) {
        res.status(403).json({ success: false, error: 'Unauthorized cross-company access' });
        return;
      }
    } else if (authUser.role === 'user' || authUser.role === 'customer') {
      if (request.customerId !== authUser.id) {
        res.status(403).json({ success: false, error: 'Unauthorized access' });
        return;
      }
    } else if (authUser.role === 'admin' || authUser.role === 'customs-officer') {
      // Unconditional access for global roles
    } else {
      res.status(403).json({ success: false, error: 'Unauthorized access' });
      return;
    }

    res.json({ success: true, data: request });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 4. PATCH /api/verifications/:id
 * Agent updates checklist
 */
m4Router.patch('/api/verifications/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { checklist } = req.body;
    const authUser = req.authUser!;

    if (authUser.role !== 'freight-agent' && authUser.role !== 'customs-officer') {
      res.status(403).json({ success: false, error: 'Only authorized personnel can update checklists' });
      return;
    }

    const verReqCol = await verificationRequestsCollection();
    const request = (await verReqCol.findOne({ requestId: id })) as unknown as VerificationRequest | null;
    if (!request) {
      res.status(404).json({ success: false, error: 'Verification request not found' });
      return;
    }

    if (authUser.role === 'freight-agent') {
      if (request.companyId !== authUser.companyId) {
        res.status(403).json({ success: false, error: 'Unauthorized cross-company access' });
        return;
      }
    }

    if (!checklist || typeof checklist !== 'object') {
      res.status(400).json({ success: false, error: 'Invalid checklist format' });
      return;
    }

    // Only allow updating boolean checklist fields
    const updatedChecklist = { ...request.checklist };
    for (const key of Object.keys(updatedChecklist)) {
      if (typeof checklist[key] === 'boolean') {
        (updatedChecklist as any)[key] = checklist[key];
      }
    }

    const updateDoc: any = {
      $set: {
        checklist: updatedChecklist,
        updatedAt: new Date().toISOString(),
      },
    };

    if (request.status === 'PENDING') {
      updateDoc.$set.status = 'IN_PROGRESS';
    }

    await verReqCol.updateOne({ requestId: id }, updateDoc);
    
    const finalReq = await verReqCol.findOne({ requestId: id });
    res.json({ success: true, data: finalReq });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 5. POST /api/verifications/:id/action
 * APPROVE, MODIFY, REJECT, REQUEST_INFO
 */
m4Router.post('/api/verifications/:id/action', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action, missingInfoRequested, modificationReason, modifiedQuoteData } = req.body;
    const authUser = req.authUser!;

    if (authUser.role !== 'freight-agent' && authUser.role !== 'customs-officer') {
      res.status(403).json({ success: false, error: 'Only authorized personnel can perform this action' });
      return;
    }

    const verReqCol = await verificationRequestsCollection();
    const request = (await verReqCol.findOne({ requestId: id })) as unknown as VerificationRequest | null;
    if (!request) {
      res.status(404).json({ success: false, error: 'Verification request not found' });
      return;
    }

    if (authUser.role === 'freight-agent') {
      if (request.companyId !== authUser.companyId) {
        res.status(403).json({ success: false, error: 'Unauthorized cross-company access' });
        return;
      }
    }

    const quotesCol = await quotesCollection();
    const originalQuote = (await quotesCol.findOne({ id: request.quoteId })) as unknown as SavedQuotation | null;
    if (!originalQuote) {
      res.status(404).json({ success: false, error: 'Original quote not found' });
      return;
    }

    // Check expiry
    if (originalQuote.expiresAt && Date.now() > new Date(originalQuote.expiresAt).getTime()) {
      res.status(400).json({ success: false, error: 'Original quote has expired' });
      return;
    }

    const nowIso = new Date().toISOString();

    switch (action) {
      case 'APPROVE':
        await verReqCol.updateOne({ requestId: id }, { $set: { status: 'APPROVED', updatedAt: nowIso } });
        
        // Phase 4/5: Booking Auto-Creation for customs-officer
        if (authUser.role === 'customs-officer') {
           const bookCol = await bookingsCollection();
           // Check by verificationRequestId to prevent duplicates even if quote is revised
           const existingBooking = await bookCol.findOne({ verificationRequestId: id });
           
           if (!existingBooking) {
             const bookingRef = await nextSequence('booking', 'BKG');
             const targetQuote = request.revisedQuoteSnapshot || request.quoteSnapshot;
             const targetQuoteId = request.revisedQuoteId || request.quoteId;
             
             const newBooking: Booking = {
                bookingRef,
                quoteId: targetQuoteId,
                quoteVersion: targetQuote.version || 1,
                shipmentId: targetQuote.shipmentId || 'PENDING',
                companyId: targetQuote.companyId || request.companyId || 'COMP-001',
                customerId: request.customerId,
                quoteSnapshot: { ...targetQuote },
                status: 'CONFIRMED',
                verificationRequestId: id,
                createdAt: nowIso,
                updatedAt: nowIso,
             };
             await bookCol.insertOne(newBooking);
           }
        }
        res.json({ success: true, message: 'Verification Approved' });
        break;

      case 'REJECT':
        await verReqCol.updateOne({ requestId: id }, { $set: { status: 'REJECTED', updatedAt: nowIso } });
        await quotesCol.updateOne({ id: request.quoteId }, { $set: { status: 'REJECTED' } });
        res.json({ success: true, message: 'Verification Rejected' });
        break;

      case 'REQUEST_INFO':
        if (!Array.isArray(missingInfoRequested)) {
          res.status(400).json({ success: false, error: 'missingInfoRequested must be an array' });
          return;
        }
        await verReqCol.updateOne(
          { requestId: id },
          { $set: { status: 'INFO_REQUESTED', missingInfoRequested, updatedAt: nowIso } }
        );
        res.json({ success: true, message: 'Info Requested' });
        break;

      case 'MODIFY':
        if (!modificationReason) {
          res.status(400).json({ success: false, error: 'modificationReason is required for MODIFY action' });
          return;
        }
        
        // Mark original as SUPERSEDED
        await quotesCol.updateOne({ id: request.quoteId }, { $set: { status: 'SUPERSEDED' } });

        const newVersion = (originalQuote.version || 1) + 1;
        const newQuoteId = await nextSequence('quote', 'QT');

        const revisedQuote: SavedQuotation = {
          ...originalQuote,
          id: newQuoteId,
          version: newVersion,
          parentQuoteId: originalQuote.id,
          modificationReason,
          status: 'ISSUED', // Issued for customer to accept
          createdAt: nowIso,
          // Merge any modifiedQuoteData safely if needed, preserving M1-M3 context
          ...(modifiedQuoteData || {}),
        };
        // Safely remove MongoDB _id if spread operator caught it from the database result
        if ((revisedQuote as any)._id) delete (revisedQuote as any)._id;

        await quotesCol.insertOne(revisedQuote);
        
        // Update the verification request with the new revised quote ID and snapshot
        await verReqCol.updateOne(
          { requestId: id },
          { 
            $set: { 
              status: 'REVISION_ISSUED',
              revisedQuoteId: newQuoteId,
              revisedQuoteSnapshot: { ...revisedQuote },
              updatedAt: nowIso
            } 
          }
        );
        res.json({ success: true, message: 'Quote Revision Issued', data: revisedQuote });
        break;

      default:
        res.status(400).json({ success: false, error: 'Invalid action' });
        break;
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 6. POST /api/quotes/:id/customer-action
 * ACCEPT, REJECT
 */
m4Router.post('/api/quotes/:id/customer-action', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    const authUser = req.authUser!;

    if (authUser.role !== 'user' && authUser.role !== 'customer') {
      res.status(403).json({ success: false, error: 'Only customers can perform this action' });
      return;
    }

    const quotesCol = await quotesCollection();
    const quote = (await quotesCol.findOne({ id })) as unknown as SavedQuotation | null;
    
    if (!quote) {
      res.status(404).json({ success: false, error: 'Quote not found' });
      return;
    }

    if (quote.shipperEmail && quote.shipperEmail !== authUser.email) {
      res.status(403).json({ success: false, error: 'You do not own this quote' });
      return;
    }

    if (quote.status === 'EXPIRED' || (quote.expiresAt && Date.now() > new Date(quote.expiresAt).getTime())) {
      res.status(400).json({ success: false, error: 'Quote is expired' });
      return;
    }

    if (action === 'ACCEPT') {
      const targetQuoteId = quote.id; // Could be original or revised
      if (quote.status === 'ACCEPTED') {
        res.status(409).json({ success: false, error: 'Quote is already accepted' });
        return;
      }
      await quotesCol.updateOne({ id: targetQuoteId }, { $set: { status: 'ACCEPTED' } });
      
      const verReqCol = await verificationRequestsCollection();
      // If we accepted a revision, we might be looking at revisedQuoteId
      await verReqCol.updateOne(
        { $or: [{ quoteId: targetQuoteId }, { revisedQuoteId: targetQuoteId }] }, 
        { $set: { status: 'APPROVED', updatedAt: new Date().toISOString() } }
      );

      res.json({ success: true, message: 'Quote Accepted' });
    } else if (action === 'REJECT') {
      const targetQuoteId = quote.id;
      await quotesCol.updateOne({ id: targetQuoteId }, { $set: { status: 'REJECTED' } });
      
      const verReqCol = await verificationRequestsCollection();
      await verReqCol.updateOne(
        { $or: [{ quoteId: targetQuoteId }, { revisedQuoteId: targetQuoteId }] }, 
        { $set: { status: 'REJECTED', updatedAt: new Date().toISOString() } }
      );

      res.json({ success: true, message: 'Quote Rejected' });
    } else {
      res.status(400).json({ success: false, error: 'Invalid action' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 7. POST /api/bookings
 * Create Booking from ACCEPTED quote
 */
m4Router.post('/api/bookings', async (req: Request, res: Response): Promise<void> => {
  try {
    const { quoteId } = req.body;
    const authUser = req.authUser!;

    if (authUser.role !== 'user' && authUser.role !== 'customer') {
      res.status(403).json({ success: false, error: 'Only customers can create bookings' });
      return;
    }

    const quotesCol = await quotesCollection();
    const quote = (await quotesCol.findOne({ id: quoteId })) as unknown as SavedQuotation | null;
    if (!quote) {
      res.status(404).json({ success: false, error: 'Quote not found' });
      return;
    }

    if (quote.shipperEmail && quote.shipperEmail !== authUser.email) {
      res.status(403).json({ success: false, error: 'You do not own this quote' });
      return;
    }

    if (quote.status !== 'ACCEPTED') {
      res.status(400).json({ success: false, error: 'Quote must be ACCEPTED before booking' });
      return;
    }

    if (quote.expiresAt && Date.now() > new Date(quote.expiresAt).getTime()) {
      res.status(400).json({ success: false, error: 'Quote is expired' });
      return;
    }

    const bookCol = await bookingsCollection();
    const existingBooking = await bookCol.findOne({ quoteId });
    if (existingBooking) {
      res.status(409).json({ success: false, error: 'Booking already exists for this quote version' });
      return;
    }

    const bookingRef = await nextSequence('booking', 'BKG');
    
    const newBooking: Booking = {
      bookingRef,
      quoteId: quote.id,
      quoteVersion: quote.version || 1,
      shipmentId: quote.shipmentId || 'PENDING',
      companyId: quote.companyId || 'COMP-001',
      customerId: authUser.id,
      quoteSnapshot: { ...quote },
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await bookCol.insertOne(newBooking);
    res.status(201).json({ success: true, data: newBooking });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 8. GET /api/documents/:id
 * Privacy enforcement
 */
m4Router.get('/api/documents/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const authUser = req.authUser!;
    
    const docCol = await documentsCollection();
    const document = (await docCol.findOne({ id })) as any;
    if (!document) {
      res.status(404).json({ success: false, error: 'Document not found' });
      return;
    }

    if (authUser.role === 'admin') {
      res.json({ success: true, data: document });
      return;
    }

    if (authUser.role === 'user' || authUser.role === 'customer') {
      if (document.ownerId !== authUser.id) {
        res.status(403).json({ success: false, error: 'Unauthorized access' });
        return;
      }
    } else if (authUser.role === 'freight-agent') {
      // Need to verify if document is linked to a quote/shipment of this company
      // This logic checks if document companyId matches, or checks verifications/quotes
      // We assume document has companyId stored OR we look it up.
      // For safe simulation, we just check document.companyId
      if (document.companyId && document.companyId !== authUser.companyId) {
         res.status(403).json({ success: false, error: 'Unauthorized cross-company access' });
         return;
      }
      // Or check via quoteId if document contains it
      if (document.quoteId) {
        const quotesCol = await quotesCollection();
        const q = await quotesCol.findOne({ id: document.quoteId });
        if (q && q.companyId !== authUser.companyId) {
          res.status(403).json({ success: false, error: 'Unauthorized cross-company access' });
          return;
        }
      }
    } else {
      res.status(403).json({ success: false, error: 'Unauthorized access' });
      return;
    }

    res.json({ success: true, data: document });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 9. GET /api/bookings
 * Securely fetch bookings based on user role
 */
m4Router.get('/api/bookings', async (req: Request, res: Response): Promise<void> => {
  try {
    const authUser = req.authUser!;
    const bookCol = await bookingsCollection();

    let query: any = {};
    if (authUser.role === 'customer' || authUser.role === 'user') {
      query.customerId = authUser.id;
    } else if (authUser.role === 'freight-agent') {
      if (!authUser.companyId) {
        res.status(403).json({ success: false, error: 'Agent is not associated with any company' });
        return;
      }
      query.companyId = authUser.companyId;
    } else if (authUser.role === 'admin' || authUser.role === 'customs-officer') {
      // Admin and customs officers can see all bookings
    } else {
      res.status(403).json({ success: false, error: 'Unauthorized access' });
      return;
    }

    const bookings = await bookCol.find(query).toArray();
    res.json({ success: true, data: bookings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 10. GET /api/bookings/:id
 * Securely fetch a single booking
 */
m4Router.get('/api/bookings/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const authUser = req.authUser!;
    const bookCol = await bookingsCollection();

    const booking = await bookCol.findOne({ bookingRef: id }) as unknown as Booking | null;
    if (!booking) {
      res.status(404).json({ success: false, error: 'Booking not found' });
      return;
    }

    // Enforce authorization checks
    if (authUser.role === 'customer' || authUser.role === 'user') {
      if (booking.customerId !== authUser.id) {
        res.status(403).json({ success: false, error: 'Unauthorized access' });
        return;
      }
    } else if (authUser.role === 'freight-agent') {
      if (booking.companyId !== authUser.companyId) {
        res.status(403).json({ success: false, error: 'Unauthorized cross-company access' });
        return;
      }
    } else if (authUser.role === 'admin' || authUser.role === 'customs-officer') {
      // Unconditional access
    } else {
      res.status(403).json({ success: false, error: 'Unauthorized access' });
      return;
    }

    res.json({ success: true, data: booking });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
