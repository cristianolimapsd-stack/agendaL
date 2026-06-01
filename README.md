# 🦷 DentalDesk — Agenda Profissional

App PWA completo para dentistas. Funciona como app nativo no iPhone via "Adicionar à Tela de Início".

## Funcionalidades

- 📅 **Agenda/Calendário** — Agendar consultas por dia, tipo e paciente
- 👥 **Pacientes** — Ficha completa com nome, idade, CPF, telefone, procedimentos e histórico
- 📝 **Notas** — Diário pessoal e profissional com categorias e fixação
- 🔄 **Rotinas** — Hábitos diários com progresso e dias da semana
- 🏠 **Dashboard** — Visão geral do dia com acesso rápido
- 📱 **PWA** — Instala no iPhone como app nativo

---

## Deploy em 5 passos

### 1. Criar conta e projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta gratuita
2. Crie um **New Project** (salve a senha do banco!)
3. Vá em **SQL Editor** e cole o conteúdo do arquivo `supabase-schema.sql`
4. Clique em **Run** para criar as tabelas
5. Vá em **Settings → API** e copie:
   - `Project URL`
   - `anon public` key

### 2. Criar repositório no GitHub

1. Acesse [github.com](https://github.com) → New Repository
2. Nome: `dental-desk`
3. Faça upload de todos os arquivos desta pasta
   ```bash
   git init
   git add .
   git commit -m "🦷 DentalDesk inicial"
   git remote add origin https://github.com/SEU_USUARIO/dental-desk.git
   git push -u origin main
   ```

### 3. Deploy no Vercel

1. Acesse [vercel.com](https://vercel.com) → New Project
2. Importe seu repositório do GitHub
3. Em **Environment Variables**, adicione:
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGci...
   ```
4. Clique em **Deploy**
5. Em ~2 minutos seu app estará em `https://dental-desk.vercel.app`

### 4. Instalar no iPhone como app

1. Abra o link no **Safari** (não Chrome)
2. Toque no botão **Compartilhar** (ícone de caixa com seta)
3. Selecione **"Adicionar à Tela de Início"**
4. Nomeie como "DentalDesk" e confirme
5. ✅ O app aparece na tela inicial como qualquer outro app!

### 5. (Opcional) Domínio personalizado

No Vercel: **Settings → Domains → Add Domain** → `agenda.seusite.com.br`

---

## Desenvolvimento local

```bash
# Instalar dependências
npm install

# Copiar variáveis de ambiente
cp .env.local.example .env.local
# Edite .env.local com suas chaves do Supabase

# Rodar em desenvolvimento
npm run dev
# Acesse http://localhost:3000
```

## Estrutura do projeto

```
src/
├── app/
│   ├── layout.tsx        # Layout raiz + PWA meta tags
│   ├── page.tsx          # Shell principal + navegação
│   └── globals.css       # Design system completo
├── components/
│   ├── layout/
│   │   └── BottomNav.tsx # Barra de navegação inferior
│   └── pages/
│       ├── HomePage.tsx      # Dashboard
│       ├── PatientsPage.tsx  # Gestão de pacientes
│       ├── CalendarPage.tsx  # Agenda/calendário
│       ├── NotesPage.tsx     # Notas e diário
│       └── RoutinePage.tsx   # Rotinas diárias
└── lib/
    └── supabase.ts       # Cliente + tipos TypeScript
```

---

Feito com ❤️ para dentistas que merecem uma agenda profissional de verdade.
