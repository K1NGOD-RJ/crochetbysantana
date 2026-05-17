"""
check_sheets.py — Verify that the Google Sheet has all required tabs with the
correct header rows. Run this after creating a new sheet or whenever the app
behaves unexpectedly (missing data, wrong columns).

Usage:
    python tools/check_sheets.py

Reads GOOGLE_SERVICE_ACCOUNT_JSON and GOOGLE_SHEET_WRITE_ID from .env
"""

import json
import os
import sys
from dotenv import load_dotenv
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build

load_dotenv()

REQUIRED_STRUCTURE = {
    "PEDIDOS": [
        "ID", "CLIENTE", "PECA", "TAMANHO", "COR",
        "REFERENCIA_VISUAL", "OBS", "PRECO_VENDA", "CUSTO_TOTAL",
        "LUCRO", "PRAZO", "STATUS", "DATA_CRIACAO", "TELEFONE", "LINHA", "ROLOS",
    ],
    "PENDENTES": [
        "ID", "CLIENTE", "TELEFONE", "PECA", "TAMANHO", "COR",
        "REFERENCIA_VISUAL", "OBSERVACOES", "CUSTO_MATERIAL", "CUSTO_MO",
        "CUSTO_TOTAL", "DATA_SOLICITACAO", "STATUS",
    ],
    "USUARIOS": ["NOME", "TELEFONE", "SENHA"],
    "DB_RECEITA": ["PECA", "LINHA", "OBS"],
    "DB_HORAS": ["PECA", "TAMANHO", "QUANTIDADE"],
    "DB_CONSUMO": ["PECA", "TAMANHO", "QUANTIDADE"],
    "DB_CATALOGO": ["NOME", "DESCRICAO", "URL_FOTOS"],
    "DB_LINHAS": ["LINHAS", "VALOR"],
    "DB_CORES": ["LINHA", "COR"],
    "DB_VALOR": ["NUM_HORAS", "VALOR"],
    "COMPRAS": [
        "ID", "DATA", "LINHA", "COR", "QUANTIDADE",
        "CUSTO_UNIT", "CUSTO_TOTAL", "FORNECEDOR", "NOTAS",
    ],
    "CONSUMO_REGISTRO": [
        "ID", "DATA", "LINHA", "COR", "QUANTIDADE", "PEDIDO_REF", "NOTAS",
    ],
    "MEDIDAS_CLIENTES": [
        "TELEFONE", "BUSTO", "CINTURA", "QUADRIL", "COMPRIMENTO", "OMBRO", "MANGA",
    ],
}


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
    existing_tabs = {s["properties"]["title"] for s in spreadsheet["sheets"]}

    print(f"\nSheet ID : {sheet_id}")
    print(f"Tabs found: {len(existing_tabs)}\n")
    print("─" * 60)

    all_ok = True

    for tab, expected_headers in REQUIRED_STRUCTURE.items():
        if tab not in existing_tabs:
            print(f"  MISSING  {tab}")
            all_ok = False
            continue

        result = (
            service.spreadsheets()
            .values()
            .get(spreadsheetId=sheet_id, range=f"{tab}!1:1")
            .execute()
        )
        rows = result.get("values", [])
        if not rows:
            print(f"  EMPTY    {tab}  (no header row yet)")
            continue

        actual_headers = rows[0]
        missing = [h for h in expected_headers if h not in actual_headers]
        extra = [h for h in actual_headers if h not in expected_headers]

        if missing:
            print(f"  BAD HDR  {tab}")
            print(f"           missing : {missing}")
            if extra:
                print(f"           extra   : {extra}")
            all_ok = False
        else:
            row_count = (
                service.spreadsheets()
                .values()
                .get(spreadsheetId=sheet_id, range=f"{tab}!A:A")
                .execute()
                .get("values", [])
            )
            data_rows = max(0, len(row_count) - 1)
            print(f"  OK       {tab:<25}  {data_rows} rows")

    print("─" * 60)
    if all_ok:
        print("\n✅  All required sheets are present and correctly structured.\n")
    else:
        print("\n❌  Some sheets are missing or have incorrect headers.\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
