# Milestone 4: Implementation Analysis

## A. Current Architecture
The current application uses a Vite + React frontend and an Express + MongoDB backend. The system is split into two major roles currently represented in the frontend: Customer (Shipper) and Freight Agent (Broker/Operations). 
- **Frontend**: React application with multiple views toggled by state (`workspaceView`, `activePublicTab`). Key components include `CustomerPortalView`, `FreightAgentPortalView`, `CalculationForm`, and `QuotationsView`.
- **Backend**: Express server running on port 3000. It includes routes for tariffs, quotes, feedback, master data, auth, and M3 features (risk, customs, weather).
- **Database**: MongoDB with collections such as `users`, `quotes`, `shipments`, `audit_logs`, `agent_runs`, `documents`, and `customs_checks`. The DB connection is managed in `database.ts`.

## B. Relevant Existing Files
- `src/App.tsx`: Main routing and state management.
- `src/types.ts`: TypeScript interfaces for `SavedQuotation`, `AuditLogRecord`, `ShipmentStatus`, etc.
- `src/components/CustomerPortalView.tsx`: Customer dashboard for tracking and quoting.
- `src/components/FreightAgentPortalView.tsx`: Freight Agent dashboard for reviewing and dispatching quotes.
- `src/components/BrokerQuoteReviewModal.tsx`: Agent interface to review quotes.
- `src/backend/db/database.ts`: MongoDB configuration and schema mappings.
- `src/backend/app.ts`: Express application setup.

## C. Existing Database Models (Collections)
- `users`: Stores user accounts and roles.
- `quotes`: Stores quotations (`SavedQuotation` structure).
- `quote_audit_logs` & `audit_logs`: Audit trailing.
- `shipments`: Shipment records.
- `documents`: Document handling.
- `risk_assessments`, `weather_assessments`, `customs_checks`: M3 context collections.

## D. Existing API Endpoints
- `/api/quotes`: Quote creation, retrieval.
- `/api/v1/master-data`: Fetching ports, customers, carriers.
- `/api/auth`: Authentication and role assignment.
- `/api/milestone3Routes`: Handles M3 risk scoring, customs checks, and weather alerts.

## E. Existing Authentication and Roles
Authentication handles JWT sessions mapped to user roles.
Existing roles: `customer`, `user`, `shipper`, `freight-agent`, `customs-officer`, `admin`, `broker`, `business`.

## F. Existing Frontend Pages
- `CustomerPortalView`: Overview, creation, my-shipments, my-quotations, tracking.
- `FreightAgentPortalView`: Operations overview, cargo tracking, route optimizer, carrier bidding, quote review queue.
- `AdminDashboardView`: System monitoring.
- `CustomsOfficerPortalView`: Customs clearance workflows.

## G. Existing M1-M3 Integration Points
- **M1 (Routing)**: `runRouteAgent` provides recommended routes based on parameters.
- **M2 (Pricing)**: ML pricing and tariff breakdowns are calculated using `calculateTariffBreakdown`.
- **M3 (Risk/Customs)**: `validateCustomsCompliance` generates customs cases and readiness scores which are attached to quotes.

## H. M4 Functionality Missing
- **First-class Company Entity**: No standalone company collection for freight agencies.
- **Multiple Freight Company Options**: Customer currently does not select from multiple distinct freight companies, only carriers via the spot bidding.
- **Quote Snapshotting**: No formal immutable snapshot of a quote preserving M1-M3 context when selected or revised.
- **QuoteSelection & VerificationRequest**: No formal `VerificationRequest` process linking a specific company's agent to a selected quote.
- **Company-level Data Isolation**: Agents see all pending quotes, not filtered by their specific freight company. Server-side isolation is missing.
- **Document Privacy**: Document access lacks strict backend authorization controls.
- **Agent Verification Checklist**: No granular checklist for Shipment, Cargo, Capacity, Route, Schedule, Document, and Commercial verification.
- **Advanced Agent Actions**: MODIFY, REJECT, REQUEST INFORMATION are missing or rudimentary.
- **Quote Revision (No Overwrite)**: Original quote needs preservation when revisions occur. Separate lifecycles for revisions.
- **Customer Revision Action**: Customer accept/reject of revisions and upload of missing info.
- **Final Booking Creation**: `Booking` reference generation post-verification containing the immutable quote.
- **Quote Expiry & Fallback**: Backend enforcement of expiry. Idempotency against multiple selections. Reverting to alternate quotes if the primary is rejected.

## I. Proposed M4 Schema Design

1. **Companies (New Collection)**:
   - `companyId`, `name`, `code`, `isActive` (boolean), `createdAt`

2. **Users (Update)**:
   - Add `companyId` (references `Companies.companyId`) for freight-agent users.

3. **Quotes (Update)**:
   - `companyId` (references `Companies.companyId`)
   - `version` (integer, starts at 1)
   - `parentQuoteId` (null for original, references parent quote if revision)
   - `modificationReason` (text)
   - `expiresAt` (Date)
   - *Status lifecycle*: separate from Verification status (e.g., DRAFT, ISSUED, SELECTED, EXPIRED, SUPERSEDED)

4. **VerificationRequests (New Collection)**:
   - `requestId`
   - `quoteId` (references Quote)
   - `quoteSnapshot` (immutable object storing M1 route, M2 pricing, M3 risk context, and cargo specs at the exact time of selection/revision)
   - `customerId`, `companyId`
   - `status` (PENDING, IN_PROGRESS, INFO_REQUESTED, REVISION_ISSUED, APPROVED, REJECTED)
   - `checklist`: { shipment: boolean, cargo: boolean, capacity: boolean, route: boolean, schedule: boolean, document: boolean, commercial: boolean }
   - `missingInfoRequested`: string[]
   - `createdAt`, `updatedAt`

