/**
 * /api/tables?table=catalogo|linhas|cores
 * GET    → fetch table rows
 * POST   → add row
 * PUT    → edit row by _idx
 * DELETE → delete row by _idx
 *
 * Replaces catalog.py + edit_sheets.py (linhas/cores)
 */
import { getSheetsClient, SHEET_ID, json, toObjects, fromObjects } from './_sheets.js'

const TABLE_MAP = {
  catalogo: 'DB_CATALOGO',
  linhas: 'DB_LINHAS',
  cores: 'DB_CORES',
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, {})
  const table = event.queryStringParameters?.table
  const sheetName = TABLE_MAP[table]
  if (!sheetName) return json(400, { error: `table param must be one of: ${Object.keys(TABLE_MAP).join(', ')}` })

  const range = `${sheetName}!A:Z`
  const sheets = getSheetsClient()

  // ── GET ──────────────────────────────────────────────────────
  if (event.httpMethod === 'GET') {
    try {
      const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range })
      const rows = toObjects(res.data.values).map((r, i) => ({ ...r, _idx: String(i) }))
      return json(200, { rows })
    } catch (err) {
      return json(500, { error: err.message })
    }
  }

  // ── POST: add row ────────────────────────────────────────────
  if (event.httpMethod === 'POST') {
    let body
    try { body = JSON.parse(event.body) } catch { return json(400, { error: 'Invalid JSON' }) }
    try {
      const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range })
      const existing = res.data.values || []
      let newRow
      if (table === 'catalogo') {
        newRow = [body.NOME || '', body.DESCRICAO || '', body.URL_FOTO || '']
        if (existing.length === 0) {
          await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID, range,
            valueInputOption: 'RAW',
            requestBody: { values: [['NOME', 'DESCRICAO', 'URL_FOTO']] },
          })
        }
      } else if (table === 'linhas') {
        newRow = [body.LINHAS || '', body.VALOR || '']
        if (existing.length === 0) {
          await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID, range, valueInputOption: 'RAW',
            requestBody: { values: [['LINHAS', 'VALOR']] },
          })
        }
      } else if (table === 'cores') {
        newRow = [body.LINHA || '', body.COR || '']
        if (existing.length === 0) {
          await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID, range, valueInputOption: 'RAW',
            requestBody: { values: [['LINHA', 'COR']] },
          })
        }
      }
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID, range,
        valueInputOption: 'RAW', requestBody: { values: [newRow] },
      })
      return json(200, { ok: true })
    } catch (err) {
      return json(500, { error: err.message })
    }
  }

  // ── PUT: edit row ────────────────────────────────────────────
  if (event.httpMethod === 'PUT') {
    let body
    try { body = JSON.parse(event.body) } catch { return json(400, { error: 'Invalid JSON' }) }
    const { _idx, ...fields } = body
    try {
      const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range })
      const values = res.data.values || []
      if (!values.length) return json(404, { error: 'Sheet empty.' })
      const headers = values[0]
      const dataRowIdx = parseInt(_idx, 10) + 1 // +1 for header, 0-based in values array
      if (dataRowIdx >= values.length) return json(404, { error: 'Row not found.' })
      const updatedRow = headers.map((h) => (h in fields ? fields[h] : values[dataRowIdx][headers.indexOf(h)] ?? ''))
      const sheetRowNum = dataRowIdx + 1 // 1-based for Sheets API
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${sheetName}!A${sheetRowNum}`,
        valueInputOption: 'RAW',
        requestBody: { values: [updatedRow] },
      })
      return json(200, { ok: true })
    } catch (err) {
      return json(500, { error: err.message })
    }
  }

  // ── DELETE: remove row ───────────────────────────────────────
  if (event.httpMethod === 'DELETE') {
    let body
    try { body = JSON.parse(event.body) } catch { return json(400, { error: 'Invalid JSON' }) }
    const { _idx } = body
    try {
      const ssRes = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID })
      const sheet = ssRes.data.sheets.find((s) => s.properties.title === sheetName)
      const dataRowIdx = parseInt(_idx, 10) + 1 // +1 for header (0-based)
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId: sheet.properties.sheetId,
                dimension: 'ROWS',
                startIndex: dataRowIdx,
                endIndex: dataRowIdx + 1,
              },
            },
          }],
        },
      })
      return json(200, { ok: true })
    } catch (err) {
      return json(500, { error: err.message })
    }
  }

  return json(405, { error: 'Method not allowed' })
}
