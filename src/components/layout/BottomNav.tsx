'use client'

import { Tab } from '@/app/page'
import { Home, Users, CalendarDays, BookOpen, RotateCcw, Wallet } from 'lucide-react'

const tabs: { id: Tab; label: string; icon: React.FC<any> }[] = [
  { id: 'home',     label: 'Início',    icon: Home },
  { id: 'patients', label: 'Pacientes', icon: Users },
  { id: 'calendar', label: 'Agenda',    icon: CalendarDays },
  { id: 'notes',    label: 'Notas',     icon: BookOpen },
  { id: 'routine',  label: 'Rotina',    icon: RotateCcw },
  { id: 'finance',  label: 'Finanças',  icon: Wallet },
]

export default function BottomNav({ activeTab, setTab }: { activeTab: Tab; setTab: (t: Tab) => void }) {
  return (
    <nav className="tab-bar safe-bottom flex-shrink-0">
      <div className="flex items-center justify-around h-14 px-1">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex flex-col items-center gap-0.5 px-2 py-1 press-effect rounded-xl transition-smooth"
              style={{ minWidth: 44 }}
            >
              <Icon size={20} strokeWidth={isActive ? 2.2 : 1.6} style={{ color: isActive ? 'var(--accent)' : '#9ca3af' }} />
              <span className="text-[9px] font-medium" style={{ color: isActive ? 'var(--accent)' : '#9ca3af' }}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
