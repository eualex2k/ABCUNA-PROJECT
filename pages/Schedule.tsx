import React, { useState } from 'react';
import { RefreshCcw, Calendar, User, Plus, MapPin, Clock, DollarSign, Users, FileText, CheckCircle2, Shield, HardHat } from 'lucide-react';
import { Card, Button, Badge, Modal, Input, Avatar } from '../components/ui';
import { notificationService } from '../services/notifications';
import { scheduleService } from '../services/schedule';
import { Shift, User as ProfileUser, UserRole } from '../types';

interface SchedulePageProps {
  user: ProfileUser;
}

const INITIAL_SHIFTS: Shift[] = [];

export const SchedulePage: React.FC<SchedulePageProps> = ({ user }) => {
  const canEdit = [UserRole.ADMIN, UserRole.SECRETARY].includes(user.role);
  const [shifts, setShifts] = useState<Shift[]>(INITIAL_SHIFTS);

  React.useEffect(() => {
    loadShifts();
  }, []);

  const loadShifts = async () => {
    try {
      const data = await scheduleService.getAll();
      setShifts(data);
    } catch (error) {
      console.error('Failed to load shifts', error);
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

  const initialFormState: Partial<Shift> = {
    team: '',
    leader: '',
    status: 'PENDING',
    location: '',
    startTime: '08:00',
    endTime: '20:00',
    amount: 0,
    organizer: 'Administração',
    vacancies: 5,
    date: new Date().toISOString().split('T')[0] // Default to today
  };

  const [newShift, setNewShift] = useState<Partial<Shift>>(initialFormState);

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newShift.team && newShift.date) {
      try {
        const shiftData: Omit<Shift, 'id'> = {
          day: new Date(newShift.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long' }),
          date: new Date(newShift.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          fullDate: newShift.date,
          team: newShift.team!,
          leader: newShift.leader || 'A definir',
          status: newShift.status || 'PENDING',
          location: newShift.location || 'Sede',
          startTime: newShift.startTime || '08:00',
          endTime: newShift.endTime || '20:00',
          amount: newShift.amount || 0,
          organizer: newShift.organizer || 'Administração',
          vacancies: newShift.vacancies || 5,
          confirmedMembers: []
        };

        await scheduleService.create(shiftData);

        loadShifts();
        setIsModalOpen(false);
        setNewShift(initialFormState);
      } catch (error) {
        console.error('Create shift error:', error);
        alert('Erro ao criar plantão. Verifique os dados e tente novamente.');
      }
    }
  };

  const handleGenerate = async () => {
    if (confirm('Gerar escala automática com base na disponibilidade dos associados?')) {
      try {
        await scheduleService.generateAuto();
        loadShifts();
      } catch (error) {
        alert('Erro ao gerar escala.');
      }
    }
  };

  const handleJoinShift = async (shiftId: string) => {
    try {
      if (user) {
        await scheduleService.join(shiftId, user.name);
        loadShifts();

        notificationService.add({
          title: 'Inscrição em Plantão',
          message: `Você se inscreveu no plantão de ${shifts.find(s => s.id === shiftId)?.team}.`,
          type: 'SCHEDULE',
          link: '/schedule'
        });
      }
    } catch (error) {
      alert('Erro ao se inscrever no plantão.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Escala Operacional</h2>
          <p className="text-slate-500 text-sm">Visualização de plantões, eventos extras e escalas ordinárias.</p>
        </div>
        {canEdit && (
          <div className="flex gap-3">
            <Button variant="outline" className="flex items-center gap-2" onClick={handleGenerate}>
              <RefreshCcw size={18} /> Gerar Escala Automática
            </Button>
            <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 shadow-lg shadow-brand-200">
              <Plus size={18} /> Criar Plantão
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shifts.map((shift) => (
          <Card key={shift.id} className="p-0 overflow-hidden hover:shadow-lg transition-all border-slate-200 group">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Calendar size={18} className="text-brand-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{shift.day}</p>
                  <p className="font-bold text-slate-700">{shift.date}</p>
                </div>
              </div>
              <Badge variant={shift.status === 'CONFIRMED' ? 'success' : 'warning'}>
                {shift.status === 'CONFIRMED' ? 'Confirmado' : 'Aberto'}
              </Badge>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <h3 className="font-black text-slate-900 text-lg group-hover:text-brand-600 transition-colors uppercase">{shift.team}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 font-medium italic">
                  <Clock size={12} /> {shift.startTime} às {shift.endTime} (12h)
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">Localização</p>
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-700">
                    <MapPin size={12} className="text-brand-500" /> {shift.location}
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">Remuneração</p>
                  <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-600">
                    <DollarSign size={12} /> R$ {shift.amount.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efetivo Confirmado</p>
                  <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">
                    {shift.confirmedMembers.length}/{shift.vacancies}
                  </span>
                </div>
                <div className="flex -space-x-2">
                  {shift.confirmedMembers.slice(0, 4).map((m, i) => (
                    <Avatar key={i} alt={m} fallback={m.substring(0, 2)} size="sm" className="ring-2 ring-white" />
                  ))}
                  {shift.confirmedMembers.length > 4 && (
                    <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500 ring-2 ring-white">
                      +{shift.confirmedMembers.length - 4}
                    </div>
                  )}
                  {shift.confirmedMembers.length === 0 && <p className="text-[10px] text-slate-400 italic">Vagas abertas...</p>}
                </div>
              </div>

              <div className="pt-4 flex gap-2">
                <Button variant="ghost" size="sm" className="flex-1 text-xs" onClick={() => { setSelectedShift(shift); setIsDetailsOpen(true); }}>
                  Ver Detalhes
                </Button>
                {shift.confirmedMembers.includes(user.name) ? (
                  <Button disabled size="sm" className="flex-1 text-xs bg-emerald-50 text-emerald-600 border-emerald-100">
                    Inscrito
                  </Button>
                ) : (
                  <Button size="sm" className="flex-1 text-xs shadow-md shadow-brand-200" onClick={() => handleJoinShift(shift.id)}>
                    Inscrever-se
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}

        {shifts.length === 0 && (
          <div className="col-span-full py-12 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
            <RefreshCcw size={48} className="mx-auto text-slate-300 mb-3 animate-spin-slow" />
            <p className="text-slate-500">Nenhum plantão em aberto no momento.</p>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Lançar Novo Plantão Operacional">
        <form onSubmit={handleCreateShift} className="space-y-4">
          <Input label="Título da Equipe / Evento" placeholder="Ex: Equipe de Resgate Bravo" value={newShift.team} onChange={e => setNewShift({ ...newShift, team: e.target.value })} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Data" type="date" value={newShift.date} onChange={e => setNewShift({ ...newShift, date: e.target.value })} required />
            <Input label="Localização" placeholder="Ex: Sede ou Evento X" value={newShift.location} onChange={e => setNewShift({ ...newShift, location: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Hora Início" type="time" value={newShift.startTime} onChange={e => setNewShift({ ...newShift, startTime: e.target.value })} required />
            <Input label="Hora Fim" type="time" value={newShift.endTime} onChange={e => setNewShift({ ...newShift, endTime: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Valor da Diária (R$)" type="number" step="0.01" value={newShift.amount} onChange={e => setNewShift({ ...newShift, amount: parseFloat(e.target.value) })} required />
            <Input label="Vagas Totais" type="number" value={newShift.vacancies} onChange={e => setNewShift({ ...newShift, vacancies: parseInt(e.target.value) })} required />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Publicar Escala</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="Informações Detalhadas do Plantão" maxWidth="lg">
        {selectedShift && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="p-3 bg-white rounded-xl shadow-sm">
                <Calendar size={24} className="text-brand-600" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 leading-none mb-1 uppercase">{selectedShift.team}</h3>
                <Badge variant={selectedShift.status === 'CONFIRMED' ? 'success' : 'warning'}>
                  {selectedShift.status === 'CONFIRMED' ? 'Escala Fechada' : 'Aguardando Efetivo'}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white border border-slate-100 rounded-xl space-y-1">
                <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest"><Clock size={12} /> Horário</div>
                <p className="text-sm font-bold text-slate-700">{selectedShift.startTime} às {selectedShift.endTime}</p>
              </div>
              <div className="p-4 bg-white border border-slate-100 rounded-xl space-y-1">
                <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest"><MapPin size={12} /> Local</div>
                <p className="text-sm font-bold text-slate-700">{selectedShift.location}</p>
              </div>
              <div className="p-4 bg-white border border-slate-100 rounded-xl space-y-1">
                <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest"><Shield size={12} /> Organizador</div>
                <p className="text-sm font-bold text-slate-700">{selectedShift.organizer}</p>
              </div>
              <div className="p-4 bg-white border border-slate-100 rounded-xl space-y-1">
                <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest"><DollarSign size={12} /> Ajuda de Custo</div>
                <p className="text-sm font-bold text-emerald-600">R$ {selectedShift.amount.toFixed(2)}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <HardHat size={14} /> Equipe Escalada ({selectedShift.confirmedMembers.length}/{selectedShift.vacancies})
              </h4>
              <div className="bg-slate-50 rounded-xl border border-slate-100 divide-y divide-slate-200 overflow-hidden">
                {selectedShift.confirmedMembers.map((m, i) => (
                  <div key={i} className="px-4 py-3 flex items-center justify-between group hover:bg-white transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar alt={m} fallback={m.substring(0, 2)} size="sm" />
                      <span className="text-sm font-bold text-slate-700">{m}</span>
                    </div>
                    <Badge variant="neutral" className="text-[10px] opacity-0 group-hover:opacity-100">Confirmado</Badge>
                  </div>
                ))}
                {selectedShift.confirmedMembers.length < selectedShift.vacancies && (
                  <div className="px-4 py-4 text-center">
                    <p className="text-xs text-slate-400 italic font-medium">Restam {selectedShift.vacancies - selectedShift.confirmedMembers.length} vagas de pronto emprego...</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setIsDetailsOpen(false)}>Fechar</Button>
              {!selectedShift.confirmedMembers.includes(user.name) && (
                <Button className="flex-1 shadow-lg shadow-brand-200" onClick={() => handleJoinShift(selectedShift.id)}>Confirmar Presença</Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};