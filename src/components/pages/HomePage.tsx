'use client'

import { useState, useEffect } from 'react'
import { Tab } from '@/app/page'
import { CalendarDays, Users, BookOpen, RotateCcw, Clock, ChevronRight, Wallet, Check, TrendingUp, ArrowRight, Stethoscope, Search, Download } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'

interface HomePageProps {
  setTab: (t: Tab) => void
}

const greet = (h: number) => {
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

const TYPES_COLORS: Record<string, string> = {
  consulta: '#4a6fa5', retorno: '#5a825a', emergencia: '#dc2626', limpeza: '#a0724a', outro: '#7a4ab0'
}

export default function HomePage({ setTab }: HomePageProps) {
  const [now, setNow] = useState<Date | null>(null)
  const [todayApts, setTodayApts] = useState<any[]>([])
  const [todayRoutines, setTodayRoutines] = useState<any[]>([])
  const [stats, setStats] = useState({ patients: 0, notes: 0, monthApts: 0, monthIncome: 0 })
  const [search, setSearch] = useState('')
  const [allPatients, setAllPatients] = useState<any[]>([])
  const [allNotes, setAllNotes] = useState<any[]>([])
  const [allAppointments, setAllAppointments] = useState<any[]>([])

  useEffect(() => {
    setNow(new Date())
    const t = setInterval(() => setNow(new Date()), 60000)
    loadData()
    return () => clearInterval(t)
  }, [])

  async function loadData() {
    const today = new Date().toISOString().split('T')[0]
    const todayDow = new Date().getDay()
    const DAYS_FULL = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
    const todayName = DAYS_FULL[todayDow]
    const now = new Date()
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${lastDay}`

    const [aptsRes, routinesRes, patientsRes, notesRes, monthAptsRes, financeRes, patientListRes, noteListRes, appointmentListRes] = await Promise.all([
      supabase.from('appointments').select('*').eq('date', today).order('time'),
      supabase.from('routines').select('*').order('created_at'),
      supabase.from('patients').select('id', { count: 'exact', head: true }),
      supabase.from('notes').select('id', { count: 'exact', head: true }),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).gte('date', monthStart).lte('date', monthEnd),
      supabase.from('finances').select('amount').eq('type', 'income').eq('paid', true).gte('date', monthStart).lte('date', monthEnd),
      supabase.from('patients').select('*').order('name'),
      supabase.from('notes').select('*').order('updated_at', { ascending: false }),
      supabase.from('appointments').select('*').gte('date', today).order('date').order('time').limit(80),
    ])

    setTodayApts(aptsRes.data || [])
    setAllPatients(patientListRes.data || [])
    setAllNotes(noteListRes.data || [])
    setAllAppointments(appointmentListRes.data || [])
    const allRoutines = routinesRes.data || []
    setTodayRoutines(allRoutines.filter((r: any) => r.days.includes(todayName)))
    const monthIncome = (financeRes.data || []).reduce((s: number, f: any) => s + f.amount, 0)
    setStats({
      patients: patientsRes.count || 0,
      notes: notesRes.count || 0,
      monthApts: monthAptsRes.count || 0,
      monthIncome,
    })
  }

  async function toggleRoutine(r: any) {
    await supabase.from('routines').update({ completed_today: !r.completed_today }).eq('id', r.id)
    setTodayRoutines(prev => prev.map(x => x.id === r.id ? { ...x, completed_today: !x.completed_today } : x))
  }

  async function exportBackup() {
    const tables = ['patients', 'appointments', 'notes', 'routines', 'finances']
    const entries = await Promise.all(
      tables.map(async table => {
        const { data } = await supabase.from(table as any).select('*')
        return [table, data || []]
      })
    )
    const backup = {
      exported_at: new Date().toISOString(),
      version: 1,
      data: Object.fromEntries(entries),
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `backup-agenda-${format(new Date(), 'yyyy-MM-dd')}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const todayCapitalized = now
    ? (() => { const d = format(now, "EEEE, d 'de' MMMM", { locale: ptBR }); return d.charAt(0).toUpperCase() + d.slice(1) })()
    : ''

  const completedRoutines = todayRoutines.filter(r => r.completed_today).length
  const routineProgress = todayRoutines.length > 0 ? (completedRoutines / todayRoutines.length) * 100 : 0

  const quickActions = [
    { label: 'Pacientes', icon: Users, tab: 'patients' as Tab, color: '#f3f7f3', iconColor: '#4f7a57', desc: 'Fichas e histórico' },
    { label: 'Agenda', icon: CalendarDays, tab: 'calendar' as Tab, color: '#f2f5fa', iconColor: '#496b9f', desc: 'Consultas do dia' },
    { label: 'Notas', icon: BookOpen, tab: 'notes' as Tab, color: '#faf6f1', iconColor: '#9a6a43', desc: 'Ideias e casos' },
    { label: 'Finanças', icon: Wallet, tab: 'finance' as Tab, color: '#f1f8f4', iconColor: '#287447', desc: 'Entradas e saídas' },
  ]

  const query = search.trim().toLowerCase()
  const searchResults = query ? [
    ...allPatients
      .filter(p => p.name?.toLowerCase().includes(query) || p.phone?.toLowerCase().includes(query) || p.procedures?.some((proc: string) => proc.toLowerCase().includes(query)))
      .slice(0, 3)
      .map(p => ({ id: `patient-${p.id}`, title: p.name, meta: p.phone || 'Paciente', tab: 'patients' as Tab, icon: Users })),
    ...allAppointments
      .filter(a => a.patient_name?.toLowerCase().includes(query) || a.title?.toLowerCase().includes(query))
      .slice(0, 3)
      .map(a => ({ id: `apt-${a.id}`, title: a.patient_name, meta: `${a.date} às ${a.time}`, tab: 'calendar' as Tab, icon: CalendarDays })),
    ...allNotes
      .filter(n => n.title?.toLowerCase().includes(query) || n.content?.toLowerCase().includes(query))
      .slice(0, 3)
      .map(n => ({ id: `note-${n.id}`, title: n.title, meta: 'Nota', tab: 'notes' as Tab, icon: BookOpen })),
  ].slice(0, 6) : []

  return (
    <div className="px-4 pb-6 overflow-y-auto no-scrollbar h-full" style={{ background: '#fafafa' }}>

      {/* Header */}
      <div className="safe-top pt-3 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>{todayCapitalized}</p>
            <h1 className="text-[24px] font-bold mt-1 leading-tight" style={{ color: 'var(--text-primary)' }}>
              {now ? greet(now.getHours()) : 'Olá'}, Dra. Hellen
            </h1>
          </div>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-sm" style={{ background: '#1f2d24' }}>
            <Stethoscope size={19} color="white" strokeWidth={2} />
          </div>
        </div>
      </div>

      <button onClick={exportBackup}
        className="w-full mb-4 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 press-effect"
        style={{ background: '#f5f5f7', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
        <Download size={16} /> Exportar backup
      </button>

      {/* Stats row */}
      <div className="rounded-xl p-4 mb-4" style={{ background: 'white', border: '1px solid var(--border)' }}>
        <div className="grid grid-cols-3 gap-3">
          <StatCard value={String(stats.monthApts)} label="Consultas" color="var(--accent)" />
          <StatCard value={String(stats.patients)} label="Pacientes" color="#4a6fa5" />
          <StatCard value={String(stats.notes)} label="Notas" color="#a0724a" />
        </div>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
          <input
            className="input-field pl-9"
            placeholder="Buscar paciente, nota ou consulta..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {query && (
          <div className="rounded-xl mt-2 overflow-hidden" style={{ background: 'white', border: '1px solid var(--border)' }}>
            {searchResults.length === 0 ? (
              <p className="text-sm px-3 py-3" style={{ color: 'var(--text-secondary)' }}>Nada encontrado.</p>
            ) : searchResults.map(item => {
              const Icon = item.icon
              return (
                <button key={item.id} onClick={() => setTab(item.tab)}
                  className="w-full px-3 py-3 flex items-center gap-3 text-left press-effect"
                  style={{ borderBottom: '1px solid var(--border)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-light)' }}>
                    <Icon size={15} style={{ color: 'var(--accent)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{item.title}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{item.meta}</p>
                  </div>
                  <ChevronRight size={15} style={{ color: '#d1d5db' }} />
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Income highlight */}
      {stats.monthIncome > 0 && (
        <div className="rounded-xl p-4 mb-4 flex items-center gap-3" style={{ background: '#1f2d24' }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.12)' }}>
            <TrendingUp size={18} color="#8dbf8d" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium" style={{ color: '#8dbf8d' }}>Receitas confirmadas este mês</p>
            <p className="text-lg font-bold mt-0.5" style={{ color: 'white' }}>
              {stats.monthIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
          <button onClick={() => setTab('finance')} className="press-effect" style={{ color: '#8dbf8d' }}>
            <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* Today's appointments */}
      <SectionHeader icon={<Clock size={13} style={{ color: 'var(--accent)' }} />} title="Consultas de hoje" action="Ver agenda" onAction={() => setTab('calendar')} accentColor="var(--accent)" />
      <div className="mb-5">
        {todayApts.length === 0 ? (
          <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: 'white', border: '1px solid var(--border)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-light)' }}>
              <CalendarDays size={18} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Sem consultas hoje</p>
              <button onClick={() => setTab('calendar')} className="text-xs mt-0.5 flex items-center gap-1 press-effect" style={{ color: 'var(--accent)' }}>
                Agendar <ChevronRight size={12} />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {todayApts.slice(0, 3).map((apt: any) => (
              <div key={apt.id} onClick={() => setTab('calendar')}
                className="rounded-xl p-3.5 flex items-center gap-3 press-effect"
                style={{ background: 'white', border: '1px solid var(--border)', cursor: 'pointer' }}>
                <div className="text-center flex-shrink-0" style={{ minWidth: 42 }}>
                  <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{apt.time}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{apt.duration}min</p>
                </div>
                <div className="w-0.5 self-stretch rounded-full flex-shrink-0" style={{ background: TYPES_COLORS[apt.type] || 'var(--accent)' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{apt.patient_name}</p>
                  {apt.title && <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>{apt.title}</p>}
                </div>
                <span className="text-[10px] font-semibold px-2 py-1 rounded-lg flex-shrink-0"
                  style={{ background: `${TYPES_COLORS[apt.type]}15`, color: TYPES_COLORS[apt.type] || 'var(--accent)' }}>
                  {apt.type}
                </span>
              </div>
            ))}
            {todayApts.length > 3 && (
              <button onClick={() => setTab('calendar')} className="text-xs font-medium w-full text-center py-2.5 press-effect rounded-xl" style={{ color: 'var(--accent)', background: 'var(--accent-light)' }}>
                +{todayApts.length - 3} mais consultas
              </button>
            )}
          </div>
        )}
      </div>

      {/* Today's routine */}
      {todayRoutines.length > 0 && (
        <div className="mb-5">
          <SectionHeader icon={<RotateCcw size={13} style={{ color: '#7a4ab0' }} />} title="Rotina de hoje" action="Ver tudo" onAction={() => setTab('routine')} accentColor="#7a4ab0" />
          {/* Progress */}
          <div className="rounded-xl p-3.5 mb-2" style={{ background: 'white', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{completedRoutines} de {todayRoutines.length} concluídas</p>
              <p className="text-xs font-bold" style={{ color: '#7a4ab0' }}>{Math.round(routineProgress)}%</p>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#f0e8f8' }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ background: '#7a4ab0', width: `${routineProgress}%` }} />
            </div>
          </div>
          <div className="space-y-1.5">
            {todayRoutines.slice(0, 4).map((r: any) => (
              <div key={r.id} className="rounded-xl flex items-center gap-3 px-3.5 py-3"
                style={{ background: 'white', border: '1px solid var(--border)' }}>
                <button onClick={() => toggleRoutine(r)}
                  className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center border-2 press-effect transition-all"
                  style={{ background: r.completed_today ? '#7a4ab0' : 'transparent', borderColor: r.completed_today ? '#7a4ab0' : '#d1d5db' }}>
                  {r.completed_today && <Check size={12} color="white" strokeWidth={3} />}
                </button>
                <p className="text-sm flex-1" style={{ textDecoration: r.completed_today ? 'line-through' : 'none', color: r.completed_today ? '#9ca3af' : 'var(--text-primary)' }}>
                  {r.title}
                </p>
                {r.time && <p className="text-xs flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>{r.time}</p>}
              </div>
            ))}
            {todayRoutines.length > 4 && (
              <button onClick={() => setTab('routine')} className="text-xs font-medium w-full text-center py-2.5 press-effect rounded-xl" style={{ color: '#7a4ab0', background: '#f0e8f8' }}>
                +{todayRoutines.length - 4} mais itens
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-secondary)' }}>Acesso rápido</p>
      <div className="grid grid-cols-2 gap-2.5">
        {quickActions.map(({ label, icon: Icon, tab, color, iconColor, desc }) => (
          <button key={tab} onClick={() => setTab(tab)}
            className="rounded-xl p-4 text-left press-effect flex flex-col gap-2.5"
            style={{ background: color, border: '1px solid rgba(31,45,36,0.05)' }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.75)' }}>
              <Icon size={17} style={{ color: iconColor }} strokeWidth={1.8} />
            </div>
            <div>
              <p className="font-semibold text-sm leading-tight" style={{ color: 'var(--text-primary)' }}>{label}</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function StatCard({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xl font-bold leading-none" style={{ color }}>{value}</p>
      <p className="text-[10px] leading-tight font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</p>
    </div>
  )
}

function SectionHeader({ icon, title, action, onAction, accentColor }: { icon: React.ReactNode; title: string; action: string; onAction: () => void; accentColor: string }) {
  return (
    <div className="flex items-center justify-between mb-2.5">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: accentColor }}>{title}</span>
      </div>
      <button onClick={onAction} className="text-[11px] font-semibold press-effect flex items-center gap-0.5" style={{ color: accentColor }}>
        {action} <ChevronRight size={12} />
      </button>
    </div>
  )
}
