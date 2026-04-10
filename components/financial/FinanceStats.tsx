import React from 'react';
import { Wallet, ArrowUpCircle, ArrowDownCircle, TrendingUp } from 'lucide-react';
import { StatCard } from '../ui';

interface FinanceStatsProps {
    totalBalance: number;
    monthlyIncome: number;
    monthlyExpense: number;
    incomeTrend?: number;
    expenseTrend?: number;
    overdueCount: number;
    loading?: boolean;
}

export const FinanceStats: React.FC<FinanceStatsProps> = ({
    totalBalance,
    monthlyIncome,
    monthlyExpense,
    incomeTrend = 0,
    expenseTrend = 0,
    overdueCount,
    loading = false
}) => {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    const formatTrend = (val: number) => {
        const prefix = val >= 0 ? '+' : '';
        return `${prefix}${val.toFixed(0)}%`;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
                title="Saldo Geral"
                value={formatCurrency(totalBalance)}
                icon={<Wallet size={24} />}
                loading={loading}
            />
            <StatCard
                title="Entradas (Mês)"
                value={formatCurrency(monthlyIncome)}
                icon={<ArrowUpCircle size={24} className="text-emerald-500" />}
                trend={formatTrend(incomeTrend)}
                trendUp={incomeTrend >= 0}
                loading={loading}
            />
            <StatCard
                title="Saídas (Mês)"
                value={formatCurrency(monthlyExpense)}
                icon={<ArrowDownCircle size={24} className="text-red-500" />}
                trend={formatTrend(expenseTrend)}
                trendUp={expenseTrend <= 0} // Saída menor é trend up
                loading={loading}
            />
            <StatCard
                title="Mensalidades em Atraso"
                value={overdueCount.toString()}
                icon={<TrendingUp size={24} className="text-amber-500" />}
                trend={overdueCount > 0 ? `${overdueCount} pendentes` : 'Tudo em dia'}
                trendUp={overdueCount === 0}
                loading={loading}
            />
        </div>
    );
};
