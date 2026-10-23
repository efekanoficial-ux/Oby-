# Implementation Plan: Admin-Driven Bank Transfer Icon

- Update `firebase-blueprint.json` to include `bankTransferIconURL` in `PaymentSettings`.
- Update `src/pages/admin.tsx`:
    - Add a file input or URL input for `bankTransferIconURL` in the Payment Settings section.
    - Update `handleSavePaymentSettings` to save this URL.
- Update `src/components/bank-transfer-icon.tsx`:
    - Use `useAuth` hook to fetch `paymentSettings`.
    - Use `paymentSettings.bankTransferIconURL` if present, otherwise fallback to default `/Picsart_26-10-14_15-00-33-409.png`.
