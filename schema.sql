-- Script para criar as tabelas no Supabase

-- Tabela: procedures
CREATE TABLE IF NOT EXISTS public.procedures (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    duration INTEGER NOT NULL,
    price NUMERIC NOT NULL,
    description TEXT NOT NULL,
    "isPromo" BOOLEAN DEFAULT false NOT NULL,
    "promoPrice" NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Comentários para a tabela procedures (opcional, mas bom para documentação)
COMMENT ON TABLE public.procedures IS 'Armazena os procedimentos oferecidos pelo estúdio.';
COMMENT ON COLUMN public.procedures.id IS 'Identificador único do procedimento (gerado pela aplicação).';
COMMENT ON COLUMN public.procedures.name IS 'Nome do procedimento.';
COMMENT ON COLUMN public.procedures.duration IS 'Duração do procedimento em minutos.';
COMMENT ON COLUMN public.procedures.price IS 'Preço normal do procedimento.';
COMMENT ON COLUMN public.procedures.description IS 'Descrição detalhada do procedimento.';
COMMENT ON COLUMN public.procedures."isPromo" IS 'Indica se o procedimento está em promoção.';
COMMENT ON COLUMN public.procedures."promoPrice" IS 'Preço promocional, se aplicável.';
COMMENT ON COLUMN public.procedures.created_at IS 'Data e hora de criação do registro.';


-- Tabela: customers
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    notes TEXT,
    tags JSONB,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Comentários para a tabela customers
COMMENT ON TABLE public.customers IS 'Armazena informações dos clientes.';
COMMENT ON COLUMN public.customers.id IS 'Identificador único do cliente (gerado pela aplicação).';
COMMENT ON COLUMN public.customers.name IS 'Nome completo do cliente.';
COMMENT ON COLUMN public.customers.phone IS 'Número de telefone/Whatsapp do cliente.';
COMMENT ON COLUMN public.customers.notes IS 'Observações sobre o cliente (alergias, preferências, etc.).';
COMMENT ON COLUMN public.customers.tags IS 'Tags associadas ao cliente (ex: cliente novo, VIP), armazenadas como um array de objetos JSON.';
COMMENT ON COLUMN public.customers.created_at IS 'Data e hora de criação do registro.';


-- Tabela: appointments
CREATE TABLE IF NOT EXISTS public.appointments (
    id TEXT PRIMARY KEY,
    "selectedProcedures" JSONB NOT NULL,
    "totalPrice" NUMERIC NOT NULL,
    "totalDuration" INTEGER NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL,
    "sinalPago" BOOLEAN DEFAULT false NOT NULL,
    -- "paymentMethod" TEXT, -- Coluna removida
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Comentários para a tabela appointments
COMMENT ON TABLE public.appointments IS 'Armazena os agendamentos realizados.';
COMMENT ON COLUMN public.appointments.id IS 'Identificador único do agendamento (gerado pela aplicação).';
COMMENT ON COLUMN public.appointments."selectedProcedures" IS 'Array JSON dos objetos de procedimento selecionados para este agendamento.';
COMMENT ON COLUMN public.appointments."totalPrice" IS 'Preço total do agendamento.';
COMMENT ON COLUMN public.appointments."totalDuration" IS 'Duração total do agendamento em minutos.';
COMMENT ON COLUMN public.appointments."customerName" IS 'Nome do cliente para o agendamento.';
COMMENT ON COLUMN public.appointments."customerPhone" IS 'Telefone do cliente para o agendamento.';
COMMENT ON COLUMN public.appointments.date IS 'Data do agendamento (YYYY-MM-DD).';
COMMENT ON COLUMN public.appointments.time IS 'Hora do agendamento (HH:MM).';
COMMENT ON COLUMN public.appointments.notes IS 'Observações sobre o agendamento.';
COMMENT ON COLUMN public.appointments.status IS 'Status do agendamento (CONFIRMED, ATTENDED, CANCELLED).';
COMMENT ON COLUMN public.appointments."sinalPago" IS 'Indica se o sinal foi pago.';
COMMENT ON COLUMN public.appointments.created_at IS 'Data e hora de criação do registro.';

-- Habilitar Row Level Security (RLS) - Recomenda-se configurar políticas após a criação
-- Por padrão, o Supabase pode criar tabelas com RLS já habilitado.
-- Se você quiser desabilitar RLS temporariamente para facilitar o desenvolvimento inicial (permitindo que a chave anon acesse os dados):
-- ALTER TABLE public.procedures DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;
-- Lembre-se de configurar políticas de RLS adequadas antes de ir para produção se desabilitá-las.
-- Se RLS estiver habilitado e você não tiver políticas, as queries da sua aplicação Next.js usando a chave anon falharão.

-- Se você já tinha a coluna "paymentMethod" e quer removê-la (CUIDADO: isso apaga os dados da coluna):
-- ALTER TABLE public.appointments
-- DROP COLUMN IF EXISTS "paymentMethod";
