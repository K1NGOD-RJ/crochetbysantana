"""
backup_sheets.py — Export every tab in the Google Sheet to CSV files inside
.tmp/backup_YYYY-MM-DD/. Safe to run at any time; creates a timestamped folder
so previous backups are never overwritten.

Usage:
    python tools/backup_sheets.py

Reads GOOGLE_SERVICE_ACCOUNT_JSON and GOOGLE_SHEET_WRITE_ID from .env
"""

import csv
import json
import os
import sys
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build

load_dotenv()


def get_sheets_client():
    creds_json = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
    if not creds_json:
        sys.exit("ERROR: GOOGLE_SERVICE_ACCOUNT_JSON not set in .env")
    creds = Credentials.from_service_account_info(
        json.loads(creds_json),
        scopes=["https://www.googleapis.com/auth/spreadsheets.readonly"],
    )
    return build("sheets", "v4", credentials=creds)


def main():
    sheet_id = os.getenv("GOOGLE_SHEET_WRITE_ID")
    if not sheet_id:
        sys.exit("ERROR: GOOGLE_SHEET_WRITE_ID not set in .env")

    service = get_sheets_client()
    spreadsheet = service.spreadsheets().get(spreadsheetId=sheet_id).execute()
    tabs = [s["properties"]["title"] for s in spreadsheet["sheets"]]

    today = datetime.now().strftime("%Y-%m-%d_%H-%M")
    out_dir = Path(".tmp") / f"backup_{today}"
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"\nBacking up {len(tabs)} sheets → {out_dir}\n")

    for tab in tabs:
        result = (
            service.spreadsheets()
            .values()
            .get(spreadsheetId=sheet_id, range=f"{tab}!A:Z")
            .execute()
        )
        rows = result.get("values", [])
        csv_path = out_dir / f"{tab}.csv"

        with open(csv_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerows(rows)

        data_rows = max(0, len(rows) - 1)
        print(f"  {tab:<30}  {data_rows} rows  →  {csv_path.name}")

    print(f"\n✅  Backup complete: {out_dir.resolve()}\n")


if __name__ == "__main__":
    main()
