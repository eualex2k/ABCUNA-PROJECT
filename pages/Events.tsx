import React, { useState, useEffect } from 'react';
import { CalendarDays, MapPin, Clock, Plus, Users, Search, Trash2, Edit3, X, CheckSquare } from 'lucide-react';
import { Card, Button, Input, Modal, Badge } from '../components/ui';
import { notificationService } from '../services/notifications';
import { eventsService } from '../services/events';
import { Event, User, UserRole } from '../types';

interface EventsPageProps {
  user: User;
}

const INITIAL_EVENTS: Event[] = [];

export const EventsPage: React.FC<EventsPageProps> = ({ user }) => {
  const canEdit = [UserRole.ADMIN, UserRole.SECRETARY].includes(user.role);
  const [events, setEvents] = useState<Event[]>(INITIAL_EVENTS);
  const [loading, setLoading] = useState(true);

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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const initialFormState: Partial<Event> = {
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    type: 'EVENT',
    confirmed: 0
  };

  const [newEvent, setNewEvent] = useState<Partial<Event>>(initialFormState);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newEvent.title && newEvent.date) {
      try {
        const eventData: Omit<Event, 'id'> = {
          title: newEvent.title!,
          description: newEvent.description || '',
          date: newEvent.date!,
          time: newEvent.time || '00:00',
          location: newEvent.location || 'Sede',
          type: newEvent.type || 'EVENT',
          confirmed: newEvent.confirmed || 0
        };

        await eventsService.create(eventData);

        notificationService.add({
          title: 'Novo Evento Criado',
          message: `${newEvent.title} agendado para ${new Date(newEvent.date).toLocaleDateString()}.`,
          type: 'EVENT',
          link: '/events'
        });

        loadEvents();
        setIsModalOpen(false);
        setNewEvent(initialFormState);
      } catch (error) {
        alert('Erro ao criar evento.');
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Eventos e Convocações</h2>
          <p className="text-slate-500 text-sm">Agenda de atividades, treinamentos e solenidades oficiais.</p>
        </div>
        {canEdit && (
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 shadow-lg shadow-brand-200">
            <Plus size={18} /> Criar Evento
          </Button>
        )}
      </div>

      <div className="grid gap-6">
        {loading ? (
          <div className="py-20 text-center text-slate-400 italic">Buscando agenda atualizada...</div>
        ) : events.map((event) => (
          <Card key={event.id} className="p-0 overflow-hidden hover:shadow-md transition-all border-slate-200 group">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-48 bg-slate-50 border-r border-slate-100 p-6 flex flex-col items-center justify-center text-center">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Data</p>
                <p className="text-3xl font-black text-brand-600 leading-none">
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
                    <h3 className="text-xl font-black text-slate-900 group-hover:text-brand-600 transition-colors">{event.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed max-w-2xl mt-1">{event.description}</p>
                  </div>
                  {canEdit && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-500" onClick={() => handleDelete(event.id)}>
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 pt-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                    <MapPin size={14} className="text-brand-500" /> {event.location}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                    <Users size={14} className="text-blue-500" /> {event.confirmed} Participantes Confirmados
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                    <CheckSquare size={14} className="text-emerald-500" /> Evento Aberto p/ Inscrição
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {events.length === 0 && !loading && (
          <div className="py-20 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
            <CalendarDays size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">Nenhum evento programado no momento.</p>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Agendar Novo Evento ou Convocação">
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <Input label="Título do Evento" placeholder="Ex: Treinamento NR35" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Data" type="date" value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} required />
            <Input label="Horário" type="time" value={newEvent.time} onChange={e => setNewEvent({ ...newEvent, time: e.target.value })} required />
          </div>
          <Input label="Local" placeholder="Ex: Sede ABCUNA" value={newEvent.location} onChange={e => setNewEvent({ ...newEvent, location: e.target.value })} required />

          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Descrição Breve</label>
            <textarea
              className="w-full h-24 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all resize-none"
              placeholder="Descreva o objetivo do evento..."
              value={newEvent.description}
              onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" className="shadow-lg shadow-brand-200">Publicar Evento</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};