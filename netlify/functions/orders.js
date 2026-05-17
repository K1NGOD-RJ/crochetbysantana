/**
 * /api/orders
 * GET                                → all orders (owner) or by phone (client history)
 * PATCH { id, status }               → update order status
 * DELETE { id }                      → delete order
 *
 * Query params:
 *   ?phone=xxx   → filter by TELEFONE (client history)
 */
import { getSheetsClient, SHEET_ID, json, toObjects } from './_sheets.js'

const PEDIDOS_RANGE = 'PEDIDOS!A:Z'
const VALID_STATUSES = ['Pendente', 'Em progresso', 'Concluída']

function isOwner(event) {
  return event.headers['x-owner-token'] === process.env.OWNER_PASSWORD
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, {})
  const sheets = getSheetsClient()

  // ── GET ──────────────────────────────────────────────────────
  if (event.httpMethod === 'GET') {
    try {
      const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: PEDIDOS_RANGE })
      let orders = toObjects(res.data.values)
      // Pad IDs
      orders = orders.map((o) => ({ ...o, ID: String(o.ID || '').padStart(4, '0') }))
      const phone = event.queryStringParameters?.phone
      if (phone) {
        const clean = phone.replace(/\D/g, '')
        orders = orders.filter((o) => String(o.TELEFONE || '').replace(/\D/g, '') === clean)
      }
      return json(200, { orders })
    } catch (err) {
      return json(500, { error: err.message })
    }
  }

  // ── PATCH: update status ─────────────────────────────────────
  if (event.httpMethod === 'PATCH') {
    if (!isOwner(event)) return json(401, { error: 'Não autorizado.' })
    let body
    try { body = JSON.parse(event.body) } catch { return json(400, { error: 'Invalid JSON' }) }
    const { id, status } = body
    if (!VALID_STATUSES.includes(status)) return json(400, { error: `Status inválido: ${status}` })
    try {
      const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: PEDIDOS_RANGE })
      const headers = res.data.values[0]
      const rows = res.data.values.slice(1)
      const rowIdx = rows.findIndex((r) => String(r[0]).padStart(4, '0') === String(id).padStart(4, '0'))
      if (rowIdx === -1) return json(404, { error: `Encomenda ${id} não encontrada.` })
      const statusColIdx = headers.indexOf('STATUS')
      const statusCol = String.fromCharCode(65 + statusColIdx)
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `PEDIDOS!${statusCol}${rowIdx + 2}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[status]] },
      })
      return json(200, { ok: true })
    } catch (err) {
      return json(500, { error: err.message })
    }
  }

  // ── DELETE ───────────────────────────────────────────────────
  if (event.httpMethod === 'DELETE') {
    if (!isOwner(event)) return json(401, { error: 'Não autorizado.' })
    let body
    try { body = JSON.parse(event.body) } catch { return json(400, { error: 'Invalid JSON' }) }
    const { id } = body
    try {
      const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: PEDIDOS_RANGE })
      const rows = res.data.values.slice(1)
      const rowIdx = rows.findIndex((r) => String(r[0]).padStart(4, '0') === String(id).padStart(4, '0'))
      if (rowIdx === -1) return json(404, { error: `Encomenda ${id} não encontrada.` })

      // Get spreadsheet ID for batchUpdate
      const ssRes = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID })
      const sheet = ssRes.data.sheets.find((s) => s.properties.title === 'PEDIDOS')
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: {
          requests: [{
            deleteDimension: {
              range: { sheetId: sheet.properties.sheetId, dimension: 'ROWS', startIndex: rowIdx + 1, endIndex: rowIdx + 2 },
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
