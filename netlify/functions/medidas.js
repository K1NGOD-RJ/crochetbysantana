/**
 * /api/medidas
 * GET  ?telefone=...  → fetch measurements for a client (returns {} if not found)
 * POST { telefone, busto, cintura, quadril, comprimento, ombro, manga }
 *       → upsert: update existing row or append new one
 */
import { getSheetsClient, SHEET_ID, json, toObjects, isOwner } from './_sheets.js'

const RANGE = 'MEDIDAS_CLIENTES!A:G'
const HEADERS = ['TELEFONE', 'BUSTO', 'CINTURA', 'QUADRIL', 'COMPRIMENTO', 'OMBRO', 'MANGA']

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '')
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, {})
  const sheets = getSheetsClient()

  // ── GET: fetch measurements for a phone ──────────────────────
  if (event.httpMethod === 'GET') {
    if (!isOwner(event)) return json(401, { error: 'Não autorizado.' })
    const telefone = normalizePhone(event.queryStringParameters?.telefone)
    if (!telefone) return json(400, { error: 'Telefone é obrigatório.' })
    try {
      const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: RANGE })
      const rows = toObjects(res.data.values)
      const record = rows.find((r) => normalizePhone(r.TELEFONE) === telefone)
      return json(200, { medidas: record || {} })
    } catch (err) {
      return json(500, { error: err.message })
    }
  }

  // ── POST: upsert measurements ─────────────────────────────────
  if (event.httpMethod === 'POST') {
    if (!isOwner(event)) return json(401, { error: 'Não autorizado.' })
    let body
    try { body = JSON.parse(event.body) } catch { return json(400, { error: 'Invalid JSON' }) }

    const telefone = normalizePhone(body.telefone)
    if (!telefone) return json(400, { error: 'Telefone é obrigatório.' })

    const { busto = '', cintura = '', quadril = '', comprimento = '', ombro = '', manga = '' } = body

    try {
      const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: RANGE })

      // Bootstrap header row if sheet is empty
      if (!res.data.values || res.data.values.length === 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID, range: RANGE,
          valueInputOption: 'RAW',
          requestBody: { values: [HEADERS] },
        })
      }

      const rows = toObjects(res.data.values)
      const existingIdx = rows.findIndex((r) => normalizePhone(r.TELEFONE) === telefone)
      const newRow = [telefone, busto, cintura, quadril, comprimento, ombro, manga]

      if (existingIdx >= 0) {
        // Update existing row (header is row 1, data starts at row 2)
        const sheetRow = existingIdx + 2
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: `MEDIDAS_CLIENTES!A${sheetRow}:G${sheetRow}`,
          valueInputOption: 'RAW',
          requestBody: { values: [newRow] },
        })
      } else {
        await sheets.spreadsheets.values.append({
          spreadsheetId: SHEET_ID, range: RANGE,
          valueInputOption: 'RAW',
          requestBody: { values: [newRow] },
        })
      }

      return json(200, { ok: true })
    } catch (err) {
      return json(500, { error: err.message })
    }
  }

  return json(405, { error: 'Method not allowed' })
}
