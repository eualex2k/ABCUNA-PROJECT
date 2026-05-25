import React from 'react';
import { Card } from '../ui';
import { ArrowUpCircle, ArrowDownCircle, TrendingUp, AlertTriangle } from 'lucide-react';

interface FinanceStatsProps {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  incomeTrend: number;
  expenseTrend: number;
  overdueCount: number;
  loading: boolean;
}

export const FinanceStats: React.FC<FinanceStatsProps> = ({
  totalBalance,
  monthlyIncome,
  monthlyExpense,
  incomeTrend,
  expenseTrend,
  overdueCount,
  loading
}) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatTrend = (trend: number) => {
    if (trend === 0) return '0%';
    const sign = trend > 0 ? '+' : '';
    return `${sign}${trend.toFixed(1)}%`;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-emerald-600';
    if (trend < 0) return 'text-rose-600';
    return 'text-slate-600';
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <ArrowUpCircle className="text-emerald-600" size={16} />;
    if (trend < 0) return <ArrowDownCircle className="text-rose-600" size={16} />;
    return <TrendingUp className="text-slate-600" size={16} />;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-slate-200 rounded w-1/2"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-slate-700">Saldo Total</span>
          <TrendingUp size={16} className="text-slate-400" />
        </div>
        <div className={`text-2xl font-black ${totalBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'} tracking-tight`}>
          {formatCurrency(totalBalance)}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-slate-700">Receitas Mês</span>
          <div className="flex items-center gap-1">
            {getTrendIcon(incomeTrend)}
            <span className={`text-xs font-bold ${getTrendColor(incomeTrend)}`}>
              {formatTrend(incomeTrend)}
            </span>
          </div>
        </div>
        <div className="text-2xl font-black text-emerald-600 tracking-tight">
          {formatCurrency(monthlyIncome)}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-slate-700">Despesas Mês</span>
          <div className="flex items-center gap-1">
            {getTrendIcon(expenseTrend)}
            <span className={`text-xs font-bold ${getTrendColor(expenseTrend)}`}>
              {formatTrend(expenseTrend)}
            </span>
          </div>
        </div>
        <div className="text-2xl font-black text-rose-600 tracking-tight">
          {formatCurrency(monthlyExpense)}
        </div>
      </Card>

      <Card className="p-6 border-l-4 border-l-amber-500">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-slate-700">Inadimplência</span>
          <AlertTriangle className="text-amber-600" size={16} />
        </div>
        <div className="text-2xl font-black text-amber-600 tracking-tight">
          {overdueCount} pendentes
        </div>
      </Card>
    </div>
  );
};