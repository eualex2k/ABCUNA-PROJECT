import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { DollarSign, ArrowUpCircle, ArrowDownCircle, PieChart, Download, Users, ChevronLeft, Calendar, Wallet, BellRing, CheckCircle2, AlertTriangle, X, CreditCard, Search, Banknote, Filter, Send, Edit3, Plus, RotateCcw, ArrowUpRight, Shield, TrendingUp, Trash2, Clock, FileText, ChevronRight, Info } from 'lucide-react';
import { Card, Button, Badge, Modal, Input, Avatar, Textarea, StatCard } from '../components/ui';
import { Transaction, Associate, User, UserRole, translateStatus, translateTransactionType, translateCategory, FinancialComprovante } from '../types';
import { associatesService } from '../services/associates';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { notificationService } from '../services/notifications';
import { financialService } from '../services/financial';
import { registrationsService } from '../services/registrations';
import { Registration } from '../types';

// Novas importações modulares
import { FinanceStats } from '../components/financial/FinanceStats';
import { RegistrationBoard } from '../components/financial/RegistrationBoard';
import { TransactionTable } from '../components/financial/TransactionTable';
import { FeesManager } from '../components/financial/FeesManager';



const SearchableSelect: React.FC<{
  label: string;
  value: string;
  options: { value: string; label: string; isFixed?: boolean }[];
  onChange: (val: string) => void;
  onDelete?: (val: string) => void;
  placeholder?: string;
  allowCustom?: boolean;
}> = ({ label, value, options, onChange, onDelete, placeholder = "Pesquisar...", allowCustom }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.value === value) || (value ? { value, label: value } : null);

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex justify-between items-center mb-1.5 px-0.5">
        <label className="text-sm font-bold text-slate-700">{label}</label>
        {allowCustom && (
          <button 
            type="button"
            onClick={() => { setIsOpen(true); setSearchTerm(""); }}
            className="text-[10px] font-black uppercase tracking-widest text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors"
          >
            <Plus size={10} /> Novo
          </button>
        )}
      </div>
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-12 px-4 bg-white border ${isOpen ? 'border-brand-500' : 'border-slate-300'} rounded-lg flex items-center justify-between cursor-pointer transition-all shadow-sm`}
      >
        <div className="flex items-center gap-2 truncate">
          <span className={`text-base font-medium ${selectedOption ? 'text-slate-900' : 'text-slate-400'}`}>
            {selectedOption?.label || placeholder}
          </span>
        </div>
        <Search size={18} className="text-slate-400" />
      </div>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="p-2 bg-slate-50 border-b border-slate-100">
            <input
              type="text"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm outline-none focus:border-brand-500"
              placeholder="Digite para filtrar ou adicionar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => (
                <div
                  key={opt.value}
                  className={`flex items-center justify-between gap-3 px-3 py-2 rounded cursor-pointer group ${value === opt.value ? 'bg-brand-50 text-brand-700 font-bold' : 'hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-medium'}`}
                  onClick={() => { onChange(opt.value); setIsOpen(false); setSearchTerm(""); }}
                >
                  <span className="text-sm truncate">{opt.label}</span>
                  <div className="flex items-center gap-2">
                    {onDelete && !opt.isFixed && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onDelete(opt.value); }}
                        className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 rounded transition-all"
                        title="Remover"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                    {value === opt.value && <CheckCircle2 size={14} className="text-brand-500" />}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest bg-slate-50/50">
                Nenhum resultado
              </div>
            )}
            
            {allowCustom && searchTerm && !filteredOptions.some(o => o.label.toLowerCase() === searchTerm.toLowerCase()) && (
              <div 
                onClick={() => { onChange(searchTerm); setIsOpen(false); setSearchTerm(""); }}
                className="mt-1 border-t border-slate-100 p-2 hover:bg-brand-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2 text-brand-600 px-2 py-1">
                  <Plus size={14} />
                  <span className="text-sm font-black uppercase tracking-wider">Adicionar "{searchTerm}"</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

type ModalStep = 'MENU' | 'INCOME' | 'EXPENSE' | 'FEES' | 'DETAILS';

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

  // Derived state for summary cards
  const completedTransactions = transactions
    .filter(t => t.status === 'COMPLETED')
    .sort((a, b) => {
      // 1. Sort by transaction date
      if (b.date !== a.date) {
        return b.date.localeCompare(a.date);
      }
      // 2. Tie-break by creation time (latests at the top)
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
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

  const handleExportPDF = () => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = () => {
      const autoTableScript = document.createElement('script');
      autoTableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js';
      autoTableScript.onload = () => {
        const { jsPDF } = (window as any).jspdf;
        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.text('Relatório Financeiro - ABCUNA', 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 30);

        // Stats summary
        doc.text(`Saldo Total: ${formatCurrency(totalBalance)}`, 14, 40);
        doc.text(`Entradas: ${formatCurrency(totalIncome)} | Saídas: ${formatCurrency(totalExpense)}`, 14, 46);

        const tableData = completedTransactions.map(tx => [
          (() => { const [y, m, d] = tx.date.split('-'); return `${d}/${m}/${y}`; })(),
          tx.description,
          tx.category,
          tx.type === 'INCOME' ? 'Entrada' : 'Saída',
          formatCurrency(tx.amount)
        ]);

        (doc as any).autoTable({
          startY: 55,
          head: [['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor']],
          body: tableData,
          headStyles: { fillColor: [15, 23, 42] },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          margin: { top: 55 }
        });

        doc.save(`financeiro-abcuna-${new Date().toISOString().split('T')[0]}.pdf`);
        showToast('PDF gerado com sucesso!');
      };
      document.body.appendChild(autoTableScript);
    };
    document.body.appendChild(script);
    showToast('Iniciando geração do PDF...', 'info');
  };

  const [realAssociates, setRealAssociates] = useState<Associate[]>([]);

  useEffect(() => {
    loadTransactions();
    loadAssociates();
    loadRegistrations();
  }, []);

  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoadingRegistrations, setIsLoadingRegistrations] = useState(true);
  const [isLoadingAssociates, setIsLoadingAssociates] = useState(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);

  const loadRegistrations = async () => {
    setIsLoadingRegistrations(true);
    try {
      const data = await registrationsService.getAll();
      setRegistrations(data);
    } catch (error) {
      console.error('Failed to load registrations', error);
    } finally {
      setIsLoadingRegistrations(false);
    }
  };

  const loadAssociates = async () => {
    setIsLoadingAssociates(true);
    try {
      const data = await associatesService.getAll();
      setRealAssociates(data);
    } catch (error) {
      console.error('Failed to load associates', error);
    } finally {
      setIsLoadingAssociates(false);
    }
  };

  const loadTransactions = async () => {
    setIsLoadingTransactions(true);
    try {
      const data = await financialService.getAll();
      setTransactions(data);
    } catch (error) {
      console.error('Failed to load transactions', error);
      showToast('Erro ao carregar movimentações', 'info');
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  // Derive feesList automatically
  useEffect(() => {
    const derivedFees: FeeRecord[] = transactions
      .filter(tx => 
        tx.category === 'Mensalidade' || 
        tx.category === 'Mensalidades' || 
        tx.category === 'Taxa de Inscrição' ||
        (tx.category === 'Geral' && tx.description.toLowerCase().includes('mensalidade'))
      )
      .map(tx => {
        const assoc = realAssociates.find(a => a.id === tx.payer_id);
        const dObj = new Date(tx.date + 'T12:00:00');
        const isOverdue = tx.status === 'PENDING' && dObj < new Date();

        let monthRef = 'N/A';
        if (tx.category === 'Taxa de Inscrição') {
          monthRef = 'Inscrição';
        } else {
          try {
            const d = new Date(tx.date + 'T12:00:00'); 
            const m = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
            monthRef = m.charAt(0).toUpperCase() + m.slice(1);
          } catch (e) { }
        }

        return {
          id: tx.id,
          associateId: tx.payer_id || '',
          associateName: assoc ? assoc.name : (tx.description.includes('-') ? tx.description.split('-')[1].trim() : 'Externo'),
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
  const [isRegistrationManagerOpen, setIsRegistrationManagerOpen] = useState(false); // For Registration Management
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
  const [incomeForm, setIncomeForm] = useState({ title: '', amount: '', date: '', category: '', payerId: '', description: '', isCustomCategory: false, isCustomPayer: false, customCategory: '', customPayer: '' });
  const [expenseForm, setExpenseForm] = useState({ title: '', amount: '', date: '', category: '', recipientId: '', description: '', isCustomCategory: false, isCustomRecipient: false, customCategory: '', customRecipient: '' });
  const [feesForm, setFeesForm] = useState(() => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    const dateStr = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`;
    return { amount: '30.00', quantity: 1, startDate: dateStr, associateId: 'ALL' };
  });

  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  
  const [incomeFile, setIncomeFile] = useState<File | null>(null);
  const [expenseFile, setExpenseFile] = useState<File | null>(null);
  const [feeFile, setFeeFile] = useState<File | null>(null);
  const [regPaymentFile, setRegPaymentFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [comprovantesHistory, setComprovantesHistory] = useState<FinancialComprovante[]>([]);
  const [isLoadingComprovantes, setIsLoadingComprovantes] = useState(false);

  const fixedIncomeCategories = ['Doação', 'Patrocínio', 'Eventos', 'Venda de Ativos', 'Mensalidades', 'Outros'];
  const fixedExpenseCategories = ['Manutenção', 'Equipamento', 'Aluguel', 'Energia', 'Internet', 'Água', 'Reembolso', 'Outros'];

  // Derived dynamic lists for categories and custom entities
  const dynamicIncomeCategories = React.useMemo(() => {
    const fromTransactions = transactions
      .filter(t => t.type === 'INCOME' && t.category)
      .map(t => t.category);
    return Array.from(new Set([...fixedIncomeCategories, ...fromTransactions]))
        .filter(Boolean)
        .sort()
        .map(cat => ({ value: cat, label: cat, isFixed: fixedIncomeCategories.includes(cat) }));
  }, [transactions]);

  const dynamicExpenseCategories = React.useMemo(() => {
    const fromTransactions = transactions
      .filter(t => t.type === 'EXPENSE' && t.category)
      .map(t => t.category);
    return Array.from(new Set([...fixedExpenseCategories, ...fromTransactions]))
        .filter(Boolean)
        .sort()
        .map(cat => ({ value: cat, label: cat, isFixed: fixedExpenseCategories.includes(cat) }));
  }, [transactions]);

  const dynamicPayers = React.useMemo(() => {
    const fromTransactions = transactions
        .filter(t => t.type === 'INCOME' && t.custom_payer)
        .map(t => t.custom_payer!) || [];
    return Array.from(new Set(fromTransactions))
        .filter(Boolean)
        .sort()
        .map(p => ({ value: p, label: p, isFixed: false }));
  }, [transactions]);

  const dynamicRecipients = React.useMemo(() => {
    const fromTransactions = transactions
        .filter(t => t.type === 'EXPENSE' && t.custom_recipient)
        .map(t => t.custom_recipient!) || [];
    return Array.from(new Set(fromTransactions))
        .filter(Boolean)
        .sort()
        .map(r => ({ value: r, label: r, isFixed: false }));
  }, [transactions]);

  const handleDeleteCategoryFromList = async (category: string) => {
    if (!confirm(`Tem certeza que deseja remover a categoria "${category}"? Todos os lançamentos desta categoria serão alterados para "Geral".`)) return;
    try {
      await financialService.updateCategory(category, 'Geral');
      showToast(`Categoria "${category}" atualizada para "Geral".`);
      loadTransactions();
    } catch (err) {
      console.error(err);
      showToast('Erro ao remover categoria', 'info');
    }
  };

  const handleDeletePayerFromList = async (payer: string) => {
    if (!confirm(`Tem certeza que deseja remover o pagador "${payer}" da lista? Isso limpará o nome deste pagador de todos os lançamentos customizados.`)) return;
    try {
      await financialService.updatePayer(payer, '');
      showToast(`Pagador "${payer}" removido.`);
      loadTransactions();
    } catch (err) {
      console.error(err);
      showToast('Erro ao remover pagador', 'info');
    }
  };

  const handleDeleteRecipientFromList = async (recipient: string) => {
    if (!confirm(`Tem certeza que deseja remover o beneficiário "${recipient}" da lista? Isso limpará o nome deste beneficiário de todos os lançamentos customizados.`)) return;
    try {
      await financialService.updateRecipient(recipient, '');
      showToast(`Beneficiário "${recipient}" removido.`);
      loadTransactions();
    } catch (err) {
      console.error(err);
      showToast('Erro ao remover beneficiário', 'info');
    }
  };

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

  const [registrationForm, setRegistrationForm] = useState({
    fullName: '',
    targetAmount: '250.00',
    deadline: '2026-04-15'
  });

  const [registrationPaymentForm, setRegistrationPaymentForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    method: 'PIX',
    registrationId: ''
  });

  const [editingRegistrationId, setEditingRegistrationId] = useState<string | null>(null);

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
    // Unique list of overdue associate IDs
    const targetUserIds = Array.from(new Set(overdueFees.map(f => f.associateId))).filter(Boolean);

    if (targetUserIds.length > 0) {
      // Notify associates
      notificationService.add({
        title: 'Mensalidade em Atraso',
        message: 'Olá! Identificamos que você possui mensalidades pendentes no sistema. Por favor, regularize assim que possível.',
        type: 'FINANCIAL',
        targetUserIds
      });
    }

    // Also notify admins/current user as confirmation
    notificationService.add({
      title: 'Cobrança de Atrasados',
      message: `${overdueCount} associados foram notificados sobre pendências financeiras.`,
      type: 'FINANCIAL'
    });

    setIsOverduePreviewOpen(false);
    showToast(`Lembretes enviados para ${targetUserIds.length} associados com pendências.`, 'success');
  };

  const handleOpenModal = () => {
    setModalStep('MENU');
    setEditingTransactionId(null);
    resetForms();
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
    console.log('[Financeiro] Selecionando mensalidade para receber:', fee);
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
      setIsUploading(true);
      // Update the existing transaction status to COMPLETED
      const [py, pm, pd] = paymentForm.date.split('-');
      const dateDisplay = `${pd}/${pm}/${py}`;

      await financialService.update(selectedFee.id, {
        status: 'COMPLETED',
        description: `${selectedFee.monthRef} - ${selectedFee.associateName} (Pago em ${dateDisplay})`
      });

      if (feeFile) {
        const filePath = await financialService.uploadComprovante(feeFile);
        await financialService.attachComprovante(selectedFee.id, filePath);
      }

      showToast(`Pagamento de ${selectedFee.associateName} registrado!`);
      loadTransactions();
      setFeePaymentStep('LIST');
      setSelectedFee(null);
      setFeeFile(null);
    } catch (err: any) {
      console.error(err);
      showToast('Erro ao processar pagamento.', 'info');
    } finally {
      setIsUploading(false);
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
    if (feePaymentStep === 'PAYMENT') {
      return (
        <form onSubmit={processFeePayment} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-2 text-slate-600 mb-2 cursor-pointer hover:text-brand-600 transition-colors" onClick={() => setFeePaymentStep('LIST')}>
            <ChevronLeft size={20} /> <span className="text-sm font-medium">Voltar para lista</span>
          </div>

          <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-xl text-emerald-600 shadow-sm ring-1 ring-emerald-100">
                <DollarSign size={28} strokeWidth={2.5} />
              </div>
              <div className="text-left">
                <h3 className="font-black text-slate-900 leading-tight">{selectedFee?.associateName}</h3>
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-0.5">{selectedFee?.monthRef}</p>
              </div>
            </div>
            <div className="text-center sm:text-right border-t sm:border-t-0 sm:border-l border-emerald-100 pt-4 sm:pt-0 sm:pl-6 w-full sm:w-auto">
              <p className="text-[10px] text-emerald-600/60 font-black uppercase tracking-widest mb-1">Total a Receber</p>
              <p className="text-3xl font-black text-emerald-600 tracking-tighter">R$ {selectedFee?.amount.toFixed(2)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input
              label="Data do Recebimento"
              type="date"
              value={paymentForm.date}
              onChange={e => setPaymentForm({ ...paymentForm, date: e.target.value })}
              required
            />
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 px-0.5">Forma de Pagamento</label>
              <select
                className="w-full h-12 px-5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none appearance-none cursor-pointer"
                value={paymentForm.method}
                onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value })}
              >
                <option value="PIX">PIX</option>
                <option value="CASH">Dinheiro / Espécie</option>
                <option value="CARD">Cartão de Crédito/Débito</option>
                <option value="BANK">Transferência Bancária</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
            <Textarea
              label="Observação (Opcional)"
              value={paymentForm.observation}
              onChange={e => setPaymentForm({ ...paymentForm, observation: e.target.value })}
              placeholder="Alguma informação relevante?"
              className="min-h-[80px]"
            />

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-center h-full">
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Comprovante Digital (Opcional)</label>
              <input 
                type="file" 
                accept=".pdf, image/*" 
                onChange={e => setFeeFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 file:uppercase file:tracking-widest" 
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-base font-black uppercase tracking-wider shadow-lg shadow-emerald-600/20 mt-2 active:scale-[0.98] transition-all"
            disabled={isUploading}
          >
            {isUploading ? 'Processando...' : 'Confirmar Recebimento'}
          </Button>
        </form>
      );
    }

    if (feePaymentStep === 'EDIT') {
      return (
        <form onSubmit={processFeeEdit} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center gap-2 text-slate-600 mb-2 cursor-pointer hover:text-brand-600 transition-colors" onClick={() => setFeePaymentStep('LIST')}>
            <ChevronLeft size={20} /> <span className="text-sm font-medium">Voltar para lista</span>
          </div>

          <div className="flex items-center gap-3 mb-4">
             <div className="p-2.5 bg-brand-50 text-brand-600 rounded-xl">
               <Edit3 size={20} />
             </div>
             <h3 className="text-xl font-black text-slate-900 tracking-tight">Ajustar Lançamento</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input label="Valor da Parcela" type="number" step="0.01" value={editFeeForm.amount} onChange={e => setEditFeeForm({ ...editFeeForm, amount: e.target.value })} required />
            <Input label="Data de Vencimento" type="date" value={editFeeForm.dueDate} onChange={e => setEditFeeForm({ ...editFeeForm, dueDate: e.target.value })} required />
          </div>

          <Textarea label="Descrição / Justificativa" value={editFeeForm.description} onChange={e => setEditFeeForm({ ...editFeeForm, description: e.target.value })} placeholder="Ex: Ajuste de valor conforme assembleia..." className="min-h-[80px]" />

          <div className="flex gap-4 pt-4">
            <Button variant="ghost" type="button" onClick={() => setFeePaymentStep('LIST')} className="flex-1 font-bold">Cancelar</Button>
            <Button type="submit" className="flex-1 font-black uppercase tracking-wider h-12 shadow-md">Salvar Alterações</Button>
          </div>
        </form>
      );
    }

    return (
      <FeesManager
        fees={feesList}
        associates={realAssociates}
        filterAssociateId={filterAssociateId}
        setFilterAssociateId={setFilterAssociateId}
        isSelectionMode={isSelectionMode}
        setIsSelectionMode={setIsSelectionMode}
        selectedFeeIds={selectedFeeIds}
        toggleFeeSelection={toggleFeeSelection}
        selectAll={selectAllFilteredFees}
        deselectAll={deselectAllFees}
        onDeleteBulk={deleteSelectedFees}
        onEdit={handleEditFee}
        onPay={handleSelectFeeToPay}
        canEdit={canEdit}
        loading={isLoadingTransactions || isLoadingAssociates}
      />
    );
  };

  const [registrationStep, setRegistrationStep] = useState<'LIST' | 'FORM' | 'PAYMENT'>('LIST');

  const handleSaveRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRegistrationId) {
        await registrationsService.update(editingRegistrationId, {
          full_name: registrationForm.fullName,
          target_amount: parseFloat(registrationForm.targetAmount),
          deadline: registrationForm.deadline
        });
        showToast('Inscrição atualizada com sucesso!');
      } else {
        await registrationsService.create({
          full_name: registrationForm.fullName,
          target_amount: parseFloat(registrationForm.targetAmount),
          deadline: registrationForm.deadline
        });
        showToast('Inscrito cadastrado com sucesso!');
      }
      loadRegistrations();
      setRegistrationStep('LIST');
      setEditingRegistrationId(null);
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar inscrição', 'info');
    }
  };

  const handleSaveRegistrationPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsUploading(true);
      const reg = registrations.find(r => r.id === registrationPaymentForm.registrationId);
      if (!reg) return;

      // Try to find a profile with the same name to link this transaction
      const matchedAssoc = realAssociates.find(a => 
         a.name.toLowerCase().trim() === reg.full_name.toLowerCase().trim()
      );

      const txData: Omit<Transaction, 'id'> = {
        description: `Taxa de Inscrição - ${reg.full_name}`,
        amount: parseFloat(registrationPaymentForm.amount),
        type: 'INCOME',
        category: 'Taxa de Inscrição',
        status: 'COMPLETED',
        date: registrationPaymentForm.date,
        registration_id: reg.id,
        payer_id: matchedAssoc ? matchedAssoc.id : undefined,
        notes: `Pagamento via ${registrationPaymentForm.method}`
      };

      const result = await financialService.create(txData);

      if (regPaymentFile && result.id) {
        const filePath = await financialService.uploadComprovante(regPaymentFile);
        await financialService.attachComprovante(result.id, filePath);
      }

      showToast('Pagamento registrado com sucesso!');
      loadTransactions();
      loadRegistrations();
      setRegistrationStep('LIST');
      setRegPaymentFile(null);
    } catch (err) {
      console.error(err);
      showToast('Erro ao registrar pagamento', 'info');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteRegistration = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir a inscrição de ${name}?`)) return;
    try {
      await registrationsService.delete(id);
      showToast('Inscrição excluída com sucesso!');
      loadRegistrations();
    } catch (err) {
      console.error(err);
      showToast('Erro ao excluir inscrição', 'info');
    }
  };

  const [registrationFilter, setRegistrationFilter] = useState({ search: '', status: 'ALL' });

  const renderRegistrationManagerContent = () => {
    if (registrationStep === 'FORM') {
      return (
        <form onSubmit={handleSaveRegistration} className="space-y-4 animate-in fade-in slide-in-from-right-4">
          <div className="flex items-center gap-2 text-slate-600 mb-2 cursor-pointer hover:text-brand-600" onClick={() => { setRegistrationStep('LIST'); setEditingRegistrationId(null); }}>
            <ChevronLeft size={20} /> <span className="text-sm font-medium">Voltar para lista</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900">{editingRegistrationId ? 'Editar Inscrito' : 'Novo Inscrito'}</h3>
          <Input
            label="Nome Completo"
            placeholder="Digite o nome completo do interessado"
            value={registrationForm.fullName}
            onChange={e => setRegistrationForm({ ...registrationForm, fullName: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Valor da Taxa (R$)"
              type="number"
              step="0.01"
              value={registrationForm.targetAmount}
              onChange={e => setRegistrationForm({ ...registrationForm, targetAmount: e.target.value })}
              required
            />
            <Input
              label="Data Limite"
              type="date"
              value={registrationForm.deadline}
              onChange={e => setRegistrationForm({ ...registrationForm, deadline: e.target.value })}
              required
            />
          </div>
          <Button type="submit" className="w-full h-12 text-lg">
            {editingRegistrationId ? 'Salvar Alterações' : 'Cadastrar Inscrito'}
          </Button>
        </form>
      );
    }

    if (registrationStep === 'PAYMENT') {
      const reg = registrations.find(r => r.id === registrationPaymentForm.registrationId);
      return (
        <form onSubmit={handleSaveRegistrationPayment} className="space-y-4 animate-in fade-in slide-in-from-right-4">
          <div className="flex items-center gap-2 text-slate-600 mb-2 cursor-pointer hover:text-brand-600" onClick={() => setRegistrationStep('LIST')}>
            <ChevronLeft size={20} /> <span className="text-sm font-medium">Voltar para lista</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-2">
            <h4 className="font-bold text-slate-900">{reg?.full_name}</h4>
            <div className="text-sm text-slate-500">
              Total Pago: {formatCurrency(reg?.total_paid || 0)} / Meta: {formatCurrency(reg?.target_amount || 0)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Valor Pago (R$)"
              type="number"
              step="0.01"
              value={registrationPaymentForm.amount}
              onChange={e => setRegistrationPaymentForm({ ...registrationPaymentForm, amount: e.target.value })}
              required
            />
            <Input
              label="Data do Pagamento"
              type="date"
              value={registrationPaymentForm.date}
              onChange={e => setRegistrationPaymentForm({ ...registrationPaymentForm, date: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 px-0.5">Forma de Pagamento</label>
              <select
                className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm focus:border-brand-500"
                value={registrationPaymentForm.method}
                onChange={e => setRegistrationPaymentForm({ ...registrationPaymentForm, method: e.target.value })}
              >
                <option value="PIX">Pix</option>
                <option value="CASH">Dinheiro / Espécie</option>
                <option value="CARD">Cartão de Crédito/Débito</option>
                <option value="BANK">Transferência Bancária</option>
              </select>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-center h-full">
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Comprovante Digital (Opcional)</label>
              <input 
                type="file" 
                accept=".pdf, image/*" 
                onChange={e => setRegPaymentFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 file:uppercase file:tracking-widest" 
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-12 bg-emerald-600 hover:bg-emerald-700" disabled={isUploading}>
            {isUploading ? 'Processando...' : 'Confirmar Pagamento'}
          </Button>
        </form>
      );
    }

    return (
      <RegistrationBoard
        registrations={registrations}
        onAdd={() => { setRegistrationForm({ fullName: '', targetAmount: '250.00', deadline: '2026-04-15' }); setRegistrationStep('FORM'); }}
        onEdit={(reg) => { setEditingRegistrationId(reg.id); setRegistrationForm({ fullName: reg.full_name, targetAmount: reg.target_amount.toString(), deadline: reg.deadline }); setRegistrationStep('FORM'); }}
        onDelete={handleDeleteRegistration}
        onPay={(reg) => { setRegistrationPaymentForm({ ...registrationPaymentForm, registrationId: reg.id, amount: (reg.target_amount - reg.total_paid).toString(), date: new Date().toISOString().split('T')[0], method: 'PIX' }); setRegistrationStep('PAYMENT'); }}
        loading={isLoadingRegistrations}
      />
    );
  };


  // --- End Fee Management Logic ---

  const canModifyTransaction = (tx: Transaction) => {
    if (user.role === UserRole.ADMIN) return true;
    const dateStr = tx.createdAt || tx.date;
    const createdTime = new Date(dateStr).getTime();
    if (isNaN(createdTime)) return false; // Fail safe
    
    const now = Date.now();
    const diffHours = (now - createdTime) / (1000 * 60 * 60);
    return diffHours <= 24;
  };

  const handleSaveIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (incomeFile && incomeFile.size > 5 * 1024 * 1024) {
      showToast('O comprovante não pode ter mais que 5MB.', 'info');
      return;
    }
    
    setIsUploading(true);

    try {
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
        custom_payer: incomeForm.isCustomPayer ? incomeForm.customPayer : undefined,
        notes: incomeForm.description
      };

      let txId = editingTransactionId;
      if (txId) {
        const txToEdit = transactions.find(t => t.id === txId);
        if (txToEdit && !canModifyTransaction(txToEdit)) {
          showToast('Apenas administradores podem editar após 24 horas.', 'info');
          setIsUploading(false);
          return;
        }
        await financialService.update(txId, txData);
        showToast('Movimentação atualizada com sucesso!');
      } else {
        const result = await financialService.create(txData);
        txId = result.id;
        showToast('Entrada registrada com sucesso!');
      }
      
      if (incomeFile && txId) {
        const filePath = await financialService.uploadComprovante(incomeFile);
        await financialService.attachComprovante(txId, filePath);
      }

      loadTransactions(); // Reload to get fresh data
    } catch (err: any) {
      console.error(err);
      showToast(`Erro ao salvar registro: ${err.message || 'Erro desconhecido'}`, 'info');
    } finally {
      setIsUploading(false);
      setIsModalOpen(false);
      resetForms();
    }
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    if (expenseFile && expenseFile.size > 5 * 1024 * 1024) {
      showToast('O comprovante não pode ter mais que 5MB.', 'info');
      return;
    }

    setIsUploading(true);

    try {
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
        custom_recipient: expenseForm.isCustomRecipient ? expenseForm.customRecipient : undefined,
        notes: expenseForm.description
      };

      let txId = editingTransactionId;
      if (txId) {
        const txToEdit = transactions.find(t => t.id === txId);
        if (txToEdit && !canModifyTransaction(txToEdit)) {
          showToast('Apenas administradores podem editar após 24 horas.', 'info');
          setIsUploading(false);
          return;
        }
        await financialService.update(txId, txData);
        showToast('Movimentação atualizada com sucesso!');
      } else {
        const result = await financialService.create(txData);
        txId = result.id;
        showToast('Saída registrada com sucesso!');
      }
      
      if (expenseFile && txId) {
        const filePath = await financialService.uploadComprovante(expenseFile);
        await financialService.attachComprovante(txId, filePath);
      }

      loadTransactions();
    } catch (err: any) {
      console.error(err);
      showToast(`Erro ao salvar registro: ${err.message || 'Erro desconhecido'}`, 'info');
    } finally {
      setIsUploading(false);
      setIsModalOpen(false);
      resetForms();
    }
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransactionId(tx.id);
    setModalStep(tx.type === 'INCOME' ? 'INCOME' : 'EXPENSE');
    
    // Check if category/entity is custom or in defaults
    const isCustomIncomeCategory = tx.type === 'INCOME' && tx.category && !['Doação', 'Patrocínio', 'Eventos', 'Venda de Ativos', 'Mensalidades', 'Outros'].includes(tx.category);
    const isCustomExpenseCategory = tx.type === 'EXPENSE' && tx.category && !['Manutenção', 'Equipamento', 'Aluguel', 'Energia', 'Internet', 'Água', 'Reembolso', 'Outros'].includes(tx.category);

    if (tx.type === 'INCOME') {
      setIncomeForm({
        title: tx.description,
        amount: tx.amount.toString(),
        date: tx.date || '',
        category: isCustomIncomeCategory ? '' : (tx.category || ''),
        payerId: tx.payer_id || '',
        description: tx.notes || '',
        isCustomCategory: isCustomIncomeCategory,
        isCustomPayer: !!tx.custom_payer,
        customCategory: isCustomIncomeCategory ? (tx.category || '') : '',
        customPayer: tx.custom_payer || ''
      });
    } else {
      setExpenseForm({
        title: tx.description,
        amount: tx.amount.toString(),
        date: tx.date || '',
        category: isCustomExpenseCategory ? '' : (tx.category || ''),
        recipientId: tx.recipient_id || '',
        description: tx.notes || '',
        isCustomCategory: isCustomExpenseCategory,
        isCustomRecipient: !!tx.custom_recipient,
        customCategory: isCustomExpenseCategory ? (tx.category || '') : '',
        customRecipient: tx.custom_recipient || ''
      });
    }
    
    // Load comprovantes history for the modal if editing
    setIsLoadingComprovantes(true);
    financialService.getComprovantes(tx.id)
      .then(history => setComprovantesHistory(history))
      .catch(err => console.error(err))
      .finally(() => setIsLoadingComprovantes(false));
      
    setIsModalOpen(true);
  };

  const handleViewComprovantes = async (tx: Transaction) => {
    setEditingTransactionId(tx.id);
    setModalStep('DETAILS');
    
    // Load comprovantes history for the modal
    setIsLoadingComprovantes(true);
    financialService.getComprovantes(tx.id)
      .then(history => setComprovantesHistory(history))
      .catch(err => console.error(err))
      .finally(() => setIsLoadingComprovantes(false));
      
    setIsModalOpen(true);
  };

  const handleDeleteTransaction = async (tx?: Transaction) => {
    const targetId = tx?.id || editingTransactionId;
    if (!targetId) return;

    const txToEdit = tx || transactions.find(t => t.id === targetId);
    if (txToEdit && !canModifyTransaction(txToEdit)) {
      showToast('Apenas administradores podem excluir após 24 horas.', 'info');
      return;
    }

    if (!confirm('Tem certeza que deseja excluir esta movimentação?')) return;
    try {
      await financialService.delete(targetId);
      showToast('Movimentação excluída com sucesso!');
      loadTransactions();
      setIsModalOpen(false);
      resetForms();
    } catch (err) {
      console.error(err);
      showToast('Erro ao excluir transação', 'info');
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
    setIncomeForm({ title: '', amount: '', date: '', category: '', payerId: '', description: '', isCustomCategory: false, isCustomPayer: false, customCategory: '', customPayer: '' });
    setExpenseForm({ title: '', amount: '', date: '', category: '', recipientId: '', description: '', isCustomCategory: false, isCustomRecipient: false, customCategory: '', customRecipient: '' });
    setIncomeFile(null);
    setExpenseFile(null);
    setFeeFile(null);
    setRegPaymentFile(null);
    setComprovantesHistory([]);

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
          <form onSubmit={handleSaveIncome} className="space-y-5">
            <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3">{editingTransactionId ? 'Editar Entrada' : 'Nova Entrada'}</h3>

            <Input label="Título da Entrada" placeholder="Ex: Doação Municipal" value={incomeForm.title} onChange={e => setIncomeForm({ ...incomeForm, title: e.target.value })} required />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input label="Valor (R$)" type="number" step="0.01" value={incomeForm.amount} onChange={e => setIncomeForm({ ...incomeForm, amount: e.target.value })} required />
              <Input label="Data" type="date" value={incomeForm.date} onChange={e => setIncomeForm({ ...incomeForm, date: e.target.value })} required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <SearchableSelect
                label="Categoria"
                value={incomeForm.isCustomCategory ? incomeForm.customCategory : incomeForm.category}
                options={dynamicIncomeCategories}
                onChange={(val) => {
                  const isExisting = fixedIncomeCategories.includes(val) || dynamicIncomeCategories.some(c => c.value === val);
                  setIncomeForm({ ...incomeForm, category: isExisting ? val : '', isCustomCategory: !isExisting, customCategory: isExisting ? '' : val });
                }}
                onDelete={handleDeleteCategoryFromList}
                allowCustom
                placeholder="Selecione..."
              />

              <SearchableSelect
                label="Pagador"
                value={incomeForm.isCustomPayer ? incomeForm.customPayer : incomeForm.payerId}
                options={[
                  ...realAssociates.map(a => ({ value: a.id, label: a.name, isFixed: true })),
                  ...dynamicPayers
                ]}
                onChange={(val) => {
                  const assoc = realAssociates.find(a => a.id === val);
                  if (assoc) {
                    setIncomeForm({ ...incomeForm, payerId: val, isCustomPayer: false, customPayer: '' });
                  } else {
                    setIncomeForm({ ...incomeForm, payerId: '', isCustomPayer: true, customPayer: val });
                  }
                }}
                onDelete={handleDeletePayerFromList}
                allowCustom
                placeholder="Selecione..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
              <Textarea label="Descrição / Observação" value={incomeForm.description} onChange={e => setIncomeForm({ ...incomeForm, description: e.target.value })} className="min-h-[80px]" />

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-center h-full">
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Comprovante Digital (Opcional)</label>
                <input 
                  type="file" 
                  accept=".pdf, image/*" 
                  onChange={e => setIncomeFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 file:uppercase file:tracking-widest" 
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-100">
              <Button type="submit" className="flex-1 h-12 text-base shadow-lg shadow-green-600/10 bg-green-600 hover:bg-green-700" disabled={isUploading}>
                {isUploading ? 'Salvando...' : editingTransactionId ? 'Salvar Alterações' : 'Confirmar Lançamento'}
              </Button>
              {editingTransactionId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDeleteTransaction()}
                  className="h-12 w-12 border-red-200 text-red-600 hover:bg-red-50"
                  title="Excluir"
                >
                  <Trash2 size={20} />
                </Button>
              )}
            </div>
          </form>
        );

      case 'EXPENSE':
        return (
          <form onSubmit={handleSaveExpense} className="space-y-5">
            <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3">{editingTransactionId ? 'Editar Saída' : 'Nova Saída'}</h3>

            <Input label="Título da Saída" placeholder="Ex: Compra de Material" value={expenseForm.title} onChange={e => setExpenseForm({ ...expenseForm, title: e.target.value })} required />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input label="Valor (R$)" type="number" step="0.01" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} required />
              <Input label="Data" type="date" value={expenseForm.date} onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })} required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <SearchableSelect
                label="Categoria"
                value={expenseForm.isCustomCategory ? expenseForm.customCategory : expenseForm.category}
                options={dynamicExpenseCategories}
                onChange={(val) => {
                  const isExisting = fixedExpenseCategories.includes(val) || dynamicExpenseCategories.some(c => c.value === val);
                  setExpenseForm({ ...expenseForm, category: isExisting ? val : '', isCustomCategory: !isExisting, customCategory: isExisting ? '' : val });
                }}
                onDelete={handleDeleteCategoryFromList}
                allowCustom
                placeholder="Selecione..."
              />

              <SearchableSelect
                label="Beneficiário"
                value={expenseForm.isCustomRecipient ? expenseForm.customRecipient : expenseForm.recipientId}
                options={[
                  ...realAssociates.map(a => ({ value: a.id, label: a.name, isFixed: true })),
                  ...dynamicRecipients
                ]}
                onChange={(val) => {
                  const assoc = realAssociates.find(a => a.id === val);
                  if (assoc) {
                    setExpenseForm({ ...expenseForm, recipientId: val, isCustomRecipient: false, customRecipient: '' });
                  } else {
                    setExpenseForm({ ...expenseForm, recipientId: '', isCustomRecipient: true, customRecipient: val });
                  }
                }}
                onDelete={handleDeleteRecipientFromList}
                allowCustom
                placeholder="Selecione..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
              <Textarea label="Descrição / Observação" value={expenseForm.description} onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })} className="min-h-[80px]" />

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-center h-full">
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Comprovante Digital (Opcional)</label>
                <input 
                  type="file" 
                  accept=".pdf, image/*" 
                  onChange={e => setExpenseFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 file:uppercase file:tracking-widest" 
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-100">
              <Button type="submit" className="flex-1 h-12 text-base shadow-lg shadow-red-600/10 bg-red-600 hover:bg-red-700" disabled={isUploading}>
                {isUploading ? 'Salvando...' : editingTransactionId ? 'Salvar Alterações' : 'Confirmar Lançamento'}
              </Button>
              {editingTransactionId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDeleteTransaction()}
                  className="h-12 w-12 border-red-200 text-red-600 hover:bg-red-50"
                  title="Excluir"
                >
                  <Trash2 size={20} />
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

      case 'DETAILS':
        const tx = transactions.find(t => t.id === editingTransactionId);
        if (!tx) return <div className="p-10 text-center font-bold text-slate-400 uppercase tracking-widest text-xs">Movimentação não encontrada</div>;

        return (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center gap-2 text-slate-400 hover:text-slate-600 mb-2 cursor-pointer transition-colors group w-fit" onClick={() => setModalStep('MENU')}>
              <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" /> 
              <span className="text-sm font-black uppercase tracking-widest text-[10px]">Voltar ao Menu</span>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 shadow-sm overflow-hidden relative">
              <div className={`absolute top-0 right-0 w-32 h-32 opacity-10 blur-3xl rounded-full -mr-16 -mt-16 ${tx.type === 'INCOME' ? 'bg-emerald-500' : 'bg-rose-500'}`} />

              <div className="flex justify-between items-start mb-6 relative text-left">
                <div className="flex-1 pr-4">
                  <h3 className="text-xl font-bold text-slate-900 leading-tight">{tx.description}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={tx.type === 'INCOME' ? 'success' : 'danger'} className="font-bold py-0.5 px-2 text-[10px] uppercase">
                      {tx.type === 'INCOME' ? 'Entrada' : 'Saída'}
                    </Badge>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Calendar size={12} /> {new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-2xl font-black block tracking-tighter ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {tx.type === 'INCOME' ? '+' : '-'} {formatCurrency(tx.amount)}
                  </span>
                  <div className="flex items-center gap-1 justify-end mt-1 text-[10px] font-black uppercase tracking-widest">
                     {tx.status === 'COMPLETED' ? (
                       <span className="flex items-center gap-1 text-emerald-600">
                         <CheckCircle2 size={12} /> Confirmado
                       </span>
                     ) : (
                       <span className="flex items-center gap-1 text-amber-600">
                         <AlertTriangle size={12} /> Pendente
                       </span>
                     )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-200/60 text-left relative">
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Categoria</span>
                  <div className="flex items-center gap-2 font-bold text-slate-700 text-sm">
                    <div className={`w-2 h-2 rounded-full ${tx.type === 'INCOME' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    {tx.category || 'Geral'}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                    {tx.type === 'INCOME' ? 'Pagador' : 'Beneficiário'}
                  </span>
                  <div className="flex items-center gap-2 font-bold text-slate-700 text-sm truncate">
                    <Users size={14} className="text-slate-400 flex-shrink-0" />
                    <span className="truncate">{
                      tx.type === 'INCOME' 
                        ? (realAssociates.find(a => a.id === tx.payer_id)?.name || 'Externo / Outros')
                        : (realAssociates.find(a => a.id === tx.recipient_id)?.name || 'Externo / Outros')
                    }</span>
                  </div>
                </div>
              </div>

              {tx.notes && (
                <div className="mt-4 p-3 bg-white/50 rounded-xl border border-slate-100 text-left relative">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Observações</span>
                   <p className="text-xs text-slate-600 font-medium leading-relaxed">{tx.notes}</p>
                </div>
              )}
            </div>

            <div className="space-y-3 text-left">
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <FileText size={14} className="text-brand-600" /> Documentos Anexados
                </h4>
                <div className="h-px flex-1 bg-slate-100 ml-4" />
              </div>
              
              {isLoadingComprovantes ? (
                <div className="flex items-center justify-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <div className="flex items-center gap-2">
                    <RotateCcw size={16} className="animate-spin text-brand-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Carregando cofre...</span>
                  </div>
                </div>
              ) : comprovantesHistory.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {comprovantesHistory.map((comp) => (
                    <button 
                      key={comp.id}
                      type="button"
                      onClick={async () => {
                        try {
                          const url = await financialService.getSignedUrl(comp.file_path);
                          window.open(url, '_blank');
                        } catch (e) {
                          showToast('Erro ao abrir comprovante', 'info');
                        }
                      }}
                      className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-brand-500 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center group-hover:bg-brand-500 group-hover:text-white transition-colors">
                          <Download size={20} />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">Ver Documento</p>
                          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Anexado em {new Date(comp.created_at).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-slate-300 group-hover:text-brand-600 transition-all" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Info size={32} className="text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-500">Nenhum anexo encontrado</p>
                  <p className="text-[10px] text-slate-400 uppercase font-black mt-1">Anexe ao editar esta transação</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <Button 
                variant="outline" 
                className="flex-1 rounded-xl h-12 font-black uppercase text-[11px] tracking-widest text-slate-700 border-slate-200 hover:bg-slate-50"
                onClick={() => {
                   setModalStep(tx.type === 'INCOME' ? 'INCOME' : 'EXPENSE');
                   handleEditTransaction(tx);
                }}
              >
                <Edit3 size={18} className="mr-2" /> Editar Dados
              </Button>
              <Button 
                className="bg-slate-900 hover:bg-black text-white px-8 rounded-xl h-12 font-black uppercase text-[11px] tracking-widest"
                onClick={() => {
                   setIsModalOpen(false);
                   resetForms();
                }}
              >
                Fechar
              </Button>
            </div>
          </div>
        );
    }
  };


  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Financeiro</h2>
          <p className="text-slate-500 text-sm">Gestão financeira, mensalidades e fluxo de caixa.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {canEdit && (
            <Button variant="outline" onClick={() => setIsRegistrationManagerOpen(true)} className="flex items-center gap-2">
              <Users size={18} /> Inscrições
            </Button>
          )}
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

      <FinanceStats
        totalBalance={totalBalance}
        monthlyIncome={totalIncome}
        monthlyExpense={totalExpense}
        overdueCount={overdueCount}
        loading={isLoadingTransactions}
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
        onEdit={handleEditTransaction}
        onDelete={handleDeleteTransaction}
        onViewComprovantes={handleViewComprovantes}
        onExport={handleExportPDF}
        loading={isLoadingTransactions}
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Movimentação" maxWidth="3xl">
        {renderModalContent()}
      </Modal>

      <Modal isOpen={isFeesManagerOpen} onClose={() => setIsFeesManagerOpen(false)} title="Gestão de Mensalidades" maxWidth="4xl">
        {renderFeesManagerContent()}
      </Modal>

      <Modal isOpen={isRegistrationManagerOpen} onClose={() => { setIsRegistrationManagerOpen(false); setEditingRegistrationId(null); setRegistrationStep('LIST'); }} title="Controle de Inscrições" maxWidth="5xl">
        {renderRegistrationManagerContent()}
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