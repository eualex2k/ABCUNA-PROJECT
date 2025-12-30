import React, { useState, useMemo, useEffect } from 'react';
import { UserPlus, Check, X, Search, FileText, List, Calendar, Trophy, Target, Clock, AlertCircle, Edit3, Calculator, Save, Eye, Info, Plus } from 'lucide-react';
import { Card, Button, Input, Badge, Avatar, Modal } from '../components/ui';
import { User, UserRole, Candidate, SelectionStage, SelectionScheduleItem, translateStatus } from '../types';
import { selectionService } from '../services/selection';

interface SelectionPageProps {
  user: User;
}

type Tab = 'STAGES' | 'SCHEDULE' | 'RESULTS';

export const SelectionPage: React.FC<SelectionPageProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<Tab>('STAGES');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stages, setStages] = useState<SelectionStage[]>([]);
  const [schedule, setSchedule] = useState<SelectionScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditScheduleMode, setIsEditScheduleMode] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [candidatesData, stagesData, scheduleData] = await Promise.all([
        selectionService.getCandidates(),
        selectionService.getStages(),
        selectionService.getSchedule()
      ]);
      setCandidates(candidatesData);
      setStages(stagesData);
      setSchedule(scheduleData);
    } catch (error) {
      console.error('Failed to load selection data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Grading Modal State
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  // Grading Inputs
  const [grades, setGrades] = useState({
    theory: '',
    simulation: '',
    internship: '',
    discipline: ''
  });

  const [isAddStageModalOpen, setIsAddStageModalOpen] = useState(false);
  const [isAddScheduleModalOpen, setIsAddScheduleModalOpen] = useState(false);

  const [newStage, setNewStage] = useState({ title: '', description: '' });
  const [newScheduleItem, setNewScheduleItem] = useState({ date: '', event: '' });

  const isAdmin = [UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.SECRETARY].includes(user.role);

  // Sorting Logic with Tie Breakers
  const sortedCandidates = useMemo(() => {
    return [...candidates].sort((a, b) => {
      // 1. Sort by Status Priority (Optional visual grouping, but here we sort by Score mostly)
      // Let's stick strictly to the prompt's tie-breaker rules for the ranking list

      // 1. Total Score (Desc)
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      // 2. Discipline Score (Desc) - Tie Breaker 1
      const discA = a.breakdown?.discipline || 0;
      const discB = b.breakdown?.discipline || 0;
      if (discB !== discA) {
        return discB - discA;
      }

      // 3. Theory Score (Desc) - Tie Breaker 2
      const theoryA = a.breakdown?.theory || 0;
      const theoryB = b.breakdown?.theory || 0;
      return theoryB - theoryA;
    });
  }, [candidates]);

  const filtered = sortedCandidates.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Stats
  const approvedCount = candidates.filter(c => c.status === 'APPROVED').length;
  const volunteerCount = candidates.filter(c => c.status === 'VOLUNTEER').length;
  const pendingCount = candidates.filter(c => c.status === 'PENDING').length;

  const handleOpenGradeModal = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setGrades({
      theory: candidate.breakdown?.theory.toString() || '',
      simulation: candidate.breakdown?.simulation.toString() || '',
      internship: candidate.breakdown?.internship.toString() || '',
      discipline: candidate.breakdown?.discipline.toString() || ''
    });
    setIsGradeModalOpen(true);
  };

  const handleOpenDetails = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsDetailsModalOpen(true);
  };

  const handleUpdateStageStatus = async (id: number, status: any) => {
    try {
      await selectionService.updateStageStatus(id, status);
      setStages(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    } catch (error) {
      console.error('Error updating stage:', error);
    }
  };

  const handleUpdateSchedule = async (id: string, field: string, value: any) => {
    try {
      await selectionService.updateScheduleItem(id, { [field]: value });
      setSchedule(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    } catch (error) {
      console.error('Error updating schedule:', error);
    }
  };

  const handleAddStage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newStage.title) {
      try {
        const stage = await selectionService.addStage(newStage.title, newStage.description, stages.length + 1);
        setStages(prev => [...prev, stage]);
        setIsAddStageModalOpen(false);
        setNewStage({ title: '', description: '' });
      } catch (error) {
        console.error('Error adding stage:', error);
      }
    }
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newScheduleItem.event) {
      try {
        const item = await selectionService.addScheduleItem(newScheduleItem.event, newScheduleItem.date || 'A definir', schedule.length + 1);
        setSchedule(prev => [...prev, item]);
        setIsAddScheduleModalOpen(false);
        setNewScheduleItem({ date: '', event: '' });
      } catch (error) {
        console.error('Error adding schedule item:', error);
      }
    }
  };

  const calculateTotal = () => {
    const t = parseFloat(grades.theory) || 0;
    const s = parseFloat(grades.simulation) || 0;
    const i = parseFloat(grades.internship) || 0;
    const d = parseFloat(grades.discipline) || 0;
    return (t + s + i + d);
  };

  const handleSaveGrades = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;

    const totalScore = calculateTotal();
    const breakdown = {
      theory: parseFloat(grades.theory) || 0,
      simulation: parseFloat(grades.simulation) || 0,
      internship: parseFloat(grades.internship) || 0,
      discipline: parseFloat(grades.discipline) || 0
    };

    let newStatus: Candidate['status'] = 'PENDING';
    if (totalScore > 800) {
      newStatus = 'APPROVED';
    } else if (totalScore > 700) {
      newStatus = 'VOLUNTEER';
    } else {
      newStatus = 'REJECTED';
    }

    try {
      await selectionService.updateCandidateGrade(selectedCandidate.id, breakdown, totalScore, newStatus);
      setCandidates(prev => prev.map(c =>
        c.id === selectedCandidate.id
          ? { ...c, score: totalScore, breakdown, status: newStatus }
          : c
      ));
      setIsGradeModalOpen(false);
    } catch (error) {
      console.error('Error saving grades:', error);
      alert('Erro ao salvar notas.');
    }
  };

  const handlePromoteCandidate = async (candidate: Candidate) => {
    if (!confirm(`Tem certeza que deseja tornar ${candidate.name} um Associado e Bombeiro Civil?`)) return;

    try {
      await selectionService.promoteCandidate(candidate.id);
      setCandidates(prev => prev.filter(c => c.id !== candidate.id));
      alert(`${candidate.name} agora é um Associado e Bombeiro Civil!`);
    } catch (error) {
      console.error('Error promoting candidate:', error);
      alert('Erro ao promover candidato.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">Carregando dados da seleção...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Processo Seletivo</h2>
          <p className="text-slate-500 text-sm">Gestão de ranking, notas e aprovação de novos membros.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && (
            <>
              {activeTab === 'STAGES' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddStageModalOpen(true)}
                  className="flex items-center gap-2 border-brand-200 text-brand-700 hover:bg-brand-50"
                >
                  <Plus size={16} /> Nova Etapa
                </Button>
              )}
              {activeTab === 'SCHEDULE' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddScheduleModalOpen(true)}
                  className="flex items-center gap-2 border-brand-200 text-brand-700 hover:bg-brand-50"
                >
                  <Plus size={16} /> Novo Evento
                </Button>
              )}
            </>
          )}
          <div className="bg-white border border-slate-200 px-4 py-2 rounded-2xl shadow-sm flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Vagas Associados:</span>
            <span className="text-lg font-black text-slate-900">{approvedCount}<span className="text-slate-300">/15</span></span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('STAGES')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'STAGES' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <Target size={18} /> Etapas
          </button>

          <button
            onClick={() => setActiveTab('SCHEDULE')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'SCHEDULE' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <Calendar size={18} /> Cronograma
          </button>

          <button
            onClick={() => setActiveTab('RESULTS')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'RESULTS' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <Trophy size={18} /> Resultados & Ranking
            {pendingCount > 0 && isAdmin && (
              <span className="bg-brand-100 text-brand-600 py-0.5 px-2 rounded-full text-xs">
                {pendingCount}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* --- CONTENT: ETAPAS --- */}
      {activeTab === 'STAGES' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stages.map((stage) => (
              <Card key={stage.id} className={`p-5 border-l-4 transition-all ${stage.status === 'COMPLETED' ? 'border-l-green-500 bg-green-50/10' :
                stage.status === 'IN_PROGRESS' ? 'border-l-blue-500 bg-blue-50/10' : 'border-l-slate-300'
                }`}>
                <div className="flex justify-between items-start mb-2">
                  <div className={`p-1.5 rounded-lg ${stage.status === 'COMPLETED' ? 'bg-green-50 text-green-600' : stage.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                    <Target size={20} />
                  </div>
                  <Badge variant={stage.status === 'COMPLETED' ? 'success' : stage.status === 'IN_PROGRESS' ? 'info' : 'neutral'}>
                    {translateStatus(stage.status)}
                  </Badge>
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-1">{stage.id}. {stage.title}</h3>
                <p className="text-[13px] leading-snug text-slate-500 mb-3 line-clamp-2">{stage.description}</p>

                {isAdmin && (
                  <div className="pt-3 border-t border-slate-100 flex gap-1.5">
                    <button
                      onClick={() => handleUpdateStageStatus(stage.id, 'PENDING')}
                      className={`flex-1 py-1 text-[9px] font-bold rounded-md transition-colors ${stage.status === 'PENDING' ? 'bg-slate-200 text-slate-700' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                    >
                      PENDENTE
                    </button>
                    <button
                      onClick={() => handleUpdateStageStatus(stage.id, 'IN_PROGRESS')}
                      className={`flex-1 py-1 text-[9px] font-bold rounded-md transition-colors ${stage.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : 'bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600'}`}
                    >
                      INICIAR
                    </button>
                    <button
                      onClick={() => handleUpdateStageStatus(stage.id, 'COMPLETED')}
                      className={`flex-1 py-1 text-[9px] font-bold rounded-md transition-colors ${stage.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-slate-50 text-slate-400 hover:bg-green-50 hover:text-green-600'}`}
                    >
                      CONCLUIR
                    </button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* --- CONTENT: CRONOGRAMA --- */}
      {activeTab === 'SCHEDULE' && (
        <Card className="p-8 animate-in slide-in-from-bottom-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Clock size={20} className="text-slate-400" /> Linha do Tempo Oficial
            </h3>
            {isAdmin && (
              <Button
                variant={isEditScheduleMode ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setIsEditScheduleMode(!isEditScheduleMode)}
              >
                {isEditScheduleMode ? <><Save size={16} className="mr-2" /> Salvar Datas</> : <><Edit3 size={16} className="mr-2" /> Editar Cronograma</>}
              </Button>
            )}
          </div>

          <div className="relative border-l-2 border-slate-200 ml-3 space-y-8">
            {schedule.map((item, index) => (
              <div key={index} className="relative pl-8">
                <div
                  className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 transition-all cursor-pointer ${item.done ? 'bg-brand-600 border-brand-600' : 'bg-white border-slate-300'}`}
                  onClick={() => isAdmin && handleUpdateSchedule(item.id, 'done', !item.done)}
                  title={isAdmin ? "Alternar status de conclusão" : ""}
                ></div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                  {isEditScheduleMode ? (
                    <input
                      type="text"
                      className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 border border-brand-100 rounded px-2 py-1 outline-none w-32"
                      value={item.date}
                      onChange={(e) => handleUpdateSchedule(item.id, 'date', e.target.value)}
                    />
                  ) : (
                    <span className={`text-xs font-bold uppercase tracking-wider ${item.done ? 'text-brand-600' : 'text-slate-400'}`}>{item.date}</span>
                  )}

                  {isEditScheduleMode ? (
                    <input
                      type="text"
                      className="text-base font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none flex-1"
                      value={item.event}
                      onChange={(e) => handleUpdateSchedule(item.id, 'event', e.target.value)}
                    />
                  ) : (
                    <h4 className={`text-base font-medium ${item.done ? 'text-slate-900' : 'text-slate-500'}`}>{item.event}</h4>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 bg-blue-50 p-4 rounded-lg flex items-start gap-3 text-sm text-blue-800 border border-blue-100">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <p>As datas podem sofrer alterações conforme necessidade da comissão organizadora. Fique atento aos editais.</p>
          </div>
        </Card>
      )}

      {/* --- CONTENT: RESULTADOS (Admin Grading Interface) --- */}
      {activeTab === 'RESULTS' && (
        <Card className="overflow-hidden animate-in slide-in-from-bottom-2">
          <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <Input
                placeholder="Buscar candidato..."
                className="pl-10"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Button variant="outline" size="sm" onClick={() => alert('Exportando planilha de notas...')}>
                  <FileText size={16} className="mr-2" /> Relatório de Notas
                </Button>
              )}
            </div>
          </div>

          {/* Rules Legend */}
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex flex-wrap gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> &gt; 800 pts: Aprovado</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> 701-800 pts: Voluntário</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> ≤ 700 pts: Reprovado</div>
            <div className="ml-auto font-medium">Critério Desempate: 1º Disciplina, 2º Prova Teórica</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="px-6 py-4 w-12">#</th>
                  <th className="px-6 py-4">Candidato</th>
                  <th className="px-6 py-4">Pontuação Total</th>
                  <th className="px-6 py-4">Situação</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((c, index) => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                      {index + 1}º
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar src="" alt={c.name} fallback={c.name.substring(0, 2)} />
                        <div>
                          <p className="font-medium text-slate-900">{c.name}</p>
                          <p className="text-xs text-slate-500">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {c.score > 0 ? (
                          <>
                            <span className={`font-bold text-lg ${c.score > 800 ? 'text-green-600' : c.score > 700 ? 'text-blue-600' : 'text-slate-600'}`}>{c.score}</span>
                            <span className="text-xs text-slate-400">/1000</span>
                          </>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Não avaliado</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={
                        c.status === 'APPROVED' ? 'success' :
                          c.status === 'VOLUNTEER' ? 'info' :
                            c.status === 'REJECTED' ? 'danger' : 'warning'
                      }>
                        {translateStatus(c.status)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {/* Details Button - Visible to everyone */}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-slate-500 hover:text-brand-600"
                          title="Ver Detalhes das Notas"
                          onClick={() => handleOpenDetails(c)}
                        >
                          <Eye size={18} />
                        </Button>

                        {/* Grading Button - Admin Only */}
                        {isAdmin && (
                          <div className="flex items-center gap-2">
                            {c.status === 'APPROVED' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-green-600 text-green-600 hover:bg-green-50 flex items-center gap-2"
                                onClick={() => handlePromoteCandidate(c)}
                                title="Tornar este candidato um associado"
                              >
                                <UserPlus size={14} /> Tornar Associado
                              </Button>
                            )}
                            <Button
                              size="sm"
                              className="bg-brand-600 hover:bg-brand-700 text-white flex items-center gap-2"
                              onClick={() => handleOpenGradeModal(c)}
                            >
                              <Edit3 size={14} /> Lançar
                            </Button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )
      }

      {/* --- MODAL: LANÇAMENTO DE NOTAS (ADMIN) --- */}
      <Modal isOpen={isGradeModalOpen} onClose={() => setIsGradeModalOpen(false)} title="Lançamento de Notas">
        {selectedCandidate && (
          <form onSubmit={handleSaveGrades} className="space-y-6">
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <Avatar alt={selectedCandidate.name} fallback={selectedCandidate.name.substring(0, 2)} />
              <div>
                <p className="font-bold text-slate-900">{selectedCandidate.name}</p>
                <p className="text-xs text-slate-500">Avaliação Individual</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-4">
                <div className="flex items-end gap-4">
                  <Input
                    label="Prova Teórica (Desempate 2)"
                    type="number"
                    min="0" max="400"
                    value={grades.theory}
                    onChange={e => setGrades({ ...grades, theory: e.target.value })}
                    required
                  />
                  <div className="h-10 flex items-center text-xs text-slate-500 w-32 whitespace-nowrap">Máx 400 pts</div>
                </div>

                <div className="flex items-end gap-4">
                  <Input
                    label="Simulado Prático"
                    type="number"
                    min="0" max="250"
                    value={grades.simulation}
                    onChange={e => setGrades({ ...grades, simulation: e.target.value })}
                    required
                  />
                  <div className="h-10 flex items-center text-xs text-slate-500 w-32 whitespace-nowrap">Máx 250 pts</div>
                </div>

                <div className="flex items-end gap-4">
                  <Input
                    label="Estágio Supervisionado"
                    type="number"
                    min="0" max="200"
                    value={grades.internship}
                    onChange={e => setGrades({ ...grades, internship: e.target.value })}
                    required
                  />
                  <div className="h-10 flex items-center text-xs text-slate-500 w-32 whitespace-nowrap">Máx 200 pts</div>
                </div>

                <div className="flex items-end gap-4">
                  <Input
                    label="Disciplina (Desempate 1)"
                    type="number"
                    min="0" max="150"
                    value={grades.discipline}
                    onChange={e => setGrades({ ...grades, discipline: e.target.value })}
                    required
                  />
                  <div className="h-10 flex items-center text-xs text-slate-500 w-32 whitespace-nowrap">Máx 150 pts</div>
                </div>
              </div>

              <div className="bg-brand-50 p-4 rounded-lg border border-brand-100 flex justify-between items-center">
                <div className="flex items-center gap-2 text-brand-700">
                  <Calculator size={20} />
                  <span className="font-semibold text-sm">Pontuação Total</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-brand-700">{calculateTotal()}</span>
                  <span className="text-xs text-brand-400 block">/1000 pts</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsGradeModalOpen(false)}>Cancelar</Button>
              <Button type="submit" className="flex items-center gap-2">
                <Save size={18} /> Salvar Avaliação
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* --- MODAL: DETALHES DAS NOTAS (READ ONLY) --- */}
      <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title="Detalhamento de Notas">
        {selectedCandidate && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3">
                <Avatar alt={selectedCandidate.name} fallback={selectedCandidate.name.substring(0, 2)} size="md" />
                <div>
                  <h4 className="font-bold text-slate-900">{selectedCandidate.name}</h4>
                  <p className="text-xs text-slate-500">{selectedCandidate.email}</p>
                </div>
              </div>
              <Badge variant={
                selectedCandidate.status === 'APPROVED' ? 'success' :
                  selectedCandidate.status === 'VOLUNTEER' ? 'info' :
                    selectedCandidate.status === 'REJECTED' ? 'danger' : 'warning'
              }>
                {translateStatus(selectedCandidate.status)}
              </Badge>
            </div>

            {selectedCandidate.breakdown ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white border border-slate-100 rounded-lg shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Prova Teórica</p>
                  <div className="flex justify-between items-end">
                    <span className="text-xl font-bold text-slate-900">{selectedCandidate.breakdown.theory}</span>
                    <span className="text-xs text-slate-400">/ 400</span>
                  </div>
                </div>
                <div className="p-4 bg-white border border-slate-100 rounded-lg shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Simulado Prático</p>
                  <div className="flex justify-between items-end">
                    <span className="text-xl font-bold text-slate-900">{selectedCandidate.breakdown.simulation}</span>
                    <span className="text-xs text-slate-400">/ 250</span>
                  </div>
                </div>
                <div className="p-4 bg-white border border-slate-100 rounded-lg shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Estágio</p>
                  <div className="flex justify-between items-end">
                    <span className="text-xl font-bold text-slate-900">{selectedCandidate.breakdown.internship}</span>
                    <span className="text-xs text-slate-400">/ 200</span>
                  </div>
                </div>
                <div className="p-4 bg-white border border-slate-100 rounded-lg shadow-sm border-l-4 border-l-blue-500">
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Disciplina (Desempate)</p>
                  <div className="flex justify-between items-end">
                    <span className="text-xl font-bold text-slate-900">{selectedCandidate.breakdown.discipline}</span>
                    <span className="text-xs text-slate-400">/ 150</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <Info className="mx-auto text-slate-300 mb-2" />
                <p className="text-slate-500 text-sm">Notas ainda não lançadas pela comissão.</p>
              </div>
            )}

            {selectedCandidate.breakdown && (
              <div className="bg-slate-900 text-white p-5 rounded-xl flex justify-between items-center">
                <div>
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Pontuação Final</p>
                  <p className="text-sm text-slate-300">Soma de todas as etapas</p>
                </div>
                <div className="text-3xl font-bold text-brand-400">
                  {selectedCandidate.score}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)}>Fechar</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modals for Adding Content */}
      <Modal isOpen={isAddStageModalOpen} onClose={() => setIsAddStageModalOpen(false)} title="Adicionar Nova Etapa">
        <form onSubmit={handleAddStage} className="space-y-4">
          <Input
            label="Título da Etapa"
            placeholder="Ex: Teste de Aptidão Física"
            value={newStage.title}
            onChange={e => setNewStage({ ...newStage, title: e.target.value })}
            required
          />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Descrição</label>
            <textarea
              className="w-full h-24 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
              placeholder="Descreva o que será avaliado nesta etapa..."
              value={newStage.description}
              onChange={e => setNewStage({ ...newStage, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsAddStageModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Criar Etapa</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isAddScheduleModalOpen} onClose={() => setIsAddScheduleModalOpen(false)} title="Adicionar Evento ao Cronograma">
        <form onSubmit={handleAddSchedule} className="space-y-4">
          <Input
            label="Data ou Período"
            placeholder="Ex: 15/07 ou Julho/2024"
            value={newScheduleItem.date}
            onChange={e => setNewScheduleItem({ ...newScheduleItem, date: e.target.value })}
          />
          <Input
            label="Nome do Evento"
            placeholder="Ex: Cerimônia de Formatura"
            value={newScheduleItem.event}
            onChange={e => setNewScheduleItem({ ...newScheduleItem, event: e.target.value })}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsAddScheduleModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Adicionar ao Cronograma</Button>
          </div>
        </form>
      </Modal>
    </div >
  );
};