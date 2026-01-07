import React from 'react';
import {
  Users,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  BookOpen,
  Package,
  RefreshCcw,
  Wallet,
  Shield,
  BarChart2 as BarChartIcon
} from 'lucide-react';
import { StatCard, Card, Badge, Button, Avatar } from '../components/ui';
import { User, UserRole } from '../types';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { associatesService } from '../services/associates';
import { financialService } from '../services/financial';
import { inventoryService } from '../services/inventory';
import { Transaction, Associate as AssociateType, InventoryItem } from '../types';

interface DashboardProps {
  user: User;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const navigate = useNavigate();
  const isAdminOrFin = [UserRole.ADMIN, UserRole.FINANCIAL].includes(user.role);

  const [associates, setAssociates] = React.useState<AssociateType[]>([]);
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [inventory, setInventory] = React.useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadData() {
      try {
        const [assocData, transData, invData] = await Promise.all([
          associatesService.getAll(),
          financialService.getAll(),
          inventoryService.getAll()
        ]);
        setAssociates(assocData);
        setTransactions(transData);
        setInventory(invData);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const names = user.name.split(' ');
  const displayName = names.length > 1 ? `${names[0]} ${names[1]}` : names[0];

  // --- Calculations ---
  const completedTx = transactions.filter(t => t.status === 'COMPLETED');
  const totalBalance = completedTx.reduce((acc, t) => t.type === 'INCOME' ? acc + t.amount : acc - t.amount, 0);

  const activeAssociates = associates.filter(a => a.status === 'ACTIVE');
  const lateAssociates = associates.filter(a => a.paymentStatus === 'LATE');
  const delinquencyRate = activeAssociates.length > 0
    ? Math.round((lateAssociates.length / activeAssociates.length) * 100)
    : 0;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const criticalItemsCount = inventory.filter(i => i.condition === 'CRITICAL').length;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Chart Data: Last 6 months
  const monthlyData = React.useMemo(() => {
    const data = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthLabel = d.toLocaleDateString('pt-BR', { month: 'short' });

      const monthTx = completedTx.filter(t => {
        const txDate = new Date(t.date);
        return txDate.getMonth() === d.getMonth() && txDate.getFullYear() === d.getFullYear();
      });

      data.push({
        name: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
        receita: monthTx.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0),
        despesa: monthTx.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)
      });
    }
    return data;
  }, [completedTx]);

  const recentTransactions = completedTx.slice(0, 5);

  const shortcuts = [
    { title: 'Associados', desc: 'Gestão de membros', icon: Users, path: '/associates', color: 'text-blue-600', bg: 'bg-blue-50', hover: 'group-hover:bg-blue-100' },
    { title: 'Financeiro', desc: 'Fluxo de caixa', icon: DollarSign, path: '/financial', color: 'text-emerald-600', bg: 'bg-emerald-50', hover: 'group-hover:bg-emerald-100' },
    { title: 'Estoque', desc: 'Equipamentos', icon: Package, path: '/inventory', color: 'text-orange-600', bg: 'bg-orange-50', hover: 'group-hover:bg-orange-100' },
    { title: 'Escala', desc: 'Plantões', icon: RefreshCcw, path: '/events/schedule', color: 'text-purple-600', bg: 'bg-purple-50', hover: 'group-hover:bg-purple-100' },
    { title: 'Eventos', desc: 'Agenda e reuniões', icon: Calendar, path: '/events', color: 'text-red-600', bg: 'bg-red-50', hover: 'group-hover:bg-red-100' },
    { title: 'Sala de Aula', desc: 'Cursos e materiais', icon: BookOpen, path: '/classroom', color: 'text-indigo-600', bg: 'bg-indigo-50', hover: 'group-hover:bg-indigo-100' },
  ];

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400 gap-4">
        <RefreshCcw className="animate-spin" size={40} />
        <p className="font-medium">Carregando dados operacionais...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{getGreeting()}, {displayName}</h2>
          <p className="text-slate-500 text-sm">Bem-vindo ao sistema de gestão integrada.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate('/events')}>Agenda</Button>
          {isAdminOrFin && (
            <Button onClick={() => navigate('/financial')}>Novo Lançamento</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Saldo Total"
          value={formatCurrency(totalBalance)}
          icon={<Wallet size={24} />}
        />
        <StatCard
          title="Membros Ativos"
          value={activeAssociates.length.toString()}
          icon={<Users size={24} />}
        />
        <StatCard
          title="Inadimplência"
          value={`${delinquencyRate}%`}
          icon={<AlertTriangle size={24} />}
          trend={`${lateAssociates.length} pendentes`}
        />
        <StatCard
          title="Equipamentos Críticos"
          value={criticalItemsCount.toString()}
          icon={<Package size={24} />}
          trend={criticalItemsCount > 0 ? `${criticalItemsCount} itens sem estoque` : 'Estoque regular'}
          trendUp={false}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {shortcuts.map((item, index) => {
          const Icon = item.icon;
          return (
            <Card
              key={index}
              className="p-4 hover:border-brand-500 cursor-pointer group transition-colors"
              onClick={() => navigate(item.path)}
            >
              <div className={`w-12 h-12 rounded-lg ${item.bg} ${item.color} flex items-center justify-center mb-3`}>
                <Icon size={24} />
              </div>
              <h4 className="font-semibold text-slate-900 text-sm">{item.title}</h4>
              <p className="text-xs text-slate-500 mt-1 line-clamp-1">{item.desc}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <BarChartIcon size={20} className="text-slate-400" />
              Resumo Financeiro
            </h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="receita" name="Receita" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="despesa" name="Despesa" fill="#334155" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-0">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-sm">Resumo Financeiro</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/financial')} className="text-xs">Ver Tudo</Button>
          </div>
          <div className="divide-y divide-slate-100">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => (
                <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded ${tx.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                      {tx.type === 'INCOME' ? <ArrowUpRight size={16} /> : <AlertTriangle size={16} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 line-clamp-1">{tx.description}</p>
                      <p className="text-xs text-slate-500">{new Date(tx.date).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {tx.type === 'EXPENSE' ? '- ' : ''}{formatCurrency(tx.amount)}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                Nenhuma transação recente
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};