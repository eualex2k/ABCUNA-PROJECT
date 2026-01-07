import React, { useState } from 'react';
import { RefreshCcw, Calendar, User, Plus, MapPin, Clock, DollarSign, Users, FileText, CheckCircle2, Shield, HardHat, Edit, Trash2, CheckCircle, XCircle, AlertCircle, Loader2, UserCheck } from 'lucide-react';
import { Card, Button, Badge, Modal, Input, Avatar } from '../components/ui';
import { notificationService } from '../services/notifications';
import { scheduleService } from '../services/schedule';
import { Shift, User as ProfileUser, UserRole, ShiftMember, ShiftStatus } from '../types';

interface SchedulePageProps {
  user: ProfileUser;
}

const INITIAL_SHIFTS: Shift[] = [];

export const SchedulePage: React.FC<SchedulePageProps> = ({ user }) => {
  const canEdit = [UserRole.ADMIN, UserRole.SECRETARY].includes(user.role);
  const [shifts, setShifts] = useState<Shift[]>(INITIAL_SHIFTS);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    loadShifts();
  }, []);

  const loadShifts = async () => {
    try {
      setLoading(true);
      const data = await scheduleService.getAll();
      setShifts(data);
    } catch (error) {
      console.error('Failed to load shifts', error);
    } finally {
      setLoading(false);
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [editingShift, setEditingShift] = useState<Partial<Shift>>({});

  // Preview Modal States
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewMembers, setPreviewMembers] = useState<ShiftMember[]>([]);
  const [previewShiftId, setPreviewShiftId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

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
    date: new Date().toISOString().split('T')[0]
  };

  const [newShift, setNewShift] = useState<Partial<Shift>>(initialFormState);

  // --- CRUD Operations ---

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
          status: 'PENDING',
          location: newShift.location || 'Sede',
          startTime: newShift.startTime || '08:00',
          endTime: newShift.endTime || '20:00',
          amount: newShift.amount || 0,
          organizer: newShift.organizer || 'Administração',
          vacancies: newShift.vacancies || 5,
          members: [] // Starts empty
        };

        await scheduleService.create(shiftData);
        loadShifts();
        setIsModalOpen(false);
        setNewShift(initialFormState);
      } catch (error) {
        alert('Erro ao criar plantão.');
      }
    }
  };

  const handleUpdateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingShift.id && editingShift.team && editingShift.date) {
      try {
        const updatedData: Partial<Shift> = {
          ...editingShift,
          day: new Date(editingShift.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long' }),
          date: new Date(editingShift.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          fullDate: editingShift.date
        };
        await scheduleService.update(editingShift.id, updatedData);
        await loadShifts();
        setIsEditModalOpen(false);
      } catch (error) {
        alert('Erro ao atualizar plantão.');
      }
    }
  };

  const handleDeleteShift = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este plantão?')) {
      await scheduleService.delete(id);
      loadShifts();
    }
  };

  // --- Rotation / Preview Logic ---

  const handleGeneratePreview = async (shiftId: string) => {
    try {
      setIsGenerating(true);
      setPreviewShiftId(shiftId);
      const members = await scheduleService.generatePreview(shiftId);
      setPreviewMembers(members);
      setIsPreviewOpen(true);
    } catch (error) {
      console.log(error);
      alert('Erro ao gerar prévia da escala.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmScale = async () => {
    if (previewShiftId && previewMembers.length > 0) {
      try {
        setIsGenerating(true);
        // Update the shift with the previewed members
        await scheduleService.updateMembers(previewShiftId, previewMembers);

        // Update status to AWAITING_CONFIRMATION if not confirmed already
        await scheduleService.update(previewShiftId, { status: 'AWAITING_CONFIRMATION' });

        await loadShifts();
        setIsPreviewOpen(false);
        setPreviewShiftId(null);
        setPreviewMembers([]);
        notificationService.add({
          title: 'Escala Confirmada',
          message: 'Convocações enviadas com sucesso.',
          type: 'SCHEDULE'
        });
      } catch (error) {
        alert('Erro ao confirmar escala.');
      } finally {
        setIsGenerating(false);
      }
    }
  };

  // --- Volunteer / Member Actions ---

  const handleVolunteer = async (shift: Shift) => {
    if (confirm(`Solicitar inscrição no plantão "${shift.team}"? Sua solicitação precisará ser aprovada.`)) {
      try {
        await scheduleService.volunteer(shift.id, user.id, user.name, user.avatar);
        await loadShifts();
        alert('Solicitação enviada com sucesso! Aguarde aprovação.');
      } catch (error: any) {
        alert(error.message);
      }
    }
  };

  const handleApproveVolunteer = async (shift: Shift, memberId: string) => {
    try {
      const updatedMembers = shift.members.map(m => {
        if (m.userId === memberId) {
          return { ...m, status: 'CONFIRMED', type: 'VOLUNTEER' } as ShiftMember;
        }
        return m;
      });
      await scheduleService.updateMembers(shift.id, updatedMembers);
      await loadShifts();
    } catch (error) {
      alert('Erro ao aprovar voluntário.');
    }
  };

  const handleRejectVolunteer = async (shift: Shift, memberId: string) => {
    if (confirm("Rejeitar este voluntário?")) {
      try {
        const updatedMembers = shift.members.filter(m => m.userId !== memberId);
        await scheduleService.updateMembers(shift.id, updatedMembers);
        await loadShifts();
      } catch (error) {
        alert('Erro ao rejeitar voluntário.');
      }
    }
  };

  const handleRespondSummon = async (shiftId: string, accept: boolean) => {
    try {
      await scheduleService.respondToSummon(shiftId, user.id, accept);
      await loadShifts();
      if (isDetailsOpen) setIsDetailsOpen(false); // Close modal to refresh or show success
    } catch (error: any) {
      alert('Erro: ' + error.message);
    }
  };

  const handleFinalizeShift = async (shift: Shift) => {
    if (confirm(`ATENÇÃO: Deseja finalizar o plantão "${shift.team}"?\n\nIsso irá:\n1. Consolidar a lista de presença\n2. Incrementar o contador de plantões de quem participou\n3. Atualizar a data do último plantão\n\nEssa ação não pode ser desfeita.`)) {
      try {
        await scheduleService.finalizeShift(shift.id);
        await loadShifts();
        setIsDetailsOpen(false);
        alert('Plantão finalizado e estatísticas atualizadas com sucesso!');
      } catch (error: any) {
        alert('Erro: ' + error.message);
      }
    }
  };

  const getStatusColor = (status: ShiftStatus) => {
    switch (status) {
      case 'CONFIRMED': return 'success';
      case 'AWAITING_CONFIRMATION': return 'warning';
      case 'PENDING': return 'neutral';
      default: return 'neutral';
    }
  };

  const getMemberStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return <CheckCircle size={14} className="text-emerald-500" />;
      case 'AWAITING_CONFIRMATION':
      case 'PENDING': return <Clock size={14} className="text-amber-500 animate-pulse" />;
      case 'DECLINED': return <XCircle size={14} className="text-red-500" />;
      case 'VOLUNTEER_PENDING': return <UserCheck size={14} className="text-blue-500" />;
      default: return <Clock size={14} className="text-slate-300" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-end gap-3 mb-4">
        {canEdit && (
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 shadow-lg shadow-brand-200">
            <Plus size={18} /> Criar Plantão
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shifts.map((shift) => (
          <Card key={shift.id} className="p-0 overflow-hidden hover:shadow-lg transition-all border-slate-200 group">
            {/* Header Card */}
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
              <div className="flex items-center gap-2">
                <Badge variant={getStatusColor(shift.status)}>
                  {shift.status === 'CONFIRMED' ? 'Confirmado' : shift.status === 'AWAITING_CONFIRMATION' ? 'Em Confirmação' : 'Aberto'}
                </Badge>
                {canEdit && (
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingShift({ ...shift, date: shift.fullDate }); setIsEditModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg">
                      <Edit size={14} />
                    </button>
                    <button onClick={() => handleDeleteShift(shift.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <h3 className="font-black text-slate-900 text-lg uppercase">{shift.team}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 font-medium italic">
                  <Clock size={12} /> {shift.startTime} às {shift.endTime}
                </div>
              </div>

              {/* Admin Controls */}
              {canEdit && shift.status === 'PENDING' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-dashed border-slate-300 text-slate-500 hover:border-brand-300 hover:text-brand-600"
                  onClick={() => handleGeneratePreview(shift.id)}
                >
                  <RefreshCcw size={14} className="mr-2" /> Gerar Rodízio (Prévia)
                </Button>
              )}

              {/* Members List Preview (First 3) */}
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efetivo</span>
                  <span className="text-[10px] font-bold text-slate-500">{shift.members.filter(m => ['CONFIRMED', 'PENDING'].includes(m.status)).length} / {shift.vacancies}</span>
                </div>
                <div className="flex -space-x-2 overflow-hidden py-1">
                  {shift.members.slice(0, 5).map((m, i) => (
                    <div key={i} className="relative group/avatar">
                      <Avatar alt={m.name} fallback={m.name.substring(0, 2)} size="sm" className="ring-2 ring-white" />
                      <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                        {getMemberStatusIcon(m.status)}
                      </div>
                    </div>
                  ))}
                  {shift.members.length === 0 && <span className="text-xs text-slate-400 italic">Ninguém escalado</span>}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex gap-2">
                <Button variant="ghost" size="sm" className="flex-1 text-xs" onClick={() => { setSelectedShift(shift); setIsDetailsOpen(true); }}>
                  Ver Detalhes
                </Button>

                {/* Member Self-Actions */}
                {!canEdit && !shift.members.some(m => m.userId === user.id) && shift.status !== 'CONFIRMED' && (
                  <Button size="sm" className="flex-1 text-xs shadow-md shadow-brand-200" onClick={() => handleVolunteer(shift)}>
                    Solicitar Inscrição
                  </Button>
                )}

                {/* Confirm/Decline for summoned user */}
                {shift.members.some(m => m.userId === user.id && m.status === 'PENDING') && (
                  <div className="flex gap-1 flex-1">
                    <Button size="sm" variant="danger" className="flex-1 px-2" onClick={() => handleRespondSummon(shift.id, false)}><XCircle size={14} /></Button>
                    <Button size="sm" className="flex-1 px-2 bg-green-600 hover:bg-green-700" onClick={() => handleRespondSummon(shift.id, true)}><CheckCircle size={14} /></Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* --- MODALS --- */}

      {/* Preview Modal */}
      <Modal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} title="Prévia da Escala (Rodízio)" maxWidth="lg">
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-xl text-blue-800 text-sm flex items-start gap-3">
            <InfoIcon className="shrink-0 mt-0.5" size={16} />
            <div>
              <p className="font-bold">Modo de Prévia</p>
              <p>O sistema selecionou os associados abaixo baseado no histórico de plantões (quem trabalhou menos tem prioridade). Revise antes de confirmar.</p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl divide-y divide-slate-100">
            {previewMembers.map((m, i) => (
              <div key={i} className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar alt={m.name} fallback={m.name.substring(0, 2)} />
                  <div>
                    <p className="font-bold text-slate-800">{m.name}</p>
                    <p className="text-xs text-slate-500">Selecionado por Rodízio</p>
                  </div>
                </div>
                <Badge variant="neutral">Proposto</Badge>
              </div>
            ))}
            {previewMembers.length === 0 && <p className="p-4 text-center text-slate-400">Nenhum membro elegível encontrado.</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setIsPreviewOpen(false)}>Cancelar</Button>
            <Button onClick={handleConfirmScale} disabled={previewMembers.length === 0}>
              Confirmar e Enviar Convocações
            </Button>
          </div>
        </div>
      </Modal>

      {/* Details Modal */}
      <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="Detalhes do Plantão" maxWidth="lg">
        {selectedShift && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black uppercase text-slate-800">{selectedShift.team}</h3>
              <Badge>{selectedShift.status}</Badge>
            </div>

            {/* Member List Management */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-700">Equipe Escalada</h4>
              <div className="bg-slate-50 rounded-xl border border-slate-200 divide-y divide-slate-100">
                {selectedShift.members.map((m, i) => (
                  <div key={i} className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar alt={m.name} fallback={m.name.substring(0, 2)} />
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{m.name}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold text-slate-400">{m.type === 'ROTATION' ? 'Rodízio' : 'Voluntário'}</span>
                          {m.status === 'VOLUNTEER_PENDING' && <Badge variant="warning" className="text-[10px] py-0 px-1">Pendente Aprovação</Badge>}
                          {m.status === 'CONFIRMED' && <Badge variant="success" className="text-[10px] py-0 px-1">Confirmado</Badge>}
                          {m.status === 'DECLINED' && <Badge variant="danger" className="text-[10px] py-0 px-1">Recusou</Badge>}
                        </div>
                      </div>
                    </div>

                    {/* Actions for Admin */}
                    {canEdit && m.status === 'VOLUNTEER_PENDING' && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => handleRejectVolunteer(selectedShift, m.userId)}><XCircle size={16} /></Button>
                        <Button size="sm" variant="ghost" className="text-green-600" onClick={() => handleApproveVolunteer(selectedShift, m.userId)}><CheckCircle size={16} /></Button>
                      </div>
                    )}
                  </div>
                ))}
                {selectedShift.members.length === 0 && <p className="p-4 text-center text-slate-400 text-sm">Lista vazia.</p>}
              </div>
            </div>

            {/* Self Action inside Modal */}
            {selectedShift.members.find(m => m.userId === user.id)?.status === 'PENDING' && (
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-center">
                <p className="text-amber-800 font-bold mb-2">Você foi convocado para este plantão!</p>
                <div className="flex gap-2 justify-center">
                  <Button variant="danger" onClick={() => handleRespondSummon(selectedShift.id, false)}>Recusar</Button>
                  <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleRespondSummon(selectedShift.id, true)}>Confirmar Presença</Button>
                </div>
              </div>
            )}

            {/* Finalize Button for Admin */}
            {canEdit && selectedShift.status === 'CONFIRMED' && (
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <Button
                  onClick={() => handleFinalizeShift(selectedShift)}
                  className="bg-slate-900 text-white hover:bg-slate-800 shadow-xl"
                >
                  <Shield size={18} className="mr-2" /> Finalizar Plantão (Presidente)
                </Button>
              </div>
            )}

          </div>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Lançar Novo Plantão">
        <form onSubmit={handleCreateShift} className="space-y-4">
          <Input label="Título da Equipe" value={newShift.team} onChange={e => setNewShift({ ...newShift, team: e.target.value })} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Data" type="date" value={newShift.date} onChange={e => setNewShift({ ...newShift, date: e.target.value })} required />
            <Input label="Local" value={newShift.location} onChange={e => setNewShift({ ...newShift, location: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Início" type="time" value={newShift.startTime} onChange={e => setNewShift({ ...newShift, startTime: e.target.value })} required />
            <Input label="Fim" type="time" value={newShift.endTime} onChange={e => setNewShift({ ...newShift, endTime: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Vagas" type="number" value={newShift.vacancies} onChange={e => setNewShift({ ...newShift, vacancies: parseInt(e.target.value) })} required />
            <Input label="Valor (R$)" type="number" value={newShift.amount} onChange={e => setNewShift({ ...newShift, amount: parseFloat(e.target.value) })} />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Criar</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal (Simplified logic similar to create) */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Plantão">
        <form onSubmit={handleUpdateShift} className="space-y-4">
          <Input label="Título" value={editingShift.team} onChange={e => setEditingShift({ ...editingShift, team: e.target.value })} />
          {/* ... simplified for brevity, similar fields ... */}
          <div className="flex justify-end gap-2">
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

// Helper Icon
const InfoIcon = ({ size, className }: { size?: number, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
);