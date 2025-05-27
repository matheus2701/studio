
-- Tabela para armazenar os procedimentos oferecidos
CREATE TABLE IF NOT EXISTS procedures (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    duration INT4 NOT NULL, -- Duração em minutos
    price FLOAT8 NOT NULL,
    description TEXT NOT NULL,
    "isPromo" BOOLEAN NOT NULL DEFAULT FALSE,
    "promoPrice" FLOAT8,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN procedures.duration IS 'Duração em minutos';
COMMENT ON COLUMN procedures."isPromo" IS 'Indica se o procedimento está em promoção';
COMMENT ON COLUMN procedures."promoPrice" IS 'Preço promocional, se aplicável';

-- Tabela para armazenar informações dos clientes
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    notes TEXT,
    tags JSONB, -- Armazena um array de objetos Tag: [{"id": "tag1", "name": "Cliente Novo"}]
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN customers.tags IS 'Armazena um array de objetos Tag: [{"id": "tag1", "name": "Cliente Novo"}]';

-- Tabela para armazenar os agendamentos
CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY NOT NULL,
    "selectedProcedures" JSONB NOT NULL, -- Armazena um array dos objetos de procedimento selecionados
    "totalPrice" FLOAT8 NOT NULL,
    "totalDuration" INT4 NOT NULL, -- Duração total em minutos
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    date DATE NOT NULL, -- Formato YYYY-MM-DD
    time TEXT NOT NULL, -- Formato HH:MM
    notes TEXT,
    status TEXT NOT NULL, -- Ex: 'CONFIRMED', 'ATTENDED', 'CANCELLED'
    "sinalPago" BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN appointments."selectedProcedures" IS 'Armazena um array dos objetos de procedimento selecionados';
COMMENT ON COLUMN appointments."totalDuration" IS 'Duração total em minutos';
COMMENT ON COLUMN appointments.date IS 'Formato YYYY-MM-DD';
COMMENT ON COLUMN appointments.time IS 'Formato HH:MM';
COMMENT ON COLUMN appointments.status IS 'Ex: ''CONFIRMED'', ''ATTENDED'', ''CANCELLED''';

-- Adiciona algumas políticas básicas de Row Level Security (RLS) - DESABILITADAS POR PADRÃO
-- Para habilitar RLS nas tabelas (recomendado para produção):
-- 1. Vá para "Authentication" > "Policies" no Supabase.
-- 2. Selecione a tabela e clique em "Enable RLS".
-- 3. Crie políticas para permitir SELECT, INSERT, UPDATE, DELETE conforme necessário.
-- Exemplo de política para permitir que usuários autenticados leiam todos os procedimentos:
-- CREATE POLICY "Allow authenticated read access to procedures"
-- ON procedures FOR SELECT
-- TO authenticated
-- USING (true);

-- Exemplo de política para permitir que usuários autenticados insiram procedimentos:
-- CREATE POLICY "Allow authenticated insert access to procedures"
-- ON procedures FOR INSERT
-- TO authenticated
-- WITH CHECK (true);

-- Você precisará de políticas similares para 'customers' e 'appointments'.
-- Por enquanto, para simplificar, o RLS não está sendo ativado por este script.
-- Certifique-se de que o RLS está desabilitado nas configurações da tabela no Supabase UI
-- ou crie as políticas apropriadas se o RLS estiver habilitado.

-- Nota: Os nomes de colunas com letras maiúsculas (como "isPromo", "selectedProcedures")
-- são colocados entre aspas duplas para preservar a capitalização no PostgreSQL.
-- Se preferir tudo minúsculo, ajuste no script e no seu código Next.js (definições de tipo).
