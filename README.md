# 📚 Aplicativo Studium

Sistema completo de gerenciamento de estudos com autenticação, cronômetro, planos de estudo e registro detalhado de sessões.

## 🚀 Tecnologias

- **React** - Framework frontend
- **Vite** - Build tool rápido
- **Tailwind CSS** - Estilização
- **Supabase** - Backend, autenticação e banco de dados PostgreSQL

## 📋 Funcionalidades

- ✅ **Autenticação**: Registro e login de usuários
- ✅ **Dashboard**: Calendário de estudos
- ✅ **Matérias**: Gerenciamento com cor e peso (relevância)
- ✅ **Tópicos**: Organização de conteúdo por matéria
- ✅ **Planos de Estudo**: Criação de planos personalizados
- ✅ **Sessões de Estudo**: Registro detalhado com:
  - Data, horário e tipo de conteúdo
  - Questões resolvidas, acertos e erros
  - Comentários e observações
- ✅ **Cronômetro**: Contagem regressiva para estudos
- ✅ **Revisões**: Em desenvolvimento
- ✅ **Progresso Visual**: Checkmarks para metas concluídas
- ✅ **Segurança**: Row Level Security no banco de dados

## 🛠️ Configuração

### 1. Instalar Node.js

Baixe e instale o Node.js: https://nodejs.org/

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar Supabase

1. Crie uma conta em https://supabase.com
2. Crie um novo projeto
3. No SQL Editor do Supabase, copie e execute **TODO** o conteúdo do arquivo `database-schema.sql`
   - Este arquivo cria todas as tabelas necessárias
   - Configura autenticação e segurança (RLS)
   - Cria índices para melhor performance

4. Copie `.env.example` para `.env`:
   ```bash
   copy .env.example .env
   ```

5. No Supabase, vá em **Settings → API** e copie:
   - **Project URL** → cole em `VITE_SUPABASE_URL`
   - **anon public key** → cole em `VITE_SUPABASE_ANON_KEY`

Seu arquivo `.env` deve ficar assim:
```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-aqui
```

### 4. Executar o aplicativo

```bash
npm run dev
```

Acesse: http://localhost:5173

## 📱 Como Usar

### Primeiro Acesso
1. Crie uma conta com email e senha
2. Confirme seu email (verifique a caixa de entrada)
3. Faça login

### Menu Lateral
- **Board**: Dashboard principal e cronograma
- **Plano**: Crie planos de estudo personalizados
- **Matérias**: Adicione matérias com cor e peso
- **Sessões de Estudo**: Registre sessões detalhadas e cronometre seus estudos
- **Revisões**: Em desenvolvimento

### Fluxo de Uso
1. **Adicione Matérias**: Vá em "Matérias" e crie suas matérias de estudo
2. **Crie Tópicos**: Organize o conteúdo em tópicos por matéria
3. **Crie Planos de Estudo**: Em "Plano", crie planos personalizados
4. **Registre Sessões**: Em "Sessões de Estudo", adicione detalhes completos
5. **Use o Cronômetro**: Utilize o cronômetro para estudos
6. **Acompanhe Progresso**: Veja checkmarks verdes quando completar 1 hora

## 🎨 Estrutura do Projeto

```
src/
├── components/
│   ├── Auth.jsx              # Autenticação
│   ├── Sidebar.jsx           # Menu lateral
│   ├── StudyTimer.jsx        # Cronômetro
│   ├── StudySchedule.jsx     # Cronograma semanal
│   └── SubjectManager.jsx    # Gerenciador de matérias (legado)
├── pages/
│   ├── Board.jsx             # Dashboard principal
│   ├── Plan.jsx              # Planos de estudo
│   ├── Subjects.jsx          # Matérias e tópicos
│   ├── Sessions.jsx          # Sessões de estudo
│   └── Reviews.jsx           # Revisões
├── lib/
│   └── supabase.js           # Cliente Supabase
├── App.jsx                   # Componente principal
└── main.jsx                  # Entry point
```

## 📦 Build para Produção

```bash
npm run build
```

Os arquivos estarão em `dist/`

## 🔒 Segurança

- Autenticação via Supabase Auth
- Row Level Security (RLS) em todas as tabelas
- Cada usuário só acessa seus próprios dados
- Senhas criptografadas automaticamente
