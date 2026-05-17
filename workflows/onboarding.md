# Onboarding — CrochetbySantana

Use this workflow when setting up the project from scratch on a new machine, when
onboarding a collaborator, or after any credential rotation.

---

## Prerequisites

| Requirement | Why |
|---|---|
| Node.js ≥ 18 | Frontend build + Netlify Functions (ESM) |
| Python ≥ 3.10 | Local `tools/` scripts |
| Netlify CLI (`npm i -g netlify-cli`) | Local dev with functions |
| A Google account with the service account JSON | Sheet read/write access |
| A Resend account | Owner email notifications |

---

## Step 1 — Clone and install

```bash
git clone https://github.com/K1NGOD-RJ/crochetbysantana.git
cd crochetbysantana
npm install
pip install -r tools/requirements.txt
```

---

## Step 2 — Create .env

Copy the template and fill in real values:

```bash
cp .env.example .env
```

Open `.env` and set:

| Variable | Where to get it |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Google Cloud Console → IAM → Service Accounts → Keys → Add Key → JSON. Paste the entire JSON as one line. |
| `GOOGLE_SHEET_WRITE_ID` | From the Google Sheets URL: `spreadsheets/d/THIS_PART/edit` |
| `OWNER_PASSWORD` | Choose a strong password — this protects the owner dashboard |
| `RESEND_API_KEY` | resend.com → API Keys |
| `OWNER_EMAIL` | The email address that receives order notifications |

> **Important:** The service account email must have **Editor** access to the Google Sheet (Share → add the service account email).

---

## Step 3 — Verify sheet structure

Before running the app, confirm the Google Sheet has all required tabs:

```bash
python tools/check_sheets.py
```

Expected output: all tabs listed as `OK`. If any tabs are missing, create them
manually in Google Sheets with the headers listed in `tools/check_sheets.py`
under `REQUIRED_STRUCTURE`.

---

## Step 4 — Run locally

```bash
netlify dev
```

This starts both the Vite frontend (port 8888) and the Netlify Functions.
The `.env` variables are automatically loaded by Netlify CLI.

- Client page: http://localhost:8888/
- Owner page: http://localhost:8888/owner
- Login page: http://localhost:8888/login

---

## Step 5 — Deploy to Netlify

1. Push to `main` — Netlify auto-deploys from this branch.
2. Set all env variables in **Netlify dashboard → Site settings → Environment variables**:
   - `GOOGLE_SERVICE_ACCOUNT_JSON`
   - `GOOGLE_SHEET_WRITE_ID`
   - `OWNER_PASSWORD`
   - `RESEND_API_KEY`
   - `OWNER_EMAIL`
3. Trigger a redeploy after setting variables.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Catalog shows no images | `URL_FOTOS` column empty or wrong format | Paste direct image URL (or Google Drive share link) into `DB_CATALOGO.URL_FOTOS` |
| Owner email not arriving | Wrong `RESEND_API_KEY` or `OWNER_EMAIL` not on the same Resend account | Check Resend dashboard → Logs; verify `OWNER_EMAIL` domain is verified or use the account-owner email |
| `check_sheets.py` fails auth | Service account not shared on the sheet | Share the Google Sheet with the service account email (Editor role) |
| Functions return 500 | `GOOGLE_SERVICE_ACCOUNT_JSON` has unescaped newlines | Paste the JSON as a **single line** — replace literal newlines in `private_key` with `\n` |
