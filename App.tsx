import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Lock, ChevronLeft } from 'lucide-react';
import { Layout } from './components/Layout';
import { Button } from './components/ui';
import { AuthPage } from './pages/Auth';
import { supabase } from './lib/supabase';
import { Dashboard } from './pages/Dashboard';
import { AssociatesPage } from './pages/Associates';
import { FinancialPage } from './pages/Financial';
import { AccessCodesPage } from './pages/AccessCodes';
import { InventoryPage } from './pages/Inventory';
import { EventsPage } from './pages/Events';
import { SchedulePage } from './pages/Schedule';
import { AuditPage } from './pages/Audit';
import { ClassroomPage } from './pages/Classroom';
import { SelectionPage } from './pages/Selection';
import { ProfilePage } from './pages/Profile';
import { CompanyPage } from './pages/Company';
import { User, UserRole } from './types';
import { notificationService } from './services/notifications';
import { pushNotificationService } from './services/pushNotifications';

// --- Route Protection ---
interface ProtectedRouteProps {
  user: User | null;
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ user, allowedRoles, children }) => {
  const navigate = useNavigate();
  if (!user) return <Navigate to="/auth" replace />;
  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6 animate-in fade-in duration-500">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto ring-8 ring-red-50/50">
            <Lock size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900">Acesso Restrito</h2>
            <p className="text-slate-500 text-sm leading-relaxed font-medium">
              Você não possui permissões suficientes para acessar esta área do sistema. Entre em contato com a administração se acredita que isso é um erro.
            </p>
          </div>
          <Button
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center gap-2"
          >
            <ChevronLeft size={18} /> Voltar ao Início
          </Button>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  useEffect(() => {
    // Check for active session on startup
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
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
              bio: profile.bio
            };
            setUser(appUser);
            notificationService.setCurrentUser(profile.id);
            pushNotificationService.subscribeUser(profile.id, true).catch(console.error);
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        setUser(null);
        setIsSessionLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
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
    notificationService.setCurrentUser(loggedInUser.id);
    pushNotificationService.subscribeUser(loggedInUser.id, true).catch(console.error);
  };

  const handleLogout = () => {
    setUser(null);
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
              <ProtectedRoute user={user} allowedRoles={[UserRole.ADMIN, UserRole.SECRETARY, UserRole.FINANCIAL]}>
                <AssociatesPage user={user} />
              </ProtectedRoute>
            } />

            <Route path="/financial" element={
              <ProtectedRoute user={user} allowedRoles={[UserRole.ADMIN, UserRole.FINANCIAL, UserRole.SECRETARY]}>
                <FinancialPage user={user} />
              </ProtectedRoute>
            } />

            <Route path="/settings/codes" element={
              <ProtectedRoute user={user} allowedRoles={[UserRole.ADMIN]}>
                <AccessCodesPage />
              </ProtectedRoute>
            } />

            <Route path="/company" element={
              <ProtectedRoute user={user} allowedRoles={[UserRole.ADMIN]}>
                <CompanyPage user={user} />
              </ProtectedRoute>
            } />

            <Route path="/inventory" element={
              <ProtectedRoute user={user} allowedRoles={[UserRole.ADMIN, UserRole.SECRETARY, UserRole.FINANCIAL]}>
                <InventoryPage user={user} />
              </ProtectedRoute>
            } />

            <Route path="/events" element={
              <ProtectedRoute user={user} allowedRoles={[UserRole.ADMIN, UserRole.SECRETARY, UserRole.FINANCIAL, UserRole.ASSOCIATE, UserRole.INSTRUCTOR]}>
                <EventsPage user={user} />
              </ProtectedRoute>
            } />

            <Route path="/schedule" element={
              <ProtectedRoute user={user} allowedRoles={[UserRole.ADMIN, UserRole.SECRETARY, UserRole.FINANCIAL, UserRole.ASSOCIATE, UserRole.INSTRUCTOR]}>
                <SchedulePage user={user} />
              </ProtectedRoute>
            } />

            <Route path="/audit" element={
              <ProtectedRoute user={user} allowedRoles={[UserRole.ADMIN, UserRole.FINANCIAL, UserRole.SECRETARY, UserRole.ASSOCIATE, UserRole.INSTRUCTOR, UserRole.CANDIDATE]}>
                <AuditPage user={user} />
              </ProtectedRoute>
            } />

            <Route path="/classroom" element={
              <ProtectedRoute user={user} allowedRoles={[UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.ASSOCIATE, UserRole.SECRETARY, UserRole.FINANCIAL]}>
                <ClassroomPage user={user} />
              </ProtectedRoute>
            } />

            <Route path="/selection" element={
              <ProtectedRoute user={user} allowedRoles={[UserRole.ADMIN, UserRole.CANDIDATE, UserRole.SECRETARY, UserRole.FINANCIAL, UserRole.INSTRUCTOR]}>
                <SelectionPage user={user} />
              </ProtectedRoute>
            } />

            <Route path="/profile" element={<ProfilePage user={user} onUpdate={handleUpdateUser} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      ) : (
        <Routes>
          <Route path="*" element={<AuthPage onLogin={handleLogin} />} />
        </Routes>
      )}
    </HashRouter>
  );
};

export default App;