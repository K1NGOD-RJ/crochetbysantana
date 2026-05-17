# Backup & Restore — CrochetbySantana

Use this workflow before any risky operation (bulk deletes, schema changes,
testing new functions) and as a regular monthly maintenance task.

---

## When to run a backup

- Before making structural changes to the Google Sheet (adding/removing columns)
- Before deploying a major code change that touches Netlify functions
- Monthly, as routine maintenance
- Immediately if a data corruption bug is suspected

---

## Tool: `tools/backup_sheets.py`

**What it does:** Reads every tab in the Google Sheet and writes each one to a
separate CSV file inside `.tmp/backup_YYYY-MM-DD_HH-MM/`. Does not modify the
sheet. Safe to run at any time.

**Requirements:** `.env` must be configured (see `workflows/onboarding.md`).

---

## Running a backup

```bash
python tools/backup_sheets.py
```

Output example:

```
Backing up 13 sheets → .tmp/backup_2025-05-20_14-30

  PEDIDOS                          42 rows  →  PEDIDOS.csv
  PENDENTES                         3 rows  →  PENDENTES.csv
  USUARIOS                         18 rows  →  USUARIOS.csv
  DB_RECEITA                       12 rows  →  DB_RECEITA.csv
  ...

✅  Backup complete: /path/to/.tmp/backup_2025-05-20_14-30
```

Backup folders accumulate in `.tmp/` and are gitignored — clean them up manually
when no longer needed.

---

## Restoring from a backup

There is no automated restore tool. To restore a specific tab:

1. Open the backup folder in `.tmp/backup_YYYY-MM-DD_HH-MM/`
2. Open the relevant `.csv` file
3. Open the Google Sheet
4. Select all cells in the target tab and clear them
5. Paste the CSV data (File → Import, or paste directly)

> **Caution:** Restore is destructive. Always take a fresh backup before
> restoring, and confirm the correct tab before clearing data.

---

## Verifying sheet health after a restore

```bash
python tools/check_sheets.py
```

All tabs should show `OK`. If headers are wrong after a restore, the CSV may
have been pasted without the header row — repaste including row 1.

---

## Edge cases

| Situation | Action |
|---|---|
| A tab was accidentally deleted | Recreate it manually, paste data from backup CSV, run `check_sheets.py` to confirm headers |
| Wrong data written by a function bug | Backup current state first, then manually edit the affected rows in Google Sheets |
| `backup_sheets.py` fails with auth error | Service account credentials may have expired — rotate keys and update `.env` and Netlify env vars |
