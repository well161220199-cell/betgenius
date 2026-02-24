# ⚽ BetGenius AI

Previsões esportivas com Inteligência Artificial usando Google Gemini + Google Search.

## 🚀 Como fazer o Deploy (passo a passo)

### 1. Subir o projeto no GitHub

1. Acesse [github.com](https://github.com) e faça login
2. Clique no **"+"** → **New repository**
3. Nome: `betgenius` → Clique **Create repository**
4. No seu computador, abra o terminal na pasta do projeto e rode:

```bash
git init
git add .
git commit -m "BetGenius AI - primeiro commit"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/betgenius.git
git push -u origin main
```

> Se nunca usou Git, instale em: [git-scm.com](https://git-scm.com/)

### 2. Deploy no Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login com GitHub
2. Clique **"Add New Project"**
3. Selecione o repositório `betgenius`
4. Clique **Deploy** (ele vai detectar Next.js automaticamente)

### 3. Configurar variáveis de ambiente no Vercel

1. No Vercel, vá no seu projeto → **Settings** → **Environment Variables**
2. Adicione estas 3 variáveis:

| Nome | Valor |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://crhluqkjkczszeaxuux.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyaGx1cWtqa2N6c3pleGF4dXV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MDU1NjUsImV4cCI6MjA4NzQ4MTU2NX0.Q2zfd2YuzVVCRquoQhaqla4c4IShAV0bkBLZS0EH3Bw` |
| `GEMINI_API_KEY` | `AIzaSyB8LMcBXWHOQnlLG-BkiuMghnSxDOeyLEo` |

3. Clique **Save**
4. Vá em **Deployments** → clique nos 3 pontos → **Redeploy**

### 4. Configurar URL no Google Cloud e Supabase

Depois que o Vercel criar seu site (ex: `betgenius-abc123.vercel.app`):

**No Google Cloud Console (console.cloud.google.com):**
1. Vá em **APIs e Serviços** → **Credenciais**
2. Edite o cliente OAuth "BetGenius Web"
3. Em **Origens JavaScript autorizadas**, adicione:
   - `https://SEU-SITE.vercel.app` (sua URL do Vercel)
4. Em **URIs de redirecionamento autorizados**, mantenha:
   - `https://crhluqkjkczszeaxuux.supabase.co/auth/v1/callback`
5. Salve

**No Supabase (supabase.com):**
1. Vá em **Authentication** → **URL Configuration**
2. Em **Site URL**, coloque a URL do Vercel:
   - `https://SEU-SITE.vercel.app`
3. Em **Redirect URLs**, adicione:
   - `https://SEU-SITE.vercel.app/auth/callback`
4. Salve

### ✅ Pronto!

Acesse sua URL do Vercel e teste o login com Google!

---

## 📁 Estrutura do Projeto

```
betgenius/
├── app/
│   ├── layout.js              # Layout principal (metadata, PWA)
│   ├── page.js                # Página com todo o app (login, dashboard)
│   ├── globals.css            # Estilos globais
│   ├── api/predict/route.js   # API que chama o Gemini AI + Google Search
│   └── auth/callback/route.js # Callback do Google Login
├── lib/
│   ├── supabase.js            # Cliente Supabase
│   └── markets.js             # Configuração dos 22 mercados
├── public/
│   └── manifest.json          # PWA manifest (instalar no celular)
├── package.json
├── next.config.js
└── .env.local.example         # Exemplo de variáveis de ambiente
```

## 🛠 Tecnologias

- **Next.js 14** — Framework React com API Routes
- **Supabase** — Banco de dados + Login com Google
- **Google Gemini 2.5 Flash** — IA gratuita com busca no Google
- **Vercel** — Hospedagem gratuita
