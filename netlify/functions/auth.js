/**
 * POST /api/auth
 * Body: { action: 'owner-login' | 'client-login' | 'client-register', ...fields }
 * Replaces users.py + owner password check
 */
import bcrypt from 'bcryptjs'
import { getSheetsClient, SHEET_ID, json, toObjects, fromObjects } from './_sheets.js'

const USUARIOS_RANGE = 'USUARIOS!A:Z'

function normalizePhone(phone) {
  return phone.replace(/\D/g, '')
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, {})
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' })

  let body
  try { body = JSON.parse(event.body) } catch { return json(400, { error: 'Invalid JSON' }) }

  const { action } = body

  // ── Owner login ──────────────────────────────────────────────
  if (action === 'owner-login') {
    const { password } = body
    if (password === process.env.OWNER_PASSWORD) {
      return json(200, { ok: true })
    }
    return json(401, { error: 'Senha incorreta.' })
  }

  const sheets = getSheetsClient()

  // ── Client register ──────────────────────────────────────────
  if (action === 'client-register') {
    const { nome, telefone, password } = body
    if (!nome || !telefone || !password) return json(400, { error: 'Campos obrigatórios em falta.' })

    const phone = normalizePhone(telefone)
    try {
      const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: USUARIOS_RANGE })
      const users = toObjects(res.data.values)

      if (users.find((u) => normalizePhone(u.TELEFONE) === phone)) {
        return json(409, { error: 'Este número já está registado.' })
      }

      const hash = await bcrypt.hash(password, 10)
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: USUARIOS_RANGE,
        valueInputOption: 'RAW',
        requestBody: { values: [[nome.trim(), phone, hash]] },
      })

      return json(200, { ok: true, user: { nome: nome.trim(), telefone: phone } })
    } catch (err) {
      return json(500, { error: 'Erro ao registar. Tente novamente.' })
    }
  }

  // ── Client login ─────────────────────────────────────────────
  if (action === 'client-login') {
    const { telefone, password } = body
    if (!telefone || !password) return json(400, { error: 'Campos obrigatórios em falta.' })

    const phone = normalizePhone(telefone)
    try {
      const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: USUARIOS_RANGE })
      const users = toObjects(res.data.values)
      const user = users.find((u) => normalizePhone(u.TELEFONE) === phone)

      if (!user) return json(401, { error: 'Número não encontrado.' })

      const match = await bcrypt.compare(password, user.SENHA || '')
      if (!match) return json(401, { error: 'Senha incorreta.' })

      return json(200, { ok: true, user: { nome: user.NOME, telefone: user.TELEFONE } })
    } catch (err) {
      return json(500, { error: 'Erro ao autenticar. Tente novamente.' })
    }
  }

  return json(400, { error: 'Ação inválida.' })
}
