# Implementação do Backend ABCUNA - Supabase

## 1. Status da Implementação
O backend do sistema ABCUNA foi totalmente arquitetado e implementado no Supabase (Project ID: `xihgmsmdcpufeennodlg`).

### ✅ Banco de Dados e Modelagem
Todas as tabelas foram criadas com relacionamentos e tipos estritos:
- **Core**: `profiles` (estendido do auth), `access_codes`.
- **Financeiro**: `financial_transactions`.
- **Operacional**: `inventory_items`, `events`, `schedules`.
- **Acadêmico**: `classroom_courses`, `classroom_materials`.
- **Administrativo**: `audit_logs`, `selection_process`.

### ✅ Segurança e Controle de Acesso (RLS)
Row Level Security (RLS) está ATIVO em todas as tabelas. As regras de acesso foram configuradas conforme os perfis:
- **ADMIN**: Acesso total.
- **FINANCIAL**: Acesso total ao módulo financeiro.
- **SECRETARY**: Acesso a perfis, estoque, eventos, escalas.
- **INSTRUCTOR**: Controle de seus cursos e materiais.
- **ASSOCIATE**: Leitura de informações pertinentes (eventos, materiais).
- **CANDIDATE**: Acesso restrito ao seu processo seletivo.

### ✅ Códigos de Acesso e Registro
Foi implementada uma **Trigger de Banco de Dados** (`handle_new_user`) que intercepta novos cadastros.
- **Validação Automática**: O cadastro só é efetuado se um código válido for fornecido.
- **Role Automática**: O perfil do usuário é definido pelo código (ex: código de Admin cria user Admin).
- **Limite de Uso**: Códigos têm limite de uso decrementado automaticamente.

Códigos Iniciais Criados:
- `ABCUNA-ADM-ROOT` (Admin)
- `ABCUNA-FIN-2025` (Financeiro)
- `ABCUNA-SEC-2025` (Secretaria)
- `ABCUNA-INS-2025` (Instrutor)
- `ABCUNA-ASS-2025` (Associado)
- `ABCUNA-CAND-2025` (Candidato)

### ✅ Storage
Buckets configurados:
- `institutional` (Arquivos públicos da instituição)
- `personal-docs` (Documentos pessoais - privado)
- `financial` (Comprovantes - restrito ao financeiro)
- `materials` (Materiais de aula - restrito a membros)

---

## 2. Ajustes Necessários no Frontend

Para conectar o frontend atual ao novo backend, realize os seguintes passos:

### Passo 1: Instalação
Instale a SDK do Supabase:
```bash
npm install @supabase/supabase-js
```

### Passo 2: Configuração de Variáveis de Ambiente
Crie ou edite o arquivo `.env.local` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://xihgmsmdcpufeennodlg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpaGdtc21kY3B1ZmVlbm5vZGxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNzI5OTAsImV4cCI6MjA4MTY0ODk5MH0.BpDOOANvcTZG_gboCQKerVzWsbUiq_DACBzdBE3vJm8
```

### Passo 3: Inicialização do Cliente
Crie um arquivo `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### Passo 4: Atualização Crítica no Auth.tsx
O arquivo `pages/Auth.tsx` precisa ser corrigido para enviar o código de acesso corretamente.

**Problemas identificados no atual:**
1. O campo de "Criar Senha" não está vinculado ao estado (`formData`).
2. O `mockLogin` não realiza cadastro real.

**Como corrigir a função `handleSubmit` (Exemplo):**

```typescript
import { supabase } from '../lib/supabase';

// ... dentro do componente
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError('');

  try {
    if (isRegister) {
        // OBRIGATÓRIO: Enviar access_code dentro de options.data para a trigger funcionar
        const { data, error } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password, // Certifique-se de capturar este campo no form
            options: {
                data: {
                    full_name: formData.name,
                    phone: formData.phone,
                    access_code: formData.accessCode // Este campo é validado pelo backend
                }
            }
        });
        
        if (error) throw error;
        if (data.user) {
            alert("Cadastro realizado! Verifique seu email ou faça login.");
            setIsRegister(false);
        }
    } else {
        // Login normal
        const { data, error } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password
        });
        
        if (error) throw error;
        // Obter perfil completo
        if (data.user) {
             const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();
             
             onLogin(profile); // Atualizar estado global
        }
    }
  } catch (err: any) {
    setError(err.message || 'Erro na operação');
  } finally {
    setIsLoading(false);
  }
};
```

Certifique-se também corrigir o input de senha no modo registro para capturar o valor:
```tsx
<Input 
  label="Criar Senha" 
  type="password" 
  name="password" // Adicionado
  value={formData.password}
  onChange={handleInputChange} // Adicionado
  placeholder="Crie uma senha segura"
  required 
/>
```
