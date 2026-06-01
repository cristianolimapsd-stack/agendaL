'use client'

import { useState, useEffect } from 'react'
import { supabase, Routine } from '@/lib/supabase'
import { Plus, X, Check, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const DAYS_FULL = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']

const CATEGORIES = [
  { value: 'morning', label: '🌅 Manhã', color: '#fef3c7', textColor: '#92400e' },
  { value: 'work', label: '💼 Trabalho', color: '#e0e7ff', textColor: '#3730a3' },
  { value: 'health', label: '💪 Saúde', color: '#d1fae5', textColor: '#065f46' },
  { value: 'evening', label: '🌙 Noite', color: '#ede9fe', textColor: '#5b21b6' },
]

type RoutineForm = {
  title: string
  time: string
  days: string[]
  category: 'morning' | 'work' | 'health' | 'evening'
  completed_today: boolean
}

const EMPTY_ROUTINE: RoutineForm = {
  title: '', time: '', days: DAYS_FULL, category: 'morning', completed_today: false
}

export default function RoutinePage() {
  const [routines, setRoutines] = useState<Routine[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<Routine | null>(null)
  const [form, setForm] = useState<RoutineForm>({ ...EMPTY_ROUTINE })
  const [saving, setSaving] = useState(false)
  const todayDow = new Date().getDay()
  const todayName = DAYS_FULL[todayDow]

  useEffect(() => { loadRoutines() }, [])

  async function loadRoutines() {
    const { data } = await supabase.from('routines').select('*').order('created_at')
    setRoutines(data || [])
  }

  async function saveRoutine() {
    if (!form.title.trim()) return
    setSaving(true)
    const now = new Date().toISOString()
    if (selected) {
      await supabase.from('routines').update({ ...form }).eq('id', selected.id)
    } else {
      await supabase.from('routines').insert({ ...form, created_at: now })
    }
    await loadRoutines()
    closeForm()
    setSaving(false)
  }

  async function toggleComplete(r: Routine) {
    await supabase.from('routines').update({ completed_today: !r.completed_today }).eq('id', r.id)
    setRoutines(prev => prev.map(x => x.id === r.id ? { ...x, completed_today: !x.completed_today } : x))
  }

  async function deleteRoutine(id: string) {
    await supabase.from('routines').delete().eq('id', id)
    await loadRoutines()
    closeForm()
  }

  function openEdit(r: Routine) {
    setForm({ title: r.title, time: r.time || '', days: r.days, category: r.category, completed_today: r.completed_today })
    setSelected(r)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setSelected(null)
  }

  function toggleDay(d: string) {
    setForm(f => ({
      ...f,
      days: f.days.includes(d) ? f.days.filter(x => x !== d) : [...f.days, d]
    }))
  }

  const todayRoutines = routines.filter(r => r.days.includes(todayName))
  const otherRoutines = routines.filter(r => !r.days.includes(todayName))
  const completed = todayRoutines.filter(r => r.completed_today).length

  return (
    <div className="h-full flex flex-col">
      <div className="safe-top px-4 pt-2 pb-2 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>Rotina</h1>
            <p className="text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>
              {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          <button onClick={() => { setForm({ ...EMPTY_ROUTINE }); setSelected(null); setShowForm(true) }}
            className="w-9 h-9 rounded-full flex items-center justify-center press-effect" style={{ background: 'var(--accent)' }}>
            <Plus size={18} color="white" strokeWidth={2.5} />
          </button>
        </div>

        {/* Progress */}
        {todayRoutines.length > 0 && (
          <div className="card p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">Progresso de hoje</span>
              <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>{completed}/{todayRoutines.length}</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--accent-light)' }}>
              <div className="h-full rounded-full transition-smooth" style={{ background: 'var(--accent)', width: `${todayRoutines.length ? (completed / todayRoutines.length) * 100 : 0}%` }} />
            </div>
            {completed === todayRoutines.length && todayRoutines.length > 0 && (
              <p className="text-xs mt-2 text-center font-medium" style={{ color: 'var(--accent)' }}>🎉 Rotina completa!</p>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4">
        {routines.length === 0 ? (
          <div className="text-center pt-16">
            <p className="text-4xl mb-3">⏰</p>
            <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>Crie sua primeira rotina</p>
            <button onClick={() => { setForm({ ...EMPTY_ROUTINE }); setSelected(null); setShowForm(true) }}
              className="mt-3 text-sm font-medium" style={{ color: 'var(--accent)' }}>Adicionar rotina</button>
          </div>
        ) : (
          <>
            {todayRoutines.length > 0 && (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>Para hoje</p>
                <div className="space-y-2 mb-4">
                  {CATEGORIES.map(cat => {
                    const items = todayRoutines.filter(r => r.category === cat.value)
                    if (!items.length) return null
                    return (
                      <div key={cat.value}>
                        <p className="text-xs font-medium mb-1.5 mt-3" style={{ color: 'var(--text-secondary)' }}>{cat.label}</p>
                        {items.map(r => (
                          <RoutineItem key={r.id} routine={r} onToggle={toggleComplete} onEdit={openEdit} catColor={cat.color} catText={cat.textColor} />
                        ))}
                      </div>
                    )
                  })}
                </div>
              </>
            )}
            {otherRoutines.length > 0 && (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>Outras rotinas</p>
                <div className="space-y-2">
                  {otherRoutines.map(r => {
                    const cat = CATEGORIES.find(c => c.value === r.category)!
                    return <RoutineItem key={r.id} routine={r} onToggle={toggleComplete} onEdit={openEdit} catColor={cat?.color} catText={cat?.textColor} />
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {showForm && (
        <>
          <div className="overlay" onClick={closeForm} />
          <div className="bottom-sheet" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="px-4 pt-4 pb-2 flex items-center justify-between sticky top-0 bg-white z-10 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="font-bold text-lg">{selected ? 'Editar rotina' : 'Nova rotina'}</h2>
              <button onClick={closeForm} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: '#f5f5f7' }}>
                <X size={16} />
              </button>
            </div>
            <div className="px-4 py-4 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Título *</label>
                <input className="input-field" placeholder="Ex: Beber água, Checar agenda..." value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Horário (opcional)</label>
                <input className="input-field" type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Categoria</label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map(c => (
                    <button key={c.value} onClick={() => setForm(f => ({ ...f, category: c.value as RoutineForm['category'] }))}
                      className="p-2 rounded-xl text-sm font-medium press-effect"
                      style={{ background: form.category === c.value ? c.color : '#f5f5f7', color: form.category === c.value ? c.textColor : 'var(--text-secondary)', border: form.category === c.value ? `1.5px solid ${c.textColor}40` : '1.5px solid transparent' }}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Dias da semana</label>
                <div className="flex gap-2 justify-between">
                  {DAYS.map((d, i) => (
                    <button key={d} onClick={() => toggleDay(DAYS_FULL[i])}
                      className="w-10 h-10 rounded-xl text-xs font-semibold press-effect"
                      style={{ background: form.days.includes(DAYS_FULL[i]) ? 'var(--accent)' : '#f5f5f7', color: form.days.includes(DAYS_FULL[i]) ? 'white' : 'var(--text-secondary)' }}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={saveRoutine} disabled={saving || !form.title.trim()}
                className="w-full py-3.5 rounded-2xl font-semibold text-white press-effect"
                style={{ background: saving ? '#9ca3af' : 'var(--accent)' }}>
                {saving ? 'Salvando...' : selected ? 'Salvar' : 'Criar rotina'}
              </button>
              {selected && (
                <button onClick={() => deleteRoutine(selected.id)}
                  className="w-full py-3 rounded-2xl font-medium flex items-center justify-center gap-2 press-effect"
                  style={{ background: '#fff0f0', color: '#dc2626' }}>
                  <Trash2 size={16} /> Excluir rotina
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function RoutineItem({ routine, onToggle, onEdit, catColor, catText }: {
  routine: Routine; onToggle: (r: Routine) => void; onEdit: (r: Routine) => void; catColor?: string; catText?: string
}) {
  return (
    <div className="card flex items-center gap-3 p-3.5 mb-2">
      <button onClick={() => onToggle(routine)}
        className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center press-effect border-2 transition-smooth"
        style={{
          background: routine.completed_today ? 'var(--accent)' : 'transparent',
          borderColor: routine.completed_today ? 'var(--accent)' : '#d1d5db'
        }}>
        {routine.completed_today && <Check size={14} color="white" strokeWidth={3} />}
      </button>
      <div className="flex-1 min-w-0" onClick={() => onEdit(routine)}>
        <p className="text-sm font-medium" style={{ textDecoration: routine.completed_today ? 'line-through' : 'none', color: routine.completed_today ? '#9ca3af' : 'var(--text-primary)' }}>
          {routine.title}
        </p>
        {routine.time && <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{routine.time}</p>}
      </div>
      <span className="text-[10px] font-medium flex-shrink-0 px-2 py-1 rounded-lg" style={{ background: catColor || '#f5f5f7', color: catText || 'var(--text-secondary)' }}>
        {routine.days.length === 7 ? 'Todo dia' : `${routine.days.length}x/sem`}
      </span>
    </div>
  )
}
