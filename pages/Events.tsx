import React, { useState, useEffect } from 'react';
import { CalendarDays, MapPin, Clock, Plus, Users, Search, Trash2, Edit3, X, CheckSquare, CheckCircle, Shield, Globe } from 'lucide-react';
import { Card, Button, Input, Modal, Badge } from '../components/ui';
import { notificationService } from '../services/notifications';
import { eventsService } from '../services/events';
import { Event, User, UserRole } from '../types';

interface EventsPageProps {
  user: User;
}

export const EventsPage: React.FC<EventsPageProps> = ({ user }) => {
  const canEdit = [UserRole.ADMIN, UserRole.SECRETARY, UserRole.INSTRUCTOR].includes(user.role);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

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
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Erro ao salvar evento. Certifique-se de que todos os campos estão corretos.');
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Eventos e Convocações</h2>
          <p className="text-slate-500 text-sm">Agenda de atividades, treinamentos e solenidades oficiais.</p>
        </div>
        {canEdit && (
          <Button onClick={handleOpenCreate} className="flex items-center gap-2 shadow-lg shadow-brand-200">
            <Plus size={18} /> Criar Evento
          </Button>
        )}
      </div>

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
                      {event.status === 'ACTIVE' && (
                        <>
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
                        </>
                      )}
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
};