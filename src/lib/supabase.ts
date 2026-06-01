import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Patient = {
  id: string
  name: string
  age: number
  phone: string
  email?: string
  cpf?: string
  procedures: string[]
  notes: string
  next_appointment?: string
  created_at: string
  updated_at: string
}

export type Note = {
  id: string
  title: string
  content: string
  category: 'personal' | 'professional' | 'idea'
  pinned: boolean
  created_at: string
  updated_at: string
}

export type Appointment = {
  id: string
  patient_id?: string
  patient_name: string
  title: string
  date: string
  time: string
  duration: number
  type: 'consulta' | 'retorno' | 'emergencia' | 'limpeza' | 'outro'
  notes?: string
  status: 'scheduled' | 'completed' | 'cancelled'
  created_at: string
}

export type Routine = {
  id: string
  title: string
  time?: string
  days: string[]
  category: 'morning' | 'work' | 'evening' | 'health'
  completed_today: boolean
  created_at: string
}
