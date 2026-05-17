/**
 * /api/stock
 * GET                              → { compras, consumo, stock_levels }
 * POST { action: 'compra', ...}    → add purchase
 * POST { action: 'consumo', ...}   → add consumption
 * DELETE { table: 'compras'|'consumo', id } → delete record
 *
 * Replaces stock.py
 */
import { getSheetsClient, SHEET_ID, json, toObjects, isOwner } from './_sheets.js'

const COMPRAS_RANGE = 'COMPRAS!A:Z'
const CONSUMO_RANGE = 'CONSUMO_REGISTRO!A:Z'
const COMPRAS_HEADERS = ['ID', 'DATA', 'LINHA', 'COR', 'QUANTIDADE', 'CUSTO_UNIT', 'CUSTO_TOTAL', 'FORNECEDOR', 'NOTAS']
const CONSUMO_HEADERS = ['ID', 'DATA', 'LINHA', 'COR', 'QUANTIDADE', 'PEDIDO_REF', 'NOTAS']

function now() {
  return new Date().toISOString().slice(0, 10)
}

function nextId(rows, prefix) {
  const nums = rows
    .map((r) => r.ID || '')
    .filter((v) => String(v).startsWith(prefix))
    .map((v) => parseInt(String(v).replace(prefix, ''), 10))
    .filter((n) => !isNaN(n))
  const next = nums.length ? Math.max(...nums) + 1 : 1
  return prefix + String(next).padStart(4, '0')
}

/** Compute stock levels from compras - consumo per (linha, cor) */
function computeStock(compras, consumo) {
  const stock = {}
  for (const c of compras) {
    const k = `${c.LINHA}||${c.COR}`
    stock[k] = stock[k] || { LINHA: c.LINHA, COR: c.COR, ENTRADAS: 0, SAIDAS: 0 }
    stock[k].ENTRADAS += parseFloat(c.QUANTIDADE || 0)
  }
  for (const c of consumo) {
    const k = `${c.LINHA}||${c.COR}`
    stock[k] = stock[k] || { LINHA: c.LINHA, COR: c.COR, ENTRADAS: 0, SAIDAS: 0 }
    stock[k].SAIDAS += parseFloat(c.QUANTIDADE || 0)
  }
  return Object.values(stock).map((s) => ({
    ...s,
    ESTOQUE_ATUAL: parseFloat((s.ENTRADAS - s.SAIDAS).toFixed(2)),
  }))
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, {})
  const sheets = getSheetsClient()

  // ── GET ──────────────────────────────────────────────────────
  if (event.httpMethod === 'GET') {
    try {
      const [comprasRes, consumoRes] = await Promise.all([
        sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: COMPRAS_RANGE }),
        sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: CONSUMO_RANGE }),
      ])
      const compras = toObjects(comprasRes.data.values)
      const consumo = toObjects(consumoRes.data.values)
      return json(200, { compras, consumo, stock_levels: computeStock(compras, consumo) })
    } catch (err) {
      return json(500, { error: err.message })
    }
  }

  // ── POST ─────────────────────────────────────────────────────
  if (event.httpMethod === 'POST') {
    if (!isOwner(event)) return json(401, { error: 'Não autorizado.' })
    let body
    try { body = JSON.parse(event.body) } catch { return json(400, { error: 'Invalid JSON' }) }

    if (body.action === 'compra') {
      try {
        const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: COMPRAS_RANGE })
        const existing = toObjects(res.data.values)
        const id = nextId(existing, 'C')
        const qtd = parseFloat(body.QUANTIDADE || 0)
        const unitCost = parseFloat(body.CUSTO_UNIT || 0)
        const row = [id, now(), body.LINHA, body.COR, qtd, unitCost, (qtd * unitCost).toFixed(2), body.FORNECEDOR || '', body.NOTAS || '']
        if (!res.data.values || res.data.values.length === 0) {
          await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID, range: COMPRAS_RANGE,
            valueInputOption: 'RAW', requestBody: { values: [COMPRAS_HEADERS] },
          })
        }
        await sheets.spreadsheets.values.append({
          spreadsheetId: SHEET_ID, range: COMPRAS_RANGE,
          valueInputOption: 'RAW', requestBody: { values: [row] },
        })
        return json(200, { ok: true, id })
      } catch (err) {
        return json(500, { error: err.message })
      }
    }

    if (body.action === 'consumo') {
      try {
        const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: CONSUMO_RANGE })
        const existing = toObjects(res.data.values)
        const id = nextId(existing, 'U')
        const row = [id, now(), body.LINHA, body.COR, parseFloat(body.QUANTIDADE || 0), body.PEDIDO_REF || '', body.NOTAS || '']
        if (!res.data.values || res.data.values.length === 0) {
          await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_ID, range: CONSUMO_RANGE,
            valueInputOption: 'RAW', requestBody: { values: [CONSUMO_HEADERS] },
          })
        }
        await sheets.spreadsheets.values.append({
          spreadsheetId: SHEET_ID, range: CONSUMO_RANGE,
          valueInputOption: 'RAW', requestBody: { values: [row] },
        })
        return json(200, { ok: true, id })
      } catch (err) {
        return json(500, { error: err.message })
      }
    }

    return json(400, { error: 'Ação inválida.' })
  }

  // ── DELETE ───────────────────────────────────────────────────
  if (event.httpMethod === 'DELETE') {
    if (!isOwner(event)) return json(401, { error: 'Não autorizado.' })
    let body
    try { body = JSON.parse(event.body) } catch { return json(400, { error: 'Invalid JSON' }) }
    const { table, id } = body
    if (table !== 'compras' && table !== 'consumo') return json(400, { error: "table deve ser 'compras' ou 'consumo'." })
    const range = table === 'compras' ? COMPRAS_RANGE : CONSUMO_RANGE
    const sheetTitle = table === 'compras' ? 'COMPRAS' : 'CONSUMO_REGISTRO'
    try {
      const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range })
      const rows = (res.data.values || []).slice(1) // skip header
      const rowIdx = rows.findIndex((r) => r[0] === id)
      if (rowIdx === -1) return json(404, { error: `Registo ${id} não encontrado.` })
      const ssRes = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID })
      const sheet = ssRes.data.sheets.find((s) => s.properties.title === sheetTitle)
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
