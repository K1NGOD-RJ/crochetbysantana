import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Clock, ClipboardList, Package, Users, Table2, LogOut, Loader2,
  Pencil, Trash2, CheckCircle, XCircle, Plus, RefreshCw, ExternalLink,
  MessageCircle, ShoppingCart, ArrowUpFromLine, BarChart2, Image, Scissors, Palette,
  Ruler, ChevronDown, ChevronRight,
} from 'lucide-react'
import { useOwnerStore } from '../stores/ownerStore'

const INPUT = 'w-full border border-c-border rounded-lg px-3 py-2 text-c-text bg-white focus:border-primary focus:outline-none text-sm'
const SELECT = INPUT

// ── Shared UI ─────────────────────────────────────────────────
function TabBtn({ label, tab, icon: Icon, active, onClick }) {
  return (
    <button onClick={() => onClick(tab)}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap ${active ? 'bg-dark text-white' : 'text-primary hover:bg-hover'}`}>
      <Icon size={14} />{label}
    </button>
  )
}

function MsgBox({ msg }) {
  if (!msg) return null
  const isOk = msg.startsWith('✅')
  return (
    <div className={`flex items-center gap-2 rounded-xl p-3 mt-3 text-sm ${isOk ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
      {isOk ? <CheckCircle size={14} /> : <XCircle size={14} />}{msg.replace('✅ ', '').replace('❌ ', '')}
    </div>
  )
}

function DeleteBtn({ onClick }) {
  return (
    <button onClick={onClick} className="text-red-400 border border-red-200 p-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer" title="Remover">
      <Trash2 size={14} />
    </button>
  )
}

function EditBtn({ onClick }) {
  return (
    <button onClick={onClick} className="text-primary border border-c-border p-1.5 rounded-lg hover:bg-hover transition-colors cursor-pointer" title="Editar">
      <Pencil size={14} />
    </button>
  )
}

function StatusBadge({ status }) {
  const map = { 'Concluída': 'bg-green-100 text-green-700', 'Em progresso': 'bg-blue-100 text-blue-700', 'Pendente': 'bg-amber-100 text-amber-700' }
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>
}

function EditPanel({ title, fields, onSave, onCancel }) {
  return (
    <div className="mt-4 border border-primary rounded-xl bg-lavender p-4">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-1.5"><Pencil size={14} className="text-primary" /><span className="font-bold text-dark text-sm">{title}</span></div>
        <button onClick={onCancel} className="text-mid border border-c-border p-1.5 rounded-lg hover:bg-white transition-colors"><XCircle size={14} /></button>
      </div>
      <div className="flex gap-3 flex-wrap items-end">
        {fields}
        <button onClick={onSave} className="bg-green-600 text-white font-bold px-5 py-2 rounded-xl hover:bg-green-700 transition-colors text-sm flex items-center gap-1.5 self-end">
          <CheckCircle size={14} /> Guardar
        </button>
      </div>
    </div>
  )
}

// ── Pendentes tab ─────────────────────────────────────────────
function PendentesTab() {
  const s = useOwnerStore()
  useEffect(() => { s.loadPending(); s.loadSheets() }, [])

  const rec = s.selectedPendingRecord

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div><div className="flex items-center gap-2"><Clock size={18} className="text-dark" /><h2 className="text-lg font-bold text-dark">Pedidos Pendentes</h2></div>
          <p className="text-sm text-mid">{s.pendingData.length} a aguardar aprovação</p></div>
        <button onClick={s.loadPending} className="flex items-center gap-1.5 px-3 py-2 text-sm text-primary border border-c-border rounded-xl hover:bg-hover transition-colors">
          <RefreshCw size={14} /> Atualizar</button>
      </div>

      {s.pendingLoading && <div className="flex items-center gap-2 py-8 justify-center text-primary"><Loader2 size={20} className="animate-spin" />A carregar...</div>}

      {!s.pendingLoading && s.pendingData.length === 0 && (
        <div className="flex flex-col items-center py-16 bg-lavender rounded-2xl border border-dashed border-c-border">
          <Clock size={32} className="text-c-border mb-2" /><p className="font-semibold text-dark">Sem pedidos pendentes</p>
          <p className="text-sm text-mid mt-1">Novos pedidos aparecerão aqui.</p>
        </div>
      )}

      <div className="space-y-3">
        {s.pendingData.map((p) => (
          <div key={p.ID}
            onClick={() => s.setSelectedPending(p.ID)}
            className={`bg-white rounded-xl border p-4 shadow-sm cursor-pointer hover:shadow-md transition-all ${s.selectedPendingId === p.ID ? 'border-primary' : 'border-c-border'}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary bg-lavender px-2 py-0.5 rounded-full">{p.ID}</span>
                <span className="font-semibold text-dark">{p.CLIENTE}</span>
              </div>
              <span className="text-xs text-mid">{p.TELEFONE}</span>
            </div>
            <p className="text-sm text-primary mt-1">{p.PECA} · {p.TAMANHO} · {p.COR}</p>
            {p.OBSERVACOES && <p className="text-xs text-mid mt-1 truncate">{p.OBSERVACOES}</p>}
            <div className="flex justify-between mt-2 pt-2 border-t border-c-border/40 text-xs text-mid">
              <span>Custo: R$ {parseFloat(p.CUSTO_TOTAL || 0).toFixed(2)}</span>
              <span>{p.DATA_SOLICITACAO}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Approval panel */}
      {rec && (
        <div className="mt-6 bg-white rounded-2xl border border-c-border p-5 shadow-sm">
          <h3 className="font-bold text-dark mb-4 flex items-center gap-1.5"><CheckCircle size={16} className="text-primary" />Aprovar Pedido {s.selectedPendingId}</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div><label className="text-xs font-semibold text-dark block mb-1">Preço de Venda (R$) *</label>
              <input className={INPUT} value={s.precoVendaInput} onChange={(e) => s.setPrecoVendaInput(e.target.value)} /></div>
            <div><label className="text-xs font-semibold text-dark block mb-1">Lucro Estimado</label>
              <div className="border border-c-border rounded-lg px-3 py-2 text-sm text-green-600 font-semibold bg-green-50">R$ {s.estimatedProfit || '—'}</div></div>
            <div><label className="text-xs font-semibold text-dark block mb-1">Prazo *</label>
              <input type="date" className={INPUT} value={s.approvalPrazo} onChange={(e) => useOwnerStore.setState({ approvalPrazo: e.target.value })} /></div>
            <div><label className="text-xs font-semibold text-dark block mb-1">Linha</label>
              <input className={INPUT} value={s.approvalLinha} onChange={(e) => useOwnerStore.setState({ approvalLinha: e.target.value })} /></div>
          </div>

          {s.isCustomPiece && (
            <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-lavender rounded-xl">
              <div><label className="text-xs font-semibold text-dark block mb-1">Custo Material</label>
                <input className={INPUT} value={s.approvalCustoMat} onChange={(e) => useOwnerStore.setState({ approvalCustoMat: e.target.value })} /></div>
              <div><label className="text-xs font-semibold text-dark block mb-1">Custo M.O.</label>
                <input className={INPUT} value={s.approvalCustoMO} onChange={(e) => useOwnerStore.setState({ approvalCustoMO: e.target.value })} /></div>
            </div>
          )}

          <MsgBox msg={s.approvalMessage} />

          <div className="flex gap-2 mt-4 flex-wrap">
            <button onClick={s.approveRequest} className="flex items-center gap-1.5 bg-green-600 text-white font-bold px-5 py-2 rounded-xl hover:bg-green-700 text-sm">
              <CheckCircle size={14} /> Aprovar
            </button>
            <button onClick={s.rejectRequest} className="flex items-center gap-1.5 bg-red-500 text-white font-bold px-5 py-2 rounded-xl hover:bg-red-600 text-sm">
              <XCircle size={14} /> Rejeitar
            </button>
            {s.whatsappUrl && (
              <a href={s.whatsappUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-green-500 text-white font-bold px-5 py-2 rounded-xl hover:bg-green-600 text-sm">
                <MessageCircle size={14} /> WhatsApp
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Encomendas tab ────────────────────────────────────────────
function EncomendasTab() {
  const s = useOwnerStore()
  useEffect(() => { s.loadOrders() }, [])

  const STATUSES = ['Todos', 'Pendente', 'Em progresso', 'Concluída']

  return (
    <div>
      <div className="flex items-center gap-2 mb-4"><ClipboardList size={18} className="text-dark" /><h2 className="text-lg font-bold text-dark">Encomendas</h2></div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {STATUSES.map((st) => (
          <button key={st} onClick={() => s.setOrderStatusFilter(st)}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors ${s.orderStatusFilter === st ? 'bg-dark text-white border-dark' : 'border-c-border text-c-text hover:bg-hover'}`}>{st}</button>
        ))}
      </div>

      {s.ordersLoading && <div className="flex items-center gap-2 py-8 justify-center text-primary"><Loader2 size={20} className="animate-spin" />A carregar...</div>}

      {!s.ordersLoading && s.filteredOrdersData.length === 0 && (
        <div className="flex flex-col items-center py-12 bg-lavender rounded-2xl border border-dashed border-c-border">
          <ClipboardList size={32} className="text-c-border mb-2" /><p className="text-dark font-semibold">Nenhuma encomenda encontrada.</p>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-c-border shadow-sm">
        {s.filteredOrdersData.length > 0 && (
          <table className="w-full text-sm">
            <thead><tr className="bg-lavender border-b-2 border-c-border">
              {['ID', 'Cliente', 'Peça', 'Tam', 'Cor', 'Preço', 'Prazo', 'Status', ''].map((h) => (
                <th key={h} className="text-xs font-semibold text-primary uppercase tracking-wider px-3 py-3 text-left">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {s.filteredOrdersData.map((o, i) => (
                <tr key={i} className="border-b border-c-border/40 hover:bg-c-bg transition-colors">
                  <td className="px-3 py-2"><span className="bg-lavender text-primary text-xs font-bold px-1.5 py-0.5 rounded">#{o.ID}</span></td>
                  <td className="px-3 py-2 font-semibold text-dark">{o.CLIENTE}</td>
                  <td className="px-3 py-2 text-c-text">{o.PECA}</td>
                  <td className="px-3 py-2 text-c-text">{o.TAMANHO}</td>
                  <td className="px-3 py-2 text-c-text">{o.COR}</td>
                  <td className="px-3 py-2 text-green-600 font-semibold">R$ {parseFloat(o.PRECO_VENDA || 0).toFixed(2)}</td>
                  <td className="px-3 py-2 text-c-text">{o.PRAZO}</td>
                  <td className="px-3 py-2"><StatusBadge status={o.STATUS} /></td>
                  <td className="px-3 py-2"><DeleteBtn onClick={() => s.deleteOrder(o.ID)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Status update panel */}
      <div className="mt-4 bg-white rounded-xl border border-c-border p-4">
        <p className="text-sm font-bold text-dark mb-3">Atualizar Status</p>
        <div className="flex gap-3 flex-wrap items-end">
          <div className="flex-1 min-w-32"><label className="text-xs font-semibold text-dark block mb-1">ID da Encomenda</label>
            <input className={INPUT} value={s.orderUpdateId} onChange={(e) => useOwnerStore.setState({ orderUpdateId: e.target.value })} placeholder="0001" /></div>
          <div className="flex-1 min-w-40"><label className="text-xs font-semibold text-dark block mb-1">Novo Status</label>
            <select className={SELECT} value={s.orderUpdateStatus} onChange={(e) => useOwnerStore.setState({ orderUpdateStatus: e.target.value })}>
              <option>Pendente</option><option>Em progresso</option><option>Concluída</option>
            </select></div>
          <button onClick={s.saveOrderStatus} className="bg-primary text-white font-bold px-5 py-2 rounded-xl hover:bg-dark text-sm">Guardar</button>
        </div>
        <MsgBox msg={s.orderActionMsg} />
      </div>
    </div>
  )
}

// ── Tabelas tab ───────────────────────────────────────────────
function TabelasTab() {
  const s = useOwnerStore()
  useEffect(() => { s.setTabelasSubtab(s.tabelasSubtab) }, [])

  const subtabs = [
    { key: 'catalogo', label: 'Catálogo', icon: Image },
    { key: 'linhas', label: 'Linhas', icon: Scissors },
    { key: 'cores', label: 'Cores', icon: Palette },
    { key: 'nova_peca', label: 'Nova Peça', icon: Plus },
  ]

  return (
    <div>
      <div className="flex items-center gap-2 mb-4"><Table2 size={18} className="text-dark" /><h2 className="text-lg font-bold text-dark">Tabelas de Referência</h2></div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {subtabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => key === 'nova_peca' ? useOwnerStore.setState({ tabelasSubtab: 'nova_peca' }) : s.setTabelasSubtab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${s.tabelasSubtab === key ? 'bg-dark text-white border-dark' : 'border-c-border text-c-text hover:bg-hover'}`}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {s.tabelasSubtab !== 'nova_peca' && <TableEditor />}
      {s.tabelasSubtab === 'nova_peca' && <NewPecaForm />}
    </div>
  )
}

function TableEditor() {
  const s = useOwnerStore()
  const isCatalog = s.tabelasSubtab === 'catalogo'
  const isLinhas = s.tabelasSubtab === 'linhas'
  const isCores = s.tabelasSubtab === 'cores'
  const linhasNames = s.sheets?.linhas?.map((r) => r.LINHAS) || []

  return (
    <div>
      {s.tableLoading && <div className="flex items-center gap-2 py-8 justify-center text-primary"><Loader2 size={20} className="animate-spin" />A carregar...</div>}

      {!s.tableLoading && (
        <>
          {/* Table */}
          <div className="rounded-xl border border-c-border overflow-hidden shadow-sm mb-4">
            <table className="w-full text-sm">
              <thead><tr className="bg-lavender border-b-2 border-c-border">
                {isCatalog && ['Nome', 'Descrição', 'Foto', ''].map((h) => <th key={h} className="text-xs font-semibold text-primary uppercase tracking-wider px-3 py-3 text-left">{h}</th>)}
                {isLinhas && ['Nome da Linha', 'Preço (R$)', ''].map((h) => <th key={h} className="text-xs font-semibold text-primary uppercase tracking-wider px-3 py-3 text-left">{h}</th>)}
                {isCores && ['Linha', 'Cor', ''].map((h) => <th key={h} className="text-xs font-semibold text-primary uppercase tracking-wider px-3 py-3 text-left">{h}</th>)}
              </tr></thead>
              <tbody>
                {s.tableViewData.map((row) => (
                  <tr key={row._idx}
                    className={`border-b border-c-border/40 transition-colors ${s.tableEditIdx === row._idx ? 'bg-lavender border-primary' : 'hover:bg-c-bg'}`}>
                    {isCatalog && <>
                      <td className="px-3 py-2 font-semibold text-dark">{row.NOME}</td>
                      <td className="px-3 py-2 text-primary">{row.DESCRICAO}</td>
                      <td className="px-3 py-2">{row.URL_FOTO ? <a href={row.URL_FOTO} target="_blank" rel="noopener noreferrer" className="text-primary text-xs flex items-center gap-1 hover:underline"><ExternalLink size={12} />Ver foto</a> : <span className="text-c-border">—</span>}</td>
                    </>}
                    {isLinhas && <>
                      <td className="px-3 py-2 font-semibold text-dark">{row.LINHAS}</td>
                      <td className="px-3 py-2 text-green-600 font-semibold">R$ {row.VALOR}</td>
                    </>}
                    {isCores && <>
                      <td className="px-3 py-2 font-semibold text-dark">{row.LINHA}</td>
                      <td className="px-3 py-2 text-primary">{row.COR}</td>
                    </>}
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        <EditBtn onClick={() => s.selectForEdit(row._idx)} />
                        {isCatalog && <DeleteBtn onClick={() => s.deleteCatalogItem(row._idx)} />}
                        {isLinhas && <DeleteBtn onClick={() => s.deleteLinhasRow(row._idx)} />}
                        {isCores && <DeleteBtn onClick={() => s.deleteCoresRow(row._idx)} />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Edit panel */}
          {s.tableEditIdx !== '' && (
            <EditPanel
              title={isCatalog ? 'Editar Peça' : isLinhas ? 'Editar Linha' : 'Editar Cor'}
              onSave={s.saveTableEdit}
              onCancel={s.cancelTableEdit}
              fields={<>
                <div className="flex-1 min-w-32">
                  <label className="text-xs font-semibold text-dark block mb-1">{isCatalog ? 'Nome *' : isLinhas ? 'Nome da Linha *' : 'Linha *'}</label>
                  <input className={INPUT} value={s.tableEditF1} onChange={(e) => useOwnerStore.setState({ tableEditF1: e.target.value })} />
                </div>
                <div className="flex-1 min-w-32">
                  <label className="text-xs font-semibold text-dark block mb-1">{isCatalog ? 'Descrição' : isLinhas ? 'Preço (R$)' : 'Cor'}</label>
                  <input className={INPUT} value={s.tableEditF2} onChange={(e) => useOwnerStore.setState({ tableEditF2: e.target.value })} />
                </div>
                {isCatalog && (
                  <div className="flex-[2] min-w-48">
                    <label className="text-xs font-semibold text-dark block mb-1">URL da Foto</label>
                    <input className={INPUT} value={s.tableEditF3} onChange={(e) => useOwnerStore.setState({ tableEditF3: e.target.value })} placeholder="https://..." />
                  </div>
                )}
              </>}
            />
          )}

          {/* Add form */}
          <div className="mt-4 bg-white rounded-xl border border-c-border p-4">
            <p className="text-sm font-bold text-dark mb-3 flex items-center gap-1.5"><Plus size={14} className="text-primary" />
              {isCatalog ? 'Adicionar ao Catálogo' : isLinhas ? 'Adicionar Linha' : 'Adicionar Cor'}
            </p>
            <div className="flex gap-3 flex-wrap items-end">
              {isCatalog && <>
                <div className="flex-1 min-w-32"><label className="text-xs font-semibold text-dark block mb-1">Nome *</label>
                  <input className={INPUT} value={s.catNomeInput} onChange={(e) => useOwnerStore.setState({ catNomeInput: e.target.value })} placeholder="Ex: CROPPED LILÁS" /></div>
                <div className="flex-1 min-w-32"><label className="text-xs font-semibold text-dark block mb-1">Descrição / Cor</label>
                  <input className={INPUT} value={s.catDescInput} onChange={(e) => useOwnerStore.setState({ catDescInput: e.target.value })} placeholder="Ex: Cor, tamanho, M" /></div>
                <div className="flex-[2] min-w-48"><label className="text-xs font-semibold text-dark block mb-1">URL da Foto</label>
                  <input className={INPUT} value={s.catFotoInput} onChange={(e) => useOwnerStore.setState({ catFotoInput: e.target.value })} placeholder="https://drive.google.com/..." /></div>
                <button onClick={s.addCatalogItem} className="bg-primary text-white font-bold px-5 py-2 rounded-xl hover:bg-dark text-sm flex items-center gap-1.5 self-end"><Plus size={14} />Adicionar</button>
              </>}
              {isLinhas && <>
                <div className="flex-[2]"><label className="text-xs font-semibold text-dark block mb-1">Nome *</label>
                  <input className={INPUT} value={s.newLinhasNome} onChange={(e) => useOwnerStore.setState({ newLinhasNome: e.target.value })} placeholder="Ex: Amigurumi" /></div>
                <div className="flex-1"><label className="text-xs font-semibold text-dark block mb-1">Preço (R$) *</label>
                  <input className={INPUT} value={s.newLinhasValor} onChange={(e) => useOwnerStore.setState({ newLinhasValor: e.target.value })} placeholder="Ex: 12.50" /></div>
                <button onClick={s.addLinhasRow} className="bg-primary text-white font-bold px-5 py-2 rounded-xl hover:bg-dark text-sm flex items-center gap-1.5 self-end"><Plus size={14} />Adicionar</button>
              </>}
              {isCores && <>
                <div className="flex-1"><label className="text-xs font-semibold text-dark block mb-1">Linha *</label>
                  <select className={SELECT} value={s.newCoresLinha} onChange={(e) => useOwnerStore.setState({ newCoresLinha: e.target.value })}>
                    <option value="">Selecione...</option>
                    {linhasNames.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select></div>
                <div className="flex-1"><label className="text-xs font-semibold text-dark block mb-1">Cor *</label>
                  <input className={INPUT} value={s.newCoresCor} onChange={(e) => useOwnerStore.setState({ newCoresCor: e.target.value })} placeholder="Ex: Verde Menta" /></div>
                <button onClick={s.addCoresRow} className="bg-primary text-white font-bold px-5 py-2 rounded-xl hover:bg-dark text-sm flex items-center gap-1.5 self-end"><Plus size={14} />Adicionar</button>
              </>}
            </div>
          </div>
          <MsgBox msg={s.tableMsg} />
        </>
      )}
    </div>
  )
}

function NewPecaForm() {
  const s = useOwnerStore()
  const SIZES = ['PP', 'P', 'M', 'G', 'GG']
  const linhasNames = s.sheets?.linhas?.map((r) => r.LINHAS) || []

  return (
    <div className="bg-white rounded-xl border border-c-border p-5 shadow-sm">
      <h3 className="font-bold text-dark mb-4 flex items-center gap-1.5"><Plus size={16} className="text-primary" />Cadastrar Nova Peça</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div><label className="text-xs font-semibold text-dark block mb-1">Nome da Peça *</label>
          <input className={INPUT} value={s.npNome} onChange={(e) => useOwnerStore.setState({ npNome: e.target.value })} placeholder="Ex: VESTIDO TUBINHO" /></div>
        <div><label className="text-xs font-semibold text-dark block mb-1">Linha *</label>
          <select className={SELECT} value={s.npLinha} onChange={(e) => useOwnerStore.setState({ npLinha: e.target.value })}>
            <option value="">Selecione a linha</option>
            {linhasNames.map((l) => <option key={l} value={l}>{l}</option>)}
          </select></div>
        <div className="sm:col-span-2"><label className="text-xs font-semibold text-dark block mb-1">Observações</label>
          <input className={INPUT} value={s.npObs} onChange={(e) => useOwnerStore.setState({ npObs: e.target.value })} /></div>
      </div>
      <label className="flex items-center gap-2 text-sm text-c-text mb-4 cursor-pointer">
        <input type="checkbox" checked={s.npIsUniqueSize} onChange={(e) => {
          const checked = e.target.checked
          const empty = checked ? { TU: '' } : { PP: '', P: '', M: '', G: '', GG: '' }
          useOwnerStore.setState({ npIsUniqueSize: checked, npHoras: empty, npConsumo: empty })
        }} className="accent-primary" />
        Tamanho único (TU)
      </label>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-2">
        {(s.npIsUniqueSize ? ['TU'] : SIZES).map((sz) => (
          <div key={sz}>
            <label className="text-xs font-semibold text-dark block mb-1">{sz} — Horas</label>
            <input className={INPUT} type="number" step="0.1" value={s.npHoras[sz] || ''} onChange={(e) => useOwnerStore.setState({ npHoras: { ...s.npHoras, [sz]: e.target.value } })} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
        {(s.npIsUniqueSize ? ['TU'] : SIZES).map((sz) => (
          <div key={sz}>
            <label className="text-xs font-semibold text-dark block mb-1">{sz} — Consumo</label>
            <input className={INPUT} type="number" step="0.1" value={s.npConsumo[sz] || ''} onChange={(e) => useOwnerStore.setState({ npConsumo: { ...s.npConsumo, [sz]: e.target.value } })} />
          </div>
        ))}
      </div>

      <button onClick={s.registerPiece} className="bg-primary text-white font-bold px-6 py-2.5 rounded-xl hover:bg-dark transition-colors flex items-center gap-1.5">
        <Plus size={14} /> Cadastrar Peça
      </button>
      <MsgBox msg={s.npMessage} />
    </div>
  )
}

// ── Estoque tab ───────────────────────────────────────────────
function EstoqueTab() {
  const s = useOwnerStore()
  useEffect(() => { s.loadStock(); s.loadSheets() }, [])

  const linhasNames = s.sheets?.linhas?.map((r) => r.LINHAS) || []
  const coresMap = {}
  s.sheets?.cores?.forEach((r) => { if (!coresMap[r.LINHA]) coresMap[r.LINHA] = []; coresMap[r.LINHA].push(r.COR) })

  const subtabs = [
    { key: 'estoque', label: 'Estoque Atual', icon: BarChart2 },
    { key: 'compras', label: 'Compras', icon: ShoppingCart },
    { key: 'consumo', label: 'Consumo', icon: ArrowUpFromLine },
  ]

  return (
    <div>
      <div className="flex items-center gap-2 mb-4"><Package size={18} className="text-dark" /><h2 className="text-lg font-bold text-dark">Gestão de Estoque</h2></div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {subtabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => useOwnerStore.setState({ stockTab: key })}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${s.stockTab === key ? 'bg-dark text-white border-dark' : 'border-c-border text-c-text hover:bg-hover'}`}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {s.stockLoading && <div className="flex items-center gap-2 py-8 justify-center text-primary"><Loader2 size={20} className="animate-spin" />A carregar...</div>}

      {/* Estoque atual */}
      {s.stockTab === 'estoque' && !s.stockLoading && (
        <div className="overflow-x-auto rounded-xl border border-c-border shadow-sm">
          <table className="w-full text-sm">
            <thead><tr className="bg-lavender border-b-2 border-c-border">
              {['Linha', 'Cor', 'Entradas', 'Saídas', 'Estoque'].map((h) => <th key={h} className="text-xs font-semibold text-primary uppercase tracking-wider px-3 py-3 text-left">{h}</th>)}
            </tr></thead>
            <tbody>
              {s.stockData.map((row, i) => (
                <tr key={i} className="border-b border-c-border/40 hover:bg-c-bg">
                  <td className="px-3 py-2 font-semibold text-dark">{row.LINHA}</td>
                  <td className="px-3 py-2 text-primary">{row.COR}</td>
                  <td className="px-3 py-2">{row.ENTRADAS}</td>
                  <td className="px-3 py-2">{row.SAIDAS}</td>
                  <td className={`px-3 py-2 font-bold ${row.ESTOQUE_ATUAL <= 2 ? 'text-red-600' : 'text-green-600'}`}>{row.ESTOQUE_ATUAL}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Compras */}
      {s.stockTab === 'compras' && !s.stockLoading && (
        <>
          <div className="overflow-x-auto rounded-xl border border-c-border shadow-sm mb-4">
            <table className="w-full text-sm">
              <thead><tr className="bg-lavender border-b-2 border-c-border">
                {['ID', 'Data', 'Linha', 'Cor', 'Qtd', 'Custo Unit', 'Total', 'Fornecedor', ''].map((h) => <th key={h} className="text-xs font-semibold text-primary uppercase tracking-wider px-3 py-2 text-left">{h}</th>)}
              </tr></thead>
              <tbody>
                {s.comprasData.map((c, i) => (
                  <tr key={i} className="border-b border-c-border/40 hover:bg-c-bg">
                    <td className="px-3 py-2 text-xs text-mid">{c.ID}</td>
                    <td className="px-3 py-2 text-c-text">{c.DATA}</td>
                    <td className="px-3 py-2 font-semibold text-dark">{c.LINHA}</td>
                    <td className="px-3 py-2 text-primary">{c.COR}</td>
                    <td className="px-3 py-2">{c.QUANTIDADE}</td>
                    <td className="px-3 py-2">R$ {c.CUSTO_UNIT}</td>
                    <td className="px-3 py-2 font-semibold">R$ {c.CUSTO_TOTAL}</td>
                    <td className="px-3 py-2 text-mid">{c.FORNECEDOR}</td>
                    <td className="px-3 py-2"><DeleteBtn onClick={() => s.deleteCompra(c.ID)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-white rounded-xl border border-c-border p-4">
            <p className="text-sm font-bold text-dark mb-3 flex items-center gap-1.5"><Plus size={14} className="text-primary" />Registar Compra</p>
            <div className="flex gap-3 flex-wrap items-end">
              <div className="flex-1 min-w-32"><label className="text-xs font-semibold text-dark block mb-1">Linha *</label>
                <select className={SELECT} value={s.compraLinha} onChange={(e) => useOwnerStore.setState({ compraLinha: e.target.value, compraCor: '' })}>
                  <option value="">Selecione...</option>{linhasNames.map((l) => <option key={l} value={l}>{l}</option>)}
                </select></div>
              <div className="flex-1 min-w-32"><label className="text-xs font-semibold text-dark block mb-1">Cor *</label>
                <select className={SELECT} value={s.compraCor} onChange={(e) => useOwnerStore.setState({ compraCor: e.target.value })}>
                  <option value="">Selecione...</option>{(coresMap[s.compraLinha] || []).map((c) => <option key={c} value={c}>{c}</option>)}
                </select></div>
              <div className="w-24"><label className="text-xs font-semibold text-dark block mb-1">Qtd *</label>
                <input className={INPUT} type="number" value={s.compraQtd} onChange={(e) => useOwnerStore.setState({ compraQtd: e.target.value })} /></div>
              <div className="w-28"><label className="text-xs font-semibold text-dark block mb-1">Custo/un</label>
                <input className={INPUT} type="number" value={s.compraCustoUnit} onChange={(e) => useOwnerStore.setState({ compraCustoUnit: e.target.value })} /></div>
              <div className="flex-1 min-w-32"><label className="text-xs font-semibold text-dark block mb-1">Fornecedor</label>
                <input className={INPUT} value={s.compraFornecedor} onChange={(e) => useOwnerStore.setState({ compraFornecedor: e.target.value })} /></div>
              <button onClick={s.addCompra} className="bg-primary text-white font-bold px-5 py-2 rounded-xl hover:bg-dark text-sm flex items-center gap-1.5 self-end"><Plus size={14} />Adicionar</button>
            </div>
          </div>
        </>
      )}

      {/* Consumo */}
      {s.stockTab === 'consumo' && !s.stockLoading && (
        <>
          <div className="overflow-x-auto rounded-xl border border-c-border shadow-sm mb-4">
            <table className="w-full text-sm">
              <thead><tr className="bg-lavender border-b-2 border-c-border">
                {['ID', 'Data', 'Linha', 'Cor', 'Qtd', 'Pedido Ref', ''].map((h) => <th key={h} className="text-xs font-semibold text-primary uppercase tracking-wider px-3 py-2 text-left">{h}</th>)}
              </tr></thead>
              <tbody>
                {s.consumoData.map((c, i) => (
                  <tr key={i} className="border-b border-c-border/40 hover:bg-c-bg">
                    <td className="px-3 py-2 text-xs text-mid">{c.ID}</td>
                    <td className="px-3 py-2 text-c-text">{c.DATA}</td>
                    <td className="px-3 py-2 font-semibold text-dark">{c.LINHA}</td>
                    <td className="px-3 py-2 text-primary">{c.COR}</td>
                    <td className="px-3 py-2">{c.QUANTIDADE}</td>
                    <td className="px-3 py-2 text-mid">{c.PEDIDO_REF}</td>
                    <td className="px-3 py-2"><DeleteBtn onClick={() => s.deleteConsumoReg(c.ID)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-white rounded-xl border border-c-border p-4">
            <p className="text-sm font-bold text-dark mb-3 flex items-center gap-1.5"><Plus size={14} className="text-primary" />Registar Consumo</p>
            <div className="flex gap-3 flex-wrap items-end">
              <div className="flex-1 min-w-32"><label className="text-xs font-semibold text-dark block mb-1">Linha *</label>
                <select className={SELECT} value={s.consumoRegLinha} onChange={(e) => useOwnerStore.setState({ consumoRegLinha: e.target.value, consumoRegCor: '' })}>
                  <option value="">Selecione...</option>{linhasNames.map((l) => <option key={l} value={l}>{l}</option>)}
                </select></div>
              <div className="flex-1 min-w-32"><label className="text-xs font-semibold text-dark block mb-1">Cor *</label>
                <select className={SELECT} value={s.consumoRegCor} onChange={(e) => useOwnerStore.setState({ consumoRegCor: e.target.value })}>
                  <option value="">Selecione...</option>{(coresMap[s.consumoRegLinha] || []).map((c) => <option key={c} value={c}>{c}</option>)}
                </select></div>
              <div className="w-24"><label className="text-xs font-semibold text-dark block mb-1">Qtd *</label>
                <input className={INPUT} type="number" value={s.consumoRegQtd} onChange={(e) => useOwnerStore.setState({ consumoRegQtd: e.target.value })} /></div>
              <div className="flex-1 min-w-32"><label className="text-xs font-semibold text-dark block mb-1">Pedido Ref</label>
                <input className={INPUT} value={s.consumoRegPedidoRef} onChange={(e) => useOwnerStore.setState({ consumoRegPedidoRef: e.target.value })} /></div>
              <button onClick={s.addConsumoRegistro} className="bg-primary text-white font-bold px-5 py-2 rounded-xl hover:bg-dark text-sm flex items-center gap-1.5 self-end"><Plus size={14} />Adicionar</button>
            </div>
          </div>
        </>
      )}
      <MsgBox msg={s.stockMsg} />
    </div>
  )
}

// ── Medidas panel (inline below a client row) ─────────────────
function MedidasPanel() {
  const s = useOwnerStore()
  const fields = [
    { key: 'medidasBusto', label: 'Busto / Tórax (cm)' },
    { key: 'medidasCintura', label: 'Cintura (cm)' },
    { key: 'medidasQuadril', label: 'Quadril (cm)' },
    { key: 'medidasComprimento', label: 'Comprimento (cm)' },
    { key: 'medidasOmbro', label: 'Ombro (cm)' },
    { key: 'medidasManga', label: 'Manga (cm)' },
  ]
  if (s.medidasLoading) return (
    <div className="flex items-center gap-2 py-3 text-primary text-sm"><Loader2 size={14} className="animate-spin" />A carregar medidas...</div>
  )
  return (
    <div className="p-4 bg-lavender border-t border-c-border">
      <div className="flex items-center gap-1.5 mb-3"><Ruler size={14} className="text-primary" /><span className="text-sm font-bold text-dark">Medidas da cliente</span></div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
        {fields.map(({ key, label }) => (
          <div key={key}>
            <label className="text-xs font-semibold text-dark block mb-1">{label}</label>
            <input className={INPUT} type="number" step="0.1" value={s[key]}
              onChange={(e) => useOwnerStore.setState({ [key]: e.target.value })} placeholder="—" />
          </div>
        ))}
      </div>
      <button onClick={s.saveMedidas} className="bg-primary text-white font-bold px-5 py-2 rounded-xl hover:bg-dark text-sm">
        Guardar medidas
      </button>
      <MsgBox msg={s.medidasMsg} />
    </div>
  )
}

// ── Clientes tab ──────────────────────────────────────────────
function ClientesTab() {
  const s = useOwnerStore()
  useEffect(() => { if (!s.ordersData.length) s.loadOrders() }, [])

  return (
    <div>
      <div className="flex items-center gap-2 mb-4"><Users size={18} className="text-dark" /><h2 className="text-lg font-bold text-dark">Clientes</h2></div>
      {!s.clientsData.length ? (
        <div className="flex flex-col items-center py-12 bg-lavender rounded-2xl border border-dashed border-c-border">
          <Users size={32} className="text-c-border mb-2" /><p className="text-dark font-semibold">Nenhum cliente registado.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-c-border shadow-sm overflow-hidden">
          {s.clientsData.map((c, i) => {
            const isExpanded = s.expandedClientPhone === c.TELEFONE
            return (
              <div key={i} className="border-b border-c-border/40 last:border-b-0">
                <div className="flex items-center gap-2 px-3 py-2 hover:bg-c-bg text-sm">
                  <div className="w-7 h-7 rounded-full bg-lavender flex items-center justify-center shrink-0">
                    <Users size={12} className="text-primary" />
                  </div>
                  <span className="font-semibold text-dark flex-1 min-w-0 truncate">{c.NOME}</span>
                  <span className="text-c-text hidden sm:block w-32 shrink-0">{c.TELEFONE}</span>
                  <span className="bg-lavender text-primary text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center shrink-0">{c.TOTAL_PEDIDOS}</span>
                  <span className="text-green-600 font-semibold w-24 text-right shrink-0">R$ {c.TOTAL_GASTO.toFixed(2)}</span>
                  <button
                    onClick={() => { useOwnerStore.setState({ medidasMsg: '' }); s.toggleClientMedidas(c.TELEFONE) }}
                    title="Ver / editar medidas"
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border transition-colors shrink-0 ${isExpanded ? 'bg-primary text-white border-primary' : 'border-c-border text-primary hover:bg-hover'}`}
                  >
                    <Ruler size={12} />
                    {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  </button>
                </div>
                {isExpanded && <MedidasPanel />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Main owner page ───────────────────────────────────────────
export default function OwnerPage() {
  const navigate = useNavigate()
  const { ownerTab, setOwnerTab } = useOwnerStore()

  useEffect(() => {
    if (!sessionStorage.getItem('owner_auth')) navigate('/login')
  }, [])

  const logout = () => { sessionStorage.removeItem('owner_auth'); navigate('/login') }

  const tabs = [
    { tab: 'pendentes', label: 'Pendentes', icon: Clock },
    { tab: 'encomendas', label: 'Encomendas', icon: ClipboardList },
    { tab: 'estoque', label: 'Estoque', icon: Package },
    { tab: 'clientes', label: 'Clientes', icon: Users },
    { tab: 'tabelas', label: 'Tabelas', icon: Table2 },
  ]

  return (
    <div className="min-h-screen bg-c-bg">
      <nav className="bg-white border-b border-c-border sticky top-0 z-10 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <span className="font-bold text-dark text-sm">Área da Lojista</span>
          <div className="flex items-center gap-1 flex-wrap">
            {tabs.map((t) => <TabBtn key={t.tab} {...t} active={ownerTab === t.tab} onClick={setOwnerTab} />)}
            <button onClick={logout} className="flex items-center gap-1 px-3 py-2 rounded-full text-xs text-mid hover:text-red-500 transition-colors">
              <LogOut size={13} /> Sair
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {ownerTab === 'pendentes' && <PendentesTab />}
        {ownerTab === 'encomendas' && <EncomendasTab />}
        {ownerTab === 'estoque' && <EstoqueTab />}
        {ownerTab === 'clientes' && <ClientesTab />}
        {ownerTab === 'tabelas' && <TabelasTab />}
      </main>
    </div>
  )
}
