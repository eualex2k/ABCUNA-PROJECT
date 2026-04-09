import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Key, LayoutTemplate, Settings as SettingsIcon, Bell } from 'lucide-react';
import { AccessCodesPage } from './AccessCodes';
import { LandingPageSettings } from './LandingPageSettings';
import { NotificationSettings } from './NotificationSettings';
import { User } from '../types';

interface SettingsProps {
    user: User;
}

export const SettingsPage: React.FC<SettingsProps> = ({ user }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'codes' | 'landing' | 'notifications'>('codes');

    useEffect(() => {
        if (location.pathname.includes('/settings/landing-page')) {
            setActiveTab('landing');
        } else if (location.pathname.includes('/settings/notifications')) {
            setActiveTab('notifications');
        } else {
            setActiveTab('codes');
        }
    }, [location]);

    const handleTabChange = (tab: 'codes' | 'landing' | 'notifications') => {
        setActiveTab(tab);
        if (tab === 'codes') {
            navigate('/settings/codes');
        } else if (tab === 'landing') {
            navigate('/settings/landing-page');
        } else {
            navigate('/settings/notifications');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
                        <SettingsIcon className="text-white" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800">Configurações do Sistema</h1>
                        <p className="text-slate-500">Gerencie códigos de acesso, a página inicial e notificações</p>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8 bg-white p-2 rounded-xl border border-slate-200 shadow-sm w-fit overflow-x-auto max-w-full">
                    <button
                        onClick={() => handleTabChange('codes')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all duration-300 min-w-max ${activeTab === 'codes'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                            }`}
                    >
                        <Key size={18} />
                        Códigos de Acesso
                    </button>
                    <button
                        onClick={() => handleTabChange('landing')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all duration-300 min-w-max ${activeTab === 'landing'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                            }`}
                    >
                        <LayoutTemplate size={18} />
                        Página Inicial
                    </button>
                    <button
                        onClick={() => handleTabChange('notifications')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all duration-300 min-w-max ${activeTab === 'notifications'
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-600'
                            }`}
                    >
                        <Bell size={18} />
                        Notificações
                    </button>
                </div>

                {/* Content Area */}
                <div className="fade-in-up">
                    {activeTab === 'codes' ? (
                        <AccessCodesPage user={user} />
                    ) : activeTab === 'landing' ? (
                        <LandingPageSettings user={user} />
                    ) : (
                        <NotificationSettings user={user} />
                    )}
                </div>
            </div>
        </div>
    );
};
