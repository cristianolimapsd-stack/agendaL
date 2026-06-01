'use client'

import { useState, useEffect } from 'react'
import { supabase, Patient } from '@/lib/supabase'
import { Search, Plus, X, ChevronRight, Phone, Calendar, FileText, Trash2, User } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const PROCEDURE_OPTIONS = [
  'Limpeza', 'Clareamento', 'Restauração', 'Extração', 'Canal',
  'Implante', 'Aparelho', 'Prótese', 'Radiografia', 'Consulta inicial', 'Retorno'
]

const EMPTY_PATIENT: Omit<Patient, 'id' | 'created_at' | 'updated_at'> = {
  name: '',
  age: 0,
  phone: '',
  email: '',
  cpf: '',
  procedures: [],
  notes: '',
  next_appointment: '',
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [form, setForm] = useState({ ...EMPTY_PATIENT })
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadPatients() }, [])

  async function loadPatients() {
    setLoading(true)
    const { data } = await supabase
      .from('patients')
      .select('*')
      .order('name')
    setPatients(data || [])
    setLoading(false)
  }

  async function savePatient() {
    if (!form.name.trim()) return
    setSaving(true)
    const now = new Date().toISOString()
    if (selectedPatient) {
      await supabase.from('patients').update({ ...form, updated_at: now }).eq('id', selectedPatient.id)
    } else {
      await supabase.from('patients').insert({ ...form, created_at: now, updated_at: now })
    }
    await loadPatients()
    closeForm()
    setSaving(false)
  }

  async function deletePatient(id: string) {
    if (!confirm('Excluir este paciente?')) return
    await supabase.from('patients').delete().eq('id', id)
    await loadPatients()
    closeForm()
  }

  function openNew() {
    setForm({ ...EMPTY_PATIENT })
    setSelectedPatient(null)
    setShowForm(true)
  }

  function openEdit(p: Patient) {
    setForm({
      name: p.name, age: p.age, phone: p.phone,
      email: p.email || '', cpf: p.cpf || '',
      procedures: p.procedures || [], notes: p.notes || '',
      next_appointment: p.next_appointment || '',
    })
    setSelectedPatient(p)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setSelectedPatient(null)
  }

  function toggleProcedure(p: string) {
    setForm(f => ({
      ...f,
      procedures: f.procedures.includes(p)
        ? f.procedures.filter(x => x !== p)
        : [...f.procedures, p]
    }))
  }

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.phone?.includes(search)
  )

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="safe-top px-4 pt-2 pb-3 flex-shrink-0" style={{ background: 'var(--bg-primary)' }}>
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
          <input
            className="input-field pl-9"
            placeholder="Buscar paciente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center pt-16">
            <div className="text-4xl mb-3">🦷</div>
            <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>
              {search ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
            </p>
            {!search && (
              <button onClick={openNew} className="mt-3 text-sm font-medium" style={{ color: 'var(--accent)' }}>
                Cadastrar primeiro paciente
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(p => (
              <button
                key={p.id}
                onClick={() => openEdit(p)}
                className="card w-full p-4 text-left press-effect flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{p.name}</p>
                  <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    {p.age ? `${p.age} anos` : ''}{p.phone ? ` · ${p.phone}` : ''}
                  </p>
                  {p.procedures?.length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {p.procedures.slice(0, 2).map(proc => (
                        <span key={proc} className="badge" style={{ background: 'var(--accent-light)', color: 'var(--accent)', fontSize: 10 }}>
                          {proc}
                        </span>
                      ))}
                      {p.procedures.length > 2 && (
                        <span className="badge" style={{ background: '#f5f5f7', color: 'var(--text-secondary)', fontSize: 10 }}>
                          +{p.procedures.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <ChevronRight size={16} style={{ color: '#d1d5db', flexShrink: 0 }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Form sheet */}
      {showForm && (
        <>
          <div className="overlay" onClick={closeForm} />
          <div className="bottom-sheet" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="px-4 pt-4 pb-2 flex items-center justify-between sticky top-0 bg-white z-10 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="font-bold text-lg">{selectedPatient ? 'Editar Paciente' : 'Novo Paciente'}</h2>
              <button onClick={closeForm} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: '#f5f5f7' }}>
                <X size={16} />
              </button>
            </div>

            <div className="px-4 py-4 space-y-4">
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
                  {PROCEDURE_OPTIONS.map(p => (
                    <button
                      key={p}
                      onClick={() => toggleProcedure(p)}
                      className="badge press-effect transition-smooth"
                      style={{
                        background: form.procedures.includes(p) ? 'var(--accent)' : '#f5f5f7',
                        color: form.procedures.includes(p) ? 'white' : 'var(--text-secondary)',
                        fontSize: 12, padding: '6px 12px'
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Próxima consulta</label>
                <input className="input-field" type="date" value={form.next_appointment} onChange={e => setForm(f => ({ ...f, next_appointment: e.target.value }))} />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Observações / Histórico</label>
                <textarea
                  className="input-field resize-none"
                  rows={4}
                  placeholder="Anotações sobre o paciente, histórico médico, alergias..."
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>

              <button
                onClick={savePatient}
                disabled={saving || !form.name.trim()}
                className="w-full py-3.5 rounded-2xl font-semibold text-white press-effect"
                style={{ background: saving ? '#9ca3af' : 'var(--accent)' }}
              >
                {saving ? 'Salvando...' : selectedPatient ? 'Salvar alterações' : 'Cadastrar paciente'}
              </button>

              {selectedPatient && (
                <button
                  onClick={() => deletePatient(selectedPatient.id)}
                  className="w-full py-3 rounded-2xl font-medium flex items-center justify-center gap-2 press-effect"
                  style={{ background: '#fff0f0', color: '#dc2626' }}
                >
                  <Trash2 size={16} />
                  Excluir paciente
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
