# Agenda Valery Studio

Sistema de gestão completo para estúdios de estética, focado em agendamento, controle de clientes e gestão financeira.

## 🚀 Tecnologias Utilizadas

- **Framework**: Next.js 15 (App Router)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS + Shadcn UI
- **Banco de Dados**: Supabase (PostgreSQL)
- **Gráficos**: Recharts
- **IA**: Genkit (Google Gemini)
- **Datas**: Date-fns

## 🛠️ Funcionalidades

### 📅 Agendamento Inteligente
- Calendário interativo para escolha de datas.
- Seleção múltipla de procedimentos por horário.
- Verificação automática de disponibilidade e conflitos.
- Registro de sinal pago (25%).

### 👥 Gestão de Clientes
- Cadastro automático durante o primeiro agendamento.
- Sistema de Tags para organização.
- Histórico de observações e contatos.

### 💰 Financeiro & Relatórios
- Integração automática de receitas de atendimentos.
- Lançamento manual de despesas e outras entradas.
- Exportação de relatórios financeiros e de agendamentos em CSV (Excel).
- Dashboard com métricas de conversão e faturamento.

### ⚙️ Procedimentos
- Gestão de catálogo com preços e durações.
- Ativação/Desativação de preços promocionais.

## 🔑 Configuração (Variáveis de Ambiente)

Para rodar o projeto, configure o arquivo `.env`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima

# Autenticação Administrativa
NEXT_PUBLIC_ADMIN_USERNAME=seu_usuario
NEXT_PUBLIC_ADMIN_PASSWORD=sua_senha

# Integrações (Opcional)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

## 🗄️ Estrutura do Banco de Dados

O sistema espera que o Supabase tenha as seguintes tabelas com permissões RLS configuradas:

1. `appointments`: `id, date, time, customerName, customerPhone, selectedProcedures (jsonb), totalPrice, totalDuration, status, sinalPago, notes`
2. `customers`: `id, name, phone, notes, tags (jsonb)`
3. `procedures`: `id, name, duration, price, description, isPromo, promoPrice`
4. `financial_entries`: `id, type (income/expense), description, amount, date, created_at`

## 📡 Resiliência e Performance

- **Conexão**: O sistema possui timeouts configurados (7s) para evitar que a interface trave em caso de instabilidade na rede.
- **Offline**: Cache local via React Context para navegação fluida entre telas.
- **Segurança**: Rotas protegidas via `ProtectedLayout` com verificação de sessão.

---
*Desenvolvido para oferecer a melhor experiência em gestão estética.*