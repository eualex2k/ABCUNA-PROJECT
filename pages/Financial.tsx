import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { PieChart, Download, Users, ChevronLeft, Calendar, Wallet, BellRing, CheckCircle2, AlertTriangle, X, CreditCard, Filter, Send, Edit3, Plus, RotateCcw, ArrowUpRight, Shield, Trash2, Clock, FileText, ChevronRight, Info, TrendingUp, DollarSign } from 'lucide-react';
import { Card, Button, Badge, Modal, Input, Avatar, Textarea, StatCard } from '../components/ui';
import { Transaction, Associate, User, UserRole, FinancialComprovante } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { notificationService } from '../services/notifications';
import { registrationsService } from '../services/registrations';
import { financialService } from '../services/financial';
import { Registration } from '../types';

// Importações dos novos componentes modulares
import { FinanceStats } from '../components/financial/FinanceStats';
import { RegistrationBoard } from '../components/financial/RegistrationBoard';
import { TransactionTable } from '../components/financial/TransactionTable';
import { FeesManager } from '../components/financial/FeesManager';
import { SearchableSelect } from '../components/financial/SearchableSelect';
import { useFinancialData } from '../components/financial/hooks/useFinancialData';
import { useFeesData, FeeRecord } from '../components/financial/hooks/useFeesData';

interface FinancialPageProps {
  user: User;
}

type ModalStep = 'MENU' | 'INCOME' | 'EXPENSE' | 'FEES';

const incomeCategories = [
  'Doação',
  'Patrocínio',
  'Eventos',
  'Venda de Ativos',
  'Mensalidades',
  'Outros'
];

const expenseCategories = [
  'Manutenção',
  'Equipamento',
  'Aluguel',
  'Energia',
  'Internet',
  'Água',
  'Reembolso',
  'Outros'
];

