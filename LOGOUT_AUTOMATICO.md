# Sistema de Logout Automático - 12 Horas

## Resumo
Implementado um sistema de logout automático que expira a sessão do usuário após 12 horas de inatividade, garantindo que usuários vejam a landing page em vez de serem redirecionados diretamente ao dashboard.

## Mudanças Implementadas

### 1. **Armazenamento de Timestamp de Login**
- Quando um usuário faz login, o timestamp atual é armazenado no `localStorage` com a chave `lastLoginTime`
- Implementado na função `handleLogin()` em `App.tsx`

### 2. **Verificação de Expiração de Sessão**
- No carregamento da aplicação, o sistema verifica:
  - Se existe um timestamp de login armazenado
  - Se passaram mais de 12 horas desde o último login
  - Se a sessão está válida no Supabase

### 3. **Lógica de Logout Automático**
O sistema faz logout automático em dois cenários:

#### Cenário 1: Sessão Expirada (12+ horas)
```typescript
if (timeSinceLogin > TWELVE_HOURS_MS) {
  console.log('Sessão expirada após 12 horas. Fazendo logout...');
  await supabase.auth.signOut();
  localStorage.removeItem('lastLoginTime');
  return;
}
```

#### Cenário 2: Sessão Sem Timestamp (sessão antiga)
```typescript
if (!lastLoginTime) {
  console.log('Sessão sem timestamp. Fazendo logout para exibir landing page...');
  await supabase.auth.signOut();
  return;
}
```

### 4. **Limpeza de Dados**
- O timestamp é removido do `localStorage` em três situações:
  1. Logout manual do usuário
  2. Logout automático por expiração
  3. Quando o Supabase detecta mudança de estado de autenticação (sem sessão)

## Fluxo de Funcionamento

### Primeiro Acesso (Novo Login)
1. Usuário acessa a aplicação → vê a **Landing Page**
2. Clica em "Entrar" → vai para página de autenticação
3. Faz login com sucesso → timestamp é armazenado
4. É redirecionado ao **Dashboard**

### Acesso Subsequente (Dentro de 12h)
1. Usuário acessa a aplicação
2. Sistema verifica timestamp → **válido** (< 12h)
3. Sessão do Supabase é restaurada
4. Usuário vai direto ao **Dashboard**

### Acesso Após 12 Horas
1. Usuário acessa a aplicação
2. Sistema verifica timestamp → **expirado** (> 12h)
3. Logout automático é executado
4. Usuário vê a **Landing Page**
5. Precisa fazer login novamente

### Acesso com Sessão Antiga (sem timestamp)
1. Usuário que estava logado antes da implementação acessa
2. Sistema detecta sessão do Supabase mas **sem timestamp**
3. Logout automático é executado
4. Usuário vê a **Landing Page**

## Constantes Configuráveis

```typescript
const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000; // 12 horas em milissegundos
```

Para alterar o tempo de expiração, basta modificar esta constante:
- **6 horas**: `6 * 60 * 60 * 1000`
- **24 horas**: `24 * 60 * 60 * 1000`
- **1 hora**: `1 * 60 * 60 * 1000`

## Arquivos Modificados

1. **`App.tsx`**
   - Função `checkSession()` - Verificação de expiração
   - Função `handleLogin()` - Armazenamento de timestamp
   - Função `handleLogout()` - Limpeza de timestamp
   - Hook `onAuthStateChange` - Limpeza em mudança de estado

## Benefícios

✅ **Segurança**: Sessões não ficam abertas indefinidamente  
✅ **UX Melhorada**: Usuários veem a landing page institucional  
✅ **Controle**: Tempo de expiração facilmente configurável  
✅ **Compatibilidade**: Funciona com sessões existentes do Supabase  
✅ **Limpeza Automática**: Remove dados obsoletos do localStorage  

## Testes Recomendados

1. **Teste de Login Normal**
   - Fazer login → verificar se vai ao dashboard
   - Recarregar página → verificar se continua logado

2. **Teste de Expiração**
   - Fazer login
   - Modificar manualmente o timestamp no localStorage para 13 horas atrás
   - Recarregar página → deve mostrar landing page

3. **Teste de Logout Manual**
   - Fazer login
   - Fazer logout
   - Verificar se `lastLoginTime` foi removido do localStorage

4. **Teste de Sessão Antiga**
   - Remover `lastLoginTime` do localStorage (mantendo sessão do Supabase)
   - Recarregar página → deve mostrar landing page

## Notas Técnicas

- O timestamp é armazenado em **milissegundos** desde epoch (1970-01-01)
- A verificação ocorre apenas no **carregamento inicial** da aplicação
- O sistema **não** monitora atividade do usuário (não é um timeout de inatividade)
- É um timeout de **sessão total**, independente de atividade
