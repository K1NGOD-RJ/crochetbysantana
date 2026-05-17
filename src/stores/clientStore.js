import { create } from 'zustand'
import * as api from '../lib/api'
import { calculatePrice, getColorsForPiece, isUniqueSize } from '../lib/pricing'

export const useClientStore = create((set, get) => ({
  // ── Data ──────────────────────────────────────────────────
  sheets: null,
  loading: false,
  error: null,

  // ── Form ──────────────────────────────────────────────────
  activeTab: 'catalog',   // 'catalog' | 'order' | 'history' | 'auth'
  selectedPeca: '',
  selectedTamanho: '',
  selectedColor: '',
  availableColors: [],
  pieceIsUniqueSize: false,
  clienteNome: '',
  telefone: '',
  referencia: '',
  observacoes: '',
  customPieceMode: false,
  customPeca: '',
  formError: '',
  formLoading: false,
  submittedId: '',

  // ── Auth ──────────────────────────────────────────────────
  clientLoggedIn: false,
  clientUser: null,
  clientAuthTab: 'login',
  loginPhone: '',
  loginPassword: '',
  registerName: '',
  registerPhone: '',
  registerPassword: '',
  authError: '',
  orderHistory: [],

  // ── Actions ───────────────────────────────────────────────
  loadSheets: async () => {
    set({ loading: true, error: null })
    try {
      const data = await api.getSheets()
      set({ sheets: data, loading: false })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  setPeca: (peca) => {
    const { sheets } = get()
    if (!sheets) return
    const colors = getColorsForPiece(peca, sheets)
    const uniqueSize = isUniqueSize(peca, sheets)
    set({
      selectedPeca: peca,
      selectedTamanho: uniqueSize ? 'TU' : '',
      selectedColor: '',
      availableColors: colors,
      pieceIsUniqueSize: uniqueSize,
    })
  },

  setTamanho: (t) => set({ selectedTamanho: t }),
  setColor: (c) => set({ selectedColor: c }),
  setClienteNome: (v) => set({ clienteNome: v }),
  setTelefone: (v) => set({ telefone: v }),
  setReferencia: (v) => set({ referencia: v }),
  setObservacoes: (v) => set({ observacoes: v }),
  setCustomPieceMode: (enabled) =>
    set({ customPieceMode: enabled, selectedColor: '', availableColors: [], selectedTamanho: '' }),
  setCustomPeca: (v) => set({ customPeca: v }),

  prefillFromCatalog: (peca) => {
    get().setActiveTab('order')
    get().setPeca(peca)
  },

  submitRequest: async () => {
    const s = get()
    const { sheets, selectedPeca, customPieceMode, customPeca, selectedTamanho, selectedColor,
            clienteNome, telefone, referencia, observacoes } = s

    const peca = customPieceMode ? customPeca : selectedPeca
    if (!peca || !clienteNome || !telefone) {
      set({ formError: 'Preencha todos os campos obrigatórios.' })
      return
    }
    if (!customPieceMode && !s.pieceIsUniqueSize && !selectedTamanho) {
      set({ formError: 'Selecione um tamanho.' })
      return
    }

    set({ formLoading: true, formError: '' })
    try {
      let custoMaterial = 0, custoMO = 0, custoTotal = 0
      if (!customPieceMode && sheets) {
        try {
          const price = calculatePrice(peca, selectedTamanho, 0, sheets)
          custoMaterial = price.material_cost
          custoMO = price.labor_cost
          custoTotal = price.total_cost
        } catch (priceErr) {
          console.warn('calculatePrice failed, submitting without cost estimate:', priceErr.message)
        }
      }

      const result = await api.submitRequest({
        CLIENTE: clienteNome,
        TELEFONE: telefone,
        PECA: peca,
        TAMANHO: selectedTamanho,
        COR: selectedColor,
        REFERENCIA_VISUAL: referencia,
        OBSERVACOES: observacoes,
        CUSTO_MATERIAL: custoMaterial.toFixed(2),
        CUSTO_MO: custoMO.toFixed(2),
        CUSTO_TOTAL: custoTotal.toFixed(2),
      })
      set({
        submittedId: result.id,
        formLoading: false,
        selectedPeca: '', selectedTamanho: '', selectedColor: '',
        clienteNome: '', telefone: '', referencia: '', observacoes: '',
        customPeca: '', customPieceMode: false,
      })
    } catch (err) {
      set({ formError: err.message, formLoading: false })
    }
  },

  // ── Auth actions ──────────────────────────────────────────
  setClientAuthTab: (t) => set({ clientAuthTab: t, authError: '' }),
  setLoginPhone: (v) => set({ loginPhone: v }),
  setLoginPassword: (v) => set({ loginPassword: v }),
  setRegisterName: (v) => set({ registerName: v }),
  setRegisterPhone: (v) => set({ registerPhone: v }),
  setRegisterPassword: (v) => set({ registerPassword: v }),

  clientLogin: async () => {
    const { loginPhone, loginPassword } = get()
    set({ authError: '' })
    try {
      const { user } = await api.clientLogin(loginPhone, loginPassword)
      set({ clientLoggedIn: true, clientUser: user, activeTab: 'history', loginPhone: '', loginPassword: '' })
      get().loadClientHistory(user.telefone)
    } catch (err) {
      set({ authError: err.message })
    }
  },

  clientRegister: async () => {
    const { registerName, registerPhone, registerPassword } = get()
    set({ authError: '' })
    try {
      const { user } = await api.clientRegister(registerName, registerPhone, registerPassword)
      set({ clientLoggedIn: true, clientUser: user, activeTab: 'history', registerName: '', registerPhone: '', registerPassword: '' })
      get().loadClientHistory(user.telefone)
    } catch (err) {
      set({ authError: err.message })
    }
  },

  clientLogout: () => set({
    clientLoggedIn: false, clientUser: null, orderHistory: [], activeTab: 'catalog',
  }),

  loadClientHistory: async (phone) => {
    try {
      const { orders } = await api.getClientOrders(phone)
      set({ orderHistory: orders })
    } catch {}
  },
}))
