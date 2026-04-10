import React, { useState } from 'react';
import { RefreshCcw, Calendar, User, Plus, MapPin, Clock, DollarSign, Users, FileText, CheckCircle2, Shield, HardHat, Edit, Trash2, CheckCircle, XCircle, AlertCircle, Loader2, UserCheck, Check, Eye, UserPlus } from 'lucide-react';
import { Card, Button, Badge, Modal, Input, Avatar } from '../components/ui';
import { notificationService } from '../services/notifications';
import { scheduleService } from '../services/schedule';
import { Shift, User as ProfileUser, UserRole, ShiftMember, ShiftStatus } from '../types';
import { supabase } from '../lib/supabase';
import { Search, Info } from 'lucide-react';

interface SchedulePageProps {
  user: ProfileUser;
}

const INITIAL_SHIFTS: Shift[] = [];

export interface SchedulePageRef {
  openCreateModal: () => void;
}

export const SchedulePage = React.forwardRef<SchedulePageRef, SchedulePageProps>(({ user }, ref) => {

  const canEdit = [UserRole.ADMIN, UserRole.SECRETARY].includes(user.role);
  const [shifts, setShifts] = useState<Shift[]>(INITIAL_SHIFTS);
  const [loading, setLoading] = useState(false);

  const [directors, setDirectors] = React.useState<{id: string, name: string}[]>([]);

  React.useEffect(() => {
    loadShifts();
    loadDirectors();

    // Configurar Realtime
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Escutar todos os eventos (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'schedules'
        },
        (payload) => {
          console.log('Mudança detectada no banco de dados:', payload);
          loadShifts(true); // Recarregar dados em background sem mostrar o "Carregando"
        }
      )
      .subscribe((status) => {
        console.log('Status do Canal Realtime:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadDirectors = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('role', [UserRole.ADMIN, UserRole.SECRETARY, UserRole.FINANCIAL, UserRole.INSTRUCTOR])
        .eq('status', 'ACTIVE');
      
      if (data) {
        const sorted = data
          .map(d => ({ id: d.id, name: d.full_name }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setDirectors(sorted);
      }
    } catch (error) {
      console.error('Error loading directors:', error);
    }
  };

  const loadShifts = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await scheduleService.getAll();
      setShifts(data);
      
      // Se houver um plantão selecionado no modal, atualiza ele também com os dados novos
      setSelectedShift(prev => {
        if (!prev) return null;
        const fresh = data.find(s => s.id === prev.id);
        return fresh || prev;
      });

      return data;
    } catch (error) {
      console.error('Failed to load shifts', error);
    } finally {
      if (!silent) setLoading(false);
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
    amount: undefined,
    organizer: '',
    vacancies: undefined,
    fullDate: new Date().toISOString().split('T')[0],
    description: ''
  };

  const [newShift, setNewShift] = useState<Partial<Shift>>(initialFormState);

  // --- CRUD Operations ---

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await scheduleService.create(newShift as any);
      setIsModalOpen(false);
      setNewShift(initialFormState);
      loadShifts();
      alert('Plantão lançado com sucesso!');
    } catch (error) {
      alert('Erro ao criar plantão.');
    }
  };

  const handleUpdateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingShift && editingShift.id) {
      try {
        await scheduleService.update(editingShift.id, editingShift);
        setIsEditModalOpen(false);
        setEditingShift({}); // Clear state
        loadShifts();
        alert('Plantão atualizado com sucesso!');
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
      if (user.role !== UserRole.ADMIN) {
        alert('Apenas o Presidente pode aprovar solicitações.');
        return;
      }
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
    if (user.role !== UserRole.ADMIN) {
      alert('Apenas o Presidente pode recusar solicitações.');
      return;
    }
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
      
      // LOGICA DE LIDER: Se o líder recusar, troca automaticamente por outro diretor
      const isLeader = selectedShift && user.name.trim().toLowerCase() === (selectedShift.leader || '').trim().toLowerCase();
      
      if (!accept && isLeader) {
        const otherDirectors = directors.filter(d => d.name.trim().toLowerCase() !== user.name.trim().toLowerCase());
        if (otherDirectors.length > 0) {
          const nextLeader = otherDirectors[Math.floor(Math.random() * otherDirectors.length)]; // Seleção aleatória entre outros diretores
          await scheduleService.update(shiftId, { leader: nextLeader.name });
          
          // Notificar o novo líder
          await notificationService.add({
            title: 'Convocado como Líder (Substituição)',
            message: `O líder anterior recusou. Você foi designado como o novo líder para "${selectedShift.team}" em ${selectedShift.date}.`,
            type: 'SCHEDULE',
            link: '/events/schedule',
            targetUserIds: [nextLeader.id]
          });

          alert(`Você recusou a liderança. O diretor ${nextLeader.name} foi notificado para assumir.`);
        } else {
          await scheduleService.update(shiftId, { leader: '' });
          alert('Você recusou a liderança. Sem outros diretores, o cargo ficou vago.');
        }
      } else if (accept && isLeader) {
         // Quando o líder aceita, o plantão sai do estado de aguardando confirmação
         const nextStatus = selectedShift.members.filter(m => m.status === 'CONFIRMED').length >= selectedShift.vacancies ? 'CONFIRMED' : 'OPEN';
         await scheduleService.update(shiftId, { status: nextStatus });
         alert('Liderança confirmada! O plantão agora está aberto para preenchimento.');
      } else {
        alert(accept ? 'Escala confirmada com sucesso!' : 'Convocação recusada.');
      }

      await loadShifts();
      setIsDetailsOpen(false); // Fecha o modal para forçar o sumiço do botão e refresh
      setSelectedShift(null);
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
            <Plus size={18} /> 
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 scrollbar-hide">
        {shifts.map((shift) => (
          <Card key={shift.id} className="p-0 overflow-hidden hover:shadow-2xl transition-all duration-300 border-slate-200 group flex flex-col h-full bg-white rounded-3xl">
            {/* Sleek Header: Integrated Date & Status */}
            <div className="p-6 pb-0 flex items-start justify-between">
              <div className="flex gap-4 items-center">
                <div className="bg-slate-900 text-white w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-lg shadow-slate-200">
                  <span className="text-[10px] font-black uppercase tracking-tighter opacity-60 leading-none mb-1">{shift.date.split('/')[0]}</span>
                  <span className="text-xl font-black leading-none">{shift.date.split('/')[1]}</span>
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-2xl uppercase leading-none tracking-tighter mb-1">{shift.team}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{shift.dayOfWeek}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant={getStatusColor(shift.status)} className="px-4 py-1.5 font-black text-[9px] uppercase tracking-widest border-none shadow-sm">
                  {shift.status === 'CONFIRMED' ? 'Escala Fechada' : shift.status === 'AWAITING_CONFIRMATION' ? 'Confirmação' : 'Vagas Abertas'}
                </Badge>
                {canEdit && (
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingShift({ ...shift, date: shift.fullDate }); setIsEditModalOpen(true); }} className="hover:scale-110 transition-transform text-slate-300 hover:text-brand-600">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDeleteShift(shift.id)} className="hover:scale-110 transition-transform text-slate-300 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Detailed Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 flex items-center gap-3 group hover:border-slate-200 transition-colors">
                  <Clock size={16} className="text-slate-400 group-hover:text-brand-500 transition-colors" />
                  <span className="text-[11px] font-black text-slate-600 uppercase tracking-tight">{shift.startTime} <span className="text-slate-300 mx-0.5">•</span> {shift.endTime}</span>
                </div>
                
                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 flex items-center gap-3 group hover:border-slate-200 transition-colors">
                  <DollarSign size={16} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
                  <span className="text-[11px] font-black text-slate-600 uppercase tracking-tight">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(shift.amount || 0)}</span>
                </div>

                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 flex items-center gap-3 group hover:border-slate-200 transition-colors">
                  <Shield size={16} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
                  <span className="text-[11px] font-black text-slate-600 uppercase tracking-tight truncate">LDR: {shift.leader ? shift.leader.split(' ')[0] : '---'}</span>
                </div>

                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 flex items-center gap-3 group hover:border-slate-200 transition-colors">
                  <MapPin size={16} className="text-slate-400 group-hover:text-red-500 transition-colors" />
                  <span className="text-[11px] font-black text-slate-600 uppercase tracking-tight truncate">{shift.location || 'Local a definir'}</span>
                </div>
              </div>

              {/* Recruitment Progress Section */}
              <div className="relative pt-2">
                <div className="flex justify-between items-end mb-3">
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Escalados</span>
                     <div className="flex -space-x-3">
                        {shift.leader && <Avatar size="sm" alt={shift.leader} fallback={shift.leader.substring(0,2)} className="ring-2 ring-white border border-amber-400 shadow-md" />}
                        {shift.members.filter(m => m.status === 'CONFIRMED').slice(0, 5).map((m, i) => (
                          <Avatar key={i} size="sm" alt={m.name} fallback={m.name.substring(0,2)} className="ring-2 ring-white shadow-md" />
                        ))}
                     </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-slate-400 block mb-0.5 uppercase tracking-widest">Capacidade</span>
                    <span className="text-lg font-black text-slate-900 leading-none">
                      {shift.members.filter(m => m.status === 'CONFIRMED').length + (shift.leader ? 1 : 0)}
                      <span className="text-slate-300 mx-1">/</span>
                      {shift.vacancies}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner flex">
                   <div 
                     className="bg-slate-900 h-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,0,0,0.1)]"
                     style={{ width: `${Math.min(100, (((shift.members.filter(m => m.status === 'CONFIRMED').length + (shift.leader ? 1 : 0)) / shift.vacancies) * 100))}%` }}
                   />
                </div>
              </div>

              {/* Footer Button */}
              <Button 
                className={`w-full h-14 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] ${
                  shift.members.some(m => m.status === 'VOLUNTEER_PENDING')
                  ? 'bg-blue-600 text-white shadow-blue-100 hover:bg-blue-700'
                  : 'bg-slate-900 text-white shadow-slate-200 hover:bg-black'
                }`}
                onClick={() => { setSelectedShift(shift); setIsDetailsOpen(true); }}
              >
                {shift.members.some(m => m.status === 'VOLUNTEER_PENDING') ? (
                  <><UserCheck size={18} className="mr-3" /> Resolver Solicitação</>
                ) : (
                  <><Search size={18} className="mr-3" /> Gerenciar Registro</>
                )}
              </Button>
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

      <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="Gestão Detalhada do Plantão" maxWidth="3xl">
        {selectedShift && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            {/* 1. Header & Quick Status Dashboard */}
            <div className="bg-slate-900 rounded-3xl p-8 text-white overflow-hidden relative shadow-2xl">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Shield size={160} />
               </div>
               
               <div className="relative z-10">
                 <div className="flex justify-between items-start mb-6">
                   <div>
                     <Badge variant={getStatusColor(selectedShift.status)} className="mb-3 font-black uppercase tracking-widest text-[10px] px-4 py-1.5 bg-white/10 text-white border-white/20">
                       {selectedShift.status === 'CONFIRMED' ? 'Escala Fechada' : selectedShift.status === 'AWAITING_CONFIRMATION' ? 'Em Confirmação' : 'Aberto para Inscrição'}
                     </Badge>
                     <h3 className="text-4xl font-black uppercase tracking-tighter leading-none mb-2">{selectedShift.team}</h3>
                     <div className="flex items-center gap-2 text-slate-400 text-sm font-bold bg-white/5 py-1.5 px-3 rounded-lg inline-flex">
                       <MapPin size={16} className="text-red-500" /> {selectedShift.location}
                     </div>
                   </div>
                   <div className="text-right">
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Ajuda de Custo</p>
                     <p className="text-3xl font-black text-emerald-400 tracking-tight">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedShift.amount || 0)}</p>
                   </div>
                 </div>

                 <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/10">
                    <div className="text-center group">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 group-hover:text-slate-300 transition-colors">Vagas Totais</p>
                      <p className="text-2xl font-black">{selectedShift.vacancies}</p>
                    </div>
                    <div className="text-center border-x border-white/10 px-4 group">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 group-hover:text-slate-300 transition-colors">Confirmados (c/ Líder)</p>
                       <p className="text-2xl font-black text-emerald-400">
                         {selectedShift.members.filter(m => m.status === 'CONFIRMED' && m.name.trim().toLowerCase() !== (selectedShift.leader || '').trim().toLowerCase()).length + (selectedShift.leader ? 1 : 0)}
                       </p>
                    </div>
                    <div className="text-center group">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 group-hover:text-slate-300 transition-colors">Em Aberto</p>
                       <p className="text-2xl font-black text-amber-400">
                         {Math.max(0, selectedShift.vacancies - (selectedShift.members.filter(m => m.status === 'CONFIRMED' && m.name.trim().toLowerCase() !== (selectedShift.leader || '').trim().toLowerCase()).length + (selectedShift.leader ? 1 : 0)))}
                       </p>
                    </div>
                 </div>
               </div>
            </div>

            {/* 2. Important Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {selectedShift.leader && (
                 <div className="p-5 bg-amber-50/50 border border-amber-200 rounded-2xl flex items-center justify-between group hover:bg-amber-100/50 transition-all duration-300 shadow-sm hover:shadow-md">
                   <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shadow-sm border border-amber-200 group-hover:rotate-12 transition-transform">
                       <Shield size={24} />
                     </div>
                     <div>
                       <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest leading-none mb-1.5">Líder do Plantão</p>
                       <p className="font-black text-slate-900 text-lg leading-none">{selectedShift.leader}</p>
                     </div>
                   </div>
                   <div className="bg-amber-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-amber-200">Vaga 1</div>
                 </div>
               )}
               
               {selectedShift.organizer && (
                 <div className="p-5 bg-blue-50/50 border border-blue-200 rounded-2xl flex items-center justify-between group hover:bg-blue-100/50 transition-all duration-300 shadow-sm hover:shadow-md">
                   <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-200 group-hover:rotate-12 transition-transform">
                       <Users size={24} />
                     </div>
                     <div>
                       <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none mb-1.5">Organizador</p>
                       <p className="font-black text-slate-900 text-lg leading-none">{selectedShift.organizer}</p>
                     </div>
                   </div>
                 </div>
               )}

               {selectedShift.description && (
                 <div className="md:col-span-2 p-6 bg-slate-50 border border-slate-100 border-dashed rounded-3xl relative overflow-hidden">
                   <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                      <FileText size={16} className="text-slate-400" /> Observações do Plantão
                   </p>
                   <p className="text-base text-slate-600 leading-relaxed italic font-medium">
                     "{selectedShift.description}"
                   </p>
                   <div className="absolute bottom-0 right-0 p-4 opacity-[0.03]">
                     <FileText size={80} />
                   </div>
                 </div>
               )}
            </div>

            {/* 3. Self Action for Summons (Leader or Member) */}
            {((selectedShift.members.find(m => m.userId === user.id)?.status === 'PENDING') || (user.name.trim().toLowerCase() === (selectedShift.leader || '').trim().toLowerCase() && selectedShift.status === 'AWAITING_CONFIRMATION')) && (
              <div className="p-6 bg-brand-50 border-2 border-brand-200 rounded-3xl text-center shadow-xl shadow-brand-100 border-dashed scrollbar-hide">
                 <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                   <AlertCircle className="text-brand-600" size={24} />
                 </div>
                 <h4 className="font-black text-brand-900 uppercase text-base mb-1">
                   {user.name.trim().toLowerCase() === (selectedShift.leader || '').trim().toLowerCase() ? 'Atenção: Designação de Líder' : 'Você foi convocado!'}
                 </h4>
                 <p className="text-xs text-brand-700 font-bold mb-4">
                   {user.name.trim().toLowerCase() === (selectedShift.leader || '').trim().toLowerCase() 
                     ? 'Você foi designado como líder deste plantão. Deseja assumir?' 
                     : 'Sua presença foi solicitada via sistema de rodízio para preencher esta vaga.'}
                 </p>
                 <div className="flex gap-3 justify-center">
                    <Button variant="outline" className="h-12 px-6 border-brand-200 text-brand-700 hover:bg-white rounded-xl font-black uppercase text-[10px] tracking-widest" onClick={() => handleRespondSummon(selectedShift.id, false)}>Recusar</Button>
                    <Button className="h-12 px-8 bg-brand-600 hover:bg-brand-700 shadow-2xl shadow-brand-200 rounded-xl font-black uppercase text-[10px] tracking-widest" onClick={() => handleRespondSummon(selectedShift.id, true)}>Confirmar Presença</Button>
                 </div>
              </div>
            )}

            {/* 4. Members Management Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {/* Left: Confirmed Members */}
               <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-emerald-500" /> Equipe Confirmada
                    </h4>
                    <Badge variant="success" className="px-3 py-1 font-black shadow-sm">
                      {selectedShift.members.filter(m => m.status === 'CONFIRMED' && m.name.trim().toLowerCase() !== (selectedShift.leader || '').trim().toLowerCase()).length + (selectedShift.leader ? 1 : 0)} ATIVOS
                    </Badge>
                  </div>
                  
                  <div className="bg-white rounded-3xl border border-slate-100 divide-y divide-slate-50 overflow-hidden shadow-sm">
                    {selectedShift.leader && (
                      <div className="p-4 flex items-center justify-between bg-amber-50/30">
                        <div className="flex items-center gap-3">
                           <Avatar alt={selectedShift.leader} fallback={selectedShift.leader.substring(0, 2)} size="md" className="border-2 border-amber-400 p-0.5" />
                           <div>
                             <p className="text-sm font-black text-slate-800">{selectedShift.leader}</p>
                             <p className="text-[10px] font-black uppercase text-amber-600 tracking-wider">Líder do Plantão</p>
                           </div>
                        </div>
                        <Shield size={18} className="text-amber-500" />
                      </div>
                    )}
                    {selectedShift.members.filter(m => m.status === 'CONFIRMED' && m.name.trim().toLowerCase() !== (selectedShift.leader || '').trim().toLowerCase()).map((m, i) => (
                      <div key={i} className="p-4 flex items-center justify-between group hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                           <Avatar alt={m.name} fallback={m.name.substring(0, 2)} size="md" />
                           <div>
                             <p className="text-sm font-black text-slate-800">{m.name}</p>
                             <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                               {m.type === 'ROTATION' ? 'Convocaçao Direta' : 'Voluntariado'}
                             </p>
                           </div>
                        </div>
                        <CheckCircle size={18} className="text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))}
                    {selectedShift.members.filter(m => m.status === 'CONFIRMED').length === 0 && !selectedShift.leader && (
                      <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                        <Users size={32} className="opacity-10 mb-4" />
                        <p className="text-[11px] font-black uppercase tracking-widest">Nenhum confirmado ainda</p>
                      </div>
                    )}
                  </div>
               </div>

               {/* Right: Pending/Volunteers */}
               <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                       <Clock size={16} className="text-amber-500" /> Gerenciar Solicitações
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedShift.members.filter(m => ['PENDING', 'VOLUNTEER_PENDING'].includes(m.status)).length} Pendentes</span>
                  </div>

                  <div className="bg-slate-50 rounded-3xl border border-slate-100 divide-y divide-slate-100 overflow-hidden shadow-inner min-h-[150px]">
                     {selectedShift.members.filter(m => ['PENDING', 'VOLUNTEER_PENDING', 'DECLINED'].includes(m.status)).map((m, i) => (
                       <div key={i} className={`p-4 flex items-center justify-between group ${m.status === 'DECLINED' ? 'bg-rose-50/50' : 'hover:bg-white'} transition-all`}>
                          <div className="flex items-center gap-3">
                             <div className="relative">
                               <Avatar alt={m.name} fallback={m.name.substring(0, 2)} size="md" className={m.status === 'DECLINED' ? 'opacity-40 grayscale' : ''} />
                               <div className="absolute -bottom-1 -right-1">
                                 {getMemberStatusIcon(m.status)}
                               </div>
                             </div>
                             <div>
                               <p className={`text-sm font-black ${m.status === 'DECLINED' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{m.name}</p>
                               <div className="flex items-center gap-2">
                                 <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                                   {m.status === 'VOLUNTEER_PENDING' ? 'Deseja trabalhar' : m.status === 'DECLINED' ? 'Justificou Falta' : 'Aguardando Resposta'}
                                 </p>
                                 {m.status === 'VOLUNTEER_PENDING' && (
                                   <Badge variant="info" className="text-[8px] h-4 py-0 font-black bg-blue-100 text-blue-600 border-none">URGENTE</Badge>
                                 )}
                               </div>
                             </div>
                          </div>

                          {/* Approval Actions for Admin */}
                          {user.role === UserRole.ADMIN && m.status === 'VOLUNTEER_PENDING' && (
                             <div className="flex gap-2 animate-in slide-in-from-right-2">
                                <button 
                                  onClick={() => handleRejectVolunteer(selectedShift, m.userId)}
                                  className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-lg shadow-rose-100"
                                  title="Recusar"
                                >
                                   <Trash2 size={16} />
                                </button>
                                <button 
                                  onClick={() => handleApproveVolunteer(selectedShift, m.userId)}
                                  className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-lg shadow-emerald-100"
                                  title="Aprovar e Confirmar"
                                >
                                   <CheckCircle size={18} />
                                </button>
                             </div>
                          )}
                       </div>
                     ))}
                     {selectedShift.members.filter(m => ['PENDING', 'VOLUNTEER_PENDING', 'DECLINED'].includes(m.status)).length === 0 && (
                        <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                            <CheckCircle size={24} className="text-emerald-500 opacity-20" />
                          </div>
                          <p className="text-[11px] font-black uppercase tracking-widest">Sem pendências para este plantão</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>

            {/* 5. Footer Activity & Admin Controls */}
            <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6">
               <div className="flex items-center gap-3 text-slate-400 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                  <Clock size={16} className="text-brand-500" />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                    Janela: <span className="text-slate-900">{selectedShift.startTime}</span> — <span className="text-slate-900">{selectedShift.endTime}</span>
                  </span>
               </div>
               
                <div className="flex gap-4 w-full sm:w-auto">
                  {canEdit && (selectedShift.status === 'PENDING' || selectedShift.status === 'AWAITING_CONFIRMATION') && (
                    <Button 
                      variant="outline" 
                      className="flex-1 sm:flex-none h-14 px-8 border-brand-200 text-brand-700 hover:bg-brand-50 rounded-2xl font-black uppercase text-xs tracking-widest"
                      onClick={() => handleGeneratePreview(selectedShift.id)}
                      disabled={isGenerating}
                    >
                       {isGenerating ? <Loader2 size={18} className="animate-spin mr-2" /> : <RefreshCcw size={18} className="mr-2" />}
                       Gerar Rodízio
                    </Button>
                  )}

                  {/* Member Self-Action - SOLICITAR INSCRIÇÃO DENTRO DO MODAL */}
                  {!canEdit && !selectedShift.members.some(m => m.userId === user.id) && selectedShift.status !== 'CONFIRMED' && (
                     <Button 
                       className="flex-1 sm:flex-none h-14 px-10 rounded-2xl bg-brand-600 hover:bg-brand-700 shadow-2xl shadow-brand-200 border-none font-black uppercase text-sm tracking-[0.1em]" 
                       onClick={() => handleVolunteer(selectedShift)}
                     >
                       <UserPlus size={20} className="mr-3" /> Solicitar Inscrição
                     </Button>
                   )}

                  {canEdit && selectedShift.status === 'CONFIRMED' && (
                     <Button
                       onClick={() => handleFinalizeShift(selectedShift)}
                       className="flex-1 sm:flex-none h-14 bg-slate-900 hover:bg-black text-white px-10 rounded-2xl shadow-xl shadow-slate-200 font-black uppercase text-sm tracking-widest"
                     >
                       <Shield size={20} className="mr-3 text-brand-400" /> Finalizar Plantão
                     </Button>
                   )}
                  <Button variant="outline" className="flex-1 sm:flex-none h-14 px-10 rounded-2xl font-black uppercase text-[11px] tracking-widest text-slate-400 hover:bg-slate-50 hover:text-slate-600 border-slate-200" onClick={() => setIsDetailsOpen(false)}>Fechar Detalhes</Button>
                </div>
             </div>
           </div>
         )}
      </Modal>

      {/* Create Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="➕ Lançar Novo Plantão Operacional" maxWidth="3xl">
        <form onSubmit={handleCreateShift} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 scrollbar-hide p-1">
          <div className="grid grid-cols-12 gap-x-4 gap-y-3">
            <div className="col-span-12">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Equipe / Serviço</label>
              <Input
                required
                value={newShift.team}
                onChange={(e) => setNewShift({ ...newShift, team: e.target.value })}
                placeholder="Ex: EVENTO ABCUNA"
                className="h-10 rounded-xl"
              />
            </div>

            <div className="col-span-12 md:col-span-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Data</label>
              <Input
                type="date"
                required
                value={newShift.fullDate}
                onChange={(e) => setNewShift({ ...newShift, fullDate: e.target.value })}
                className="h-10 rounded-xl px-2"
              />
            </div>

                        <div className="col-span-12 md:col-span-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Início</label>
              <div className="flex items-center gap-1">
                <select className="flex-1 h-10 rounded-xl border border-slate-200 bg-white px-1 text-[11px] font-black outline-none transition-all appearance-none text-center focus:ring-2 focus:ring-brand-500" value={newShift.startTime?.split(':')[0] || '08'} onChange={(e) => setNewShift({ ...newShift, startTime: `${e.target.value}:${newShift.startTime?.split(':')[1] || '00'}` })}>
                  {Array.from({ length: 24 }).map((_, i) => <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}h</option>)}
                </select>
                <span className="font-black text-slate-300">:</span>
                <select className="flex-1 h-10 rounded-xl border border-slate-200 bg-white px-1 text-[11px] font-black outline-none transition-all appearance-none text-center focus:ring-2 focus:ring-brand-500" value={newShift.startTime?.split(':')[1] || '00'} onChange={(e) => setNewShift({ ...newShift, startTime: `${newShift.startTime?.split(':')[0] || '08'}:${e.target.value}` })}>
                  {['00', '15', '30', '45'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

                        <div className="col-span-12 md:col-span-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Fim</label>
              <div className="flex items-center gap-1">
                <select className="flex-1 h-10 rounded-xl border border-slate-200 bg-white px-1 text-[11px] font-black outline-none transition-all appearance-none text-center focus:ring-2 focus:ring-brand-500" value={newShift.endTime?.split(':')[0] || '20'} onChange={(e) => setNewShift({ ...newShift, endTime: `${e.target.value}:${newShift.endTime?.split(':')[1] || '00'}` })}>
                  {Array.from({ length: 24 }).map((_, i) => <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}h</option>)}
                </select>
                <span className="font-black text-slate-300">:</span>
                <select className="flex-1 h-10 rounded-xl border border-slate-200 bg-white px-1 text-[11px] font-black outline-none transition-all appearance-none text-center focus:ring-2 focus:ring-brand-500" value={newShift.endTime?.split(':')[1] || '00'} onChange={(e) => setNewShift({ ...newShift, endTime: `${newShift.endTime?.split(':')[0] || '20'}:${e.target.value}` })}>
                  {['00', '15', '30', '45'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div className="col-span-12 md:col-span-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Vagas</label>
                <Input
                  type="number"
                  required
                  value={newShift.vacancies}
                  onChange={(e) => setNewShift({ ...newShift, vacancies: parseInt(e.target.value) })}
                  className="h-10 rounded-xl"
                />
            </div>

            <div className="col-span-12 md:col-span-4">
               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Localização</label>
               <Input
                 value={newShift.location}
                 onChange={(e) => setNewShift({ ...newShift, location: e.target.value })}
                 placeholder="Cidade ou Setor"
                 className="h-10 rounded-xl"
               />
            </div>

            <div className="col-span-12 md:col-span-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Valor do Plantão</label>
                <Input
                  type="number"
                  value={newShift.amount}
                  onChange={(e) => setNewShift({ ...newShift, amount: parseFloat(e.target.value) })}
                  placeholder="R$"
                  className="h-10 rounded-xl"
                />
            </div>

            <div className="col-span-12 md:col-span-5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Líder (Diretoria)</label>
              <select
                className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-bold focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                value={newShift.leader}
                onChange={(e) => setNewShift({ ...newShift, leader: e.target.value })}
              >
                <option value="">Selecione...</option>
                {directors.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="col-span-12 md:col-span-12">
               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Organizador</label>
               <Input
                 value={newShift.organizer}
                 onChange={(e) => setNewShift({ ...newShift, organizer: e.target.value })}
                 placeholder="Ex: ABCUNA"
                 className="h-10 rounded-xl"
               />
            </div>

            <div className="col-span-12">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Observações do Plantão</label>
              <Input
                value={newShift.description}
                onChange={(e) => setNewShift({ ...newShift, description: e.target.value })}
                placeholder="Diferencial, detalhes..."
                className="h-10 rounded-xl"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" className="flex-1 h-10 text-[10px] font-black uppercase tracking-widest border-slate-200" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" className="flex-1 h-10 bg-slate-900 hover:bg-black text-white shadow-xl shadow-slate-200 font-black text-[10px] uppercase tracking-widest">
              <Check className="mr-2" size={14} /> Finalizar Lançamento
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="⚙️ Editar Registro" maxWidth="3xl">
        <form onSubmit={handleUpdateShift} className="space-y-4 animate-in fade-in scrollbar-hide p-1">
          <div className="grid grid-cols-12 gap-x-4 gap-y-3">
            <div className="col-span-12">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Título da Equipe</label>
              <Input value={editingShift.team} onChange={e => setEditingShift({ ...editingShift, team: e.target.value })} required className="h-10 rounded-xl" />
            </div>

            <div className="col-span-12 md:col-span-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Data</label>
              <Input type="date" value={editingShift.fullDate} onChange={e => setEditingShift({ ...editingShift, fullDate: e.target.value })} required className="h-10 rounded-xl px-2" />
            </div>

                        <div className="col-span-12 md:col-span-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Início</label>
              <div className="flex items-center gap-1">
                <select className="flex-1 h-10 rounded-xl border border-slate-200 bg-white px-1 text-[11px] font-black outline-none transition-all appearance-none text-center focus:ring-2 focus:ring-brand-500" value={editingShift.startTime?.split(':')[0] || '08'} onChange={(e) => setEditingShift({ ...editingShift, startTime: `${e.target.value}:${editingShift.startTime?.split(':')[1] || '00'}` })}>
                  {Array.from({ length: 24 }).map((_, i) => <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}h</option>)}
                </select>
                <span className="font-black text-slate-300">:</span>
                <select className="flex-1 h-10 rounded-xl border border-slate-200 bg-white px-1 text-[11px] font-black outline-none transition-all appearance-none text-center focus:ring-2 focus:ring-brand-500" value={editingShift.startTime?.split(':')[1] || '00'} onChange={(e) => setEditingShift({ ...editingShift, startTime: `${editingShift.startTime?.split(':')[0] || '08'}:${e.target.value}` })}>
                  {['00', '15', '30', '45'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

                        <div className="col-span-12 md:col-span-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Fim</label>
              <div className="flex items-center gap-1">
                <select className="flex-1 h-10 rounded-xl border border-slate-200 bg-white px-1 text-[11px] font-black outline-none transition-all appearance-none text-center focus:ring-2 focus:ring-brand-500" value={editingShift.endTime?.split(':')[0] || '20'} onChange={(e) => setEditingShift({ ...editingShift, endTime: `${e.target.value}:${editingShift.endTime?.split(':')[1] || '00'}` })}>
                  {Array.from({ length: 24 }).map((_, i) => <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}h</option>)}
                </select>
                <span className="font-black text-slate-300">:</span>
                <select className="flex-1 h-10 rounded-xl border border-slate-200 bg-white px-1 text-[11px] font-black outline-none transition-all appearance-none text-center focus:ring-2 focus:ring-brand-500" value={editingShift.endTime?.split(':')[1] || '00'} onChange={(e) => setEditingShift({ ...editingShift, endTime: `${editingShift.endTime?.split(':')[0] || '20'}:${e.target.value}` })}>
                  {['00', '15', '30', '45'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div className="col-span-12 md:col-span-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Vagas</label>
              <Input type="number" value={editingShift.vacancies} onChange={e => setEditingShift({ ...editingShift, vacancies: parseInt(e.target.value) })} required className="h-10 rounded-xl" />
            </div>

            <div className="col-span-12 md:col-span-4">
               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Local</label>
               <Input value={editingShift.location} onChange={e => setEditingShift({ ...editingShift, location: e.target.value })} required className="h-10 rounded-xl" />
            </div>

            <div className="col-span-12 md:col-span-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Valor do Plantão</label>
              <Input type="number" step="0.01" value={editingShift.amount} onChange={e => setEditingShift({ ...editingShift, amount: parseFloat(e.target.value) })} required className="h-10 rounded-xl" />
            </div>

            <div className="col-span-12 md:col-span-5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Líder</label>
               <select
                className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-bold focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                value={editingShift.leader}
                onChange={(e) => setEditingShift({ ...editingShift, leader: e.target.value })}
              >
                <option value="">Selecione...</option>
                {directors.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="col-span-12">
               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Organizador</label>
               <Input
                 value={editingShift.organizer}
                 onChange={(e) => setEditingShift({ ...editingShift, organizer: e.target.value })}
                 placeholder="Ex: ABCUNA"
                 className="h-10 rounded-xl"
               />
            </div>
          </div>

          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <Button variant="outline" type="button" className="flex-1 h-10 text-[10px] font-black uppercase tracking-widest" onClick={() => setIsEditModalOpen(false)}>Descartar</Button>
            <Button type="submit" className="flex-1 h-10 bg-brand-600 hover:bg-brand-700 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-brand-100">
              <Check className="mr-2" size={14} /> Salvar Alterações
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
});

// Helper Icon
const InfoIcon = ({ size, className }: { size?: number, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
);
