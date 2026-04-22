import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Lock, ChevronLeft } from 'lucide-react';
import { Layout } from './components/Layout';
import { Button } from './components/ui';
import { AuthPage } from './pages/Auth';
import { LandingPage } from './pages/LandingPage';

import { supabase } from './lib/supabase';
import { Dashboard } from './pages/Dashboard';
import { AssociatesPage } from './pages/Associates';
import { FinancialPage } from './pages/Financial';
import { SettingsPage } from './pages/Settings';
import { InventoryPage } from './pages/Inventory';
import { EventsManagerPage } from './pages/EventsManager';

import { AuditPage } from './pages/Audit';
import { ClassroomPage } from './pages/Classroom';
import { SelectionPage } from './pages/Selection';
import { ProfilePage } from './pages/Profile';
import { CompanyPage } from './pages/Company';
import { ResetPasswordPage } from './pages/ResetPassword';
import { AccessDenied } from './pages/AccessDenied';
import { User, UserRole } from './types';
import { notificationService } from './services/notifications';
import { pushNotificationService } from './services/pushNotifications';
import { InactivityModal } from './components/InactivityModal';
import { useUserActivity } from './hooks/useUserActivity';

// Importar utilitários de teste apenas em desenvolvimento
if (import.meta.env.DEV) {
  import('./utils/sessionTestUtils');
}

