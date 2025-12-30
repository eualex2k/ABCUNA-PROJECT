import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { DollarSign, ArrowUpCircle, ArrowDownCircle, PieChart, Download, Users, ChevronLeft, Calendar, Wallet, BellRing, CheckCircle2, AlertTriangle, X, CreditCard, Search, Banknote, Filter, Send, Edit3, Plus, RotateCcw, ArrowUpRight, Shield, TrendingUp, Trash2 } from 'lucide-react';
import { Card, Button, Badge, Modal, Input, Avatar, Textarea, StatCard } from '../components/ui';
import { Transaction, Associate, User, UserRole, translateStatus, translateTransactionType, translateCategory } from '../types';
import { associatesService } from '../services/associates';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { notificationService } from '../services/notifications';
import { financialService } from '../services/financial';



type ModalStep = 'MENU' | 'INCOME' | 'EXPENSE' | 'FEES';

// --- New Types for Fee Management ---
interface FeeRecord {
  id: string;
  associateId: string;
  associateName: string;
  dueDate: string; // ISO Date
  amount: number;
  status: 'LATE' | 'OPEN' | 'PAID' | 'PARTIAL';
  monthRef: string; // e.g., "Junho/2024"
}

// Initial Fees Data - empty now as it should be derived or stored in DB
const INITIAL_FEES: FeeRecord[] = [];

interface FinancialPageProps {
  user: User;
}