export const FinancialPage: React.FC<FinancialPageProps> = ({ user }) => {
  // Usar hooks para gerenciar dados complexos
  const { 
    transactions, 
    associates, 
    loading, 
    error, 
    refreshData,
    canEdit,
    canExport 
  } = useFinancialData({ user });

  const { 
    feesList, 
    overdueFees, 
    overdueCount, 
    refreshFees,
    loading: feesLoading
  } = useFeesData({ transactions, associates });

  // Estados gerenciados localmente
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>('MENU');
  const [isFeesManagerOpen, setIsFeesManagerOpen] = useState(false);
  const [isRegistrationManagerOpen, setIsRegistrationManagerOpen] = useState(false);
  const [isOverduePreviewOpen, setIsOverduePreviewOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [feePaymentStep, setFeePaymentStep] = useState<'LIST' | 'PAYMENT' | 'EDIT'>('LIST');
  const [selectedFee, setSelectedFee] = useState<FeeRecord | null>(null);
  const [filterAssociateId, setFilterAssociateId] = useState('ALL');
  const [selectedFeeIds, setSelectedFeeIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [feeForm, setFeeForm] = useState({
    amount: '30.00',
    quantity: 1,
    startDate: (() => {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      return `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`;
    })(),
    associateId: 'ALL',
  });
  const [paymentForm, setPaymentForm] = useState({
    date: new Date().toISOString().split('T')[0],
    method: 'PIX',
    observation: '',
  });
  const [editFeeForm, setEditFeeForm] = useState({ amount: '', dueDate: '', description: '' });
  const [feeFile, setFeeFile] = useState<File | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoadingRegistrations, setIsLoadingRegistrations] = useState(false);
  const [registrationStep, setRegistrationStep] = useState<'LIST' | 'FORM' | 'PAYMENT'>('LIST');
  const [registrationForm, setRegistrationForm] = useState({ fullName: '', targetAmount: '250.00', deadline: '' });
  const [registrationPaymentForm, setRegistrationPaymentForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    method: 'PIX',
    registrationId: '',
  });
  const [editingRegistrationId, setEditingRegistrationId] = useState<string | null>(null);
  const [regPaymentFile, setRegPaymentFile] = useState<File | null>(null);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'info' | 'error' }>({
    visible: false, message: '', type: 'info'
  });
  const [incomeForm, setIncomeForm] = useState({
    title: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    customCategory: '',
    payerId: '',
    customPayer: '',
    notes: '',
    isCustomCategory: false,
    isCustomPayer: false,
  });
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    customCategory: '',
    recipientId: '',
    customRecipient: '',
    notes: '',
    isCustomCategory: false,
    isCustomRecipient: false,
  });
  const [incomeFile, setIncomeFile] = useState<File | null>(null);
  const [expenseFile, setExpenseFile] = useState<File | null>(null);

  const loadRegistrations = async () => {
    setIsLoadingRegistrations(true);
    try {
      setRegistrations(await registrationsService.getAll());
    } catch (error) {
      console.error('Erro ao carregar inscrições:', error);
      showToast('Erro ao carregar inscrições.', 'error');
    } finally {
      setIsLoadingRegistrations(false);
    }
  };

  const handleOpenRegistrationManager = () => {
    setRegistrationStep('LIST');
    setEditingRegistrationId(null);
    loadRegistrations();
    setIsRegistrationManagerOpen(true);
  };

  const handleOpenFeesManager = () => {
    setFeePaymentStep('LIST');
    setSelectedFee(null);
    setFilterAssociateId('ALL');
    setSelectedFeeIds([]);
    setIsSelectionMode(false);
    setIsFeesManagerOpen(true);
  };

  const toggleFeeSelection = (feeId: string) => {
    setSelectedFeeIds(previous => previous.includes(feeId)
      ? previous.filter(id => id !== feeId)
      : [...previous, feeId]);
  };

  const selectAllFilteredFees = () => {
    setSelectedFeeIds(feesList
      .filter(fee => fee.status !== 'PAID' && (filterAssociateId === 'ALL' || fee.associateId === filterAssociateId))
      .map(fee => fee.id));
  };

  const deleteSelectedFees = async () => {
    if (selectedFeeIds.length === 0 || !confirm(`Tem certeza que deseja excluir ${selectedFeeIds.length} mensalidade(s)?`)) return;

    try {
      const count = selectedFeeIds.length;
      await financialService.deleteBulk(selectedFeeIds);
      await refreshData();
      setSelectedFeeIds([]);
      setIsSelectionMode(false);
      showToast(`${count} mensalidade(s) excluída(s) com sucesso!`, 'success');
    } catch (error) {
      console.error('Erro ao excluir mensalidades:', error);
      showToast('Erro ao excluir mensalidades.', 'error');
    }
  };

  const handleSelectFeeToPay = (fee: FeeRecord) => {
    setSelectedFee(fee);
    setPaymentForm({ date: new Date().toISOString().split('T')[0], method: 'PIX', observation: '' });
    setFeePaymentStep('PAYMENT');
  };

  const handleEditFee = (fee: FeeRecord) => {
    setSelectedFee(fee);
    setEditFeeForm({ amount: fee.amount.toFixed(2), dueDate: fee.dueDate, description: '' });
    setFeePaymentStep('EDIT');
  };

  const processFeeEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFee) return;

    try {
      await financialService.update(selectedFee.id, {
        amount: Number(editFeeForm.amount),
        date: editFeeForm.dueDate,
        notes: editFeeForm.description.trim() || undefined,
      });
      await refreshData();
      setSelectedFee(null);
      setFeePaymentStep('LIST');
      showToast('Mensalidade atualizada com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao atualizar mensalidade:', error);
      showToast('Erro ao atualizar mensalidade.', 'error');
    }
  };

  const processFeePayment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFee) return;

    setIsUploading(true);
    try {
      await financialService.update(selectedFee.id, {
        status: 'COMPLETED',
        description: `${selectedFee.monthRef} - ${selectedFee.associateName} (Pago em ${paymentForm.date.split('-').reverse().join('/')})`,
        notes: paymentForm.observation.trim() ? `Pagamento via ${paymentForm.method}: ${paymentForm.observation.trim()}` : `Pagamento via ${paymentForm.method}`,
      });

      if (feeFile) {
        const filePath = await financialService.uploadComprovante(feeFile);
        await financialService.attachComprovante(selectedFee.id, filePath);
      }

      await refreshData();
      setFeeFile(null);
      setSelectedFee(null);
      setFeePaymentStep('LIST');
      showToast('Pagamento de mensalidade registrado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      showToast('Erro ao processar pagamento.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateFees = async (event: React.FormEvent) => {
    event.preventDefault();
    const amount = Number(feeForm.amount);
    const quantity = Number(feeForm.quantity);
    const targets = associates.filter(associate =>
      associate.status === 'ACTIVE' && (feeForm.associateId === 'ALL' || associate.id === feeForm.associateId)
    );

    if (!Number.isFinite(amount) || amount <= 0 || !Number.isInteger(quantity) || quantity < 1 || !feeForm.startDate || targets.length === 0) {
      showToast('Informe valores válidos e selecione associados ativos.', 'info');
      return;
    }

    try {
      const start = new Date(`${feeForm.startDate}T12:00:00`);
      const operations: Promise<Transaction>[] = [];

      targets.forEach(associate => {
        for (let index = 0; index < quantity; index += 1) {
          const dueDate = new Date(start.getFullYear(), start.getMonth() + index, 1);
          const date = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-01`;
          const monthName = dueDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
          const monthRef = monthName.charAt(0).toUpperCase() + monthName.slice(1);

          operations.push(financialService.create({
            description: `Mensalidade ${monthRef}`,
            amount,
            type: 'INCOME',
            category: 'Mensalidade',
            status: 'PENDING',
            date,
            payer_id: associate.id,
          }));
        }
      });

      await Promise.all(operations);
      await refreshData();
      await notificationService.add({
        title: 'Novas Mensalidades Geradas',
        message: `${operations.length} novas cobranças foram emitidas.`,
        type: 'FINANCIAL',
        link: '/financial',
      });
      setIsModalOpen(false);
      resetForms();
      showToast(`${operations.length} mensalidade(s) gerada(s) com sucesso!`, 'success');
    } catch (error) {
      console.error('Erro ao gerar mensalidades:', error);
      showToast('Erro ao gerar mensalidades.', 'error');
    }
  };

  const handleSaveRegistration = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const data = {
        full_name: registrationForm.fullName.trim(),
        target_amount: Number(registrationForm.targetAmount),
        deadline: registrationForm.deadline,
      };
      if (!data.full_name || !Number.isFinite(data.target_amount) || data.target_amount <= 0 || !data.deadline) {
        showToast('Preencha os dados da inscrição.', 'info');
        return;
      }

      if (editingRegistrationId) {
        await registrationsService.update(editingRegistrationId, data);
        showToast('Inscrição atualizada com sucesso!', 'success');
      } else {
        await registrationsService.create(data);
        showToast('Inscrito cadastrado com sucesso!', 'success');
      }
      await loadRegistrations();
      setRegistrationStep('LIST');
      setEditingRegistrationId(null);
    } catch (error) {
      console.error('Erro ao salvar inscrição:', error);
      showToast('Erro ao salvar inscrição.', 'error');
    }
  };

  const handleSaveRegistrationPayment = async (event: React.FormEvent) => {
    event.preventDefault();
    const registration = registrations.find(item => item.id === registrationPaymentForm.registrationId);
    const amount = Number(registrationPaymentForm.amount);
    if (!registration || !Number.isFinite(amount) || amount <= 0 || !registrationPaymentForm.date) {
      showToast('Preencha os dados do pagamento.', 'info');
      return;
    }

    setIsUploading(true);
    try {
      const matchedAssociate = associates.find(associate => associate.name.toLowerCase().trim() === registration.full_name.toLowerCase().trim());
      const transaction = await financialService.create({
        description: `Taxa de Inscrição - ${registration.full_name}`,
        amount,
        type: 'INCOME',
        category: 'Taxa de Inscrição',
        status: 'COMPLETED',
        date: registrationPaymentForm.date,
        registration_id: registration.id,
        payer_id: matchedAssociate?.id,
        notes: `Pagamento via ${registrationPaymentForm.method}`,
      });

      if (regPaymentFile) {
        const filePath = await financialService.uploadComprovante(regPaymentFile);
        await financialService.attachComprovante(transaction.id, filePath);
      }

      await Promise.all([refreshData(), loadRegistrations()]);
      setRegistrationStep('LIST');
      setRegPaymentFile(null);
      showToast('Pagamento de inscrição registrado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao registrar pagamento de inscrição:', error);
      showToast('Erro ao registrar pagamento de inscrição.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteRegistration = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir a inscrição de ${name}?`)) return;
    try {
      await registrationsService.delete(id);
      await loadRegistrations();
      showToast('Inscrição excluída com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao excluir inscrição:', error);
      showToast('Erro ao excluir inscrição.', 'error');
    }
  };

  const resetForms = () => {
    setModalStep('MENU');
    setIncomeForm({
      title: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      category: '',
      customCategory: '',
      payerId: '',
      customPayer: '',
      notes: '',
      isCustomCategory: false,
      isCustomPayer: false,
    });
    setExpenseForm({
      title: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      category: '',
      customCategory: '',
      recipientId: '',
      customRecipient: '',
      notes: '',
      isCustomCategory: false,
      isCustomRecipient: false,
    });
    setIncomeFile(null);
    setExpenseFile(null);
    setFeeForm(previous => ({ ...previous, amount: '30.00', quantity: 1 }));
    setFeeFile(null);
    setRegPaymentFile(null);
    setIsUploading(false);
  };

  const handleOpenModal = () => {
    resetForms();
    setIsModalOpen(true);
  };

  const handleIncomeCategorySelect = (value: string) => {
    const isPreset = incomeCategories.includes(value);
    setIncomeForm(prev => ({
      ...prev,
      category: isPreset ? value : '',
      customCategory: isPreset ? '' : value,
      isCustomCategory: !isPreset,
    }));
  };

  const handleExpenseCategorySelect = (value: string) => {
    const isPreset = expenseCategories.includes(value);
    setExpenseForm(prev => ({
      ...prev,
      category: isPreset ? value : '',
      customCategory: isPreset ? '' : value,
      isCustomCategory: !isPreset,
    }));
  };

  const handleIncomePayerSelect = (value: string) => {
    const matchedAssoc = associates.find(a => a.id === value);
    if (matchedAssoc) {
      setIncomeForm(prev => ({
        ...prev,
        payerId: value,
        customPayer: '',
        isCustomPayer: false,
      }));
      return;
    }

    setIncomeForm(prev => ({
      ...prev,
      payerId: '',
      customPayer: value,
      isCustomPayer: true,
    }));
  };

  const handleExpenseRecipientSelect = (value: string) => {
    const matchedAssoc = associates.find(a => a.id === value);
    if (matchedAssoc) {
      setExpenseForm(prev => ({
        ...prev,
        recipientId: value,
        customRecipient: '',
        isCustomRecipient: false,
      }));
      return;
    }

    setExpenseForm(prev => ({
      ...prev,
      recipientId: '',
      customRecipient: value,
      isCustomRecipient: true,
    }));
  };

  const handleSaveIncome = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = Number(incomeForm.amount);
    const finalCategory = incomeForm.isCustomCategory ? incomeForm.customCategory.trim() : incomeForm.category.trim();
    const payer = incomeForm.payerId || (incomeForm.isCustomPayer ? incomeForm.customPayer.trim() : '');

    if (!incomeForm.title.trim()) {
      showToast('Informe a descrição da entrada.', 'info');
      return;
    }

    if (!incomeForm.date) {
      showToast('Informe a data da entrada.', 'info');
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      showToast('O valor da entrada deve ser maior que zero.', 'info');
      return;
    }

    if (!finalCategory) {
      showToast('Selecione ou informe a categoria da entrada.', 'info');
      return;
    }

    if (!payer) {
      showToast('Selecione o pagador ou informe o responsável pela entrada.', 'info');
      return;
    }

    if (incomeFile && incomeFile.size > 5 * 1024 * 1024) {
      showToast('O comprovante não pode ter mais que 5MB.', 'info');
      return;
    }

    setIsUploading(true);

    try {
      const txData: Omit<Transaction, 'id'> = {
        description: incomeForm.title.trim(),
        amount,
        type: 'INCOME',
        category: finalCategory,
        status: 'COMPLETED',
        date: incomeForm.date,
        payer_id: incomeForm.payerId || undefined,
        custom_payer: incomeForm.isCustomPayer ? incomeForm.customPayer.trim() : undefined,
        notes: incomeForm.notes.trim() || undefined,
      };

      const created = await financialService.create(txData);

      if (incomeFile) {
        const filePath = await financialService.uploadComprovante(incomeFile);
        await financialService.attachComprovante(created.id, filePath);
      }

      await refreshData();
      showToast('Entrada registrada com sucesso!', 'success');
      setIsModalOpen(false);
      resetForms();
    } catch (error: any) {
      console.error('Erro ao salvar entrada:', error);
      showToast(error?.message || 'Erro ao salvar entrada.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = Number(expenseForm.amount);
    const finalCategory = expenseForm.isCustomCategory ? expenseForm.customCategory.trim() : expenseForm.category.trim();
    const recipient = expenseForm.recipientId || (expenseForm.isCustomRecipient ? expenseForm.customRecipient.trim() : '');

    if (!expenseForm.title.trim()) {
      showToast('Informe a descrição da saída.', 'info');
      return;
    }

    if (!expenseForm.date) {
      showToast('Informe a data da saída.', 'info');
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      showToast('O valor da saída deve ser maior que zero.', 'info');
      return;
    }

    if (!finalCategory) {
      showToast('Selecione ou informe a categoria da saída.', 'info');
      return;
    }

    if (!recipient) {
      showToast('Selecione o beneficiário ou informe o destinatário da saída.', 'info');
      return;
    }

    if (expenseFile && expenseFile.size > 5 * 1024 * 1024) {
      showToast('O comprovante não pode ter mais que 5MB.', 'info');
      return;
    }

    setIsUploading(true);

    try {
      const txData: Omit<Transaction, 'id'> = {
        description: expenseForm.title.trim(),
        amount,
        type: 'EXPENSE',
        category: finalCategory,
        status: 'COMPLETED',
        date: expenseForm.date,
        recipient_id: expenseForm.recipientId || undefined,
        custom_recipient: expenseForm.isCustomRecipient ? expenseForm.customRecipient.trim() : undefined,
        notes: expenseForm.notes.trim() || undefined,
      };

      const created = await financialService.create(txData);

      if (expenseFile) {
        const filePath = await financialService.uploadComprovante(expenseFile);
        await financialService.attachComprovante(created.id, filePath);
      }

      await refreshData();
      showToast('Saída registrada com sucesso!', 'success');
      setIsModalOpen(false);
      resetForms();
    } catch (error: any) {
      console.error('Erro ao salvar saída:', error);
      showToast(error?.message || 'Erro ao salvar saída.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Lógica simplificada de cálculos
  const completedTransactions = transactions
    .filter(t => t.status === 'COMPLETED')
    .sort((a, b) => {
      if (b.date !== a.date) {
        return b.date.localeCompare(a.date);
      }
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });

  const totalBalance = completedTransactions.reduce((acc, tx) => tx.type === 'INCOME' ? acc + tx.amount : acc - tx.amount, 0);
  
  // Cálculos de dados para gráficos
  const { currentMonthIncome, lastMonthIncome, currentMonthExpense, lastMonthExpense } = React.useMemo(() => {
    const now = new Date();
    const curM = now.getMonth();
    const curY = now.getFullYear();
    const lastM = curM === 0 ? 11 : curM - 1;
    const lastY = curM === 0 ? curY - 1 : curY;

    const stats = { currentMonthIncome: 0, lastMonthIncome: 0, currentMonthExpense: 0, lastMonthExpense: 0 };

    completedTransactions.forEach(t => {
      const d = new Date(t.date + 'T12:00:00');
      const m = d.getMonth();
      const y = d.getFullYear();

      if (m === curM && y === curY) {
        if (t.type === 'INCOME') stats.currentMonthIncome += t.amount;
        else stats.currentMonthExpense += t.amount;
      } else if (m === lastM && y === lastY) {
        if (t.type === 'INCOME') stats.lastMonthIncome += t.amount;
        else stats.lastMonthExpense += t.amount;
      }
    });

    return stats;
  }, [completedTransactions]);

  const incomeTrend = lastMonthIncome === 0 ? (currentMonthIncome > 0 ? 100 : 0) : ((currentMonthIncome - lastMonthIncome) / lastMonthIncome) * 100;
  const expenseTrend = lastMonthExpense === 0 ? (currentMonthExpense > 0 ? 100 : 0) : ((currentMonthExpense - lastMonthExpense) / lastMonthExpense) * 100;

  const totalIncome = currentMonthIncome;
  const totalExpense = currentMonthExpense;

  // Dados do gráfico
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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Funções simplificadas (manter apenas as essenciais para o componente principal)
  const handleExportPDF = () => {
    alert('Função de exportação PDF será implementada');
  };

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ visible: true, message, type });
  };

  const handleNotifyOverdueClick = () => {
    if (overdueCount === 0) {
      showToast('Parabéns! Não há mensalidades atrasadas no momento.', 'info');
      return;
    }
    setIsOverduePreviewOpen(true);
  };

  const confirmNotifyOverdue = async () => {
    alert('Função de notificação será implementada');
  };

  // Auto-hide toast
  React.useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => setToast({ ...toast, visible: false }), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Financeiro</h2>
          <p className="text-slate-500 text-sm">Gestão financeira, mensalidades e fluxo de caixa.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {canEdit && (
            <Button variant="outline" onClick={handleOpenRegistrationManager} className="flex items-center gap-2">
              <Users size={18} /> Inscrições
            </Button>
          )}
          {canEdit && (
            <Button variant="outline" onClick={handleOpenFeesManager} className="flex items-center gap-2">
              <CreditCard size={18} /> Mensalidades
            </Button>
          )}
          {canEdit && (
            <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
              <Plus size={18} /> Novo Lançamento
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">Erro ao carregar dados: {error}</p>
        </div>
      )}

      <FinanceStats
        totalBalance={totalBalance}
        monthlyIncome={totalIncome}
        monthlyExpense={totalExpense}
        incomeTrend={incomeTrend}
        expenseTrend={expenseTrend}
        overdueCount={overdueCount}
        loading={loading}
      />

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

      <TransactionTable
        transactions={completedTransactions}
        onEdit={(tx) => {
          // Implementar lógica de edição futuramente
          alert(`Editar transação: ${tx.description}`);
        }}
        onDelete={(tx) => {
          // Implementar lógica de exclusão futuramente
          if (tx && confirm(`Tem certeza que deseja excluir "${tx.description}"?`)) {
            alert(`Excluir transação: ${tx.description}`);
          }
        }}
        onViewComprovantes={(tx) => {
          // Implementar lógica de visualização futuramente
          alert(`Ver comprovantes de: ${tx.description}`);
        }}
        onExport={canExport ? handleExportPDF : undefined}
        loading={loading}
        canEdit={canEdit}
      />

      {/* Modals */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          resetForms();
        }}
        title={modalStep === 'MENU' ? 'Nova Movimentação' : modalStep === 'INCOME' ? 'Nova Entrada' : modalStep === 'EXPENSE' ? 'Nova Saída' : 'Gerar Mensalidades'}
        maxWidth="5xl"
      >
        {modalStep === 'MENU' ? (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setModalStep('INCOME')}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left"
            >
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
                <ArrowUpRight size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Registrar Entrada</h4>
                <p className="text-xs text-slate-500">Doações, patrocínios, pagamentos e receitas.</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setModalStep('EXPENSE')}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-slate-100 hover:border-rose-500 hover:bg-rose-50 transition-all text-left"
            >
              <div className="p-3 bg-rose-100 text-rose-600 rounded-lg">
                <ArrowUpRight size={24} className="rotate-180" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Registrar Saída</h4>
                <p className="text-xs text-slate-500">Despesas, manutenção, compras e pagamentos.</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setModalStep('FEES')}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
            >
              <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                <Users size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Gerar Lote de Mensalidades</h4>
                <p className="text-xs text-slate-500">Criar cobranças para associados ativos.</p>
              </div>
            </button>
          </div>
        ) : modalStep === 'INCOME' ? (
          <form onSubmit={handleSaveIncome} className="space-y-5">
            <div className="flex items-center gap-2 text-slate-600 mb-2 cursor-pointer hover:text-brand-600 transition-colors" onClick={() => setModalStep('MENU')}>
              <ChevronLeft size={20} />
              <span className="text-sm font-medium">Voltar</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Descrição"
                  placeholder="Ex: Doação mensal de associado"
                  value={incomeForm.title}
                  onChange={(e) => setIncomeForm({ ...incomeForm, title: e.target.value })}
                  required
                />
              </div>

              <Input
                label="Valor (R$)"
                type="number"
                step="0.01"
                min="0.01"
                value={incomeForm.amount}
                onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                required
              />

              <Input
                label="Data"
                type="date"
                value={incomeForm.date}
                onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })}
                required
              />

              <div className="md:col-span-2">
                <SearchableSelect
                  label="Categoria"
                  value={incomeForm.isCustomCategory ? incomeForm.customCategory : incomeForm.category}
                  options={incomeCategories.map(category => ({ value: category, label: category }))}
                  onChange={handleIncomeCategorySelect}
                  allowCustom
                  placeholder="Selecione ou adicione uma categoria"
                />
              </div>

              {incomeForm.isCustomCategory && (
                <div className="md:col-span-2">
                  <Input
                    label="Categoria personalizada"
                    value={incomeForm.customCategory}
                    onChange={(e) => setIncomeForm({ ...incomeForm, customCategory: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <SearchableSelect
                  label="Pagador / Origem"
                  value={incomeForm.isCustomPayer ? incomeForm.customPayer : incomeForm.payerId}
                  options={associates.map(associate => ({ value: associate.id, label: associate.name }))}
                  onChange={handleIncomePayerSelect}
                  allowCustom
                  placeholder="Selecione ou informe o pagador"
                />
              </div>

              {incomeForm.isCustomPayer && (
                <div className="md:col-span-2">
                  <Input
                    label="Pagador personalizado"
                    value={incomeForm.customPayer}
                    onChange={(e) => setIncomeForm({ ...incomeForm, customPayer: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <Textarea
                  label="Observações"
                  rows={4}
                  value={incomeForm.notes}
                  onChange={(e) => setIncomeForm({ ...incomeForm, notes: e.target.value })}
                  placeholder="Detalhes adicionais da movimentação"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Comprovante (opcional)</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setIncomeFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                />
                {incomeFile && <p className="mt-2 text-xs text-slate-500">Arquivo selecionado: {incomeFile.name}</p>}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setModalStep('MENU')}>Cancelar</Button>
              <Button type="submit" disabled={isUploading}>
                {isUploading ? 'Salvando...' : 'Salvar entrada'}
              </Button>
            </div>
          </form>
        ) : modalStep === 'EXPENSE' ? (
          <form onSubmit={handleSaveExpense} className="space-y-5">
            <div className="flex items-center gap-2 text-slate-600 mb-2 cursor-pointer hover:text-brand-600 transition-colors" onClick={() => setModalStep('MENU')}>
              <ChevronLeft size={20} />
              <span className="text-sm font-medium">Voltar</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Descrição"
                  placeholder="Ex: Compra de material de oficina"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  required
                />
              </div>

              <Input
                label="Valor (R$)"
                type="number"
                step="0.01"
                min="0.01"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                required
              />

              <Input
                label="Data"
                type="date"
                value={expenseForm.date}
                onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                required
              />

              <div className="md:col-span-2">
                <SearchableSelect
                  label="Categoria"
                  value={expenseForm.isCustomCategory ? expenseForm.customCategory : expenseForm.category}
                  options={expenseCategories.map(category => ({ value: category, label: category }))}
                  onChange={handleExpenseCategorySelect}
                  allowCustom
                  placeholder="Selecione ou adicione uma categoria"
                />
              </div>

              {expenseForm.isCustomCategory && (
                <div className="md:col-span-2">
                  <Input
                    label="Categoria personalizada"
                    value={expenseForm.customCategory}
                    onChange={(e) => setExpenseForm({ ...expenseForm, customCategory: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <SearchableSelect
                  label="Beneficiário / Destinatário"
                  value={expenseForm.isCustomRecipient ? expenseForm.customRecipient : expenseForm.recipientId}
                  options={associates.map(associate => ({ value: associate.id, label: associate.name }))}
                  onChange={handleExpenseRecipientSelect}
                  allowCustom
                  placeholder="Selecione ou informe o destinatário"
                />
              </div>

              {expenseForm.isCustomRecipient && (
                <div className="md:col-span-2">
                  <Input
                    label="Beneficiário personalizado"
                    value={expenseForm.customRecipient}
                    onChange={(e) => setExpenseForm({ ...expenseForm, customRecipient: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <Textarea
                  label="Observações"
                  rows={4}
                  value={expenseForm.notes}
                  onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  placeholder="Detalhes adicionais da movimentação"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Comprovante (opcional)</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setExpenseFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                />
                {expenseFile && <p className="mt-2 text-xs text-slate-500">Arquivo selecionado: {expenseFile.name}</p>}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setModalStep('MENU')}>Cancelar</Button>
              <Button type="submit" disabled={isUploading}>
                {isUploading ? 'Salvando...' : 'Salvar saída'}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleGenerateFees} className="space-y-5">
            <div className="flex items-center gap-2 text-slate-600 cursor-pointer hover:text-brand-600" onClick={() => setModalStep('MENU')}>
              <ChevronLeft size={20} />
              <span className="text-sm font-medium">Voltar</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Valor da mensalidade (R$)"
                type="number"
                min="0.01"
                step="0.01"
                value={feeForm.amount}
                onChange={(event) => setFeeForm({ ...feeForm, amount: event.target.value })}
                required
              />
              <Input
                label="Quantidade de meses"
                type="number"
                min="1"
                max="48"
                value={feeForm.quantity}
                onChange={(event) => setFeeForm({ ...feeForm, quantity: Number(event.target.value) })}
                required
              />
              <Input
                label="Mês de início"
                type="date"
                value={feeForm.startDate}
                onChange={(event) => setFeeForm({ ...feeForm, startDate: event.target.value })}
                required
              />
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Associados</label>
                <select
                  className="w-full h-12 px-4 bg-white border border-slate-300 rounded-lg text-base shadow-sm focus:outline-none focus:border-brand-500"
                  value={feeForm.associateId}
                  onChange={(event) => setFeeForm({ ...feeForm, associateId: event.target.value })}
                >
                  <option value="ALL">Todos os associados ativos</option>
                  {associates.filter(associate => associate.status === 'ACTIVE').sort((a, b) => a.name.localeCompare(b.name)).map(associate => (
                    <option key={associate.id} value={associate.id}>{associate.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setModalStep('MENU')}>Cancelar</Button>
              <Button type="submit">Gerar mensalidades</Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal isOpen={isFeesManagerOpen} onClose={() => setIsFeesManagerOpen(false)} title="Gestão de Mensalidades" maxWidth="4xl">
        {feePaymentStep === 'LIST' ? (
          <FeesManager
            fees={feesList}
            associates={associates}
            filterAssociateId={filterAssociateId}
            setFilterAssociateId={setFilterAssociateId}
            isSelectionMode={isSelectionMode}
            setIsSelectionMode={setIsSelectionMode}
            selectedFeeIds={selectedFeeIds}
            toggleFeeSelection={toggleFeeSelection}
            selectAll={selectAllFilteredFees}
            deselectAll={() => setSelectedFeeIds([])}
            onDeleteBulk={deleteSelectedFees}
            onEdit={handleEditFee}
            onPay={handleSelectFeeToPay}
            canEdit={canEdit}
            loading={feesLoading}
          />
        ) : feePaymentStep === 'EDIT' ? (
          <form onSubmit={processFeeEdit} className="space-y-5">
            <button type="button" className="flex items-center gap-2 text-slate-600 hover:text-brand-600" onClick={() => setFeePaymentStep('LIST')}>
              <ChevronLeft size={20} /> Voltar para lista
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Valor da mensalidade (R$)" type="number" min="0.01" step="0.01" value={editFeeForm.amount} onChange={(event) => setEditFeeForm({ ...editFeeForm, amount: event.target.value })} required />
              <Input label="Data de vencimento" type="date" value={editFeeForm.dueDate} onChange={(event) => setEditFeeForm({ ...editFeeForm, dueDate: event.target.value })} required />
            </div>
            <Textarea label="Justificativa (opcional)" rows={3} value={editFeeForm.description} onChange={(event) => setEditFeeForm({ ...editFeeForm, description: event.target.value })} />
            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setFeePaymentStep('LIST')}>Cancelar</Button>
              <Button type="submit">Salvar alterações</Button>
            </div>
          </form>
        ) : (
          <form onSubmit={processFeePayment} className="space-y-5">
            <button type="button" className="flex items-center gap-2 text-slate-600 hover:text-brand-600" onClick={() => setFeePaymentStep('LIST')}>
              <ChevronLeft size={20} /> Voltar para lista
            </button>
            <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-100 flex items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900">{selectedFee?.associateName}</h3>
                <p className="text-xs text-slate-500">{selectedFee?.monthRef}</p>
              </div>
              <div className="text-xl font-black text-emerald-600">{formatCurrency(selectedFee?.amount || 0)}</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Data do recebimento" type="date" value={paymentForm.date} onChange={(event) => setPaymentForm({ ...paymentForm, date: event.target.value })} required />
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Forma de pagamento</label>
                <select className="w-full h-12 px-4 bg-white border border-slate-300 rounded-lg text-base shadow-sm" value={paymentForm.method} onChange={(event) => setPaymentForm({ ...paymentForm, method: event.target.value })}>
                  <option value="PIX">PIX</option>
                  <option value="CASH">Dinheiro / Espécie</option>
                  <option value="CARD">Cartão de Crédito/Débito</option>
                  <option value="BANK">Transferência Bancária</option>
                </select>
              </div>
            </div>
            <Textarea label="Observação (opcional)" rows={3} value={paymentForm.observation} onChange={(event) => setPaymentForm({ ...paymentForm, observation: event.target.value })} />
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Comprovante (opcional)</label>
              <input type="file" accept="image/*,.pdf" onChange={(event) => setFeeFile(event.target.files?.[0] || null)} className="block w-full text-sm text-slate-600" />
            </div>
            <Button type="submit" className="w-full" disabled={isUploading}>{isUploading ? 'Processando...' : 'Confirmar recebimento'}</Button>
          </form>
        )}
      </Modal>

      <Modal isOpen={isRegistrationManagerOpen} onClose={() => { setIsRegistrationManagerOpen(false); setRegistrationStep('LIST'); setEditingRegistrationId(null); }} title="Controle de Inscrições" maxWidth="5xl">
        {registrationStep === 'LIST' ? (
          <RegistrationBoard
            registrations={registrations}
            onAdd={() => {
              setEditingRegistrationId(null);
              setRegistrationForm({ fullName: '', targetAmount: '250.00', deadline: '' });
              setRegistrationStep('FORM');
            }}
            onEdit={(registration) => {
              setEditingRegistrationId(registration.id);
              setRegistrationForm({ fullName: registration.full_name, targetAmount: registration.target_amount.toString(), deadline: registration.deadline });
              setRegistrationStep('FORM');
            }}
            onDelete={handleDeleteRegistration}
            onPay={(registration) => {
              setRegistrationPaymentForm({ amount: Math.max(0, registration.target_amount - registration.total_paid).toFixed(2), date: new Date().toISOString().split('T')[0], method: 'PIX', registrationId: registration.id });
              setRegistrationStep('PAYMENT');
            }}
            loading={isLoadingRegistrations}
          />
        ) : registrationStep === 'FORM' ? (
          <form onSubmit={handleSaveRegistration} className="space-y-5">
            <button type="button" className="flex items-center gap-2 text-slate-600 hover:text-brand-600" onClick={() => { setRegistrationStep('LIST'); setEditingRegistrationId(null); }}>
              <ChevronLeft size={20} /> Voltar para lista
            </button>
            <Input label="Nome completo" value={registrationForm.fullName} onChange={(event) => setRegistrationForm({ ...registrationForm, fullName: event.target.value })} required />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Valor da taxa (R$)" type="number" min="0.01" step="0.01" value={registrationForm.targetAmount} onChange={(event) => setRegistrationForm({ ...registrationForm, targetAmount: event.target.value })} required />
              <Input label="Data limite" type="date" value={registrationForm.deadline} onChange={(event) => setRegistrationForm({ ...registrationForm, deadline: event.target.value })} required />
            </div>
            <Button type="submit" className="w-full">{editingRegistrationId ? 'Salvar alterações' : 'Cadastrar inscrito'}</Button>
          </form>
        ) : (
          <form onSubmit={handleSaveRegistrationPayment} className="space-y-5">
            <button type="button" className="flex items-center gap-2 text-slate-600 hover:text-brand-600" onClick={() => setRegistrationStep('LIST')}>
              <ChevronLeft size={20} /> Voltar para lista
            </button>
            {(() => {
              const registration = registrations.find(item => item.id === registrationPaymentForm.registrationId);
              return <div className="bg-slate-50 p-4 rounded-lg border border-slate-200"><h4 className="font-bold text-slate-900">{registration?.full_name}</h4><p className="text-sm text-slate-500">Total pago: {formatCurrency(registration?.total_paid || 0)} / Meta: {formatCurrency(registration?.target_amount || 0)}</p></div>;
            })()}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Valor pago (R$)" type="number" min="0.01" step="0.01" value={registrationPaymentForm.amount} onChange={(event) => setRegistrationPaymentForm({ ...registrationPaymentForm, amount: event.target.value })} required />
              <Input label="Data do pagamento" type="date" value={registrationPaymentForm.date} onChange={(event) => setRegistrationPaymentForm({ ...registrationPaymentForm, date: event.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Forma de pagamento</label>
              <select className="w-full h-12 px-4 bg-white border border-slate-300 rounded-lg text-base shadow-sm" value={registrationPaymentForm.method} onChange={(event) => setRegistrationPaymentForm({ ...registrationPaymentForm, method: event.target.value })}>
                <option value="PIX">PIX</option><option value="CASH">Dinheiro / Espécie</option><option value="CARD">Cartão de Crédito/Débito</option><option value="BANK">Transferência Bancária</option>
              </select>
            </div>
            <div><label className="block text-sm font-bold text-slate-700 mb-1.5">Comprovante (opcional)</label><input type="file" accept="image/*,.pdf" onChange={(event) => setRegPaymentFile(event.target.files?.[0] || null)} className="block w-full text-sm text-slate-600" /></div>
            <Button type="submit" className="w-full" disabled={isUploading}>{isUploading ? 'Processando...' : 'Confirmar pagamento'}</Button>
          </form>
        )}
      </Modal>

      <Modal isOpen={isOverduePreviewOpen} onClose={() => setIsOverduePreviewOpen(false)} title="Notificar Inadimplentes" maxWidth="3xl">
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
            <Button 
              onClick={confirmNotifyOverdue} 
              className="bg-amber-600 hover:bg-amber-700 flex items-center gap-2"
            >
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