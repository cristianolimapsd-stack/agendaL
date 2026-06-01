'use client'

import { useState, useEffect } from 'react'
import { supabase, Note } from '@/lib/supabase'
import { Plus, X, Pin, Trash2, Search, ChevronLeft, Edit3 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const CATEGORIES = [
  { value: 'all', label: 'Todas' },
  { value: 'personal', label: '🙋 Pessoal' },
  { value: 'professional', label: '🦷 Profissional' },
  { value: 'idea', label: '💡 Ideia' },
]

const CAT_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  personal:     { bg: '#e8eef8', text: '#4a6fa5', dot: '#4a6fa5' },
  professional: { bg: '#e8f0e8', text: '#5a825a', dot: '#5a825a' },
  idea:         { bg: '#fef9e7', text: '#a07800', dot: '#f59e0b' },
}

type NoteForm = {
  title: string
  content: string
  category: 'personal' | 'professional' | 'idea'
  pinned: boolean
}

const EMPTY_NOTE: NoteForm = { title: '', content: '', category: 'personal', pinned: false }

type View = 'list' | 'detail' | 'edit'

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [view, setView] = useState<View>('list')
  const [selected, setSelected] = useState<Note | null>(null)
  const [form, setForm] = useState<NoteForm>({ ...EMPTY_NOTE })
  const [saving, setSaving] = useState(false)
  const [isNew, setIsNew] = useState(false)

  useEffect(() => { loadNotes() }, [])

  async function loadNotes() {
    const { data } = await supabase.from('notes').select('*')
      .order('pinned', { ascending: false })
      .order('updated_at', { ascending: false })
    setNotes(data || [])
  }

  async function saveNote() {
    if (!form.title.trim()) return
    setSaving(true)
    const now = new Date().toISOString()
    if (selected && !isNew) {
      const { data } = await supabase.from('notes').update({ ...form, updated_at: now }).eq('id', selected.id).select().single()
      if (data) setSelected(data)
    } else {
      const { data } = await supabase.from('notes').insert({ ...form, created_at: now, updated_at: now }).select().single()
      if (data) setSelected(data)
    }
    await loadNotes()
    setView('detail')
    setIsNew(false)
    setSaving(false)
  }

  async function deleteNote(id: string) {
    if (!confirm('Excluir esta nota?')) return
    await supabase.from('notes').delete().eq('id', id)
    await loadNotes()
    setView('list')
    setSelected(null)
  }

  async function togglePin(note: Note, e?: React.MouseEvent) {
    e?.stopPropagation()
    await supabase.from('notes').update({ pinned: !note.pinned }).eq('id', note.id)
    await loadNotes()
    if (selected?.id === note.id) setSelected({ ...note, pinned: !note.pinned })
  }

  function openNote(n: Note) {
    setSelected(n)
    setView('detail')
  }

  function openEdit(n: Note) {
    setForm({ title: n.title, content: n.content, category: n.category, pinned: n.pinned })
    setIsNew(false)
    setView('edit')
  }

  function openNew() {
    setForm({ ...EMPTY_NOTE })
    setSelected(null)
    setIsNew(true)
    setView('edit')
  }

  const filtered = notes.filter(n => {
    const matchCat = filter === 'all' || n.category === filter
    const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const pinned = filtered.filter(n => n.pinned)
  const rest = filtered.filter(n => !n.pinned)

  // LIST VIEW
  if (view === 'list') return (
    <div className="h-full flex flex-col">
      <div className="safe-top px-4 pt-2 pb-2 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>Notas</h1>
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
                <p className="text-xs font-semibold uppercase tracking-wide mb-2 mt-1" style={{ color: 'var(--text-secondary)' }}>📌 Fixadas</p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {pinned.map(n => <NoteCard key={n.id} note={n} onOpen={openNote} onPin={togglePin} />)}
                </div>
              </>
            )}
            {rest.length > 0 && (
              <>
                {pinned.length > 0 && <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-secondary)' }}>Outras</p>}
                <div className="grid grid-cols-2 gap-2">
                  {rest.map(n => <NoteCard key={n.id} note={n} onOpen={openNote} onPin={togglePin} />)}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )

  // DETAIL VIEW
  if (view === 'detail' && selected) {
    const cat = CAT_COLORS[selected.category] || CAT_COLORS.personal
    return (
      <div className="h-full flex flex-col">
        <div className="safe-top flex-shrink-0">
          <div className="flex items-center justify-between px-4 pt-2 pb-3">
            <button onClick={() => setView('list')} className="flex items-center gap-1 press-effect" style={{ color: 'var(--accent)' }}>
              <ChevronLeft size={20} />
              <span className="text-sm font-medium">Notas</span>
            </button>
            <div className="flex items-center gap-2">
              <button onClick={() => togglePin(selected)}
                className="w-8 h-8 flex items-center justify-center rounded-full press-effect"
                style={{ background: selected.pinned ? '#fef3c7' : '#f5f5f7' }}>
                <Pin size={15} fill={selected.pinned ? '#f59e0b' : 'none'} style={{ color: selected.pinned ? '#f59e0b' : '#9ca3af' }} />
              </button>
              <button onClick={() => openEdit(selected)}
                className="flex items-center gap-1.5 press-effect px-3 py-1.5 rounded-xl"
                style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                <Edit3 size={14} />
                <span className="text-sm font-medium">Editar</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-8">
          {/* Category badge */}
          <span className="badge mb-4 inline-flex" style={{ background: cat.bg, color: cat.text, fontSize: 11 }}>
            {selected.category === 'personal' ? '🙋 Pessoal' : selected.category === 'professional' ? '🦷 Profissional' : '💡 Ideia'}
          </span>

          {/* Title */}
          <h2 className="text-2xl font-bold mb-2 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>{selected.title}</h2>

          {/* Date */}
          <p className="text-xs mb-6" style={{ color: 'var(--text-secondary)' }}>
            Atualizada em {format(new Date(selected.updated_at), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
          </p>

          {/* Divider */}
          <div className="h-px mb-6" style={{ background: 'var(--border)' }} />

          {/* Content */}
          {selected.content ? (
            <p className="text-base leading-relaxed" style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
              {selected.content}
            </p>
          ) : (
            <p className="text-base italic" style={{ color: '#9ca3af' }}>Sem conteúdo.</p>
          )}

          {/* Delete */}
          <button onClick={() => deleteNote(selected.id)}
            className="mt-10 w-full py-3 rounded-2xl font-medium flex items-center justify-center gap-2 press-effect"
            style={{ background: '#fff0f0', color: '#dc2626' }}>
            <Trash2 size={16} /> Excluir nota
          </button>
        </div>
      </div>
    )
  }

  // EDIT VIEW
  return (
    <div className="h-full flex flex-col">
      <div className="safe-top flex-shrink-0">
        <div className="flex items-center justify-between px-4 pt-2 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <button onClick={() => setView(selected && !isNew ? 'detail' : 'list')} className="flex items-center gap-1 press-effect" style={{ color: 'var(--accent)' }}>
            <ChevronLeft size={20} />
            <span className="text-sm font-medium">{selected && !isNew ? selected.title || 'Nota' : 'Notas'}</span>
          </button>
          <button onClick={saveNote} disabled={saving || !form.title.trim()}
            className="px-4 py-1.5 rounded-xl text-sm font-semibold press-effect"
            style={{ background: saving || !form.title.trim() ? '#e5e7eb' : 'var(--accent)', color: saving || !form.title.trim() ? '#9ca3af' : 'white' }}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pt-4 pb-8 flex flex-col gap-4">
        {/* Category selector */}
        <div className="flex gap-2">
          {CATEGORIES.slice(1).map(c => {
            const col = CAT_COLORS[c.value]
            const active = form.category === c.value
            return (
              <button key={c.value} onClick={() => setForm(f => ({ ...f, category: c.value as NoteForm['category'] }))}
                className="badge flex-1 justify-center press-effect"
                style={{ background: active ? col.bg : '#f5f5f7', color: active ? col.text : 'var(--text-secondary)', fontSize: 12, padding: '7px', border: active ? `1.5px solid ${col.text}30` : '1.5px solid transparent' }}>
                {c.label}
              </button>
            )
          })}
        </div>

        {/* Title */}
        <input
          className="text-2xl font-bold bg-transparent outline-none w-full"
          style={{ fontFamily: 'Georgia, serif', color: 'var(--text-primary)', border: 'none', padding: 0 }}
          placeholder="Título"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
        />

        <div className="h-px" style={{ background: 'var(--border)' }} />

        {/* Content */}
        <textarea
          className="flex-1 bg-transparent outline-none w-full resize-none text-base leading-relaxed"
          style={{ color: 'var(--text-primary)', border: 'none', padding: 0, minHeight: 300, fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}
          placeholder="Comece a escrever..."
          value={form.content}
          onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
        />

        {/* Pin toggle */}
        <button onClick={() => setForm(f => ({ ...f, pinned: !f.pinned }))}
          className="flex items-center gap-2 text-sm font-medium press-effect self-start"
          style={{ color: form.pinned ? '#f59e0b' : 'var(--text-secondary)' }}>
          <Pin size={16} fill={form.pinned ? '#f59e0b' : 'none'} />
          {form.pinned ? 'Fixada' : 'Fixar nota'}
        </button>
      </div>
    </div>
  )
}

function NoteCard({ note, onOpen, onPin }: { note: Note; onOpen: (n: Note) => void; onPin: (n: Note, e: React.MouseEvent) => void }) {
  const cat = CAT_COLORS[note.category] || CAT_COLORS.personal
  const wordCount = note.content?.split(/\s+/).filter(Boolean).length || 0

  return (
    <button onClick={() => onOpen(note)} className="card p-4 text-left press-effect flex flex-col" style={{ minHeight: 120 }}>
      <div className="flex items-start justify-between gap-1 mb-2">
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1" style={{ background: cat.dot }} />
        <button onClick={e => onPin(note, e)} className="flex-shrink-0 p-0.5 -mr-1 -mt-1">
          <Pin size={13} fill={note.pinned ? '#f59e0b' : 'none'} style={{ color: note.pinned ? '#f59e0b' : '#d1d5db' }} />
        </button>
      </div>
      <p className="font-semibold text-sm leading-snug mb-1 flex-1" style={{ color: 'var(--text-primary)' }}>{note.title}</p>
      {note.content && (
        <p className="text-xs line-clamp-2 mb-2" style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{note.content}</p>
      )}
      <div className="flex items-center justify-between mt-auto">
        <span className="text-[10px]" style={{ color: '#9ca3af' }}>
          {format(new Date(note.updated_at), "d MMM", { locale: ptBR })}
        </span>
        {wordCount > 0 && <span className="text-[10px]" style={{ color: '#9ca3af' }}>{wordCount} palavras</span>}
      </div>
    </button>
  )
}
