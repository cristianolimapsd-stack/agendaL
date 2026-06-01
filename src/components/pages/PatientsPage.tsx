'use client'

import { useState, useEffect } from 'react'
import { supabase, Patient } from '@/lib/supabase'
import { Search, Plus, X, ChevronRight, Trash2, Edit3, Phone, Mail, FileText, Calendar, ChevronLeft, Hash } from 'lucide-react'

const PROCEDURE_OPTIONS = [
  'Limpeza', 'Clareamento', 'Restauração', 'Extração', 'Canal',
  'Implante', 'Aparelho', 'Prótese', 'Radiografia', 'Consulta inicial', 'Retorno'
]

const PROCEDURE_COLORS: Record<string, { bg: string; text: string }> = {
  'Limpeza':         { bg: '#e0f2fe', text: '#0369a1' },
  'Clareamento':     { bg: '#fef9c3', text: '#854d0e' },
  'Restauração':     { bg: '#dcfce7', text: '#166534' },
  'Extração':        { bg: '#fee2e2', text: '#991b1b' },
  'Canal':           { bg: '#fce7f3', text: '#9d174d' },
  'Implante':        { bg: '#ede9fe', text: '#5b21b6' },
  'Aparelho':        { bg: '#e0e7ff', text: '#3730a3' },
  'Prótese':         { bg: '#f0fdf4', text: '#15803d' },
  'Radiografia':     { bg: '#fff7ed', text: '#9a3412' },
  'Consulta inicial':{ bg: '#f0f9ff', text: '#075985' },
  'Retorno':         { bg: '#f5f3ff', text: '#6d28d9' },
}

const EMPTY_PATIENT = {
  name: '', age: 0, phone: '', email: '', cpf: '',
  procedures: [] as string[], notes: '', next_appointment: '',
}

