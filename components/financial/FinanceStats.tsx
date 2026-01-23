import React from 'react';
import { Wallet, ArrowUpCircle, ArrowDownCircle, TrendingUp } from 'lucide-react';
import { StatCard } from '../ui';

interface FinanceStatsProps {
    totalBalance: number;
    monthlyIncome: number;
    monthlyExpense: number;
    overdueCount: number;
    loading?: boolean;
}

export const FinanceStats: React.FC<FinanceStatsProps> = ({
    totalBalance,
    monthlyIncome,
    monthlyExpense,
    overdueCount,
    loading = false
}) => {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
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
                trend="+12%" // Exemplo, pode ser calculado depois
                trendUp={true}
                loading={loading}
            />
            <StatCard
                title="Saídas (Mês)"
                value={formatCurrency(monthlyExpense)}
                icon={<ArrowDownCircle size={24} className="text-red-500" />}
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
