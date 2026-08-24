# PLAN - Send Alert Button

## Phase 1: Context & Requirements
**Goal:** Add a "Send Alert" button to the map location popups that triggers a formatted email alert.
**Value Proposition:** Shifts the dashboard from passive observation to active incident response.
**Tech Stack:** Next.js (React-Leaflet, internal API routes), Nodemailer/Resend (Backend).

## Phase 2: Frontend Implementation
1. **Component Update**: Modify the existing map popup component (likely inside `app/(app)/map/page.tsx` or a derived component).
2. **UI Additions**: 
    - Add a `<button>` matching the highlighted red box area inside the Leaflet popup.
    - Style identically to the existing design system (e.g., `#0F172A` background, white text, subtle hover effect, using a `Send` or `BellRing` icon from Lucide).
3. **State Management**:
    - Add an `isSending` state to prevent double-clicks and show a loading spinner on the button.
    - Add a toast notification (success/error) upon API response completion.

## Phase 3: Backend Implementation
1. **API Route**: Create `POST /api/alerts/send`.
2. **Payload Processing**: Accept `locationName`, `riskLevel`, `exposure`, `detectionArea`, and `confidence`.
3. **Email Formatting**: 
    - Construct an HTML email template detailing the alert.
    - Incorporate standard emergency headers.
4. **Dispatcher**:
    - Implement a mailing library (Nodemailer mock or Resend/SendGrid).
    - Handle async dispatch and return standard `200 OK`.

## Phase 4: Verification
- [ ] Hover effect triggers properly in the popup.
- [ ] Click initiates loading state (no UI freeze).
- [ ] API successfully catches and processes the payload.
- [ ] Formatted email output is confirmed.
