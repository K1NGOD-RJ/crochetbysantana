import { useEffect, useState } from 'react'
import { ShoppingBag, Package, ClipboardList, LogIn, LogOut, ExternalLink, Loader2, CheckCircle, User } from 'lucide-react'
import { useClientStore } from '../stores/clientStore'

const SIZES = ['PP', 'P', 'M', 'G', 'GG']
const INPUT = 'w-full border border-c-border rounded-lg px-3 py-2 text-c-text bg-white focus:border-primary focus:outline-none text-sm'

function TabBtn({ label, tab, icon: Icon, active, onClick }) {
  return (
    <button
      onClick={() => onClick(tab)}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
        active ? 'bg-dark text-white' : 'text-primary hover:bg-hover'
      }`}
    >
      <Icon size={14} />
      {label}
    </button>
  )
}

function CatalogImage({ src, alt }) {
  const [errored, setErrored] = useState(false)
  if (!src || errored) {
    return <div className="w-full h-40 bg-lavender rounded-xl flex items-center justify-center mb-3"><Package size={32} className="text-c-border" /></div>
  }
  return (
    <a href={src} target="_blank" rel="noopener noreferrer" className="block mb-3">
      <div className="w-full h-40 bg-lavender rounded-xl flex items-center justify-center overflow-hidden">
        <img src={src} alt={alt} className="object-cover w-full h-full rounded-xl" onError={() => setErrored(true)} />
      </div>
    </a>
  )
}

// ── Catalog tab ───────────────────────────────────────────────
function CatalogTab() {
  const { sheets, loading, prefillFromCatalog } = useClientStore()
  const catalog = sheets?.catalogo || []

  if (loading) return <div className="flex items-center justify-center py-16 gap-2 text-primary"><Loader2 size={20} className="animate-spin" /><span>A carregar...</span></div>
  if (!catalog.length) return <div className="text-center py-16 text-mid">Catálogo vazio.</div>

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {catalog.map((item, i) => (
        <div key={i} className="bg-white rounded-2xl border border-c-border p-4 shadow-sm hover:shadow-md transition-shadow">
          <CatalogImage
            src={(item.URL_FOTOS || '').split(',').map((s) => s.trim()).find(Boolean)}
            alt={item.NOME}
          />
          <h3 className="font-bold text-dark text-sm">{item.NOME}</h3>
          <p className="text-primary text-xs mt-0.5">{item.DESCRICAO}</p>
          <button
            onClick={() => prefillFromCatalog(item.NOME)}
            className="mt-3 w-full bg-lavender text-primary font-semibold py-1.5 rounded-lg text-xs hover:bg-hover transition-colors"
          >
            Encomendar
          </button>
        </div>
      ))}
    </div>
  )
}

// ── Order form tab ────────────────────────────────────────────
function OrderTab() {
  const s = useClientStore()
  const pecas = s.sheets ? [...new Set(s.sheets.receita?.map((r) => r.PECA) || [])] : []

  return (
    <div className="max-w-lg mx-auto bg-white rounded-2xl border border-c-border p-6 shadow-sm">
      <h2 className="text-lg font-bold text-dark mb-4">Nova Encomenda</h2>

      {s.submittedId && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3 mb-4 text-green-700">
          <CheckCircle size={16} />
          <span className="text-sm font-semibold">Pedido {s.submittedId} enviado! Aguarde aprovação.</span>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-dark block mb-1">Nome *</label>
          <input className={INPUT} value={s.clienteNome} onChange={(e) => s.setClienteNome(e.target.value)} placeholder="O seu nome" />
        </div>
        <div>
          <label className="text-xs font-semibold text-dark block mb-1">Telefone *</label>
          <input className={INPUT} value={s.telefone} onChange={(e) => s.setTelefone(e.target.value)} placeholder="(11) 99999-9999" />
        </div>

        <label className="flex items-center gap-2 text-sm text-c-text cursor-pointer">
          <input type="checkbox" checked={s.customPieceMode} onChange={(e) => s.setCustomPieceMode(e.target.checked)} className="accent-primary" />
          Peça personalizada (fora do catálogo)
        </label>

        {s.customPieceMode ? (
          <div>
            <label className="text-xs font-semibold text-dark block mb-1">Descreva a peça *</label>
            <input className={INPUT} value={s.customPeca} onChange={(e) => s.setCustomPeca(e.target.value)} placeholder="Ex: Blusa de crochê manga longa" />
          </div>
        ) : (
          <>
            <div>
              <label className="text-xs font-semibold text-dark block mb-1">Peça *</label>
              <select className={INPUT} value={s.selectedPeca} onChange={(e) => s.setPeca(e.target.value)}>
                <option value="">Selecione uma peça</option>
                {pecas.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            {s.selectedPeca && !s.pieceIsUniqueSize && (
              <div>
                <label className="text-xs font-semibold text-dark block mb-1">Tamanho *</label>
                <div className="flex gap-2 flex-wrap">
                  {SIZES.map((sz) => (
                    <button key={sz} onClick={() => s.setTamanho(sz)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${s.selectedTamanho === sz ? 'bg-primary text-white border-primary' : 'border-c-border text-c-text hover:bg-hover'}`}>{sz}</button>
                  ))}
                </div>
              </div>
            )}
            {s.availableColors.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-dark block mb-1">Cor *</label>
                <select className={INPUT} value={s.selectedColor} onChange={(e) => s.setColor(e.target.value)}>
                  <option value="">Selecione uma cor</option>
                  {s.availableColors.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}
          </>
        )}

        <div>
          <label className="text-xs font-semibold text-dark block mb-1">Referência visual</label>
          <input className={INPUT} value={s.referencia} onChange={(e) => s.setReferencia(e.target.value)} placeholder="Link de foto ou Instagram" />
        </div>
        <div>
          <label className="text-xs font-semibold text-dark block mb-1">Observações</label>
          <textarea className={INPUT + ' resize-none'} rows={3} value={s.observacoes} onChange={(e) => s.setObservacoes(e.target.value)} placeholder="Detalhes adicionais..." />
        </div>

        {s.formError && <p className="text-sm text-red-500">{s.formError}</p>}

        <button
          onClick={s.submitRequest}
          disabled={s.formLoading || (!s.customPieceMode && !s.pieceIsUniqueSize && !!s.selectedPeca && !s.selectedTamanho)}
          className="w-full bg-dark text-white font-bold py-2.5 rounded-xl hover:bg-primary transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {s.formLoading ? <><Loader2 size={16} className="animate-spin" /> A enviar...</> : 'Enviar Pedido'}
        </button>
      </div>
    </div>
  )
}

