import { create } from 'zustand'
import * as api from '../lib/api'
import { calculatePrice } from '../lib/pricing'

export const useOwnerStore = create((set, get) => ({
  // ── Auth ──────────────────────────────────────────────────
  isAuthenticated: false,

  // ── Tabs ──────────────────────────────────────────────────
  ownerTab: 'pendentes',

  // ── Sheets (base data) ────────────────────────────────────
  sheets: null,

  // ── Pending ───────────────────────────────────────────────
  pendingData: [],
  pendingLoading: false,
  selectedPendingId: '',
  selectedPendingRecord: null,
  precoVendaInput: '',
  estimatedProfit: '',
  approvalPrazo: '',
  approvalMessage: '',
  isCustomPiece: false,
  approvalLinha: '',
  approvalRolos: '',
  approvalHoras: '',
  approvalCustoMat: '',
  approvalCustoMO: '',

  // ── Orders ────────────────────────────────────────────────
  ordersData: [],
  filteredOrdersData: [],
  ordersLoading: false,
  orderStatusFilter: 'Todos',
  orderUpdateId: '',
  orderUpdateStatus: 'Pendente',
  orderActionMsg: '',

  // ── Clients ───────────────────────────────────────────────
  clientsData: [],

  // ── Table editor ──────────────────────────────────────────
  tabelasSubtab: 'catalogo',
  tableViewData: [],
  tableLoading: false,
  tableMsg: '',
  tableEditIdx: '',
  tableEditF1: '',
  tableEditF2: '',
  tableEditF3: '',
  catNomeInput: '',
  catDescInput: '',
  catFotoInput: '',
  newLinhasNome: '',
  newLinhasValor: '',
  newCoresLinha: '',
  newCoresCor: '',

  // ── Stock ─────────────────────────────────────────────────
  stockTab: 'estoque',
  stockData: [],
  comprasData: [],
  consumoData: [],
  stockLoading: false,
  stockMsg: '',
  compraLinha: '',
  compraCor: '',
  compraQtd: '',
  compraCustoUnit: '',
  compraFornecedor: '',
  compraNotas: '',
  consumoRegLinha: '',
  consumoRegCor: '',
  consumoRegQtd: '',
  consumoRegPedidoRef: '',
  consumoRegNotas: '',

  // ── Medidas ───────────────────────────────────────────────
  expandedClientPhone: '',
  clientMedidas: {},
  medidasMsg: '',
  medidasLoading: false,
  medidasBusto: '',
  medidasCintura: '',
  medidasQuadril: '',
  medidasComprimento: '',
  medidasOmbro: '',
  medidasManga: '',

  // ── New piece ─────────────────────────────────────────────
  npNome: '',
  npLinha: '',
  npObs: '',
  npIsUniqueSize: false,
  npHoras: { PP: '', P: '', M: '', G: '', GG: '' },
  npConsumo: { PP: '', P: '', M: '', G: '', GG: '' },
  npMessage: '',

  // ── Actions ───────────────────────────────────────────────
  setIsAuthenticated: (v) => set({ isAuthenticated: v }),
  setOwnerTab: (tab) => set({ ownerTab: tab }),

  loadSheets: async () => {
    try {
      const data = await api.getSheets()
      set({ sheets: data })
    } catch {}
  },

  // ── Pending ───────────────────────────────────────────────
  loadPending: async () => {
    set({ pendingLoading: true, approvalMessage: '' })
    try {
      const { pending } = await api.getPending()
      set({ pendingData: pending, pendingLoading: false })
    } catch (err) {
      set({ pendingLoading: false, approvalMessage: err.message })
    }
  },

  setSelectedPending: (id) => {
    const { pendingData, sheets } = get()
    const record = pendingData.find((r) => r.ID === id)
    if (!record) return
    let precoVenda = ''
    let estimatedProfit = ''
    if (sheets) {
      try {
        const price = calculatePrice(record.PECA, record.TAMANHO, 0, sheets)
        const suggested = parseFloat((price.total_cost * 2.5).toFixed(2))
        precoVenda = String(suggested)
        estimatedProfit = String((suggested - price.total_cost).toFixed(2))
      } catch {}
    }
    const isCustom = !record.PECA || record.PECA.toLowerCase().includes('personalizada') || !sheets?.receita?.find((r) => r.PECA?.toUpperCase() === record.PECA?.toUpperCase())
    set({
      selectedPendingId: id,
      selectedPendingRecord: record,
      precoVendaInput: precoVenda,
      estimatedProfit,
      isCustomPiece: isCustom,
      approvalLinha: record.LINHA || '',
      approvalRolos: '',
      approvalHoras: '',
      approvalCustoMat: record.CUSTO_MATERIAL || '',
      approvalCustoMO: record.CUSTO_MO || '',
      approvalMessage: '',
    })
  },

  setPrecoVendaInput: (v) => {
    const { selectedPendingRecord } = get()
    const custo = parseFloat(selectedPendingRecord?.CUSTO_TOTAL || 0)
    const profit = (parseFloat(v || 0) - custo).toFixed(2)
    set({ precoVendaInput: v, estimatedProfit: profit })
  },

  approveRequest: async () => {
    const s = get()
    const { selectedPendingId, precoVendaInput, approvalPrazo, isCustomPiece,
            approvalLinha, approvalRolos, approvalCustoMat, approvalCustoMO } = s
    if (!precoVendaInput || !approvalPrazo) {
      set({ approvalMessage: 'Preencha o preço de venda e o prazo.' })
      return
    }
    try {
      const payload = {
        id: selectedPendingId,
        preco_venda: parseFloat(precoVendaInput),
        prazo: approvalPrazo,
        linha: approvalLinha,
        rolos: approvalRolos,
      }
      if (isCustomPiece) {
        payload.custo_mat_override = parseFloat(approvalCustoMat || 0)
        payload.custo_mo_override = parseFloat(approvalCustoMO || 0)
      }
      const { telefone } = await api.approveRequest(payload)
      const waUrl = `https://wa.me/55${telefone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! O seu pedido #${selectedPendingId} foi aprovado. Prazo: ${approvalPrazo}. Preço: R$ ${precoVendaInput}`)}`
      set({ approvalMessage: '✅ Pedido aprovado!', selectedPendingId: '', selectedPendingRecord: null, whatsappUrl: waUrl })
      get().loadPending()
    } catch (err) {
      set({ approvalMessage: err.message })
    }
  },

  rejectRequest: async () => {
    const { selectedPendingId } = get()
    try {
      await api.rejectRequest(selectedPendingId)
      set({ approvalMessage: '❌ Pedido rejeitado.', selectedPendingId: '', selectedPendingRecord: null })
      get().loadPending()
    } catch (err) {
      set({ approvalMessage: err.message })
    }
  },

  // ── Orders ────────────────────────────────────────────────
  loadOrders: async () => {
    set({ ordersLoading: true })
    try {
      const { orders } = await api.getOrders()
      const clients = {}
      orders.forEach((o) => {
        if (o.TELEFONE) clients[o.TELEFONE] = clients[o.TELEFONE] || { NOME: o.CLIENTE, TELEFONE: o.TELEFONE, TOTAL_PEDIDOS: 0, TOTAL_GASTO: 0 }
        clients[o.TELEFONE].TOTAL_PEDIDOS++
        clients[o.TELEFONE].TOTAL_GASTO += parseFloat(o.PRECO_VENDA || 0)
      })
      set({
        ordersData: orders,
        filteredOrdersData: orders,
        clientsData: Object.values(clients),
        ordersLoading: false,
      })
    } catch (err) {
      set({ ordersLoading: false })
    }
  },

  setOrderStatusFilter: (v) => {
    const { ordersData } = get()
    const filtered = v === 'Todos' ? ordersData : ordersData.filter((o) => o.STATUS === v)
    set({ orderStatusFilter: v, filteredOrdersData: filtered })
  },

  saveOrderStatus: async () => {
    const { orderUpdateId, orderUpdateStatus } = get()
    if (!orderUpdateId) return
    try {
      await api.updateOrderStatus(orderUpdateId, orderUpdateStatus)
      set({ orderActionMsg: '✅ Status actualizado.' })
      get().loadOrders()
    } catch (err) {
      set({ orderActionMsg: err.message })
    }
  },

  deleteOrder: async (id) => {
    try {
      await api.deleteOrder(id)
      get().loadOrders()
    } catch (err) {
      set({ orderActionMsg: err.message })
    }
  },

  // ── Table editor ──────────────────────────────────────────
  setTabelasSubtab: (t) => {
    set({ tabelasSubtab: t, tableEditIdx: '', tableEditF1: '', tableEditF2: '', tableEditF3: '', tableMsg: '' })
    get().loadTableView(t)
  },

  loadTableView: async (tableParam) => {
    const table = tableParam || get().tabelasSubtab
    set({ tableLoading: true, tableMsg: '' })
    try {
      const { rows } = await api.getTable(table)
      set({ tableViewData: rows, tableLoading: false })
    } catch (err) {
      set({ tableLoading: false, tableMsg: err.message })
    }
  },

  selectForEdit: (idx) => {
    const { tableViewData, tabelasSubtab } = get()
    const row = tableViewData.find((r) => r._idx === idx)
    if (!row) return
    let f1 = '', f2 = '', f3 = ''
    if (tabelasSubtab === 'catalogo') { f1 = row.NOME || ''; f2 = row.DESCRICAO || ''; f3 = row.URL_FOTO || '' }
    else if (tabelasSubtab === 'linhas') { f1 = row.LINHAS || ''; f2 = row.VALOR || '' }
    else if (tabelasSubtab === 'cores') { f1 = row.LINHA || ''; f2 = row.COR || '' }
    set({ tableEditIdx: idx, tableEditF1: f1, tableEditF2: f2, tableEditF3: f3, tableMsg: '' })
  },

  cancelTableEdit: () => set({ tableEditIdx: '', tableEditF1: '', tableEditF2: '', tableEditF3: '', tableMsg: '' }),

  saveTableEdit: async () => {
    const { tabelasSubtab, tableEditIdx, tableEditF1, tableEditF2, tableEditF3 } = get()
    if (!tableEditF1.trim()) { set({ tableMsg: 'O primeiro campo não pode estar vazio.' }); return }
    let fields = {}
    if (tabelasSubtab === 'catalogo') fields = { NOME: tableEditF1, DESCRICAO: tableEditF2, URL_FOTO: tableEditF3 }
    else if (tabelasSubtab === 'linhas') fields = { LINHAS: tableEditF1, VALOR: tableEditF2 }
    else if (tabelasSubtab === 'cores') fields = { LINHA: tableEditF1, COR: tableEditF2 }
    try {
      await api.editTableRow(tabelasSubtab, tableEditIdx, fields)
      set({ tableEditIdx: '', tableEditF1: '', tableEditF2: '', tableEditF3: '', tableMsg: '✅ Actualizado com sucesso.' })
      get().loadTableView()
    } catch (err) {
      set({ tableMsg: err.message })
    }
  },

  addCatalogItem: async () => {
    const { catNomeInput, catDescInput, catFotoInput } = get()
    if (!catNomeInput.trim()) { set({ tableMsg: 'Nome é obrigatório.' }); return }
    try {
      await api.addTableRow('catalogo', { NOME: catNomeInput, DESCRICAO: catDescInput, URL_FOTO: catFotoInput })
      set({ catNomeInput: '', catDescInput: '', catFotoInput: '', tableMsg: '✅ Peça adicionada.' })
      get().loadTableView()
    } catch (err) { set({ tableMsg: err.message }) }
  },

  deleteCatalogItem: async (idx) => {
    try {
      await api.deleteTableRow('catalogo', idx)
      set({ tableMsg: '✅ Item removido do catálogo.' })
      get().loadTableView()
    } catch (err) { set({ tableMsg: err.message }) }
  },

  addLinhasRow: async () => {
    const { newLinhasNome, newLinhasValor } = get()
    if (!newLinhasNome.trim()) { set({ tableMsg: 'Nome é obrigatório.' }); return }
    try {
      await api.addTableRow('linhas', { LINHAS: newLinhasNome, VALOR: newLinhasValor })
      set({ newLinhasNome: '', newLinhasValor: '', tableMsg: '✅ Linha adicionada.' })
      get().loadTableView()
    } catch (err) { set({ tableMsg: err.message }) }
  },

  deleteLinhasRow: async (idx) => {
    try {
      await api.deleteTableRow('linhas', idx)
      get().loadTableView()
    } catch (err) { set({ tableMsg: err.message }) }
  },

  addCoresRow: async () => {
    const { newCoresLinha, newCoresCor } = get()
    if (!newCoresLinha || !newCoresCor.trim()) { set({ tableMsg: 'Linha e cor são obrigatórias.' }); return }
    try {
      await api.addTableRow('cores', { LINHA: newCoresLinha, COR: newCoresCor })
      set({ newCoresLinha: '', newCoresCor: '', tableMsg: '✅ Cor adicionada.' })
      get().loadTableView()
    } catch (err) { set({ tableMsg: err.message }) }
  },

  deleteCoresRow: async (idx) => {
    try {
      await api.deleteTableRow('cores', idx)
      get().loadTableView()
    } catch (err) { set({ tableMsg: err.message }) }
  },

  // ── Stock ─────────────────────────────────────────────────
  loadStock: async () => {
    set({ stockLoading: true })
    try {
      const data = await api.getStock()
      set({ comprasData: data.compras, consumoData: data.consumo, stockData: data.stock_levels, stockLoading: false })
    } catch (err) {
      set({ stockLoading: false, stockMsg: err.message })
    }
  },

  addCompra: async () => {
    const s = get()
    if (!s.compraLinha || !s.compraCor || !s.compraQtd) { set({ stockMsg: 'Preencha linha, cor e quantidade.' }); return }
    try {
      await api.addCompra({ LINHA: s.compraLinha, COR: s.compraCor, QUANTIDADE: s.compraQtd, CUSTO_UNIT: s.compraCustoUnit, FORNECEDOR: s.compraFornecedor, NOTAS: s.compraNotas })
      set({ compraLinha: '', compraCor: '', compraQtd: '', compraCustoUnit: '', compraFornecedor: '', compraNotas: '', stockMsg: '✅ Compra registada.' })
      get().loadStock()
    } catch (err) { set({ stockMsg: err.message }) }
  },

  addConsumoRegistro: async () => {
    const s = get()
    if (!s.consumoRegLinha || !s.consumoRegCor || !s.consumoRegQtd) { set({ stockMsg: 'Preencha linha, cor e quantidade.' }); return }
    try {
      await api.addConsumo({ LINHA: s.consumoRegLinha, COR: s.consumoRegCor, QUANTIDADE: s.consumoRegQtd, PEDIDO_REF: s.consumoRegPedidoRef, NOTAS: s.consumoRegNotas })
      set({ consumoRegLinha: '', consumoRegCor: '', consumoRegQtd: '', consumoRegPedidoRef: '', consumoRegNotas: '', stockMsg: '✅ Consumo registado.' })
      get().loadStock()
    } catch (err) { set({ stockMsg: err.message }) }
  },

  deleteCompra: async (id) => {
    try { await api.deleteStockRecord('compras', id); get().loadStock() } catch (err) { set({ stockMsg: err.message }) }
  },

  deleteConsumoReg: async (id) => {
    try { await api.deleteStockRecord('consumo', id); get().loadStock() } catch (err) { set({ stockMsg: err.message }) }
  },

  // ── Medidas ───────────────────────────────────────────────
  toggleClientMedidas: async (phone) => {
    const { expandedClientPhone } = get()
    if (expandedClientPhone === phone) {
      set({ expandedClientPhone: '', clientMedidas: {}, medidasMsg: '' })
      return
    }
    set({ expandedClientPhone: phone, medidasLoading: true, medidasMsg: '', clientMedidas: {} })
    try {
      const { medidas } = await api.getMedidas(phone)
      set({
        clientMedidas: medidas,
        medidasBusto: medidas.BUSTO || '',
        medidasCintura: medidas.CINTURA || '',
        medidasQuadril: medidas.QUADRIL || '',
        medidasComprimento: medidas.COMPRIMENTO || '',
        medidasOmbro: medidas.OMBRO || '',
        medidasManga: medidas.MANGA || '',
        medidasLoading: false,
      })
    } catch (err) {
      set({ medidasLoading: false, medidasMsg: err.message })
    }
  },

  saveMedidas: async () => {
    const { expandedClientPhone, medidasBusto, medidasCintura, medidasQuadril,
            medidasComprimento, medidasOmbro, medidasManga } = get()
    if (!expandedClientPhone) return
    try {
      await api.saveMedidas({
        telefone: expandedClientPhone,
        busto: medidasBusto,
        cintura: medidasCintura,
        quadril: medidasQuadril,
        comprimento: medidasComprimento,
        ombro: medidasOmbro,
        manga: medidasManga,
      })
      set({ medidasMsg: '✅ Medidas guardadas.' })
    } catch (err) {
      set({ medidasMsg: err.message })
    }
  },

  // ── New piece ─────────────────────────────────────────────
  registerPiece: async () => {
    const s = get()
    if (!s.npNome.trim() || !s.npLinha.trim()) { set({ npMessage: 'Nome e linha são obrigatórios.' }); return }
    try {
      await api.registerPiece({ nome: s.npNome, linha: s.npLinha, obs: s.npObs, is_unique_size: s.npIsUniqueSize, horas: s.npHoras, consumo: s.npConsumo })
      set({ npNome: '', npLinha: '', npObs: '', npIsUniqueSize: false, npHoras: { PP: '', P: '', M: '', G: '', GG: '' }, npConsumo: { PP: '', P: '', M: '', G: '', GG: '' }, npMessage: '✅ Peça registada com sucesso.' })
      get().loadSheets()
    } catch (err) { set({ npMessage: err.message }) }
  },
}))
