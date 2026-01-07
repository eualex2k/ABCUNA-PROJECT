import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CalendarDays, RefreshCcw, Calendar } from 'lucide-react';
import { EventsPage } from './Events';
import { SchedulePage } from './Schedule';
import { User } from '../types';

interface EventsManagerProps {
    user: User;
}

export const EventsManagerPage: React.FC<EventsManagerProps> = ({ user }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'events' | 'schedule'>('events');

    useEffect(() => {
        if (location.pathname.includes('/events/schedule')) {
            setActiveTab('schedule');
        } else {
            setActiveTab('events');
        }
    }, [location]);

    const handleTabChange = (tab: 'events' | 'schedule') => {
        setActiveTab(tab);
        if (tab === 'events') {
            navigate('/events');
        } else {
            navigate('/events/schedule');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-red-600 rounded-xl shadow-lg shadow-red-200">
                        <Calendar className="text-white" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800">Gestão Operacional</h1>
                        <p className="text-slate-500">Calendário de eventos e escalas de serviço</p>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8 bg-white p-2 rounded-xl border border-slate-200 shadow-sm w-fit">
                    <button
                        onClick={() => handleTabChange('events')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === 'events'
                                ? 'bg-red-600 text-white shadow-md'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-red-600'
                            }`}
                    >
                        <CalendarDays size={18} />
                        Eventos Gerais
                    </button>
                    <button
                        onClick={() => handleTabChange('schedule')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === 'schedule'
                                ? 'bg-red-600 text-white shadow-md'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-red-600'
                            }`}
                    >
                        <RefreshCcw size={18} />
                        Escala de Serviço
                    </button>
                </div>

                {/* Content Area */}
                <div className="fade-in-up">
                    {activeTab === 'events' ? (
                        <EventsPage user={user} />
                    ) : (
                        <SchedulePage user={user} />
                    )}
                </div>
            </div>
        </div>
    );
};
