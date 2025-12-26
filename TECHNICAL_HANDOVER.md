# Documentação Técnica de Repasse (Handover) - ABCUNA System

**Data:** 18/12/2025  
**Projeto:** ABCUNA - Sistema de Gestão Integrada  
**Versão:** 1.0.0 (Estável)

---

## 1. Visão Geral da Arquitetura

O sistema é uma aplicação web **Single Page Application (SPA)** focada em gestão administrativa, financeira e operacional.

### Stack Tecnológica
- **Frontend:** React 18, TypeScript, Vite 5.
- **Estilização:** TailwindCSS 3 + Lucide Icons.
- **Roteamento:** React Router DOM v6.
- **Backend (BaaS):** Supabase (PostgreSQL).
- **Infraestrutura:** Vercel (Recomendado para deploy frontend) + Supabase Cloud.

---

## 2. Backend (Supabase)

O coração do sistema reside no projeto Supabase (`xihgmsmdcpufeennodlg`). A lógica de negócio crítica, segurança e validação de dados estão implementadas diretamente no banco de dados.

### 2.1 Banco de Dados (PostgreSQL)
O schema `public` contém as tabelas principais. O sistema utiliza tipos estritos (Enums) para garantir integridade.

| Tabela | Função | Segurança (RLS) |
| :--- | :--- | :--- |
| `access_codes` | Códigos de convite p/ cadastro de usuários. | **Crítico:** Apenas Admin visualiza. |
| `profiles` | Extensão da tabela `auth.users`. Dados pessoais. | Usuário edita o seu; Admin/Sec edita todos. |
| `financial_transactions` | Receitas e Despesas. | Restrito a Admin e Financeiro. |
| `inventory_items` | Controle de patrimônio. | Leitura pública interna; Escrita Admin/Sec. |
| `events` | Agenda e calendário. | Gestão por Admin/Sec/Instrutor. |
| `schedules` | Escalas de plantão. | Gestão por Admin/Sec. |
| `audit_logs` | Logs de segurança. | Apenas leitura para auditoria. |

### 2.2 Autenticação e Triggers (Ponto Crítico)
A autenticação não é padrão. Ela depende de um **Código de Acesso** (`access_code`).

*   **Trigger `handle_new_user`**: Quando um usuário se cadastra no Auth do Supabase, essa função PL/pgSQL é disparada.
    1.  Verifica se o `access_code` enviado nos metadados é válido.
    2.  Verifica se o código ainda tem usos disponíveis.
    3.  Define a `role` (perfil) do usuário automaticamente baseada no código (Ex: Código de Admin cria user Admin).
    4.  Bloqueia o cadastro se o código for inválido.

**Manutenção:** Se precisar alterar a lógica de cadastro, edite esta função no banco de dados, nunca no frontend.

### 2.3 Row Level Security (RLS)
Nada é público. Todas as tabelas têm RLS ativado.
*   A função auxiliar `get_my_role()` é usada extensivamente nas policies para verificar o nível de acesso do usuário atual.

---

## 3. Frontend (React + Vite)

A aplicação foi estabilizada na versão **React 18** para garantir compatibilidade com o ecossistema atual de bibliotecas.

### 3.1 Estrutura de Pastas
```
/src
  /components  -> Componentes visuais reutilizáveis (UI Kit, Layout).
  /lib         -> Configurações de infra (supabase.ts).
  /pages       -> Telas da aplicação (Associates.tsx, Dashboard.tsx).
  /services    -> Camada de serviço (antigamente mocks, migrando para chamadas reais).
  /types       -> Definições TypeScript globais (interfaces do banco).
```

### 3.2 Conexão com Backend
*   Centralizada em `src/lib/supabase.ts`.
*   Possui tratamento de erro robusto: se as chaves de API falharem, o app não trava (white screen), mas avisa no console.
*   **Atenção:** Mantenha sempre o arquivo `.env` atualizado com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

### 3.3 Status da Integração (Mocks vs Real)
O sistema está em fase de transição de dados "Mockados" (falsos, para teste de UI) para dados Reais.

*   ✅ **Autenticação:** 100% Real.
*   ✅ **Associados (`AssociatesPage`):** 100% Real (Conectado ao Supabase).
*   ⚠️ **Outros Módulos (Financeiro, Estoque, etc):** A estrutura de banco existe, mas as telas ainda podem estar exibindo dados estáticos de `constants.ts`.
    *   **Tarefa para o Programador:** Replicar a lógica de `fetch` criada em `Associates.tsx` para as demais páginas (`Financial.tsx`, `Inventory.tsx`, etc).

---

## 4. Guia de Instalação e Desenvolvimento

### Pré-requisitos
*   Node.js 18+
*   NPM

### Comandos
```bash
# Instalação Limpa (caso haja problemas de dependência)
rm -rf node_modules package-lock.json
npm install

# Rodar em Desenvolvimento (Porta 3000)
npm run dev

# Build para Produção
npm run build
```

### Variáveis de Ambiente (.env)
```env
VITE_SUPABASE_URL=https://xihgmsmdcpufeennodlg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 5. Recomendações de Segurança e Evolução

1.  **Não suba React 19 ainda:** Algumas bibliotecas de gráficos (`recharts`) e roteamento ainda estão instáveis na versão beta do React 19. Mantenha no 18.
2.  **Validação de Formulários:** Implementar `Zod` ou `React Hook Form` para validações mais robustas nos formulários de cadastro.
3.  **Storage:** As pastas (buckets) já estão criadas. Falta implementar o componente de Upload no frontend para salvar fotos de perfil e documentos.
4.  **Códigos de Acesso:** Monitore a tabela `access_codes`. Se os códigos "root" esgotarem o limite de uso, crie novos via SQL ou Dashboard do Supabase.

---

**Contato de Suporte:** equipe-dev-antigravity@deepmind.google
