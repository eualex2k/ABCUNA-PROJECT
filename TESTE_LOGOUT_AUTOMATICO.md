# Guia de Teste - Sistema de Logout Automático

## 🧪 Como Testar

### Método 1: Teste Manual Simples

1. **Faça login no sistema**
   - Acesse a aplicação
   - Clique em "Entrar" na landing page
   - Faça login com suas credenciais

2. **Verifique o timestamp**
   - Abra o DevTools (F12)
   - Vá para a aba "Application" (Chrome) ou "Storage" (Firefox)
   - Em "Local Storage", procure por `lastLoginTime`
   - Você verá um número grande (timestamp em milissegundos)

3. **Teste de sessão válida**
   - Recarregue a página (F5)
   - Você deve continuar logado e ir direto ao dashboard

4. **Teste de logout manual**
   - Clique em "Sair"
   - Verifique que `lastLoginTime` foi removido do localStorage
   - Você deve ver a landing page

### Método 2: Usando Utilitários de Teste (Desenvolvimento)

Abra o console do navegador (F12 → Console) e use os comandos:

#### Ver informações da sessão atual
```javascript
window.sessionTestUtils.checkSessionInfo()
```

#### Simular sessão expirada (13 horas)
```javascript
window.sessionTestUtils.simulateExpiredSession()
// Depois recarregue a página (F5)
```

#### Simular sessão válida (1 hora)
```javascript
window.sessionTestUtils.simulateValidSession()
// Depois recarregue a página (F5)
```

#### Simular sessão antiga (sem timestamp)
```javascript
window.sessionTestUtils.simulateOldSession()
// Depois recarregue a página (F5)
```

#### Forçar novo login (timestamp atual)
```javascript
window.sessionTestUtils.forceNewLogin()
// Depois recarregue a página (F5)
```

### Método 3: Teste Manual Avançado

#### Simular sessão expirada manualmente:

1. Abra o DevTools (F12)
2. Vá para Console
3. Execute:
```javascript
// Simula login de 13 horas atrás
const thirteenHoursAgo = Date.now() - (13 * 60 * 60 * 1000);
localStorage.setItem('lastLoginTime', thirteenHoursAgo.toString());
```
4. Recarregue a página (F5)
5. **Resultado esperado**: Você deve ver a landing page (logout automático)

#### Verificar tempo restante:

```javascript
const lastLogin = parseInt(localStorage.getItem('lastLoginTime'), 10);
const now = Date.now();
const elapsed = now - lastLogin;
const twelveHours = 12 * 60 * 60 * 1000;
const remaining = twelveHours - elapsed;

console.log(`Tempo desde login: ${Math.floor(elapsed / 3600000)}h`);
console.log(`Tempo restante: ${Math.floor(remaining / 3600000)}h`);
```

## 📋 Checklist de Testes

- [ ] **Login normal funciona**
  - Fazer login → vai para dashboard
  - Timestamp é criado no localStorage

- [ ] **Sessão válida persiste**
  - Recarregar página → continua logado
  - Fechar e abrir navegador → continua logado (se < 12h)

- [ ] **Logout manual funciona**
  - Clicar em "Sair" → vai para landing page
  - Timestamp é removido do localStorage

- [ ] **Sessão expirada (12+ horas)**
  - Simular sessão antiga → recarregar
  - Deve mostrar landing page
  - Timestamp deve ser removido

- [ ] **Sessão sem timestamp**
  - Remover timestamp manualmente
  - Recarregar página
  - Deve mostrar landing page (mesmo com sessão Supabase ativa)

- [ ] **Console logs aparecem**
  - "Sessão expirada após 12 horas. Fazendo logout..."
  - "Sessão sem timestamp. Fazendo logout para exibir landing page..."

## 🐛 Problemas Comuns

### Problema: Continua logado mesmo após simular expiração
**Solução**: 
1. Verifique se recarregou a página após modificar o timestamp
2. Limpe o cache do navegador (Ctrl+Shift+Delete)
3. Tente em modo anônimo/privado

### Problema: Utilitários de teste não aparecem
**Solução**:
1. Certifique-se de estar em modo desenvolvimento (`npm run dev`)
2. Recarregue a página
3. Verifique o console por erros

### Problema: Timestamp não é criado no login
**Solução**:
1. Verifique se o login foi bem-sucedido
2. Abra o DevTools e vá em Application → Local Storage
3. Se não aparecer, pode haver erro no código - verifique o console

## 🔍 Debugging

### Ver todos os dados do localStorage
```javascript
console.table(Object.entries(localStorage));
```

### Limpar tudo e começar do zero
```javascript
localStorage.clear();
location.reload();
```

### Verificar sessão do Supabase
```javascript
const { data } = await supabase.auth.getSession();
console.log('Sessão Supabase:', data);
```

## ✅ Critérios de Sucesso

O sistema está funcionando corretamente se:

1. ✅ Usuários novos veem a landing page primeiro
2. ✅ Após login, timestamp é armazenado
3. ✅ Sessões válidas (< 12h) persistem entre recarregamentos
4. ✅ Sessões expiradas (> 12h) fazem logout automático
5. ✅ Sessões antigas (sem timestamp) fazem logout automático
6. ✅ Logout manual limpa o timestamp
7. ✅ Landing page é exibida após logout (automático ou manual)

## 📊 Monitoramento em Produção

Para monitorar o comportamento em produção, você pode adicionar analytics:

```javascript
// Exemplo com Google Analytics
if (timeSinceLogin > TWELVE_HOURS_MS) {
  gtag('event', 'session_expired', {
    'event_category': 'authentication',
    'event_label': 'auto_logout_12h'
  });
}
```
