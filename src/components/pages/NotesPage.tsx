'use client'

import { useState, useEffect } from 'react'
import { supabase, Note } from '@/lib/supabase'
import { Plus, X, Pin, Trash2, Search } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const CATEGORIES = [
  { value: 'all', label: 'Todas' },
  { value: 'personal', label: '🙋 Pessoal' },
  { value: 'professional', label: '🦷 Profissional' },
  { value: 'idea', label: '💡 Ideia' },
]

const CAT_COLORS: Record<string, { bg: string; text: string }> = {
  personal: { bg: '#e8eef8', text: '#4a6fa5' },
  professional: { bg: '#e8f0e8', text: '#5a825a' },
  idea: { bg: '#fef9e7', text: '#a07800' },
}

type NoteForm = {
  title: string
  content: string
  category: 'personal' | 'professional' | 'idea'
  pinned: boolean
}

const EMPTY_NOTE: NoteForm = { title: '', content: '', category: 'personal', pinned: false }

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<Note | null>(null)
  const [form, setForm] = useState<NoteForm>({ ...EMPTY_NOTE })
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadNotes() }, [])

  async function loadNotes() {
    const { data } = await supabase.from('notes').select('*').order('pinned', { ascending: false }).order('updated_at', { ascending: false })
    setNotes(data || [])
  }

  async function saveNote() {
    if (!form.title.trim()) return
    setSaving(true)
    const now = new Date().toISOString()
    if (selected) {
      await supabase.from('notes').update({ ...form, updated_at: now }).eq('id', selected.id)
    } else {
      await supabase.from('notes').insert({ ...form, created_at: now, updated_at: now })
    }
    await loadNotes()
    closeForm()
    setSaving(false)
  }

  async function deleteNote(id: string) {
    if (!confirm('Excluir esta nota?')) return
    await supabase.from('notes').delete().eq('id', id)
    await loadNotes()
    closeForm()
  }

  async function togglePin(note: Note) {
    await supabase.from('notes').update({ pinned: !note.pinned }).eq('id', note.id)
    await loadNotes()
  }

  function openNew() {
    setForm({ ...EMPTY_NOTE })
    setSelected(null)
    setShowForm(true)
  }

  function openEdit(n: Note) {
    setForm({ title: n.title, content: n.content, category: n.category, pinned: n.pinned })
    setSelected(n)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setSelected(null)
  }

  const filtered = notes.filter(n => {
    const matchCat = filter === 'all' || n.category === filter
    const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const pinned = filtered.filter(n => n.pinned)
  const rest = filtered.filter(n => !n.pinned)

  return (
    <div className="h-full flex flex-col">
      <div className="safe-top px-4 pt-2 pb-2 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>Notas</h1>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{notes.length} anotações</p>
          </div>
          <button onClick={openNew} className="w-9 h-9 rounded-full flex items-center justify-center press-effect" style={{ background: 'var(--accent)' }}>
            <Plus size={18} color="white" strokeWidth={2.5} />
          </button>
        </div>

        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
          <input className="input-field pl-9" placeholder="Buscar nota..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {CATEGORIES.map(c => (
            <button key={c.value} onClick={() => setFilter(c.value)}
              className="badge flex-shrink-0 press-effect"
              style={{ background: filter === c.value ? 'var(--accent)' : '#f5f5f7', color: filter === c.value ? 'white' : 'var(--text-secondary)', fontSize: 12, padding: '6px 14px' }}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4">
        {filtered.length === 0 ? (
          <div className="text-center pt-16">
            <p className="text-4xl mb-3">📝</p>
            <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>Nenhuma nota encontrada</p>
            <button onClick={openNew} className="mt-3 text-sm font-medium" style={{ color: 'var(--accent)' }}>Nova nota</button>
          </div>
        ) : (
          <>
            {pinned.length > 0 && (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>
                  📌 Fixadas
                </p>
                <div className="space-y-2 mb-4">
                  {pinned.map(n => <NoteCard key={n.id} note={n} onOpen={openEdit} onPin={togglePin} />)}
                </div>
              </>
            )}
            {rest.length > 0 && (
              <>
                {pinned.length > 0 && <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>Outras</p>}
                <div className="space-y-2">
                  {rest.map(n => <NoteCard key={n.id} note={n} onOpen={openEdit} onPin={togglePin} />)}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {showForm && (
        <>
          <div className="overlay" onClick={closeForm} />
          <div className="bottom-sheet" style={{ maxHeight: '92vh', overflowY: 'auto' }}>
            <div className="px-4 pt-4 pb-2 flex items-center justify-between sticky top-0 bg-white z-10 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="font-bold text-lg">{selected ? 'Editar nota' : 'Nova nota'}</h2>
              <button onClick={closeForm} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ background: '#f5f5f7' }}>
                <X size={16} />
              </button>
            </div>
            <div className="px-4 py-4 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Título *</label>
                <input className="input-field" placeholder="Título da nota" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Categoria</label>
                <div className="flex gap-2">
                  {CATEGORIES.slice(1).map(c => (
                    <button key={c.value} onClick={() => setForm(f => ({ ...f, category: c.value as NoteForm['category'] }))}
                      className="badge flex-1 press-effect justify-center"
                      style={{ background: form.category === c.value ? 'var(--accent)' : '#f5f5f7', color: form.category === c.value ? 'white' : 'var(--text-secondary)', fontSize: 12, padding: '8px' }}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Conteúdo</label>
                <textarea className="input-field resize-none" rows={8}
                  placeholder="Escreva sua nota aqui..."
                  value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setForm(f => ({ ...f, pinned: !f.pinned }))}
                  className="flex items-center gap-2 text-sm font-medium press-effect"
                  style={{ color: form.pinned ? '#f59e0b' : 'var(--text-secondary)' }}>
                  <Pin size={16} fill={form.pinned ? '#f59e0b' : 'none'} />
                  {form.pinned ? 'Fixada' : 'Fixar nota'}
                </button>
              </div>
              <button onClick={saveNote} disabled={saving || !form.title.trim()}
                className="w-full py-3.5 rounded-2xl font-semibold text-white press-effect"
                style={{ background: saving ? '#9ca3af' : 'var(--accent)' }}>
                {saving ? 'Salvando...' : selected ? 'Salvar' : 'Criar nota'}
              </button>
              {selected && (
                <button onClick={() => deleteNote(selected.id)}
                  className="w-full py-3 rounded-2xl font-medium flex items-center justify-center gap-2 press-effect"
                  style={{ background: '#fff0f0', color: '#dc2626' }}>
                  <Trash2 size={16} /> Excluir nota
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function NoteCard({ note, onOpen, onPin }: { note: Note; onOpen: (n: Note) => void; onPin: (n: Note) => void }) {
  const cat = CAT_COLORS[note.category] || { bg: '#f5f5f7', text: '#6b7280' }
  return (
    <button onClick={() => onOpen(note)} className="card w-full p-4 text-left press-effect">
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="font-semibold text-sm flex-1">{note.title}</p>
        <button onClick={e => { e.stopPropagation(); onPin(note) }} className="flex-shrink-0 p-0.5">
          <Pin size={14} fill={note.pinned ? '#f59e0b' : 'none'} style={{ color: note.pinned ? '#f59e0b' : '#d1d5db' }} />
        </button>
      </div>
      {note.content && (
        <p className="text-xs line-clamp-2 mb-2" style={{ color: 'var(--text-secondary)' }}>{note.content}</p>
      )}
      <div className="flex items-center gap-2">
        <span className="badge" style={{ background: cat.bg, color: cat.text, fontSize: 10 }}>
          {note.category === 'personal' ? '🙋 Pessoal' : note.category === 'professional' ? '🦷 Profissional' : '💡 Ideia'}
        </span>
        <span className="text-[10px]" style={{ color: '#9ca3af' }}>
          {format(new Date(note.updated_at), "d MMM", { locale: ptBR })}
        </span>
      </div>
    </button>
  )
}
