import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, Download, Trash2, Edit2, X, FileText, Calendar, DollarSign, Clock, Save, AlertCircle, ArrowRight, Users, Shield, MapPin } from 'lucide-react';
import { Card, Button, Input, Badge, Avatar, Modal } from '../components/ui';
import { Associate, Transaction, User, UserRole, translateRole, translateStatus, translatePaymentStatus } from '../types';
import { associatesService } from '../services/associates';
import { scheduleService } from '../services/schedule';
import { financialService } from '../services/financial';
import { Shift } from '../types';
import { AssociateDetails } from '../components/associates/AssociateDetails';

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
    const standardRoles = ['Presidente', 'Vice presidente', 'Tesoureiro(a)', 'Secretário(a)', 'Instrutor(a)', 'Bombeiro Civil', 'Recruta'];
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

  const ROLE_HIERARCHY: Record<string, number> = {
    'Presidente': 1,
    'Vice presidente': 2,
    'Tesoureiro(a)': 3,
    'Secretário(a)': 4,
    'Instrutor(a)': 5,
    'Bombeiro Civil': 6,
    'Recruta': 7
  };

  const filtered = associates
    .filter(a =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const rankA = ROLE_HIERARCHY[a.role] || 99;
      const rankB = ROLE_HIERARCHY[b.role] || 99;
      if (rankA !== rankB) return rankA - rankB;
      return a.name.localeCompare(b.name);
    });

  // --- Render Helpers ---

  const renderDetailsContent = () => (
    <AssociateDetails
      associate={selectedAssociate!}
      transactions={allTransactions}
      shifts={allShifts}
      tab={detailsTab}
      notes={associateNotes}
      onPayFee={(feeId) => {
        setIsDetailsOpen(false);
        navigate('/financial', {
          state: {
            highlightOverdue: true,
            associateId: selectedAssociate!.id,
            feeId
          }
        });
      }}
      canEdit={canEdit}
    />
  );

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Telefone / Celular"
              mask="phone"
              placeholder="(00) 00000-0000"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Cargo</label>
              <select
                className="w-full h-12 px-5 bg-white border border-slate-300 rounded-lg text-base font-bold text-slate-700 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
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
                <option value="Presidente">Presidente</option>
                <option value="Vice presidente">Vice presidente</option>
                <option value="Tesoureiro(a)">Tesoureiro(a)</option>
                <option value="Secretário(a)">Secretário(a)</option>
                <option value="Instrutor(a)">Instrutor(a)</option>
                <option value="Bombeiro Civil">Bombeiro Civil</option>
                <option value="Recruta">Recruta</option>
                <option value="CUSTOM">Outra função...</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
              <select
                className="w-full h-12 px-5 bg-white border border-slate-300 rounded-lg text-base font-bold text-slate-700 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
              >
                <option value="ACTIVE">Ativo</option>
                <option value="INACTIVE">Inativo</option>
                <option value="PENDING">Pendente</option>
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
                  {translateStatus(selectedAssociate.status)}
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