// --- Route Protection ---
interface ProtectedRouteProps {
  user: User | null;
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ user, allowedRoles, children }) => {
  if (!user) return <Navigate to="/auth" replace />;
  if (!allowedRoles.includes(user.role)) {
    return <AccessDenied />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [showInactivityModal, setShowInactivityModal] = useState(false);

  // Constantes de tempo
  const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000; // 12 horas - para verificação de sessão antiga
  const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutos de INATIVIDADE para mostrar modal

  // Handler para quando o usuário fica inativo
  const handleInactive = () => {
    if (user) {
      console.log('Usuário inativo detectado. Mostrando modal de confirmação...');
      setShowInactivityModal(true);
    }
  };

  // Hook de monitoramento de atividade (só ativa quando usuário está logado)
  const { updateActivity } = useUserActivity({
    onInactive: handleInactive,
    inactivityTimeout: INACTIVITY_TIMEOUT_MS, // 30 minutos sem atividade
    enabled: !!user
  });

  // Handler para confirmar que o usuário está presente
  const handleConfirmPresence = () => {
    console.log('Usuário confirmou presença. Resetando timer...');
    setShowInactivityModal(false);
    updateActivity(); // Atualiza timestamp de atividade
  };

  // Handler para timeout ou logout forçado
  const handleForceLogout = async () => {
    console.log('Fazendo logout por inatividade...');
    setShowInactivityModal(false);
    await supabase.auth.signOut();
    localStorage.removeItem('lastLoginTime');
    localStorage.removeItem('lastActivityTime');
    setUser(null);
  };

  useEffect(() => {
    // Check for active session on startup
    const checkSession = async () => {
      try {
        // Força atualização do Service Worker
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then(registrations => {
            for (let registration of registrations) {
              registration.update();
              console.log('Service Worker atualizado manualmente');
            }
          });
        }

        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          // Verificar se é uma sessão de recuperação ANTES de aplicar as travas de segurança
          const isRecoveryInUrl = window.location.hash.includes('type=recovery') || window.location.href.includes('type=recovery');
          const isRecoveryInSession = session.user.app_metadata?.recovery === true;

          if (isRecoveryInUrl || isRecoveryInSession) {
             console.log('Sessão de recuperação detectada - Ignorando travas de segurança.');
             // Durante a recuperação, apenas pulamos para o carregamento do perfil ou reset
          } else {
            // Verificar se houve logout manual - se sim, não restaurar sessão
            const wasManualLogout = localStorage.getItem('manualLogout');
            if (wasManualLogout === 'true') {
              console.log('Logout manual detectado. Não restaurando sessão...');
              await supabase.auth.signOut();
              localStorage.removeItem('manualLogout');
              setIsSessionLoading(false);
              return;
            }

            // Verificar se há timestamp de login
            const lastLoginTime = localStorage.getItem('lastLoginTime');

            if (!lastLoginTime) {
              // Sessão antiga sem timestamp - fazer logout
              console.log('Sessão sem timestamp. Fazendo logout para exibir landing page...');
              await supabase.auth.signOut();
              setIsSessionLoading(false);
              return;
            }

            // Verificar inatividade usando o timestamp mais recente
            const lastActivityTime = localStorage.getItem('lastActivityTime');
            const referenceTime = lastActivityTime
              ? Math.max(parseInt(lastActivityTime, 10), parseInt(lastLoginTime, 10))
              : parseInt(lastLoginTime, 10);

            const timeSinceActivity = Date.now() - referenceTime;

            // Se passou mais de 12 horas de inatividade, fazer logout direto
            if (timeSinceActivity > TWELVE_HOURS_MS) {
              console.log('Sessão expirada por inatividade. Fazendo logout...');
              await supabase.auth.signOut();
              localStorage.removeItem('lastLoginTime');
              localStorage.removeItem('lastActivityTime');
              setIsSessionLoading(false);
              return;
            }
          }

          // Fetch profile details
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile && !error) {
            const appUser: User = {
              id: profile.id,
              name: profile.full_name || profile.email || 'Usuário',
              email: profile.email || session.user.email || '',
              role: profile.role || 'ASSOCIATE',
              avatar: profile.avatar_url,
              phone: profile.phone,
              cpf: profile.cpf,
              bio: profile.bio,
              birthDate: profile.birth_date,
              susNumber: profile.sus_number,
              registrationNumber: profile.registration_number,
              bloodType: profile.blood_type,
              address: profile.address
            };
            setUser(appUser);
            notificationService.setCurrentUser(profile.id);
            pushNotificationService.subscribeUser(profile.id, true).catch(console.error);

            // Atualiza atividade ao restaurar sessão
            updateActivity();
          }
        }
      } catch (error) {
        console.error('Session restoration failed:', error);
      } finally {
        setIsSessionLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('App Auth Event:', event);

      // Se for um evento de recuperação ou login via recuperação
      const isRecovery = event === 'PASSWORD_RECOVERY' || 
                        (event === 'SIGNED_IN' && window.location.hash.includes('type=recovery'));

      if (isRecovery) {
        console.log('Detectado fluxo de recuperação de senha. Redirecionando com segurança...');
        // Não usamos window.location.hash direto para não matar os tokens antes da hora
        setTimeout(() => {
          setIsSessionLoading(false);
          // Só muda a rota se ainda não estivermos lá
          if (!window.location.hash.includes('reset-password')) {
            window.location.hash = '#/reset-password';
          }
        }, 500);
        return;
      }

      if (!session) {
        setUser(null);
        localStorage.removeItem('lastLoginTime');
        localStorage.removeItem('lastActivityTime');
        setIsSessionLoading(false);
      }
    });

    // Verificação imediata: se tivermos um token de recuperação no hash bruto, 
    // PRECISAMOS deixar o Supabase ler primeiro antes de navegar.
    if (window.location.hash.includes('type=recovery') && !window.location.hash.includes('reset-password')) {
       console.log('Aguardando Supabase processar token de recuperação...');
       // Não faz nada, deixa o onAuthStateChange acima cuidar do redirecionamento
    }

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isSessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium">Carregando sistema...</p>
        </div>
      </div>
    );
  }

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    const now = Date.now().toString();
    // Armazenar timestamps do login e atividade inicial
    localStorage.setItem('lastLoginTime', now);
    localStorage.setItem('lastActivityTime', now);
    // Limpar flag de logout manual
    localStorage.removeItem('manualLogout');
    notificationService.setCurrentUser(loggedInUser.id);
    pushNotificationService.subscribeUser(loggedInUser.id, true).catch(console.error);
  };

  const handleLogout = async () => {
    // Marca que foi um logout manual para evitar auto-login no refresh
    localStorage.setItem('manualLogout', 'true');
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('lastLoginTime');
    localStorage.removeItem('lastActivityTime');
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <HashRouter>
      {user ? (
        <Layout user={user} onLogout={handleLogout}>
          <Routes>
            <Route path="/" element={<Dashboard user={user} />} />

            <Route path="/associates" element={
              <ProtectedRoute user={user} allowedRoles={[UserRole.ADMIN, UserRole.FINANCIAL, UserRole.SECRETARY, UserRole.INSTRUCTOR, UserRole.ASSOCIATE, UserRole.CANDIDATE]}>
                <AssociatesPage user={user} />
              </ProtectedRoute>
            } />

            <Route path="/financial" element={
              <ProtectedRoute user={user} allowedRoles={[UserRole.ADMIN, UserRole.FINANCIAL, UserRole.SECRETARY, UserRole.INSTRUCTOR, UserRole.ASSOCIATE, UserRole.CANDIDATE]}>
                <FinancialPage user={user} />
              </ProtectedRoute>
            } />

            <Route path="/settings" element={
              <ProtectedRoute user={user} allowedRoles={[UserRole.ADMIN, UserRole.FINANCIAL, UserRole.SECRETARY, UserRole.INSTRUCTOR, UserRole.ASSOCIATE, UserRole.CANDIDATE]}>
                <SettingsPage user={user} />
              </ProtectedRoute>
            } />

            <Route path="/settings/codes" element={
              <ProtectedRoute user={user} allowedRoles={[UserRole.ADMIN, UserRole.FINANCIAL, UserRole.SECRETARY, UserRole.INSTRUCTOR, UserRole.ASSOCIATE, UserRole.CANDIDATE]}>
                <SettingsPage user={user} />
              </ProtectedRoute>
            } />

            <Route path="/settings/landing-page" element={
              <ProtectedRoute user={user} allowedRoles={[UserRole.ADMIN, UserRole.FINANCIAL, UserRole.SECRETARY, UserRole.INSTRUCTOR, UserRole.ASSOCIATE, UserRole.CANDIDATE]}>
                <SettingsPage user={user} />
              </ProtectedRoute>
            } />

            <Route path="/settings/notifications" element={
              <ProtectedRoute user={user} allowedRoles={[UserRole.ADMIN, UserRole.FINANCIAL, UserRole.SECRETARY, UserRole.INSTRUCTOR, UserRole.ASSOCIATE, UserRole.CANDIDATE]}>
                <SettingsPage user={user} />
              </ProtectedRoute>
            } />

            <Route path="/company" element={
              <ProtectedRoute user={user} allowedRoles={[UserRole.ADMIN, UserRole.FINANCIAL, UserRole.SECRETARY, UserRole.INSTRUCTOR, UserRole.ASSOCIATE, UserRole.CANDIDATE]}>
                <CompanyPage user={user} />
              </ProtectedRoute>
            } />

            <Route path="/inventory" element={
              <ProtectedRoute user={user} allowedRoles={[UserRole.ADMIN, UserRole.FINANCIAL, UserRole.SECRETARY, UserRole.INSTRUCTOR, UserRole.ASSOCIATE, UserRole.CANDIDATE]}>
                <InventoryPage user={user} />
              </ProtectedRoute>
            } />

            <Route path="/events" element={
              <ProtectedRoute user={user} allowedRoles={[UserRole.ADMIN, UserRole.FINANCIAL, UserRole.SECRETARY, UserRole.INSTRUCTOR, UserRole.ASSOCIATE, UserRole.CANDIDATE]}>
                <EventsManagerPage user={user} />
              </ProtectedRoute>
            } />

            <Route path="/events/schedule" element={
              <ProtectedRoute user={user} allowedRoles={[UserRole.ADMIN, UserRole.FINANCIAL, UserRole.SECRETARY, UserRole.INSTRUCTOR, UserRole.ASSOCIATE, UserRole.CANDIDATE]}>
                <EventsManagerPage user={user} />
              </ProtectedRoute>
            } />

            <Route path="/events/calendar" element={
              <ProtectedRoute user={user} allowedRoles={[UserRole.ADMIN, UserRole.FINANCIAL, UserRole.SECRETARY, UserRole.INSTRUCTOR, UserRole.ASSOCIATE, UserRole.CANDIDATE]}>
                <EventsManagerPage user={user} />
              </ProtectedRoute>
            } />

            <Route path="/events/list" element={
              <ProtectedRoute user={user} allowedRoles={[UserRole.ADMIN, UserRole.FINANCIAL, UserRole.SECRETARY, UserRole.INSTRUCTOR, UserRole.ASSOCIATE, UserRole.CANDIDATE]}>
                <EventsManagerPage user={user} />
              </ProtectedRoute>
            } />

            {/* Rota legada redirecionando para a nova */}
            <Route path="/schedule" element={<Navigate to="/events/schedule" replace />} />

            <Route path="/audit" element={
              <ProtectedRoute user={user} allowedRoles={[UserRole.ADMIN, UserRole.FINANCIAL, UserRole.SECRETARY, UserRole.ASSOCIATE, UserRole.INSTRUCTOR, UserRole.CANDIDATE]}>
                <AuditPage user={user} />
              </ProtectedRoute>
            } />

            <Route path="/classroom" element={
              <ProtectedRoute user={user} allowedRoles={[UserRole.ADMIN, UserRole.FINANCIAL, UserRole.SECRETARY, UserRole.INSTRUCTOR, UserRole.ASSOCIATE, UserRole.CANDIDATE]}>
                <ClassroomPage user={user} />
              </ProtectedRoute>
            } />

            <Route path="/selection" element={
              <ProtectedRoute user={user} allowedRoles={[UserRole.ADMIN, UserRole.FINANCIAL, UserRole.SECRETARY, UserRole.INSTRUCTOR, UserRole.ASSOCIATE, UserRole.CANDIDATE]}>
                <SelectionPage user={user} />
              </ProtectedRoute>
            } />

            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/profile" element={<ProfilePage user={user} onUpdate={handleUpdateUser} />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* Modal de Inatividade */}
          <InactivityModal
            isOpen={showInactivityModal}
            onConfirm={handleConfirmPresence}
            onTimeout={handleForceLogout}
            timeoutSeconds={60}
          />
        </Layout>
      ) : (
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage onLogin={handleLogin} />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </HashRouter>
  );
};

export default App;