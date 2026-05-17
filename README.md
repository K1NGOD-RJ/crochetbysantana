# CrochetbySantana

Business management app for a crochet shop. Clients browse a catalog and submit
orders; the owner reviews, prices, and approves them. Google Sheets acts as the
database.

**Live site:** [crochetbysantana.netlify.app](https://crochetbysantana.netlify.app)

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite, Tailwind CSS, Zustand |
| Backend | Netlify Functions (Node.js serverless) |
| Database | Google Sheets (via service account) |
| Auth | bcryptjs (client passwords) + env var (owner password) |
| Email | Resend |

---

## Project structure

```
.env.example          ← env var template (copy to .env for local dev)
netlify/functions/    ← serverless API (Node.js ESM)
src/
  lib/                ← api.js (fetch wrapper) + pricing.js (pure logic)
  pages/              ← ClientPage, OwnerPage, LoginPage
  stores/             ← Zustand state (ownerStore, clientStore)
tools/                ← Python scripts for DB operations
  check_sheets.py     ← verify Google Sheet structure
  backup_sheets.py    ← export all tabs to .tmp/
  requirements.txt
workflows/            ← SOPs for common operations
  onboarding.md       ← first-time setup
  backup-restore.md   ← data backup and recovery
  code-review-optimization.md
.tmp/                 ← local scratch dir (gitignored, used by tools/)
```

---

## Quick start

```bash
# 1. Install dependencies
npm install
pip install -r tools/requirements.txt

# 2. Configure environment
cp .env.example .env
# → fill in GOOGLE_SERVICE_ACCOUNT_JSON, GOOGLE_SHEET_WRITE_ID, OWNER_PASSWORD,
#   RESEND_API_KEY, OWNER_EMAIL

# 3. Verify Google Sheet structure
python tools/check_sheets.py

# 4. Run locally (frontend + functions)
netlify dev
```

For full setup instructions see [`workflows/onboarding.md`](workflows/onboarding.md).

---

## Google Sheet tabs

| Tab | Purpose |
|---|---|
| `PEDIDOS` | Approved orders |
| `PENDENTES` | Requests awaiting owner review |
| `USUARIOS` | Registered clients (phone + bcrypt password) |
| `DB_RECEITA` | Piece catalogue with yarn linha |
| `DB_HORAS` | Labour hours per piece × size |
| `DB_CONSUMO` | Yarn consumption per piece × size |
| `DB_CATALOGO` | Public catalogue (name, description, photo URL) |
| `DB_LINHAS` | Yarn lines with price per unit |
| `DB_CORES` | Available colours per yarn line |
| `DB_VALOR` | Hourly rate tiers |
| `COMPRAS` | Stock purchases |
| `CONSUMO_REGISTRO` | Stock consumption records |
| `MEDIDAS_CLIENTES` | Client body measurements |

---

## Deploy

Push to `main` — Netlify auto-deploys. Set the five env vars in
**Netlify → Site settings → Environment variables** before the first deploy.
