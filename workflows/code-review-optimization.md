# Code Review & Optimization — CrochetbySantana

Use this workflow for systematic audits of the codebase: security, data correctness,
performance, and UI quality. Each session has a bounded scope to keep cost per unit of
value low. Sessions are ordered by risk/impact.

## When to Run

- After adding a new major feature (new Netlify function, new Google Sheet, new store action)
- When the site feels slow or unresponsive and you suspect redundant API calls
- When a bug surfaces that should have been caught by a review
- Quarterly maintenance pass

## Ground Rules

1. Read files in groups of 2–3 — don't dump everything at once.
2. Fix issues immediately when found; don't accumulate a list and fix later.
3. Run `npm run build` **once per session** after all fixes, not after each individual change.
4. Commit after every session: `git add . && git commit -m "review: session N — <summary>"`.
5. Sessions are ordered by risk/impact: security → backend logic → state/data flow → UI.

---

## Session 1 — Security Audit

**Files:**
- `netlify/functions/auth.js`
- `netlify/functions/pending.js`
- `netlify/functions/orders.js`
- `netlify/functions/_sheets.js`

**Look for:**
- `console.log` / `console.error` calls that print payloads, emails, passwords, or tokens to Netlify function logs
- Owner password compared in plaintext (`process.env.OWNER_PASSWORD`) — ensure it never appears in logs
- Missing `httpMethod` guards on any handler (every function must reject unexpected methods)
- Client-supplied IDs used directly in sheet range strings without sanitization (e.g. `PENDENTES!A${rowIdx}`) — verify `rowIdx` is always a positive integer before use
- `GOOGLE_SERVICE_ACCOUNT_JSON` and `GOOGLE_SHEET_WRITE_ID` — confirm they are never returned in any API response body
- Any endpoint that performs a destructive action (DELETE, status update) without verifying the caller is the owner

**Known fixes applied (2026-05):**
- Fixed `size=14` JSX syntax error in `ClientPage.jsx`
- Fixed TU checkbox `onChange` — was always resetting horas/consumo to `{ TU: '' }` even when unchecking
- Renamed `URL_FOTO` → `URL_FOTOS` to match actual Google Sheet column name

---

## Session 2 — Netlify Functions: Data Integrity

**Files:**
- `netlify/functions/pending.js`
- `netlify/functions/pieces.js`
- `netlify/functions/medidas.js`
- `netlify/functions/stock.js`
- `netlify/functions/tables.js`

**Look for:**
- `nextId()` in `pending.js` reads the entire PENDENTES sheet on every submission — at high volume this is slow; consider caching or a counter cell
- Sheet header bootstrap logic (e.g. `if (!res.data.values || res.data.values.length === 0)`) — verify it runs before `append`, not after
- `toObjects()` called on a sheet response that may have no rows — confirm it returns `[]` and doesn't throw
- `parseFloat(horas[sz] || 0)` in `pieces.js` — if the user submits a string like `"abc"` this silently writes `NaN` to the sheet; add explicit validation
- `medidas.js` upsert — verify that `existingIdx + 2` correctly maps to the sheet row when the header row exists; off-by-one errors here corrupt existing client data
- Missing required-field checks on POST bodies (e.g. `pending.js` submit allows empty `PECA` for custom pieces — is that intentional?)

---

## Session 3 — Pricing & Business Logic

**Files:**
- `src/lib/pricing.js`
- `src/stores/ownerStore.js` (functions: `setSelectedPending`, `approveRequest`)
- `src/stores/clientStore.js` (function: `submitRequest`)

**Look for:**
- `calculatePrice` throws if piece+size not found in DB_HORAS — confirm every call site wraps it in `try/catch` and surfaces a meaningful error (not a silent empty `catch {}`)
- `isUniqueSize()` in `pricing.js` detects TU by scanning DB_HORAS for a `TAMANHO === 'TU'` row — if a standard-size piece accidentally gets a TU row, it will be misclassified; consider adding an explicit `is_unique_size` flag to DB_RECEITA
- `parseHourlyRate()` falls back to the last row in `valorData` if no tier matches — confirm the DB_VALOR sheet always has a catch-all tier at the end, or add a warning log
- `approveRequest` in ownerStore — `lucro` calculation uses `parseFloat(preco_venda) - custoTotal`; if `preco_venda` is empty string, `lucro` becomes `NaN` and gets written to the sheet; add a guard
- `submitRequest` in clientStore — validation only checks `!peca || !clienteNome || !telefone`; a standard piece with no size selected (`selectedTamanho === ''`) passes validation and sends an empty TAMANHO to the sheet

---

## Session 4 — State Management & API Layer

**Files:**
- `src/stores/ownerStore.js` (full file)
- `src/stores/clientStore.js` (full file)
- `src/lib/api.js`

**Look for:**
- `loadSheets` in both stores uses an empty `catch {}` — a failed sheet load produces no error state and the UI silently shows empty data; add an error state
- `loadOrders` in ownerStore derives `clientsData` from orders — clients who registered but never had an order approved will never appear in the Clientes tab; is this the intended behavior?
- `loadClientHistory` in clientStore uses an empty `catch {}` — same silent-failure problem
- Any store action that calls an API and never sets a loading flag, allowing the user to double-submit
- `api.js` — all errors are thrown as `new Error(data.error || 'HTTP N')` but the HTTP status code is discarded; consider preserving it for better error messages (e.g. 409 Conflict on duplicate phone registration)
- `registerPiece` in ownerStore resets `npHoras` to the standard-sizes shape after save — confirm this also handles the case where the piece was saved as TU (should reset to `{ PP:'', P:'', M:'', G:'', GG:'' }`, not `{ TU:'' }`)

---

## Session 5 — UI: Forms, Validation & Feedback

**Files:**
- `src/pages/ClientPage.jsx`
- `src/pages/OwnerPage.jsx`
- `src/pages/LoginPage.jsx`

**Look for:**
- Order form in `ClientPage` — if a standard piece is selected and no size is chosen, the submit button is not disabled and the request goes through with `TAMANHO: ''`; add a size-required guard
- `MsgBox` in `OwnerPage` — messages are cleared only when a new action is triggered; stale success/error messages from a previous action can mislead the owner
- Catalog item image — `onError` hides the `<img>` element but the surrounding `<a>` link stays visible as an empty clickable area; should show the Package placeholder instead
- `ClientesTab` measurements panel — `medidasMsg` is shared across all clients; opening one client's panel and then another's shows the previous client's save message briefly
- `LoginPage` — no loading/disabled state on the login button; owner can click multiple times and fire multiple auth requests
- Any form `<input type="number">` that accepts negative values where a negative value makes no business sense (e.g. hours, consumption, measurements)

---

## Token-Efficiency Tips

- Check `netlify/functions/` first — that's where data corruption bugs live.
- Run `npm run build` before starting any session to confirm the baseline is clean.
- When a fix changes behavior that other sessions depend on (e.g. adding a field to a sheet row), update the relevant function's JSDoc comment in the same session.
- If a session's scope covers only one or two small files, batch it with the next session to save a round-trip.