type View = 'list' | 'profile' | 'form'

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function getAvatarColor(name: string) {
  const colors = [
    { bg: '#e8f0e8', text: '#5a825a' },
    { bg: '#e8eef8', text: '#4a6fa5' },
    { bg: '#f8f0e8', text: '#a0724a' },
    { bg: '#f0e8f8', text: '#7a4ab0' },
    { bg: '#e8f8f0', text: '#2a8a6a' },
    { bg: '#f8e8e8', text: '#a04a4a' },
  ]
  const idx = name.charCodeAt(0) % colors.length
  return colors[idx]
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>('list')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [form, setForm] = useState({ ...EMPTY_PATIENT })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => { loadPatients() }, [])

  async function loadPatients() {
    setLoading(true)
    const { data } = await supabase.from('patients').select('*').order('name')
    setPatients(data || [])
    setLoading(false)
  }

  async function savePatient() {
    if (!form.name.trim()) return
    setSaving(true)
    setError(null)
    const now = new Date().toISOString()
    try {
      if (selectedPatient && isEditing) {
        const { error } = await supabase.from('patients').update({ ...form, updated_at: now }).eq('id', selectedPatient.id)
        if (error) throw error
        setSelectedPatient({ ...selectedPatient, ...form, updated_at: now })
      } else {
        const { data, error } = await supabase.from('patients').insert({ ...form, created_at: now, updated_at: now }).select().single()
        if (error) throw error
        setSelectedPatient(data)
      }
      await loadPatients()
      setView('profile')
      setIsEditing(false)
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar.')
    } finally {
      setSaving(false)
    }
  }

  async function deletePatient(id: string) {
    if (!confirm('Excluir este paciente?')) return
    await supabase.from('patients').delete().eq('id', id)
    await loadPatients()
    setView('list')
    setSelectedPatient(null)
  }

  function openProfile(p: Patient) {
    setSelectedPatient(p)
    setView('profile')
  }

  function openNew() {
    setForm({ ...EMPTY_PATIENT })
    setSelectedPatient(null)
    setIsEditing(false)
    setError(null)
    setView('form')
  }

  function openEdit(p: Patient) {
    setForm({
      name: p.name, age: p.age, phone: p.phone,
      email: p.email || '', cpf: p.cpf || '',
      procedures: p.procedures || [], notes: p.notes || '',
      next_appointment: p.next_appointment || '',
    })
    setIsEditing(true)
    setError(null)
    setView('form')
  }

  function toggleProcedure(p: string) {
    setForm(f => ({
      ...f,
      procedures: f.procedures.includes(p) ? f.procedures.filter(x => x !== p) : [...f.procedures, p]
    }))
  }

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.phone?.includes(search)
  )

  // LIST VIEW
  if (view === 'list') return (
    <div className="h-full flex flex-col">
      <div className="safe-top px-4 pt-2 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>Pacientes</h1>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{patients.length} cadastrados</p>
          </div>
          <button onClick={openNew} className="w-9 h-9 rounded-full flex items-center justify-center press-effect" style={{ background: 'var(--accent)' }}>
            <Plus size={18} color="white" strokeWidth={2.5} />
          </button>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
          <input className="input-field pl-9" placeholder="Buscar paciente..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center pt-16">
            <div className="text-4xl mb-3">🦷</div>
            <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>
              {search ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
            </p>
            {!search && <button onClick={openNew} className="mt-3 text-sm font-medium" style={{ color: 'var(--accent)' }}>Cadastrar primeiro paciente</button>}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(p => {
              const avatar = getAvatarColor(p.name)
              return (
                <button key={p.id} onClick={() => openProfile(p)} className="card w-full p-4 text-left press-effect flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm" style={{ background: avatar.bg, color: avatar.text }}>
                    {getInitials(p.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{p.name}</p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>
                      {p.age ? `${p.age} anos` : ''}{p.phone ? ` · ${p.phone}` : ''}
                    </p>
                    {p.procedures?.length > 0 && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {p.procedures.slice(0, 2).map(proc => {
                          const c = PROCEDURE_COLORS[proc] || { bg: '#f5f5f7', text: '#6b7280' }
                          return <span key={proc} className="badge" style={{ background: c.bg, color: c.text, fontSize: 10 }}>{proc}</span>
                        })}
                        {p.procedures.length > 2 && <span className="badge" style={{ background: '#f5f5f7', color: 'var(--text-secondary)', fontSize: 10 }}>+{p.procedures.length - 2}</span>}
                      </div>
                    )}
                  </div>
                  <ChevronRight size={16} style={{ color: '#d1d5db', flexShrink: 0 }} />
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )

  // PROFILE VIEW
  if (view === 'profile' && selectedPatient) {
    const avatar = getAvatarColor(selectedPatient.name)
    return (
      <div className="h-full flex flex-col overflow-y-auto no-scrollbar">
        <div className="safe-top flex-shrink-0">
          <div className="flex items-center justify-between px-4 pt-2 pb-3">
            <button onClick={() => setView('list')} className="flex items-center gap-1 press-effect" style={{ color: 'var(--accent)' }}>
              <ChevronLeft size={20} />
              <span className="text-sm font-medium">Pacientes</span>
            </button>
            <button onClick={() => openEdit(selectedPatient)} className="flex items-center gap-1.5 press-effect px-3 py-1.5 rounded-xl" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
              <Edit3 size={14} />
              <span className="text-sm font-medium">Editar</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center px-4 pb-6 pt-2">
          <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold mb-3 shadow-md" style={{ background: avatar.bg, color: avatar.text }}>
            {getInitials(selectedPatient.name)}
          </div>
          <h2 className="text-2xl font-bold text-center" style={{ fontFamily: 'Georgia, serif' }}>{selectedPatient.name}</h2>
          {selectedPatient.age > 0 && <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{selectedPatient.age} anos</p>}
        </div>

        <div className="px-4 pb-8 space-y-4">
          <div className="card p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>Contato</p>
            {selectedPatient.phone ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--accent-light)' }}>
                  <Phone size={14} style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Telefone</p>
                  <p className="text-sm font-medium">{selectedPatient.phone}</p>
                </div>
              </div>
            ) : null}
            {selectedPatient.email ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--accent-light)' }}>
                  <Mail size={14} style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>E-mail</p>
                  <p className="text-sm font-medium">{selectedPatient.email}</p>
                </div>
              </div>
            ) : null}
            {selectedPatient.cpf ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--accent-light)' }}>
                  <Hash size={14} style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>CPF</p>
                  <p className="text-sm font-medium">{selectedPatient.cpf}</p>
                </div>
              </div>
            ) : null}
            {!selectedPatient.phone && !selectedPatient.email && !selectedPatient.cpf && (
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Nenhum contato cadastrado</p>
            )}
          </div>

          {selectedPatient.next_appointment && (
            <div className="card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-secondary)' }}>Próxima Consulta</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#e8eef8' }}>
                  <Calendar size={14} style={{ color: '#4a6fa5' }} />
                </div>
                <p className="text-sm font-medium">
                  {new Date(selectedPatient.next_appointment + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          )}

          {selectedPatient.procedures?.length > 0 && (
            <div className="card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-secondary)' }}>Procedimentos</p>
              <div className="flex flex-wrap gap-2">
                {selectedPatient.procedures.map(proc => {
                  const c = PROCEDURE_COLORS[proc] || { bg: '#f5f5f7', text: '#6b7280' }
                  return <span key={proc} className="badge" style={{ background: c.bg, color: c.text, fontSize: 12, padding: '5px 12px' }}>{proc}</span>
                })}
              </div>
            </div>
          )}

          {selectedPatient.notes && (
            <div className="card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-secondary)' }}>Observações / Histórico</p>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: '#f8f0e8' }}>
                  <FileText size={14} style={{ color: '#a0724a' }} />
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{selectedPatient.notes}</p>
              </div>
            </div>
          )}

          <button onClick={() => deletePatient(selectedPatient.id)}
            className="w-full py-3 rounded-2xl font-medium flex items-center justify-center gap-2 press-effect"
            style={{ background: '#fff0f0', color: '#dc2626' }}>
            <Trash2 size={16} /> Excluir paciente
          </button>
        </div>
      </div>
    )
  }

  // FORM VIEW
  return (
    <div className="h-full flex flex-col overflow-y-auto no-scrollbar">
      <div className="safe-top flex-shrink-0">
        <div className="flex items-center justify-between px-4 pt-2 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <button onClick={() => setView(selectedPatient ? 'profile' : 'list')} className="flex items-center gap-1 press-effect" style={{ color: 'var(--accent)' }}>
            <ChevronLeft size={20} />
            <span className="text-sm font-medium">{selectedPatient ? selectedPatient.name : 'Pacientes'}</span>
          </button>
          <h2 className="font-bold text-base">{isEditing ? 'Editar' : 'Novo Paciente'}</h2>
          <div style={{ width: 80 }} />
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 pb-8">
        {error && <div className="p-3 rounded-xl text-sm font-medium" style={{ background: '#fff0f0', color: '#dc2626' }}>⚠️ {error}</div>}

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Nome completo *</label>
          <input className="input-field" placeholder="Ex: João da Silva" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Idade</label>
            <input className="input-field" type="number" placeholder="0" value={form.age || ''} onChange={e => setForm(f => ({ ...f, age: Number(e.target.value) }))} />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Telefone</label>
            <input className="input-field" placeholder="(85) 99999-9999" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>E-mail</label>
          <input className="input-field" type="email" placeholder="email@exemplo.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>CPF</label>
          <input className="input-field" placeholder="000.000.000-00" value={form.cpf} onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))} />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Procedimentos</label>
          <div className="flex flex-wrap gap-2">
            {PROCEDURE_OPTIONS.map(p => {
              const c = PROCEDURE_COLORS[p] || { bg: '#f5f5f7', text: '#6b7280' }
              const active = form.procedures.includes(p)
              return (
                <button key={p} onClick={() => toggleProcedure(p)} className="badge press-effect"
                  style={{ background: active ? c.bg : '#f5f5f7', color: active ? c.text : 'var(--text-secondary)', fontSize: 12, padding: '6px 12px', border: active ? `1.5px solid ${c.text}30` : '1.5px solid transparent' }}>
                  {p}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Próxima consulta</label>
          <input className="input-field" type="date" value={form.next_appointment} onChange={e => setForm(f => ({ ...f, next_appointment: e.target.value }))} />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Observações / Histórico</label>
          <textarea className="input-field resize-none" rows={4}
            placeholder="Anotações sobre o paciente, histórico médico, alergias..."
            value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>

        <button onClick={savePatient} disabled={saving || !form.name.trim()}
          className="w-full py-3.5 rounded-2xl font-semibold text-white press-effect"
          style={{ background: saving ? '#9ca3af' : 'var(--accent)' }}>
          {saving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Cadastrar paciente'}
        </button>

        {isEditing && selectedPatient && (
          <button onClick={() => deletePatient(selectedPatient.id)}
            className="w-full py-3 rounded-2xl font-medium flex items-center justify-center gap-2 press-effect"
            style={{ background: '#fff0f0', color: '#dc2626' }}>
            <Trash2 size={16} /> Excluir paciente
          </button>
        )}
      </div>
    </div>
  )
}
