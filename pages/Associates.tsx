import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, Download, Trash2, Edit2, X, FileText, Calendar, DollarSign, Clock, Save, AlertCircle, ArrowRight, Users, Shield, MapPin } from 'lucide-react';
import { Card, Button, Input, Badge, Avatar, Modal } from '../components/ui';
import { Associate, Transaction, User, UserRole, translateRole, translateStatus, translatePaymentStatus } from '../types';
import { associatesService } from '../services/associates';
import { scheduleService } from '../services/schedule';
import { financialService } from '../services/financial';
import { Shift } from '../types';

interface AssociatesPageProps {
  user: User;
}

export const AssociatesPage: React.FC<AssociatesPageProps> = ({ user }) => {
  const canEdit = [UserRole.ADMIN, UserRole.SECRETARY].includes(user.role);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [associates, setAssociates] = useState<Associate[]>([]);
  const [allShifts, setAllShifts] = useState<Shift[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssociates = async () => {
    try {
      setLoading(true);
      const [assocData, shiftsData, financialData] = await Promise.all([
        associatesService.getAll(),
        scheduleService.getAll(),
        financialService.getAll()
      ]);
      setAssociates(assocData);
      setAllShifts(shiftsData);
      setAllTransactions(financialData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAssociates();
  }, []);

  // Edit/Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Details Modal State
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedAssociate, setSelectedAssociate] = useState<Associate | null>(null);
  const [detailsTab, setDetailsTab] = useState<'OVERVIEW' | 'FINANCIAL' | 'HISTORY'>('OVERVIEW');
  const [associateNotes, setAssociateNotes] = useState('');

  const initialFormState: Partial<Associate> = {
    name: '',
    email: '',
    phone: '',
    role: 'Bombeiro Civil',
    status: 'ACTIVE',
    paymentStatus: 'UP_TO_DATE'
  };

  const [formData, setFormData] = useState<Partial<Associate>>(initialFormState);
  const [isCustomRole, setIsCustomRole] = useState(false);

  // --- Actions ---

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setIsCustomRole(false);
    setIsModalOpen(true);
  };

  const handleEdit = (associate: Associate) => {
    setEditingId(associate.id);
    setFormData({
      name: associate.name,
      email: associate.email,
      phone: associate.phone,
      role: associate.role,
      status: associate.status,
      paymentStatus: associate.paymentStatus
    });
    const standardRoles = ['Bombeiro Civil', 'Recruta', 'Presidente', 'Secretário(a)', 'Tesoureiro(a)', 'Vice presidente', 'Instrutor(a)'];
    setIsCustomRole(!standardRoles.includes(associate.role));
    setIsModalOpen(true);
  };

  const handleViewDetails = (associate: Associate) => {
    setSelectedAssociate(associate);
    setAssociateNotes('Associado proativo, sempre disponível para escalas extras. Possui curso de APH atualizado.'); // Mock note
    setDetailsTab('OVERVIEW');
    setIsDetailsOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    try {
      if (editingId) {
        await associatesService.update(editingId, formData);
      } else {
        alert('Novos associados devem ser cadastrados via tela de login com um Código de Acesso.');
        return;
      }

      await fetchAssociates();
      setIsModalOpen(false);
      setFormData(initialFormState);
      setEditingId(null);
    } catch (error) {
      alert('Erro ao salvar associado.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este associado permanentemente?')) {
      try {
        await associatesService.delete(id);
        await fetchAssociates();
      } catch (error) {
        alert('Erro ao excluir associado. Note que perfis vinculados a autenticação podem exigir remoção via painel administrativo.');
      }
    }
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Nome,Email,Função,Status\n"
      + associates.map(e => `${e.name},${e.email},${e.role},${e.status} `).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "associados_abcuna.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = associates.filter(a =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Render Helpers ---

  const renderDetailsContent = () => {
    if (!selectedAssociate) return null;

    const mockFinancialHistory: Transaction[] = []; // Cleared mock data

    switch (detailsTab) {
      case 'OVERVIEW':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 mb-1">E-mail de Contato</p>
                <p className="text-sm font-semibold text-slate-900">{selectedAssociate.email}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 mb-1">Telefone / WhatsApp</p>
                <p className="text-sm font-semibold text-slate-900">{selectedAssociate.phone}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-bold text-slate-900">Observações Internas</h4>
                {canEdit && <Button variant="ghost" size="sm" className="h-7 text-xs">Editar</Button>}
              </div>
              <p className="text-sm text-slate-600 leading-relaxed italic">
                "{associateNotes || 'Nenhuma observação registrada.'}"
              </p>
            </div>

            {/* Removed stat cards as requested */}
          </div>
        );
      case 'FINANCIAL':
        // Filter real fees for this associate
        const associateFees = allTransactions
          .filter(tx => (tx.category === 'Mensalidade' || tx.category === 'Mensalidades') && tx.payer_id === selectedAssociate.id)
          .sort((a, b) => b.date.localeCompare(a.date));

        const pendingFees = associateFees.filter(f => f.status === 'PENDING');
        const overduePayments = pendingFees.filter(f => {
          const dObj = new Date(f.date + 'T12:00:00');
          return dObj < new Date();
        });

        const oldestOverdue = overduePayments.length > 0 ? overduePayments[overduePayments.length - 1] : null;

        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-900 rounded-xl text-white">
              <div>
                <p className="text-xs text-slate-400">Situação Atual</p>
                <p className="text-lg font-bold">
                  {overduePayments.length > 0 ? 'Atrasado' : (pendingFees.length > 0 ? 'A Vencer' : 'Em dia')}
                </p>
                {oldestOverdue && (
                  <p className="text-xs text-amber-300 mt-1">
                    Mensalidade em atraso pendente.
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {oldestOverdue && (
                  <button
                    onClick={() => {
                      setIsDetailsOpen(false);
                      navigate('/financial', {
                        state: {
                          highlightOverdue: true,
                          associateId: selectedAssociate.id,
                          feeId: oldestOverdue.id
                        }
                      });
                    }}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
                  >
                    <DollarSign size={16} />
                    Registrar Pagamento
                  </button>
                )}
                <DollarSign size={24} className={overduePayments.length === 0 ? 'text-emerald-400' : 'text-amber-400'} />
              </div>
            </div>

            {/* Tabela de Mensalidades */}
            <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
              <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <p className="text-sm font-bold text-slate-700">Histórico de Mensalidades</p>
                <Badge variant="neutral">{associateFees.length} Parcela(s)</Badge>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">Vencimento</th>
                    <th className="px-4 py-2 text-left font-semibold">Status</th>
                    <th className="px-4 py-2 text-right font-semibold">Valor</th>
                    <th className="px-4 py-2 text-right font-semibold">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {associateFees.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic">
                        Nenhuma mensalidade gerada para este associado.
                      </td>
                    </tr>
                  ) : (
                    associateFees.map(fee => {
                      const isFeeOverdue = fee.status === 'PENDING' && new Date(fee.date + 'T12:00:00') < new Date();
                      return (
                        <tr key={fee.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-medium">
                            {(() => {
                              const [y, m, d] = fee.date.split('-');
                              return `${d} /${m}/${y} `;
                            })()}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={fee.status === 'COMPLETED' ? 'success' : (isFeeOverdue ? 'danger' : 'warning')}>
                              {fee.status === 'COMPLETED' ? 'PAGO' : (isFeeOverdue ? 'ATRASADO' : 'PENDENTE')}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right font-bold">R$ {fee.amount.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right">
                            {fee.status === 'PENDING' && (
                              <button
                                onClick={() => {
                                  setIsDetailsOpen(false);
                                  navigate('/financial', {
                                    state: {
                                      highlightOverdue: true,
                                      associateId: selectedAssociate.id,
                                      feeId: fee.id
                                    }
                                  });
                                }}
                                className="text-xs font-bold text-brand-600 hover:underline"
                              >
                                Pagar
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'HISTORY':
        const today = new Date();
        const associateShifts = allShifts.filter(s =>
          s.confirmedMembers.includes(selectedAssociate.name) &&
          new Date(s.fullDate) < today &&
          s.status === 'CONFIRMED'
        );

        const totalRemuneration = associateShifts.reduce((sum, s) => sum + s.amount, 0);

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 bg-brand-50 border-brand-100 flex flex-col items-center justify-center text-center">
                <div className="p-2 bg-white rounded-lg shadow-sm mb-2">
                  <Calendar size={18} className="text-brand-600" />
                </div>
                <p className="text-[9px] font-black text-brand-600 uppercase tracking-widest mb-1">Plantões Realizados</p>
                <p className="text-2xl font-black text-slate-900">{associateShifts.length}</p>
              </Card>
              <Card className="p-4 bg-emerald-50 border-emerald-100 flex flex-col items-center justify-center text-center">
                <div className="p-2 bg-white rounded-lg shadow-sm mb-2">
                  <DollarSign size={18} className="text-emerald-600" />
                </div>
                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Retorno Financeiro</p>
                <p className="text-2xl font-black text-slate-900">R$ {totalRemuneration.toFixed(2)}</p>
              </Card>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Clock size={14} /> Detalhamento de Plantões
              </h4>
              <div className="space-y-3">
                {associateShifts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-xs italic font-medium">Nenhum plantão concluído até o momento.</p>
                  </div>
                ) : (
                  associateShifts.sort((a, b) => b.fullDate.localeCompare(a.fullDate)).map((shift, i) => (
                    <div key={i} className="flex gap-4 p-4 bg-white hover:bg-slate-50 rounded-xl transition-all border border-slate-100 group shadow-sm">
                      <div className="flex flex-col items-center justify-center bg-slate-100 rounded-lg px-3 py-1 h-fit group-hover:bg-brand-50 transition-colors">
                        <span className="text-[10px] font-black text-brand-600 uppercase leading-tight">{shift.day.substring(0, 3)}</span>
                        <span className="text-sm font-black text-slate-700">{shift.date}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h5 className="text-sm font-bold text-slate-900 uppercase">{shift.team}</h5>
                          <span className="text-xs font-bold text-emerald-600">R$ {shift.amount.toFixed(2)}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                          <MapPin size={10} /> {shift.location} • <Clock size={10} /> {shift.startTime}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Quadro de Membros</h2>
          <p className="text-slate-500 text-sm">Gestão de bombeiros, estagiários e diretoria da corporação.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExport}>
            <Download size={18} className="mr-2" /> Exportar CSV
          </Button>
          {canEdit && (
            <Button onClick={handleOpenNew} className="flex items-center gap-2">
              <Plus size={18} /> Novo Associado
            </Button>
          )}
        </div>
      </div>

      <Card className="p-4 flex flex-col md:flex-row gap-4 bg-white">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input
            placeholder="Buscar por nome ou e-mail..."
            className="pl-10 h-10"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-4">Membro</th>
                <th className="px-6 py-4">Função</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Financeiro</th>
                <th className="px-6 py-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <Clock className="animate-spin text-brand-500" size={24} />
                      <p>Sincronizando dados...</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    Nenhum associado encontrado.
                  </td>
                </tr>
              ) : filtered.map((associate) => (
                <tr key={associate.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={associate.avatar}
                        alt={associate.name}
                        fallback={associate.name.substring(0, 2)}
                        size="sm"
                      />
                      <div>
                        <p className="font-semibold text-slate-900">{associate.name}</p>
                        <p className="text-xs text-slate-500">{associate.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="neutral">{translateRole(associate.role)}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    {associate.status === 'ACTIVE' ? (
                      <span className="flex items-center gap-1.5 text-emerald-600 font-medium text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Ativo
                      </span>
                    ) : (
                      <Badge variant="warning">{translateStatus(associate.status)}</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={
                      associate.paymentStatus === 'UP_TO_DATE' ? 'success' :
                        associate.paymentStatus === 'LATE' ? 'danger' : 'warning'
                    }>
                      {translatePaymentStatus(associate.paymentStatus)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleViewDetails(associate)}>
                        <FileText size={16} />
                      </Button>
                      {canEdit && (
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(associate)}>
                          <Edit2 size={16} />
                        </Button>
                      )}
                      {canEdit && (
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(associate.id)} className="text-red-400 hover:text-red-500">
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit/Create Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Editar Associado' : 'Novo Associado'} maxWidth="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Nome Completo" placeholder="Ex: João da Silva" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
          <Input label="E-mail de Contato" type="email" placeholder="email@exemplo.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />

          <div className="grid grid-cols-1 gap-4">
            <Input label="Telefone / Celular" mask="phone" placeholder="(00) 00000-0000" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Cargo</label>
              <select
                className="w-full h-12 px-5 bg-white border border-slate-300 rounded-lg text-base font-bold text-slate-700 focus:border-brand-500 outline-none"
                value={isCustomRole ? 'CUSTOM' : formData.role}
                onChange={e => {
                  if (e.target.value === 'CUSTOM') {
                    setIsCustomRole(true);
                    setFormData({ ...formData, role: '' });
                  } else {
                    setIsCustomRole(false);
                    setFormData({ ...formData, role: e.target.value });
                  }
                }}
              >
                <option value="Bombeiro Civil">Bombeiro Civil</option>
                <option value="Recruta">Recruta</option>
                <option value="Presidente">Presidente</option>
                <option value="Secretário(a)">Secretário(a)</option>
                <option value="Tesoureiro(a)">Tesoureiro(a)</option>
                <option value="Vice presidente">Vice presidente</option>
                <option value="Instrutor(a)">Instrutor(a)</option>
                <option value="CUSTOM">Outra função...</option>
              </select>
            </div>
          </div>

          {isCustomRole && (
            <div className="animate-in slide-in-from-top-2 duration-200">
              <Input
                label="Nome da Nova Função"
                placeholder="Digite o cargo customizado"
                value={formData.role === 'CUSTOM' ? '' : formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
                required
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
              <select
                className="w-full h-12 px-5 bg-white border border-slate-300 rounded-lg text-base font-bold text-slate-700 focus:border-brand-500 outline-none"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
              >
                <option value="ACTIVE">Ativo</option>
                <option value="INACTIVE">Inativo</option>
                <option value="PENDING">Pendente</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Salvar Alterações</Button>
          </div>
        </form>
      </Modal>

      {/* Details Modal */}
      <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="Detalhes do Associado" maxWidth="2xl">
        {selectedAssociate && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
              <Avatar src={selectedAssociate.avatar} alt={selectedAssociate.name} fallback={selectedAssociate.name.substring(0, 2)} size="lg" />
              <div>
                <h3 className="text-xl font-bold text-slate-900">{selectedAssociate.name}</h3>
                <p className="text-sm text-slate-500">{translateRole(selectedAssociate.role)}</p>
                <Badge variant={selectedAssociate.status === 'ACTIVE' ? 'success' : 'neutral'} className="mt-1">
                  {selectedAssociate.status}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 p-1 bg-slate-100 rounded-lg">
              {(['OVERVIEW', 'FINANCIAL', 'HISTORY'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setDetailsTab(tab)}
                  className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${detailsTab === tab ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {tab === 'OVERVIEW' ? 'Perfil' : tab === 'FINANCIAL' ? 'Financeiro' : 'Histórico'}
                </button>
              ))}
            </div>

            <div className="min-h-[200px]">
              {renderDetailsContent()}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button onClick={() => setIsDetailsOpen(false)}>Fechar</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};