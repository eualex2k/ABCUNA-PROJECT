/**
 * Utilitário de Teste - Sistema de Logout Automático
 *
 * Este arquivo contém funções auxiliares para testar o sistema de logout automático.
 * Use estas funções no console do navegador para simular diferentes cenários.
 */

/**
 * Simula uma sessão expirada (13 horas atrás)
 * Use: simulateExpiredSession()
 */
export const simulateExpiredSession = () => {
  const thirteenHoursAgo = Date.now() - 13 * 60 * 60 * 1000;
  localStorage.setItem('lastLoginTime', thirteenHoursAgo.toString());
  console.log('✅ Sessão simulada como expirada (13 horas atrás)');
  console.log('🔄 Recarregue a página para ver o logout automático');
};

/**
 * Simula uma sessão válida (1 hora atrás)
 * Use: simulateValidSession()
 */
export const simulateValidSession = () => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  localStorage.setItem('lastLoginTime', oneHourAgo.toString());
  console.log('✅ Sessão simulada como válida (1 hora atrás)');
  console.log('🔄 Recarregue a página para verificar');
};

/**
 * Remove o timestamp de login (simula sessão antiga)
 * Use: simulateOldSession()
 */
export const simulateOldSession = () => {
  localStorage.removeItem('lastLoginTime');
  console.log('✅ Timestamp removido (sessão antiga)');
  console.log('🔄 Recarregue a página para ver o logout automático');
};

/**
 * Mostra informações sobre a sessão atual
 * Use: checkSessionInfo()
 */
export const checkSessionInfo = () => {
  const lastLoginTime = localStorage.getItem('lastLoginTime');

  if (!lastLoginTime) {
    console.log('❌ Nenhum timestamp de login encontrado');
    return;
  }

  const timestamp = parseInt(lastLoginTime, 10);
  const now = Date.now();
  const timeSinceLogin = now - timestamp;
  const twelveHours = 12 * 60 * 60 * 1000;

  const hours = Math.floor(timeSinceLogin / (60 * 60 * 1000));
  const minutes = Math.floor((timeSinceLogin % (60 * 60 * 1000)) / (60 * 1000));

  console.log('📊 Informações da Sessão:');
  console.log('─────────────────────────');
  console.log(
    `⏰ Login realizado em: ${new Date(timestamp).toLocaleString('pt-BR')}`
  );
  console.log(`⏱️  Tempo desde login: ${hours}h ${minutes}min`);
  console.log(
    `✅ Status: ${timeSinceLogin > twelveHours ? '❌ EXPIRADA' : '✅ VÁLIDA'}`
  );
  console.log(
    `🔒 Expira em: ${new Date(timestamp + twelveHours).toLocaleString('pt-BR')}`
  );
};

/**
 * Força um novo login (define timestamp atual)
 * Use: forceNewLogin()
 */
export const forceNewLogin = () => {
  localStorage.setItem('lastLoginTime', Date.now().toString());
  console.log('✅ Timestamp de login atualizado para agora');
  console.log('🔄 Recarregue a página para verificar');
};

// Exporta todas as funções para uso no console
if (typeof window !== 'undefined') {
  (window as any).sessionTestUtils = {
    simulateExpiredSession,
    simulateValidSession,
    simulateOldSession,
    checkSessionInfo,
    forceNewLogin,
  };

  console.log('🧪 Utilitários de teste carregados!');
  console.log('📝 Use window.sessionTestUtils para acessar as funções:');
  console.log('   - simulateExpiredSession()');
  console.log('   - simulateValidSession()');
  console.log('   - simulateOldSession()');
  console.log('   - checkSessionInfo()');
  console.log('   - forceNewLogin()');
}
