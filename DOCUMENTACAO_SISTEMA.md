
# Documentação do Sistema - Agenda Valery Studio

## 1. Visão Geral
Sistema de agendamento para estúdios de beleza com controle financeiro, gestão de clientes e dashboard de produtividade.

## 2. Tecnologias
- Next.js (App Router)
- Supabase (Banco de dados)
- Genkit (IA para sugestões)
- Tailwind CSS / ShadCN (UI)

## 3. Configuração de Ambiente
As credenciais devem ser configuradas exclusivamente no arquivo `.env` (não versionado):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_ADMIN_USERNAME`
- `NEXT_PUBLIC_ADMIN_PASSWORD`

## 4. Guia de Sincronização (Resolução de Erros de Segurança)
Se o GitHub bloquear o seu envio (Erro GH013), siga estes passos no terminal:

1. **Atualize a URL com seu NOVO Token**:
   ```bash
   git remote set-url origin https://<SEU_NOVO_TOKEN_AQUI>@github.com/matheus2701/studio.git
   ```

2. **Limpe o commit bloqueado e envie**:
   ```bash
   git add .
   git commit --amend --no-edit
   git push origin master
   ```

## 5. Estrutura de Arquivos
- `/src/app`: Rotas e páginas (Agendamentos, Financeiro, Dashboard, etc.)
- `/src/components`: Componentes de interface e formulários.
- `/src/contexts`: Gerenciamento de estado (Auth, Appointments, Customers).
- `/src/ai`: Fluxos de Inteligência Artificial.

## 6. Funcionalidades Principais
- **Agenda**: Visualização em calendário e agendamento rápido.
- **Menu de Agendamentos**: Lista organizada por período, otimizada para performance e celulares.
- **Financeiro**: Controle de entradas/saídas e saldo mensal.
- **Backup & Importação**: Ferramentas para segurança de dados.
