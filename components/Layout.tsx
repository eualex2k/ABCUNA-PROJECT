import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  Search,
  Bell,
  LogOut,
  ChevronRight,
  Flame,
  Check,
  Trash2,
  Calendar,
  DollarSign,
  BookOpen,
  Shield,
  Clock
} from 'lucide-react';
import { MENU_ITEMS } from '../constants';
import { User, Notification, translateRole } from '../types';
import { Avatar, Button } from './ui';
import { notificationService } from '../services/notifications';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchResults, setSearchResults] = useState<{ label: string; path: string; icon: any }[]>([]);

  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Load and subscribe to notifications
  useEffect(() => {
    const loadNotifs = () => {
      setNotifications(notificationService.getAll());
      setUnreadCount(notificationService.getUnreadCount());
    };

    loadNotifs();
    const unsubscribe = notificationService.subscribe(loadNotifs);
    return () => unsubscribe();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    // Global Keyboard Shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsNotifOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Update search results
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = MENU_ITEMS.filter(item =>
      item.label.toLowerCase().includes(query) &&
      item.allowedRoles.includes(user?.role || ('' as any))
    ).map(item => ({
      label: item.label,
      path: item.path,
      icon: item.icon
    }));

    setSearchResults(results);
  }, [searchQuery, user]);

  useEffect(() => {
    setIsSearchOpen(false);
    setSearchQuery('');
  }, [location.pathname]);

  if (!user) return <>{children}</>;

  const filteredMenu = MENU_ITEMS.filter(item =>
    item.allowedRoles.includes(user.role)
  );

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'FINANCIAL': return <DollarSign size={16} className="text-green-600" />;
      case 'EVENT': return <Calendar size={16} className="text-blue-600" />;
      case 'SCHEDULE': return <Clock size={16} className="text-purple-600" />;
      case 'CLASSROOM': return <BookOpen size={16} className="text-indigo-600" />;
      case 'AUDIT': return <Shield size={16} className="text-orange-600" />;
      default: return <Flame size={16} className="text-brand-600" />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-72 side-panel shadow-2xl lg:shadow-none transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-20 flex items-center px-6 mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-brand-600 rounded-xl text-white">
                <Flame size={22} fill="currentColor" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white leading-tight tracking-tight">ABCUNA</h1>
                <div className="flex items-center gap-1.5 pt-0.5">
                  <p className="text-[9px] font-bold text-slate-400 tracking-[0.15em] uppercase">Sistema de Gestão Integrada</p>
                </div>
              </div>
            </div>
            <button
              className="ml-auto lg:hidden p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-2 px-4 space-y-1 custom-scrollbar">
            <div className="px-3 mb-4 mt-4 text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] opacity-70">
              Menu Principal
            </div>
            {filteredMenu.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`
                    group flex items-center justify-between px-3.5 py-3 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive
                      ? 'bg-brand-600 text-white'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'}
                  `}
                >
                  <div className="flex items-center gap-3.5">
                    <Icon size={18} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'} />
                    <span className="tracking-tight">{item.label}</span>
                  </div>
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />}
                </NavLink>
              );
            })}
          </nav>

          {/* User Profile Footer */}
          <div className="p-4 mt-auto">
            <div
              className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors group"
              onClick={() => navigate('/profile')}
            >
              <Avatar src={user.avatar} alt={user.name} fallback={user.name.substring(0, 2)} size="sm" className="ring-2 ring-white/5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate group-hover:text-brand-400 transition-colors">{user.name}</p>
                <p className="text-xs text-slate-400 truncate opacity-70">{translateRole(user.role)}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onLogout(); }}
                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Sair"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 z-20 sticky top-0">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            {/* Global Search */}
            <div className="hidden md:flex items-center relative max-w-md w-full" ref={searchRef}>
              <Search
                className={`absolute left-3.5 transition-colors ${isSearchOpen ? 'text-brand-600' : 'text-slate-400'}`}
                size={16}
              />
              <input
                ref={inputRef}
                type="text"
                placeholder="Buscar ou Ctrl+K..."
                value={searchQuery}
                onFocus={() => setIsSearchOpen(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`
                  w-80 h-10 pl-11 pr-4 bg-slate-50 border rounded-lg text-sm text-slate-900 
                  focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 focus:bg-white transition-all 
                  placeholder:text-slate-400 outline-none
                  ${isSearchOpen ? 'border-brand-500 bg-white ring-4 ring-brand-500/10' : 'border-slate-200'}
                `}
              />

              {/* Search Results Dropdown */}
              {isSearchOpen && (searchQuery || searchResults.length > 0) && (
                <div className="absolute top-12 left-0 w-[400px] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-3 bg-slate-50/50 border-b border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Navegação Rápida</p>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-2">
                    {searchResults.length === 0 ? (
                      <div className="p-8 text-center">
                        <Search size={32} className="mx-auto mb-3 text-slate-200" />
                        <p className="text-sm text-slate-500 font-medium">Nenhum resultado encontrado para <span className="text-slate-900 font-bold">"{searchQuery}"</span></p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {searchResults.map((result, idx) => {
                          const Icon = result.icon;
                          return (
                            <button
                              key={idx}
                              onClick={() => navigate(result.path)}
                              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-brand-50 group transition-all"
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 group-hover:bg-white rounded-lg transition-colors">
                                  <Icon size={16} className="text-slate-500 group-hover:text-brand-600" />
                                </div>
                                <span className="text-sm font-bold text-slate-700 group-hover:text-brand-900">{result.label}</span>
                              </div>
                              <ChevronRight size={14} className="text-slate-300 group-hover:text-brand-400" />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-bold px-4">
                    <span>DICA: Use as setas para navegar</span>
                    <div className="flex gap-2">
                      <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200">ESC</span>
                      <span>para fechar</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4" ref={notifRef}>
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className={`relative p-2 rounded-lg transition-colors ${isNotifOpen ? 'bg-slate-100 text-brand-600' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-brand-600 rounded-full ring-2 ring-white"></span>
                )}
              </button>

              {/* Notification Dropdown */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 origin-top-right">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-sm text-slate-900">Notificações</h3>
                    <div className="flex gap-2">
                      {notifications.length > 0 && (
                        <button
                          onClick={() => notificationService.markAllAsRead()}
                          className="text-xs text-brand-600 hover:text-brand-800 font-bold transition-colors"
                        >
                          Marcar como lidas
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400">
                        <Bell size={32} className="mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-medium">Nenhuma notificação nova.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {notifications.map(notif => (
                          <div
                            key={notif.id}
                            onClick={() => {
                              notificationService.markAsRead(notif.id);
                              if (notif.link) {
                                navigate(notif.link);
                                setIsNotifOpen(false);
                              }
                            }}
                            className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${!notif.read ? 'bg-brand-50/50' : ''}`}
                          >
                            <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${!notif.read ? 'bg-brand-600 shadow-[0_0_8px_rgba(220,38,38,0.4)]' : 'bg-transparent'}`} />
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <h4 className={`text-sm ${!notif.read ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>
                                  {notif.title}
                                </h4>
                                <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap ml-2">
                                  {new Date(notif.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{notif.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <div className="p-2 border-t border-slate-100 bg-slate-50 text-center">
                      <button
                        onClick={() => notificationService.clearAll()}
                        className="text-xs text-slate-400 hover:text-red-600 font-bold transition-colors flex items-center justify-center gap-2 w-full py-2"
                      >
                        <Trash2 size={12} /> Limpar tudo
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};