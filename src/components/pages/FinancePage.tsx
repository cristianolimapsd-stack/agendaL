'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, X, Trash2, ChevronLeft, TrendingUp, TrendingDown, Check } from 'lucide-react'

type FinanceType = 'income' | 'expense'

type Finance = {
  id: string
  title: string
  amount: number
  type: FinanceType
  category: string
  date: string
  paid: boolean
  notes: string
  created_at: string
}

type FinanceForm = {
  title: string
  amount: string
  type: FinanceType
  category: string
  date: string
  paid: boolean
  notes: string
}

const INCOME_CATEGORIES = ['Consulta', 'Retorno', 'Procedimento', 'Orçamento', 'Convênio', 'Outro']
const EXPENSE_CATEGORIES = ['Aluguel', 'Material', 'Equipamento', 'Salário', 'Marketing', 'Imposto', 'Outro']

const EMPTY_FORM: FinanceForm = {
  title: '', amount: '', type: 'income', category: 'Consulta',
  date: new Date().toISOString().split('T')[0], paid: false, notes: ''
}

type View = 'list' | 'form'
type TabFilter = 'all' | 'income' | 'expense'

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function FinancePage() {
  const [finances, setFinances] = useState<Finance[]>([])
  const [view, setView] = useState<View>('list')
  const [tab, setTab] = useState<TabFilter>('all')
  const [selected, setSelected] = useState<Finance | null>(null)
  const [form, setForm] = useState<FinanceForm>({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [monthOffset, setMonthOffset] = useState(0)

  useEffect(() => { loadFinances() }, [monthOffset])

  useEffect(() => {
    const refresh = () => loadFinances()
    window.addEventListener('finances:changed', refresh)
    return () => window.removeEventListener('finances:changed', refresh)
  }, [monthOffset])

  async function loadFinances() {
    const now = new Date()
    const d = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const start = `${year}-${month}-01`
    const lastDay = new Date(year, d.getMonth() + 1, 0).getDate()
    const end = `${year}-${month}-${lastDay}`
    const { data } = await supabase.from('finances').select('*').gte('date', start).lte('date', end).order('date', { ascending: false })
    setFinances(data || [])
  }

  async function saveFinance() {
    if (!form.title.trim() || !form.amount) return
    setSaving(true)
    setError(null)
    try {
      const payload = { ...form, amount: parseFloat(form.amount.replace(',', '.')) }
      if (selected) {
        const { error } = await supabase.from('finances').update(payload).eq('id', selected.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('finances').insert({ ...payload, created_at: new Date().toISOString() })
        if (error) throw error
      }
      await loadFinances()
      setView('list')
      setSelected(null)
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteFinance(id: string) {
    if (!confirm('Excluir este lançamento?')) return
    await supabase.from('finances').delete().eq('id', id)
    await loadFinances()
  }

  async function togglePaid(f: Finance) {
    await supabase.from('finances').update({ paid: !f.paid }).eq('id', f.id)
    setFinances(prev => prev.map(x => x.id === f.id ? { ...x, paid: !x.paid } : x))
  }

  function openNew(type: FinanceType = 'income') {
    setForm({ ...EMPTY_FORM, type, category: type === 'income' ? 'Consulta' : 'Aluguel' })
    setSelected(null)
    setError(null)
    setView('form')
  }

  function openEdit(f: Finance) {
    setForm({ title: f.title, amount: String(f.amount), type: f.type, category: f.category, date: f.date, paid: f.paid, notes: f.notes || '' })
    setSelected(f)
    setError(null)
    setView('form')
  }

  const now = new Date()
  const displayDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
  const monthLabel = displayDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  const totalIncome = finances.filter(f => f.type === 'income').reduce((s, f) => s + f.amount, 0)
  const totalExpense = finances.filter(f => f.type === 'expense').reduce((s, f) => s + f.amount, 0)
  const balance = totalIncome - totalExpense
  const pendingIncome = finances.filter(f => f.type === 'income' && !f.paid).reduce((s, f) => s + f.amount, 0)
  const pendingExpense = finances.filter(f => f.type === 'expense' && !f.paid).reduce((s, f) => s + f.amount, 0)

  const filtered = finances.filter(f => tab === 'all' || f.type === tab)
  const grouped = filtered.reduce((acc, f) => {
    if (!acc[f.date]) acc[f.date] = []
    acc[f.date].push(f)
    return acc
  }, {} as Record<string, Finance[]>)
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  // FORM VIEW
  if (view === 'form') return (
    <div className="h-full flex flex-col overflow-y-auto no-scrollbar">
      <div className="safe-top flex-shrink-0">
        <div className="flex items-center justify-between px-4 pt-3 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <button onClick={() => { setView('list'); setSelected(null) }} className="flex items-center gap-1 press-effect" style={{ color: 'var(--accent)' }}>
            <ChevronLeft size={20} />
            <span className="text-sm font-medium">Financeiro</span>
          </button>
          <h2 className="font-bold text-base">{selected ? 'Editar' : 'Novo lançamento'}</h2>
          <div style={{ width: 80 }} />
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 pb-8">
        {error && <div className="p-3 rounded-xl text-sm font-medium" style={{ background: '#fff0f0', color: '#dc2626' }}>⚠️ {error}</div>}

        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setForm(f => ({ ...f, type: 'income', category: 'Consulta' }))}
            className="py-3 rounded-2xl font-semibold text-sm press-effect flex items-center justify-center gap-2"
            style={{ background: form.type === 'income' ? '#dcfce7' : '#f5f5f7', color: form.type === 'income' ? '#166534' : 'var(--text-secondary)', border: form.type === 'income' ? '1.5px solid #16653440' : '1.5px solid transparent' }}>
            <TrendingUp size={16} /> A receber
          </button>
          <button onClick={() => setForm(f => ({ ...f, type: 'expense', category: 'Aluguel' }))}
            className="py-3 rounded-2xl font-semibold text-sm press-effect flex items-center justify-center gap-2"
            style={{ background: form.type === 'expense' ? '#fee2e2' : '#f5f5f7', color: form.type === 'expense' ? '#991b1b' : 'var(--text-secondary)', border: form.type === 'expense' ? '1.5px solid #991b1b40' : '1.5px solid transparent' }}>
            <TrendingDown size={16} /> A pagar
          </button>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Descrição *</label>
          <input className="input-field" placeholder="Ex: Consulta João Silva" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Valor (R$) *</label>
          <input className="input-field" type="number" placeholder="0,00" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Data</label>
            <input className="input-field" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Categoria</label>
            <select className="input-field" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {(form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Observações</label>
          <textarea className="input-field resize-none" rows={3} placeholder="Detalhes adicionais..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>

        <button onClick={saveFinance} disabled={saving || !form.title.trim() || !form.amount}
          className="w-full py-3.5 rounded-2xl font-semibold text-white press-effect"
          style={{ background: saving ? '#9ca3af' : 'var(--accent)' }}>
          {saving ? 'Salvando...' : selected ? 'Salvar' : 'Adicionar'}
        </button>

        {selected && (
          <button onClick={() => deleteFinance(selected.id)}
            className="w-full py-3 rounded-2xl font-medium flex items-center justify-center gap-2 press-effect"
            style={{ background: '#fff0f0', color: '#dc2626' }}>
            <Trash2 size={16} /> Excluir
          </button>
        )}
      </div>
    </div>
  )

  // LIST VIEW
  return (
    <div className="h-full flex flex-col">
      <div className="safe-top px-4 pt-3 pb-2 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>Financeiro</h1>
          <button onClick={() => openNew()} className="w-9 h-9 rounded-full flex items-center justify-center press-effect" style={{ background: 'var(--accent)' }}>
            <Plus size={18} color="white" strokeWidth={2.5} />
          </button>
        </div>

        {/* Month navigator */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setMonthOffset(o => o - 1)} className="press-effect w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold" style={{ background: '#f5f5f7', color: 'var(--text-secondary)' }}>‹</button>
          <p className="text-sm font-bold capitalize">{monthLabel}</p>
          <button onClick={() => setMonthOffset(o => o + 1)} className="press-effect w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold" style={{ background: '#f5f5f7', color: 'var(--text-secondary)' }}>›</button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="rounded-2xl p-3 text-center" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <p className="text-[10px] font-bold uppercase mb-1" style={{ color: '#166534' }}>Receitas</p>
            <p className="text-sm font-black" style={{ color: '#166534' }}>{formatCurrency(totalIncome)}</p>
            {pendingIncome > 0 && <p className="text-[9px] mt-0.5" style={{ color: '#9ca3af' }}>+{formatCurrency(pendingIncome)} pend.</p>}
          </div>
          <div className="rounded-2xl p-3 text-center" style={{ background: balance >= 0 ? '#f0fdf4' : '#fff0f0', border: `1px solid ${balance >= 0 ? '#bbf7d0' : '#fecaca'}` }}>
            <p className="text-[10px] font-bold uppercase mb-1" style={{ color: balance >= 0 ? '#166534' : '#991b1b' }}>Saldo</p>
            <p className="text-sm font-black" style={{ color: balance >= 0 ? '#166534' : '#dc2626' }}>{formatCurrency(balance)}</p>
          </div>
          <div className="rounded-2xl p-3 text-center" style={{ background: '#fff0f0', border: '1px solid #fecaca' }}>
            <p className="text-[10px] font-bold uppercase mb-1" style={{ color: '#991b1b' }}>Despesas</p>
            <p className="text-sm font-black" style={{ color: '#991b1b' }}>{formatCurrency(totalExpense)}</p>
            {pendingExpense > 0 && <p className="text-[9px] mt-0.5" style={{ color: '#9ca3af' }}>{formatCurrency(pendingExpense)} pend.</p>}
          </div>
        </div>

        {/* Quick add */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button onClick={() => openNew('income')} className="flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-semibold press-effect" style={{ background: '#dcfce7', color: '#166534' }}>
            <TrendingUp size={15} /> + Receita
          </button>
          <button onClick={() => openNew('expense')} className="flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-semibold press-effect" style={{ background: '#fee2e2', color: '#991b1b' }}>
            <TrendingDown size={15} /> + Despesa
          </button>
        </div>

        {/* Tab filter */}
        <div className="flex gap-2">
          {(['all', 'income', 'expense'] as TabFilter[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="badge flex-1 justify-center press-effect"
              style={{ background: tab === t ? 'var(--accent)' : '#f5f5f7', color: tab === t ? 'white' : 'var(--text-secondary)', fontSize: 12, padding: '7px' }}>
              {t === 'all' ? 'Todos' : t === 'income' ? 'Receitas' : 'Despesas'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4">
        {filtered.length === 0 ? (
          <div className="text-center pt-12">
            <p className="text-4xl mb-3">💰</p>
            <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>Nenhum lançamento</p>
            <button onClick={() => openNew()} className="mt-3 text-sm font-medium" style={{ color: 'var(--accent)' }}>Adicionar lançamento</button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {sortedDates.map(date => (
              <div key={date}>
                <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', weekday: 'short' })}
                </p>
                <div className="space-y-2">
                  {grouped[date].map(f => (
                    <FinanceItem key={f.id} finance={f} onEdit={openEdit} onTogglePaid={togglePaid} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function FinanceItem({ finance, onEdit, onTogglePaid }: {
  finance: Finance
  onEdit: (f: Finance) => void
  onTogglePaid: (f: Finance) => void
}) {
  const isIncome = finance.type === 'income'
  const isPaid = finance.paid

  return (
    <div className="rounded-2xl p-3.5 flex items-center gap-3"
      style={{ background: isPaid ? (isIncome ? '#f0fdf4' : '#f8faff') : 'white', border: `1px solid ${isPaid ? (isIncome ? '#bbf7d0' : '#e0e7ff') : 'var(--border)'}` }}>
      {/* Icon */}
      <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center"
        style={{ background: isIncome ? '#dcfce7' : '#fee2e2' }}>
        {isIncome
          ? <TrendingUp size={16} style={{ color: '#166534' }} />
          : <TrendingDown size={16} style={{ color: '#991b1b' }} />}
      </div>

      {/* Info — tap to edit */}
      <div className="flex-1 min-w-0 press-effect" onClick={() => onEdit(finance)}>
        <p className="text-sm font-semibold truncate">{finance.title}</p>
        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>{finance.category}</p>
      </div>

      {/* Amount + paid button */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <p className="text-sm font-bold" style={{ color: isIncome ? '#166534' : '#dc2626' }}>
          {isIncome ? '+' : '-'}{formatCurrency(finance.amount)}
        </p>
        {/* Quick paid toggle button — like routine check */}
        <button
          onClick={e => { e.stopPropagation(); onTogglePaid(finance) }}
          className="w-8 h-8 rounded-full flex items-center justify-center border-2 press-effect transition-all duration-200"
          style={{
            background: isPaid ? (isIncome ? '#166534' : '#4a6fa5') : 'transparent',
            borderColor: isPaid ? (isIncome ? '#166534' : '#4a6fa5') : '#d1d5db',
          }}>
          {isPaid && <Check size={14} color="white" strokeWidth={3} />}
        </button>
      </div>
    </div>
  )
}
