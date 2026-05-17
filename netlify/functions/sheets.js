/**
 * GET /api/sheets
 * Returns all 6 DB sheets as JSON objects.
 * Replaces fetch_sheets.py
 */
import { getSheetsClient, SHEET_ID, json, toObjects } from './_sheets.js'

const SHEET_NAMES = {
  linhas: 'DB_LINHAS',
  consumo: 'DB_CONSUMO',
  receita: 'DB_RECEITA',
  cores: 'DB_CORES',
  horas: 'DB_HORAS',
  valor: 'DB_VALOR',
  catalogo: 'DB_CATALOGO',
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, {})
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed' })

  try {
    const sheets = getSheetsClient()
    const ranges = Object.values(SHEET_NAMES).map((name) => `${name}!A:Z`)

    const res = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: SHEET_ID,
      ranges,
    })

    const result = {}
    Object.entries(SHEET_NAMES).forEach(([key, name], i) => {
      result[key] = toObjects(res.data.valueRanges[i]?.values)
    })

    return json(200, result)
  } catch (err) {
    console.error('sheets error:', err)
    return json(500, { error: err.message })
  }
}
