# Documentação Completa: Agenda Valery Studio

Este documento contém todas as especificações técnicas, funcionais e de infraestrutura necessárias para operar e manter o sistema.

## 1. Visão Geral
O **Agenda Valery Studio** é um sistema de gestão especializado para profissionais de estética. Ele resolve o problema de agendamento manual, controle financeiro e gestão de histórico de clientes em uma única interface.

---

## 2. Requisitos de Ambiente (.env)
Para o sistema funcionar, configure no painel da Vercel (Settings > Environment Variables) ou no seu arquivo local:

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
Execute o script abaixo no **SQL Editor** do seu painel Supabase para criar as tabelas necessárias:

```sql
-- 1. Tabela de Procedimentos
CREATE TABLE IF NOT EXISTS procedures (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  duration INTEGER NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  description TEXT,
  is_promo BOOLEAN DEFAULT FALSE,
  promo_price NUMERIC(10,2)
);

-- 2. Tabela de Clientes
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  notes TEXT,
  tags JSONB DEFAULT '[]'
);

-- 3. Tabela de Agendamentos
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  selected_procedures JSONB NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  total_duration INTEGER NOT NULL,
  status TEXT DEFAULT 'CONFIRMED', 
  sinal_pago BOOLEAN DEFAULT FALSE,
  notes TEXT
);

-- 4. Tabela de Lançamentos Financeiros
CREATE TABLE IF NOT EXISTS financial_entries (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, 
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. Guia de Deploy (Como subir para a Internet)

Se você estiver usando o terminal, siga estes passos:

### Passo 1: Enviar para o GitHub
```bash
git add .
git commit -m "feat: sistema de backup e melhorias de estabilidade"
git push origin main
```

### Passo 2: Publicar na Vercel
Se o seu projeto já está conectado, a Vercel fará o resto. Caso queira forçar um novo deploy:
```bash
vercel --prod
```

---

## 5. Backup e Sincronização (Upsert)
O sistema possui uma ferramenta de backup em **JSON**.
- **Backup**: Gera um arquivo único com todos os dados (Clientes, Procedimentos, Agendamentos e Financeiro).
- **Importação Inteligente**: Ao importar, o sistema verifica se o cliente ou procedimento já existe pelo **Nome**. Se existir, ele apenas atualiza os dados, evitando duplicatas.

---

## 6. Recursos Desativados
Para garantir a estabilidade contra erros de `TIMEOUT`, os seguintes recursos foram pausados:
- Sincronização automática com Google Agenda.
- Assistente de IA para sugestão de horários.

Estes podem ser reativados futuramente conforme a estabilidade do servidor aumentar.