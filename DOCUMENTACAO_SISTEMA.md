
# Documentação Completa: Agenda Valery Studio

Este documento contém todas as especificações técnicas, funcionais e de infraestrutura necessárias para operar e manter o sistema.

## 1. Visão Geral
O **Agenda Valery Studio** é um sistema de gestão especializado para profissionais de estética. Ele resolve o problema de agendamento manual, controle financeiro e gestão de histórico de clientes em uma única interface.

---

## 2. Requisitos de Ambiente (.env)
Para o sistema funcionar, crie um arquivo `.env` na raiz ou configure no painel da Vercel:

```env
# Supabase (Banco de Dados)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui

# Autenticação Administrativa
NEXT_PUBLIC_ADMIN_USERNAME=admin
NEXT_PUBLIC_ADMIN_PASSWORD=senha_segura_aqui

# Configurações do App
NEXT_PUBLIC_BASE_URL=https://seu-app.vercel.app
```

---

## 3. Configuração do Banco de Dados (SQL)
Execute o script abaixo no **SQL Editor** do seu painel Supabase:

```sql
-- 1. Tabela de Procedimentos
CREATE TABLE procedures (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  duration INTEGER NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  description TEXT,
  is_promo BOOLEAN DEFAULT FALSE,
  promo_price NUMERIC(10,2)
);

-- 2. Tabela de Clientes
CREATE TABLE customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  notes TEXT,
  tags JSONB DEFAULT '[]'
);

-- 3. Tabela de Agendamentos
CREATE TABLE appointments (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  selected_procedures JSONB NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  total_duration INTEGER NOT NULL,
  status TEXT DEFAULT 'CONFIRMED', -- CONFIRMED, ATTENDED, CANCELLED
  sinal_pago BOOLEAN DEFAULT FALSE,
  notes TEXT
);

-- 4. Tabela de Lançamentos Financeiros (Manual)
CREATE TABLE financial_entries (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, -- income, expense
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. Guia de Deploy e Versionamento

### Enviar para o GitHub
1. Abra o terminal na raiz do projeto.
2. Inicie o git (se não tiver feito): `git init`
3. Adicione os arquivos: `git add .`
4. Comite: `git commit -m "feat: sistema completo com backup e upsert"`
5. Conecte ao seu repositório remoto e faça o push.

### Publicar na Vercel
1. Conecte seu repositório do GitHub à Vercel.
2. **Importante**: Adicione as variáveis de ambiente listadas no item 2 deste documento no painel da Vercel (Settings > Environment Variables).
3. O deploy será realizado automaticamente.

---

## 5. Resolução de Problemas (Troubleshooting)

### Erro: ERR_CONNECTION_TIMED_OUT
- **Causa**: Falha na conexão com o Supabase ou bloqueio de rede local.
- **Solução**: Verifique se as chaves no `.env` estão corretas. O sistema possui timeout de 7s para evitar travamentos.

### Backup e Importação (Upsert)
- O sistema agora protege contra duplicatas. Ao importar, se um cliente ou procedimento com o mesmo nome for detectado, o sistema apenas atualizará os dados existentes em vez de criar um novo.

---

## 6. Stack Tecnológica
- **Framework**: Next.js 15 (App Router)
- **Estilização**: Tailwind CSS + Shadcn UI
- **Banco**: PostgreSQL (via Supabase)
- **Segurança**: ProtectedLayout com AuthContext.
