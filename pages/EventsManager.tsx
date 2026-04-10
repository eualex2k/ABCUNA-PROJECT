import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CalendarDays, RefreshCcw, Calendar, Plus } from 'lucide-react';
import { EventsPage, EventsPageRef } from './Events';
import { SchedulePage, SchedulePageRef } from './Schedule';
import { Button } from '../components/ui';
import { User, UserRole } from '../types';

interface EventsManagerProps {
    user: User;
}

export const EventsManagerPage: React.FC<EventsManagerProps> = ({ user }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'events' | 'schedule' | 'calendar'>('calendar');
    
    const eventsRef = React.useRef<EventsPageRef>(null);
    const scheduleRef = React.useRef<SchedulePageRef>(null);

    const canEdit = [UserRole.ADMIN, UserRole.SECRETARY].includes(user.role);

    useEffect(() => {
        const path = location.pathname.replace(/\/$/, ''); // Remove trailing slash
        if (path.endsWith('/schedule')) {
            setActiveTab('schedule');
        } else if (path.endsWith('/calendar')) {
            setActiveTab('calendar');
        } else if (path === '/events' || path.endsWith('/list')) {
            setActiveTab('events');
        } else {
            // Default to calendar as requested for the new dashboard
            setActiveTab('calendar');
        }
    }, [location]);

    const handleTabChange = (tab: 'events' | 'schedule' | 'calendar') => {
        setActiveTab(tab);
        if (tab === 'events') {
            navigate('/events/list');
        } else if (tab === 'calendar') {
            navigate('/events/calendar');
        } else {
            navigate('/events/schedule');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800">Gestão Operacional</h1>
                        <p className="text-slate-500">Calendário de eventos e plantões operacionais</p>
                    </div>
                </div>

                {/* Main Action Bar */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
                    {/* Tabs Navigation */}
                    <div className="flex gap-1 p-1 bg-white rounded-2xl border border-slate-200 shadow-sm w-fit">
                        <button
                            onClick={() => handleTabChange('calendar')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'calendar'
                                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            <Calendar size={18} />
                            Calendário de Eventos
                        </button>
                        <button
                            onClick={() => handleTabChange('schedule')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'schedule'
                                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            <RefreshCcw size={18} />
                            Plantão Operacional
                        </button>
                        <button
                            onClick={() => handleTabChange('events')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'events'
                                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            <CalendarDays size={18} />
                            Lista de Eventos
                        </button>
                    </div>

                    {/* Right-aligned Contextual Actions */}
                    {canEdit && (
                        <div className="flex gap-2">
                             {activeTab === 'schedule' ? (
                                <Button 
                                    onClick={() => scheduleRef.current?.openCreateModal()} 
                                    className="flex items-center gap-2 shadow-lg shadow-brand-200 h-12 px-8 bg-slate-900 hover:bg-black text-white"
                                >
                                    <Plus size={18} /> Novo Plantão
                                </Button>
                             ) : (
                                <Button 
                                    onClick={() => eventsRef.current?.openCreateModal()} 
                                    className="flex items-center gap-2 shadow-lg shadow-brand-200 h-12 px-8 bg-slate-900 hover:bg-black text-white"
                                >
                                    <Plus size={18} /> Criar Evento
                                </Button>
                             )}
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="fade-in-up">
                    {activeTab === 'schedule' ? (
                        <SchedulePage ref={scheduleRef} user={user} />
                    ) : (
                        <EventsPage ref={eventsRef} user={user} initialView={activeTab === 'calendar' ? 'calendar' : 'list'} />
                    )}
                </div>
            </div>
        </div>
    );
};
