'use client'

import { useState, useEffect } from 'react'
import { supabase, Appointment } from '@/lib/supabase'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, addMonths, subMonths
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, X, Trash2 } from 'lucide-react'

type AptType = 'consulta' | 'retorno' | 'emergencia' | 'limpeza' | 'outro'
type AptStatus = 'scheduled' | 'completed' | 'cancelled'

const TYPES: { value: AptType; label: string; color: string }[] = [
  { value: 'consulta', label: 'Consulta', color: '#4a6fa5' },
  { value: 'retorno', label: 'Retorno', color: '#5a825a' },
  { value: 'emergencia', label: 'Emergência', color: '#dc2626' },
  { value: 'limpeza', label: 'Limpeza', color: '#a0724a' },
  { value: 'outro', label: 'Outro', color: '#7a4ab0' },
]

interface FormState {
  patient_name: string
  title: string
  date: string
  time: string
  duration: number
  type: AptType
  notes: string
  status: AptStatus
}

const EMPTY_APT: FormState = {
  patient_name: '', title: '', date: format(new Date(), 'yyyy-MM-dd'),
  time: '08:00', duration: 30, type: 'consulta',
  notes: '', status: 'scheduled',
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null)
  const [form, setForm] = useState<FormState>({ ...EMPTY_APT })
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadAppointments() }, [currentMonth])

  async function loadAppointments() {
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
    const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd')
    const { data } = await supabase.from('appointments').select('*')
      .gte('date', start).lte('date', end).order('time')
    setAppointments(data || [])
  }

  async function saveAppointment() {
    if (!form.patient_name.trim()) return
    setSaving(true)
    const now = new Date().toISOString()
    if (selectedApt) {
      await supabase.from('appointments').update({ ...form }).eq('id', selectedApt.id)
    } else {
      await supabase.from('appointments').insert({ ...form, created_at: now })
    }
    await loadAppointments()
    closeForm()
    setSaving(false)
  }

  async function deleteApt(id: string) {
    if (!confirm('Excluir esta consulta?')) return
    await supabase.from('appointments').delete().eq('id', id)
    await loadAppointments()
    closeForm()
  }

  function openNew() {
    setForm({ ...EMPTY_APT, date: format(selectedDate, 'yyyy-MM-dd') })
    setSelectedApt(null)
    setShowForm(true)
  }

  function openEdit(a: Appointment) {
    setForm({
      patient_name: a.patient_name,
      title: a.title,
      date: a.date,
      time: a.time,
      duration: a.duration,
      type: a.type as AptType,
      notes: a.notes || '',
      status: a.status as AptStatus,
    })
    setSelectedApt(a)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setSelectedApt(null)
  }

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
  const startDow = startOfMonth(currentMonth).getDay()
  const dayApts = appointments.filter(a => a.date === format(selectedDate, 'yyyy-MM-dd'))
    .sort((a, b) => a.time.localeCompare(b.time))

  const hasApt = (day: Date) => appointments.some(a => a.date === format(day, 'yyyy-MM-dd'))

  return (
    <div className="h-full flex flex-col">
      <div className="safe-top px-4 pt-2 pb-2 flex-shrink-0">
        <h1 className="text-xl font-bold mb-3" style={{ fontFamily: 'Georgia, serif' }}>Agenda</h1>

        <div className="card p-3 mb-3">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="p-1 press-effect">
              <ChevronLeft size={20} />
            </button>
            <span className="font-semibold capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </span>
            <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="p-1 press-effect">
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {['D','S','T','Q','Q','S','S'].map((d, i) => (
              <div key={i} className="calendar-day text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {Array.from({ length: startDow }).map((_, i) => <div key={`empty-${i}`} />)}
            {days.map(day => {
              const isToday = isSameDay(day, new Date())
              const isSelected = isSameDay(day, selectedDate)
              const hasE = hasApt(day)
              return (
                <div key={day.toISOString()} className="relative flex justify-center">
                  <button
                    onClick={() => setSelectedDate(day)}
                    className="calendar-day relative"
                    style={{
                      background: isSelected ? 'var(--accent)' : isToday ? 'var(--accent-light)' : 'transparent',
                      color: isSelected ? 'white' : isToday ? 'var(--accent)' : 'var(--text-primary)',
                      fontWeight: isToday || isSelected ? 700 : 400,
                    }}
                  >
                    {format(day, 'd')}
                    {hasE && !isSelected && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ background: isToday ? 'var(--accent)' : '#9ca3af' }} />
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm capitalize" style={{ color: 'var(--text-secondary)' }}>
            {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </h2>
          <button onClick={openNew} className="flex items-center gap-1 text-sm font-medium press-effect" style={{ color: 'var(--accent)' }}>
            <Plus size={16} /> Consulta
          </button>
        </div>

        {dayApts.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-3xl mb-2">📅</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Nenhuma consulta neste dia</p>
          </div>
        ) : (
          <div className="space-y-2">
            {dayApts.map(apt => {
              const typeInfo = TYPES.find(t => t.value === apt.type)
              return (
                <button key={apt.id} onClick={() => openEdit(apt)} className="card w-full p-4 text-left press-effect flex gap-3">
                  <div className="flex-shrink-0 flex flex-col items-center w-14">
                    <span className="text-sm font-bold">{apt.time}</span>
                    <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{apt.duration}min</span>
                  </div>
                  <div className="w-0.5 rounded-full flex-shrink-0 self-stretch" style={{ background: typeInfo?.color || 'var(--accent)' }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-sm truncate">{apt.patient_name}</p>
                      <span className="badge flex-shrink-0" style={{ background: `${typeInfo?.color}18`, color: typeInfo?.color, fontSize: 10 }}>
                        {typeInfo?.label}
                      </span>
                    </div>
                    {apt.title && <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{apt.title}</p>}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {showForm && (
        <>
          <div className="overlay" onClick={closeForm} />
          <div className="bottom-sheet" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="px-4 pt-4 pb-2 flex items-center justify-between sticky top-0 bg-white z-10 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="font-bold text-lg">{selectedApt ? 'Editar consulta' : 'Nova consulta'}</h2>
              <button onClick={closeForm} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: '#f5f5f7' }}>
                <X size={16} />
              </button>
            </div>
            <div className="px-4 py-4 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Paciente *</label>
                <input className="input-field" placeholder="Nome do paciente" value={form.patient_name} onChange={e => setForm(f => ({ ...f, patient_name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Título / Procedimento</label>
                <input className="input-field" placeholder="Ex: Extração do siso" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Data</label>
                  <input className="input-field" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Horário</label>
                  <input className="input-field" type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Tipo</label>
                <div className="flex flex-wrap gap-2">
                  {TYPES.map(t => (
                    <button key={t.value} onClick={() => setForm(f => ({ ...f, type: t.value }))}
                      className="badge press-effect"
                      style={{ background: form.type === t.value ? t.color : '#f5f5f7', color: form.type === t.value ? 'white' : 'var(--text-secondary)', fontSize: 12, padding: '6px 12px' }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Duração (min)</label>
                <input className="input-field" type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Observações</label>
                <textarea className="input-field resize-none" rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <button onClick={saveAppointment} disabled={saving || !form.patient_name.trim()}
                className="w-full py-3.5 rounded-2xl font-semibold text-white press-effect"
                style={{ background: saving ? '#9ca3af' : 'var(--accent)' }}>
                {saving ? 'Salvando...' : selectedApt ? 'Salvar' : 'Agendar consulta'}
              </button>
              {selectedApt && (
                <button onClick={() => deleteApt(selectedApt.id)}
                  className="w-full py-3 rounded-2xl font-medium flex items-center justify-center gap-2 press-effect"
                  style={{ background: '#fff0f0', color: '#dc2626' }}>
                  <Trash2 size={16} /> Cancelar consulta
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
