/** Fetch wrapper for all Netlify functions */
const BASE = '/.netlify/functions'

async function call(path, method = 'GET', body = null, extraHeaders = {}) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(`${BASE}${path}`, opts)
  const data = await res.json()
  if (!res.ok) {
    const err = new Error(data.error || `HTTP ${res.status}`)
    err.status = res.status
    throw err
  }
  return data
}

function ownerHeaders() {
  const token = sessionStorage.getItem('owner_token') || ''
  return { 'x-owner-token': token }
}

// ── Sheets (read-only DB data) ────────────────────────────────
export const getSheets = () => call('/sheets')

// ── Auth ──────────────────────────────────────────────────────
export const ownerLogin = (password) =>
  call('/auth', 'POST', { action: 'owner-login', password })

export const clientLogin = (telefone, password) =>
  call('/auth', 'POST', { action: 'client-login', telefone, password })

export const clientRegister = (nome, telefone, password) =>
  call('/auth', 'POST', { action: 'client-register', nome, telefone, password })

// ── Pending ───────────────────────────────────────────────────
export const getPending = () => call('/pending')

export const submitRequest = (data) =>
  call('/pending', 'POST', { action: 'submit', ...data })

export const approveRequest = (data) =>
  call('/pending', 'POST', { action: 'approve', ...data })

export const rejectRequest = (id) =>
  call('/pending', 'POST', { action: 'reject', id })

// ── Orders ────────────────────────────────────────────────────
export const getOrders = () => call('/orders')

export const getClientOrders = (phone) =>
  call(`/orders?phone=${encodeURIComponent(phone)}`)

export const updateOrderStatus = (id, status) =>
  call('/orders', 'PATCH', { id, status }, ownerHeaders())

export const deleteOrder = (id) =>
  call('/orders', 'DELETE', { id }, ownerHeaders())

// ── Tables ────────────────────────────────────────────────────
export const getTable = (table) => call(`/tables?table=${table}`)

export const addTableRow = (table, fields) =>
  call(`/tables?table=${table}`, 'POST', fields, ownerHeaders())

export const editTableRow = (table, _idx, fields) =>
  call(`/tables?table=${table}`, 'PUT', { _idx, ...fields }, ownerHeaders())

export const deleteTableRow = (table, _idx) =>
  call(`/tables?table=${table}`, 'DELETE', { _idx }, ownerHeaders())

// ── Stock ─────────────────────────────────────────────────────
export const getStock = () => call('/stock')

export const addCompra = (data) =>
  call('/stock', 'POST', { action: 'compra', ...data }, ownerHeaders())

export const addConsumo = (data) =>
  call('/stock', 'POST', { action: 'consumo', ...data }, ownerHeaders())

export const deleteStockRecord = (table, id) =>
  call('/stock', 'DELETE', { table, id }, ownerHeaders())

// ── Pieces ────────────────────────────────────────────────────
export const registerPiece = (data) => call('/pieces', 'POST', data, ownerHeaders())

// ── Medidas (client measurements) ────────────────────────────
export const getMedidas = (telefone) =>
  call(`/medidas?telefone=${encodeURIComponent(telefone)}`, 'GET', null, ownerHeaders())

export const saveMedidas = (data) => call('/medidas', 'POST', data, ownerHeaders())
