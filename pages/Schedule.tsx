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
      
      // Notificar o voluntário sobre a aprovação
      await notificationService.add({
        title: 'Inscrição Aprovada!',
        message: `Sua solicitação para entrar no plantão "${shift.team}" foi aprovada.`,
        type: 'SCHEDULE',
        link: '/events/schedule',
        targetUserIds: [memberId]
      });

      await loadShifts();
      alert('Voluntário aprovado com sucesso!');
    } catch (error) {
      alert('Erro ao aprovar voluntário.');
    }
  };

  const handleRejectVolunteer = async (shift: Shift, memberId: string) => {
    if (confirm("Rejeitar este voluntário?")) {
      try {
        const updatedMembers = shift.members.filter(m => m.userId !== memberId);
        await scheduleService.updateMembers(shift.id, updatedMembers);
        
        // Notificar o voluntário sobre a rejeição
        await notificationService.add({
          title: 'Pedido de Inscrição',
          message: `Infelizmente sua solicitação para o plantão "${shift.team}" não foi aceita desta vez.`,
          type: 'SCHEDULE',
          targetUserIds: [memberId]
        });

        await loadShifts();
        alert('Solicitação rejeitada.');
      } catch (error) {
        alert('Erro ao rejeitar voluntário.');
      }
    }
  };

  const handleRespondSummon = async (shiftId: string, accept: boolean) => {
    const action = accept ? 'CONFIRMAR presença' : 'RECUSAR esta convocação';
    if (!confirm(`Deseja realmente ${action}?`)) return;

    try {
      await scheduleService.respondToSummon(shiftId, user.id, accept);
      await loadShifts();
      alert(accept ? 'Escala confirmada com sucesso!' : 'Convocação recusada. O administrador será notificado.');
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
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">{shift.day}</p>
                  <p className="font-bold text-slate-700 tracking-tight">{shift.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getStatusColor(shift.status)}>
                  {shift.status === 'CONFIRMED' ? 'Confirmado' : shift.status === 'AWAITING_CONFIRMATION' ? 'Em Confirmação' : 'Aberto'}
                </Badge>
                {shift.members.some(m => m.status === 'VOLUNTEER_PENDING') && (
                  <Badge variant="info" className="animate-pulse bg-blue-500 text-white border-none font-black text-[10px]">
                    SOLICITAÇÃO
                  </Badge>
                )}
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
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-2 font-bold uppercase tracking-widest">
                  <Clock size={12} className="text-brand-500" strokeWidth={3} /> {shift.startTime} <span className="text-slate-300">|</span> {shift.endTime}
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
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Equipe</span>
                  <div className="flex items-center gap-1.5">
                    {shift.members.some(m => m.status === 'VOLUNTEER_PENDING') && (
                      <span className="text-[9px] font-black text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 flex items-center gap-1">
                        <UserCheck size={10} /> {shift.members.filter(m => m.status === 'VOLUNTEER_PENDING').length} PENDENTE
                      </span>
                    )}
                    <span className="text-[10px] font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {shift.members.filter(m => ['CONFIRMED', 'PENDING'].includes(m.status)).length} / {shift.vacancies}
                    </span>
                  </div>
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
                <Button 
                  variant={shift.members.some(m => m.status === 'VOLUNTEER_PENDING') ? "primary" : "ghost"} 
                  size="sm" 
                  className={`flex-1 text-xs ${shift.members.some(m => m.status === 'VOLUNTEER_PENDING') ? 'shadow-md shadow-blue-200 bg-blue-600 hover:bg-blue-700' : ''}`} 
                  onClick={() => { setSelectedShift(shift); setIsDetailsOpen(true); }}
                >
                  {shift.members.some(m => m.status === 'VOLUNTEER_PENDING') ? 'Resolver Solicitação' : 'Ver Detalhes'}
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

      <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="Gestão Detalhada do Plantão" maxWidth="2xl">
        {selectedShift && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            {/* 1. Header & Quick Status Dashboard */}
            <div className="bg-slate-900 rounded-2xl p-6 text-white overflow-hidden relative shadow-xl">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Shield size={120} />
               </div>
               
               <div className="relative z-10">
                 <div className="flex justify-between items-start mb-4">
                   <div>
                     <Badge variant={getStatusColor(selectedShift.status)} className="mb-2 font-black uppercase tracking-widest text-[9px] px-3 py-1">
                       {selectedShift.status === 'CONFIRMED' ? 'Escala Fechada' : selectedShift.status === 'AWAITING_CONFIRMATION' ? 'Em Confirmação' : 'Aberto para Inscrição'}
                     </Badge>
                     <h3 className="text-2xl font-black uppercase tracking-tight leading-none mb-1">{selectedShift.team}</h3>
                     <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                       <MapPin size={14} className="text-red-500" /> {selectedShift.location}
                     </div>
                   </div>
                   <div className="text-right">
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Valor do Plantão</p>
                     <p className="text-2xl font-black text-emerald-400">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedShift.amount || 0)}</p>
                   </div>
                 </div>

                 <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                    <div className="text-center">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Vagas</p>
                      <p className="text-xl font-black">{selectedShift.vacancies}</p>
                    </div>
                    <div className="text-center border-x border-white/10 px-2">
                       <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Confirmados</p>
                       <p className="text-xl font-black text-emerald-400">{selectedShift.members.filter(m => m.status === 'CONFIRMED').length}</p>
                    </div>
                    <div className="text-center">
                       <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Pendentes</p>
                       <p className="text-xl font-black text-amber-400">{selectedShift.members.filter(m => ['PENDING', 'VOLUNTEER_PENDING'].includes(m.status)).length}</p>
                    </div>
                 </div>
               </div>
            </div>

            {/* 2. Main Logic: Self Action for User */}
            {selectedShift.members.find(m => m.userId === user.id)?.status === 'PENDING' && (
              <div className="p-5 bg-amber-50 border-2 border-dashed border-amber-200 rounded-2xl text-center shadow-sm">
                 <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                   <AlertCircle className="text-amber-600" size={24} />
                 </div>
                 <h4 className="font-black text-amber-900 uppercase text-sm mb-1 text-center">Convocação Pendente!</h4>
                 <p className="text-xs text-amber-700 font-medium mb-4 text-center">Você foi selecionado pelo sistema de rodízio para este plantão.</p>
                 <div className="flex gap-3 justify-center">
                    <Button variant="ghost" className="bg-white border-amber-200 text-amber-700 hover:bg-amber-100" onClick={() => handleRespondSummon(selectedShift.id, false)}>Recusar</Button>
                    <Button className="bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-200 min-w-[120px]" onClick={() => handleRespondSummon(selectedShift.id, true)}>Aceitar Agora</Button>
                 </div>
              </div>
            )}

            {/* 3. Members Management Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* Left: Confirmed Members */}
               <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-500" /> Confirmados
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400">{selectedShift.members.filter(m => m.status === 'CONFIRMED').length} membros</span>
                  </div>
                  
                  <div className="bg-slate-50 rounded-2xl border border-slate-100 divide-y divide-slate-100 overflow-hidden min-h-[100px]">
                    {selectedShift.members.filter(m => m.status === 'CONFIRMED').map((m, i) => (
                      <div key={i} className="p-3 flex items-center justify-between group hover:bg-white transition-colors">
                        <div className="flex items-center gap-3">
                           <Avatar alt={m.name} fallback={m.name.substring(0, 2)} size="sm" />
                           <div>
                             <p className="text-sm font-bold text-slate-800">{m.name}</p>
                             <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                               {m.type === 'ROTATION' ? 'Convocado' : 'Voluntário'}
                             </p>
                           </div>
                        </div>
                        <Badge variant="success" className="text-[8px] h-5">Ativo</Badge>
                      </div>
                    ))}
                    {selectedShift.members.filter(m => m.status === 'CONFIRMED').length === 0 && (
                      <div className="p-8 text-center text-slate-400 flex flex-col items-center">
                        <Users size={24} className="opacity-20 mb-2" />
                        <p className="text-[10px] font-black uppercase">Nenhum confirmado</p>
                      </div>
                    )}
                  </div>
               </div>

               {/* Right: Pending/Volunteers */}
               <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                       <Clock size={16} className="text-amber-500" /> Aguardando
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400">{selectedShift.members.filter(m => ['PENDING', 'VOLUNTEER_PENDING'].includes(m.status)).length} pendentes</span>
                  </div>

                  <div className="bg-slate-50 rounded-2xl border border-slate-100 divide-y divide-slate-100 overflow-hidden min-h-[100px]">
                     {selectedShift.members.filter(m => ['PENDING', 'VOLUNTEER_PENDING', 'DECLINED'].includes(m.status)).map((m, i) => (
                       <div key={i} className={`p-3 flex items-center justify-between group ${m.status === 'DECLINED' ? 'bg-rose-50/30' : 'hover:bg-white'} transition-colors`}>
                          <div className="flex items-center gap-3">
                             <div className="relative">
                               <Avatar alt={m.name} fallback={m.name.substring(0, 2)} size="sm" className={m.status === 'DECLINED' ? 'opacity-50 grayscale' : ''} />
                               <div className="absolute -bottom-1 -right-1">
                                 {getMemberStatusIcon(m.status)}
                               </div>
                             </div>
                             <div>
                               <p className={`text-sm font-bold ${m.status === 'DECLINED' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{m.name}</p>
                               <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                                 {m.status === 'VOLUNTEER_PENDING' ? 'Solicitou Vaga' : m.status === 'DECLINED' ? 'Recusou' : 'Aguardando'}
                               </p>
                             </div>
                          </div>

                          {/* Approval Actions for Admin */}
                          {canEdit && m.status === 'VOLUNTEER_PENDING' && (
                             <div className="flex gap-1.5 animate-in slide-in-from-right-2">
                                <button 
                                  onClick={() => handleRejectVolunteer(selectedShift, m.userId)}
                                  className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                                  title="Rejeitar"
                                >
                                   <Trash2 size={14} />
                                </button>
                                <button 
                                  onClick={() => handleApproveVolunteer(selectedShift, m.userId)}
                                  className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                  title="Aprovar"
                                >
                                   <CheckCircle size={14} />
                                </button>
                             </div>
                          )}
                       </div>
                     ))}
                     {selectedShift.members.filter(m => ['PENDING', 'VOLUNTEER_PENDING', 'DECLINED'].includes(m.status)).length === 0 && (
                        <div className="p-8 text-center text-slate-400 flex flex-col items-center">
                          <CheckCircle size={24} className="opacity-20 mb-2" />
                          <p className="text-[10px] font-black uppercase">Tudo resolvido</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>

            {/* 4. Footer Activity & Admin Controls */}
            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
               <div className="flex items-center gap-2 text-slate-400">
                  <Clock size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Horário: {selectedShift.startTime} às {selectedShift.endTime}</span>
               </div>
               
               <div className="flex gap-3 w-full sm:w-auto">
                 {canEdit && selectedShift.status === 'CONFIRMED' && (
                    <Button
                      onClick={() => handleFinalizeShift(selectedShift)}
                      className="flex-1 sm:flex-none h-11 bg-slate-900 hover:bg-black text-white px-6 shadow-xl shadow-slate-200"
                    >
                      <Shield size={18} className="mr-2" /> Finalizar Plantão
                    </Button>
                 )}
                 <Button variant="outline" className="flex-1 sm:flex-none h-11 px-8 rounded-xl" onClick={() => setIsDetailsOpen(false)}>Fechar Janela</Button>
               </div>
            </div>
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