export const FinancialPage: React.FC<FinancialPageProps> = ({ user }) => {
  const canEdit = [UserRole.ADMIN, UserRole.FINANCIAL].includes(user.role);
  const location = useLocation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [feesList, setFeesList] = useState<FeeRecord[]>(INITIAL_FEES);

  const [realAssociates, setRealAssociates] = useState<Associate[]>([]);

  useEffect(() => {
    loadTransactions();
    loadAssociates();
  }, []);

  const loadAssociates = async () => {
    try {
      const data = await associatesService.getAll();
      setRealAssociates(data);
    } catch (error) {
      console.error('Failed to load associates', error);
    }
  };

  const loadTransactions = async () => {
    try {
      const data = await financialService.getAll();
      setTransactions(data);
    } catch (error) {
      console.error('Failed to load transactions', error);
      showToast('Erro ao carregar movimentações', 'info');
    }
  };

  // Derive feesList automatically
  useEffect(() => {
    const derivedFees: FeeRecord[] = transactions
      .filter(tx => tx.category === 'Mensalidade' || tx.category === 'Mensalidades')
      .map(tx => {
        const assoc = realAssociates.find(a => a.id === tx.payer_id);
        const dObj = new Date(tx.date + 'T12:00:00');
        const isOverdue = tx.status === 'PENDING' && dObj < new Date();

        let monthRef = 'N/A';
        try {
          const d = new Date(tx.date + 'T12:00:00'); // Ensure middle of day to avoid TZ shift
          const m = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
          monthRef = m.charAt(0).toUpperCase() + m.slice(1);
        } catch (e) { }

        return {
          id: tx.id,
          associateId: tx.payer_id || '',
          associateName: assoc ? assoc.name : 'Associado Externo',
          dueDate: tx.date,
          amount: tx.amount,
          status: tx.status === 'COMPLETED' ? 'PAID' : (isOverdue ? 'LATE' : 'OPEN'),
          monthRef: monthRef
        };
      });
    setFeesList(derivedFees);
  }, [transactions, realAssociates]);

  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false); // For New Movement
  const [isFeesManagerOpen, setIsFeesManagerOpen] = useState(false); // For Fee Management
  const [isOverduePreviewOpen, setIsOverduePreviewOpen] = useState(false); // New: Preview Modal for Notifications

  const [feePaymentStep, setFeePaymentStep] = useState<'LIST' | 'PAYMENT' | 'EDIT'>('LIST');
  const [selectedFee, setSelectedFee] = useState<FeeRecord | null>(null);

  // Fee List Filter State
  const [filterAssociateId, setFilterAssociateId] = useState<string>('ALL');

  // Fee Selection State for Deletion
  const [selectedFeeIds, setSelectedFeeIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const [modalStep, setModalStep] = useState<ModalStep>('MENU');

  // Toast Notification State
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'info' }>({
    visible: false, message: '', type: 'info'
  });

  // Calculate Overdue for Alerts
  const overdueFees = feesList.filter(f => f.status === 'LATE');
  const overdueCount = overdueFees.length;

  // Form States
  const [incomeForm, setIncomeForm] = useState({ title: '', amount: '', date: '', category: 'Doação', payerId: '', description: '', isCustomCategory: false, isCustomPayer: false, customCategory: '', customPayer: '' });
  const [expenseForm, setExpenseForm] = useState({ title: '', amount: '', date: '', category: 'Manutenção', recipientId: '', description: '', isCustomCategory: false, isCustomRecipient: false, customCategory: '', customRecipient: '' });
  const [feesForm, setFeesForm] = useState(() => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    const dateStr = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`;
    return { amount: '30.00', quantity: 1, startDate: dateStr, associateId: 'ALL' };
  });

  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);

  // Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    date: (() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    })(),
    amount: '',
    method: 'PIX',
    observation: ''
  });

  // Edit Fee Form State
  const [editFeeForm, setEditFeeForm] = useState({
    amount: '',
    dueDate: '',
    description: ''
  });

  // Handle auto-open via Navigation State
  useEffect(() => {
    // Abrir modal de mensalidades quando vem de outra página
    if (location.state?.openFeesManager) {
      setIsFeesManagerOpen(true);
      if (location.state?.filterAssociateId) {
        setFilterAssociateId(location.state.filterAssociateId);
      }
    }

    // Abrir modal de mensalidades quando vem do Associates com débito
    if (location.state?.highlightOverdue && location.state?.associateId) {
      setIsFeesManagerOpen(true);
      setFilterAssociateId(location.state.associateId);

      // Se tiver uma mensalidade específica, já abre o pagamento
      if (location.state.feeId && feesList.length > 0) {
        const targetFee = feesList.find(f => f.id === location.state.feeId);
        if (targetFee) {
          handleSelectFeeToPay(targetFee);
          // Limpar o state para evitar re-abertura
          window.history.replaceState({}, document.title);
        }
      } else if (!location.state.feeId) {
        setFeePaymentStep('LIST');
        showToast(`Mostrando mensalidades de ${realAssociates.find(a => a.id === location.state.associateId)?.name || 'associado'}`, 'info');
        window.history.replaceState({}, document.title);
      }
    }
  }, [location, realAssociates, feesList]);

  // Auto-hide toast
  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => setToast({ ...toast, visible: false }), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ visible: true, message, type });
  };

  const handleNotifyOverdueClick = () => {
    if (overdueCount === 0) {
      showToast('Parabéns! Não há mensalidades atrasadas no momento.', 'info');
      return;
    }
    // Open preview modal instead of sending immediately
    setIsOverduePreviewOpen(true);
  };

  const confirmNotifyOverdue = () => {
    // Trigger System Notification
    notificationService.add({
      title: 'Cobrança de Atrasados',
      message: `${overdueCount} associados foram notificados sobre pendências financeiras.`,
      type: 'FINANCIAL'
    });

    setIsOverduePreviewOpen(false);
    showToast(`Lembretes enviados para ${overdueCount} associados com pendências.`, 'success');
  };

  const handleOpenModal = () => {
    setModalStep('MENU');
    setEditingTransactionId(null);
    resetForms();
    setIsModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransactionId(tx.id);
    if (tx.type === 'INCOME') {
      setIncomeForm({
        title: tx.description,
        amount: tx.amount.toString(),
        date: tx.date.split('T')[0],
        category: tx.category,
        payerId: tx.payer_id || '',
        description: tx.notes || '',
        isCustomCategory: true, // defaulting to custom to allow simple editing of the text
        customCategory: tx.category,
        isCustomPayer: false,
        customPayer: ''
      });
      setModalStep('INCOME');
    } else {
      setExpenseForm({
        title: tx.description,
        amount: tx.amount.toString(),
        date: tx.date.split('T')[0],
        category: tx.category,
        recipientId: tx.recipient_id || '',
        description: tx.notes || '',
        isCustomCategory: true,
        customCategory: tx.category,
        isCustomRecipient: false,
        customRecipient: ''
      });
      setModalStep('EXPENSE');
    }
    setIsModalOpen(true);
  };

  // --- Fee Management Logic ---

  const handleOpenFeesManager = () => {
    setFeePaymentStep('LIST');
    setSelectedFee(null);
    setFilterAssociateId('ALL');
    setSelectedFeeIds([]); // Reset selection
    setIsSelectionMode(false); // Reset selection mode
    setIsFeesManagerOpen(true);
  };

  const toggleFeeSelection = (feeId: string) => {
    setSelectedFeeIds(prev =>
      prev.includes(feeId)
        ? prev.filter(id => id !== feeId)
        : [...prev, feeId]
    );
  };

  const selectAllFilteredFees = () => {
    const filteredIds = sortedFees
      .filter(f => f.status !== 'PAID')
      .map(f => f.id);
    setSelectedFeeIds(filteredIds);
  };

  const deselectAllFees = () => {
    setSelectedFeeIds([]);
  };

  const deleteSelectedFees = async () => {
    if (selectedFeeIds.length === 0) return;

    const confirmMessage = `Tem certeza que deseja excluir ${selectedFeeIds.length} mensalidade(s)?\n\nEsta ação não pode ser desfeita.`;

    if (!confirm(confirmMessage)) return;

    try {
      const count = selectedFeeIds.length;
      // Optimistic update: remove from local state first
      const idsToDelete = [...selectedFeeIds];
      setTransactions(prev => prev.filter(tx => !idsToDelete.includes(tx.id)));
      setSelectedFeeIds([]);
      setIsSelectionMode(false);

      // Execute on server
      await financialService.deleteBulk(idsToDelete);

      showToast(`${count} mensalidade(s) excluída(s) com sucesso!`);
      loadTransactions(); // Still reload to ensure sync with server
    } catch (err: any) {
      console.error(err);
      showToast('Erro ao excluir mensalidades. Verifique sua conexão.', 'info');
      loadTransactions(); // Rollback/Resync
    }
  };

  const handleDeleteSingleFee = async () => {
    if (!selectedFee) return;

    if (!confirm(`Tem certeza que deseja excluir a mensalidade de ${selectedFee.associateName} referente a ${selectedFee.monthRef}?`)) {
      return;
    }

    try {
      await financialService.delete(selectedFee.id);
      showToast('Mensalidade excluída com sucesso!');
      loadTransactions();
      setFeePaymentStep('LIST');
      setSelectedFee(null);
    } catch (err: any) {
      console.error(err);
      showToast('Erro ao excluir mensalidade.', 'info');
    }
  };

  const handleSelectFeeToPay = (fee: FeeRecord) => {
    setSelectedFee(fee);
    setPaymentForm({
      date: (() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      })(),
      amount: fee.amount.toFixed(2),
      method: 'PIX',
      observation: ''
    });
    setFeePaymentStep('PAYMENT');
  };

  const handleEditFee = (fee: FeeRecord) => {
    setSelectedFee(fee);
    setEditFeeForm({
      amount: fee.amount.toFixed(2),
      dueDate: fee.dueDate,
      description: ''
    });
    setFeePaymentStep('EDIT');
  };

  const processFeeEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFee) return;

    try {
      // Update the transaction with new values
      await financialService.update(selectedFee.id, {
        amount: parseFloat(editFeeForm.amount),
        date: editFeeForm.dueDate,
        notes: editFeeForm.description || undefined
      });

      showToast(`Mensalidade de ${selectedFee.associateName} atualizada!`);
      loadTransactions();
      setFeePaymentStep('LIST');
      setSelectedFee(null);
    } catch (err: any) {
      console.error(err);
      showToast('Erro ao atualizar mensalidade.', 'info');
    }
  };

  const processFeePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFee) return;

    try {
      // Update the existing transaction status to COMPLETED
      const [py, pm, pd] = paymentForm.date.split('-');
      const dateDisplay = `${pd}/${pm}/${py}`;

      await financialService.update(selectedFee.id, {
        status: 'COMPLETED',
        description: `${selectedFee.monthRef} - ${selectedFee.associateName} (Pago em ${dateDisplay})`
      });

      showToast(`Pagamento de ${selectedFee.associateName} registrado!`);
      loadTransactions();
      setFeePaymentStep('LIST');
      setSelectedFee(null);
    } catch (err: any) {
      console.error(err);
      showToast('Erro ao processar pagamento.', 'info');
    }
  };

  // Filter and Sorting Logic for Fees List
  const filteredFees = feesList.filter(f =>
    filterAssociateId === 'ALL' ? true : f.associateId === filterAssociateId
  );

  const sortedFees = [...filteredFees].sort((a, b) => {
    // 1. Priority: Late first
    if (a.status === 'LATE' && b.status !== 'LATE') return -1;
    if (a.status !== 'LATE' && b.status === 'LATE') return 1;

    // 2. Month/Date - Use string comparison for YYYY-MM-DD which is safe
    if (a.dueDate < b.dueDate) return -1;
    if (a.dueDate > b.dueDate) return 1;

    // 3. Alphabetical
    return a.associateName.localeCompare(b.associateName);
  });

  const renderFeesManagerContent = () => {
    if (feePaymentStep === 'LIST') {
      return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
            <h3 className="font-semibold text-slate-700">Controle de Mensalidades</h3>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Toggle Selection Mode Button */}
              {canEdit && (
                <Button
                  variant={isSelectionMode ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => {
                    setIsSelectionMode(!isSelectionMode);
                    if (!isSelectionMode) setSelectedFeeIds([]);
                  }}
                  className="h-8 text-xs font-bold"
                >
                  {isSelectionMode ? (
                    <><X size={14} className="mr-1" /> Cancelar Seleção</>
                  ) : (
                    <><CheckCircle2 size={14} className="mr-1" /> Selecionar</>
                  )}
                </Button>
              )}

              {/* Filter Dropdown */}
              <div className="flex items-center gap-2 bg-white border border-slate-300 rounded px-2 h-8">
                <Filter size={14} className="text-slate-400" />
                <select
                  className="text-xs bg-transparent border-none focus:ring-0 outline-none"
                  value={filterAssociateId}
                  onChange={(e) => setFilterAssociateId(e.target.value)}
                >
                  <option value="ALL">Mostrar Todos</option>
                  {realAssociates.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Selection Toolbar - Only shows in Selection Mode */}
          {isSelectionMode && canEdit && sortedFees.filter(f => f.status !== 'PAID').length > 0 && (
            <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-100 rounded-xl border border-slate-200 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                  checked={selectedFeeIds.length > 0 && selectedFeeIds.length === sortedFees.filter(f => f.status !== 'PAID').length}
                  onChange={(e) => {
                    if (e.target.checked) selectAllFilteredFees();
                    else deselectAllFees();
                  }}
                  id="select-all-checkbox"
                />
                <label htmlFor="select-all-checkbox" className="text-xs font-bold text-slate-700 cursor-pointer">
                  {selectedFeeIds.length === 0 ? 'Selecionar Todas' : `Selecionadas: ${selectedFeeIds.length}`}
                </label>
              </div>

              {selectedFeeIds.length > 0 && (
                <div className="ml-auto flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={deselectAllFees}
                    className="h-8 text-[10px] font-bold uppercase bg-white"
                  >
                    Limpar
                  </Button>

                  <Button
                    size="sm"
                    onClick={deleteSelectedFees}
                    className="h-8 text-[10px] font-bold uppercase bg-red-600 hover:bg-red-700 text-white border-none shadow-sm"
                  >
                    <Trash2 size={14} className="mr-1" />
                    Excluir ({selectedFeeIds.length})
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="max-h-[500px] overflow-y-auto pr-1 space-y-3">
            {sortedFees.filter(f => f.status !== 'PAID').map(fee => (
              <div
                key={fee.id}
                className={`p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3 transition-all ${selectedFeeIds.includes(fee.id) ? 'bg-brand-50/50 border-brand-200 ring-1 ring-brand-200' : 'bg-white hover:border-slate-300'
                  }`}
              >
                <div className="flex items-start gap-4 flex-1">
                  {isSelectionMode && (
                    <div className="pt-1 animate-in zoom-in-50 duration-200">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                        checked={selectedFeeIds.includes(fee.id)}
                        onChange={() => toggleFeeSelection(fee.id)}
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-900">{fee.associateName}</span>
                      <Badge variant={fee.status === 'LATE' ? 'danger' : 'warning'}>
                        {translateStatus(fee.status)}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-500 flex gap-3">
                      <span className="flex items-center gap-1"><Calendar size={12} /> Venc: {(() => {
                        const [y, m, d] = fee.dueDate.split('-');
                        return `${d}/${m}/${y}`;
                      })()}</span>
                      <span>Ref: {fee.monthRef}</span>
                    </div>
                  </div>
                </div>
                <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto ${isSelectionMode ? 'ml-8' : ''} md:ml-0`}>
                  <span className="font-black text-slate-700 text-lg">R$ {fee.amount.toFixed(2)}</span>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditFee(fee)}
                      className="h-9 text-xs font-bold px-4 flex-1 sm:flex-none border-slate-200 bg-white hover:bg-slate-50"
                    >
                      <Edit3 size={14} className="mr-1.5" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleSelectFeeToPay(fee)}
                      className="h-9 text-xs font-bold px-4 flex-1 sm:flex-none shadow-sm"
                    >
                      Registrar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {sortedFees.filter(f => f.status !== 'PAID').length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <CheckCircle2 size={32} className="mx-auto mb-2 text-green-500" />
                <p>
                  {filterAssociateId === 'ALL'
                    ? 'Tudo em dia! Nenhuma mensalidade pendente.'
                    : 'Nenhuma pendência para este associado.'}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (feePaymentStep === 'EDIT') {
      return (
        <form onSubmit={processFeeEdit} className="space-y-4 animate-in fade-in slide-in-from-right-4">
          <div className="flex items-center gap-2 text-slate-600 mb-4 cursor-pointer hover:text-brand-600" onClick={() => setFeePaymentStep('LIST')}>
            <ChevronLeft size={20} /> <span className="text-sm font-medium">Voltar para lista</span>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
            <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Edit3 size={16} className="text-blue-600" />
              Editar Mensalidade
            </h4>
            <div className="text-sm text-slate-600">
              Associado: <span className="font-semibold">{selectedFee?.associateName}</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Referência Original: {selectedFee?.monthRef}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Novo Valor (R$)"
              type="number"
              step="0.01"
              value={editFeeForm.amount}
              onChange={e => setEditFeeForm({ ...editFeeForm, amount: e.target.value })}
              required
            />
            <Input
              label="Nova Data de Vencimento"
              type="date"
              value={editFeeForm.dueDate}
              onChange={e => setEditFeeForm({ ...editFeeForm, dueDate: e.target.value })}
              required
            />
          </div>

          <Textarea
            label="Observações sobre a Alteração"
            placeholder="Ex: Valor ajustado por acordo especial..."
            value={editFeeForm.description}
            onChange={e => setEditFeeForm({ ...editFeeForm, description: e.target.value })}
            className="h-24"
          />

          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
              <CheckCircle2 size={18} className="mr-2" /> Salvar Alterações
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleDeleteSingleFee}
              className="border-red-200 text-red-600 hover:bg-red-50"
              title="Excluir Mensalidade"
            >
              <Trash2 size={18} />
            </Button>
          </div>
        </form>
      );
    }

    if (feePaymentStep === 'PAYMENT') {
      return (
        <form onSubmit={processFeePayment} className="space-y-4 animate-in fade-in slide-in-from-right-4">
          <div className="flex items-center gap-2 text-slate-600 mb-4 cursor-pointer hover:text-brand-600" onClick={() => setFeePaymentStep('LIST')}>
            <ChevronLeft size={20} /> <span className="text-sm font-medium">Voltar para lista</span>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4">
            <h4 className="font-bold text-slate-900 mb-1">{selectedFee?.associateName}</h4>
            <div className="text-sm text-slate-500 flex justify-between">
              <span>Referência: {selectedFee?.monthRef}</span>
              <span className="font-semibold text-slate-700">Valor Original: R$ {selectedFee?.amount.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Data do Pagamento"
              type="date"
              value={paymentForm.date}
              onChange={e => setPaymentForm({ ...paymentForm, date: e.target.value })}
              required
            />
            <Input
              label="Valor Recebido (R$)"
              type="number"
              step="0.01"
              value={paymentForm.amount}
              onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Forma de Pagamento</label>
            <select
              className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm focus:border-brand-500"
              value={paymentForm.method}
              onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value })}
            >
              <option value="PIX">Pix</option>
              <option value="CASH">Dinheiro / Espécie</option>
              <option value="CARD">Cartão de Crédito/Débito</option>
              <option value="BANK">Transferência Bancária</option>
            </select>
          </div>

          <Input
            label="Observações"
            placeholder="Ex: Pagamento parcial, restante mês que vem..."
            value={paymentForm.observation}
            onChange={e => setPaymentForm({ ...paymentForm, observation: e.target.value })}
          />

          <Button type="submit" className="w-full mt-2 bg-green-600 hover:bg-green-700">
            <CheckCircle2 size={18} className="mr-2" /> Confirmar Pagamento
          </Button>
        </form>
      );
    }

    return null;
  };

  // --- End Fee Management Logic ---

  const handleSaveIncome = async (e: React.FormEvent) => {
    e.preventDefault();

    // Determine Category
    const finalCategory = incomeForm.isCustomCategory ? incomeForm.customCategory : incomeForm.category;

    const txData: Omit<Transaction, 'id'> = {
      description: incomeForm.title,
      amount: parseFloat(incomeForm.amount),
      type: 'INCOME',
      category: finalCategory || 'Geral',
      status: 'COMPLETED',
      date: incomeForm.date,
      payer_id: incomeForm.payerId || undefined,
      notes: incomeForm.description
    };

    try {
      if (editingTransactionId) {
        await financialService.update(editingTransactionId, txData);
        showToast('Movimentação atualizada com sucesso!');
      } else {
        await financialService.create(txData);
        showToast('Entrada registrada com sucesso!');
      }
      loadTransactions(); // Reload to get fresh data
    } catch (err: any) {
      console.error(err);
      showToast(`Erro ao salvar registro: ${err.message || 'Erro desconhecido'}`, 'info');
    }

    setIsModalOpen(false);
    resetForms();
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    // Determine Category
    const finalCategory = expenseForm.isCustomCategory ? expenseForm.customCategory : expenseForm.category;

    const txData: Omit<Transaction, 'id'> = {
      description: expenseForm.title,
      amount: parseFloat(expenseForm.amount),
      type: 'EXPENSE',
      category: finalCategory || 'Geral',
      status: 'COMPLETED',
      date: expenseForm.date,
      recipient_id: expenseForm.recipientId || undefined,
      notes: expenseForm.description
    };

    try {
      if (editingTransactionId) {
        await financialService.update(editingTransactionId, txData);
        showToast('Movimentação atualizada com sucesso!');
      } else {
        await financialService.create(txData);
        showToast('Saída registrada com sucesso!');
      }
      loadTransactions();
    } catch (err: any) {
      console.error(err);
      showToast(`Erro ao salvar registro: ${err.message || 'Erro desconhecido'}`, 'info');
    }

    setIsModalOpen(false);
    resetForms();
  };

  const handleDeleteTransaction = async () => {
    if (!editingTransactionId) return;

    if (!confirm('Tem certeza que deseja excluir esta movimentação? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await financialService.delete(editingTransactionId);
      showToast('Movimentação excluída com sucesso!');
      loadTransactions();
      setIsModalOpen(false);
      resetForms();
    } catch (err: any) {
      console.error(err);
      showToast('Erro ao excluir movimentação.', 'info');
    }
  };

  const handleGenerateFees = async (e: React.FormEvent) => {
    e.preventDefault();
    const count = feesForm.quantity;
    const targets = feesForm.associateId === 'ALL' ? realAssociates.filter(a => a.status === 'ACTIVE') : realAssociates.filter(a => a.id === feesForm.associateId);

    let startYear: number, startMonth: number;
    if (feesForm.startDate) {
      const parts = feesForm.startDate.split('-');
      startYear = parseInt(parts[0]);
      startMonth = parseInt(parts[1]) - 1;
    } else {
      const now = new Date();
      startYear = now.getFullYear();
      startMonth = now.getMonth();
    }

    try {
      const promises = [];
      for (const assoc of targets) {
        for (let i = 0; i < count; i++) {
          // Force day 1 of the target month
          const targetDate = new Date(startYear, startMonth + i, 1);

          // Generate YYYY-MM-DD string using LOCAL components to avoid TZ shifts
          const year = targetDate.getFullYear();
          const month = String(targetDate.getMonth() + 1).padStart(2, '0');
          const day = String(targetDate.getDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`;

          const monthName = targetDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
          const monthRef = monthName.charAt(0).toUpperCase() + monthName.slice(1);

          promises.push(financialService.create({
            description: `Mensalidade ${monthRef}`,
            amount: parseFloat(feesForm.amount),
            type: 'INCOME',
            category: 'Mensalidade',
            status: 'PENDING',
            date: dateStr,
            payer_id: assoc.id
          }));
        }
      }

      await Promise.all(promises);

      notificationService.add({
        title: 'Novas Mensalidades Geradas',
        message: `${promises.length} novas cobranças foram emitidas.`,
        type: 'FINANCIAL',
        link: '/financial'
      });

      loadTransactions();
      setIsModalOpen(false);
      showToast(`${promises.length} mensalidades geradas com sucesso!`);
      resetForms();
    } catch (err: any) {
      console.error(err);
      showToast('Erro ao gerar mensalidades.', 'info');
    }
  };

  const resetForms = () => {
    setIncomeForm({ title: '', amount: '', date: '', category: 'Doação', payerId: '', description: '', isCustomCategory: false, isCustomPayer: false, customCategory: '', customPayer: '' });
    setExpenseForm({ title: '', amount: '', date: '', category: 'Manutenção', recipientId: '', description: '', isCustomCategory: false, isCustomRecipient: false, customCategory: '', customRecipient: '' });

    // Default to the 1st of the next month
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    const defaultStart = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`;

    setFeesForm({ amount: '30.00', quantity: 1, startDate: defaultStart, associateId: 'ALL' });
    setEditingTransactionId(null);
  };

  const renderModalContent = () => {
    switch (modalStep) {
      case 'MENU':
        return (
          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={() => setModalStep('INCOME')}
              className="flex items-center gap-4 p-4 rounded-xl border-2 border-slate-100 hover:border-green-500 hover:bg-green-50 transition-all group text-left"
            >
              <div className="p-3 bg-green-100 text-green-600 rounded-lg group-hover:bg-green-200">
                <ArrowUpCircle size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Registrar Entrada</h4>
                <p className="text-xs text-slate-500">Doações, Patrocínios, Pagamentos avulsos.</p>
              </div>
            </button>

            <button
              onClick={() => setModalStep('EXPENSE')}
              className="flex items-center gap-4 p-4 rounded-xl border-2 border-slate-100 hover:border-red-500 hover:bg-red-50 transition-all group text-left"
            >
              <div className="p-3 bg-red-100 text-red-600 rounded-lg group-hover:bg-red-200">
                <ArrowDownCircle size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Registrar Saída</h4>
                <p className="text-xs text-slate-500">Pagamentos, Manutenção, Compras, Reembolsos.</p>
              </div>
            </button>

            <button
              onClick={() => setModalStep('FEES')}
              className="flex items-center gap-4 p-4 rounded-xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 transition-all group text-left"
            >
              <div className="p-3 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-200">
                <Users size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Gerar Lote de Mensalidades</h4>
                <p className="text-xs text-slate-500">Criar cobranças para associados.</p>
              </div>
            </button>
          </div>
        );

      case 'INCOME':
        return (
          <form onSubmit={handleSaveIncome} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 text-green-600 mb-4 cursor-pointer" onClick={() => setModalStep('MENU')}>
              <ChevronLeft size={20} /> <span className="text-sm font-medium">Voltar</span>
            </div>

            <h3 className="text-lg font-bold text-slate-900">{editingTransactionId ? 'Editar Entrada' : 'Nova Entrada'}</h3>

            <Input label="Título da Entrada" placeholder="Ex: Doação Prefeitura" value={incomeForm.title} onChange={e => setIncomeForm({ ...incomeForm, title: e.target.value })} required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Valor (R$)" type="number" step="0.01" value={incomeForm.amount} onChange={e => setIncomeForm({ ...incomeForm, amount: e.target.value })} required />
              <Input label="Data" type="date" value={incomeForm.date} onChange={e => setIncomeForm({ ...incomeForm, date: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 flex justify-between">
                  Categoria
                  <button type="button" onClick={() => setIncomeForm({ ...incomeForm, isCustomCategory: !incomeForm.isCustomCategory, customCategory: '' })} className="text-xs text-brand-600 hover:underline flex items-center gap-1">
                    {incomeForm.isCustomCategory ? <><RotateCcw size={10} /> Selecionar</> : <><Plus size={10} /> Novo</>}
                  </button>
                </label>
                {incomeForm.isCustomCategory ? (
                  <Input
                    placeholder="Digite a categoria..."
                    value={incomeForm.customCategory}
                    onChange={e => setIncomeForm({ ...incomeForm, customCategory: e.target.value })}
                    required // Only required if custom is active
                  />
                ) : (
                  <select className="w-full h-12 px-5 bg-white border border-slate-300 rounded-lg text-base focus:border-brand-500" value={incomeForm.category} onChange={e => setIncomeForm({ ...incomeForm, category: e.target.value })}>
                    <option value="Doação">Doação</option>
                    <option value="Patrocínio">Patrocínio</option>
                    <option value="Eventos">Eventos</option>
                    <option value="Venda de Ativos">Venda de Ativos</option>
                    <option value="Mensalidades">Mensalidades</option>
                    <option value="Outros">Outros</option>
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 flex justify-between">
                  Pagador
                  <button type="button" onClick={() => setIncomeForm({ ...incomeForm, isCustomPayer: !incomeForm.isCustomPayer, customPayer: '' })} className="text-xs text-brand-600 hover:underline flex items-center gap-1">
                    {incomeForm.isCustomPayer ? <><RotateCcw size={10} /> Selecionar</> : <><Plus size={10} /> Novo</>}
                  </button>
                </label>
                {incomeForm.isCustomPayer ? (
                  <Input
                    placeholder="Nome do Pagador..."
                    value={incomeForm.customPayer}
                    onChange={e => setIncomeForm({ ...incomeForm, customPayer: e.target.value })}
                  />
                ) : (
                  <select className="w-full h-12 px-5 bg-white border border-slate-300 rounded-lg text-base focus:border-brand-500" value={incomeForm.payerId} onChange={e => setIncomeForm({ ...incomeForm, payerId: e.target.value })}>
                    <option value="">Externo / Anônimo</option>
                    {realAssociates.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                )}
              </div>
            </div>
            <Textarea label="Descrição / Observação" value={incomeForm.description} onChange={e => setIncomeForm({ ...incomeForm, description: e.target.value })} className="h-24" />

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
                {editingTransactionId ? 'Salvar Alterações' : 'Confirmar Entrada'}
              </Button>
              {editingTransactionId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDeleteTransaction}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                  title="Excluir Movimentação"
                >
                  <Trash2 size={18} />
                </Button>
              )}
            </div>
          </form>
        );

      case 'EXPENSE':
        return (
          <form onSubmit={handleSaveExpense} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 text-red-600 mb-4 cursor-pointer" onClick={() => setModalStep('MENU')}>
              <ChevronLeft size={20} /> <span className="text-sm font-medium">Voltar</span>
            </div>

            <h3 className="text-lg font-bold text-slate-900">{editingTransactionId ? 'Editar Saída' : 'Nova Saída'}</h3>

            <Input label="Título da Saída" placeholder="Ex: Compra de Combustível" value={expenseForm.title} onChange={e => setExpenseForm({ ...expenseForm, title: e.target.value })} required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Valor (R$)" type="number" step="0.01" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} required />
              <Input label="Data" type="date" value={expenseForm.date} onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 flex justify-between">
                  Categoria
                  <button type="button" onClick={() => setExpenseForm({ ...expenseForm, isCustomCategory: !expenseForm.isCustomCategory, customCategory: '' })} className="text-xs text-brand-600 hover:underline flex items-center gap-1">
                    {expenseForm.isCustomCategory ? <><RotateCcw size={10} /> Selecionar</> : <><Plus size={10} /> Novo</>}
                  </button>
                </label>
                {expenseForm.isCustomCategory ? (
                  <Input
                    placeholder="Digite a categoria..."
                    value={expenseForm.customCategory}
                    onChange={e => setExpenseForm({ ...expenseForm, customCategory: e.target.value })}
                    required
                  />
                ) : (
                  <select className="w-full h-12 px-5 bg-white border border-slate-300 rounded-lg text-base focus:border-brand-500" value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}>
                    <option value="Manutenção">Manutenção</option>
                    <option value="Equipamentos">Equipamentos</option>
                    <option value="Serviços">Serviços</option>
                    <option value="Alimentação">Alimentação</option>
                    <option value="Combustível">Combustível</option>
                    <option value="Pagamento a Associado">Pagamento a Associado</option>
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 flex justify-between">
                  Beneficiário
                  <button type="button" onClick={() => setExpenseForm({ ...expenseForm, isCustomRecipient: !expenseForm.isCustomRecipient, customRecipient: '' })} className="text-xs text-brand-600 hover:underline flex items-center gap-1">
                    {expenseForm.isCustomRecipient ? <><RotateCcw size={10} /> Selecionar</> : <><Plus size={10} /> Novo</>}
                  </button>
                </label>
                {expenseForm.isCustomRecipient ? (
                  <Input
                    placeholder="Nome do Beneficiário..."
                    value={expenseForm.customRecipient}
                    onChange={e => setExpenseForm({ ...expenseForm, customRecipient: e.target.value })}
                  />
                ) : (
                  <select className="w-full h-12 px-5 bg-white border border-slate-300 rounded-lg text-base focus:border-brand-500" value={expenseForm.recipientId} onChange={e => setExpenseForm({ ...expenseForm, recipientId: e.target.value })}>
                    <option value="">Fornecedor Externo</option>
                    {realAssociates.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                )}
              </div>
            </div>
            <Textarea label="Descrição Detalhada" value={expenseForm.description} onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })} className="h-24" />

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700">
                {editingTransactionId ? 'Salvar Alterações' : 'Confirmar Saída'}
              </Button>
              {editingTransactionId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDeleteTransaction}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                  title="Excluir Movimentação"
                >
                  <Trash2 size={18} />
                </Button>
              )}
            </div>
          </form>
        );

      case 'FEES':
        return (
          <form onSubmit={handleGenerateFees} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 text-brand-600 mb-4 cursor-pointer" onClick={() => setModalStep('MENU')}>
              <ChevronLeft size={20} /> <span className="text-sm font-medium">Voltar</span>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p className="text-xs text-blue-700">
                Esta ação gerará registros de cobrança para os associados selecionados.
                <br />
                <span className="font-bold">Nota:</span> O sistema forçará o vencimento para o dia <span className="font-bold underline">01</span> do mês selecionado.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Valor Mensal (R$)" type="number" step="0.01" value={feesForm.amount} onChange={e => setFeesForm({ ...feesForm, amount: e.target.value })} required />
              <Input label="Qtd. Meses" type="number" min="1" max="12" value={feesForm.quantity} onChange={e => setFeesForm({ ...feesForm, quantity: parseInt(e.target.value) })} required />
            </div>
            <Input
              label="Mês de Início"
              type="date"
              value={feesForm.startDate}
              onChange={e => setFeesForm({ ...feesForm, startDate: e.target.value })}
              required
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Associados Alvo</label>
              <select className="w-full h-12 px-5 bg-white border border-slate-300 rounded-lg text-base focus:border-brand-500" value={feesForm.associateId} onChange={e => setFeesForm({ ...feesForm, associateId: e.target.value })}>
                <option value="ALL">Todos os Associados Ativos</option>
                <option disabled>--- Individual ---</option>
                {realAssociates.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <Button type="submit" className="w-full">Gerar Mensalidades</Button>
          </form>
        );
    }
  };

  // Derived state for summary cards
  const completedTransactions = transactions.filter(t => t.status === 'COMPLETED');
  const totalBalance = completedTransactions.reduce((acc, tx) => tx.type === 'INCOME' ? acc + tx.amount : acc - tx.amount, 0);
  const totalIncome = completedTransactions.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = completedTransactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Generate dynamic chart data for the last 30 days
  const chartData = React.useMemo(() => {
    const days = 30;
    const data = [];
    const today = new Date();

    for (let i = days; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      const dayTransactions = completedTransactions.filter(t => t.date === dateStr);
      const entry = dayTransactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
      const exit = dayTransactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);

      data.push({
        name: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        entrada: entry,
        saida: exit
      });
    }
    return data;
  }, [completedTransactions]);

  // Calculate stats for expenses by category
  const categoryStats = React.useMemo(() => {
    const expenses = completedTransactions.filter(t => t.type === 'EXPENSE');
    const total = expenses.reduce((s, t) => s + t.amount, 0);
    if (total === 0) return [];

    const grouped = expenses.reduce((acc: any, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

    const colors = ['bg-blue-500', 'bg-red-500', 'bg-amber-500', 'bg-emerald-500', 'bg-purple-500', 'bg-indigo-500', 'bg-teal-500'];

    return Object.entries(grouped)
      .map(([label, val]: [string, any], i) => ({
        label,
        val: val as number,
        percentage: ((val as number) / total * 100).toFixed(0) + '%',
        color: colors[i % colors.length]
      }))
      .sort((a, b) => b.val - a.val);
  }, [completedTransactions]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Financeiro</h2>
          <p className="text-slate-500 text-sm">Gestão financeira, mensalidades e fluxo de caixa.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {canEdit && (
            <Button variant="outline" onClick={handleOpenFeesManager} className="flex items-center gap-2">
              <CreditCard size={18} /> Mensalidades
            </Button>
          )}
          {canEdit && (
            <Button onClick={handleOpenModal} className="flex items-center gap-2">
              <Plus size={18} /> Novo Lançamento
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Saldo Atual"
          value={formatCurrency(totalBalance)}
          icon={<Wallet size={24} />}
        />
        <StatCard
          title="Total Receitas"
          value={formatCurrency(totalIncome)}
          icon={<ArrowUpCircle size={24} />}
          trend="Entradas"
          trendUp={true}
        />
        <StatCard
          title="Total Despesas"
          value={formatCurrency(totalExpense)}
          icon={<ArrowDownCircle size={24} />}
          trend="Saídas"
          trendUp={false}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp size={20} className="text-slate-400" />
              Fluxo de Caixa (30 dias)
            </h3>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorEntrada" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="entrada" stroke="#10b981" fillOpacity={1} fill="url(#colorEntrada)" strokeWidth={2} />
                <Area type="monotone" dataKey="saida" stroke="#ef4444" fillOpacity={0} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6 border-l-4 border-l-amber-500">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <AlertTriangle size={20} />
              </div>
              <Badge variant="warning">{overdueCount} Pendentes</Badge>
            </div>
            <h4 className="font-bold text-slate-900 mb-1">Inadimplência</h4>
            <p className="text-sm text-slate-500 mb-4">Existem {overdueCount} mensalidades em atraso que precisam de atenção.</p>
            {canEdit && (
              <Button variant="outline" size="sm" onClick={handleNotifyOverdueClick} className="w-full">
                <BellRing size={16} className="mr-2" /> Notificar Atrasados
              </Button>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
              <PieChart size={16} className="text-slate-400" />
              Gastos por Categoria
            </h3>
            <div className="space-y-4">
              {categoryStats.slice(0, 5).map((cat, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">{cat.label}</span>
                    <span className="font-medium text-slate-900">{cat.percentage}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className={`${cat.color} h-full rounded-full`} style={{ width: cat.percentage }}></div>
                  </div>
                </div>
              ))}
              {categoryStats.length === 0 && (
                <p className="text-center py-4 text-xs text-slate-400">Nenhum dado de despesa</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <h3 className="font-bold text-slate-900">Histórico de Movimentações</h3>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <Input placeholder="Buscar..." className="pl-10 h-9 text-sm" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-left border-b border-slate-100">
                <th className="px-4 py-3 font-medium">Descrição</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Valor</th>
                <th className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {completedTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{tx.description}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="neutral">{translateCategory(tx.category)}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {tx.date?.split('-').reverse().join('/')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <Badge variant={tx.type === 'INCOME' ? 'success' : 'neutral'}>
                        {translateTransactionType(tx.type)}
                      </Badge>
                      <Badge variant={tx.status === 'COMPLETED' ? 'success' : 'warning'}>
                        {translateStatus(tx.status)}
                      </Badge>
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-right font-bold ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {tx.type === 'EXPENSE' ? '- ' : ''}{formatCurrency(tx.amount)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canEdit && (
                      <Button variant="ghost" size="sm" onClick={() => handleEditTransaction(tx)}>
                        <Edit3 size={14} />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Movimentação" maxWidth="lg">
        {renderModalContent()}
      </Modal>

      <Modal isOpen={isFeesManagerOpen} onClose={() => setIsFeesManagerOpen(false)} title="Gestão de Mensalidades" maxWidth="3xl">
        {renderFeesManagerContent()}
      </Modal>

      <Modal isOpen={isOverduePreviewOpen} onClose={() => setIsOverduePreviewOpen(false)} title="Notificar Inadimplentes" maxWidth="2xl">
        <div className="space-y-4">
          <div className="bg-amber-50 p-4 rounded-lg flex items-start gap-3">
            <AlertTriangle className="text-amber-600 mt-0.5" size={20} />
            <p className="text-sm text-amber-800">
              Confirme a lista de associados que receberão uma notificação de atraso.
            </p>
          </div>
          <div className="max-h-60 overflow-y-auto border border-slate-100 rounded-lg">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left">Nome</th>
                  <th className="px-4 py-2 text-left">Mês</th>
                  <th className="px-4 py-2 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overdueFees.map(fee => (
                  <tr key={fee.id}>
                    <td className="px-4 py-2">{fee.associateName}</td>
                    <td className="px-4 py-2">{fee.monthRef}</td>
                    <td className="px-4 py-2 text-right">R$ {fee.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={() => setIsOverduePreviewOpen(false)}>Cancelar</Button>
            <Button onClick={confirmNotifyOverdue} className="bg-amber-600 hover:bg-amber-700">
              Enviar Notificações ({overdueCount})
            </Button>
          </div>
        </div>
      </Modal>

      {toast.visible && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5">
          <div className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-white'
            }`}>
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <span className="text-sm font-medium">{toast.message}</span>
            <button onClick={() => setToast({ ...toast, visible: false })} className="hover:opacity-75">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};