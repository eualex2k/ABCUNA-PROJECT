import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  PieChart,
  Download,
  Users,
  ChevronLeft,
  Calendar,
  Wallet,
  BellRing,
  CheckCircle2,
  AlertTriangle,
  X,
  CreditCard,
  Filter,
  Send,
  Edit3,
  Plus,
  RotateCcw,
  ArrowUpRight,
  Shield,
  Trash2,
  Clock,
  FileText,
  ChevronRight,
  Info,
  TrendingUp,
} from 'lucide-react';
import {
  Card,
  Button,
  Badge,
  Modal,
  Input,
  Avatar,
  Textarea,
  StatCard,
} from '../components/ui';
import {
  Transaction,
  Associate,
  User,
  UserRole,
  FinancialComprovante,
  Registration,
} from '../types';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { notificationService } from '../services/notifications';
import { registrationsService } from '../services/registrations';

// Importações dos novos componentes modulares
import { FinanceStats } from '../components/financial/FinanceStats';
import { RegistrationBoard } from '../components/financial/RegistrationBoard';
import { TransactionTable } from '../components/financial/TransactionTable';
import { FeesManager } from '../components/financial/FeesManager';
import { SearchableSelect } from '../components/financial/SearchableSelect';
import { useFinancialData } from '../components/financial/hooks/useFinancialData';
import {
  useFeesData,
  FeeRecord,
} from '../components/financial/hooks/useFeesData';

interface FinancialPageProps {
  user: User;
}

