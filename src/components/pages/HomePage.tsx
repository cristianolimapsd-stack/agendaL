'use client'

import { useState, useEffect } from 'react'
import { Tab } from '@/app/page'
import { CalendarDays, Users, BookOpen, RotateCcw, Tooth, Clock, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface HomePageProps {
  setTab: (t: Tab) => void
}

const greet = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export default function HomePage({ setTab }: HomePageProps) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  const today = format(now, "EEEE, d 'de' MMMM", { locale: ptBR })
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1)

  const quickActions = [
    { label: 'Pacientes', icon: Users, tab: 'patients' as Tab, color: '#e8f0e8', iconColor: '#5a825a', desc: 'Gerenciar fichas' },
    { label: 'Agenda', icon: CalendarDays, tab: 'calendar' as Tab, color: '#e8eef8', iconColor: '#4a6fa5', desc: 'Ver consultas' },
    { label: 'Notas', icon: BookOpen, tab: 'notes' as Tab, color: '#f8f0e8', iconColor: '#a0724a', desc: 'Anotações' },
    { label: 'Rotina', icon: RotateCcw, tab: 'routine' as Tab, color: '#f0e8f8', iconColor: '#7a4ab0', desc: 'Hábitos diários' },
  ]

  return (
    <div className="px-4 pb-4">
      {/* Header */}
      <div className="safe-top pt-2 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{todayCapitalized}</p>
            <h1 className="text-2xl font-semibold mt-0.5" style={{ fontFamily: 'Georgia, serif', color: 'var(--text-primary)' }}>
              {greet()}, Dr. 👋
            </h1>
          </div>
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'var(--accent-light)' }}
          >
            <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 16 }}>D</span>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="card p-4 mb-4 flex gap-4">
        <StatItem value="0" label="Consultas hoje" />
        <div style={{ width: 1, background: 'var(--border)' }} />
        <StatItem value="0" label="Pacientes" />
        <div style={{ width: 1, background: 'var(--border)' }} />
        <StatItem value="0" label="Notas" />
      </div>

      {/* Next appointment */}
      <div className="card p-4 mb-4" style={{ borderLeft: '3px solid var(--accent)' }}>
        <div className="flex items-center gap-2 mb-1">
          <Clock size={14} style={{ color: 'var(--accent)' }} />
          <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>Próxima consulta</span>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Nenhuma consulta agendada para hoje.
        </p>
        <button
          onClick={() => setTab('calendar')}
          className="mt-2 flex items-center gap-1 text-sm font-medium press-effect"
          style={{ color: 'var(--accent)' }}
        >
          Agendar consulta <ChevronRight size={14} />
        </button>
      </div>

      {/* Quick actions */}
      <h2 className="text-sm font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
        Acesso rápido
      </h2>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {quickActions.map(({ label, icon: Icon, tab, color, iconColor, desc }) => (
          <button
            key={tab}
            onClick={() => setTab(tab)}
            className="card p-4 text-left press-effect"
            style={{ background: color, border: 'none', boxShadow: 'none' }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ background: 'rgba(255,255,255,0.7)' }}>
              <Icon size={18} style={{ color: iconColor }} strokeWidth={1.8} />
            </div>
            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{label}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
          </button>
        ))}
      </div>

      {/* Tips */}
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
