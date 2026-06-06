<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ABCUNA - Sistema de Gestão Integrada

Este repositório contém o sistema de gestão administrativa e operacional da Associação de Bombeiros Civis de Uiraúna (ABCUNA).

## Como Executar Localmente

### Pré-requisitos
- Node.js (versão LTS recomendada)
- Instância do Supabase configurada

### Passo a Passo

1. **Instalar dependências na raiz (Frontend):**
   ```bash
   npm install
   ```

2. **Instalar dependências no servidor (Backend):**
   ```bash
   cd server
   npm install
   cd ..
   ```

3. **Configurar as Variáveis de Ambiente:**
   Copie o arquivo `.env.example` para `.env` tanto no diretório raiz quanto no diretório `server/` e preencha com as credenciais do Supabase.

4. **Executar em modo de desenvolvimento:**
   - **Frontend:** `npm run dev` (roda na porta 3000)
   - **Backend:** `npm run dev --prefix server` (roda na porta 3001)
