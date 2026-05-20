/**
 * /api/pending
 * GET              → list all Aguardando pending requests
 * POST { action: 'submit', ...fields }   → submit client request
 * POST { action: 'approve', id, preco_venda, prazo, linha, rolos, custo_mat_override, custo_mo_override }
 * POST { action: 'reject', id }
 *
 * Replaces pending.py + orders.py (approve creates a PEDIDOS row)
 */
import { getSheetsClient, SHEET_ID, json, toObjects } from './_sheets.js'
import { Resend } from 'resend'

const PENDENTES_RANGE = 'PENDENTES!A:Z'
const PEDIDOS_RANGE = 'PEDIDOS!A:Z'

const PENDING_HEADERS = [
  'ID', 'CLIENTE', 'TELEFONE', 'PECA', 'TAMANHO', 'COR',
  'REFERENCIA_VISUAL', 'OBSERVACOES', 'CUSTO_MATERIAL', 'CUSTO_MO',
  'CUSTO_TOTAL', 'DATA_SOLICITACAO', 'STATUS',
]

function now() {
  return new Date().toISOString().slice(0, 16).replace('T', ' ')
}

function esc(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

async function notifyOwner(id, body) {
  const apiKey = process.env.RESEND_API_KEY
  const ownerEmail = process.env.OWNER_EMAIL
  if (!apiKey || !ownerEmail) return
  try {
    const resend = new Resend(apiKey)
    await resend.emails.send({
      from: 'CrochetbySantana <onboarding@resend.dev>',
      to: ownerEmail,
      subject: `[CrochetbySantana] Novo pedido ${esc(id)} — ${esc(body.CLIENTE)}`,
      html: `
        <h2>Novo pedido recebido</h2>
        <table>
          <tr><td><b>ID</b></td><td>${esc(id)}</td></tr>
          <tr><td><b>Cliente</b></td><td>${esc(body.CLIENTE)}</td></tr>
          <tr><td><b>Telefone</b></td><td>${esc(body.TELEFONE)}</td></tr>
          <tr><td><b>Peça</b></td><td>${esc(body.PECA) || '—'}</td></tr>
          <tr><td><b>Tamanho</b></td><td>${esc(body.TAMANHO) || '—'}</td></tr>
          <tr><td><b>Cor</b></td><td>${esc(body.COR) || '—'}</td></tr>
          <tr><td><b>Referência</b></td><td>${esc(body.REFERENCIA_VISUAL) || '—'}</td></tr>
          <tr><td><b>Observações</b></td><td>${esc(body.OBSERVACOES) || '—'}</td></tr>
          <tr><td><b>Data</b></td><td>${now()}</td></tr>
        </table>
        <p>Aceda ao painel para aprovar ou rejeitar o pedido.</p>
      `,
    })
  } catch (err) {
    console.error('Email notification failed:', err.message)
  }
}

function nextId(rows, prefix = '') {
  const ids = rows
    .map((r) => r[prefix ? 'ID' : 'ID'])
    .filter((v) => (prefix ? String(v).startsWith(prefix) : /^\d+$/.test(String(v))))
    .map((v) => parseInt(String(v).replace(prefix, ''), 10))
    .filter((n) => !isNaN(n))
  const next = ids.length ? Math.max(...ids) + 1 : 1
  return prefix
    ? prefix + String(next).padStart(4, '0')
    : String(next).padStart(4, '0')
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, {})
  let sheets
  try { sheets = getSheetsClient() } catch (err) { return json(500, { error: `Sheets init: ${err.message}` }) }

  // ── GET: list pending (Aguardando) ──────────────────────────
  if (event.httpMethod === 'GET') {
    try {
      const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: PENDENTES_RANGE })
      const all = toObjects(res.data.values)
      return json(200, { pending: all.filter((r) => r.STATUS === 'Aguardando') })
    } catch (err) {
      return json(500, { error: err.message })
    }
  }

  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' })

  let body
  try { body = JSON.parse(event.body) } catch { return json(400, { error: 'Invalid JSON' }) }

  // ── POST submit ──────────────────────────────────────────────
  if (body.action === 'submit') {
    if (!body.CLIENTE?.trim()) return json(400, { error: 'Nome do cliente é obrigatório.' })
    if (!body.TELEFONE?.trim()) return json(400, { error: 'Telefone é obrigatório.' })
    try {
      const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: PENDENTES_RANGE })
      const existing = toObjects(res.data.values)
      const id = nextId(existing, 'P')
      const row = [
        id, body.CLIENTE, body.TELEFONE, body.PECA, body.TAMANHO, body.COR,
        body.REFERENCIA_VISUAL || '', body.OBSERVACOES || '',
        body.CUSTO_MATERIAL || '', body.CUSTO_MO || '', body.CUSTO_TOTAL || '',
        now(), 'Aguardando',
      ]
      // If sheet has no header yet, prepend it
      if (!res.data.values || res.data.values.length === 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID, range: PENDENTES_RANGE,
          valueInputOption: 'RAW',
          requestBody: { values: [PENDING_HEADERS] },
        })
      }
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID, range: PENDENTES_RANGE,
        valueInputOption: 'RAW', requestBody: { values: [row] },
      })
      await notifyOwner(id, body)
      return json(200, { ok: true, id })
    } catch (err) {
      return json(500, { error: err.message })
    }
  }

  // ── POST approve ─────────────────────────────────────────────
  if (body.action === 'approve') {
    try {
      const { id, preco_venda, prazo, linha = '', rolos = '', custo_mat_override, custo_mo_override } = body

      // Find the pending row
      const pendRes = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: PENDENTES_RANGE })
      const pending = toObjects(pendRes.data.values)
      const record = pending.find((r) => r.ID === id)
      if (!record) return json(404, { error: `Pedido ${id} não encontrado.` })

      const custoTotal = custo_mat_override != null
        ? parseFloat(custo_mat_override) + parseFloat(custo_mo_override || 0)
        : parseFloat(record.CUSTO_TOTAL || 0)
      const lucro = parseFloat(preco_venda) - custoTotal

      // Append to PEDIDOS
      const ordersRes = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: PEDIDOS_RANGE })
      const ordersExisting = toObjects(ordersRes.data.values)
      const orderId = nextId(ordersExisting)
      const orderRow = [
        orderId, record.CLIENTE, record.PECA, record.TAMANHO, record.COR,
        record.REFERENCIA_VISUAL || '', '',
        parseFloat(preco_venda).toFixed(2), custoTotal.toFixed(2), lucro.toFixed(2),
        prazo, 'Pendente', now(), record.TELEFONE, linha, rolos,
      ]
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID, range: PEDIDOS_RANGE,
        valueInputOption: 'RAW', requestBody: { values: [orderRow] },
      })

      // Update pending STATUS to Aprovado
      const headers = pendRes.data.values[0]
      const statusColIdx = headers.indexOf('STATUS') // 0-based
      const rowIdx = pending.findIndex((r) => r.ID === id) + 2 // +1 header, +1 1-based
      const statusCol = String.fromCharCode(65 + statusColIdx)
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `PENDENTES!${statusCol}${rowIdx}`,
        valueInputOption: 'RAW',
        requestBody: { values: [['Aprovado']] },
      })

      return json(200, { ok: true, orderId, telefone: record.TELEFONE })
    } catch (err) {
      return json(500, { error: err.message })
    }
  }

  // ── POST reject ──────────────────────────────────────────────
  if (body.action === 'reject') {
    try {
      const { id } = body
      const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: PENDENTES_RANGE })
      const pending = toObjects(res.data.values)
      const rowIdx = pending.findIndex((r) => r.ID === id) + 2
      if (rowIdx < 2) return json(404, { error: `Pedido ${id} não encontrado.` })
      const headers = res.data.values[0]
      const statusCol = String.fromCharCode(65 + headers.indexOf('STATUS'))
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `PENDENTES!${statusCol}${rowIdx}`,
        valueInputOption: 'RAW',
        requestBody: { values: [['Rejeitado']] },
      })
      return json(200, { ok: true })
    } catch (err) {
      return json(500, { error: err.message })
    }
  }

  return json(400, { error: 'Ação inválida.' })
}
