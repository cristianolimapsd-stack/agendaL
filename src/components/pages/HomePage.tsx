'use client'

import { useState, useEffect } from 'react'
import { Tab } from '@/app/page'
import { CalendarDays, Users, BookOpen, RotateCcw, Clock, ChevronRight, Wallet, Check, TrendingUp, ArrowRight } from 'lucide-react'
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

    const [aptsRes, routinesRes, patientsRes, notesRes, monthAptsRes, financeRes] = await Promise.all([
      supabase.from('appointments').select('*').eq('date', today).order('time'),
      supabase.from('routines').select('*').order('created_at'),
      supabase.from('patients').select('id', { count: 'exact', head: true }),
      supabase.from('notes').select('id', { count: 'exact', head: true }),
      supabase.from('appointments').select('id', { count: 'exact', head: true }).gte('date', monthStart).lte('date', monthEnd),
      supabase.from('finances').select('amount').eq('type', 'income').eq('paid', true).gte('date', monthStart).lte('date', monthEnd),
    ])

    setTodayApts(aptsRes.data || [])
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

  const todayCapitalized = now
    ? (() => { const d = format(now, "EEEE, d 'de' MMMM", { locale: ptBR }); return d.charAt(0).toUpperCase() + d.slice(1) })()
    : ''

  const completedRoutines = todayRoutines.filter(r => r.completed_today).length
  const routineProgress = todayRoutines.length > 0 ? (completedRoutines / todayRoutines.length) * 100 : 0

  const quickActions = [
    { label: 'Pacientes', icon: Users, tab: 'patients' as Tab, color: '#edf5ed', iconColor: '#5a825a', desc: 'Fichas e histórico' },
    { label: 'Agenda', icon: CalendarDays, tab: 'calendar' as Tab, color: '#edf0f8', iconColor: '#4a6fa5', desc: 'Consultas' },
    { label: 'Notas', icon: BookOpen, tab: 'notes' as Tab, color: '#f8f3ed', iconColor: '#a0724a', desc: 'Anotações' },
    { label: 'Finanças', icon: Wallet, tab: 'finance' as Tab, color: '#edf8f2', iconColor: '#2a7a4a', desc: 'Controle financeiro' },
  ]

  return (
    <div className="px-4 pb-6 overflow-y-auto no-scrollbar h-full">

      {/* Header */}
      <div className="safe-top pt-3 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium" style={{ color: 'var(--text-secondary)' }}>{todayCapitalized}</p>
            <h1 className="text-[26px] font-semibold mt-0.5 leading-tight" style={{ fontFamily: 'Georgia, serif', color: 'var(--text-primary)' }}>
              {now ? `${greet(now.getHours())},` : 'Olá,'}<br />
              <span style={{ color: 'var(--accent)' }}>Dra. Hellen</span> 👋
            </h1>
          </div>
          <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg, #5a825a, #3d5e3d)' }}>
            <span style={{ color: 'white', fontWeight: 700, fontSize: 18, fontFamily: 'Georgia, serif' }}>H</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2.5 mb-5">
        <StatCard value={String(stats.monthApts)} label="Consultas no mês" color="var(--accent)" bg="#edf5ed" />
        <StatCard value={String(stats.patients)} label="Pacientes" color="#4a6fa5" bg="#edf0f8" />
        <StatCard value={String(stats.notes)} label="Notas" color="#a0724a" bg="#f8f3ed" />
      </div>

      {/* Income highlight */}
      {stats.monthIncome > 0 && (
        <div className="rounded-2xl p-4 mb-5 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #1c2e1c, #2d4a2d)' }}>
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
          <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'white', border: '1px solid var(--border)' }}>
            <span className="text-2xl">📅</span>
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
                className="rounded-2xl p-3.5 flex items-center gap-3 press-effect"
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
              <button onClick={() => setTab('calendar')} className="text-xs font-medium w-full text-center py-2.5 press-effect rounded-2xl" style={{ color: 'var(--accent)', background: 'var(--accent-light)' }}>
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
          <div className="rounded-2xl p-3.5 mb-2" style={{ background: 'white', border: '1px solid var(--border)' }}>
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
              <button onClick={() => setTab('routine')} className="text-xs font-medium w-full text-center py-2.5 press-effect rounded-2xl" style={{ color: '#7a4ab0', background: '#f0e8f8' }}>
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
            className="rounded-2xl p-4 text-left press-effect flex flex-col gap-2.5"
            style={{ background: color, border: 'none' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.75)' }}>
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

function StatCard({ value, label, color, bg }: { value: string; label: string; color: string; bg: string }) {
  return (
    <div className="rounded-2xl p-3.5 flex flex-col gap-1" style={{ background: bg }}>
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
