# Sistema de Logout Inteligente - ABCUNA

## 🎯 Objetivo

Implementar um sistema de logout automático inteligente que:
1. **Previne logout durante uso ativo** - Não interrompe o usuário enquanto ele está trabalhando
2. **Detecta inatividade real** - Só mostra alerta após período sem interação
3. **Dá tempo para responder** - Modal de confirmação com 60 segundos
4. **Persiste logout manual** - Após logout, não volta automaticamente ao dashboard

## 🔧 Como Funciona

### 1. Detecção de Atividade

O sistema monitora continuamente as seguintes ações do usuário:
- Cliques do mouse (`click`, `mousedown`)
- Movimento do mouse (`mousemove`)
- Teclas pressionadas (`keypress`, `keydown`)
- Rolagem da página (`scroll`)
- Toques na tela (`touchstart`)

**Importante**: Qualquer uma dessas ações **reseta o timer de inatividade**.

### 2. Lógica de Inatividade

```
┌─────────────────────────────────────────────────────────────┐
│  USUÁRIO ATIVO (usando o sistema)                           │
│  ↓ Clicando, digitando, navegando...                        │
│  ✅ Timer é resetado continuamente                          │
│  ✅ NENHUM alerta é mostrado                                │
└─────────────────────────────────────────────────────────────┘
                         ↓
                  (30 minutos SEM atividade)
                         ↓
┌─────────────────────────────────────────────────────────────┐
│  USUÁRIO INATIVO                                             │
│  ⚠️  Modal aparece: "Você ainda está aí?"                   │
│  ⏱️  Timer de 60 segundos inicia                            │
└─────────────────────────────────────────────────────────────┘
                         ↓
              ┌──────────┴──────────┐
              ↓                     ↓
    ┌─────────────────┐   ┌─────────────────┐
    │ Usuário clica   │   │ 60s passam sem  │
    │ "Estou aqui!"   │   │ resposta        │
    └─────────────────┘   └─────────────────┘
              ↓                     ↓
    ┌─────────────────┐   ┌─────────────────┐
    │ ✅ Modal fecha  │   │ 🚪 Logout       │
    │ Timer reseta    │   │ automático      │
    │ Continua usando │   │                 │
    └─────────────────┘   └─────────────────┘
```

### 3. Tempos Configurados

| Evento | Tempo | Descrição |
|--------|-------|-----------|
| **Inatividade para Modal** | 30 minutos | Tempo SEM atividade para mostrar o modal de confirmação |
| **Timeout do Modal** | 60 segundos | Tempo que o usuário tem para confirmar presença |
| **Sessão Antiga** | 12 horas | Sessões mais antigas que isso são consideradas expiradas no carregamento |

### 4. Logout Manual Persistente

**Problema Anterior**: 
- Usuário fazia logout
- Atualizava a página (F5)
- Sistema detectava sessão do Supabase ainda ativa
- Voltava automaticamente para o dashboard ❌

**Solução Implementada**:
```typescript
// Ao fazer logout manual
localStorage.setItem('manualLogout', 'true');

// Ao verificar sessão no carregamento
if (wasManualLogout === 'true') {
  // Não restaura sessão, mesmo que Supabase tenha sessão ativa
  await supabase.auth.signOut();
  // Mostra landing page
}

// Ao fazer novo login
localStorage.removeItem('manualLogout');
// Agora pode usar o sistema normalmente
```

## 📁 Arquivos Modificados

### 1. `App.tsx`
**Mudanças**:
- ✅ Adicionado verificação de `manualLogout` no `checkSession`
- ✅ Flag `manualLogout` setada no `handleLogout`
- ✅ Flag `manualLogout` removida no `handleLogin`
- ✅ Timeout de inatividade alterado de 12h para 30min
- ✅ Modal de inatividade adicionado ao render

**Constantes**:
```typescript
const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000; // Verificação de sessão antiga
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 min de inatividade
```

### 2. `hooks/useUserActivity.ts`
**Mudanças**:
- ✅ Lógica completamente reescrita para detecção inteligente
- ✅ Removido `checkIntervalRef` (verificação periódica desnecessária)
- ✅ Adicionado `hasTriggeredInactiveRef` para evitar múltiplos disparos
- ✅ Timer é resetado a cada atividade do usuário
- ✅ Verifica inatividade desde último acesso ao carregar página

**Comportamento**:
- Cada atividade do usuário reseta o timer
- Só dispara `onInactive` uma vez após o timeout
- Ao confirmar presença, flag é resetada e timer reinicia

### 3. `components/InactivityModal.tsx`
**Mudanças**:
- ✅ Texto atualizado para não mencionar "12 horas"
- ✅ Mantém timer visual de 60 segundos
- ✅ Dois botões: "Sim, estou aqui!" e "Fazer Logout"

## 🧪 Como Testar

### Teste 1: Logout Manual Persistente

1. Faça login no sistema
2. Clique em "Sair"
3. **Atualize a página (F5)**
4. ✅ **Esperado**: Deve mostrar a Landing Page, NÃO o dashboard

### Teste 2: Usuário Ativo (Usando o Sistema)

1. Faça login no sistema
2. Use o sistema normalmente (clique, navegue, digite)
3. Continue usando por 1 hora
4. ✅ **Esperado**: NENHUM modal deve aparecer enquanto estiver ativo

