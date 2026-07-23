# Documentação do Sistema - Agenda Valery Studio

## 1. Visão Geral
Sistema de agendamento para estúdios de beleza com controle financeiro, gestão de clientes e dashboard de produtividade.

## 2. Tecnologias
- Next.js (App Router)
- Supabase (Banco de dados)
- Genkit (IA para sugestões)
- Tailwind CSS / ShadCN (UI)

## 3. Configuração de Ambiente
Certifique-se de configurar as seguintes variáveis no arquivo `.env`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_ADMIN_USERNAME`
- `NEXT_PUBLIC_ADMIN_PASSWORD`

## 4. Como Sincronizar com GitHub (Segurança)

O GitHub bloqueia o envio de códigos que contenham senhas ou tokens dentro dos arquivos. Nunca escreva seu token aqui.

### Passo 1: Atualizar a URL do Repositório
No terminal, execute o comando abaixo substituindo pelo seu NOVO token gerado no GitHub:
```bash
git remote set-url origin https://<SEU_NOVO_TOKEN>@github.com/matheus2701/studio.git
```

### Passo 2: Limpar o Histórico Bloqueado
Se o GitHub bloqueou seu "push", você precisa rodar estes comandos para "reescrever" o commit e remover o rastro do token antigo:
```bash
git add .
git commit --amend --no-edit
git push origin master
```

## 5. Estrutura de Arquivos
- `/src/app`: Rotas e páginas
- `/src/components`: Componentes de interface
- `/src/contexts`: Gerenciamento de estado (Clientes, Agendamentos, Financeiro)
- `/src/ai`: Fluxos de Inteligência Artificial
