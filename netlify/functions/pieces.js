/**
 * POST /api/pieces
 * Registers a new piece across DB_RECEITA, DB_HORAS, DB_CONSUMO.
 * Replaces edit_sheets.py register_piece logic in state.py
 *
 * Body: {
 *   nome: string,
 *   linha: string,
 *   obs: string,
 *   is_unique_size: boolean,
 *   horas: { PP, P, M, G, GG } | { TU },
 *   consumo: { PP, P, M, G, GG } | { TU },
 * }
 */
import { getSheetsClient, SHEET_ID, json } from './_sheets.js'

const SIZES = ['PP', 'P', 'M', 'G', 'GG']

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, {})
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' })

  let body
  try { body = JSON.parse(event.body) } catch { return json(400, { error: 'Invalid JSON' }) }

  const { nome, linha, obs = '', is_unique_size = false, horas = {}, consumo = {} } = body
  if (!nome?.trim()) return json(400, { error: 'Nome da peça é obrigatório.' })
  if (!linha?.trim()) return json(400, { error: 'Linha é obrigatória.' })

  const sheets = getSheetsClient()

  try {
    const sizeList = is_unique_size ? ['TU'] : SIZES

    // ── DB_RECEITA row ────────────────────────────────────────
    const receitaRow = [nome.trim(), linha.trim(), obs.trim()]
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID, range: 'DB_RECEITA!A:C',
      valueInputOption: 'RAW', requestBody: { values: [receitaRow] },
    })

    // ── DB_HORAS rows (one per size) ─────────────────────────
    const horasRows = sizeList.map((sz) => [nome.trim(), sz, parseFloat(horas[sz] || 0)])
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID, range: 'DB_HORAS!A:C',
      valueInputOption: 'RAW', requestBody: { values: horasRows },
    })

    // ── DB_CONSUMO rows (one per size) ───────────────────────
    const consumoRows = sizeList.map((sz) => [nome.trim(), sz, parseFloat(consumo[sz] || 0)])
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID, range: 'DB_CONSUMO!A:C',
      valueInputOption: 'RAW', requestBody: { values: consumoRows },
    })

    return json(200, { ok: true })
  } catch (err) {
    console.error('pieces error:', err)
    return json(500, { error: err.message })
  }
}
