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
  status TEXT DEFAULT 'CONFIRMED', 
  sinal_pago BOOLEAN DEFAULT FALSE,
  notes TEXT
);

-- 4. Tabela de Lançamentos Financeiros
CREATE TABLE financial_entries (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL, 
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. Guia de Deploy (Comandos para rodar)

Copie e cole os comandos abaixo no seu terminal para subir a nova versão:

### Passo 1: Enviar para o GitHub
```bash
git init
git add .
git commit -m "feat: backup inteligente e correções de estabilidade"
git branch -M main
# Se ainda não conectou o repositório remoto:
# git remote add origin https://github.com/seu-usuario/seu-repositorio.git
git push -u origin main
```

### Passo 2: Publicar na Vercel
Se você já tem o projeto conectado na Vercel, o deploy será automático após o push acima. Caso queira fazer via terminal:
```bash
npm install -g vercel
vercel --prod
```

---

## 5. Backup e Sincronização
O sistema possui uma ferramenta de backup em **JSON**.
- **Backup**: Gera um arquivo único com todos os dados.
- **Importação (Upsert)**: Se você importar um backup, o sistema não criará duplicatas de clientes ou procedimentos com o mesmo nome; ele apenas atualizará os dados existentes.

---

## 6. Resolução de Problemas
- **Timeout**: O sistema agora tem um limite de 7s para conexões com o banco, evitando que o navegador trave.
- **IA/Agenda**: Desativados temporariamente para maximizar a estabilidade do servidor em conexões lentas.