// ── Auth tab ──────────────────────────────────────────────────
function AuthTab() {
  const s = useClientStore()
  const isLogin = s.clientAuthTab === 'login'

  return (
    <div className="max-w-sm mx-auto bg-white rounded-2xl border border-c-border p-6 shadow-sm">
      <div className="flex gap-2 mb-4">
        {['login', 'register'].map((t) => (
          <button key={t} onClick={() => s.setClientAuthTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${s.clientAuthTab === t ? 'bg-primary text-white' : 'text-primary hover:bg-hover'}`}>
            {t === 'login' ? 'Entrar' : 'Registar'}
          </button>
        ))}
      </div>

      {s.authError && <p className="text-sm text-red-500 mb-3 text-center">{s.authError}</p>}

      {isLogin ? (
        <div className="space-y-3">
          <div><label className="text-xs font-semibold text-dark block mb-1">Telefone</label>
            <input className={INPUT} value={s.loginPhone} onChange={(e) => s.setLoginPhone(e.target.value)} placeholder="(11) 99999-9999" /></div>
          <div><label className="text-xs font-semibold text-dark block mb-1">Senha</label>
            <input type="password" className={INPUT} value={s.loginPassword} onChange={(e) => s.setLoginPassword(e.target.value)} placeholder="••••••••" /></div>
          <button onClick={s.clientLogin} className="w-full bg-dark text-white font-bold py-2.5 rounded-xl hover:bg-primary transition-colors">Entrar</button>
        </div>
      ) : (
        <div className="space-y-3">
          <div><label className="text-xs font-semibold text-dark block mb-1">Nome</label>
            <input className={INPUT} value={s.registerName} onChange={(e) => s.setRegisterName(e.target.value)} placeholder="O seu nome" /></div>
          <div><label className="text-xs font-semibold text-dark block mb-1">Telefone</label>
            <input className={INPUT} value={s.registerPhone} onChange={(e) => s.setRegisterPhone(e.target.value)} placeholder="(11) 99999-9999" /></div>
          <div><label className="text-xs font-semibold text-dark block mb-1">Senha</label>
            <input type="password" className={INPUT} value={s.registerPassword} onChange={(e) => s.setRegisterPassword(e.target.value)} placeholder="Mínimo 6 caracteres" /></div>
          <button onClick={s.clientRegister} className="w-full bg-dark text-white font-bold py-2.5 rounded-xl hover:bg-primary transition-colors">Criar conta</button>
        </div>
      )}
    </div>
  )
}

// ── History tab ───────────────────────────────────────────────
function HistoryTab() {
  const { orderHistory, clientUser } = useClientStore()

  if (!orderHistory.length) return <div className="text-center py-16 text-mid">Nenhuma encomenda encontrada.</div>

  return (
    <div className="space-y-3">
      {orderHistory.map((o, i) => (
        <div key={i} className="bg-white rounded-xl border border-c-border p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-dark bg-lavender px-2 py-0.5 rounded-full">#{o.ID}</span>
              <p className="font-semibold text-dark mt-1">{o.PECA} {o.TAMANHO && `— ${o.TAMANHO}`} {o.COR && `· ${o.COR}`}</p>
            </div>
            <StatusBadge status={o.STATUS} />
          </div>
          <div className="mt-2 flex justify-between text-xs text-mid">
            <span>Prazo: {o.PRAZO || '—'}</span>
            <span className="font-semibold text-green-600">R$ {parseFloat(o.PRECO_VENDA || 0).toFixed(2)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    'Concluída': 'bg-green-100 text-green-700',
    'Em progresso': 'bg-blue-100 text-blue-700',
    'Pendente': 'bg-amber-100 text-amber-700',
  }
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>
}

// ── Main page ─────────────────────────────────────────────────
export default function ClientPage() {
  const { activeTab, setActiveTab, loadSheets, loading, clientLoggedIn, clientUser, clientLogout } = useClientStore()

  useEffect(() => { loadSheets() }, [])

  const tabs = [
    { tab: 'catalog', label: 'Ver Peças', icon: Package },
    { tab: 'order', label: 'Encomendar', icon: ShoppingBag },
    ...(clientLoggedIn ? [{ tab: 'history', label: 'Meus Pedidos', icon: ClipboardList }] : []),
    { tab: 'auth', label: clientLoggedIn ? 'Conta' : 'Entrar', icon: clientLoggedIn ? User : LogIn },
  ]

  return (
    <div className="min-h-screen bg-c-bg">
      {/* Navbar */}
      <nav className="bg-white border-b border-c-border sticky top-0 z-10 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-lavender flex items-center justify-center">
              <ShoppingBag size={16} className="text-primary" />
            </div>
            <span className="font-bold text-dark text-sm">CrochetbySantana</span>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {tabs.map((t) => (
              <TabBtn key={t.tab} {...t} active={activeTab === t.tab} onClick={setActiveTab} />
            ))}
            {clientLoggedIn && (
              <button onClick={clientLogout} className="flex items-center gap-1 px-3 py-2 rounded-full text-xs text-mid hover:text-red-500 transition-colors">
                <LogOut size={13} /> Sair
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {activeTab === 'catalog' && <CatalogTab />}
        {activeTab === 'order' && <OrderTab />}
        {activeTab === 'auth' && !clientLoggedIn && <AuthTab />}
        {activeTab === 'auth' && clientLoggedIn && (
          <div className="text-center py-8">
            <p className="text-dark font-semibold">Olá, {clientUser?.nome}!</p>
            <button onClick={clientLogout} className="mt-3 text-sm text-red-500 hover:underline flex items-center gap-1 mx-auto"><LogOut size={14} /> Terminar sessão</button>
          </div>
        )}
        {activeTab === 'history' && <HistoryTab />}
      </main>
    </div>
  )
}
