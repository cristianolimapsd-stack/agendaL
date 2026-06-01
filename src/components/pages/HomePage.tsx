'use client'

import { useState, useEffect } from 'react'
import { Tab } from '@/app/page'
import { CalendarDays, Users, BookOpen, RotateCcw, Clock, ChevronRight, Wallet, Check } from 'lucide-react'
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

export default function HomePage({ setTab }: HomePageProps) {
  const [now, setNow] = useState<Date | null>(null)
  const [todayApts, setTodayApts] = useState<any[]>([])
  const [todayRoutines, setTodayRoutines] = useState<any[]>([])
  const [stats, setStats] = useState({ patients: 0, notes: 0, pendingFinance: 0 })

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

    const [aptsRes, routinesRes, patientsRes, notesRes, financeRes] = await Promise.all([
      supabase.from('appointments').select('*').eq('date', today).order('time'),
      supabase.from('routines').select('*').order('created_at'),
      supabase.from('patients').select('id', { count: 'exact', head: true }),
      supabase.from('notes').select('id', { count: 'exact', head: true }),
      supabase.from('finances').select('amount').eq('paid', false).eq('type', 'expense'),
    ])

    setTodayApts(aptsRes.data || [])
    const allRoutines = routinesRes.data || []
    setTodayRoutines(allRoutines.filter((r: any) => r.days.includes(todayName)))
    const pendingFinance = (financeRes.data || []).reduce((s: number, f: any) => s + f.amount, 0)
    setStats({
      patients: patientsRes.count || 0,
      notes: notesRes.count || 0,
      pendingFinance,
    })
  }

  async function toggleRoutine(r: any) {
    await supabase.from('routines').update({ completed_today: !r.completed_today }).eq('id', r.id)
    setTodayRoutines(prev => prev.map(x => x.id === r.id ? { ...x, completed_today: !x.completed_today } : x))
  }

  const todayCapitalized = now
    ? (() => {
        const today = format(now, "EEEE, d 'de' MMMM", { locale: ptBR })
        return today.charAt(0).toUpperCase() + today.slice(1)
      })()
    : ''

  const completedRoutines = todayRoutines.filter(r => r.completed_today).length
  const routineProgress = todayRoutines.length > 0 ? (completedRoutines / todayRoutines.length) * 100 : 0

  const quickActions = [
    { label: 'Pacientes', icon: Users, tab: 'patients' as Tab, color: '#e8f0e8', iconColor: '#5a825a', desc: 'Gerenciar fichas' },
    { label: 'Agenda', icon: CalendarDays, tab: 'calendar' as Tab, color: '#e8eef8', iconColor: '#4a6fa5', desc: 'Ver consultas' },
    { label: 'Notas', icon: BookOpen, tab: 'notes' as Tab, color: '#f8f0e8', iconColor: '#a0724a', desc: 'Anotações' },
    { label: 'Rotina', icon: RotateCcw, tab: 'routine' as Tab, color: '#f0e8f8', iconColor: '#7a4ab0', desc: 'Hábitos diários' },
    { label: 'Finanças', icon: Wallet, tab: 'finance' as Tab, color: '#e8f8ee', iconColor: '#2a7a4a', desc: 'Controle financeiro' },
  ]

  const TYPES_COLORS: Record<string, string> = {
    consulta: '#4a6fa5', retorno: '#5a825a', emergencia: '#dc2626', limpeza: '#a0724a', outro: '#7a4ab0'
  }

  return (
    <div className="px-4 pb-4 overflow-y-auto no-scrollbar h-full">
      {/* Header */}
      <div className="safe-top pt-2 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{todayCapitalized}</p>
            <h1 className="text-2xl font-semibold mt-0.5" style={{ fontFamily: 'Georgia, serif', color: 'var(--text-primary)' }}>
              {now ? `${greet(now.getHours())}, Dr. 👋` : 'Olá, Dr. 👋'}
            </h1>
          </div>
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--accent-light)' }}>
            <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 16 }}>D</span>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="card p-4 mb-4 flex gap-4">
        <StatItem value={String(todayApts.length)} label="Consultas hoje" />
        <div style={{ width: 1, background: 'var(--border)' }} />
        <StatItem value={String(stats.patients)} label="Pacientes" />
        <div style={{ width: 1, background: 'var(--border)' }} />
        <StatItem value={String(stats.notes)} label="Notas" />
      </div>

      {/* Pending finance alert */}
      {stats.pendingFinance > 0 && (
        <div className="card p-3 mb-4 flex items-center gap-3" style={{ borderLeft: '3px solid #f59e0b', background: '#fffbeb' }}>
          <Wallet size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: '#92400e' }}>Despesas pendentes</p>
            <p className="text-xs" style={{ color: '#a16207' }}>
              {stats.pendingFinance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} a pagar
            </p>
          </div>
          <button onClick={() => setTab('finance')} className="text-xs font-medium press-effect" style={{ color: '#f59e0b' }}>Ver</button>
        </div>
      )}

      {/* Today's appointments */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Clock size={14} style={{ color: 'var(--accent)' }} />
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>Consultas de hoje</span>
          </div>
          <button onClick={() => setTab('calendar')} className="text-xs font-medium press-effect" style={{ color: 'var(--accent)' }}>Ver agenda →</button>
        </div>

        {todayApts.length === 0 ? (
          <div className="card p-4">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Nenhuma consulta agendada para hoje.</p>
            <button onClick={() => setTab('calendar')} className="mt-2 flex items-center gap-1 text-sm font-medium press-effect" style={{ color: 'var(--accent)' }}>
              Agendar consulta <ChevronRight size={14} />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {todayApts.slice(0, 3).map((apt: any) => (
              <div key={apt.id} className="card p-3 flex items-center gap-3" onClick={() => setTab('calendar')} style={{ cursor: 'pointer' }}>
                <div className="text-center flex-shrink-0 w-12">
                  <p className="text-sm font-bold">{apt.time}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{apt.duration}min</p>
                </div>
                <div className="w-0.5 self-stretch rounded-full flex-shrink-0" style={{ background: TYPES_COLORS[apt.type] || 'var(--accent)' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{apt.patient_name}</p>
                  {apt.title && <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{apt.title}</p>}
                </div>
              </div>
            ))}
            {todayApts.length > 3 && (
              <button onClick={() => setTab('calendar')} className="text-xs font-medium w-full text-center py-2 press-effect" style={{ color: 'var(--accent)' }}>
                +{todayApts.length - 3} mais consultas
              </button>
            )}
          </div>
        )}
      </div>

      {/* Today's routine */}
      {todayRoutines.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <RotateCcw size={14} style={{ color: '#7a4ab0' }} />
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#7a4ab0' }}>Rotina de hoje</span>
            </div>
            <button onClick={() => setTab('routine')} className="text-xs font-medium press-effect" style={{ color: '#7a4ab0' }}>Ver tudo →</button>
          </div>
          <div className="card p-3 mb-2">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{completedRoutines}/{todayRoutines.length} concluídas</p>
              <p className="text-xs font-bold" style={{ color: '#7a4ab0' }}>{Math.round(routineProgress)}%</p>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#f0e8f8' }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ background: '#7a4ab0', width: `${routineProgress}%` }} />
            </div>
          </div>
          <div className="space-y-1.5">
            {todayRoutines.slice(0, 4).map((r: any) => (
              <div key={r.id} className="card flex items-center gap-3 p-3">
                <button onClick={() => toggleRoutine(r)}
                  className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center border-2 press-effect"
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
              <button onClick={() => setTab('routine')} className="text-xs font-medium w-full text-center py-2 press-effect" style={{ color: '#7a4ab0' }}>
                +{todayRoutines.length - 4} mais itens
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <h2 className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Acesso rápido</h2>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {quickActions.map(({ label, icon: Icon, tab, color, iconColor, desc }) => (
          <button key={tab} onClick={() => setTab(tab)} className="card p-3.5 text-left press-effect"
            style={{ background: color, border: 'none', boxShadow: 'none' }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2" style={{ background: 'rgba(255,255,255,0.7)' }}>
              <Icon size={16} style={{ color: iconColor }} strokeWidth={1.8} />
            </div>
            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{label}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
          </button>
        ))}
      </div>

      {/* Tip */}
      <div className="card p-4" style={{ background: '#1c2e1c' }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">🦷</span>
          <span className="text-xs font-semibold" style={{ color: '#8dbf8d' }}>DICA DO DIA</span>
        </div>
        <p className="text-sm" style={{ color: '#d4e8d4' }}>
          Mantenha as fichas dos pacientes sempre atualizadas para um atendimento mais eficiente e personalizado.
        </p>
      </div>
    </div>
  )
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex-1 text-center">
      <p className="text-xl font-bold" style={{ color: 'var(--accent)' }}>{value}</p>
      <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>{label}</p>
    </div>
  )
}
