'use client'

import { useState } from 'react'
import HomePage from '@/components/pages/HomePage'
import PatientsPage from '@/components/pages/PatientsPage'
import CalendarPage from '@/components/pages/CalendarPage'
import NotesPage from '@/components/pages/NotesPage'
import RoutinePage from '@/components/pages/RoutinePage'
import BottomNav from '@/components/layout/BottomNav'

export type Tab = 'home' | 'patients' | 'calendar' | 'notes' | 'routine'

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('home')

  const renderPage = () => {
    switch (activeTab) {
      case 'home': return <HomePage setTab={setActiveTab} />
      case 'patients': return <PatientsPage />
      case 'calendar': return <CalendarPage />
      case 'notes': return <NotesPage />
      case 'routine': return <RoutinePage />
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <main className="flex-1 overflow-hidden relative">
        <div key={activeTab} className="page-enter h-full overflow-y-auto no-scrollbar">
          {renderPage()}
        </div>
      </main>
      <BottomNav activeTab={activeTab} setTab={setActiveTab} />
    </div>
  )
}
