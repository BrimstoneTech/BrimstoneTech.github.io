# ForgeDesk — quotation & invoice builder

`forgedesk.html` + `forgedesk.css` + `forgedesk.js`. Standalone page, **not linked from
the public navigation** and marked `noindex`. No build step, no third-party runtime
dependency (only the Google Fonts stylesheet and `logo.png`, same as the rest of the site).

## Usage

1. Open `forgedesk.html` in a browser (or `https://brimstonetech.github.io/forgedesk.html`
   once deployed).
2. The **Seller** card starts with `BrimstoneTech`, `TAISAN — Isaiah Talemwa`,
   `brimstonetech1@gmail.com`, `Kampala, Uganda` and the official website.
   `Business registration no.` and `TIN` remain blank on purpose — enter only official
   values once issued. Until every required field is filled,
   an ember setup warning shows at the top and the preview is stamped
   `DRAFT — SETUP INCOMPLETE`.
3. Pick **Quotation** or **Invoice**. Switching regenerates the document number
   (`QUO-YYYY-0001` / `INV-YYYY-0001`) and relabels the second date field
   (`Valid until` vs `Payment due`).
4. Add line items: description, quantity, unit price, per-line discount %.
5. Optional: document-level discount %, shipping/other charge, tax label + rate,
   "apply tax", "unit prices already include tax" (tax-inclusive back-calculation).
6. Add notes, terms, payment details.
7. **Print / Save PDF** → browser print dialog, A4 layout, editor chrome hidden.

## Calculations

```
line amount     = qty × unit price × (1 − line discount% / 100)
items subtotal  = Σ line amounts
gross           = items subtotal − (subtotal × doc discount%) + shipping
tax exclusive:  net = gross;              tax = gross × rate%;  total = net + tax
tax inclusive:  net = gross / (1+rate%);  tax = gross − net;    total = gross
```

All money values are rounded to 2 decimals at each step. UGX and KES display with
0 decimals; USD/EUR/GBP with 2.

## Storage & privacy

- Everything lives in `localStorage` under `brimstone.forgedesk.v1`. Nothing is uploaded.
- The deployment is unlisted, not authenticated: anyone with the direct URL can open a
  fresh copy, but browser-local documents are not visible to other visitors.
- Multiple documents supported: open, duplicate, delete from the saved-documents list.
- **Export JSON** writes `forgedesk-YYYY-MM-DD.json` (all documents) — the only real backup.
- **Import JSON** appends documents, re-issuing IDs on collision. Malformed files are
  rejected with a status message.
- **Delete all data** removes the storage key. Private-mode/quota failures are surfaced
  in the status line instead of failing silently.
- Autosave fires on every keystroke.

## Limitations / not included

- **Not an EFRIS fiscal document.** Output has no URA fiscal document number,
  verification code or QR code. VAT-registered taxpayers must use EFRIS. URA has
  also extended mandatory EFRIS use to specified non-VAT sectors, including ICT,
  subject to the applicable turnover rules. ForgeDesk output is a quotation,
  proforma or branded supporting copy; fiscalise the actual sale through EFRIS.
  Verify the current rules at `https://ura.go.ug/en/efris/` before first use.
- No legal, tax or accounting advice. Not accounting software. No ledger, no payment
  tracking, no partial payments, no credit notes, no withholding tax, no multi-rate tax
  per line (one rate per document), no FX conversion.
- No registration numbers or TINs are pre-filled or generated anywhere in the code.
  Never invent one.
- No sync across browsers/devices/profiles; clearing site data deletes documents.
- Print output depends on the browser's print engine; check the preview before sending.

## Implementation notes

- All user text is escaped before insertion (`esc` / `escLines`), so descriptions with
  `<`, `&`, quotes render literally — no HTML injection through document data.
- Numeric inputs are coerced with `Number.isFinite` guards; percentages clamped 0–100.
- Accessibility: labelled inputs, `aria-pressed` type switch, `aria-invalid` on missing
  required fields, `role="status"` live save line, visible focus rings, per-row aria-labels.
- Responsive: two-column desk ≥1080px, stacked below, single-column form and stacked
  line-item rows ≤640px.