export const FinancialPage: React.FC<FinancialPageProps> = ({ user }) => {
  // Usar hooks para gerenciar dados complexos
  const {
    transactions,
    associates,
    loading,
    error,
    refreshData,
    canEdit,
    canExport,
  } = useFinancialData({ user });

  const { feesList, overdueFees, overdueCount, refreshFees } = useFeesData({
    transactions,
    associates,
  });

  // Estados gerenciados localmente
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFeesManagerOpen, setIsFeesManagerOpen] = useState(false);
  const [isRegistrationManagerOpen, setIsRegistrationManagerOpen] =
    useState(false);
  const [isOverduePreviewOpen, setIsOverduePreviewOpen] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: 'success' | 'info' | 'error';
  }>({
    visible: false,
    message: '',
    type: 'info',
  });

  // Lógica simplificada de cálculos
  const completedTransactions = transactions
    .filter((t) => t.status === 'COMPLETED')
    .sort((a, b) => {
      if (b.date !== a.date) {
        return b.date.localeCompare(a.date);
      }
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });

  const totalBalance = completedTransactions.reduce(
    (acc, tx) => (tx.type === 'INCOME' ? acc + tx.amount : acc - tx.amount),
    0
  );

  // Cálculos de dados para gráficos
  const {
    currentMonthIncome,
    lastMonthIncome,
    currentMonthExpense,
    lastMonthExpense,
  } = React.useMemo(() => {
    const now = new Date();
    const curM = now.getMonth();
    const curY = now.getFullYear();
    const lastM = curM === 0 ? 11 : curM - 1;
    const lastY = curM === 0 ? curY - 1 : curY;

    const stats = {
      currentMonthIncome: 0,
      lastMonthIncome: 0,
      currentMonthExpense: 0,
      lastMonthExpense: 0,
    };

    completedTransactions.forEach((t) => {
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

  const incomeTrend =
    lastMonthIncome === 0
      ? currentMonthIncome > 0
        ? 100
        : 0
      : ((currentMonthIncome - lastMonthIncome) / lastMonthIncome) * 100;
  const expenseTrend =
    lastMonthExpense === 0
      ? currentMonthExpense > 0
        ? 100
        : 0
      : ((currentMonthExpense - lastMonthExpense) / lastMonthExpense) * 100;

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

      const dayTransactions = completedTransactions.filter(
        (t) => t.date === dateStr
      );
      const entry = dayTransactions
        .filter((t) => t.type === 'INCOME')
        .reduce((s, t) => s + t.amount, 0);
      const exit = dayTransactions
        .filter((t) => t.type === 'EXPENSE')
        .reduce((s, t) => s + t.amount, 0);

      data.push({
        name: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        entrada: entry,
        saida: exit,
      });
    }
    return data;
  }, [completedTransactions]);

  const categoryStats = React.useMemo(() => {
    const expenses = completedTransactions.filter((t) => t.type === 'EXPENSE');
    const total = expenses.reduce((s, t) => s + t.amount, 0);
    if (total === 0) return [];

    const grouped = expenses.reduce((acc: any, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

    const colors = [
      'bg-blue-500',
      'bg-red-500',
      'bg-amber-500',
      'bg-emerald-500',
      'bg-purple-500',
      'bg-indigo-500',
      'bg-teal-500',
    ];

    return Object.entries(grouped)
      .map(([label, val]: [string, any], i) => ({
        label,
        val: val as number,
        percentage: (((val as number) / total) * 100).toFixed(0) + '%',
        color: colors[i % colors.length],
      }))
      .sort((a, b) => b.val - a.val);
  }, [completedTransactions]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  // Funções simplificadas (manter apenas as essenciais para o componente principal)
  const handleExportPDF = () => {
    alert('Função de exportação PDF será implementada');
  };

  const showToast = (
    message: string,
    type: 'success' | 'info' | 'error' = 'success'
  ) => {
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
      const timer = setTimeout(
        () => setToast({ ...toast, visible: false }),
        4000
      );
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Financeiro</h2>
          <p className="text-slate-500 text-sm">
            Gestão financeira, mensalidades e fluxo de caixa.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {canEdit && (
            <Button
              variant="outline"
              onClick={() => setIsRegistrationManagerOpen(true)}
              className="flex items-center gap-2"
            >
              <Users size={18} /> Inscrições
            </Button>
          )}
          {canEdit && (
            <Button
              variant="outline"
              onClick={() => setIsFeesManagerOpen(true)}
              className="flex items-center gap-2"
            >
              <CreditCard size={18} /> Mensalidades
            </Button>
          )}
          {canEdit && (
            <Button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus size={18} /> Novo Lançamento
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">
            Erro ao carregar dados: {error}
          </p>
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
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="entrada"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorEntrada)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="saida"
                  stroke="#ef4444"
                  fillOpacity={0}
                  strokeWidth={2}
                />
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
            <p className="text-sm text-slate-500 mb-4">
              Existem {overdueCount} mensalidades em atraso que precisam de
              atenção.
            </p>
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleNotifyOverdueClick}
                className="w-full"
              >
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
                    <span className="font-medium text-slate-900">
                      {cat.percentage}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div
                      className={`${cat.color} h-full rounded-full`}
                      style={{ width: cat.percentage }}
                    ></div>
                  </div>
                </div>
              ))}
              {categoryStats.length === 0 && (
                <p className="text-center py-4 text-xs text-slate-400">
                  Nenhum dado de despesa
                </p>
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
          if (
            tx &&
            confirm(`Tem certeza que deseja excluir "${tx.description}"?`)
          ) {
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

      {/* Modals (simplified for now) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nova Movimentação"
        maxWidth="5xl"
      >
        <div className="p-6 text-center">
          <p className="text-slate-600 mb-4">
            Formulário de movimentação será implementado
          </p>
          <Button onClick={() => setIsModalOpen(false)}>Fechar</Button>
        </div>
      </Modal>

      <Modal
        isOpen={isFeesManagerOpen}
        onClose={() => setIsFeesManagerOpen(false)}
        title="Gestão de Mensalidades"
        maxWidth="4xl"
      >
        <div className="p-6 text-center">
          <p className="text-slate-600 mb-4">
            Gestão de mensalidades será implementada
          </p>
          <Button onClick={() => setIsFeesManagerOpen(false)}>Fechar</Button>
        </div>
      </Modal>

      <Modal
        isOpen={isRegistrationManagerOpen}
        onClose={() => {
          setIsRegistrationManagerOpen(false);
        }}
        title="Controle de Inscrições"
        maxWidth="5xl"
      >
        <RegistrationBoard
          registrations={[]}
          onAdd={() => console.log('Adicionar inscrição')}
          onEdit={(reg) => console.log('Editar inscrição:', reg)}
          onDelete={(id, name) => {
            if (
              confirm(`Tem certeza que deseja excluir a inscrição de ${name}?`)
            ) {
              console.log('Excluir inscrição:', id);
            }
          }}
          onPay={(reg) => console.log('Pagar inscrição:', reg)}
          loading={false}
        />
      </Modal>

      <Modal
        isOpen={isOverduePreviewOpen}
        onClose={() => setIsOverduePreviewOpen(false)}
        title="Notificar Inadimplentes"
        maxWidth="3xl"
      >
        <div className="space-y-4">
          <div className="bg-amber-50 p-4 rounded-lg flex items-start gap-3">
            <AlertTriangle className="text-amber-600 mt-0.5" size={20} />
            <p className="text-sm text-amber-800">
              Confirme a lista de associados que receberão uma notificação de
              atraso.
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
                {overdueFees.map((fee) => (
                  <tr key={fee.id}>
                    <td className="px-4 py-2">{fee.associateName}</td>
                    <td className="px-4 py-2">{fee.monthRef}</td>
                    <td className="px-4 py-2 text-right">
                      R$ {fee.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="ghost"
              onClick={() => setIsOverduePreviewOpen(false)}
            >
              Cancelar
            </Button>
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
          <div
            className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 ${
              toast.type === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-white'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertTriangle size={18} />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => setToast({ ...toast, visible: false })}
              className="hover:opacity-75"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