### Teste 3: Usuário Inativo

1. Faça login no sistema
2. Deixe o navegador aberto SEM interagir
3. Aguarde 30 minutos
4. ✅ **Esperado**: Modal "Você ainda está aí?" deve aparecer
5. ✅ **Esperado**: Timer de 60 segundos deve iniciar

### Teste 4: Confirmação de Presença

1. Siga passos do Teste 3 até o modal aparecer
2. Clique em "Sim, estou aqui!"
3. ✅ **Esperado**: Modal fecha, timer reseta
4. Continue sem interagir por mais 30 minutos
5. ✅ **Esperado**: Modal aparece novamente

### Teste 5: Timeout do Modal

1. Siga passos do Teste 3 até o modal aparecer
2. **NÃO clique em nada**
3. Aguarde 60 segundos
4. ✅ **Esperado**: Logout automático, redirecionamento para Landing Page

### Teste 6: Simulação Rápida (Dev)

Abra o console e execute:

```javascript
// Simular 31 minutos de inatividade
const thirtyOneMinutesAgo = Date.now() - (31 * 60 * 1000);
localStorage.setItem('lastActivityTime', thirtyOneMinutesAgo.toString());
// Recarregue a página
location.reload();
```

✅ **Esperado**: Modal deve aparecer imediatamente

## 🔍 Debugging

### Ver status de atividade

```javascript
// No console do navegador
const lastActivity = parseInt(localStorage.getItem('lastActivityTime'), 10);
const now = Date.now();
const minutesSinceActivity = Math.floor((now - lastActivity) / 60000);

console.log(`Minutos desde última atividade: ${minutesSinceActivity}`);
console.log(`Modal deve aparecer em: ${30 - minutesSinceActivity} minutos`);
```

### Ver flags de logout

```javascript
console.log('Manual Logout:', localStorage.getItem('manualLogout'));
console.log('Last Login:', localStorage.getItem('lastLoginTime'));
console.log('Last Activity:', localStorage.getItem('lastActivityTime'));
```

### Limpar tudo e recomeçar

```javascript
localStorage.clear();
location.reload();
```

## ⚙️ Configuração

Para ajustar os tempos, edite `App.tsx`:

```typescript
// Alterar tempo de inatividade (atualmente 30 minutos)
const INACTIVITY_TIMEOUT_MS = 45 * 60 * 1000; // 45 minutos

// Alterar tempo do modal (atualmente 60 segundos)
<InactivityModal
  timeoutSeconds={120} // 2 minutos
  ...
/>
```

## 📊 Fluxo de Estados

```
┌─────────────────┐
│  Landing Page   │
└────────┬────────┘
         ↓ (Clica "Entrar")
┌─────────────────┐
│   Auth Page     │
└────────┬────────┘
         ↓ (Login bem-sucedido)
         ↓ manualLogout = false
         ↓ lastLoginTime = now
         ↓ lastActivityTime = now
┌─────────────────┐
│   Dashboard     │ ← Usuário ATIVO
│   (Logado)      │   Timer reseta continuamente
└────────┬────────┘
         │
         ├─→ (30 min SEM atividade) → Modal aparece
         │                              ↓
         │                    ┌─────────┴─────────┐
         │                    ↓                   ↓
         │              [Confirma]           [60s timeout]
         │                    ↓                   ↓
         │              Modal fecha          Logout automático
         │              Timer reseta              ↓
         │                    ↓                   ↓
         └────────────────────┘         ┌─────────────────┐
                                        │  Landing Page   │
         ↓ (Clica "Sair")               └─────────────────┘
         ↓ manualLogout = true
         ↓
┌─────────────────┐
│  Landing Page   │
└────────┬────────┘
         ↓ (F5 - Refresh)
         ↓ Verifica: manualLogout = true?
         ↓ SIM → Não restaura sessão
         ↓
┌─────────────────┐
│  Landing Page   │ ← Permanece aqui!
└─────────────────┘
```

## ✅ Checklist de Funcionalidades

- [x] Usuário ativo não recebe modal de inatividade
- [x] Após 30 minutos de inatividade, modal aparece
- [x] Modal tem timer visual de 60 segundos
- [x] Confirmar presença reseta timer e fecha modal
- [x] Timeout do modal faz logout automático
- [x] Logout manual persiste após refresh da página
- [x] Login limpa flag de logout manual
- [x] Qualquer atividade (click, tecla, scroll) reseta timer
- [x] Sistema detecta inatividade desde último acesso ao carregar

## 🚀 Benefícios

1. **Segurança**: Sessões inativas são encerradas automaticamente
2. **UX**: Não interrompe usuários ativos trabalhando
3. **Flexibilidade**: Dá 60s para o usuário responder
4. **Confiabilidade**: Logout manual persiste corretamente
5. **Transparência**: Logs no console para debugging

## 📝 Notas Importantes

- O sistema usa `localStorage` para persistir timestamps
- Eventos são monitorados com `{ passive: true }` para performance
- Timer é resetado em QUALQUER atividade do usuário
- Modal só pode aparecer UMA vez por período de inatividade
- Ao confirmar presença, o ciclo recomeça do zero
