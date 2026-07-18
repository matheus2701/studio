# Documentação Completa: Agenda Valery Studio

Este documento contém todas as especificações técnicas, funcionais e de infraestrutura necessárias para operar e manter o sistema.

## 1. Visão Geral
O **Agenda Valery Studio** é um sistema de gestão especializado para profissionais de estética. Ele resolve o problema de agendamento manual, controle financeiro e gestão de histórico de clientes em uma única interface.

---

## 2. Requisitos de Ambiente (.env)
Para o sistema funcionar, crie um arquivo `.env` na raiz com as seguintes chaves (substitua pelos seus valores reais):

```env
# Supabase (Banco de Dados)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui

# Autenticação Administrativa
NEXT_PUBLIC_ADMIN_USERNAME=admin
NEXT_PUBLIC_ADMIN_PASSWORD=senha_segura_aqui

# Configurações do App
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## 3. Configuração do Banco de Dados (SQL)
Execute o script abaixo no **SQL Editor** do seu painel Supabase para criar a estrutura correta:

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

## 4. Estrutura de Funcionalidades

### 📅 Agendamento
- **Fluxo**: Seleção de Data -> Seleção de Múltiplos Procedimentos -> Seleção de Horário Livre -> Preenchimento de Dados do Cliente.
- **Resiliência**: O sistema verifica conflitos de horário em tempo real antes de mostrar as opções disponíveis.

### 👥 Clientes
- **Criação Automática**: Se você agendar um nome que não está na lista, o sistema cria o cadastro automaticamente.
- **Tags**: Organize clientes por preferências (ex: "VIP", "Prefere Henna").

### 💰 Financeiro
- **Consolidação**: O sistema soma automaticamente os atendimentos "Realizados" com as entradas manuais e subtrai as despesas.
- **Exportação**: Botões para baixar relatórios CSV prontos para abrir no Excel.

---

## 5. Resolução de Problemas (Troubleshooting)

### Erro: ERR_CONNECTION_TIMED_OUT
- **Causa**: Geralmente falha na conexão com o Supabase ou latência de DNS.
- **Solução**: Verifique se a URL do Supabase no seu `.env` está correta e se a sua internet não está bloqueando o domínio `supabase.co`.

### Login Não Funciona
- **Causa**: Variáveis `NEXT_PUBLIC_ADMIN_USERNAME` ou `PASSWORD` ausentes no `.env`.
- **Solução**: Verifique o arquivo `.env` e certifique-se de que ele foi lido pelo servidor (reinicie o processo `npm run dev`).

---

## 6. Stack Tecnológica
- **Framework**: Next.js 15 (App Router)
- **Estilização**: Tailwind CSS + Shadcn UI
- **Banco**: PostgreSQL (via Supabase)
- **IA**: Google Gemini (via Genkit - Desativado para manutenção)
- **Gráficos**: Recharts
```