5. **Bookings (New Collection)**:
   - `bookingRef`
   - `quoteId` (the specific quote/revision ID booked)
   - `quoteVersion`
   - `shipmentId`
   - `companyId`
   - `customerId`
   - `quoteSnapshot` (immutable copy of the finalized quote containing all M1-M3 details and pricing)
   - `status` (CONFIRMED, CANCELLED)
   - `createdAt`

## J. Updated API Design
- `POST /api/quotes/select`: Customer selects a quote. Validates expiry and idempotency (no duplicate verification request for the same quote). Generates a `VerificationRequest` with a `quoteSnapshot`.
- `GET /api/verifications`: Agents fetch requests. Backend MUST filter strictly by `req.authUser.companyId` unless `admin`.
- `PATCH /api/verifications/:id`: Agent updates verification checklist.
- `POST /api/verifications/:id/action`: Agent performs APPROVE, MODIFY (creates new quote revision, marks parent SUPERSEDED), REJECT, or REQUEST_INFO.
- `POST /api/quotes/:id/customer-action`: Customer ACCEPTS or REJECTS revision. Validates expiry and idempotency.
- `POST /api/bookings`: Finalize an approved quote into a Booking. Creates immutable snapshot.
- `GET /api/documents/:id`: Document fetch endpoint. Enforces privacy (Customer can view their own, Agent can view if linked to a VerificationRequest assigned to their `companyId`).

## K. Updated Status Lifecycles
- **Quote Lifecycle**: 
  - `ISSUED` (Available for customer)
  - `SELECTED` (Customer initiated verification)
  - `EXPIRED` (Backend enforced based on `expiresAt`)
  - `SUPERSEDED` (Agent created a revision)
  - `ACCEPTED` (Customer accepted the final quote or revision)
  - `REJECTED` (Agent declined, or customer declined revision)
- **Verification Request Lifecycle**:
  - `PENDING` -> `IN_PROGRESS` -> `INFO_REQUESTED` -> `REVISION_ISSUED` (if modified) -> `APPROVED` (if Agent approves or Customer accepts revision) -> `REJECTED`
- **Booking Lifecycle**:
  - `CONFIRMED` -> `COMPLETED` / `CANCELLED`

## L. Updated Company Isolation & Security
- **Backend Authorization**: The API will never trust a `companyId` payload from the frontend. It will exclusively derive the `companyId` from the authenticated JWT session.
- **Document Privacy**: A middleware/check on the document retrieval route will verify:
  - If user is Customer: check `document.ownerId == req.authUser.id`.
  - If user is Agent: check if the document is linked to a `quoteId`/`shipmentId` associated with `req.authUser.companyId`.
  - Failures result in 403 Forbidden.
- **Admin Bypass**: Users with the `admin` role bypass company-level and ownership isolation.

## M. Updated Quote Snapshot Design
Whenever a `VerificationRequest` or `Booking` is created, the system copies the `Quote` object into an immutable `quoteSnapshot` field. This snapshot preserves:
- The `company` information at the time.
- Final price and currency.
- `formData` (Shipment/Cargo specs).
- Tariff breakdowns (M2 AI pricing).
- Route selection (M1 routing).
- Customs checks, weather alerts, risk assessments (M3 context).
- Version and validity.
If an agent modifies a quote, M1-M3 contexts are simply copied to the new revision unless the agent explicitly changed parameters requiring re-evaluation. The original quote is marked `SUPERSEDED` and remains untouched.

## N. Idempotency & Expiry
- **Expiry**: Quotes carry an `expiresAt` timestamp. Endpoints like `/api/quotes/select` and `/api/quotes/:id/customer-action` will return 400 Bad Request if `Date.now() > quote.expiresAt`.
- **Idempotency**: Selecting a quote checks if a `VerificationRequest` already exists for that `quoteId`. Accepting a revision checks if a `Booking` already exists. Unique indexes will be applied in MongoDB (`VerificationRequests.quoteId`, `Bookings.quoteId`) to enforce consistency.

## O. Minimizing App.tsx Changes
We will avoid redesigning `App.tsx` state by:
- Creating dedicated child components for M4 (e.g. `M4AgentVerificationDashboard.tsx`, `M4CustomerComparison.tsx`) and conditionally rendering them inside existing empty tabs or modifying only the content inside `workspaceView === 'quotations'`.
- Leaving the M1-M3 generation pipelines exactly as they are. M4 will act strictly upon the resulting `SavedQuotation` objects produced by M3.

## P. Implementation Order
1. **Data Models & Setup**: Create `Companies` collection, update `Users`, `Quotes`. Seed mock companies and assign to agent accounts.
2. **Backend Security & Routes**: Build the isolation middleware. Implement Verification, Revision, and Booking routes with snapshotting, idempotency, and expiry.
3. **Frontend Services**: Create M4 API clients for fetching verification requests and performing actions.
4. **Agent Dashboard (M4)**: Build the Agent Verification Checklist component within `FreightAgentPortalView`.
5. **Customer Dashboard (M4)**: Build Quote selection, revision review, and fallback mechanics within `CustomerPortalView`.
6. **Integration & Polish**: Tie end-to-end flows, ensuring M3 risk context seamlessly copies over to snapshots and bookings.
