import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, MapPin, Clock, Plus, Users, Search, Trash2, Edit3, X, CheckSquare, CheckCircle, Shield, Globe, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { Card, Button, Input, Modal, Badge } from '../components/ui';
import { notificationService } from '../services/notifications';
import { eventsService } from '../services/events';
import { Event, User, UserRole } from '../types';

interface EventsPageProps {
  user: User;
  initialView?: 'list' | 'calendar';
}

export interface EventsPageRef {
  openCreateModal: () => void;
}

export const EventsPage = React.forwardRef<EventsPageRef, EventsPageProps>(({ user, initialView = 'list' }, ref) => {
  const canEdit = [UserRole.ADMIN, UserRole.SECRETARY, UserRole.INSTRUCTOR].includes(user.role);
  const [activeTab, setActiveTab] = useState<'list' | 'calendar'>(initialView);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const navigate = useNavigate();

  React.useImperativeHandle(ref, () => ({
    openCreateModal: () => handleOpenCreate()
  }));

  useEffect(() => {
    setActiveTab(initialView);
  }, [initialView]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await eventsService.getAll();
      setEvents(data || []);
    } catch (error) {
      console.error('Failed to load events', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const holidays = [
    { date: '2026-01-01', title: 'Confraternização Universal' },
    { date: '2026-02-16', title: 'Carnaval' },
    { date: '2026-02-17', title: 'Carnaval' },
    { date: '2026-04-03', title: 'Sexta-feira Santa' },
    { date: '2026-04-21', title: 'Tiradentes' },
    { date: '2026-05-01', title: 'Dia do Trabalho' },
    { date: '2026-06-04', title: 'Corpus Christi' },
    { date: '2026-09-07', title: 'Independência do Brasil' },
    { date: '2026-10-12', title: 'Nossa Sra. Aparecida' },
    { date: '2026-11-02', title: 'Finados' },
    { date: '2026-11-15', title: 'Proclamação da República' },
    { date: '2026-11-20', title: 'Consciência Negra' },
    { date: '2026-12-25', title: 'Natal' }
  ];

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const [isModalOpen, setIsModalOpen] = useState(false);
  const initialFormState: Partial<Event> = {
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    type: 'EVENT',
    visibility: 'PUBLIC',
    status: 'ACTIVE'
  };

  const [formEvent, setFormEvent] = useState<Partial<Event>>(initialFormState);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormEvent(initialFormState);
    setIsModalOpen(true);
  };

  const handleEdit = (event: Event) => {
    setEditingId(event.id);
    setFormEvent({
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      location: event.location,
      type: event.type,
      visibility: event.visibility,
      status: event.status
    });
    setIsModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEvent.title || !formEvent.date) {
      alert('Título e Data são obrigatórios.');
      return;
    }

    try {
      const eventData: any = {
        title: formEvent.title,
        description: formEvent.description || '',
        date: formEvent.date,
        time: formEvent.time || '00:00',
        location: formEvent.location || 'Sede',
        type: formEvent.type || 'EVENT',
        visibility: formEvent.visibility || 'PUBLIC',
        status: formEvent.status || 'ACTIVE'
      };

      if (editingId) {
        await eventsService.update(editingId, eventData);
        alert('Evento atualizado com sucesso!');
      } else {
        await eventsService.create(eventData);
        notificationService.add({
          title: 'Novo Evento Criado',
          message: `${formEvent.title} agendado para ${new Date(formEvent.date).toLocaleDateString()}.`,
          type: 'EVENT',
          link: '/events'
        });
        alert('Evento criado com sucesso!');
      }

      await loadEvents();
      setIsModalOpen(false);
      setFormEvent(initialFormState);
      setEditingId(null);
    } catch (error: any) {
      console.error('Error saving event:', error);
      alert('Erro ao salvar evento: ' + (error.message || 'Verifique se todos os campos estão preenchidos corretamente.'));
    }
  };

  const handleFinish = async (event: Event) => {
    if (confirm(`Deseja marcar o evento "${event.title}" como concluído?`)) {
      try {
        await eventsService.update(event.id, { status: 'FINISHED' });
        loadEvents();
      } catch (error) {
        alert('Erro ao finalizar evento.');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja cancelar permanentemente este evento?')) {
      try {
        await eventsService.delete(id);
        loadEvents();
      } catch (error) {
        alert('Erro ao excluir evento.');
      }
    }
  };

  // Filter events based on role and visibility
  const visibleEvents = events.filter(e => {
    if (e.visibility === 'PUBLIC') return true;
    return user.role === UserRole.ADMIN || user.role === UserRole.SECRETARY;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {activeTab === 'calendar' ? (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Calendar Card */}
          <Card className="xl:col-span-3 p-0 border-slate-200 overflow-hidden shadow-xl shadow-slate-100 rounded-[2.5rem]">
             <div className="bg-slate-900 text-white p-8 flex justify-between items-center">
                <div>
                   <h2 className="text-3xl font-black uppercase tracking-tighter leading-none mb-1">
                     {currentDate.toLocaleDateString('pt-BR', { month: 'long' })}
                   </h2>
                   <p className="text-brand-400 font-black text-sm uppercase tracking-[0.3em] ml-0.5">{currentDate.getFullYear()}</p>
                </div>
                <div className="flex gap-2">
                   <button onClick={handlePrevMonth} className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-white/5">
                      <ChevronLeft size={24} />
                   </button>
                   <button onClick={handleNextMonth} className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-white/5">
                      <ChevronRight size={24} />
                   </button>
                </div>
             </div>

             <div className="p-8">
                <div className="grid grid-cols-7 gap-4 mb-4">
                   {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                      <div key={day} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest py-2">
                         {day}
                      </div>
                   ))}
                </div>

                <div className="grid grid-cols-7 gap-4">
                   {Array.from({ length: getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth()) }).map((_, i) => (
                      <div key={`empty-${i}`} className="h-28 rounded-2xl bg-slate-50 opacity-30" />
                   ))}
                   
                   {Array.from({ length: getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth()) }).map((_, i) => {
                      const day = i + 1;
                      const dayStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                      const dayEvents = events.filter(e => e.date === dayStr);
                      const dayHolidays = holidays.filter(h => h.date === dayStr);
                      const isToday = new Date().toISOString().split('T')[0] === dayStr;

                      return (
                         <div key={day} className={`h-28 rounded-3xl p-3 border group transition-all relative ${isToday ? 'bg-brand-50 border-brand-200 shadow-inner' : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-md'}`}>
                            <span className={`text-lg font-black ${isToday ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-900'}`}>{day}</span>
                            
                            <div className="mt-2 space-y-1 overflow-hidden">
                               {dayHolidays.map((h, idx) => (
                                  <div key={idx} className="bg-amber-100 text-amber-700 text-[8px] font-black uppercase px-2 py-0.5 rounded-full truncate border border-amber-200">
                                     {h.title}
                                  </div>
                               ))}
                               {dayEvents.map((e, idx) => (
                                  <div 
                                    key={idx} 
                                    onClick={(e) => { e.stopPropagation(); navigate('/events/list'); }}
                                    className={`cursor-pointer hover:scale-105 transition-all text-[8px] font-black uppercase px-2 py-0.5 rounded-full truncate border ${e.visibility === 'BOARD' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}
                                  >
                                     {e.title}
                                  </div>
                               ))}
                            </div>

                            {(dayEvents.length > 0 || dayHolidays.length > 0) && (
                               <div className="absolute top-3 right-3 flex gap-0.5">
                                  {dayHolidays.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                                  {dayEvents.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                               </div>
                            )}
                         </div>
                      );
                   })}
                </div>
             </div>
          </Card>

          {/* Sidebar: Month Insights */}
          <div className="space-y-6">
             {/* 1. Month Summary Card */}
             <Card className="p-6 border-slate-200 bg-slate-50/50 rounded-3xl">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                   <Clock size={16} /> Eventos e Feriados
                </h3>
                
                <div className="space-y-4">
                   {/* Holidays this month */}
                   {holidays.filter(h => {
                       const d = new Date(h.date + 'T12:00:00');
                       return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
                   }).map((h, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-amber-50 rounded-2xl border border-amber-100 shadow-sm">
                         <div className="w-10 h-10 bg-amber-400 text-white rounded-xl flex flex-col items-center justify-center">
                            <span className="text-xs font-black">{h.date.split('-')[2]}</span>
                            <span className="text-[8px] font-black uppercase">{new Date(h.date + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                         </div>
                         <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest line-clamp-1">{h.title}</p>
                            <p className="text-[8px] font-bold text-amber-600/70 uppercase tracking-widest">Feriado Nacional</p>
                         </div>
                      </div>
                   ))}

                   {/* Events this month */}
                   {events.filter(e => {
                       const d = new Date(e.date + 'T12:00:00');
                       return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
                   }).length === 0 && holidays.filter(h => {
                       const d = new Date(h.date + 'T12:00:00');
                       return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
                   }).length === 0 ? (
                      <div className="py-8 text-center bg-white/50 rounded-2xl border border-dashed border-slate-200">
                         <Info size={24} className="mx-auto text-slate-300 mb-2" />
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nenhuma atividade registrada</p>
                      </div>
                   ) : (
                      events.filter(e => {
                          const d = new Date(e.date + 'T12:00:00');
                          return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
                       }).map((e, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => navigate('/events/list')}
                          className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100 hover:shadow-md transition-all cursor-pointer group"
                        >
                           <div className={`w-10 h-10 text-white rounded-xl flex flex-col items-center justify-center transition-transform group-hover:scale-110 ${e.visibility === 'BOARD' ? 'bg-blue-600 shadow-lg shadow-blue-100' : 'bg-emerald-600 shadow-lg shadow-emerald-100'}`}>
                              <span className="text-xs font-black">{e.date.split('-')[2]}</span>
                              <span className="text-[8px] font-black uppercase">{new Date(e.date + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                           </div>
                           <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest line-clamp-1 leading-tight mb-0.5 group-hover:text-brand-600 transition-colors">{e.title}</p>
                              <div className="flex items-center gap-1">
                                 <MapPin size={8} className="text-brand-500" />
                                 <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest truncate">{e.location}</p>
                              </div>
                           </div>
                        </div>
                      ))
                   )}
                </div>
             </Card>

             {/* 2. Engagement Card */}
             <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl shadow-slate-200 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 text-white/10 transition-transform group-hover:scale-110 group-hover:rotate-12 duration-500">
                    <Users size={80} />
                </div>
                <div className="relative z-10">
                    <h4 className="text-white font-black uppercase tracking-tighter text-xl leading-none mb-1">Engajamento</h4>
                    <p className="text-slate-100 text-[10px] font-bold uppercase tracking-widest leading-relaxed opacity-90">
                       Ajude a planejar as atividades da associação sugerindo eventos à diretoria.
                    </p>
                </div>
             </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
        {loading ? (
          <div className="py-20 text-center text-slate-400 italic">Buscando agenda atualizada...</div>
        ) : visibleEvents.map((event) => (
          <Card key={event.id} className={`p-0 overflow-hidden hover:shadow-md transition-all border-slate-200 group ${event.status === 'FINISHED' ? 'opacity-75 bg-slate-50/50' : ''}`}>
            <div className="flex flex-col md:flex-row">
              <div className={`md:w-48 border-r border-slate-100 p-6 flex flex-col items-center justify-center text-center ${event.status === 'FINISHED' ? 'bg-slate-100' : 'bg-slate-50'}`}>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Data</p>
                <p className={`text-3xl font-black leading-none ${event.status === 'FINISHED' ? 'text-slate-400' : 'text-brand-600'}`}>
                  {new Date(event.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit' })}
                </p>
                <p className="text-sm font-bold text-slate-700 uppercase">
                  {new Date(event.date + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' })}
                </p>
                <Badge variant="neutral" className="mt-3 text-[10px] font-bold bg-white">{event.time}</Badge>
              </div>

              <div className="flex-1 p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`text-xl font-black transition-colors ${event.status === 'FINISHED' ? 'text-slate-500 line-through' : 'text-slate-900 group-hover:text-brand-600'}`}>
                        {event.title}
                      </h3>
                      {event.status === 'FINISHED' && (
                        <Badge variant="success" className="flex items-center gap-1">
                          <CheckCircle size={10} /> Concluído
                        </Badge>
                      )}
                      {event.visibility === 'BOARD' && (
                        <Badge variant="info" className="flex items-center gap-1 bg-blue-50 text-blue-600 border-blue-100">
                          <Shield size={10} /> Diretoria
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed max-w-2xl mt-1">{event.description}</p>
                  </div>
                  {canEdit && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 h-9"
                        onClick={() => handleFinish(event)}
                        title="Finalizar Evento"
                      >
                        <CheckCircle size={18} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-brand-600 border-brand-200 hover:bg-brand-50 h-9"
                        onClick={() => handleEdit(event)}
                        title="Editar Evento"
                      >
                        <Edit3 size={18} />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-500 h-9" onClick={() => handleDelete(event.id)} title="Excluir Evento">
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 pt-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                    <MapPin size={14} className="text-brand-500" /> {event.location}
                  </div>
                  <div className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg border ${event.visibility === 'BOARD' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                    {event.visibility === 'BOARD' ? (
                      <><Shield size={14} /> Apenas Diretoria</>
                    ) : (
                      <><Globe size={14} /> Aberto a Todos</>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {visibleEvents.length === 0 && !loading && (
          <div className="py-20 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
            <CalendarDays size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">Nenhum evento programado no momento.</p>
          </div>
        )}
      </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Editar Evento" : "Agendar Novo Evento"}>
        <form onSubmit={handleSaveEvent} className="space-y-4">
          <Input label="Título do Evento" placeholder="Ex: Treinamento NR35" value={formEvent.title} onChange={e => setFormEvent({ ...formEvent, title: e.target.value })} required />

          <div className="grid grid-cols-2 gap-4">
            <Input label="Data" type="date" value={formEvent.date} onChange={e => setFormEvent({ ...formEvent, date: e.target.value })} required />
            <Input label="Horário" type="time" value={formEvent.time} onChange={e => setFormEvent({ ...formEvent, time: e.target.value })} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Local" placeholder="Ex: Sede ABCUNA" value={formEvent.location} onChange={e => setFormEvent({ ...formEvent, location: e.target.value })} required />
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Visibilidade</label>
              <select
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-500"
                value={formEvent.visibility}
                onChange={e => setFormEvent({ ...formEvent, visibility: e.target.value as any })}
              >
                <option value="PUBLIC">Público (Todos)</option>
                <option value="BOARD">Restrito (Diretoria)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Descrição Breve</label>
            <textarea
              className="w-full h-24 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all resize-none"
              placeholder="Descreva o objetivo do evento..."
              value={formEvent.description}
              onChange={e => setFormEvent({ ...formEvent, description: e.target.value })}
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" className="shadow-lg shadow-brand-200">
              {editingId ? "Salvar Alterações" : "Publicar Evento"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
});
